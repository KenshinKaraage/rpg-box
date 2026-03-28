import { UIComponent, type PropertyDef } from '../UIComponent';

export class NavigationComponent extends UIComponent {
  readonly type = 'navigation';
  readonly label = 'ナビゲーション';

  direction: 'horizontal' | 'vertical' | 'grid' = 'vertical';
  wrap = false;
  initialIndex = 0;
  columns?: number;

  getPropertyDefs(): PropertyDef[] {
    return [
      {
        key: 'direction',
        label: '方向',
        type: 'select',
        options: [
          { value: 'vertical', label: '垂直' },
          { value: 'horizontal', label: '水平' },
          { value: 'grid', label: 'グリッド' },
        ],
      },
      { key: 'wrap', label: '折り返し', type: 'boolean' },
      { key: 'initialIndex', label: '初期インデックス', type: 'number', min: 0 },
      { key: 'columns', label: '列数(grid用)', type: 'number', min: 1 },
    ];
  }

  serialize(): unknown {
    return {
      direction: this.direction,
      wrap: this.wrap,
      initialIndex: this.initialIndex,
      columns: this.columns,
    };
  }

  deserialize(data: unknown): void {
    const d = data as Record<string, unknown>;
    this.direction = (d.direction as 'horizontal' | 'vertical' | 'grid') ?? 'vertical';
    this.wrap = (d.wrap as boolean) ?? false;
    this.initialIndex = (d.initialIndex as number) ?? 0;
    this.columns = d.columns as number | undefined;
  }

  clone(): NavigationComponent {
    const c = new NavigationComponent();
    c.direction = this.direction;
    c.wrap = this.wrap;
    c.initialIndex = this.initialIndex;
    c.columns = this.columns;
    return c;
  }

  generateRuntimeScript(): string {
    const dir = JSON.stringify(this.direction);
    const wrap = this.wrap;
    const initialIndex = this.initialIndex;
    const cols = this.columns ?? 1;

    return `({
  onShow() {
    const items = self.children.filter(c => {
      const d = c.getComponentData && c.getComponentData("navigationItem");
      return d !== null && d !== undefined;
    });
    self.state.items = items;
    self.state.focusIndex = Math.min(${initialIndex}, items.length - 1);
    self.state.result = undefined;
    this._updateCursor();
  },

  onInput(button) {
    const items = self.state.items;
    if (!items || items.length === 0) return;
    const count = items.length;
    let idx = self.state.focusIndex;
    const dir = ${dir};
    const cols = ${cols};
    let delta = 0;

    if (dir === "vertical") {
      if (button === "up") delta = -1;
      if (button === "down") delta = 1;
    } else if (dir === "horizontal") {
      if (button === "left") delta = -1;
      if (button === "right") delta = 1;
    } else if (dir === "grid") {
      if (button === "left") delta = -1;
      if (button === "right") delta = 1;
      if (button === "up") delta = -cols;
      if (button === "down") delta = cols;
    }

    if (delta !== 0) {
      let next = idx + delta;
      if (${wrap}) {
        next = ((next % count) + count) % count;
      } else {
        next = Math.max(0, Math.min(count - 1, next));
      }
      if (next !== idx) {
        self.state.focusIndex = next;
        this._updateCursor();
      }
    }

    if (button === "confirm") {
      const item = items[self.state.focusIndex];
      if (item) {
        const d = item.getComponentData && item.getComponentData("navigationItem");
        self.state.result = (d && d.itemId) || String(self.state.focusIndex);
      }
    }
    if (button === "cancel") {
      self.state.result = null;
    }
  },

  _updateCursor() {
    const items = self.state.items;
    if (!items) return;
    const focused = items[self.state.focusIndex];
    if (!focused) return;
    const cursor = self.children.find(c => {
      const d = c.getComponentData && c.getComponentData("navigationCursor");
      return d !== null && d !== undefined;
    });
    if (cursor) {
      const d = cursor.getComponentData("navigationCursor") || {};
      cursor.y = focused.y + (d.offsetY || 0);
      cursor.x = focused.x + (d.offsetX || 0);
    }
  },

  getResult() {
    return self.state.result;
  },

  getFocusIndex() {
    return self.state.focusIndex ?? 0;
  }
})`;
  }
}
