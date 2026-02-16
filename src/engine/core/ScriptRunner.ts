/**
 * ScriptRunner - Core script execution engine
 *
 * Executes user-written JavaScript scripts by wrapping them in async IIFEs
 * and injecting API objects (scriptAPI, Data, Variable, Sound, Camera, Save).
 * Internal (child) scripts are resolved recursively and injected as callable
 * named functions so parent scripts can call them directly.
 */

import type { Script } from '@/types/script';

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
const INJECTED_PARAM_NAMES = ['scriptAPI', 'Data', 'Variable', 'Sound', 'Camera', 'Save'] as const;

export class ScriptRunner {
  private scripts: Script[];

  constructor(scripts: Script[]) {
    this.scripts = scripts;
  }

  /**
   * Execute a script with the given context.
   * Internal scripts (children) are resolved recursively and injected as
   * callable async functions by their `name` field.
   */
  async execute(script: Script, context: ScriptContext): Promise<unknown> {
    const internalFns = this.resolveInternalScripts(script.id, context);
    return this.compileAndRun(script.content, context, internalFns);
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

      fns[child.name] = async (...args: unknown[]): Promise<unknown> => {
        return this.compileAndRun(child.content, context, { ...childInternalFns }, args);
      };
    }

    return fns;
  }

  /**
   * Compile script content into an async IIFE and execute it.
   *
   * The generated function signature includes all injected API parameters
   * plus any internal script function names, plus an optional `args` array
   * for internal scripts.
   */
  private async compileAndRun(
    content: string,
    context: ScriptContext,
    internalFns: Record<string, (...args: unknown[]) => Promise<unknown>>,
    args?: unknown[]
  ): Promise<unknown> {
    const internalNames = Object.keys(internalFns);

    // Build parameter names: APIs + internal function names + args
    const paramNames = [...INJECTED_PARAM_NAMES, ...internalNames, 'args'];

    // Build parameter values in matching order
    const paramValues = [
      context.scriptAPI,
      context.data,
      context.variable,
      context.sound,
      context.camera,
      context.save,
      ...internalNames.map((name) => internalFns[name]),
      args ?? [],
    ];

    // Wrap content in async IIFE for top-level await support
    const wrappedBody = `return (async () => { ${content} })();`;

    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const fn = new Function(...paramNames, wrappedBody);
    return fn(...paramValues);
  }
}
