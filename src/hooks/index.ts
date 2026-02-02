// Custom hooks
export {
  useAutoSave,
  useTempDataRecovery,
  type AutoSaveStatus,
  type UseAutoSaveOptions,
  type UseAutoSaveReturn,
  type TempDataRecovery,
} from './useAutoSave';

export {
  useStorage,
  type StorageOperation,
  type StorageState,
  type UseStorageReturn,
} from './useStorage';

export {
  useUndo,
  useUndoWithKey,
  type UseUndoOptions,
  type UseUndoReturn,
  type UseUndoWithKeyReturn,
} from './useUndo';

export {
  useKeyboardShortcut,
  useShortcut,
  parseShortcut,
  shortcutToString,
  shortcutManager,
  CommonShortcuts,
  type ModifierKey,
  type ShortcutKey,
  type ShortcutConfig,
  type UseKeyboardShortcutOptions,
} from './useKeyboardShortcut';
