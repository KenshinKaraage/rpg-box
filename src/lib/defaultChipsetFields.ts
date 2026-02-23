import { BooleanFieldType, SelectFieldType } from '@/types/fields';
import type { FieldType } from '@/types/fields/FieldType';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createDefaultChipsetFields(): FieldType<any>[] {
  const passableField = new BooleanFieldType();
  passableField.id = 'passable';
  passableField.name = '通行可能';

  const footstepField = new SelectFieldType();
  footstepField.id = 'footstep_type';
  footstepField.name = '足音';
  footstepField.options = [
    { value: '', label: 'なし' },
    { value: 'grass', label: '草むら' },
    { value: 'stone', label: '石畳' },
    { value: 'wood', label: '木床' },
    { value: 'sand', label: '砂地' },
  ];

  return [passableField, footstepField];
}
