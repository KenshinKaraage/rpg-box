/**
 * テンプレートパッケージの型定義
 *
 * Lite ユーザーが使用するテンプレートのインポート単位。
 * Full ユーザーが作成し、Lite ユーザーが選択・インポートする。
 *
 * 設計方針:
 * - スナップショット型（コピーして取り込む、テンプレート本体への参照は持たない）
 * - 部分インポート可能（classes だけ、scripts だけ等）
 *
 * TODO: TestEngine テンプレート対応
 *   src/engine/ 以下のゲームエンジン（TestEngine / EventRunner / actions 等）も
 *   Lite ではテンプレートのみ使用可能・Full では自由に改造可能とする予定。
 *   ただし「エンジンをどう編集するか / どうコードで実装するか」が未設計のため、
 *   TemplatePackage への engine フィールド追加は設計確定後に行う。
 */

import type { CustomClass } from './customClass';
import type { Variable } from './variable';
import type { DataType } from './data';
import type { Script } from './script';
import type { Prefab, GameMap, Chipset } from './map';
import type { UIObject } from './ui/UIComponent';

// =============================================================================
// テンプレートメタデータ
// =============================================================================

/**
 * テンプレートパッケージのメタデータ
 */
export interface TemplateMetadata {
  /** テンプレートの一意識別子 */
  id: string;

  /** テンプレート名（例: "クラシックRPGパック"） */
  name: string;

  /** 説明文 */
  description: string;

  /** バージョン（例: "1.0.0"） */
  version: string;

  /** 作者名 */
  author: string;

  /** 検索・分類用タグ（例: ['rpg', 'classic', 'battle']） */
  tags: string[];

  /** サムネイル画像のURL（オプション） */
  thumbnail?: string;
}

// =============================================================================
// テンプレートパッケージ
// =============================================================================

/**
 * テンプレートパッケージ
 *
 * 各フィールドは省略可能。部分インポートをサポートするため、
 * 必要なエンティティのみ含めることができる。
 *
 * @example
 * // クラス定義とデフォルト変数だけのパッケージ
 * const pack: TemplatePackage = {
 *   metadata: { id: 'rpg-classic', name: 'クラシックRPG', ... },
 *   classes: [monsterClass, itemClass],
 *   variables: [goldVar, partyHpVar],
 * };
 */
export interface TemplatePackage {
  /** メタデータ（必須） */
  metadata: TemplateMetadata;

  /** カスタムクラス定義（ステータス型・構造体など）- Lite では isLocked=true */
  classes?: CustomClass[];

  /** 変数プリセット（所持金・フラグなど）- Lite でも追加・編集・削除可能 */
  variables?: Variable[];

  /** データタイプ定義（モンスターDB・アイテムDBなど）- Lite では isLocked=true */
  dataTypes?: DataType[];

  /** スクリプト（バトルロジック・イベントロジックなど）- Lite では isLocked=true */
  scripts?: Script[];

  /** プレハブ定義（NPC・宝箱・サインなど）- Lite では isLocked=true */
  prefabs?: Prefab[];

  /** マップテンプレート（フィールド定義を含む雛形）*/
  maps?: GameMap[];

  /** チップセット（Lite では変更不可・追加不可） */
  chipsets?: Chipset[];

  /** UIオブジェクト（バトル画面・メニュー画面など）- Lite では isLocked=true */
  ui?: UIObject[];

  // TODO: engine?: TestEngineConfig
  //   ゲームエンジン（src/engine/ 以下）のテンプレート対応。
  //   Lite ではエンジン全体（TestEngine / EventRunner / actions）がテンプレートのみ使用可能、
  //   Full では自由に改造可能とする。
  //   設計（編集方法・実装方法）が確定次第追加する。
}
