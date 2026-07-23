'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TemplateArgEditor } from './TemplateArgEditor';
import { useStore } from '@/stores';
import { useUndoEditSession } from '@/hooks/useUndoEditSession';
import type { EventTemplate, TemplateArg } from '@/types/event';

interface EventTemplateEditorProps {
  template: EventTemplate | null;
  existingIds: string[];
  onUpdate: (id: string, updates: Partial<EventTemplate>) => void;
}

export function EventTemplateEditor({
  template,
  existingIds: _existingIds,
  onUpdate,
}: EventTemplateEditorProps) {
  const eventTemplates = useStore((s) => s.eventTemplates);
  const pushUndoState = useStore((s) => s.pushUndoState);
  const { beginEditIfNeeded, endEditSession } = useUndoEditSession('event', template?.id ?? null);

  if (!template) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        テンプレートを選択してください
      </div>
    );
  }

  const handleIdChange = (newId: string) => {
    const trimmedId = newId.trim();
    if (trimmedId && trimmedId !== template.id) {
      pushUndoState('event', { eventTemplates });
      onUpdate(template.id, { id: trimmedId });
    }
  };

  const handleNameChange = (name: string) => {
    beginEditIfNeeded({ eventTemplates });
    onUpdate(template.id, { name });
  };

  const handleDescriptionChange = (description: string) => {
    beginEditIfNeeded({ eventTemplates });
    onUpdate(template.id, { description });
  };

  // 引数の追加・削除（件数が変わる）は単発のUndoとして積み、
  // 引数名の変更等（件数が変わらない）はセッションとしてバッチ化する
  const handleArgsChange = (args: TemplateArg[]) => {
    if (args.length !== template.args.length) {
      pushUndoState('event', { eventTemplates });
    } else {
      beginEditIfNeeded({ eventTemplates });
    }
    onUpdate(template.id, { args });
  };

  return (
    <div className="flex h-full flex-col" onBlur={endEditSession}>
      {/* テンプレート基本情報 */}
      <div className="space-y-4 border-b p-4">
        <h3 className="text-sm font-semibold">テンプレート設定</h3>

        <div className="space-y-2">
          <Label htmlFor="templateId">テンプレートID</Label>
          <Input
            id="templateId"
            defaultValue={template.id}
            onBlur={(e) => handleIdChange(e.target.value)}
            placeholder="テンプレートID"
            data-testid="template-id-input"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="templateName">テンプレート名</Label>
          <Input
            id="templateName"
            defaultValue={template.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="テンプレート名を入力"
            data-testid="template-name-input"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="templateDescription">説明（オプション）</Label>
          <Textarea
            id="templateDescription"
            defaultValue={template.description ?? ''}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            placeholder="テンプレートの説明"
            rows={2}
            data-testid="template-description-input"
          />
        </div>
      </div>

      {/* 引数エディタ */}
      <div className="flex-1 overflow-auto p-4">
        <TemplateArgEditor args={template.args} onChange={handleArgsChange} />
      </div>
    </div>
  );
}
