'use client';

interface FunctionsPanelProps {
  functions: { id: string; name: string }[];
}

export function FunctionsPanel({ functions }: FunctionsPanelProps) {
  return (
    <div className="p-2 text-xs text-muted-foreground">
      {functions.length === 0 ? (
        <div className="text-center">ファンクションなし</div>
      ) : (
        <ul>
          {functions.map((fn) => (
            <li key={fn.id} className="px-2 py-1">
              {fn.name}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-2 text-center text-muted-foreground">
        UIFunctionEditor (T197a で実装)
      </div>
    </div>
  );
}
