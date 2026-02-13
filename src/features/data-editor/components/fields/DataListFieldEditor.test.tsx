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

  describe('エントリが存在する場合', () => {
    it('エントリ名がチェックボックスとして表示される', () => {
      render(<DataListFieldEditor value={[]} onChange={jest.fn()} referenceTypeId="tag_type" />);
      expect(screen.getByText('タグA')).toBeInTheDocument();
      expect(screen.getByText('タグB')).toBeInTheDocument();
    });

    it('name がない場合はエントリIDがラベルとして表示される', () => {
      render(<DataListFieldEditor value={[]} onChange={jest.fn()} referenceTypeId="tag_type" />);
      expect(screen.getByText('entry_003')).toBeInTheDocument();
    });

    it('value に含まれるエントリのチェックボックスがチェック済み', () => {
      render(
        <DataListFieldEditor
          value={['entry_001']}
          onChange={jest.fn()}
          referenceTypeId="tag_type"
        />
      );
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[0]).toBeChecked();
      expect(checkboxes[1]).not.toBeChecked();
    });

    it('チェックボックスをオンにするとonChangeが呼ばれる', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<DataListFieldEditor value={[]} onChange={onChange} referenceTypeId="tag_type" />);
      await user.click(screen.getByText('タグA'));
      expect(onChange).toHaveBeenCalledWith(['entry_001']);
    });

    it('チェックボックスをオフにするとonChangeが呼ばれる', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(
        <DataListFieldEditor
          value={['entry_001', 'entry_002']}
          onChange={onChange}
          referenceTypeId="tag_type"
        />
      );
      await user.click(screen.getByText('タグA'));
      expect(onChange).toHaveBeenCalledWith(['entry_002']);
    });

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

    it('disabled が true の場合、チェックボックスが無効化される', () => {
      render(
        <DataListFieldEditor value={[]} onChange={jest.fn()} referenceTypeId="tag_type" disabled />
      );
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach((checkbox) => {
        expect(checkbox).toBeDisabled();
      });
    });
  });
});
