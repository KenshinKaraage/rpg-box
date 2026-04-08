'use client';

import type { ReactNode } from 'react';
import {
  FieldType,
  type ValidationResult,
  type FieldEditorProps,
  type FieldConfigProps,
} from './FieldType';
import { EffectFieldEditor } from '@/features/data-editor/components/fields/EffectFieldEditor';

/**
 * エフェクトの値型
 * UIのEffectComponentにそのまま渡せる構造
 */
export interface EffectValue {
  imageId: string;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  intervalMs: number;
}

/**
 * エフェクトフィールドタイプ
 *
 * エフェクト画像 + 再生設定をセットで管理。
 * 値はUIのEffectComponentと同じ構造なのでそのまま渡せる。
 */
export class EffectFieldType extends FieldType<EffectValue> {
  readonly type = 'effect';
  readonly label = 'エフェクト';
  readonly tsType = 'object';

  getDefaultValue(): EffectValue {
    return {
      imageId: '',
      frameWidth: 0,
      frameHeight: 0,
      frameCount: 1,
      intervalMs: 100,
    };
  }

  validate(value: EffectValue): ValidationResult {
    if (this.required && !value.imageId) {
      return { valid: false, message: 'エフェクト画像を選択してください' };
    }
    return { valid: true };
  }

  serialize(value: EffectValue): unknown {
    return value;
  }

  deserialize(data: unknown): EffectValue {
    if (!data || typeof data !== 'object') return this.getDefaultValue();
    const d = data as Record<string, unknown>;
    return {
      imageId: (d.effectId as string) ?? '',
      frameWidth: (d.frameWidth as number) ?? 0,
      frameHeight: (d.frameHeight as number) ?? 0,
      frameCount: (d.frameCount as number) ?? 1,
      intervalMs: (d.intervalMs as number) ?? 100,
    };
  }

  getValue(data: unknown): EffectValue {
    if (!data || typeof data !== 'object') return this.getDefaultValue();
    return this.deserialize(data);
  }

  renderEditor(props: FieldEditorProps<EffectValue>): ReactNode {
    return (
      <EffectFieldEditor
        value={props.value}
        onChange={props.onChange}
        disabled={props.disabled}
        error={props.error}
      />
    );
  }

  renderConfig(_props: FieldConfigProps): ReactNode {
    return null;
  }
}
