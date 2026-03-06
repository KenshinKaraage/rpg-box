import { UIComponent } from '../UIComponent';
import type { SerializedAction } from './ActionTypes';

export interface TemplateArg {
  id: string;
  name: string;
  fieldType: string;
  defaultValue: unknown;
}

export class TemplateControllerComponent extends UIComponent {
  readonly type = 'templateController';
  readonly label = 'テンプレートコントローラー';

  args: TemplateArg[] = [];
  /** 生成時に1回実行（例: ダメージポップ出現） */
  onSpawnActions: SerializedAction[] = [];
  /** データ更新時に毎回実行（例: キャラパネル更新） */
  onApplyActions: SerializedAction[] = [];

  serialize(): unknown {
    return {
      args: structuredClone(this.args),
      onSpawnActions: structuredClone(this.onSpawnActions),
      onApplyActions: structuredClone(this.onApplyActions),
    };
  }

  deserialize(data: unknown): void {
    const d = data as Record<string, unknown>;
    const args = d.args as TemplateArg[] | undefined;
    const onSpawnActions = d.onSpawnActions as SerializedAction[] | undefined;
    const onApplyActions = d.onApplyActions as SerializedAction[] | undefined;
    this.args = args ? structuredClone(args) : [];
    this.onSpawnActions = onSpawnActions ? structuredClone(onSpawnActions) : [];
    this.onApplyActions = onApplyActions ? structuredClone(onApplyActions) : [];
  }

  clone(): TemplateControllerComponent {
    const c = new TemplateControllerComponent();
    c.args = structuredClone(this.args);
    c.onSpawnActions = structuredClone(this.onSpawnActions);
    c.onApplyActions = structuredClone(this.onApplyActions);
    return c;
  }
}
