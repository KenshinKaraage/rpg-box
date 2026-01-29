# タスク実行ワークフロー

このファイルを参照して、指定されたタスクを実行してください。

---

## 実行手順

### 1. タスク確認

- `docs/tasks.md` から指定されたタスクIDの詳細を読む
- 完了条件のチェックリストを確認

### 2. ブランチ作成

```bash
git checkout -b feature/{タスクID}-{説明}
# 例: git checkout -b feature/T031-number-field-type
```

### 3. 実装

- 完了条件に従ってコードを作成
- 関連ファイルに記載されたパスに実装
- テストファイルも作成

### 4. 検証

```bash
npm run lint
npm run type-check
npm test
```

- すべてパスするまで修正

### 5. コミット

```bash
git add <変更ファイル>
git commit -m "<type>(<scope>): <説明>

[タスクID: {タスクID}]

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

### 6. tasks.md 更新

- ステータスを `[x]` に変更
- ブランチ名を記入

### 7. 完了報告

実装内容のサマリーを報告

---

## コミットタイプ

| type     | 用途             |
| -------- | ---------------- |
| feat     | 新機能           |
| fix      | バグ修正         |
| refactor | リファクタリング |
| test     | テスト追加       |
| docs     | ドキュメント     |
| chore    | ビルド・設定     |

---

## 現在のタスク

**実行対象:** （ここにタスクIDを指定）

```
T001
```

---

## オプション

- [ ] PR作成する
- [x] tasks.md を更新する
- [x] テストを実行する
