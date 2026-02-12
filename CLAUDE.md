# RPG Box コーディング規約

## 1. プロジェクト構造

```
src/
├── app/                    # Next.js App Router
│   ├── (editor)/          # エディタ関連ページ
│   ├── api/               # API Routes（将来のクラウド連携用）
│   └── layout.tsx
├── components/
│   ├── ui/                # shadcn/ui コンポーネント
│   └── common/            # 共通UIコンポーネント
├── features/              # 機能別モジュール
│   ├── map-editor/        # マップエディタ
│   ├── event-editor/      # イベントエディタ
│   ├── database/          # データベース管理
│   ├── asset-manager/     # アセット管理
│   ├── game-settings/     # ゲーム設定
│   ├── test-play/         # テストプレイ
│   └── auth/              # 認証（Phase 2）
├── hooks/                 # カスタムフック（機能横断的なもの）
│   ├── useUndo.ts         # Undo/Redo
│   ├── useKeyboardShortcut.ts
│   └── useLocalStorage.ts
├── lib/                   # ユーティリティ・ヘルパー
│   ├── utils.ts           # 汎用ユーティリティ
│   ├── validation.ts      # バリデーション関数
│   └── constants.ts       # 定数定義
├── stores/                # Zustand ストア
│   ├── index.ts           # ストア統合
│   ├── mapSlice.ts
│   ├── eventSlice.ts
│   └── uiSlice.ts
├── types/                 # 型定義
│   ├── map.ts
│   ├── event.ts
│   └── database.ts
└── styles/                # グローバルスタイル
```

### features/ 内の構造

```
features/map-editor/
├── components/           # この機能専用のコンポーネント
│   ├── MapCanvas.tsx
│   └── MapCanvas.test.tsx  # テストはソースと同じ場所に
├── hooks/               # この機能専用のフック
├── utils/               # この機能専用のユーティリティ
└── index.ts             # 公開API
```

## 2. 命名規則

### ファイル名

| 種類           | 規則                   | 例                |
| -------------- | ---------------------- | ----------------- |
| コンポーネント | PascalCase             | `MapCanvas.tsx`   |
| フック         | camelCase（use接頭辞） | `useMapEditor.ts` |
| ユーティリティ | camelCase              | `mapUtils.ts`     |
| 型定義         | camelCase              | `mapTypes.ts`     |
| 定数           | camelCase              | `constants.ts`    |

### コード内

| 種類                | 規則             | 例                                        |
| ------------------- | ---------------- | ----------------------------------------- |
| コンポーネント      | PascalCase       | `function MapCanvas()`                    |
| 関数                | camelCase        | `function calculateTilePosition()`        |
| 変数                | camelCase        | `const selectedTile`                      |
| 定数                | UPPER_SNAKE_CASE | `const MAX_MAP_SIZE = 999`                |
| 型/インターフェース | PascalCase       | `interface MapData`                       |
| 拡張可能な型        | 継承クラス       | `class NumberFieldType extends FieldType` |
| プライベート        | \_接頭辞不使用   | TypeScriptのprivate修飾子を使用           |

## 3. TypeScript ベストプラクティス

### 型定義

```typescript
// Good: 明示的な型定義
interface MapTile {
  id: string;
  chipsetId: string;
  x: number;
  y: number;
}

// Good: 型推論が明確な場合は省略可
const tiles = mapData.tiles.filter((tile) => tile.visible);

// Bad: any の使用
const data: any = fetchData();

// Good: unknown + 型ガード
const data: unknown = fetchData();
if (isMapData(data)) {
  // 型安全に使用
}
```

### 拡張可能な型（継承クラスパターン）

拡張性が必要な型は継承クラスで定義します。

```typescript
// Good: 継承クラス + レジストリパターン
abstract class FieldType {
  abstract readonly type: string;
  abstract getDefaultValue(): unknown;
  abstract validate(value: unknown): ValidationResult;
  abstract renderEditor(props: EditorProps): React.ReactNode;
}

class NumberFieldType extends FieldType {
  readonly type = 'number';
  min?: number;
  max?: number;
  // ...
}

// カスタムタイプの追加（OSS貢献者）
class GridFieldType extends FieldType {
  readonly type = 'grid';
  columns: number;
  rows: number;
  // ...
}

// レジストリに登録
registerFieldType('grid', GridFieldType);
```

**継承クラスを使う理由:**

- 各タイプが独自のプロパティとメソッドを持てる
- OSS貢献者がカスタムタイプを追加しやすい
- 型ごとのロジックがカプセル化される

**適用対象:**

- FieldType（フィールドタイプ）
- Component（マップオブジェクトコンポーネント）
- EventAction（イベントアクション）
- UIElement（UIエレメント）

### Null/Undefined 処理

```typescript
// Good: Optional chaining
const tileName = tile?.name ?? 'default';

// Good: 早期リターン
function processMap(map: Map | null) {
  if (!map) return null;
  // 処理続行
}
```

### strict モード

`tsconfig.json` で以下を有効化：

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true
  }
}
```

**`noUncheckedIndexedAccess` の対処パターン:**

```typescript
// 配列アクセスは T | undefined になる
const item = items[index];
if (!item) return; // ガード必須

// ただし、データ参照はIDベースなのでインデックスアクセスは稀
const character = characters.find((c) => c.id === referenceId); // 推奨
```

## 4. React / Next.js ベストプラクティス

### Server Components vs Client Components

```typescript
// デフォルト: Server Component（'use client' 不要）
// app/page.tsx
export default function Page() {
  return <MapEditor />;
}

// クライアント機能が必要な場合のみ 'use client'
// - useState, useEffect, useContext
// - イベントハンドラ (onClick, onChange)
// - ブラウザAPI (localStorage, window)
// - サードパーティのクライアントライブラリ

// Good: 'use client' の範囲を最小化
// components/MapCanvas.tsx
'use client';
export function MapCanvas() {
  const [zoom, setZoom] = useState(1);
  // ...
}

// 親コンポーネントは Server Component のまま
// features/map-editor/components/MapEditor.tsx
import { MapCanvas } from './MapCanvas';
export function MapEditor() {
  return (
    <div>
      <MapCanvas />  {/* Client Component */}
    </div>
  );
}
```

### コンポーネント設計

```typescript
// Good: Props型を明示的に定義
interface TilePaletteProps {
  chipsetId: string;
  onTileSelect: (tileId: string) => void;
  selectedTile?: string;
}

export function TilePalette({ chipsetId, onTileSelect, selectedTile }: TilePaletteProps) {
  // ...
}

// Good: children を受け取る場合
interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}
```

### パフォーマンス最適化

**useMemo が必要なケース:**

```typescript
// 大量データのフィルタリング（データ設定: 最大1000件）
const filteredData = useMemo(() => data.filter((item) => item.name.includes(query)), [data, query]);

// マップの可視タイル計算（最大999x999）
const visibleTiles = useMemo(() => calculateVisibleTiles(map, viewport), [map, viewport]);
```

**useMemo が不要なケース:**

- 少量のリスト（フィールドセット、変数、クラス等）
- 単純な変換処理
- すでに安定した参照

**仮想化（大量リスト/グリッド）:**

```typescript
// @tanstack/react-virtual を使用（推奨）
// 適用箇所: データ一覧、アセット管理、オブジェクトリスト
import { useVirtualizer } from '@tanstack/react-virtual';

const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => scrollRef.current,
  estimateSize: () => 40,
});
```

## 5. Zustand 状態管理

### Slices パターン

```typescript
// stores/mapSlice.ts
import { StateCreator } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface MapSlice {
  maps: Map[];
  selectedMapId: string | null;
  selectMap: (id: string) => void;
  updateTile: (mapId: string, x: number, y: number, tileId: string) => void;
}

export const createMapSlice: StateCreator<MapSlice, [['zustand/immer', never]], [], MapSlice> = (
  set
) => ({
  maps: [],
  selectedMapId: null,
  selectMap: (id) =>
    set((state) => {
      state.selectedMapId = id;
    }),
  updateTile: (mapId, x, y, tileId) =>
    set((state) => {
      const map = state.maps.find((m) => m.id === mapId);
      if (map) {
        map.tiles[y][x] = tileId;
      }
    }),
});

// stores/index.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createMapSlice, MapSlice } from './mapSlice';
import { createEventSlice, EventSlice } from './eventSlice';

type StoreState = MapSlice & EventSlice;

export const useStore = create<StoreState>()(
  immer((...args) => ({
    ...createMapSlice(...args),
    ...createEventSlice(...args),
  }))
);
```

### セレクタの使用

```typescript
// Good: 必要な状態のみ購読
const selectedMapId = useStore((state) => state.selectedMapId);
const selectMap = useStore((state) => state.selectMap);

// Bad: ストア全体を購読（不要な再レンダリング）
const store = useStore();
```

## 6. shadcn/ui + フォーム

### コンポーネント構成

```typescript
// Good: shadcn/ui のコンポジションパターン
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

function CreateMapDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新規マップ作成</DialogTitle>
        </DialogHeader>
        {/* フォーム内容 */}
      </DialogContent>
    </Dialog>
  );
}
```

### React Hook Form + Zod

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// スキーマ定義（バリデーションと型を同時に）
const mapSchema = z.object({
  name: z.string().min(1, '名前は必須です').max(50, '50文字以内'),
  width: z.number().min(20).max(999),
  height: z.number().min(15).max(999),
});

// 型を自動生成
type MapFormData = z.infer<typeof mapSchema>;

function MapForm() {
  const form = useForm<MapFormData>({
    resolver: zodResolver(mapSchema),
    defaultValues: {
      name: '',
      width: 20,
      height: 15,
    },
  });

  const onSubmit = (data: MapFormData) => {
    // data は型安全
    createMap(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* フォームフィールド */}
    </form>
  );
}
```

## 7. エラーハンドリング

### 基本パターン

```typescript
// カスタムエラークラス
class ValidationError extends Error {
  constructor(
    message: string,
    public field: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// try-catch の適切な使用
async function saveMap(map: Map) {
  try {
    await storage.save(map);
  } catch (error) {
    if (error instanceof ValidationError) {
      showFieldError(error.field, error.message);
    } else {
      showToast('保存に失敗しました', 'error');
      console.error('Map save failed:', error);
    }
  }
}
```

### ユーザーへのフィードバック

- 成功: トースト通知（緑）
- 警告: トースト通知（黄）
- エラー: トースト通知（赤）+ 詳細をコンソールに出力
- 入力エラー: フィールド下部に赤文字で表示

## 8. テスト

### テストファイルの配置（コロケーション）

```
features/map-editor/
├── MapCanvas.tsx
├── MapCanvas.test.tsx    # 同じディレクトリに配置
├── hooks/
│   ├── useMapEditor.ts
│   └── useMapEditor.test.ts
```

- テストファイルはソースファイルと同じディレクトリに配置
- ファイル名は `{SourceName}.test.{ts,tsx}`

### Jest + React Testing Library

```typescript
// MapCanvas.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MapCanvas } from './MapCanvas';

describe('MapCanvas', () => {
  it('タイルをクリックすると選択される', () => {
    const onTileSelect = jest.fn();
    render(<MapCanvas onTileSelect={onTileSelect} />);

    fireEvent.click(screen.getByTestId('tile-0-0'));

    expect(onTileSelect).toHaveBeenCalledWith({ x: 0, y: 0 });
  });

  it('ズームボタンで拡大縮小できる', () => {
    render(<MapCanvas />);

    fireEvent.click(screen.getByRole('button', { name: '拡大' }));

    expect(screen.getByTestId('canvas')).toHaveStyle({ transform: 'scale(1.5)' });
  });
});
```

### テスト方針

- ユーザー視点でテスト（実装詳細ではなく振る舞いをテスト）
- `data-testid` は必要最小限に
- アクセシビリティクエリ優先（`getByRole`, `getByLabelText`）

## 9. コードスタイル

### ESLint + Prettier

```json
// .eslintrc.json
{
  "extends": ["next/core-web-vitals", "plugin:@typescript-eslint/recommended"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "prefer-const": "error"
  }
}
```

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### インポート順序

```typescript
// 1. React/Next.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. サードパーティ
import { z } from 'zod';
import { useForm } from 'react-hook-form';

// 3. 内部モジュール（絶対パス）
import { Button } from '@/components/ui/button';
import { useStore } from '@/stores';

// 4. 相対パス
import { MapTile } from './MapTile';
import type { MapData } from './types';
```

## 10. Git 運用ルール

### ブランチ戦略

```
main                           # 本番リリース
  │
  └─── develop                 # 開発統合ブランチ
         │
         ├─── feature/T031-number-field-type
         ├─── feature/T032-string-field-type
         └─── fix/T031-validation-bug
```

### ブランチ命名規則

| パターン                       | 用途             | 例                               |
| ------------------------------ | ---------------- | -------------------------------- |
| `feature/T{ID}-{description}`  | 新機能           | `feature/T031-number-field-type` |
| `fix/T{ID}-{description}`      | バグ修正         | `fix/T031-validation-bug`        |
| `refactor/T{ID}-{description}` | リファクタリング | `refactor/T031-cleanup`          |

### Conventional Commits（英語）

```
<type>(<scope>): <subject>

[タスクID: T{ID}]

<body>

<footer>
```

### Type

| Type     | 説明                             |
| -------- | -------------------------------- |
| feat     | 新機能                           |
| fix      | バグ修正                         |
| docs     | ドキュメントのみ                 |
| style    | コードスタイル（動作に影響なし） |
| refactor | リファクタリング                 |
| test     | テスト追加・修正                 |
| chore    | ビルド・ツール関連               |

### コミットメッセージ例

```
feat(fields): implement NumberFieldType class

[タスクID: T031]

- Implement NumberFieldType extending FieldType
- Add min/max/step properties
- Implement validate() with range checking
- Add getDefaultValue() returning 0

Closes #31
```

### タスクとコミットの対応

| タスク規模         | コミット数 | 構成                          |
| ------------------ | ---------- | ----------------------------- |
| 小（1ファイル）    | 1          | 実装のみ                      |
| 中（複数ファイル） | 2-3        | 実装 → テスト → ドキュメント  |
| 大（機能全体）     | 3-5        | 型定義 → 実装 → テスト → 統合 |

### 開発フロー

```
1. タスク選択
   └─→ tasks.md で未着手タスクを確認

2. ブランチ作成
   └─→ git checkout -b feature/T031-number-field-type

3. 実装 & テスト
   └─→ コード実装、テスト作成

4. コミット（タスクID必須）
   └─→ git commit -m "feat(fields): implement NumberFieldType [T031]"

5. tasks.md 更新
   └─→ ステータスを [x] に変更、PR番号を記録

6. PR作成 & レビュー
   └─→ タイトルに [T031] を含める

7. マージ & クローズ
   └─→ developへマージ、関連Issue自動クローズ
```

### PR タイトル規約

```
[T031] feat(fields): implement NumberFieldType
```

### 禁止事項

- タスクIDなしのコミット（pre-commitフックでチェック）
- developへの直接コミット
- mainへの直接コミット
- レビューなしのマージ

## 11. アクセシビリティ

### キーボード操作

```typescript
// インタラクティブ要素はキーボードで操作可能に
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
>
```

### 基本原則

- **フォーカス可視化**: フォーカス状態を明確に表示（`focus-visible`）
- **aria-label**: アイコンのみのボタンには必須
- **role属性**: 非標準要素をインタラクティブにする場合に使用
- **tabIndex**: フォーカス順序の制御（0 = 自然順、-1 = プログラム制御のみ）

### エディタ固有

- ショートカットキーは `useKeyboardShortcut` フックで一元管理
- キャンバス操作（矢印キー移動等）はフォーカス時のみ有効

## 12. その他の規約

### コメント

- コードで明確な場合はコメント不要
- 「なぜ」を説明するコメントは有用
- TODO コメントには Issue 番号を含める: `// TODO(#123): 実装予定`

### マジックナンバー

```typescript
// Bad
if (zoom > 4) { ... }

// Good
const MAX_ZOOM_LEVEL = 4;
if (zoom > MAX_ZOOM_LEVEL) { ... }
```

### 早期リターン

```typescript
// Good: ネストを減らす
function processEvent(event: Event | null) {
  if (!event) return;
  if (!event.isActive) return;

  // メイン処理
}

// Bad: 深いネスト
function processEvent(event: Event | null) {
  if (event) {
    if (event.isActive) {
      // メイン処理
    }
  }
}
```

## 13. UI Component Templates (Golden Patterns)

AIが新規UIを作成する際は、以下のテンプレートを**必ず**使用すること。
独自のCSSクラス（`w-[350px]`など）を避け、`tailwind.config.js` に定義されたセマンティッククラスを使用する。

### 1. Standard Form Modal

```tsx
<Modal
  open={isOpen}
  onOpenChange={setIsOpen}
  title="エンティティ作成"
  size="md" // sm, md, lg, xl から選択 (tailwind.config.js参照)
>
  {/* コンテンツ: space-y-4 で統一 */}
  <div className="space-y-4 py-4">
    <div className="space-y-2">
      <Label htmlFor="name">名前</Label>
      <Input id="name" placeholder="例: スライム" />
    </div>

    <div className="space-y-2">
      <Label htmlFor="type">タイプ</Label>
      <Select>
        <SelectTrigger id="type">
          <SelectValue placeholder="選択してください" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Type A</SelectItem>
          <SelectItem value="b">Type B</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>

  {/* フッター: 右寄せボタン */}
  <DialogFooter>
    <Button variant="outline" onClick={() => setIsOpen(false)}>
      キャンセル
    </Button>
    <Button onClick={handleSave}>保存</Button>
  </DialogFooter>
</Modal>
```

### 2. Standard Page Layout (Sidebar + Main)

```tsx
// 画面全体を使うエディタ画面の基本構造
<div className="flex h-full w-full overflow-hidden">
  {/* サイドバー: w-sidebar (240px) を厳守 */}
  <aside className="w-sidebar shrink-0 border-r bg-muted/20">
    <div className="flex h-header items-center border-b px-4 font-semibold">エクスプローラー</div>
    <div className="h-[calc(100%-theme(height.header))] overflow-auto p-2">
      {/* ツリーなどのリスト */}
    </div>
  </aside>

  {/* メインエリア */}
  <main className="flex-1 overflow-auto bg-background">
    {/* コンテンツ */}
    <div className="container mx-auto max-w-4xl py-8">{children}</div>
  </main>

  {/* インスペクタ (右パネル): w-inspector (300px) */}
  <aside className="w-inspector shrink-0 border-l bg-muted/20">{/* プロパティ設定など */}</aside>
</div>
```

### 3. Semantic Tailwind Classes (tailwind.config.js)

数値（マジックナンバー）を直接書かず、以下のクラスを使用すること。

| クラス名         | 定義値 | 用途                     |
| :--------------- | :----- | :----------------------- |
| `w-sidebar`      | 240px  | 左サイドバー標準幅       |
| `w-sidebar-sm`   | 200px  | 狭いサイドバー           |
| `w-inspector`    | 300px  | 右プロパティパネル標準幅 |
| `h-header`       | 56px   | ヘッダーの高さ           |
| `max-w-modal-sm` | 400px  | 小さな確認ダイアログ     |
| `max-w-modal-md` | 500px  | 標準的なフォーム         |
| `max-w-modal-lg` | 640px  | 複雑な設定画面           |

### 4. 禁止事項・アンチパターン

- **Flexbox Layout**: `flex-col` で無限に伸びるリストを作らない → `min-h-0` + `flex-1` を使う
- **Modal Size**: `w-[500px]` と書かない → `size="md"` (`max-w-modal-md`) を使う
- **Dropdown**: `w-48` 以下にしない → `w-60` 以上を使う（日本語対応）
- **Button**: アイコンのみのボタンには必ず `aria-label` をつける
