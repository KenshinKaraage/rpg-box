import type { GameContext } from '../runtime/GameContext';
import { EventAction } from './EventAction';

export class MapAction extends EventAction {
  readonly type = 'map';
  operation: 'changeMap' | 'getChip' = 'changeMap';
  targetMapId?: string;
  x?: number;
  y?: number;
  transition?: 'fade' | 'none';
  resultVariableId?: string;
  sourceMapId?: string;
  chipX?: number;
  chipY?: number;
  layer?: number;

  async execute(
    _context: GameContext,
    _run: (actions: EventAction[]) => Promise<void>
  ): Promise<void> {
    // No-op: map system not yet implemented (Phase 10)
  }

  toJSON(): Record<string, unknown> {
    return {
      operation: this.operation,
      targetMapId: this.targetMapId,
      x: this.x,
      y: this.y,
      transition: this.transition,
      resultVariableId: this.resultVariableId,
      sourceMapId: this.sourceMapId,
      chipX: this.chipX,
      chipY: this.chipY,
      layer: this.layer,
    };
  }

  fromJSON(data: Record<string, unknown>): void {
    this.operation = data.operation as MapAction['operation'];
    this.targetMapId = data.targetMapId as string | undefined;
    this.x = data.x as number | undefined;
    this.y = data.y as number | undefined;
    this.transition = data.transition as MapAction['transition'];
    this.resultVariableId = data.resultVariableId as string | undefined;
    this.sourceMapId = data.sourceMapId as string | undefined;
    this.chipX = data.chipX as number | undefined;
    this.chipY = data.chipY as number | undefined;
    this.layer = data.layer as number | undefined;
  }
}
