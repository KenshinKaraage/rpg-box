# DraggableTree 汎用コンポーネント設計

## Goal

@dnd-kit を用いた汎用ツリーD&Dコンポーネントを作成し、テストページで動作確認する。
ストア非依存のコールバック型APIにより、他プロジェクトへの転用も可能にする。

## API

```tsx
interface TreeNode {
  id: string;
  parentId?: string;
  [key: string]: unknown;
}

interface DraggableTreeProps {
  nodes: TreeNode[];
  renderNode: (node: TreeNode, depth: number) => React.ReactNode;
  onMove: (id: string, newParentId: string | undefined, index: number) => void;
  onSelect?: (ids: string[]) => void;
  selectedIds?: string[];
  indentPx?: number; // デフォルト 16
}
```

- `nodes`: parentId ベースのフラットリスト
- `renderNode`: ノード描画を外部委譲（ラベル、アイコン等）
- `onMove`: D&D完了時に呼ばれるコールバック。新しい親IDと挿入位置を返す
- `onSelect`: 選択変更コールバック（controlled）
- `indentPx`: ネストごとのインデント幅

## D&D 挙動

| 操作 | 結果 |
|------|------|
| ノード上部/下部にドロップ | 兄弟として挿入（上=前、下=後） |
| ノード中央にドロップ | そのノードの子になる |
| 自分自身 or 子孫へのドロップ | 無効（循環防止） |

ドロップ判定はノードの高さを3分割:
- 上 1/4: 前に挿入（兄弟）
- 中央 2/4: 子として追加
- 下 1/4: 後に挿入（兄弟）

## コンポーネント構成

```
src/components/common/DraggableTree/
├── DraggableTree.tsx      // DndContext + ツリー描画
├── TreeNodeWrapper.tsx    // 各ノードの D&D ラッパー (useDraggable + useDroppable)
├── DropIndicator.tsx      // ドロップ位置インジケーター（線 or ハイライト）
├── types.ts               // TreeNode, DraggableTreeProps 等
└── utils.ts               // isDescendant (循環検出), buildTree (フラット→ツリー変換)
```

## ドロップインジケーター

- **兄弟挿入**: ノード間に水平の青線
- **子追加**: ノード全体を青枠でハイライト

## テストページ

`/test/dnd-tree/page.tsx`

- 左: DraggableTree（サンプルデータ 10-15ノード、2-3階層）
- 右: 現在の nodes 配列を JSON 表示（リアルタイム更新）
- 操作ログ: onMove が呼ばれるたびにログ表示

## 依存ライブラリ

- `@dnd-kit/core`
- `@dnd-kit/sortable`
- `@dnd-kit/utilities`

## 将来の統合

テストページで検証後、UIObjectTree の内部実装を DraggableTree に置き換える。
`onMove` コールバックで `reparentUIObject` ストアアクションを呼ぶだけ。
