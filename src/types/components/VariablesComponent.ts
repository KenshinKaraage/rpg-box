import { Component } from './Component';

export class VariablesComponent extends Component {
  readonly type = 'variables';

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
}
