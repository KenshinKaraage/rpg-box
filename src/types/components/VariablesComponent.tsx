'use client';

import type { ReactNode } from 'react';
import { Component } from './Component';
import type { ComponentPanelProps } from './Component';
import { VariablesPropertyPanel } from '@/features/map-editor/components/panels/VariablesPropertyPanel';

export class VariablesComponent extends Component {
  readonly type = 'variables';
  readonly label = 'Variables';

  variables: Record<string, unknown> = {};

  serialize(): Record<string, unknown> {
    return {
      variables: structuredClone(this.variables),
    };
  }

  deserialize(data: Record<string, unknown>): void {
    const vars = data.variables as Record<string, unknown> | undefined;
    this.variables = vars ? structuredClone(vars) : {};
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
