/**
 * DataListFieldEditor のテスト
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataListFieldEditor } from './DataListFieldEditor';
import { useStore } from '@/stores';

// Mock useStore
jest.mock('@/stores', () => ({
  useStore: jest.fn(),
}));

const mockEntries = [
  { id: 'entry_001', typeId: 'tag_type', values: { name: 'タグA' } },
  { id: 'entry_002', typeId: 'tag_type', values: { name: 'タグB' } },
  { id: 'entry_003', typeId: 'tag_type', values: {} },
];

describe('DataListFieldEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({
        dataEntries: {
          tag_type: mockEntries,
        },
      })
    );
  });

  describe('referenceTypeId が未設定の場合', () => {
    it('設定なしのメッセージが表示される', () => {
      render(<DataListFieldEditor value={[]} onChange={jest.fn()} referenceTypeId="" />);
      expect(screen.getByText('データタイプが設定されていません')).toBeInTheDocument();
    });
  });

  describe('エントリが存在しない場合', () => {
    it('エントリなしのメッセージが表示される', () => {
      (useStore as unknown as jest.Mock).mockImplementation((selector) =>
        selector({
          dataEntries: {
            empty_type: [],
          },
        })
      );

      render(<DataListFieldEditor value={[]} onChange={jest.fn()} referenceTypeId="empty_type" />);
      expect(screen.getByText('エントリが存在しません')).toBeInTheDocument();
    });
  });

  describe('リスト表示', () => {
    it('選択済みエントリがリストに表示される', () => {
      render(
        <DataListFieldEditor
          value={['entry_001', 'entry_002']}
          onChange={jest.fn()}
          referenceTypeId="tag_type"
        />
      );
      expect(screen.getByText('タグA')).toBeInTheDocument();
      expect(screen.getByText('タグB')).toBeInTheDocument();
    });

    it('name がない場合はエントリIDが表示される', () => {
      render(
        <DataListFieldEditor
          value={['entry_003']}
          onChange={jest.fn()}
          referenceTypeId="tag_type"
        />
      );
      expect(screen.getByText('entry_003')).toBeInTheDocument();
    });

    it('選択済みアイテムに削除ボタンがある', () => {
      render(
        <DataListFieldEditor
          value={['entry_001']}
          onChange={jest.fn()}
          referenceTypeId="tag_type"
        />
      );
      expect(screen.getByRole('button', { name: 'タグAを削除' })).toBeInTheDocument();
    });

    it('追加ボタンが表示される', () => {
      render(<DataListFieldEditor value={[]} onChange={jest.fn()} referenceTypeId="tag_type" />);
      expect(screen.getByRole('button', { name: '追加' })).toBeInTheDocument();
    });

    it('全エントリが選択済みの場合、追加UIが非表示', () => {
      render(
        <DataListFieldEditor
          value={['entry_001', 'entry_002', 'entry_003']}
          onChange={jest.fn()}
          referenceTypeId="tag_type"
        />
      );
      expect(screen.queryByRole('button', { name: '追加' })).not.toBeInTheDocument();
    });
  });

  describe('操作', () => {
    it('削除ボタンをクリックするとonChangeが呼ばれる', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(
        <DataListFieldEditor
          value={['entry_001', 'entry_002']}
          onChange={onChange}
          referenceTypeId="tag_type"
        />
      );

      await user.click(screen.getByRole('button', { name: 'タグAを削除' }));
      expect(onChange).toHaveBeenCalledWith(['entry_002']);
    });
  });

  describe('disabled', () => {
    it('disabled の場合、削除ボタンが非表示', () => {
      render(
        <DataListFieldEditor
          value={['entry_001']}
          onChange={jest.fn()}
          referenceTypeId="tag_type"
          disabled
        />
      );
      expect(screen.queryByRole('button', { name: 'タグAを削除' })).not.toBeInTheDocument();
    });

    it('disabled の場合、追加UIが非表示', () => {
      render(
        <DataListFieldEditor value={[]} onChange={jest.fn()} referenceTypeId="tag_type" disabled />
      );
      expect(screen.queryByRole('button', { name: '追加' })).not.toBeInTheDocument();
    });
  });

  describe('エラー表示', () => {
    it('error が指定された場合、エラーメッセージが表示される', () => {
      render(
        <DataListFieldEditor
          value={[]}
          onChange={jest.fn()}
          referenceTypeId="tag_type"
          error="1件以上選択してください"
        />
      );
      expect(screen.getByText('1件以上選択してください')).toBeInTheDocument();
    });
  });
});
