'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStore } from '@/stores';
import type { GameSettings } from '@/types/gameSettings';
import { RESOLUTION_PRESETS } from '@/types/gameSettings';

/**
 * ゲーム設定フォームのバリデーションスキーマ
 */
const gameSettingsSchema = z.object({
  title: z.string().min(1, 'ゲームタイトルは必須です').max(100, '100文字以内で入力してください'),
  version: z
    .string()
    .min(1, 'バージョンは必須です')
    .regex(/^\d+\.\d+\.\d+$/, 'バージョン形式が正しくありません（例: 1.0.0）'),
  author: z.string().max(50, '50文字以内で入力してください'),
  description: z.string().max(1000, '1000文字以内で入力してください'),
  resolution: z.object({
    width: z
      .number()
      .min(320, '320以上の値を入力してください')
      .max(3840, '3840以下の値を入力してください'),
    height: z
      .number()
      .min(240, '240以上の値を入力してください')
      .max(2160, '2160以下の値を入力してください'),
  }),
  startMapId: z.string(),
  defaultBGM: z.string().optional(),
  icon: z.string().optional(),
  menuScriptId: z.string().optional(),
});

type GameSettingsFormData = z.infer<typeof gameSettingsSchema>;

interface GameInfoFormProps {
  initialValues: GameSettings;
  onSubmit: (values: GameSettings) => void;
}

/**
 * ゲーム情報設定フォーム
 */
export function GameInfoForm({ initialValues, onSubmit }: GameInfoFormProps) {
  const maps = useStore((s) => s.maps);
  const scripts = useStore((s) => s.scripts);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<GameSettingsFormData>({
    resolver: zodResolver(gameSettingsSchema),
    defaultValues: initialValues,
  });

  const currentStartMapId = watch('startMapId');
  const currentMenuScriptId = watch('menuScriptId');

  const handlePresetChange = (presetLabel: string) => {
    const preset = RESOLUTION_PRESETS.find((p) => p.label === presetLabel);
    if (preset) {
      setValue('resolution.width', preset.resolution.width);
      setValue('resolution.height', preset.resolution.height);
    }
  };

  const onFormSubmit = (data: GameSettingsFormData) => {
    onSubmit(data as GameSettings);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* ゲームタイトル */}
      <div className="space-y-2">
        <Label htmlFor="title">ゲームタイトル</Label>
        <Input id="title" {...register('title')} placeholder="ゲームのタイトル" />
        {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
      </div>

      {/* バージョン */}
      <div className="space-y-2">
        <Label htmlFor="version">バージョン</Label>
        <Input id="version" {...register('version')} placeholder="1.0.0" />
        {errors.version && <p className="text-sm text-red-500">{errors.version.message}</p>}
      </div>

      {/* 作者名 */}
      <div className="space-y-2">
        <Label htmlFor="author">作者名</Label>
        <Input id="author" {...register('author')} placeholder="作者名" />
        {errors.author && <p className="text-sm text-red-500">{errors.author.message}</p>}
      </div>

      {/* 説明 */}
      <div className="space-y-2">
        <Label htmlFor="description">説明</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="ゲームの説明文"
          rows={4}
        />
        {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
      </div>

      {/* 解像度 */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>プリセット</Label>
          <Select onValueChange={handlePresetChange}>
            <SelectTrigger>
              <SelectValue placeholder="解像度を選択" />
            </SelectTrigger>
            <SelectContent>
              {RESOLUTION_PRESETS.map((preset) => (
                <SelectItem key={preset.label} value={preset.label}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="resolution.width">画面幅</Label>
            <Input
              id="resolution.width"
              type="number"
              {...register('resolution.width', { valueAsNumber: true })}
            />
            {errors.resolution?.width && (
              <p className="text-sm text-red-500">{errors.resolution.width.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="resolution.height">画面高さ</Label>
            <Input
              id="resolution.height"
              type="number"
              {...register('resolution.height', { valueAsNumber: true })}
            />
            {errors.resolution?.height && (
              <p className="text-sm text-red-500">{errors.resolution.height.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* 開始マップ */}
      <div className="space-y-2">
        <Label>開始マップ</Label>
        <Select
          value={currentStartMapId || ''}
          onValueChange={(v) => setValue('startMapId', v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="マップを選択" />
          </SelectTrigger>
          <SelectContent>
            {maps.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* メニュースクリプト */}
      <div className="space-y-2">
        <Label>メニュースクリプト</Label>
        <Select
          value={currentMenuScriptId || '__none__'}
          onValueChange={(v) => setValue('menuScriptId', v === '__none__' ? '' : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="なし" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">なし</SelectItem>
            {scripts
              .filter((s) => s.type === 'event' && s.isAsync)
              .map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* 送信ボタン */}
      <Button type="submit">保存</Button>
    </form>
  );
}
