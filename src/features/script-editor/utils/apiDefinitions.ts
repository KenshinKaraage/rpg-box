import type { Monaco } from '@monaco-editor/react';

import { createFieldTypeInstance } from '@/types/fields';
import type { Script } from '@/types/script';

/** FieldType レジストリから tsType を取得 */
function tsType(fieldType: string): string {
  const instance = createFieldTypeInstance(fieldType);
  return instance?.tsType ?? 'unknown';
}

/** Script の returns 定義と isAsync から返り値の型文字列を生成 */
function returnTsType(script: Script): string {
  const returns = script.returns;
  let inner: string;
  if (returns.length === 0) {
    inner = 'void';
  } else if (returns.length === 1) {
    const r = returns[0]!;
    const base = tsType(r.fieldType);
    inner = r.isArray ? `${base}[]` : base;
  } else {
    const fields = returns
      .map((r) => {
        const base = tsType(r.fieldType);
        return `${r.id}: ${r.isArray ? `${base}[]` : base}`;
      })
      .join('; ');
    inner = `{${fields}}`;
  }
  return script.isAsync ? `Promise<${inner}>` : inner;
}

/**
 * スクリプト一覧から Script 変数の型宣言を動的に生成する。
 * 各スクリプトに対して位置引数とオブジェクト引数の両方のオーバーロードを生成。
 */
export function generateScriptDeclarations(scripts: Script[]): string {
  const callableScripts = scripts.filter((s) => s.callId && s.type !== 'internal');
  if (callableScripts.length === 0) {
    return `declare const Script: {\n  [callId: string]: (...args: unknown[]) => Promise<unknown>;\n};\n`;
  }

  const members: string[] = [];
  for (const s of callableScripts) {
    const doc = s.description ? `  /** ${s.description} */\n` : `  /** スクリプト: ${s.name} */\n`;
    const retType = returnTsType(s);

    if (s.args.length === 0) {
      members.push(`${doc}  ${s.callId}(): ${retType};`);
    } else {
      // 位置引数オーバーロード
      const positionalParams = s.args
        .map((a) => `${a.id}${a.required ? '' : '?'}: ${tsType(a.fieldType)}`)
        .join(', ');
      members.push(`${doc}  ${s.callId}(${positionalParams}): ${retType};`);

      // オブジェクト引数オーバーロード
      const objFields = s.args
        .map((a) => `${a.id}${a.required ? '' : '?'}: ${tsType(a.fieldType)}`)
        .join('; ');
      members.push(`  ${s.callId}(args: {${objFields}}): ${retType};`);
    }
  }

  // フォールバックのインデックスシグネチャ
  members.push('  [callId: string]: (...args: unknown[]) => Promise<unknown>;');

  return `declare const Script: {\n${members.join('\n')}\n};\n`;
}

/**
 * TypeScript type definitions for the script editor's autocomplete.
 * These are registered with Monaco Editor as extra libraries so users
 * get IntelliSense and hover documentation when editing scripts.
 */
export const SCRIPT_API_DECLARATIONS = `
/** スクリプトAPI - メッセージ表示や変数操作を提供 */
declare const scriptAPI: {
  /** メッセージを表示する */
  showMessage(
    text: string,
    options?: {
      /** 表情画像のアセットID */
      face?: string;
      /** 表情画像の表示名 */
      faceName?: string;
      /** メッセージウィンドウの表示位置 */
      position?: 'top' | 'center' | 'bottom';
    }
  ): Promise<void>;

  /** 選択肢を表示し、選択されたインデックスを返す */
  showChoice(
    choices: string[],
    options?: {
      /** キャンセル時に返すインデックス (-1でキャンセル無効) */
      cancelIndex?: number;
      /** デフォルトで選択されるインデックス */
      defaultIndex?: number;
    }
  ): Promise<number>;

  /** 数値入力ダイアログを表示 */
  showNumberInput(options?: {
    /** 最小値 */
    min?: number;
    /** 最大値 */
    max?: number;
    /** デフォルト値 */
    default?: number;
  }): Promise<number>;

  /** テキスト入力ダイアログを表示 */
  showTextInput(options?: {
    /** 最大文字数 */
    maxLength?: number;
    /** デフォルト値 */
    default?: string;
  }): Promise<string>;

  /** 変数の値を取得 */
  getVar(variableId: string): unknown;

  /** 変数の値を設定 */
  setVar(variableId: string, value: unknown): void;
};

/** 変数API - ゲーム変数の読み書き
 * Variable["name"] または Variable.name で直接アクセス可能。
 * Variable.get("name") / Variable.set("name", value) も使用可。
 */
declare const Variable: {
  /** 変数の値を取得 */
  get(name: string): unknown;
  /** 変数の値を設定 */
  set(name: string, value: unknown): void;
  /** 全変数を取得 */
  getAll(): Record<string, unknown>;
  /** 直接アクセス: Variable["name"] */
  [key: string]: unknown;
};

/** マップAPI */
declare const Map: {
  /** 現在のマップIDを取得 */
  getCurrentId(): string | null;
  /** マップ幅（タイル数） */
  getWidth(): number;
  /** マップ高さ（タイル数） */
  getHeight(): number;
  /** タイルデータ取得（"chipsetId:chipIndex" 文字列、空なら null） */
  getTile(x: number, y: number, layerId?: string): string | null;
  /** マップ切替（イベント完了後に実行される） */
  changeMap(mapId: string, x?: number, y?: number): void;
};

/** オブジェクトプロキシ — find() 等で取得したオブジェクトの操作 */
interface GameObjectProxy {
  readonly id: string;
  readonly name: string;
  getPosition(): { x: number; y: number };
  setPosition(x: number, y: number): void;
  getFacing(): string;
  setFacing(direction: string): void;
  isMoving(): boolean;
  getComponent(type: string): Record<string, unknown> | null;
  setComponent(type: string, data: Record<string, unknown>): void;
  setVisible(visible: boolean): void;
  destroy(): void;
}

/** ゲームオブジェクトAPI — オブジェクトの検索・生成・破棄 */
declare const GameObject: {
  /** 名前でオブジェクト検索 */
  find(name: string): GameObjectProxy | null;
  /** IDでオブジェクト検索 */
  findById(id: string): GameObjectProxy | null;
  /** 指定タイルのオブジェクト検索 */
  findAtTile(x: number, y: number): GameObjectProxy | null;
  /** プレハブからオブジェクト生成 */
  create(prefabId: string, x: number, y: number): GameObjectProxy | null;
  /** IDでオブジェクト破棄 */
  destroy(id: string): void;
};

/** サウンドAPI */
declare const Sound: {
  /** BGMを再生 */
  playBGM(assetId: string, options?: { volume?: number; loop?: boolean }): void;
  /** BGMを停止 */
  stopBGM(): void;
  /** 効果音を再生 */
  playSE(assetId: string, options?: { volume?: number }): void;
};

/** カメラAPI */
declare const Camera: {
  /** ズーム */
  zoom(level: number, duration?: number): void;
  /** パン移動 */
  pan(x: number, y: number, duration?: number): void;
  /** 画面揺れ */
  shake(intensity?: number, duration?: number): void;
};

/** セーブAPI */
declare const Save: {
  /** セーブ */
  save(slotId?: number): void;
  /** ロード */
  load(slotId?: number): void;
};

/** コンソール出力 (デバッグ用) */
declare const console: {
  log(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
};
`;

/**
 * 現在編集中のスクリプトの引数を declare const として生成する。
 * エディタ内でパネルで設定した引数が変数候補として表示される。
 */
export function generateArgDeclarations(script: Script | null): string {
  if (!script || script.args.length === 0) return '';
  return script.args
    .map((a) => `/** 引数: ${a.name} */\ndeclare const ${a.id}: ${tsType(a.fieldType)};`)
    .join('\n');
}

/** データ型の情報（動的宣言生成用） */
export interface DataTypeInfo {
  id: string;
  name: string;
  fields: { id: string; type: string }[];
}

/**
 * データ型一覧から Data 変数の型宣言を動的に生成する。
 * 各データ型に対してインターフェースと型付きプロパティを生成。
 *
 * Data.enemy[0].hp     — インデックスアクセス
 * Data.enemy["slime"]  — IDアクセス
 * Data.enemy.filter()  — Arrayメソッド
 */
export function generateDataDeclarations(dataTypes: DataTypeInfo[]): string {
  if (dataTypes.length === 0) {
    return `/** データAPI - データベースエントリの参照 */
declare const Data: {
  [typeId: string]: { [id: string]: { [field: string]: unknown } } & Array<{ [field: string]: unknown }>;
};
`;
  }

  const parts: string[] = [];

  for (const dt of dataTypes) {
    const entryName = `DataEntry_${dt.id}`;
    const collName = `DataEntries_${dt.id}`;

    // Entry interface (individual record)
    const fieldDefs = ['  /** エントリID */', '  readonly id: string;'];
    for (const f of dt.fields) {
      fieldDefs.push(`  ${f.id}: ${tsType(f.type)};`);
    }
    parts.push(
      `/** ${dt.name} のエントリ */\ninterface ${entryName} {\n${fieldDefs.join('\n')}\n}`
    );

    // Collection interface (array + ID access)
    parts.push(
      `/** ${dt.name} のエントリ一覧（配列アクセス + IDアクセス） */\n` +
        `interface ${collName} extends Array<${entryName}> {\n` +
        `  [id: string]: ${entryName};\n` +
        `}`
    );
  }

  // Data declaration
  const members = dataTypes.map((dt) => `  /** ${dt.name} */\n  ${dt.id}: DataEntries_${dt.id};`);
  members.push('  [typeId: string]: any;');
  parts.push(
    `/** データAPI - データベースエントリの参照 */\ndeclare const Data: {\n${members.join('\n')}\n};`
  );

  return parts.join('\n\n') + '\n';
}

const LIB_URI = 'ts:filename/scriptAPI.d.ts';
const SCRIPT_LIB_URI = 'ts:filename/scriptDynamic.d.ts';
const ARG_LIB_URI = 'ts:filename/scriptArgs.d.ts';
const DATA_LIB_URI = 'ts:filename/dataDynamic.d.ts';

/** 動的 Script 宣言の dispose 関数を保持 */
let scriptLibDisposable: { dispose: () => void } | null = null;
/** 引数宣言の dispose 関数を保持 */
let argLibDisposable: { dispose: () => void } | null = null;
/** 動的 Data 宣言の dispose 関数を保持 */
let dataLibDisposable: { dispose: () => void } | null = null;

/**
 * Register static API type definitions with Monaco Editor.
 * Call this in the `beforeMount` callback of the Monaco Editor.
 */
export function registerApiDefinitions(monaco: Monaco): void {
  const existingLibs = monaco.languages.typescript.javascriptDefaults.getExtraLibs();
  if (existingLibs[LIB_URI]) return;

  monaco.languages.typescript.javascriptDefaults.addExtraLib(SCRIPT_API_DECLARATIONS, LIB_URI);
}

/**
 * スクリプト一覧に基づいて Script 変数の型宣言を動的に更新する。
 * スクリプトが追加・変更・削除されるたびに呼び出す。
 */
export function updateScriptDeclarations(monaco: Monaco, scripts: Script[]): void {
  // 前回の宣言を破棄
  if (scriptLibDisposable) {
    scriptLibDisposable.dispose();
    scriptLibDisposable = null;
  }

  const declarations = generateScriptDeclarations(scripts);
  scriptLibDisposable = monaco.languages.typescript.javascriptDefaults.addExtraLib(
    declarations,
    SCRIPT_LIB_URI
  );
}

/**
 * 現在編集中のスクリプトの引数宣言を動的に更新する。
 * スクリプトが切り替わるたび・引数が変更されるたびに呼び出す。
 */
export function updateArgDeclarations(monaco: Monaco, script: Script | null): void {
  if (argLibDisposable) {
    argLibDisposable.dispose();
    argLibDisposable = null;
  }

  const declarations = generateArgDeclarations(script);
  if (declarations) {
    argLibDisposable = monaco.languages.typescript.javascriptDefaults.addExtraLib(
      declarations,
      ARG_LIB_URI
    );
  }
}

/**
 * データ型一覧に基づいて Data 変数の型宣言を動的に更新する。
 * データ型が追加・変更・削除されるたびに呼び出す。
 */
export function updateDataDeclarations(monaco: Monaco, dataTypes: DataTypeInfo[]): void {
  if (dataLibDisposable) {
    dataLibDisposable.dispose();
    dataLibDisposable = null;
  }

  const declarations = generateDataDeclarations(dataTypes);
  dataLibDisposable = monaco.languages.typescript.javascriptDefaults.addExtraLib(
    declarations,
    DATA_LIB_URI
  );
}
