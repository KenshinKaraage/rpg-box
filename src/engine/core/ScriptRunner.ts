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

/**
 * Context object containing all API objects injected into script execution.
 */
export interface ScriptContext {
  scriptAPI: unknown;
  data: unknown;
  variable: unknown;
  sound: unknown;
  camera: unknown;
  save: unknown;
}

/** Parameter names injected into every script function. */
const INJECTED_PARAM_NAMES = [
  'scriptAPI',
  'Data',
  'Variable',
  'Sound',
  'Camera',
  'Save',
  'Script',
] as const;

export class ScriptRunner {
  private scripts: Script[];
  private scriptNamespace: Record<string, (...args: unknown[]) => Promise<unknown>> | null = null;

  constructor(scripts: Script[]) {
    this.scripts = scripts;
  }

  /**
   * Execute a script with the given context.
   * Internal scripts (children) are resolved recursively and injected as
   * callable async functions by their `name` field.
   * Script args are injected as named variables.
   */
  async execute(
    script: Script,
    context: ScriptContext,
    argValues?: Record<string, unknown>
  ): Promise<unknown> {
    const internalFns = this.resolveInternalScripts(script.id, context);
    const ns = this.getScriptNamespace(context);
    return this.compileAndRun(script.content, context, ns, internalFns, script.args, argValues);
  }

  /**
   * Build or return cached Script namespace object.
   * Maps callId -> callable async function for all scripts with callId set.
   */
  private getScriptNamespace(
    context: ScriptContext
  ): Record<string, (...args: unknown[]) => Promise<unknown>> {
    if (this.scriptNamespace) return this.scriptNamespace;

    const ns: Record<string, (...args: unknown[]) => Promise<unknown>> = {};
    for (const s of this.scripts) {
      if (s.callId && s.type !== 'internal') {
        ns[s.callId] = async (callArgs?: unknown): Promise<unknown> => {
          const argsObj = (callArgs as Record<string, unknown>) ?? {};
          return this.execute(s, context, argsObj);
        };
      }
    }

    this.scriptNamespace = ns;
    return ns;
  }

  /**
   * Find all internal scripts whose parentId matches the given scriptId,
   * compile each into a callable async function, and recurse for nested children.
   */
  private resolveInternalScripts(
    parentId: string,
    context: ScriptContext
  ): Record<string, (...args: unknown[]) => Promise<unknown>> {
    const children = this.scripts.filter((s) => s.type === 'internal' && s.parentId === parentId);
    const fns: Record<string, (...args: unknown[]) => Promise<unknown>> = {};

    for (const child of children) {
      // Recurse: resolve grandchildren of this child
      const childInternalFns = this.resolveInternalScripts(child.id, context);
      const ns = this.getScriptNamespace(context);

      fns[child.name] = async (...args: unknown[]): Promise<unknown> => {
        return this.compileAndRun(child.content, context, ns, { ...childInternalFns }, [], args);
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
  private async compileAndRun(
    content: string,
    context: ScriptContext,
    scriptNamespace: Record<string, (...args: unknown[]) => Promise<unknown>>,
    internalFns: Record<string, (...args: unknown[]) => Promise<unknown>>,
    scriptArgs?: ScriptArg[],
    argValues?: Record<string, unknown> | unknown[]
  ): Promise<unknown> {
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
      ...internalNames.map((name) => internalFns[name]),
      ...argParamValues,
      argsArray,
    ];

    // Wrap content in async IIFE for top-level await support
    const wrappedBody = `return (async () => { ${content} })();`;

    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const fn = new Function(...paramNames, wrappedBody);
    return fn(...paramValues);
  }
}
