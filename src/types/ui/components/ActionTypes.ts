/**
 * UIアクションの直列化型
 *
 * UIFunction, TemplateControllerComponent 等で共用される。
 */

export interface SerializedAction {
  type: string;
  data: Record<string, unknown>;
}

export interface UIActionEntry {
  id: string;
  name: string;
  blocks: SerializedAction[];
}
