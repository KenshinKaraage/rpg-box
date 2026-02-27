'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TemplateArgEditor } from './TemplateArgEditor';
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
      onUpdate(template.id, { id: trimmedId });
    }
  };

  const handleArgsChange = (args: TemplateArg[]) => {
    onUpdate(template.id, { args });
  };

  return (
    <div className="flex h-full flex-col">
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
            onChange={(e) => onUpdate(template.id, { name: e.target.value })}
            placeholder="テンプレート名を入力"
            data-testid="template-name-input"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="templateDescription">説明（オプション）</Label>
          <Textarea
            id="templateDescription"
            defaultValue={template.description ?? ''}
            onChange={(e) => onUpdate(template.id, { description: e.target.value })}
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
