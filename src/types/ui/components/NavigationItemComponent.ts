import { UIComponent } from '../UIComponent';

export interface SerializedAction {
  type: string;
  data: Record<string, unknown>;
}

export class NavigationItemComponent extends UIComponent {
  readonly type = 'navigationItem';
  readonly label = 'ナビゲーション項目';

  onSelectActions: SerializedAction[] = [];

  serialize(): unknown {
    return { onSelectActions: structuredClone(this.onSelectActions) };
  }

  deserialize(data: unknown): void {
    const d = data as Record<string, unknown>;
    const actions = d.onSelectActions as SerializedAction[] | undefined;
    this.onSelectActions = actions ? structuredClone(actions) : [];
  }

  clone(): NavigationItemComponent {
    const c = new NavigationItemComponent();
    c.onSelectActions = structuredClone(this.onSelectActions);
    return c;
  }
}
