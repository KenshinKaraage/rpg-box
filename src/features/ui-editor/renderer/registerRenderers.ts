/**
 * コンポーネントレンダラーの一括登録（side-effect import）
 */
import { registerComponentRenderer, type ComponentRenderFn } from './rendererRegistry';
import { renderShape } from './shapeRenderer';
import { renderLine } from './lineRenderer';
import { renderImage } from './imageRenderer';
import { renderText } from './textRenderer';
import { renderEffect } from './effectRenderer';

// 各レンダラーは (ctx, data: XxxData, rect, gl) 型だが、
// レジストリは data: unknown で統一。呼び出し側でキャストされる。
registerComponentRenderer('shape', renderShape as unknown as ComponentRenderFn);
registerComponentRenderer('line', renderLine as unknown as ComponentRenderFn);
registerComponentRenderer('image', renderImage as unknown as ComponentRenderFn);
registerComponentRenderer('text', renderText as unknown as ComponentRenderFn);
registerComponentRenderer('effect', renderEffect as unknown as ComponentRenderFn);
