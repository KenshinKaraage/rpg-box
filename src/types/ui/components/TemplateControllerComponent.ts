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

  generateRuntimeScript(): string | null {
    const onSpawnJson = JSON.stringify(this.onSpawnActions);
    const onApplyJson = JSON.stringify(this.onApplyActions);

    return `({
  apply(data) {
    if (Array.isArray(data)) {
      this.applyList(data);
      return;
    }
    this.applyList([data]);
  },

  async applyList(array) {
    const templateId = self.object.id;
    const templateParentId = self.state._templateParentId;
    const onSpawnActions = ${onSpawnJson};
    const onApplyActions = ${onApplyJson};

    // テンプレート自体を非表示
    self.object.visible = false;

    const instances = self.state._instances || [];
    if (!self.state._cloneCounter) self.state._cloneCounter = 0;
    const needed = array.length;

    // 不足分をクローンで追加
    while (instances.length < needed) {
      const idx = self.state._cloneCounter++;
      const idPrefix = templateId + "_inst" + idx;
      const result = self.cloneObject(templateId, templateParentId, idPrefix);
      if (!result) break;
      const proxy = self.getObjectById(result.rootId);
      if (proxy) {
        proxy.visible = true;
        instances.push({ id: result.rootId, idMap: result.idMap });
        // onSpawnActions 実行
        if (onSpawnActions.length > 0) {
          await self.executeActions(onSpawnActions, {}, result.idMap);
        }
      }
    }

    // 余りを非表示
    for (let i = needed; i < instances.length; i++) {
      const proxy = self.getObjectById(instances[i].id);
      if (proxy) proxy.visible = false;
    }

    // 各インスタンスにデータをバインド
    for (let i = 0; i < needed; i++) {
      const inst = instances[i];
      const proxy = self.getObjectById(inst.id);
      if (!proxy) continue;
      const data = array[i];
      if (!data || typeof data !== "object") continue;

      // onApplyActions 実行（data のキーを引数として渡す）
      const args = {};
      for (const key in data) {
        args[key] = String(data[key]);
      }
      if (onApplyActions.length > 0) {
        await self.executeActions(onApplyActions, args, inst.idMap);
      }
    }

    self.state._instances = instances;
  },

  getInstanceCount() {
    return (self.state._instances || []).filter((inst) => {
      const p = self.getObjectById(inst.id);
      return p && p.visible;
    }).length;
  }
})`;
  }

  clone(): TemplateControllerComponent {
    const c = new TemplateControllerComponent();
    c.args = structuredClone(this.args);
    c.onSpawnActions = structuredClone(this.onSpawnActions);
    c.onApplyActions = structuredClone(this.onApplyActions);
    return c;
  }
}
