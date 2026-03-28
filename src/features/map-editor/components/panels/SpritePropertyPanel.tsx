'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ImageFieldEditor } from '@/features/data-editor/components/fields/ImageFieldEditor';
import { FramePatternEditor } from './FramePatternEditor';
import type { SpriteComponent, SpriteMode } from '@/types/components/SpriteComponent';
import type { ComponentPanelProps } from '@/types/components/Component';

interface Props extends ComponentPanelProps {
  component: SpriteComponent;
}

export function SpritePropertyPanel({ component, onChange }: Props) {
  const isDirectional = component.spriteMode === 'directional';

  return (
    <div className="space-y-2">
      {/* 画像選択 */}
      <div className="space-y-1">
        <Label className="text-xs">画像</Label>
        <ImageFieldEditor
          value={component.imageId ?? null}
          onChange={(id) => onChange({ imageId: id ?? undefined })}
          showPreview={false}
        />
      </div>

      {/* スプライトモード */}
      <div className="space-y-1">
        <Label className="text-xs">モード</Label>
        <Select
          value={component.spriteMode}
          onValueChange={(v: SpriteMode) => onChange({ spriteMode: v })}
        >
          <SelectTrigger className="h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="single">単一画像</SelectItem>
            <SelectItem value="directional">4方向歩行チップ</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* フレームサイズ（directionalまたはanimFrameCount > 1 の場合） */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">フレーム幅</Label>
          <Input
            type="number"
            className="h-7 text-xs"
            min={0}
            value={component.frameWidth}
            onChange={(e) => onChange({ frameWidth: parseInt(e.target.value) || 0 })}
            placeholder="0=自動"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">フレーム高さ</Label>
          <Input
            type="number"
            className="h-7 text-xs"
            min={0}
            value={component.frameHeight}
            onChange={(e) => onChange({ frameHeight: parseInt(e.target.value) || 0 })}
            placeholder="0=自動"
          />
        </div>
      </div>

      {/* アニメーション設定 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">フレーム数</Label>
          <Input
            type="number"
            className="h-7 text-xs"
            min={1}
            value={component.animFrameCount}
            onChange={(e) => onChange({ animFrameCount: parseInt(e.target.value) || 1 })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">間隔 (ms)</Label>
          <Input
            type="number"
            className="h-7 text-xs"
            min={1}
            value={component.animIntervalMs}
            onChange={(e) => onChange({ animIntervalMs: parseInt(e.target.value) || 200 })}
          />
        </div>
      </div>

      {/* フレームパターン（フレーム数2以上で表示） */}
      {component.animFrameCount >= 2 && (
        <FramePatternEditor
          pattern={component.animFramePattern}
          frameCount={component.animFrameCount}
          onChange={(pattern) => onChange({ animFramePattern: pattern })}
        />
      )}

      {isDirectional && (
        <div className="text-xs text-muted-foreground">
          4方向: 行0=下, 行1=左, 行2=右, 行3=上
        </div>
      )}

      {/* 反転・不透明度 */}
      <div className="flex gap-4">
        <div className="flex items-center gap-1.5">
          <Checkbox
            id="sprite-flipX"
            checked={component.flipX}
            onCheckedChange={(v) => onChange({ flipX: v === true })}
          />
          <Label htmlFor="sprite-flipX" className="text-xs">
            X反転
          </Label>
        </div>
        <div className="flex items-center gap-1.5">
          <Checkbox
            id="sprite-flipY"
            checked={component.flipY}
            onCheckedChange={(v) => onChange({ flipY: v === true })}
          />
          <Label htmlFor="sprite-flipY" className="text-xs">
            Y反転
          </Label>
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">不透明度（0〜1）</Label>
        <Input
          type="number"
          className="h-7 text-xs"
          min={0}
          max={1}
          step={0.1}
          value={component.opacity}
          onChange={(e) => onChange({ opacity: parseFloat(e.target.value) ?? 1 })}
        />
      </div>
    </div>
  );
}
