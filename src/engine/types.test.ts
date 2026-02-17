import type {
  ScriptModeConfig,
  FullModeConfig,
  EditorMessage,
  EngineMessage,
  ObjectPlacement,
  TestPattern,
} from './types';

describe('Engine types', () => {
  it('ScriptModeConfig has required fields', () => {
    const config: ScriptModeConfig = {
      mode: 'script',
      projectData: {
        scripts: [],
        variables: [],
        classes: [],
        dataTypes: [],
        dataEntries: {},
      },
      scriptId: 'script-1',
      args: { damage: 10 },
    };
    expect(config.mode).toBe('script');
    expect(config.scriptId).toBe('script-1');
  });

  it('FullModeConfig has required fields', () => {
    const config: FullModeConfig = {
      mode: 'full',
      projectData: {
        scripts: [],
        variables: [],
        classes: [],
        dataTypes: [],
        dataEntries: {},
      },
      startSettings: {
        mapId: 'map-1',
        position: { x: 0, y: 0 },
      },
    };
    expect(config.mode).toBe('full');
    expect(config.startSettings.mapId).toBe('map-1');
  });

  it('EditorMessage discriminated union works', () => {
    const msg: EditorMessage = {
      type: 'start',
      config: {
        mode: 'script',
        projectData: { scripts: [], variables: [], classes: [], dataTypes: [], dataEntries: {} },
        scriptId: 'test',
        args: {},
      },
    };
    expect(msg.type).toBe('start');
  });

  it('EngineMessage discriminated union works', () => {
    const ready: EngineMessage = { type: 'ready' };
    const log: EngineMessage = { type: 'log', level: 'info', message: 'hello' };
    const result: EngineMessage = { type: 'script-result', value: 42 };
    const error: EngineMessage = { type: 'script-error', error: 'fail', errorType: 'runtime' };
    expect(ready.type).toBe('ready');
    expect(log.type).toBe('log');
    expect(result.type).toBe('script-result');
    expect(error.type).toBe('script-error');
  });

  it('TestPattern stores config', () => {
    const pattern: TestPattern = {
      id: 'pat-1',
      name: 'Basic test',
      type: 'script',
      config: {
        mode: 'script',
        projectData: { scripts: [], variables: [], classes: [], dataTypes: [], dataEntries: {} },
        scriptId: 'script-1',
        args: {},
      },
    };
    expect(pattern.type).toBe('script');
  });

  it('ObjectPlacement has position and prefabId', () => {
    const placement: ObjectPlacement = {
      prefabId: 'player',
      x: 5,
      y: 10,
    };
    expect(placement.prefabId).toBe('player');
  });
});
