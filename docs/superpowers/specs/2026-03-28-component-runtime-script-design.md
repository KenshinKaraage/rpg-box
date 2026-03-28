# Component Runtime Script Design

## Overview

Non-visual UI components (Navigation, etc.) need runtime behavior during test play. Instead of hardcoding each component's logic in UICanvasManager, components generate their own runtime scripts from their properties. UICanvasManager executes these scripts generically via standard lifecycle hooks.

## Core Concept

Each Component can optionally produce a runtime script string via `generateRuntimeScript()`. This script defines lifecycle functions (inherited from the base class) and custom functions (component-specific). UICanvasManager compiles and calls these functions at the appropriate times without knowing anything about what they do.

## Component Base Class Changes

```ts
abstract class Component {
  // Existing: type, label, serialize, deserialize, clone, renderPropertyPanel

  /**
   * Generate a JS script string containing lifecycle + custom functions.
   * Returns null for visual-only components (Image, Text, Shape, etc.).
   * The script is regenerated from properties each time — never edited directly.
   */
  generateRuntimeScript(): string | null { return null; }
}
```

## Lifecycle Functions (Standard)

All components share these. If a component's script defines them, UICanvasManager calls them:

| Function | Called When | Signature |
|----------|-----------|-----------|
| `onShow()` | Canvas becomes visible | `() => void` |
| `onHide()` | Canvas becomes hidden | `() => void` |
| `onUpdate(dt)` | Every frame (while canvas is visible) | `(dt: number) => void` |
| `onInput(button)` | A game button is just pressed | `(button: string) => void` |

Components may also define **custom functions** callable from scripts (e.g., `getSelectedItemId()`).

## `self` Context Object

Injected into runtime scripts alongside the standard script APIs (Variable, Data, Input, etc.):

```ts
self = {
  canvas: UICanvasRuntimeProxy,     // The canvas this component belongs to
  object: UIObjectRuntimeProxy,     // The object this component is attached to
  children: UIObjectRuntimeProxy[], // Child objects of self.object
  state: {},                        // Mutable state shared across lifecycle calls
}
```

`self.state` persists between lifecycle calls for the same component instance (from show to hide). It is reset on each show.

## Script Generation Example: NavigationComponent

Properties: `direction: 'vertical'`, `wrap: true`, `initialIndex: 0`, `columns: 1`

Generated script:

```js
function onShow() {
  // Collect NavigationItem children
  const items = self.children.filter(c =>
    /* has navigationItem component */
  );
  self.state.items = items;
  self.state.focusIndex = 0; // initialIndex
  self.state.result = undefined;
  updateCursor();
}

function onInput(button) {
  const items = self.state.items;
  if (!items || items.length === 0) return;

  let idx = self.state.focusIndex;
  // direction=vertical: up/down move ±1
  if (button === "up") idx = (idx - 1 + items.length) % items.length; // wrap=true
  if (button === "down") idx = (idx + 1) % items.length;

  self.state.focusIndex = idx;
  updateCursor();

  if (button === "confirm") {
    // Read itemId from NavigationItem component
    self.state.result = items[idx].id; // or itemId
  }
  if (button === "cancel") {
    self.state.result = null;
  }
}

function onHide() {
  self.state.items = null;
}

function getResult() {
  return self.state.result;
}

// Internal helper (not a lifecycle function)
function updateCursor() {
  const items = self.state.items;
  const cursor = self.children.find(c => /* has navigationCursor component */);
  if (!cursor || !items) return;
  const focused = items[self.state.focusIndex];
  if (focused) {
    cursor.y = focused.y; // + offsetY from cursor component
  }
}
```

Note: The actual property values (`vertical`, `true`, `0`) are embedded as literals by `generateRuntimeScript()`. No runtime property lookup is needed.

## UICanvasManager Changes

### New: CompiledComponentRuntime

```ts
interface CompiledComponentRuntime {
  objectId: string;
  componentType: string;
  onShow?: () => void;
  onHide?: () => void;
  onUpdate?: (dt: number) => void;
  onInput?: (button: string) => void;
  customFunctions: Record<string, (...args: unknown[]) => unknown>;
  state: Record<string, unknown>;  // self.state
}
```

### Lifecycle Dispatch

UICanvasManager gains these internal methods:

- **`compileComponentScripts(canvasId)`** — For each object+component with a non-null `generateRuntimeScript()`, compile the script via `new Function()` and store the result. Inject `self` context.
- **`dispatchShow(canvasId)`** — Called when `showCanvas()` is invoked. Calls `onShow()` on all compiled runtimes.
- **`dispatchHide(canvasId)`** — Called when `hideCanvas()` is invoked. Calls `onHide()`, then discards compiled runtimes.
- **`dispatchUpdate(canvasId, dt)`** — Called each frame. Calls `onUpdate(dt)` on all runtimes.
- **`dispatchInput(canvasId, button)`** — Called when a button is just pressed. Calls `onInput(button)` on all runtimes.

### GameRuntime Integration

GameRuntime's update loop adds:

```ts
// After input.update() / input.processWaiters()
for (const [canvasId, state] of uiCanvasManager.visibleCanvases()) {
  // Input dispatch
  for (const button of ['up', 'down', 'left', 'right', 'confirm', 'cancel']) {
    if (input.isJustPressed(button)) {
      uiCanvasManager.dispatchInput(canvasId, button);
    }
  }
  // Update dispatch
  uiCanvasManager.dispatchUpdate(canvasId, dt);
}
```

## Script-Side Usage

With this system, `Script.choice()` becomes:

```js
// Set up choice items dynamically
const items = ["はい", "いいえ", "わからない"];
for (let i = 0; i < items.length; i++) {
  const item = UI["choice"].getObject("item" + i);
  if (item) {
    item.setProperty("text", "content", items[i]);
    item.visible = true;
  }
}

// Show canvas → triggers onShow() on NavigationComponent
UI["choice"].show();

// Wait for navigation result
while (true) {
  await scriptAPI.waitFrames(1);
  const result = UI["choice"].getObject("navContainer").getResult();
  if (result !== undefined) break;
}

const selectedIndex = /* derive from result */;
UI["choice"].hide(); // triggers onHide()
return selectedIndex;
```

Alternatively, UICanvasRuntimeProxy could expose a convenience `waitResult(objectName)` that wraps this loop.

## What Does NOT Change

- Visual components (Image, Text, Shape, FillMask, ColorMask, LayoutGroup, GridLayout, Animation) return `null` from `generateRuntimeScript()`. No behavior change.
- Existing UIFunction / UIAction system is unaffected.
- Editor-side rendering (UIRenderer, navigationResolver for preview) is unaffected.

## Affected Files

| File | Change |
|------|--------|
| `src/types/components/Component.ts` | Add `generateRuntimeScript(): string \| null` |
| `src/engine/runtime/UICanvasManager.ts` | Add compiled runtime tracking, lifecycle dispatch methods |
| `src/engine/runtime/GameRuntime.ts` | Call dispatchUpdate/dispatchInput in update loop |
| `src/types/ui/components/NavigationComponent.ts` | Implement `generateRuntimeScript()` |
| `src/types/ui/components/NavigationCursorComponent.ts` | Implement `generateRuntimeScript()` (cursor position tracking) |
| `src/lib/defaultTestData.ts` | Rewrite choice UICanvas to use NavigationComponent |

## Future Components

This pattern enables any future non-visual component to define runtime behavior:
- ScrollComponent → `onInput` for scroll, `onUpdate` for momentum
- TimerComponent → `onUpdate` for countdown
- InputFieldComponent → `onInput` for text entry
