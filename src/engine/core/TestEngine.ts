/**
 * TestEngine - Main engine class with postMessage protocol
 *
 * Receives EditorMessage events, initializes GameContext and ScriptRunner,
 * executes scripts, and sends results back via EngineMessage.
 */

import type {
  EditorMessage,
  EngineMessage,
  EventModeConfig,
  FullModeConfig,
  ScriptModeConfig,
} from '../types';
import { getAction } from '../actions/index';
import { EventRunner } from '../event/EventRunner';
import { GameContext } from '../runtime/GameContext';
import { validateScriptReturn } from '../validateReturn';

import { ScriptRunner } from './ScriptRunner';

export type MessageSender = (message: EngineMessage) => void;

export class TestEngine {
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

  private async handleStart(
    config: ScriptModeConfig | FullModeConfig | EventModeConfig
  ): Promise<void> {
    if (config.mode === 'script') {
      await this.executeScript(config);
    } else if (config.mode === 'event') {
      await this.executeEvent(config);
    } else if (config.mode === 'full') {
      // Full mode is handled externally by GameEngine (requires a canvas).
      // TestEngine sends a log message indicating this.
      this.sendMessage({
        type: 'log',
        level: 'info',
        message: 'Full mode should be started via GameEngine directly.',
      });
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

    const runner = new ScriptRunner(projectData.scripts);
    const context = new GameContext(projectData, runner, {
      variables: testSettings?.variables,
    });

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
        const errors = validateScriptReturn(result, script.returns, projectData.classes);
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

  private async executeEvent(config: EventModeConfig): Promise<void> {
    try {
      // 1. Deserialize actions
      const actions = config.actions.map((a) => {
        const ActionClass = getAction(a.type);
        if (!ActionClass) throw new Error(`Unknown action type: ${a.type}`);
        const action = new ActionClass();
        action.fromJSON(a.data);
        return action;
      });

      // 2. Build context
      const runner = new ScriptRunner(config.projectData.scripts);
      const context = new GameContext(config.projectData, runner, {
        variables: config.testSettings?.variables,
      });

      // 3. Run via EventRunner
      const eventRunner = new EventRunner();
      await eventRunner.run(actions, context);

      // 4. Return results
      this.sendMessage({ type: 'state-update', variables: context.variable.getAll() });
      this.sendMessage({ type: 'event-complete' });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.sendMessage({ type: 'event-error', error: msg, stack });
    }
  }
}
