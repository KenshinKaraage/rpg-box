/**
 * ClassListFieldEditor のテスト
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClassListFieldEditor } from './ClassListFieldEditor';
import { useStore } from '@/stores';
import { NumberFieldType } from '@/types/fields/NumberFieldType';
import { StringFieldType } from '@/types/fields/StringFieldType';

jest.mock('@/stores', () => ({
  useStore: jest.fn(),
}));

function createMockClass() {
  const levelField = new NumberFieldType();
  levelField.id = 'level';
  levelField.name = 'レベル';

  const nameField = new StringFieldType();
  nameField.id = 'name';
  nameField.name = 'スキル名';

  return {
    id: 'class_skill',
    name: '習得スキル',
    fields: [levelField, nameField],
  };
}

describe('ClassListFieldEditor', () => {
  const mockClass = createMockClass();

  beforeEach(() => {
    jest.clearAllMocks();
    (useStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({
        classes: [mockClass],
      })
    );
  });

  describe('classId が未設定の場合', () => {
    it('設定なしのメッセージが表示される', () => {
      render(<ClassListFieldEditor value={[]} onChange={jest.fn()} classId="" />);
      expect(screen.getByText('クラスが設定されていません')).toBeInTheDocument();
    });
  });

  describe('classId のクラスが見つからない場合', () => {
    it('見つかりませんメッセージが表示される', () => {
      render(<ClassListFieldEditor value={[]} onChange={jest.fn()} classId="nonexistent" />);
      expect(screen.getByText(/クラス「nonexistent」が見つかりません/)).toBeInTheDocument();
    });
  });

  describe('空リスト', () => {
    it('追加ボタンが表示される', () => {
      render(<ClassListFieldEditor value={[]} onChange={jest.fn()} classId="class_skill" />);
      expect(screen.getByRole('button', { name: '追加' })).toBeInTheDocument();
    });
  });

  describe('リスト表示', () => {
    it('アイテムが表示される（name フィールドの値をラベルに使用）', () => {
      render(
        <ClassListFieldEditor
          value={[{ level: 5, name: 'ファイア' }]}
          onChange={jest.fn()}
          classId="class_skill"
        />
      );
      expect(screen.getByText('ファイア')).toBeInTheDocument();
    });

    it('name がない場合は番号表示', () => {
      render(
        <ClassListFieldEditor value={[{ level: 5 }]} onChange={jest.fn()} classId="class_skill" />
      );
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('削除ボタンが表示される', () => {
      render(
        <ClassListFieldEditor
          value={[{ level: 5, name: 'ファイア' }]}
          onChange={jest.fn()}
          classId="class_skill"
        />
      );
      expect(screen.getByRole('button', { name: 'ファイアを削除' })).toBeInTheDocument();
    });
  });

  describe('操作', () => {
    it('追加ボタンをクリックするとデフォルト値で追加', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<ClassListFieldEditor value={[]} onChange={onChange} classId="class_skill" />);

      await user.click(screen.getByRole('button', { name: '追加' }));
      expect(onChange).toHaveBeenCalledWith([{ level: 0, name: '' }]);
    });

    it('削除ボタンをクリックすると項目が削除される', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(
        <ClassListFieldEditor
          value={[
            { level: 5, name: 'ファイア' },
            { level: 10, name: 'ブリザド' },
          ]}
          onChange={onChange}
          classId="class_skill"
        />
      );

      await user.click(screen.getByRole('button', { name: 'ファイアを削除' }));
      expect(onChange).toHaveBeenCalledWith([{ level: 10, name: 'ブリザド' }]);
    });
  });

  describe('disabled', () => {
    it('disabled の場合、追加ボタンが非表示', () => {
      render(
        <ClassListFieldEditor value={[]} onChange={jest.fn()} classId="class_skill" disabled />
      );
      expect(screen.queryByRole('button', { name: '追加' })).not.toBeInTheDocument();
    });

    it('disabled の場合、削除ボタンが非表示', () => {
      render(
        <ClassListFieldEditor
          value={[{ level: 5, name: 'ファイア' }]}
          onChange={jest.fn()}
          classId="class_skill"
          disabled
        />
      );
      expect(screen.queryByRole('button', { name: 'ファイアを削除' })).not.toBeInTheDocument();
    });
  });

  describe('エラー表示', () => {
    it('error が指定された場合、エラーメッセージが表示される', () => {
      render(
        <ClassListFieldEditor
          value={[]}
          onChange={jest.fn()}
          classId="class_skill"
          error="1件以上追加してください"
        />
      );
      expect(screen.getByText('1件以上追加してください')).toBeInTheDocument();
    });
  });
});
