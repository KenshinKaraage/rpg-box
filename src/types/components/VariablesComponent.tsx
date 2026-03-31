'use client';

import type { ReactNode } from 'react';
import { Component } from './Component';
import type { ComponentPanelProps } from './Component';
import { VariablesPropertyPanel } from '@/features/map-editor/components/panels/VariablesPropertyPanel';

/** オブジェクト変数の1エントリ */
export interface ObjectVariable {
  /** フィールドタイプ名（number, string, boolean, class） */
  fieldType: string;
  /** 値 */
  value: unknown;
  /** クラスID（fieldType === 'class' の場合） */
  classId?: string;
}

export class VariablesComponent extends Component {
  readonly type = 'variables';
  readonly label = 'Variables';

  variables: Record<string, ObjectVariable> = {};

  serialize(): Record<string, unknown> {
    return {
      variables: structuredClone(this.variables),
    };
  }

  deserialize(data: Record<string, unknown>): void {
    const raw = data.variables as Record<string, unknown> | undefined;
    if (!raw) {
      this.variables = {};
      return;
    }
    // 新形式（ObjectVariable）か旧形式（直接値）かを判定
    const entries = Object.entries(raw);
    const isNewFormat = entries.length > 0 && entries.every(([, v]) =>
      v !== null && typeof v === 'object' && 'fieldType' in (v as Record<string, unknown>)
    );
    if (isNewFormat) {
      this.variables = structuredClone(raw) as Record<string, ObjectVariable>;
    } else {
      // 旧形式: 値の型から fieldType を推定
      this.variables = {};
      for (const [key, val] of entries) {
        const ft = typeof val === 'number' ? 'number' : typeof val === 'boolean' ? 'boolean' : 'string';
        this.variables[key] = { fieldType: ft, value: val };
      }
    }
  }

  clone(): VariablesComponent {
    const c = new VariablesComponent();
    c.variables = structuredClone(this.variables);
    return c;
  }

  renderPropertyPanel(props: ComponentPanelProps): ReactNode {
    return <VariablesPropertyPanel component={this} onChange={props.onChange} />;
  }
}
