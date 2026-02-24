# Phase 10: マップ基盤 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Component 基底クラスの UI 分離リファクタ + 13 の組み込みコンポーネント実装 + マップ型定義を行い、マップシステムのランタイム基盤を完成させる。

**Architecture:** EventAction と同じ UI 分離パターンを Component にも適用する。Component 基底クラスから `renderPropertyPanel()` を削除し、ランタイム専用にする。各コンポーネントは `serialize/deserialize/clone` + ライフサイクルメソッド（`onCreate/onUpdate/onDestroy/onEnable/onDisable`）を持つ。ライフサイクルはデフォルト no-op（何もしない空メソッド）で、ロジックが必要なコンポーネントだけが override する。実処理の中身は Phase 18（ゲームループ）で実装する。エディタ UI は後続フェーズで `src/features/map-editor/` に実装する。レジストリは既存の `src/types/components/index.ts` をそのまま使用。

**Tech Stack:** TypeScript, Jest, 既存の Component レジストリパターン

---

## Task 0: Component 基底クラスから renderPropertyPanel を削除

**Files:**

- Modify: `src/types/components/Component.ts`
- Modify: `src/types/components/index.test.ts`

**Step 1: Component.ts から renderPropertyPanel を削除し、ライフサイクルメソッドを追加**

```typescript
// src/types/components/Component.ts
import type { GameContext } from '@/engine/runtime/GameContext';

/**
 * コンポーネントの基底抽象クラス（ランタイム専用、UI メソッドなし）
 *
 * マップオブジェクトに付与できる機能単位。
 * エディタ UI は src/features/map-editor/ に別途実装する。
 *
 * ライフサイクルメソッドはデフォルト no-op。
 * ロジックが必要なコンポーネントだけが override する。
 * 実処理の中身は Phase 18（ゲームループ）で実装する。
 */
export abstract class Component {
  abstract readonly type: string;

  // データ永続化
  abstract serialize(): Record<string, unknown>;
  abstract deserialize(data: Record<string, unknown>): void;
  abstract clone(): Component;

  // ライフサイクル（デフォルト no-op）
  onCreate(_context: GameContext): void {}
  onUpdate(_context: GameContext, _deltaTime: number): void {}
  onDestroy(_context: GameContext): void {}
  onEnable(_context: GameContext): void {}
  onDisable(_context: GameContext): void {}
}
```

ポイント:

- `renderPropertyPanel()` を削除
- `import type { ReactNode }` を削除
- `serialize()` の戻り値を `unknown` → `Record<string, unknown>` に変更（EventAction.toJSON() と統一）
- `deserialize()` の引数も同様
- ライフサイクルメソッド5つを追加（デフォルト no-op、abstract ではない）
- `import type` で GameContext を参照（型のみなので循環依存なし）
- JSDoc のサンプルコードから renderPropertyPanel を削除

**Step 2: テストの TestComponent / AnotherComponent から renderPropertyPanel を削除**

`index.test.ts` の `TestComponent` と `AnotherComponent` から `renderPropertyPanel()` メソッドと `import type { ReactNode }` を削除。

ライフサイクルメソッドのテストを追加:

```typescript
describe('Component lifecycle', () => {
  it('lifecycle methods are callable and no-op by default', () => {
    const component = new TestComponent();
    const mockContext = {} as GameContext;
    // デフォルトでエラーなく呼べることを確認
    expect(() => component.onCreate(mockContext)).not.toThrow();
    expect(() => component.onUpdate(mockContext, 16)).not.toThrow();
    expect(() => component.onDestroy(mockContext)).not.toThrow();
    expect(() => component.onEnable(mockContext)).not.toThrow();
    expect(() => component.onDisable(mockContext)).not.toThrow();
  });
});
```

**Step 3: テスト実行**

Run: `npx jest src/types/components/index.test.ts --verbose`
Expected: 全テスト PASS

**Step 4: コミット**

```bash
git add src/types/components/Component.ts src/types/components/index.test.ts
git commit -m "refactor(components): remove renderPropertyPanel from Component base class [T133]

UI methods removed for runtime/editor separation (same pattern as EventAction).
Editor UI will be in src/features/map-editor/."
```

---

## Task 1: TransformComponent 実装

**Files:**

- Create: `src/types/components/TransformComponent.ts`
- Create: `src/types/components/TransformComponent.test.ts`

**Step 1: テスト作成**

```typescript
// src/types/components/TransformComponent.test.ts
import { TransformComponent } from './TransformComponent';

describe('TransformComponent', () => {
  it('has type "transform"', () => {
    const c = new TransformComponent();
    expect(c.type).toBe('transform');
  });

  it('has correct defaults', () => {
    const c = new TransformComponent();
    expect(c.x).toBe(0);
    expect(c.y).toBe(0);
    expect(c.rotation).toBe(0);
    expect(c.scaleX).toBe(1);
    expect(c.scaleY).toBe(1);
  });

  it('serializes all properties', () => {
    const c = new TransformComponent();
    c.x = 10;
    c.y = 20;
    c.rotation = 90;
    c.scaleX = 2;
    c.scaleY = 0.5;
    expect(c.serialize()).toEqual({ x: 10, y: 20, rotation: 90, scaleX: 2, scaleY: 0.5 });
  });

  it('deserializes all properties', () => {
    const c = new TransformComponent();
    c.deserialize({ x: 5, y: 15, rotation: 45, scaleX: 3, scaleY: 2 });
    expect(c.x).toBe(5);
    expect(c.y).toBe(15);
    expect(c.rotation).toBe(45);
    expect(c.scaleX).toBe(3);
    expect(c.scaleY).toBe(2);
  });

  it('deserializes with defaults for missing properties', () => {
    const c = new TransformComponent();
    c.deserialize({});
    expect(c.x).toBe(0);
    expect(c.y).toBe(0);
    expect(c.rotation).toBe(0);
    expect(c.scaleX).toBe(1);
    expect(c.scaleY).toBe(1);
  });

  it('clones independently', () => {
    const original = new TransformComponent();
    original.x = 100;
    original.y = 200;
    const cloned = original.clone();
    expect(cloned).not.toBe(original);
    expect(cloned.x).toBe(100);
    cloned.x = 999;
    expect(original.x).toBe(100);
  });
});
```

**Step 2: テスト実行（失敗確認）**

Run: `npx jest src/types/components/TransformComponent.test.ts --verbose`
Expected: FAIL (module not found)

**Step 3: 実装**

```typescript
// src/types/components/TransformComponent.ts
import { Component } from './Component';

export class TransformComponent extends Component {
  readonly type = 'transform';
  x = 0;
  y = 0;
  rotation = 0;
  scaleX = 1;
  scaleY = 1;

  serialize(): Record<string, unknown> {
    return {
      x: this.x,
      y: this.y,
      rotation: this.rotation,
      scaleX: this.scaleX,
      scaleY: this.scaleY,
    };
  }

  deserialize(data: Record<string, unknown>): void {
    this.x = (data.x as number) ?? 0;
    this.y = (data.y as number) ?? 0;
    this.rotation = (data.rotation as number) ?? 0;
    this.scaleX = (data.scaleX as number) ?? 1;
    this.scaleY = (data.scaleY as number) ?? 1;
  }

  clone(): TransformComponent {
    const c = new TransformComponent();
    c.x = this.x;
    c.y = this.y;
    c.rotation = this.rotation;
    c.scaleX = this.scaleX;
    c.scaleY = this.scaleY;
    return c;
  }
}
```

**Step 4: テスト実行（成功確認）**

Run: `npx jest src/types/components/TransformComponent.test.ts --verbose`
Expected: 全テスト PASS

**Step 5: コミット**

```bash
git add src/types/components/TransformComponent.ts src/types/components/TransformComponent.test.ts
git commit -m "feat(components): implement TransformComponent [T133]"
```

---

## Task 2: SpriteComponent 実装

**Files:**

- Create: `src/types/components/SpriteComponent.ts`
- Create: `src/types/components/SpriteComponent.test.ts`

**Step 1: テスト作成**

```typescript
// src/types/components/SpriteComponent.test.ts
import { SpriteComponent } from './SpriteComponent';

describe('SpriteComponent', () => {
  it('has type "sprite"', () => {
    expect(new SpriteComponent().type).toBe('sprite');
  });

  it('has correct defaults', () => {
    const c = new SpriteComponent();
    expect(c.imageId).toBeUndefined();
    expect(c.animationId).toBeUndefined();
    expect(c.flipX).toBe(false);
    expect(c.flipY).toBe(false);
    expect(c.tint).toBeUndefined();
    expect(c.opacity).toBe(1);
  });

  it('round-trips serialize/deserialize', () => {
    const c = new SpriteComponent();
    c.imageId = 'img_001';
    c.animationId = 'anim_walk';
    c.flipX = true;
    c.opacity = 0.5;
    c.tint = '#ff0000';

    const data = c.serialize();
    const c2 = new SpriteComponent();
    c2.deserialize(data);

    expect(c2.imageId).toBe('img_001');
    expect(c2.animationId).toBe('anim_walk');
    expect(c2.flipX).toBe(true);
    expect(c2.flipY).toBe(false);
    expect(c2.opacity).toBe(0.5);
    expect(c2.tint).toBe('#ff0000');
  });

  it('clones independently', () => {
    const c = new SpriteComponent();
    c.imageId = 'test';
    const cloned = c.clone();
    cloned.imageId = 'changed';
    expect(c.imageId).toBe('test');
  });
});
```

**Step 2: 実装**

```typescript
// src/types/components/SpriteComponent.ts
import { Component } from './Component';

export class SpriteComponent extends Component {
  readonly type = 'sprite';
  imageId?: string;
  animationId?: string;
  flipX = false;
  flipY = false;
  tint?: string;
  opacity = 1;

  serialize(): Record<string, unknown> {
    return {
      imageId: this.imageId,
      animationId: this.animationId,
      flipX: this.flipX,
      flipY: this.flipY,
      tint: this.tint,
      opacity: this.opacity,
    };
  }

  deserialize(data: Record<string, unknown>): void {
    this.imageId = data.imageId as string | undefined;
    this.animationId = data.animationId as string | undefined;
    this.flipX = (data.flipX as boolean) ?? false;
    this.flipY = (data.flipY as boolean) ?? false;
    this.tint = data.tint as string | undefined;
    this.opacity = (data.opacity as number) ?? 1;
  }

  clone(): SpriteComponent {
    const c = new SpriteComponent();
    c.imageId = this.imageId;
    c.animationId = this.animationId;
    c.flipX = this.flipX;
    c.flipY = this.flipY;
    c.tint = this.tint;
    c.opacity = this.opacity;
    return c;
  }
}
```

**Step 3: テスト実行**

Run: `npx jest src/types/components/SpriteComponent.test.ts --verbose`
Expected: 全テスト PASS

**Step 4: コミット**

```bash
git add src/types/components/SpriteComponent.ts src/types/components/SpriteComponent.test.ts
git commit -m "feat(components): implement SpriteComponent [T134]"
```

---

## Task 3: ColliderComponent 実装

**Files:**

- Create: `src/types/components/ColliderComponent.ts`
- Create: `src/types/components/ColliderComponent.test.ts`

**Step 1: テスト作成**

```typescript
// src/types/components/ColliderComponent.test.ts
import { ColliderComponent } from './ColliderComponent';

describe('ColliderComponent', () => {
  it('has type "collider"', () => {
    expect(new ColliderComponent().type).toBe('collider');
  });

  it('has correct defaults', () => {
    const c = new ColliderComponent();
    expect(c.width).toBe(1);
    expect(c.height).toBe(1);
    expect(c.passable).toBe(false);
    expect(c.layer).toBe(0);
  });

  it('round-trips serialize/deserialize', () => {
    const c = new ColliderComponent();
    c.width = 2;
    c.height = 3;
    c.passable = true;
    c.layer = 1;

    const c2 = new ColliderComponent();
    c2.deserialize(c.serialize());

    expect(c2.width).toBe(2);
    expect(c2.height).toBe(3);
    expect(c2.passable).toBe(true);
    expect(c2.layer).toBe(1);
  });

  it('clones independently', () => {
    const c = new ColliderComponent();
    c.width = 5;
    const cloned = c.clone();
    cloned.width = 10;
    expect(c.width).toBe(5);
  });
});
```

**Step 2: 実装**

```typescript
// src/types/components/ColliderComponent.ts
import { Component } from './Component';

export class ColliderComponent extends Component {
  readonly type = 'collider';
  width = 1; // グリッド単位
  height = 1;
  passable = false;
  layer = 0;

  serialize(): Record<string, unknown> {
    return { width: this.width, height: this.height, passable: this.passable, layer: this.layer };
  }

  deserialize(data: Record<string, unknown>): void {
    this.width = (data.width as number) ?? 1;
    this.height = (data.height as number) ?? 1;
    this.passable = (data.passable as boolean) ?? false;
    this.layer = (data.layer as number) ?? 0;
  }

  clone(): ColliderComponent {
    const c = new ColliderComponent();
    c.width = this.width;
    c.height = this.height;
    c.passable = this.passable;
    c.layer = this.layer;
    return c;
  }
}
```

**Step 3: テスト実行**

Run: `npx jest src/types/components/ColliderComponent.test.ts --verbose`
Expected: 全テスト PASS

**Step 4: コミット**

```bash
git add src/types/components/ColliderComponent.ts src/types/components/ColliderComponent.test.ts
git commit -m "feat(components): implement ColliderComponent [T135]"
```

---

## Task 4: MovementComponent 実装

**Files:**

- Create: `src/types/components/MovementComponent.ts`
- Create: `src/types/components/MovementComponent.test.ts`

**Step 1: テスト作成**

```typescript
// src/types/components/MovementComponent.test.ts
import { MovementComponent } from './MovementComponent';

describe('MovementComponent', () => {
  it('has type "movement"', () => {
    expect(new MovementComponent().type).toBe('movement');
  });

  it('has correct defaults', () => {
    const c = new MovementComponent();
    expect(c.pattern).toBe('fixed');
    expect(c.speed).toBe(1);
    expect(c.routePoints).toEqual([]);
  });

  it('round-trips serialize/deserialize', () => {
    const c = new MovementComponent();
    c.pattern = 'route';
    c.speed = 2;
    c.routePoints = [
      { x: 0, y: 0 },
      { x: 5, y: 10 },
    ];

    const c2 = new MovementComponent();
    c2.deserialize(c.serialize());

    expect(c2.pattern).toBe('route');
    expect(c2.speed).toBe(2);
    expect(c2.routePoints).toEqual([
      { x: 0, y: 0 },
      { x: 5, y: 10 },
    ]);
  });

  it('clones independently (routePoints deep copy)', () => {
    const c = new MovementComponent();
    c.routePoints = [{ x: 1, y: 2 }];
    const cloned = c.clone();
    cloned.routePoints[0]!.x = 999;
    expect(c.routePoints[0]!.x).toBe(1);
  });
});
```

**Step 2: 実装**

```typescript
// src/types/components/MovementComponent.ts
import { Component } from './Component';

export interface RoutePoint {
  x: number;
  y: number;
}

export class MovementComponent extends Component {
  readonly type = 'movement';
  pattern: 'fixed' | 'random' | 'route' = 'fixed';
  speed = 1;
  routePoints: RoutePoint[] = [];

  serialize(): Record<string, unknown> {
    return { pattern: this.pattern, speed: this.speed, routePoints: this.routePoints };
  }

  deserialize(data: Record<string, unknown>): void {
    this.pattern = (data.pattern as MovementComponent['pattern']) ?? 'fixed';
    this.speed = (data.speed as number) ?? 1;
    this.routePoints = (data.routePoints as RoutePoint[]) ?? [];
  }

  clone(): MovementComponent {
    const c = new MovementComponent();
    c.pattern = this.pattern;
    c.speed = this.speed;
    c.routePoints = this.routePoints.map((p) => ({ ...p }));
    return c;
  }
}
```

**Step 3: テスト実行**

Run: `npx jest src/types/components/MovementComponent.test.ts --verbose`
Expected: 全テスト PASS

**Step 4: コミット**

```bash
git add src/types/components/MovementComponent.ts src/types/components/MovementComponent.test.ts
git commit -m "feat(components): implement MovementComponent [T136]"
```

---

## Task 5: VariablesComponent 実装

**Files:**

- Create: `src/types/components/VariablesComponent.ts`
- Create: `src/types/components/VariablesComponent.test.ts`

**Step 1: テスト作成**

```typescript
// src/types/components/VariablesComponent.test.ts
import { VariablesComponent } from './VariablesComponent';

describe('VariablesComponent', () => {
  it('has type "variables"', () => {
    expect(new VariablesComponent().type).toBe('variables');
  });

  it('has empty variables by default', () => {
    const c = new VariablesComponent();
    expect(c.variables).toEqual({});
  });

  it('round-trips serialize/deserialize', () => {
    const c = new VariablesComponent();
    c.variables = { hp: 100, name: 'スライム', active: true };

    const c2 = new VariablesComponent();
    c2.deserialize(c.serialize());

    expect(c2.variables).toEqual({ hp: 100, name: 'スライム', active: true });
  });

  it('clones independently (deep copy)', () => {
    const c = new VariablesComponent();
    c.variables = { hp: 100 };
    const cloned = c.clone();
    cloned.variables['hp'] = 999;
    expect(c.variables['hp']).toBe(100);
  });
});
```

**Step 2: 実装**

```typescript
// src/types/components/VariablesComponent.ts
import { Component } from './Component';

export class VariablesComponent extends Component {
  readonly type = 'variables';
  variables: Record<string, unknown> = {};

  serialize(): Record<string, unknown> {
    return { variables: this.variables };
  }

  deserialize(data: Record<string, unknown>): void {
    this.variables = (data.variables as Record<string, unknown>) ?? {};
  }

  clone(): VariablesComponent {
    const c = new VariablesComponent();
    c.variables = structuredClone(this.variables);
    return c;
  }
}
```

**Step 3: テスト実行**

Run: `npx jest src/types/components/VariablesComponent.test.ts --verbose`
Expected: 全テスト PASS

**Step 4: コミット**

```bash
git add src/types/components/VariablesComponent.ts src/types/components/VariablesComponent.test.ts
git commit -m "feat(components): implement VariablesComponent [T137]"
```

---

## Task 6: ControllerComponent 実装

**Files:**

- Create: `src/types/components/ControllerComponent.ts`
- Create: `src/types/components/ControllerComponent.test.ts`

**Step 1: テスト作成**

```typescript
// src/types/components/ControllerComponent.test.ts
import { ControllerComponent } from './ControllerComponent';

describe('ControllerComponent', () => {
  it('has type "controller"', () => {
    expect(new ControllerComponent().type).toBe('controller');
  });

  it('has correct defaults', () => {
    const c = new ControllerComponent();
    expect(c.moveSpeed).toBe(1);
    expect(c.dashEnabled).toBe(true);
    expect(c.inputEnabled).toBe(true);
  });

  it('round-trips serialize/deserialize', () => {
    const c = new ControllerComponent();
    c.moveSpeed = 2;
    c.dashEnabled = false;
    c.inputEnabled = false;

    const c2 = new ControllerComponent();
    c2.deserialize(c.serialize());

    expect(c2.moveSpeed).toBe(2);
    expect(c2.dashEnabled).toBe(false);
    expect(c2.inputEnabled).toBe(false);
  });

  it('clones independently', () => {
    const c = new ControllerComponent();
    c.moveSpeed = 5;
    const cloned = c.clone();
    cloned.moveSpeed = 10;
    expect(c.moveSpeed).toBe(5);
  });
});
```

**Step 2: 実装**

```typescript
// src/types/components/ControllerComponent.ts
import { Component } from './Component';

export class ControllerComponent extends Component {
  readonly type = 'controller';
  moveSpeed = 1;
  dashEnabled = true;
  inputEnabled = true;

  serialize(): Record<string, unknown> {
    return {
      moveSpeed: this.moveSpeed,
      dashEnabled: this.dashEnabled,
      inputEnabled: this.inputEnabled,
    };
  }

  deserialize(data: Record<string, unknown>): void {
    this.moveSpeed = (data.moveSpeed as number) ?? 1;
    this.dashEnabled = (data.dashEnabled as boolean) ?? true;
    this.inputEnabled = (data.inputEnabled as boolean) ?? true;
  }

  clone(): ControllerComponent {
    const c = new ControllerComponent();
    c.moveSpeed = this.moveSpeed;
    c.dashEnabled = this.dashEnabled;
    c.inputEnabled = this.inputEnabled;
    return c;
  }
}
```

**Step 3: テスト実行**

Run: `npx jest src/types/components/ControllerComponent.test.ts --verbose`
Expected: 全テスト PASS

**Step 4: コミット**

```bash
git add src/types/components/ControllerComponent.ts src/types/components/ControllerComponent.test.ts
git commit -m "feat(components): implement ControllerComponent [T138]"
```

---

## Task 7: EffectComponent 実装

**Files:**

- Create: `src/types/components/EffectComponent.ts`
- Create: `src/types/components/EffectComponent.test.ts`

**Step 1: テスト作成**

```typescript
// src/types/components/EffectComponent.test.ts
import { EffectComponent } from './EffectComponent';

describe('EffectComponent', () => {
  it('has type "effect"', () => {
    expect(new EffectComponent().type).toBe('effect');
  });

  it('has correct defaults', () => {
    const c = new EffectComponent();
    expect(c.effectId).toBeUndefined();
    expect(c.onComplete).toBe('none');
  });

  it('round-trips serialize/deserialize', () => {
    const c = new EffectComponent();
    c.effectId = 'fx_explosion';
    c.onComplete = 'delete';

    const c2 = new EffectComponent();
    c2.deserialize(c.serialize());

    expect(c2.effectId).toBe('fx_explosion');
    expect(c2.onComplete).toBe('delete');
  });

  it('clones independently', () => {
    const c = new EffectComponent();
    c.effectId = 'fx_test';
    const cloned = c.clone();
    cloned.effectId = 'changed';
    expect(c.effectId).toBe('fx_test');
  });
});
```

**Step 2: 実装**

```typescript
// src/types/components/EffectComponent.ts
import { Component } from './Component';

export class EffectComponent extends Component {
  readonly type = 'effect';
  effectId?: string;
  onComplete: 'delete' | 'hide' | 'none' = 'none';

  serialize(): Record<string, unknown> {
    return { effectId: this.effectId, onComplete: this.onComplete };
  }

  deserialize(data: Record<string, unknown>): void {
    this.effectId = data.effectId as string | undefined;
    this.onComplete = (data.onComplete as EffectComponent['onComplete']) ?? 'none';
  }

  clone(): EffectComponent {
    const c = new EffectComponent();
    c.effectId = this.effectId;
    c.onComplete = this.onComplete;
    return c;
  }
}
```

**Step 3: テスト実行**

Run: `npx jest src/types/components/EffectComponent.test.ts --verbose`
Expected: 全テスト PASS

**Step 4: コミット**

```bash
git add src/types/components/EffectComponent.ts src/types/components/EffectComponent.test.ts
git commit -m "feat(components): implement EffectComponent [T139]"
```

---

## Task 8: ObjectCanvasComponent 実装

**Files:**

- Create: `src/types/components/ObjectCanvasComponent.ts`
- Create: `src/types/components/ObjectCanvasComponent.test.ts`

**Step 1: テスト作成**

```typescript
// src/types/components/ObjectCanvasComponent.test.ts
import { ObjectCanvasComponent } from './ObjectCanvasComponent';

describe('ObjectCanvasComponent', () => {
  it('has type "objectCanvas"', () => {
    expect(new ObjectCanvasComponent().type).toBe('objectCanvas');
  });

  it('has correct defaults', () => {
    const c = new ObjectCanvasComponent();
    expect(c.offsetX).toBe(0);
    expect(c.offsetY).toBe(0);
    expect(c.elements).toEqual([]);
  });

  it('round-trips serialize/deserialize', () => {
    const c = new ObjectCanvasComponent();
    c.offsetX = 10;
    c.offsetY = -5;
    c.elements = [{ id: 'el1', type: 'text', data: { text: 'HP' } }];

    const c2 = new ObjectCanvasComponent();
    c2.deserialize(c.serialize());

    expect(c2.offsetX).toBe(10);
    expect(c2.offsetY).toBe(-5);
    expect(c2.elements).toHaveLength(1);
    expect(c2.elements[0]).toEqual({ id: 'el1', type: 'text', data: { text: 'HP' } });
  });

  it('clones independently (deep copy elements)', () => {
    const c = new ObjectCanvasComponent();
    c.elements = [{ id: 'el1', type: 'text', data: { text: 'test' } }];
    const cloned = c.clone();
    cloned.elements[0]!.id = 'changed';
    expect(c.elements[0]!.id).toBe('el1');
  });
});
```

**Step 2: 実装**

```typescript
// src/types/components/ObjectCanvasComponent.ts
import { Component } from './Component';

export interface CanvasElement {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

export class ObjectCanvasComponent extends Component {
  readonly type = 'objectCanvas';
  offsetX = 0;
  offsetY = 0;
  elements: CanvasElement[] = [];

  serialize(): Record<string, unknown> {
    return { offsetX: this.offsetX, offsetY: this.offsetY, elements: this.elements };
  }

  deserialize(data: Record<string, unknown>): void {
    this.offsetX = (data.offsetX as number) ?? 0;
    this.offsetY = (data.offsetY as number) ?? 0;
    this.elements = (data.elements as CanvasElement[]) ?? [];
  }

  clone(): ObjectCanvasComponent {
    const c = new ObjectCanvasComponent();
    c.offsetX = this.offsetX;
    c.offsetY = this.offsetY;
    c.elements = structuredClone(this.elements);
    return c;
  }
}
```

**Step 3: テスト実行**

Run: `npx jest src/types/components/ObjectCanvasComponent.test.ts --verbose`
Expected: 全テスト PASS

**Step 4: コミット**

```bash
git add src/types/components/ObjectCanvasComponent.ts src/types/components/ObjectCanvasComponent.test.ts
git commit -m "feat(components): implement ObjectCanvasComponent [T140]"
```

---

## Task 9: 5つのトリガーコンポーネント実装

**Files:**

- Create: `src/types/components/triggers/TalkTriggerComponent.ts`
- Create: `src/types/components/triggers/TouchTriggerComponent.ts`
- Create: `src/types/components/triggers/StepTriggerComponent.ts`
- Create: `src/types/components/triggers/AutoTriggerComponent.ts`
- Create: `src/types/components/triggers/InputTriggerComponent.ts`
- Create: `src/types/components/triggers/triggers.test.ts`

**Step 1: 全トリガーのテスト作成**

1つのテストファイルに全5トリガーをまとめる（各コンポーネントが小さいため）。

```typescript
// src/types/components/triggers/triggers.test.ts
import { TalkTriggerComponent } from './TalkTriggerComponent';
import { TouchTriggerComponent } from './TouchTriggerComponent';
import { StepTriggerComponent } from './StepTriggerComponent';
import { AutoTriggerComponent } from './AutoTriggerComponent';
import { InputTriggerComponent } from './InputTriggerComponent';

describe('TalkTriggerComponent', () => {
  it('has type "talkTrigger"', () => {
    expect(new TalkTriggerComponent().type).toBe('talkTrigger');
  });

  it('has correct defaults', () => {
    const c = new TalkTriggerComponent();
    expect(c.eventId).toBe('');
    expect(c.direction).toBe('front');
  });

  it('round-trips serialize/deserialize', () => {
    const c = new TalkTriggerComponent();
    c.eventId = 'evt_001';
    c.direction = 'any';
    const c2 = new TalkTriggerComponent();
    c2.deserialize(c.serialize());
    expect(c2.eventId).toBe('evt_001');
    expect(c2.direction).toBe('any');
  });

  it('clones independently', () => {
    const c = new TalkTriggerComponent();
    c.eventId = 'original';
    const cloned = c.clone();
    cloned.eventId = 'changed';
    expect(c.eventId).toBe('original');
  });
});

describe('TouchTriggerComponent', () => {
  it('has type "touchTrigger"', () => {
    expect(new TouchTriggerComponent().type).toBe('touchTrigger');
  });

  it('round-trips serialize/deserialize', () => {
    const c = new TouchTriggerComponent();
    c.eventId = 'evt_touch';
    const c2 = new TouchTriggerComponent();
    c2.deserialize(c.serialize());
    expect(c2.eventId).toBe('evt_touch');
  });

  it('clones independently', () => {
    const c = new TouchTriggerComponent();
    c.eventId = 'original';
    const cloned = c.clone();
    cloned.eventId = 'changed';
    expect(c.eventId).toBe('original');
  });
});

describe('StepTriggerComponent', () => {
  it('has type "stepTrigger"', () => {
    expect(new StepTriggerComponent().type).toBe('stepTrigger');
  });

  it('round-trips serialize/deserialize', () => {
    const c = new StepTriggerComponent();
    c.eventId = 'evt_step';
    const c2 = new StepTriggerComponent();
    c2.deserialize(c.serialize());
    expect(c2.eventId).toBe('evt_step');
  });

  it('clones independently', () => {
    const c = new StepTriggerComponent();
    c.eventId = 'original';
    const cloned = c.clone();
    cloned.eventId = 'changed';
    expect(c.eventId).toBe('original');
  });
});

describe('AutoTriggerComponent', () => {
  it('has type "autoTrigger"', () => {
    expect(new AutoTriggerComponent().type).toBe('autoTrigger');
  });

  it('has correct defaults', () => {
    const c = new AutoTriggerComponent();
    expect(c.eventId).toBe('');
    expect(c.interval).toBe(0);
    expect(c.runOnce).toBe(true);
  });

  it('round-trips serialize/deserialize', () => {
    const c = new AutoTriggerComponent();
    c.eventId = 'evt_auto';
    c.interval = 60;
    c.runOnce = false;
    const c2 = new AutoTriggerComponent();
    c2.deserialize(c.serialize());
    expect(c2.eventId).toBe('evt_auto');
    expect(c2.interval).toBe(60);
    expect(c2.runOnce).toBe(false);
  });

  it('clones independently', () => {
    const c = new AutoTriggerComponent();
    c.interval = 120;
    const cloned = c.clone();
    cloned.interval = 0;
    expect(c.interval).toBe(120);
  });
});

describe('InputTriggerComponent', () => {
  it('has type "inputTrigger"', () => {
    expect(new InputTriggerComponent().type).toBe('inputTrigger');
  });

  it('has correct defaults', () => {
    const c = new InputTriggerComponent();
    expect(c.eventId).toBe('');
    expect(c.key).toBe('');
  });

  it('round-trips serialize/deserialize', () => {
    const c = new InputTriggerComponent();
    c.eventId = 'evt_input';
    c.key = 'Space';
    const c2 = new InputTriggerComponent();
    c2.deserialize(c.serialize());
    expect(c2.eventId).toBe('evt_input');
    expect(c2.key).toBe('Space');
  });

  it('clones independently', () => {
    const c = new InputTriggerComponent();
    c.key = 'Enter';
    const cloned = c.clone();
    cloned.key = 'Space';
    expect(c.key).toBe('Enter');
  });
});
```

**Step 2: 5つのトリガー実装**

```typescript
// src/types/components/triggers/TalkTriggerComponent.ts
import { Component } from '../Component';

export class TalkTriggerComponent extends Component {
  readonly type = 'talkTrigger';
  eventId = '';
  direction: 'front' | 'any' = 'front';

  serialize(): Record<string, unknown> {
    return { eventId: this.eventId, direction: this.direction };
  }

  deserialize(data: Record<string, unknown>): void {
    this.eventId = (data.eventId as string) ?? '';
    this.direction = (data.direction as TalkTriggerComponent['direction']) ?? 'front';
  }

  clone(): TalkTriggerComponent {
    const c = new TalkTriggerComponent();
    c.eventId = this.eventId;
    c.direction = this.direction;
    return c;
  }
}
```

```typescript
// src/types/components/triggers/TouchTriggerComponent.ts
import { Component } from '../Component';

export class TouchTriggerComponent extends Component {
  readonly type = 'touchTrigger';
  eventId = '';

  serialize(): Record<string, unknown> {
    return { eventId: this.eventId };
  }

  deserialize(data: Record<string, unknown>): void {
    this.eventId = (data.eventId as string) ?? '';
  }

  clone(): TouchTriggerComponent {
    const c = new TouchTriggerComponent();
    c.eventId = this.eventId;
    return c;
  }
}
```

```typescript
// src/types/components/triggers/StepTriggerComponent.ts
import { Component } from '../Component';

export class StepTriggerComponent extends Component {
  readonly type = 'stepTrigger';
  eventId = '';

  serialize(): Record<string, unknown> {
    return { eventId: this.eventId };
  }

  deserialize(data: Record<string, unknown>): void {
    this.eventId = (data.eventId as string) ?? '';
  }

  clone(): StepTriggerComponent {
    const c = new StepTriggerComponent();
    c.eventId = this.eventId;
    return c;
  }
}
```

```typescript
// src/types/components/triggers/AutoTriggerComponent.ts
import { Component } from '../Component';

export class AutoTriggerComponent extends Component {
  readonly type = 'autoTrigger';
  eventId = '';
  interval = 0;
  runOnce = true;

  serialize(): Record<string, unknown> {
    return { eventId: this.eventId, interval: this.interval, runOnce: this.runOnce };
  }

  deserialize(data: Record<string, unknown>): void {
    this.eventId = (data.eventId as string) ?? '';
    this.interval = (data.interval as number) ?? 0;
    this.runOnce = (data.runOnce as boolean) ?? true;
  }

  clone(): AutoTriggerComponent {
    const c = new AutoTriggerComponent();
    c.eventId = this.eventId;
    c.interval = this.interval;
    c.runOnce = this.runOnce;
    return c;
  }
}
```

```typescript
// src/types/components/triggers/InputTriggerComponent.ts
import { Component } from '../Component';

export class InputTriggerComponent extends Component {
  readonly type = 'inputTrigger';
  eventId = '';
  key = '';

  serialize(): Record<string, unknown> {
    return { eventId: this.eventId, key: this.key };
  }

  deserialize(data: Record<string, unknown>): void {
    this.eventId = (data.eventId as string) ?? '';
    this.key = (data.key as string) ?? '';
  }

  clone(): InputTriggerComponent {
    const c = new InputTriggerComponent();
    c.eventId = this.eventId;
    c.key = this.key;
    return c;
  }
}
```

**Step 3: テスト実行**

Run: `npx jest src/types/components/triggers/triggers.test.ts --verbose`
Expected: 全テスト PASS

**Step 4: コミット**

```bash
git add src/types/components/triggers/
git commit -m "feat(components): implement 5 trigger components [T141][T142][T143][T144][T144a]

TalkTrigger, TouchTrigger, StepTrigger, AutoTrigger, InputTrigger"
```

---

## Task 10: 全コンポーネントをレジストリに登録

**Files:**

- Create: `src/types/components/register.ts`
- Modify: `src/types/components/index.ts` (export 追加)
- Create: `src/types/components/registration.test.ts`

**Step 1: テスト作成**

```typescript
// src/types/components/registration.test.ts
import { clearComponentRegistry, getComponent, getComponentNames } from './index';

describe('Component registration', () => {
  beforeEach(() => {
    clearComponentRegistry();
  });

  it('registers all 13 built-in components', () => {
    // register.ts の副作用インポートで全登録
    require('./register');

    const names = getComponentNames();
    expect(names).toContain('transform');
    expect(names).toContain('sprite');
    expect(names).toContain('collider');
    expect(names).toContain('movement');
    expect(names).toContain('variables');
    expect(names).toContain('controller');
    expect(names).toContain('effect');
    expect(names).toContain('objectCanvas');
    expect(names).toContain('talkTrigger');
    expect(names).toContain('touchTrigger');
    expect(names).toContain('stepTrigger');
    expect(names).toContain('autoTrigger');
    expect(names).toContain('inputTrigger');
    expect(names).toHaveLength(13);
  });

  it('can instantiate each registered component', () => {
    require('./register');

    for (const name of getComponentNames()) {
      const Cls = getComponent(name)!;
      const instance = new Cls();
      expect(instance.type).toBe(name);
    }
  });
});
```

**Step 2: register.ts 作成**

```typescript
// src/types/components/register.ts
import { registerComponent } from './index';
import { TransformComponent } from './TransformComponent';
import { SpriteComponent } from './SpriteComponent';
import { ColliderComponent } from './ColliderComponent';
import { MovementComponent } from './MovementComponent';
import { VariablesComponent } from './VariablesComponent';
import { ControllerComponent } from './ControllerComponent';
import { EffectComponent } from './EffectComponent';
import { ObjectCanvasComponent } from './ObjectCanvasComponent';
import { TalkTriggerComponent } from './triggers/TalkTriggerComponent';
import { TouchTriggerComponent } from './triggers/TouchTriggerComponent';
import { StepTriggerComponent } from './triggers/StepTriggerComponent';
import { AutoTriggerComponent } from './triggers/AutoTriggerComponent';
import { InputTriggerComponent } from './triggers/InputTriggerComponent';

registerComponent('transform', TransformComponent);
registerComponent('sprite', SpriteComponent);
registerComponent('collider', ColliderComponent);
registerComponent('movement', MovementComponent);
registerComponent('variables', VariablesComponent);
registerComponent('controller', ControllerComponent);
registerComponent('effect', EffectComponent);
registerComponent('objectCanvas', ObjectCanvasComponent);
registerComponent('talkTrigger', TalkTriggerComponent);
registerComponent('touchTrigger', TouchTriggerComponent);
registerComponent('stepTrigger', StepTriggerComponent);
registerComponent('autoTrigger', AutoTriggerComponent);
registerComponent('inputTrigger', InputTriggerComponent);
```

**Step 3: index.ts に re-export 追加**

`index.ts` の末尾に各コンポーネントの re-export を追加:

```typescript
// 組み込みコンポーネント re-export
export { TransformComponent } from './TransformComponent';
export { SpriteComponent } from './SpriteComponent';
export { ColliderComponent } from './ColliderComponent';
export { MovementComponent } from './MovementComponent';
export { VariablesComponent } from './VariablesComponent';
export { ControllerComponent } from './ControllerComponent';
export { EffectComponent } from './EffectComponent';
export { ObjectCanvasComponent } from './ObjectCanvasComponent';
export { TalkTriggerComponent } from './triggers/TalkTriggerComponent';
export { TouchTriggerComponent } from './triggers/TouchTriggerComponent';
export { StepTriggerComponent } from './triggers/StepTriggerComponent';
export { AutoTriggerComponent } from './triggers/AutoTriggerComponent';
export { InputTriggerComponent } from './triggers/InputTriggerComponent';
```

**Step 4: テスト実行**

Run: `npx jest src/types/components/registration.test.ts --verbose`
Expected: 全テスト PASS

**Step 5: コミット**

```bash
git add src/types/components/register.ts src/types/components/index.ts src/types/components/registration.test.ts
git commit -m "feat(components): register all 13 built-in components [T133]"
```

---

## Task 11: マップ型定義

**Files:**

- Create: `src/types/map.ts`
- Create: `src/types/map.test.ts`

**Step 1: テスト作成**

型定義のテストは、インターフェースのインスタンス作成とシリアライズの検証。

```typescript
// src/types/map.test.ts
import type { GameMap, MapLayer, MapObject, Chipset, ChipProperty, Prefab } from './map';

describe('Map types', () => {
  it('GameMap with tile layer', () => {
    const map: GameMap = {
      id: 'map_001',
      name: 'テスト',
      width: 20,
      height: 15,
      layers: [
        {
          id: 'layer_bg',
          name: '背景',
          type: 'tile',
          tiles: Array.from({ length: 15 }, () => Array.from({ length: 20 }, () => '')),
        },
      ],
    };
    expect(map.layers).toHaveLength(1);
    expect(map.layers[0]!.type).toBe('tile');
    expect(map.layers[0]!.tiles![0]).toHaveLength(20);
  });

  it('GameMap with object layer', () => {
    const map: GameMap = {
      id: 'map_002',
      name: 'オブジェクトテスト',
      width: 20,
      height: 15,
      layers: [
        {
          id: 'layer_obj',
          name: 'オブジェクト',
          type: 'object',
          objects: [{ id: 'obj_001', name: 'NPC', components: [] }],
        },
      ],
    };
    expect(map.layers[0]!.objects).toHaveLength(1);
  });

  it('Chipset with ChipProperties', () => {
    const chipset: Chipset = {
      id: 'cs_001',
      name: 'フィールド',
      imageId: 'img_chipset',
      tileWidth: 32,
      tileHeight: 32,
      chips: [
        { index: 0, passable: true },
        { index: 1, passable: false, footstepType: 'grass' },
      ],
    };
    expect(chipset.chips).toHaveLength(2);
    expect(chipset.chips[1]!.footstepType).toBe('grass');
  });

  it('Prefab with components', () => {
    const prefab: Prefab = {
      id: 'prefab_npc',
      name: 'NPC',
      components: [],
    };
    expect(prefab.id).toBe('prefab_npc');
  });

  it('MapObject with optional prefabId and overrides', () => {
    const obj: MapObject = {
      id: 'obj_001',
      name: 'スライム',
      prefabId: 'prefab_enemy',
      components: [],
      overrides: { hp: 100 },
    };
    expect(obj.prefabId).toBe('prefab_enemy');
    expect(obj.overrides).toEqual({ hp: 100 });
  });
});
```

**Step 2: 型定義作成**

```typescript
// src/types/map.ts
import type { Component } from './components/Component';

export interface GameMap {
  id: string;
  name: string;
  width: number; // 20-999
  height: number; // 15-999
  layers: MapLayer[];
  bgmId?: string;
  backgroundImageId?: string;
}

export interface MapLayer {
  id: string;
  name: string;
  type: 'tile' | 'object';
  tiles?: string[][]; // tiles[y][x] = chipId (tile layer only)
  objects?: MapObject[]; // object layer only
}

export interface MapObject {
  id: string;
  name: string;
  prefabId?: string;
  components: Component[];
  overrides?: Record<string, unknown>;
}

export interface Chipset {
  id: string;
  name: string;
  imageId: string;
  tileWidth: number;
  tileHeight: number;
  chips: ChipProperty[];
}

export interface ChipProperty {
  index: number;
  passable: boolean;
  footstepType?: string;
}

export interface Prefab {
  id: string;
  name: string;
  components: Component[];
}
```

**Step 3: テスト実行**

Run: `npx jest src/types/map.test.ts --verbose`
Expected: 全テスト PASS

**Step 4: 全テスト実行**

Run: `npx jest --verbose 2>&1 | tail -20`
Expected: 全テスト PASS（既存テスト含む）

**Step 5: コミット**

```bash
git add src/types/map.ts src/types/map.test.ts
git commit -m "feat(map): define GameMap, MapLayer, MapObject, Chipset, Prefab types [T145]"
```

---

## 完了チェック

全タスク完了後に以下を確認:

1. `npx jest --verbose 2>&1 | tail -30` — 全テスト PASS
2. `npx tsc --noEmit` — TypeScript エラーなし
3. `docs/tasks.md` の T133-T145 を `[x]` に更新
