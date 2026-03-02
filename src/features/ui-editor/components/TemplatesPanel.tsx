'use client';

interface TemplatesPanelProps {
  templates: { id: string; name: string }[];
}

export function TemplatesPanel({ templates }: TemplatesPanelProps) {
  return (
    <div className="p-2 text-xs text-muted-foreground">
      {templates.length === 0 ? (
        <div className="text-center">テンプレートなし</div>
      ) : (
        <ul>
          {templates.map((tmpl) => (
            <li key={tmpl.id} className="px-2 py-1">
              {tmpl.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
