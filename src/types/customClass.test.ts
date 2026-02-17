import '@/types/fields'; // register field types

import { createFieldTypeInstance } from '@/types/fields';

import type { CustomClass } from './customClass';
import { wouldCreateCycle } from './customClass';

/** classId 付きの ClassFieldType を生成するヘルパー */
function classField(id: string, classId: string) {
  const f = createFieldTypeInstance('class')!;
  f.id = id;
  f.name = id;
  (f as unknown as { classId: string }).classId = classId;
  return f;
}

function numberField(id: string) {
  const f = createFieldTypeInstance('number')!;
  f.id = id;
  f.name = id;
  return f;
}

describe('wouldCreateCycle', () => {
  it('detects self-reference', () => {
    const classes: CustomClass[] = [{ id: 'A', name: 'A', fields: [] }];
    expect(wouldCreateCycle('A', 'A', classes)).toBe(true);
  });

  it('allows non-circular reference', () => {
    const classes: CustomClass[] = [
      { id: 'A', name: 'A', fields: [] },
      { id: 'B', name: 'B', fields: [numberField('hp')] },
    ];
    expect(wouldCreateCycle('A', 'B', classes)).toBe(false);
  });

  it('detects direct circular reference (A→B, B→A)', () => {
    const classes: CustomClass[] = [
      { id: 'A', name: 'A', fields: [classField('ref', 'B')] },
      { id: 'B', name: 'B', fields: [classField('ref', 'A')] },
    ];
    // B already references A, so adding A→B would create a cycle
    expect(wouldCreateCycle('A', 'B', classes)).toBe(true);
  });

  it('detects indirect circular reference (A→B→C→A)', () => {
    const classes: CustomClass[] = [
      { id: 'A', name: 'A', fields: [] },
      { id: 'B', name: 'B', fields: [classField('ref', 'C')] },
      { id: 'C', name: 'C', fields: [classField('ref', 'A')] },
    ];
    // B→C→A, so adding A→B would create a cycle
    expect(wouldCreateCycle('A', 'B', classes)).toBe(true);
  });

  it('allows reference when no cycle exists in chain', () => {
    const classes: CustomClass[] = [
      { id: 'A', name: 'A', fields: [] },
      { id: 'B', name: 'B', fields: [classField('ref', 'C')] },
      { id: 'C', name: 'C', fields: [numberField('val')] },
    ];
    // B→C (no class fields in C referencing A)
    expect(wouldCreateCycle('A', 'B', classes)).toBe(false);
  });

  it('handles unknown classId gracefully', () => {
    const classes: CustomClass[] = [{ id: 'A', name: 'A', fields: [] }];
    expect(wouldCreateCycle('A', 'nonexistent', classes)).toBe(false);
  });

  it('handles class with no class-type fields', () => {
    const classes: CustomClass[] = [
      { id: 'A', name: 'A', fields: [] },
      { id: 'B', name: 'B', fields: [numberField('hp'), numberField('mp')] },
    ];
    expect(wouldCreateCycle('A', 'B', classes)).toBe(false);
  });
});
