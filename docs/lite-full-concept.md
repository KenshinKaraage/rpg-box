# Lite / Full 構想

## 概要

RPG Box は2つのモードで提供する。

|            | Lite                  | Full                   |
| ---------- | --------------------- | ---------------------- |
| ターゲット | 一般ユーザー・初心者  | 開発者・ヘビーユーザー |
| 体験       | 短時間・お手軽RPG作成 | 自由・深いカスタマイズ |
| 素材       | テンプレートのみ      | 自由アップロード可     |
| エンジン   | テンプレート固定      | 改造可能               |
| 展開       | メインプロダクト      | ニッチ向け             |

---

## Lite の体験

- **テンプレートパッケージを選ぶだけ**で遊べるRPGが作れる
- データ（モンスター・アイテム・マップ）を流し込む作業がメイン
- スクリプト・エンジン・UI設計は不要
- 短時間で1本完成させることを目標とする

## Full の体験

- エンジンのカスタマイズ、スクリプト作成、独自コンポーネント設計が可能
- Lite 向けテンプレートパッケージを作成・配布できる
- Full ユーザーが Lite のエコシステムを支える構造

---

## 2モードの接続

```
Full ユーザー（エンジン・テンプレート作者）
  └─ コンポーネント・スクリプト・UIを設計
  └─ TemplatePackage として書き出し
        ↓ インポート
Lite ユーザー（ゲーム作者）
  └─ テンプレートを選ぶ
  └─ データ・マップ・変数を設定するだけ
  └─ 「もっと細かくしたい」 → Full モードへ（同一プロジェクト形式）
```

初期フェーズはプロジェクト作者（自分自身）が Full でテンプレートを用意し、
Lite ユーザーに提供する。

---

## テンプレートファースト設計

すべてのエンティティはテンプレートからインポート可能な設計にする。
Lite ユーザーが「一から設計する」状態にならないことが必須要件。

### テンプレートパッケージの構成

```
TemplatePackage
├── metadata         テンプレート名・バージョン・作者・タグ
├── classes          CustomClass 定義（ステータス型など）
├── variables        変数プリセット（所持金・HP・フラグなど）
├── dataTypes        データタイプ定義（モンスターDB・アイテムDBなど）
├── scripts          スクリプト（バトルロジック・イベントロジック）
├── prefabs          プレハブ定義（NPC・宝箱・サインなど）
├── maps             マップテンプレート（フィールド定義含む雛形）
├── chipsets         チップセット（Lite では変更不可）
└── ui               UIオブジェクト（バトル画面・メニュー画面など）

// TODO: engine
//   GameEngine（src/engine/ 以下）のテンプレート対応。
//   Lite ではエンジン全体が固定、Full では改造可能とする。
//   編集方法・実装方法が未設計のため、設計確定後に追加する。
```

---

## エンティティ別 Lite 制約

| エンティティ              | レジストリ管理 | Lite の操作                                      |
| ------------------------- | :------------: | ------------------------------------------------ |
| `CustomClass`             |       ✅       | 参照のみ（フィールド定義変更・削除不可）         |
| `Variable`                |       ✅       | **完全自由**（テンプレート提供分も編集・削除可） |
| `DataType`                |       ✅       | フィールド定義変更不可                           |
| `DataEntry`               |       —        | 完全自由（ゲームデータはユーザーが決める）       |
| `Script`                  |       ✅       | 参照のみ                                         |
| `Component`（基底クラス） |       ✅       | 参照のみ                                         |
| `Prefab`                  |       ✅       | 定義変更不可・マップへの配置は自由               |
| `GameMap`                 |       ✅       | 作成・タイル描画自由・フィールド定義不可         |
| `UIObject`                |       ✅       | テンプレートUIのみ使用可                         |
| `Chipset`                 |       ✅       | 変更不可・テンプレート素材のみ                   |
| `GameEngine`              |       ✅       | テンプレートのみ（TODO: 設計未確定）             |

---

## ロック判定の設計方針

`templateId` はエンティティに持たせない。`ProjectMeta.templateRegistry` で一元管理する。

```typescript
// src/types/project/projectMeta.ts

interface TemplateRegistry {
  classes: Record<string, string>; // classId    → templateId
  variables: Record<string, string>; // variableId → templateId
  dataTypes: Record<string, string>; // dataTypeId → templateId
  scripts: Record<string, string>; // scriptId   → templateId
  prefabs: Record<string, string>; // prefabId   → templateId
  maps: Record<string, string>; // mapId      → templateId
  ui: Record<string, string>; // uiId       → templateId
  chipsets: Record<string, string>; // chipsetId  → templateId
  components: Record<string, string>; // componentId → templateId
}

function isEntityLocked(
  entityId: string,
  entityType: keyof TemplateRegistry,
  registry: TemplateRegistry,
  mode: ProjectMode
): boolean {
  return mode === 'lite' && entityId in registry[entityType];
}
```

- **Full モード**: 常にアンロック（レジストリに登録されていても編集可）
- **Lite モード** × レジストリ登録済み: ロック
- **Variable の例外**: Lite でも常にアンロック（呼び出し側で除外）

---

## ProjectMeta

```typescript
interface ProjectMeta {
  id: string;
  name: string;
  mode: 'lite' | 'full'; // 作成元プロダクトの記録
  templateId?: string; // 使用テンプレートパッケージID
  templateRegistry: TemplateRegistry;
  createdAt: string;
  updatedAt: string;
}
```

### templateId と TemplateRegistry の役割分担

|          | `templateId`                                 | `TemplateRegistry`     |
| -------- | -------------------------------------------- | ---------------------- |
| 用途     | 「何のパッケージで作ったか」の表示・参照     | ロック判定             |
| Lite     | 必須（パッケージ選択時に設定）               | パッケージから一括生成 |
| Full     | 任意（部分インポート時の主テンプレート参照） | インポート毎に個別追加 |
| 消えたら | 表示が壊れるだけ                             | ロックが機能しなくなる |

### Lite インポート時の流れ

```
テンプレートパッケージ選択
  ↓
TemplatePackage を読み込む
  ↓
全エンティティをプロジェクトにコピー（スナップショット）
  ↓
ProjectMeta.templateId = package.metadata.id
TemplateRegistry に全エンティティIDを登録
```

**現状**: 型定義のみ。プロジェクト作成・ロード・ユーザーDB が未実装のため、
ストアへの組み込みは T248（プロジェクト管理基盤）で行う。

---

## 別プロダクト構成

Lite と Full は別URL・別アプリとして提供する。

```
Lite プロダクト（メイン）
  └─ templateRegistry を参照してロックを強制
  └─ isEntityLocked() を使用
  └─ テンプレート選択・インポートUI を持つ
  └─ アセットアップロード不可
  └─ Lite プロジェクトとして保存

Full プロダクト（ニッチ向け）
  └─ isEntityLocked() を呼ばない（常に全編集可）
  └─ TemplatePackage の作成・書き出し機能を持つ
  └─ アセットアップロード自由
  └─ Lite プロジェクトファイルも開ける（mode を 'full' に更新）
```

---

## 実装フェーズ

| フェーズ | 内容                                                       | タスク             |
| -------- | ---------------------------------------------------------- | ------------------ |
| Step 1   | 型定義（TemplatePackage / ProjectMeta / TemplateRegistry） | T245 ✅            |
| Step 2   | プロジェクト管理基盤（ProjectMeta ストア・作成・ロード）   | T248               |
| Step 3   | テンプレートインポートUI                                   | T249               |
| Step 4   | RPGクラシックパック作成                                    | T247               |
| Step 5   | Lite UI（制限モード）                                      | T250               |
| Step 6   | GameEngine テンプレート対応                                | T251（設計確定後） |
