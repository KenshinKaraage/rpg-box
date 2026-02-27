import { findDataTypeReferences, findDataEntryReferences } from './referenceCheck';
import { createFieldTypeInstance } from '@/types/fields';
import type { DataType, DataEntry } from '@/types/data';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function f(type: string, props: Record<string, unknown>): any {
  const instance = createFieldTypeInstance(type);
  if (!instance) throw new Error(`Unknown: ${type}`);
  return Object.assign(instance, props);
}

const dataTypes: DataType[] = [
  {
    id: 'character',
    name: 'キャラクター',
    fields: [
      f('dataSelect', { id: 'job', name: 'ジョブ', referenceTypeId: 'job' }),
      f('dataList', { id: 'skills', name: 'スキル', referenceTypeId: 'skill' }),
      f('number', { id: 'hp', name: 'HP' }),
    ],
  },
  {
    id: 'job',
    name: 'ジョブ',
    fields: [f('string', { id: 'name', name: '名前' })],
  },
  {
    id: 'skill',
    name: 'スキル',
    fields: [f('string', { id: 'name', name: '名前' })],
  },
  {
    id: 'enemy',
    name: '敵',
    fields: [f('dataTable', { id: 'resist', name: '耐性', referenceTypeId: 'element' })],
  },
  {
    id: 'element',
    name: '属性',
    fields: [f('string', { id: 'name', name: '名前' })],
  },
];

describe('findDataTypeReferences', () => {
  it('参照しているフィールドを検出する', () => {
    const refs = findDataTypeReferences(dataTypes, 'job');
    expect(refs).toHaveLength(1);
    expect(refs[0]).toMatchObject({
      dataTypeId: 'character',
      fieldId: 'job',
    });
  });

  it('自分自身は除外する', () => {
    const refs = findDataTypeReferences(dataTypes, 'character');
    expect(refs).toHaveLength(0);
  });

  it('参照がない場合は空配列を返す', () => {
    const refs = findDataTypeReferences(dataTypes, 'nonexistent');
    expect(refs).toHaveLength(0);
  });

  it('複数の参照を検出する', () => {
    const refs = findDataTypeReferences(dataTypes, 'skill');
    expect(refs).toHaveLength(1);
    expect(refs[0]).toMatchObject({
      dataTypeId: 'character',
      fieldId: 'skills',
    });
  });
});

describe('findDataEntryReferences', () => {
  const dataEntries: Record<string, DataEntry[]> = {
    character: [
      { id: 'hero', typeId: 'character', values: { job: 'warrior', skills: ['fire', 'heal'] } },
      { id: 'mage', typeId: 'character', values: { job: 'mage_class', skills: ['fire', 'ice'] } },
    ],
    enemy: [
      {
        id: 'slime',
        typeId: 'enemy',
        values: {
          resist: [
            { id: 'fire_elem', values: { rate: 50 } },
            { id: 'ice_elem', values: { rate: 100 } },
          ],
        },
      },
    ],
    job: [],
    skill: [],
    element: [],
  };

  it('dataSelect参照を検出する', () => {
    const refs = findDataEntryReferences(dataTypes, dataEntries, 'job', 'warrior');
    expect(refs).toHaveLength(1);
    expect(refs[0]).toMatchObject({
      dataTypeId: 'character',
      entryId: 'hero',
      fieldId: 'job',
    });
  });

  it('dataList参照を検出する', () => {
    const refs = findDataEntryReferences(dataTypes, dataEntries, 'skill', 'fire');
    expect(refs).toHaveLength(2); // hero と mage の両方
    expect(refs.map((r) => r.entryId)).toEqual(['hero', 'mage']);
  });

  it('dataTable参照を検出する', () => {
    const refs = findDataEntryReferences(dataTypes, dataEntries, 'element', 'fire_elem');
    expect(refs).toHaveLength(1);
    expect(refs[0]).toMatchObject({
      dataTypeId: 'enemy',
      entryId: 'slime',
      fieldId: 'resist',
    });
  });

  it('参照がない場合は空配列を返す', () => {
    const refs = findDataEntryReferences(dataTypes, dataEntries, 'job', 'nonexistent');
    expect(refs).toHaveLength(0);
  });
});
