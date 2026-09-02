/**
 * レイヤー切り替え時に選択すべきチップセットIDを決定する。
 * レイヤーに記録されている最後に選択していたチップセットを優先し、
 * それが無効（未割当）なら先頭のチップセットにフォールバックする。
 */
export function resolveDefaultChipsetId(layer: {
  chipsetIds: string[];
  selectedChipsetId?: string;
}): string | null {
  if (layer.selectedChipsetId && layer.chipsetIds.includes(layer.selectedChipsetId)) {
    return layer.selectedChipsetId;
  }
  return layer.chipsetIds[0] ?? null;
}
