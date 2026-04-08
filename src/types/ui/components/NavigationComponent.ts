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
  async activate() {
    const items = self.children.filter(c => {
      if (!c.visible) return false;
      const d = c.getComponentData && c.getComponentData("navigationItem");
      return d !== null && d !== undefined;
    });
    self.state.items = items;
    // 前回の位置を維持（初回は initialIndex）
    const prevIndex = self.state.focusIndex;
    if (prevIndex !== undefined && prevIndex >= 0 && prevIndex < items.length) {
      self.state.focusIndex = prevIndex;
    } else {
      self.state.focusIndex = Math.min(${initialIndex}, Math.max(0, items.length - 1));
    }
    self.state._result = undefined;
    self.state.active = true;
    // 1フレーム待ってレイアウト適用後の位置でカーソルを配置
    await self.waitFrames(1);
    this._updateCursor();
  },

  async result() {
    while (self.state._result === undefined) {
      await self.waitFrames(1);
    }
    const r = self.state._result;
    self.state._result = undefined;
    self.state.active = false;
    return r;
  },

  onInput(button) {
    if (!self.state.active) return;
    const items = self.state.items;
    if (!items || items.length === 0) return;
    const count = items.length;
    let idx = self.state.focusIndex;
    let delta = 0;

    if (${dir} === "vertical") {
      if (button === "up") delta = -1;
      if (button === "down") delta = 1;
    } else if (${dir} === "horizontal") {
      if (button === "left") delta = -1;
      if (button === "right") delta = 1;
    } else if (${dir} === "grid") {
      if (button === "left") delta = -1;
      if (button === "right") delta = 1;
      if (button === "up") delta = -${cols};
      if (button === "down") delta = ${cols};
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
        if (typeof self.state._onIndexChange === "function") {
          self.state._onIndexChange(next);
        }
      }
    }

    if (button === "confirm") {
      const item = items[self.state.focusIndex];
      if (item) {
        const d = item.getComponentData && item.getComponentData("navigationItem");
        self.state._result = (d && d.itemId) || String(self.state.focusIndex);
      }
    }
    if (button === "cancel") {
      self.state._result = null;
    }
  },

  setOnIndexChange(fn) {
    self.state._onIndexChange = fn;
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
      const ax = d.anchorX || "left";
      const ay = d.anchorY || "top";
      // 基準点: アイテムのアンカー位置 - カーソルの中心
      let bx = focused.x;
      if (ax === "center") bx = focused.x + focused.width / 2 - cursor.width / 2;
      else if (ax === "right") bx = focused.x + focused.width - cursor.width;
      let by = focused.y;
      if (ay === "center") by = focused.y + focused.height / 2 - cursor.height / 2;
      else if (ay === "bottom") by = focused.y + focused.height - cursor.height;
      cursor.x = bx + (d.offsetX || 0);
      cursor.y = by + (d.offsetY || 0);
    }
  },

  getFocusIndex() {
    return self.state.focusIndex ?? 0;
  }
})`;
  }
}
