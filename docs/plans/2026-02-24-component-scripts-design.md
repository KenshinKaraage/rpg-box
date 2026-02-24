# コンポーネントスクリプト設計

Date: 2026-02-24

## 概要

コンポーネントスクリプトエディタにおいて、ビルトインコンポーネント（Transform, Sprite等）をデフォルトエントリとして表示・編集できるようにする。

## 設計方針

- ビルトインコンポーネントもユーザー作成スクリプトも同じUI/同じ扱い
- 既存の `Component` TypeScriptクラスをソースとして `ComponentScript` を自動生成
- プロジェクト作成時にビルトインスクリプトをシード（defaultClasses.tsと同パターン）
- テスト時は `createNewProject()` を呼び出してビルトインの存在を保証

## データモデル

### ComponentScript

```typescript
interface ComponentScript {
  id: string; // 例: 'transform'
  name: string; // 例: 'Transform'
  code: string; // MonacoEditorに表示するJSコード（自動生成 or ユーザー編集済み）
  fields: ComponentField[]; // 右パネルで設定するフィールド定義
}

interface ComponentField {
  name: string; // 例: 'x'
  type: string; // 既存FieldTypeのtype ('number', 'string', 'boolean', ...)
  defaultValue: unknown; // 例: 0
  label: string; // 例: 'X'
}
```

### Component クラスへの追加

```typescript
abstract class Component {
  abstract readonly type: string;
  abstract readonly label: string;
  abstract getFieldSchema(): ComponentField[]; // ← 追加
  // serialize/deserialize/clone/renderPropertyPanel は既存のまま
}
```

各ビルトインコンポーネントが `getFieldSchema()` を実装する。

```typescript
class TransformComponent extends Component {
  readonly type = 'transform';
  readonly label = 'Transform';
  x = 0;
  y = 0;
  z = 0;
  rotation = 0;
  scaleX = 1;
  scaleY = 1;

  getFieldSchema(): ComponentField[] {
    return [
      { name: 'x', type: 'number', defaultValue: 0, label: 'X' },
      { name: 'y', type: 'number', defaultValue: 0, label: 'Y' },
      { name: 'z', type: 'number', defaultValue: 0, label: 'Z' },
      { name: 'rotation', type: 'number', defaultValue: 0, label: 'Rotation' },
      { name: 'scaleX', type: 'number', defaultValue: 1, label: 'Scale X' },
      { name: 'scaleY', type: 'number', defaultValue: 1, label: 'Scale Y' },
    ];
  }
}
```

## 自動変換

```typescript
// src/lib/componentScriptUtils.ts

function generateScriptCode(fields: ComponentField[]): string {
  const lines = fields.map((f) => `  ${f.name}: ${JSON.stringify(f.defaultValue)}`);
  return `export default {\n${lines.join(',\n')}\n}`;
}

function componentClassToScript(Cls: ComponentClass): ComponentScript {
  const instance = new Cls();
  const fields = instance.getFieldSchema();
  return {
    id: instance.type,
    name: instance.label,
    code: generateScriptCode(fields),
    fields,
  };
}
```

## デフォルトスクリプトのシード

```typescript
// src/lib/defaultComponentScripts.ts
import { getAllComponents } from '@/types/components';
import '@/types/components/register';

export function getDefaultComponentScripts(): ComponentScript[] {
  return getAllComponents().map(([, Cls]) => componentClassToScript(Cls));
}

// プロジェクト作成時
function createNewProject(): Project {
  return {
    // ...
    componentScripts: getDefaultComponentScripts(),
  };
}
```

## UIレイアウト

スクリプトページ（3カラム）のコンポーネントスクリプト選択時：

```
┌─────────────┬──────────────────┬──────────────────┐
│ スクリプト  │   Monaco Editor   │   フィールド設定  │
│ リスト      │                   │                   │
│             │ export default {  │ + フィールド追加   │
│ Transform ● │   x: 0,          │ ┌─────────────┐   │
│ Sprite    ● │   y: 0,          │ │ x  number 0 │   │
│ HealthBar   │   z: 0,          │ │ y  number 0 │   │
│             │   rotation: 0,   │ │ z  number 0 │   │
│ + 新規      │ }                 │ └─────────────┘   │
└─────────────┴──────────────────┴──────────────────┘
```

- ビルトイン・ユーザー作成の区別なく同一リストに表示
- コードは編集可能（編集後のコードはプロジェクトに保存）
- 右パネルのフィールド設定は追加・変更・削除が可能

## テスト戦略

```typescript
// 各テストのbeforeEachまたはtest setup
const project = createNewProject();
// → project.componentScripts に transform, sprite 等が含まれることを保証

it('Transformスクリプトがデフォルトで存在する', () => {
  const project = createNewProject();
  expect(project.componentScripts.find((s) => s.id === 'transform')).toBeDefined();
});
```

## スコープ外（MVP後）

- `Component.getFieldSchema()` が `abstract` かどうかは既存13クラスへの影響を考慮し、非abstractで空配列を返すデフォルト実装を持つ
- 内部エンジン編集（TransformのフィールドとWebGLレンダリングの連携）はゲーム設定の上級機能として後回し
- コンポーネントスクリプトのメソッド（onUpdate等）の型補完・バリデーションは将来対応
