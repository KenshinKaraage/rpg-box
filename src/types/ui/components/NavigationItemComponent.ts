import { UIComponent } from '../UIComponent';
import type { PropertyDef } from '../UIComponent';

export class NavigationItemComponent extends UIComponent {
  readonly type = 'navigationItem';
  readonly label = 'ナビゲーション項目';

  /** スクリプトに返すID（select() の戻り値） */
  itemId: string = '';

  getPropertyDefs(): PropertyDef[] {
    return [
      { key: 'itemId', label: '項目ID', type: 'string' },
    ];
  }

  serialize(): unknown {
    return { itemId: this.itemId };
  }

  deserialize(data: unknown): void {
    const d = data as Record<string, unknown>;
    this.itemId = (d.itemId as string) ?? '';
  }

  clone(): NavigationItemComponent {
    const c = new NavigationItemComponent();
    c.itemId = this.itemId;
    return c;
  }
}
