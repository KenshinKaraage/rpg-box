import { UIComponent, type PropertyDef } from '../UIComponent';

export class InputFieldComponent extends UIComponent {
  readonly type = 'inputField';
  readonly label = '入力フィールド';

  /** 最大文字数（0 = 無制限） */
  maxLength = 0;
  /** カーソル色 */
  cursorColor = '#ffdd44';
  /** プレースホルダー */
  placeholder = '';

  /** ランタイム: カーソル位置（-1 = 非表示）— レンダラーが参照 */
  cursorPos = -1;
  /** ランタイム: TextComponent と同じフォントサイズ — レンダラーがカーソル位置計算に使用 */
  fontSize = 24;
  /** ランタイム: TextComponent の現在テキスト — レンダラーがカーソル位置計算に使用 */
  currentText = '';

  getPropertyDefs(): PropertyDef[] {
    return [
      { key: 'placeholder', label: 'プレースホルダー', type: 'text' },
      { key: 'maxLength', label: '最大文字数', type: 'number', min: 0 },
      { key: 'cursorColor', label: 'カーソル色', type: 'color' },
    ];
  }

  serialize(): unknown {
    return {
      maxLength: this.maxLength,
      cursorColor: this.cursorColor,
      placeholder: this.placeholder,
      cursorPos: this.cursorPos,
      fontSize: this.fontSize,
      currentText: this.currentText,
    };
  }

  deserialize(data: unknown): void {
    const d = data as Record<string, unknown>;
    this.maxLength = (d.maxLength as number) ?? 0;
    this.cursorColor = (d.cursorColor as string) ?? '#ffdd44';
    this.placeholder = (d.placeholder as string) ?? '';
    this.cursorPos = (d.cursorPos as number) ?? -1;
    this.fontSize = (d.fontSize as number) ?? 24;
    this.currentText = (d.currentText as string) ?? '';
  }

  clone(): InputFieldComponent {
    const c = new InputFieldComponent();
    c.maxLength = this.maxLength;
    c.cursorColor = this.cursorColor;
    c.placeholder = this.placeholder;
    return c;
  }

  generateRuntimeScript(): string {
    const maxLen = this.maxLength;
    const placeholder = JSON.stringify(this.placeholder);

    return `({
  activate(initialValue) {
    self.state.value = initialValue || "";
    self.state.confirmed = false;
    self.state.cancelled = false;
    self.state.active = true;
    self.state.blinkTimer = 0;
    self.state.cursorVisible = true;
    Input.startTextInput(initialValue || "");

    // TextComponent にプレースホルダーか初期値を表示
    const text = initialValue || "";
    self.object.setProperty("text", "content", text || ${placeholder});
    this._syncCursor();
  },

  async result() {
    while (!self.state.confirmed && !self.state.cancelled) {
      await self.waitFrames(1);
    }
    Input.stopTextInput();
    self.state.active = false;
    // カーソル非表示
    self.object.setProperty("inputField", "cursorPos", -1);
    if (self.state.cancelled) return null;
    return self.state.value;
  },

  onUpdate(dt) {
    if (!self.state.active) return;

    // テキスト同期
    let text = Input.getTextValue();
    ${maxLen > 0 ? `if (text.length > ${maxLen}) text = text.slice(0, ${maxLen});` : ''}
    self.state.value = text;

    // TextComponent を更新
    self.object.setProperty("text", "content", text || ${placeholder});

    // 確定/キャンセル判定
    if (Input.isTextConfirmed()) self.state.confirmed = true;
    if (Input.isTextCancelled()) self.state.cancelled = true;

    // カーソル点滅
    self.state.blinkTimer += dt * 1000;
    if (self.state.blinkTimer > 530) {
      self.state.blinkTimer = 0;
      self.state.cursorVisible = !self.state.cursorVisible;
    }

    this._syncCursor();
  },

  _syncCursor() {
    if (self.state.active && self.state.cursorVisible) {
      const pos = Input.getTextCursorPos();
      self.object.setProperty("inputField", "cursorPos", pos);
      self.object.setProperty("inputField", "currentText", self.state.value || "");
      // TextComponent の fontSize を読んでレンダラーに伝える
      const textData = self.object.getComponentData("text");
      if (textData) {
        self.object.setProperty("inputField", "fontSize", textData.fontSize || 24);
      }
    } else {
      self.object.setProperty("inputField", "cursorPos", -1);
    }
  },

  getValue() {
    return self.state.value || "";
  }
})`;
  }
}
