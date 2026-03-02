import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface VertexFieldProps {
  vertices: { x: number; y: number }[];
  onChange: (v: { x: number; y: number }[]) => void;
  minVertices?: number;
}

export function VertexField({ vertices, onChange, minVertices = 3 }: VertexFieldProps) {
  const handleVertexChange = (index: number, axis: 'x' | 'y', value: number) => {
    const updated = vertices.map((v, i) => (i === index ? { ...v, [axis]: value } : v));
    onChange(updated);
  };

  const handleRemove = (index: number) => {
    if (vertices.length <= minVertices) return;
    onChange(vertices.filter((_, i) => i !== index));
  };

  const handleAdd = () => {
    const last = vertices[vertices.length - 1];
    const first = vertices[0];
    if (last && first) {
      onChange([...vertices, { x: (last.x + first.x) / 2, y: (last.y + first.y) / 2 }]);
    } else {
      onChange([...vertices, { x: 0.5, y: 0.5 }]);
    }
  };

  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">頂点</Label>
      {vertices.map((v, i) => (
        <div key={i} className="flex items-center gap-1">
          <span className="w-5 shrink-0 text-right text-[10px] text-muted-foreground">{i}</span>
          <Input
            type="number"
            className="h-6 flex-1 px-1 text-xs"
            value={v.x}
            step={0.01}
            min={0}
            max={1}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) handleVertexChange(i, 'x', val);
            }}
          />
          <Input
            type="number"
            className="h-6 flex-1 px-1 text-xs"
            value={v.y}
            step={0.01}
            min={0}
            max={1}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) handleVertexChange(i, 'y', val);
            }}
          />
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 shrink-0 p-0"
            disabled={vertices.length <= minVertices}
            onClick={() => handleRemove(i)}
            aria-label="頂点を削除"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
      <Button
        size="sm"
        variant="outline"
        className="h-6 w-full text-xs"
        onClick={handleAdd}
      >
        <Plus className="mr-1 h-3 w-3" />
        頂点を追加
      </Button>
    </div>
  );
}
