import { syncDataTypeIdChange, syncDataEntryIdChange } from './idSync';
import { createFieldTypeInstance } from '@/types/fields';
import type { DataType, DataEntry } from '@/types/data';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function f(type: string, props: Record<string, unknown>): any {
  const instance = createFieldTypeInstance(type);
  if (!instance) throw new Error(`Unknown: ${type}`);
  return Object.assign(instance, props);
}

describe('syncDataTypeIdChange', () => {
  it('referenceTypeId を oldId → newId に更新する', () => {
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
        id: 'enemy',
        name: '敵',
        fields: [
          f('dataTable', { id: 'resist', name: '耐性', referenceTypeId: 'element' }),
          f('dataSelect', { id: 'drop', name: 'ドロップ', referenceTypeId: 'item' }),
        ],
      },
    ];

    syncDataTypeIdChange(dataTypes, 'skill', 'ability');

    // skill → ability に変更された
    expect(dataTypes[0]!.fields[1]).toHaveProperty('referenceTypeId', 'ability');
    // 他は変わらない
    expect(dataTypes[0]!.fields[0]).toHaveProperty('referenceTypeId', 'job');
    expect(dataTypes[1]!.fields[0]).toHaveProperty('referenceTypeId', 'element');
    expect(dataTypes[1]!.fields[1]).toHaveProperty('referenceTypeId', 'item');
  });

  it('一致しない場合は何も変更しない', () => {
    const dataTypes: DataType[] = [
      {
        id: 'a',
        name: 'A',
        fields: [f('dataSelect', { id: 'ref', name: 'Ref', referenceTypeId: 'b' })],
      },
    ];
    syncDataTypeIdChange(dataTypes, 'nonexistent', 'new');
    expect(dataTypes[0]!.fields[0]).toHaveProperty('referenceTypeId', 'b');
  });
});

describe('syncDataEntryIdChange', () => {
  it('dataSelect フィールドの値を更新する', () => {
    const dataTypes: DataType[] = [
      {
        id: 'character',
        name: 'キャラクター',
        fields: [f('dataSelect', { id: 'job', name: 'ジョブ', referenceTypeId: 'job' })],
      },
    ];
    const dataEntries: Record<string, DataEntry[]> = {
      character: [
        { id: 'hero', typeId: 'character', values: { job: 'warrior' } },
        { id: 'mage', typeId: 'character', values: { job: 'wizard' } },
      ],
    };

    syncDataEntryIdChange(dataTypes, dataEntries, 'job', 'warrior', 'fighter');

    expect(dataEntries.character![0]!.values.job).toBe('fighter');
    expect(dataEntries.character![1]!.values.job).toBe('wizard'); // 変わらない
  });

  it('dataList フィールドの値を更新する', () => {
    const dataTypes: DataType[] = [
      {
        id: 'character',
        name: 'キャラクター',
        fields: [f('dataList', { id: 'skills', name: 'スキル', referenceTypeId: 'skill' })],
      },
    ];
    const dataEntries: Record<string, DataEntry[]> = {
      character: [{ id: 'hero', typeId: 'character', values: { skills: ['fire', 'ice', 'fire'] } }],
    };

    syncDataEntryIdChange(dataTypes, dataEntries, 'skill', 'fire', 'flame');

    expect(dataEntries.character![0]!.values.skills).toEqual(['flame', 'ice', 'flame']);
  });

  it('dataTable フィールドの行IDを更新する', () => {
    const dataTypes: DataType[] = [
      {
        id: 'enemy',
        name: '敵',
        fields: [f('dataTable', { id: 'resist', name: '耐性', referenceTypeId: 'element' })],
      },
    ];
    const dataEntries: Record<string, DataEntry[]> = {
      enemy: [
        {
          id: 'slime',
          typeId: 'enemy',
          values: {
            resist: [
              { id: 'fire', values: { rate: 50 } },
              { id: 'ice', values: { rate: 100 } },
            ],
          },
        },
      ],
    };

    syncDataEntryIdChange(dataTypes, dataEntries, 'element', 'fire', 'flame');

    const rows = dataEntries.enemy![0]!.values.resist as Array<{ id: string }>;
    expect(rows[0]!.id).toBe('flame');
    expect(rows[1]!.id).toBe('ice'); // 変わらない
  });

  it('参照先typeIdが一致しないフィールドは無視する', () => {
    const dataTypes: DataType[] = [
      {
        id: 'character',
        name: 'キャラクター',
        fields: [f('dataSelect', { id: 'job', name: 'ジョブ', referenceTypeId: 'job' })],
      },
    ];
    const dataEntries: Record<string, DataEntry[]> = {
      character: [{ id: 'hero', typeId: 'character', values: { job: 'warrior' } }],
    };

    // skill タイプのエントリID変更 → job参照には影響しない
    syncDataEntryIdChange(dataTypes, dataEntries, 'skill', 'warrior', 'fighter');

    expect(dataEntries.character![0]!.values.job).toBe('warrior');
  });
});
