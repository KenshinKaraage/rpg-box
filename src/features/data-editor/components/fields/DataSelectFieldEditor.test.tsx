/**
 * DataSelectFieldEditor のテスト
 */
import { render, screen } from '@testing-library/react';
import { DataSelectFieldEditor } from './DataSelectFieldEditor';
import { useStore } from '@/stores';

// Mock useStore
jest.mock('@/stores', () => ({
  useStore: jest.fn(),
}));

const mockEntries = [
  { id: 'entry_001', typeId: 'type_character', values: { name: 'スライム' } },
  { id: 'entry_002', typeId: 'type_character', values: { name: 'ゴブリン' } },
  { id: 'entry_003', typeId: 'type_character', values: {} },
];

describe('DataSelectFieldEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({
        dataEntries: {
          type_character: mockEntries,
        },
      })
    );
  });

  describe('referenceTypeId が未設定の場合', () => {
    it('「参照先データタイプが設定されていません」が表示される', () => {
      render(<DataSelectFieldEditor value={null} onChange={jest.fn()} referenceTypeId="" />);
      expect(screen.getByText('参照先データタイプが設定されていません')).toBeInTheDocument();
    });
  });

  describe('エントリが存在しない場合', () => {
    beforeEach(() => {
      (useStore as unknown as jest.Mock).mockImplementation((selector) =>
        selector({
          dataEntries: {
            type_empty: [],
          },
        })
      );
    });

    it('「エントリが存在しません」が表示される', () => {
      render(
        <DataSelectFieldEditor value={null} onChange={jest.fn()} referenceTypeId="type_empty" />
      );
      expect(screen.getByText('エントリが存在しません')).toBeInTheDocument();
    });
  });

  describe('エントリが存在する場合', () => {
    it('セレクトボックスが表示される', () => {
      render(
        <DataSelectFieldEditor value={null} onChange={jest.fn()} referenceTypeId="type_character" />
      );
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('value が null の場合プレースホルダーが表示される', () => {
      render(
        <DataSelectFieldEditor value={null} onChange={jest.fn()} referenceTypeId="type_character" />
      );
      expect(screen.getByText('エントリを選択...')).toBeInTheDocument();
    });

    it('values["name"] がある場合はエントリ名が表示される', () => {
      render(
        <DataSelectFieldEditor
          value="entry_001"
          onChange={jest.fn()}
          referenceTypeId="type_character"
        />
      );
      expect(screen.getByText('スライム')).toBeInTheDocument();
    });

    it('エラーメッセージが表示される', () => {
      render(
        <DataSelectFieldEditor
          value={null}
          onChange={jest.fn()}
          referenceTypeId="type_character"
          error="必須項目です"
        />
      );
      expect(screen.getByText('必須項目です')).toBeInTheDocument();
    });

    it('disabled が true の場合セレクトが無効化される', () => {
      render(
        <DataSelectFieldEditor
          value={null}
          onChange={jest.fn()}
          referenceTypeId="type_character"
          disabled={true}
        />
      );
      expect(screen.getByRole('combobox')).toBeDisabled();
    });
  });

  describe('values["name"] が存在しないエントリ', () => {
    it('name がない場合はエントリIDが表示される', () => {
      render(
        <DataSelectFieldEditor
          value="entry_003"
          onChange={jest.fn()}
          referenceTypeId="type_character"
        />
      );
      // entry_003 は values: {} なので ID が表示される
      expect(screen.getByText('entry_003')).toBeInTheDocument();
    });
  });
});
