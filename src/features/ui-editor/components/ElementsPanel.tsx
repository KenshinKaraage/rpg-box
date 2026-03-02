'use client';

interface ElementsPanelProps {
  objects: { id: string; name: string }[];
}

export function ElementsPanel({ objects }: ElementsPanelProps) {
  return (
    <div className="p-2 text-xs text-muted-foreground">
      {objects.length === 0 ? (
        <div className="text-center">エレメントなし</div>
      ) : (
        <ul>
          {objects.map((obj) => (
            <li key={obj.id} className="px-2 py-1">
              {obj.name}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-2 text-center text-muted-foreground">
        UIObjectTree (T190 で実装)
      </div>
    </div>
  );
}
