/**
 * GameEngine - Main engine class with postMessage protocol
 *
 * Receives EditorMessage events, initializes GameContext and ScriptRunner,
 * executes scripts, and sends results back via EngineMessage.
 */

import type { EditorMessage, EngineMessage, FullModeConfig, ScriptModeConfig } from '../types';
import { GameContext } from '../runtime/GameContext';
import { validateScriptReturn } from '../validateReturn';

import { ScriptRunner } from './ScriptRunner';

export type MessageSender = (message: EngineMessage) => void;

export class GameEngine {
  private sendMessage: MessageSender;

  constructor(sendMessage: MessageSender) {
    this.sendMessage = sendMessage;
    this.sendMessage({ type: 'ready' });
  }

  async handleMessage(message: EditorMessage): Promise<void> {
    switch (message.type) {
      case 'start':
        await this.handleStart(message.config);
        break;
      case 'stop':
      case 'pause':
      case 'resume':
        break;
    }
  }

  private async handleStart(config: ScriptModeConfig | FullModeConfig): Promise<void> {
    if (config.mode === 'script') {
      await this.executeScript(config);
    }
  }

  private async executeScript(config: ScriptModeConfig): Promise<void> {
    const { projectData, scriptId, args, testSettings } = config;

    const script = projectData.scripts.find((s) => s.id === scriptId);
    if (!script) {
      this.sendMessage({
        type: 'script-error',
        error: `Script "${scriptId}" not found`,
        errorType: 'runtime',
      });
      return;
    }

    const context = new GameContext(projectData, {
      variables: testSettings?.variables,
    });
    const runner = new ScriptRunner(projectData.scripts);

    // Capture console output and forward as log messages
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    const send = this.sendMessage;

    console.log = (...a: unknown[]) =>
      send({ type: 'log', level: 'info', message: a.map(String).join(' ') });
    console.warn = (...a: unknown[]) =>
      send({ type: 'log', level: 'warn', message: a.map(String).join(' ') });
    console.error = (...a: unknown[]) =>
      send({ type: 'log', level: 'error', message: a.map(String).join(' ') });

    try {
      const result = await runner.execute(script, context, args);
      this.sendMessage({ type: 'script-result', value: result });

      // Validate return value against declared types
      if (script.returns.length > 0) {
        const errors = validateScriptReturn(result, script.returns);
        for (const err of errors) {
          this.sendMessage({ type: 'script-error', error: err, errorType: 'return-type' });
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.sendMessage({ type: 'script-error', error: msg, errorType: 'runtime', stack });
    } finally {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    }

    this.sendMessage({ type: 'state-update', variables: context.variable.getAll() });
  }
}
