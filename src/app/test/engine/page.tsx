'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { GameEngine } from '@/engine/core/GameEngine';
import type { EngineMessage, EngineProjectData, SerializedAction } from '@/engine/types';
import '@/engine/actions/register';
import '@/engine/values/register';

// =============================================================================
// Types
// =============================================================================

interface LogEntry {
  id: number;
  timestamp: number;
  type: 'info' | 'warn' | 'error' | 'result' | 'state' | 'event' | 'action';
  message: string;
  data?: unknown;
}

interface Scenario {
  id: string;
  name: string;
  description: string;
  run: (addLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void) => Promise<void>;
}

// =============================================================================
// Sample Project Data
// =============================================================================

const sampleProjectData: EngineProjectData = {
  scripts: [
    {
      id: 'script_hello',
      name: 'Hello World',
      type: 'event',
      content: `
console.log("Hello from script!");
const hp = scriptAPI.getVar("player_hp");
console.log("Player HP:", hp);
scriptAPI.setVar("player_hp", hp + 10);
console.log("HP healed! New HP:", scriptAPI.getVar("player_hp"));
return { healed: true, newHp: scriptAPI.getVar("player_hp") };
`,
      args: [],
      returns: [],
      fields: [],
      isAsync: false,
    },
    {
      id: 'script_battle',
      name: 'Battle Simulation',
      type: 'event',
      content: `
const playerAtk = scriptAPI.getVar("player_atk");
const enemyHp = scriptAPI.getVar("enemy_hp");
const damage = playerAtk * 2;
console.log("Player attacks! ATK:", playerAtk, "-> Damage:", damage);
const remaining = Math.max(0, enemyHp - damage);
scriptAPI.setVar("enemy_hp", remaining);
console.log("Enemy HP:", enemyHp, "->", remaining);
if (remaining <= 0) {
  console.log("Enemy defeated!");
  scriptAPI.setVar("battle_won", true);
}
return { damage, remaining, defeated: remaining <= 0 };
`,
      args: [],
      returns: [],
      fields: [],
      isAsync: false,
    },
  ],
  variables: [
    { id: 'v1', name: 'player_hp', type: 'number', defaultValue: 100 },
    { id: 'v2', name: 'player_atk', type: 'number', defaultValue: 25 },
    { id: 'v3', name: 'enemy_hp', type: 'number', defaultValue: 80 },
    { id: 'v4', name: 'battle_won', type: 'boolean', defaultValue: false },
    { id: 'v5', name: 'gold', type: 'number', defaultValue: 0 },
    { id: 'v6', name: 'counter', type: 'number', defaultValue: 0 },
  ],
  classes: [],
  dataTypes: [
    { id: 'item', name: 'アイテム' },
  ],
  dataEntries: {
    item: [
      { id: 'potion', typeId: 'item', values: { name: 'ポーション', price: 50 } },
      { id: 'ether', typeId: 'item', values: { name: 'エーテル', price: 100 } },
    ],
  },
};

// =============================================================================
// Scenario Definitions
// =============================================================================

function createScenarios(): Scenario[] {
  return [
    // ── Script Execution ──
    {
      id: 'script-hello',
      name: '1. スクリプト実行 (Hello)',
      description: 'スクリプトを実行し、変数の読み書きとconsole.logの転送を確認',
      run: async (addLog) => {
        const messages: EngineMessage[] = [];
        const engine = new GameEngine((msg) => {
          messages.push(msg);
          logEngineMessage(msg, addLog);
        });

        addLog({ type: 'action', message: '▶ スクリプト "Hello World" を実行...' });

        await engine.handleMessage({
          type: 'start',
          config: {
            mode: 'script',
            projectData: sampleProjectData,
            scriptId: 'script_hello',
            args: {},
          },
        });
      },
    },

    // ── Battle Script ──
    {
      id: 'script-battle',
      name: '2. スクリプト実行 (戦闘)',
      description: '変数を使った戦闘計算スクリプト',
      run: async (addLog) => {
        const engine = new GameEngine((msg) => logEngineMessage(msg, addLog));

        addLog({ type: 'action', message: '▶ スクリプト "Battle Simulation" を実行...' });

        await engine.handleMessage({
          type: 'start',
          config: {
            mode: 'script',
            projectData: sampleProjectData,
            scriptId: 'script_battle',
            args: {},
          },
        });
      },
    },

    // ── Event: Variable Operations ──
    {
      id: 'event-variables',
      name: '3. イベント: 変数操作',
      description: 'VariableOpAction で変数を加算・乗算',
      run: async (addLog) => {
        const actions: SerializedAction[] = [
          {
            type: 'variableOp',
            data: { variableId: 'gold', operation: 'set', value: { type: 'literal', value: 100 } },
          },
          {
            type: 'variableOp',
            data: { variableId: 'gold', operation: 'add', value: { type: 'literal', value: 50 } },
          },
          {
            type: 'variableOp',
            data: {
              variableId: 'gold',
              operation: 'multiply',
              value: { type: 'literal', value: 2 },
            },
          },
        ];

        const engine = new GameEngine((msg) => logEngineMessage(msg, addLog));

        addLog({ type: 'action', message: '▶ イベント実行: gold = 100 → +50 → ×2 = 300' });

        await engine.handleMessage({
          type: 'start',
          config: {
            mode: 'event',
            projectData: sampleProjectData,
            actions,
          },
        });
      },
    },

    // ── Event: Conditional ──
    {
      id: 'event-conditional',
      name: '4. イベント: 条件分岐',
      description: 'player_hp > 50 なら回復、そうでなければ警告',
      run: async (addLog) => {
        const actions: SerializedAction[] = [
          {
            type: 'conditional',
            data: {
              condition: {
                left: { type: 'variable', variableId: 'player_hp' },
                operator: '>',
                right: { type: 'literal', value: 50 },
              },
              thenActions: [
                {
                  type: 'variableOp',
                  data: {
                    variableId: 'player_hp',
                    operation: 'add',
                    value: { type: 'literal', value: 20 },
                  },
                },
              ],
              elseActions: [
                {
                  type: 'variableOp',
                  data: {
                    variableId: 'player_hp',
                    operation: 'set',
                    value: { type: 'literal', value: 999 },
                  },
                },
              ],
            },
          },
        ];

        const engine = new GameEngine((msg) => logEngineMessage(msg, addLog));

        addLog({
          type: 'action',
          message:
            '▶ 条件分岐: player_hp(100) > 50 ? → HP+20 : HP=999',
        });

        await engine.handleMessage({
          type: 'start',
          config: {
            mode: 'event',
            projectData: sampleProjectData,
            actions,
          },
        });
      },
    },

    // ── Event: Loop ──
    {
      id: 'event-loop',
      name: '5. イベント: ループ',
      description: 'counter を 5回ループで +10 ずつ加算',
      run: async (addLog) => {
        const actions: SerializedAction[] = [
          {
            type: 'variableOp',
            data: {
              variableId: 'counter',
              operation: 'set',
              value: { type: 'literal', value: 0 },
            },
          },
          {
            type: 'loop',
            data: {
              count: 5,
              actions: [
                {
                  type: 'variableOp',
                  data: {
                    variableId: 'counter',
                    operation: 'add',
                    value: { type: 'literal', value: 10 },
                  },
                },
              ],
            },
          },
        ];

        const engine = new GameEngine((msg) => logEngineMessage(msg, addLog));

        addLog({
          type: 'action',
          message: '▶ ループ: counter = 0, 5回 counter += 10 → 期待値: 50',
        });

        await engine.handleMessage({
          type: 'start',
          config: {
            mode: 'event',
            projectData: sampleProjectData,
            actions,
          },
        });
      },
    },

    // ── Event: Combined (conditional + loop + script) ──
    {
      id: 'event-combined',
      name: '6. 複合イベント',
      description: '変数操作→条件分岐→ループ→スクリプト呼び出しの組み合わせ',
      run: async (addLog) => {
        const actions: SerializedAction[] = [
          // gold を 500 に設定
          {
            type: 'variableOp',
            data: {
              variableId: 'gold',
              operation: 'set',
              value: { type: 'literal', value: 500 },
            },
          },
          // gold > 100 なら 3回ループで counter +1
          {
            type: 'conditional',
            data: {
              condition: {
                left: { type: 'variable', variableId: 'gold' },
                operator: '>',
                right: { type: 'literal', value: 100 },
              },
              thenActions: [
                {
                  type: 'loop',
                  data: {
                    count: 3,
                    actions: [
                      {
                        type: 'variableOp',
                        data: {
                          variableId: 'counter',
                          operation: 'add',
                          value: { type: 'literal', value: 1 },
                        },
                      },
                    ],
                  },
                },
              ],
              elseActions: [],
            },
          },
          // スクリプトで battle 実行
          {
            type: 'script',
            data: { scriptId: 'script_battle', args: {} },
          },
        ];

        const engine = new GameEngine((msg) => logEngineMessage(msg, addLog));

        addLog({
          type: 'action',
          message: '▶ 複合: gold=500 → if(gold>100) loop×3 counter++ → battle script',
        });

        await engine.handleMessage({
          type: 'start',
          config: {
            mode: 'event',
            projectData: sampleProjectData,
            actions,
          },
        });
      },
    },

    // ── Error handling ──
    {
      id: 'script-error',
      name: '7. エラーハンドリング',
      description: '存在しないスクリプトの実行、ランタイムエラーの確認',
      run: async (addLog) => {
        const engine = new GameEngine((msg) => logEngineMessage(msg, addLog));

        addLog({ type: 'action', message: '▶ 存在しないスクリプトを実行...' });
        await engine.handleMessage({
          type: 'start',
          config: {
            mode: 'script',
            projectData: sampleProjectData,
            scriptId: 'nonexistent',
            args: {},
          },
        });

        addLog({ type: 'action', message: '▶ ランタイムエラーを含むスクリプトを実行...' });
        const errorProject: EngineProjectData = {
          ...sampleProjectData,
          scripts: [
            ...sampleProjectData.scripts,
            {
              id: 'script_error',
              name: 'Error Script',
              type: 'event',
              content: 'const x = null; x.foo();',
              args: [],
              returns: [],
              fields: [],
              isAsync: false,
            },
          ],
        };
        const engine2 = new GameEngine((msg) => logEngineMessage(msg, addLog));
        await engine2.handleMessage({
          type: 'start',
          config: {
            mode: 'script',
            projectData: errorProject,
            scriptId: 'script_error',
            args: {},
          },
        });
      },
    },

    // ── Data access ──
    {
      id: 'script-data',
      name: '8. データアクセス',
      description: 'スクリプトからデータエントリを参照',
      run: async (addLog) => {
        const dataProject: EngineProjectData = {
          ...sampleProjectData,
          scripts: [
            ...sampleProjectData.scripts,
            {
              id: 'script_data',
              name: 'Data Access',
              type: 'event',
              content: `
const items = Data["item"];
console.log("アイテム数:", items.length);
for (const item of items) {
  console.log("  -", item.name, "(" + item.price + "G)");
}
const potion = Data["item"]["potion"];
console.log("ポーション価格:", potion.price);
return { itemCount: items.length, potionPrice: potion.price };
`,
              args: [],
              returns: [],
              fields: [],
              isAsync: false,
            },
          ],
        };

        const engine = new GameEngine((msg) => logEngineMessage(msg, addLog));

        addLog({ type: 'action', message: '▶ データアクセステスト...' });

        await engine.handleMessage({
          type: 'start',
          config: {
            mode: 'script',
            projectData: dataProject,
            scriptId: 'script_data',
            args: {},
          },
        });
      },
    },
  ];
}

// =============================================================================
// Engine Message → Log Entry
// =============================================================================

function logEngineMessage(
  msg: EngineMessage,
  addLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void
) {
  switch (msg.type) {
    case 'ready':
      addLog({ type: 'info', message: '🟢 Engine ready' });
      break;
    case 'log':
      addLog({
        type: msg.level === 'error' ? 'error' : msg.level === 'warn' ? 'warn' : 'info',
        message: `[${msg.level}] ${msg.message}`,
      });
      break;
    case 'script-result':
      addLog({
        type: 'result',
        message: '📦 Script result',
        data: msg.value,
      });
      break;
    case 'script-error':
      addLog({
        type: 'error',
        message: `❌ Script error (${msg.errorType}): ${msg.error}`,
        data: msg.stack,
      });
      break;
    case 'state-update':
      addLog({
        type: 'state',
        message: '📊 変数更新',
        data: msg.variables,
      });
      break;
    case 'event-complete':
      addLog({ type: 'event', message: '✅ イベント完了' });
      break;
    case 'event-error':
      addLog({
        type: 'error',
        message: `❌ Event error: ${msg.error}`,
        data: msg.stack,
      });
      break;
  }
}

// =============================================================================
// Log Entry Color
// =============================================================================

function getLogColor(type: LogEntry['type']): string {
  switch (type) {
    case 'info':
      return 'text-blue-400';
    case 'warn':
      return 'text-yellow-400';
    case 'error':
      return 'text-red-400';
    case 'result':
      return 'text-green-400';
    case 'state':
      return 'text-purple-400';
    case 'event':
      return 'text-emerald-400';
    case 'action':
      return 'text-orange-400';
  }
}

// =============================================================================
// Component
// =============================================================================

export default function EngineDebugPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [running, setRunning] = useState<string | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);

  const scenarios = createScenarios();

  const addLog = useCallback((entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    setLogs((prev) => [
      ...prev,
      { ...entry, id: nextId.current++, timestamp: Date.now() },
    ]);
  }, []);

  const runScenario = useCallback(
    async (scenario: Scenario) => {
      setRunning(scenario.id);
      addLog({
        type: 'info',
        message: `━━━ ${scenario.name} ━━━`,
      });
      addLog({ type: 'info', message: scenario.description });

      try {
        await scenario.run(addLog);
      } catch (e) {
        addLog({
          type: 'error',
          message: `Unhandled: ${e instanceof Error ? e.message : String(e)}`,
        });
      }

      addLog({ type: 'info', message: '' });
      setRunning(null);
    },
    [addLog]
  );

  const runAll = useCallback(async () => {
    setLogs([]);
    for (const scenario of scenarios) {
      await runScenario(scenario);
    }
  }, [scenarios, runScenario]);

  // auto-scroll
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="flex h-screen flex-col bg-gray-950 text-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 px-6 py-3">
        <div>
          <h1 className="text-lg font-bold">Engine Debug Viewer</h1>
          <p className="text-xs text-gray-500">
            GameEngine の処理フローをリアルタイムで可視化
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLogs([])}
            className="border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800"
          >
            クリア
          </Button>
          <Button
            size="sm"
            onClick={runAll}
            disabled={running !== null}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            全シナリオ実行
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: Scenarios */}
        <div className="w-72 shrink-0 overflow-auto border-r border-gray-800 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Scenarios
          </p>
          <div className="space-y-1">
            {scenarios.map((s) => (
              <button
                key={s.id}
                onClick={() => runScenario(s)}
                disabled={running !== null}
                className={[
                  'w-full rounded px-3 py-2 text-left text-sm transition-colors',
                  running === s.id
                    ? 'bg-emerald-900/50 text-emerald-300'
                    : 'text-gray-300 hover:bg-gray-800',
                  running !== null && running !== s.id ? 'opacity-50' : '',
                ].join(' ')}
              >
                <div className="font-medium">{s.name}</div>
                <div className="mt-0.5 text-xs text-gray-500">{s.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Main: Log Output */}
        <div className="flex-1 overflow-auto bg-gray-950 p-4 font-mono text-sm">
          {logs.length === 0 ? (
            <div className="flex h-full items-center justify-center text-gray-600">
              <div className="text-center">
                <p className="text-lg">左のシナリオを選択して実行</p>
                <p className="mt-1 text-xs">または「全シナリオ実行」で一括テスト</p>
              </div>
            </div>
          ) : (
            <div className="space-y-0.5">
              {logs.map((log) => (
                <div key={log.id} className="flex gap-2">
                  <span className="shrink-0 text-gray-600">
                    {new Date(log.timestamp).toLocaleTimeString('ja-JP', {
                      hour12: false,
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}.{String(log.timestamp % 1000).padStart(3, '0')}
                  </span>
                  <span className={getLogColor(log.type)}>
                    {log.message}
                    {log.data !== undefined && (
                      <span className="ml-2 text-gray-400">
                        {typeof log.data === 'string'
                          ? log.data
                          : JSON.stringify(log.data, null, 2)}
                      </span>
                    )}
                  </span>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
