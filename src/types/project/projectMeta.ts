/**
 * プロジェクトメタ情報の型定義
 *
 * プロジェクトの動作モード（Lite / Full）と基本情報を保持する。
 * テンプレート由来エンティティの管理はエンティティに持たせず、
 * TemplateRegistry で一元管理する。
 *
 * TODO: プロジェクト作成・ロード・ユーザーDB が未実装のため、
 *       現時点では型定義のみ。ストアへの組み込みは T248 で行う。
 */

// =============================================================================
// プロジェクトモード
// =============================================================================

/**
 * プロジェクトの動作モード
 *
 * - 'lite': テンプレートを使ったお手軽RPG作成モード。
 *           templateRegistry に登録されたエンティティは編集不可。
 *           Variable のみ例外として常に編集可能。
 *
 * - 'full': フルカスタマイズモード。
 *           すべてのエンティティが編集可能。
 *           テンプレートパッケージの作成・書き出しが可能。
 */
export type ProjectMode = 'lite' | 'full';

// =============================================================================
// テンプレートレジストリ
// =============================================================================

/**
 * テンプレート由来エンティティの管理レジストリ
 *
 * エンティティ型ごとに「エンティティID → テンプレートID」のマップを保持する。
 * エンティティ自体には templateId を持たせず、ここで一元管理する。
 *
 * @example
 * // モンスタークラスが 'rpg-classic-v1' テンプレートから来た場合
 * registry.classes['monster'] === 'rpg-classic-v1'
 *
 * // ユーザーが自分で作ったクラスはレジストリに存在しない
 * registry.classes['my_class'] === undefined
 */
export interface TemplateRegistry {
  /** CustomClass id → templateId */
  classes: Record<string, string>;
  /** Variable id → templateId */
  variables: Record<string, string>;
  /** DataType id → templateId */
  dataTypes: Record<string, string>;
  /** Script id → templateId */
  scripts: Record<string, string>;
  /** Prefab id → templateId */
  prefabs: Record<string, string>;
  /** GameMap id → templateId */
  maps: Record<string, string>;
  /** UIObject id → templateId */
  ui: Record<string, string>;
  /** Chipset id → templateId */
  chipsets: Record<string, string>;
  /** Component id → templateId */
  components: Record<string, string>;
}

/**
 * 空の TemplateRegistry を生成する
 */
export function createEmptyTemplateRegistry(): TemplateRegistry {
  return {
    classes: {},
    variables: {},
    dataTypes: {},
    scripts: {},
    prefabs: {},
    maps: {},
    ui: {},
    chipsets: {},
    components: {},
  };
}

// =============================================================================
// プロジェクトメタ情報
// =============================================================================

/**
 * プロジェクトのメタ情報
 *
 * TODO: T248（プロジェクト管理基盤）で stores/projectSlice.ts に組み込む。
 */
export interface ProjectMeta {
  /** プロジェクトの一意識別子 */
  id: string;

  /** プロジェクト名 */
  name: string;

  /** 動作モード（作成元プロダクトの記録） */
  mode: ProjectMode;

  /**
   * 使用テンプレートパッケージID
   * - Lite: 必須。プロジェクト作成時に選択したパッケージの metadata.id。
   *         TemplateRegistry はこのパッケージから一括生成される。
   * - Full: 任意。部分インポート時の「主テンプレート」参照として使用。
   *         表示・バージョン管理用途のみ。ロック判定には使わない。
   */
  templateId?: string;

  /**
   * テンプレート由来エンティティの管理レジストリ
   * ロック判定に使用する。templateId とは独立して管理する。
   */
  templateRegistry: TemplateRegistry;

  /** 作成日時（ISO 8601） */
  createdAt: string;

  /** 最終更新日時（ISO 8601） */
  updatedAt: string;
}

// =============================================================================
// ロック判定ユーティリティ
// =============================================================================

/**
 * エンティティが編集ロックされているかを判定する
 *
 * ロック条件:
 * - Full モード → 常に false（レジストリに登録されていても編集可）
 * - Lite モード × レジストリ未登録 → false（ユーザー作成エンティティ）
 * - Lite モード × レジストリ登録済み → true（テンプレート由来エンティティ）
 *
 * 例外: Variable は Lite モードでも常に false（呼び出し側で除外すること）
 *
 * @param entityId 判定対象のエンティティID
 * @param entityType レジストリのキー名
 * @param registry TemplateRegistry
 * @param mode プロジェクトの動作モード
 */
export function isEntityLocked(
  entityId: string,
  entityType: keyof TemplateRegistry,
  registry: TemplateRegistry,
  mode: ProjectMode
): boolean {
  return mode === 'lite' && entityId in registry[entityType];
}
