/**
 * ScriptRunner - Core script execution engine
 *
 * Executes user-written JavaScript scripts by wrapping them in async IIFEs
 * and injecting API objects (scriptAPI, Data, Variable, Sound, Camera, Save).
 *
 * Features:
 * - Internal (child) scripts are injected as callable named functions
 * - Script namespace: Script.callId() で他のスクリプトを呼び出し可能
 * - Script args are injected as named variables (arg.id が変数名)
 */

import type { Script, ScriptArg } from '@/types/script';

import type { GameContext } from '../runtime/GameContext';

/** Parameter names injected into every script function. */
const INJECTED_PARAM_NAMES = [
  'scriptAPI',
  'Data',
  'Variable',
  'Sound',
  'Camera',
  'Save',
  'Script',
  'UI',
] as const;

export class ScriptRunner {
  private scripts: Script[];
  private scriptNamespace: Record<string, (...args: unknown[]) => unknown> | null = null;

  constructor(scripts: Script[]) {
    this.scripts = scripts;
  }

  /**
   * Execute a script with the given context.
   * Internal scripts (children) are resolved recursively and injected as
   * callable functions by their `name` field.
   * Script args are injected as named variables.
   *
   * isAsync scripts return Promise<unknown>, sync scripts return unknown directly.
   */
  execute(script: Script, context: GameContext, argValues?: Record<string, unknown>): unknown {
    const internalFns = this.resolveInternalScripts(script.id, context);
    const ns = this.getScriptNamespace(context);
    return this.compileAndRun(
      script.content,
      context,
      ns,
      internalFns,
      script.isAsync,
      script.args,
      argValues
    );
  }

  /**
   * Execute a script by its ID. Looks up the script in the registered list
   * and delegates to execute().
   */
  executeById(
    scriptId: string,
    context: GameContext,
    argValues?: Record<string, unknown>
  ): unknown {
    const script = this.scripts.find((s) => s.id === scriptId);
    if (!script) throw new Error(`Script "${scriptId}" not found`);
    return this.execute(script, context, argValues);
  }

  /**
   * Build or return cached Script namespace object.
   * Maps callId -> callable function for all scripts with callId set.
   * isAsync scripts return Promise, sync scripts return value directly.
   */
  private getScriptNamespace(
    context: GameContext
  ): Record<string, (...args: unknown[]) => unknown> {
    if (this.scriptNamespace) return this.scriptNamespace;

    const ns: Record<string, (...args: unknown[]) => unknown> = {};
    for (const s of this.scripts) {
      if (s.callId && s.type !== 'internal') {
        ns[s.callId] = (...callArgs: unknown[]): unknown => {
          const argsObj = this.resolveCallArgs(s, callArgs);
          return this.execute(s, context, argsObj);
        };
      }
    }

    this.scriptNamespace = ns;
    return ns;
  }

  /**
   * 呼び出し引数を位置引数 or オブジェクト引数から Record<string, unknown> に変換
   */
  private resolveCallArgs(script: Script, callArgs: unknown[]): Record<string, unknown> {
    if (
      callArgs.length === 1 &&
      callArgs[0] !== null &&
      typeof callArgs[0] === 'object' &&
      !Array.isArray(callArgs[0]) &&
      script.args.length > 1
    ) {
      return callArgs[0] as Record<string, unknown>;
    }
    const argsObj: Record<string, unknown> = {};
    for (let i = 0; i < script.args.length; i++) {
      if (i < callArgs.length) {
        argsObj[script.args[i]!.id] = callArgs[i];
      }
    }
    return argsObj;
  }

  /**
   * Find all internal scripts whose parentId matches the given scriptId,
   * compile each into a callable async function, and recurse for nested children.
   */
  private resolveInternalScripts(
    parentId: string,
    context: GameContext
  ): Record<string, (...args: unknown[]) => unknown> {
    const children = this.scripts.filter((s) => s.type === 'internal' && s.parentId === parentId);
    const fns: Record<string, (...args: unknown[]) => unknown> = {};

    for (const child of children) {
      // Recurse: resolve grandchildren of this child
      const childInternalFns = this.resolveInternalScripts(child.id, context);
      const ns = this.getScriptNamespace(context);

      fns[child.name] = async (...args: unknown[]): Promise<unknown> => {
        return this.compileAndRun(
          child.content,
          context,
          ns,
          { ...childInternalFns },
          child.isAsync,
          [],
          args
        );
      };
    }

    return fns;
  }

  /**
   * Compile script content into an async IIFE and execute it.
   *
   * Parameters injected:
   * 1. API objects: scriptAPI, Data, Variable, Sound, Camera, Save, Script
   * 2. Internal script functions by name
   * 3. Script args as named variables (from ScriptArg.id)
   * 4. 'args' array for internal scripts (positional arguments)
   */
  private compileAndRun(
    content: string,
    context: GameContext,
    scriptNamespace: Record<string, (...args: unknown[]) => unknown>,
    internalFns: Record<string, (...args: unknown[]) => unknown>,
    isAsync: boolean,
    scriptArgs?: ScriptArg[],
    argValues?: Record<string, unknown> | unknown[]
  ): unknown {
    const internalNames = Object.keys(internalFns);

    // Script arg names (from ScriptArg.id)
    const argParamNames = scriptArgs?.map((a) => a.id) ?? [];

    // Build parameter names: APIs + Script namespace + internal fns + script args + args array
    const paramNames = [...INJECTED_PARAM_NAMES, ...internalNames, ...argParamNames, 'args'];

    // Resolve arg values
    let argParamValues: unknown[];
    let argsArray: unknown[];

    if (Array.isArray(argValues)) {
      // Internal script call: argValues is positional array
      argParamValues = [];
      argsArray = argValues;
    } else {
      // Normal script call: argValues is Record<string, unknown>
      argParamValues = argParamNames.map((name) => argValues?.[name]);
      argsArray = [];
    }

    // Build parameter values in matching order
    const paramValues = [
      context.scriptAPI,
      context.data,
      context.variable,
      context.sound,
      context.camera,
      context.save,
      scriptNamespace,
      context.ui,
      ...internalNames.map((name) => internalFns[name]),
      ...argParamValues,
      argsArray,
    ];

    // isAsync: async IIFE（await 使用可能）、それ以外: 同期 IIFE
    const wrappedBody = isAsync
      ? `return (async () => { ${content} })();`
      : `return (() => { ${content} })();`;

    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const fn = new Function(...paramNames, wrappedBody);
    return fn(...paramValues);
  }
}
