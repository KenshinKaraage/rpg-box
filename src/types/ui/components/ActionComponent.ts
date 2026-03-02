import { UIComponent } from '../UIComponent';

export interface SerializedAction {
  type: string;
  data: Record<string, unknown>;
}

export interface UIActionEntry {
  id: string;
  name: string;
  blocks: SerializedAction[];
}

export class ActionComponent extends UIComponent {
  readonly type = 'action';
  readonly label = 'アクション';

  actions: UIActionEntry[] = [];

  serialize(): unknown {
    return { actions: structuredClone(this.actions) };
  }

  deserialize(data: unknown): void {
    const d = data as Record<string, unknown>;
    const actions = d.actions as UIActionEntry[] | undefined;
    this.actions = actions ? structuredClone(actions) : [];
  }

  clone(): ActionComponent {
    const c = new ActionComponent();
    c.actions = structuredClone(this.actions);
    return c;
  }
}
