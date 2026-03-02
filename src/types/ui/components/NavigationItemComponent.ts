import { UIComponent } from '../UIComponent';

export class NavigationItemComponent extends UIComponent {
  readonly type = 'navigationItem';
  readonly label = 'ナビゲーション項目';

  serialize(): unknown {
    return {};
  }

  deserialize(_data: unknown): void {
    // no properties to deserialize
  }

  clone(): NavigationItemComponent {
    return new NavigationItemComponent();
  }
}
