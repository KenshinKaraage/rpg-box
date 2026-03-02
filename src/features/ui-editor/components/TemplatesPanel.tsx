'use client';

import { Trash2, Save, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/stores';
import { useTemplateSave } from '../hooks/useTemplateSave';
import { useTemplateInstantiate } from '../hooks/useTemplateInstantiate';
import type { EditorUITemplate } from '@/stores/uiEditorSlice';

interface TemplatesPanelProps {
  templates: EditorUITemplate[];
}

export function TemplatesPanel({ templates }: TemplatesPanelProps) {
  const deleteUITemplate = useStore((s) => s.deleteUITemplate);
  const selectUIObjects = useStore((s) => s.selectUIObjects);
  const { canSave, saveAsTemplate } = useTemplateSave();
  const { canInstantiate, instantiateTemplate } = useTemplateInstantiate();

  const handleInstantiate = (tmpl: EditorUITemplate) => {
    const newIds = instantiateTemplate(tmpl);
    if (newIds.length > 0) {
      // ルートオブジェクト（parentId なし）を選択
      selectUIObjects([newIds[0]!]);
    }
  };

  return (
    <div className="p-2" data-testid="templates-panel">
      {/* Save button */}
      <div className="mb-2">
        <Button
          size="sm"
          variant="outline"
          className="w-full gap-1 text-xs"
          disabled={!canSave}
          onClick={() => saveAsTemplate()}
          data-testid="save-template-btn"
        >
          <Save className="h-3.5 w-3.5" />
          選択をテンプレートに保存
        </Button>
      </div>

      {/* Template list */}
      {templates.length === 0 ? (
        <div className="text-center text-xs text-muted-foreground">
          テンプレートなし
        </div>
      ) : (
        <ul className="space-y-1">
          {templates.map((tmpl) => (
            <li
              key={tmpl.id}
              className="flex items-center justify-between rounded px-2 py-1 hover:bg-accent"
              data-testid={`template-item-${tmpl.id}`}
            >
              <span className="truncate text-xs">{tmpl.name}</span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground">
                  {tmpl.objects.length}obj
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-5 w-5 p-0"
                  disabled={!canInstantiate}
                  onClick={() => handleInstantiate(tmpl)}
                  aria-label={`${tmpl.name}を配置`}
                  data-testid={`instantiate-template-${tmpl.id}`}
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-5 w-5 p-0"
                  onClick={() => deleteUITemplate(tmpl.id)}
                  aria-label={`${tmpl.name}を削除`}
                  data-testid={`delete-template-${tmpl.id}`}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
