'use client';

import { useState } from 'react';
import {
  Plus,
  Search,
  ChevronRight,
  Hash,
  Type,
  ToggleLeft,
  Image,
  Palette,
  Link2,
  GripVertical,
  Trash2,
  Tag,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// Mock Data
// =============================================================================

const MOCK_DATA_TYPES = [
  { id: 'characters', name: 'キャラクター', entryCount: 8 },
  { id: 'monsters', name: 'モンスター', entryCount: 24 },
  { id: 'items', name: 'アイテム', entryCount: 45 },
  { id: 'skills', name: 'スキル', entryCount: 32 },
];

const MOCK_ENTRIES = [
  { id: 'alex', name: 'アレックス', desc: '伝説の勇者' },
  { id: 'mika', name: 'ミカ', desc: '回復魔法の使い手' },
  { id: 'new_character', name: '新規キャラクター', desc: '' },
];

const MOCK_FIELDS = [
  { id: 'name', name: '名前', type: 'string', icon: Type, color: 'bg-emerald-500' },
  { id: 'hp', name: 'HP', type: 'number', icon: Hash, color: 'bg-blue-500' },
  { id: 'attack', name: '攻撃力', type: 'number', icon: Hash, color: 'bg-blue-500' },
  { id: 'defense', name: '防御力', type: 'number', icon: Hash, color: 'bg-blue-500' },
  { id: 'is_boss', name: 'ボスフラグ', type: 'boolean', icon: ToggleLeft, color: 'bg-orange-500' },
  { id: 'image', name: '画像', type: 'image', icon: Image, color: 'bg-pink-500' },
  { id: 'element', name: '属性', type: 'select', icon: Palette, color: 'bg-violet-500' },
  { id: 'drop_item', name: 'ドロップアイテム', type: 'dataSelect', icon: Link2, color: 'bg-cyan-500' },
];

// =============================================================================
// Shared Button Components
// =============================================================================

/** 青背景の主要ボタン */
function PrimaryButton({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-medium text-white',
        'border border-blue-600',
        'hover:bg-blue-600 active:bg-blue-700',
        'transition-colors',
        className
      )}
    >
      {children}
    </button>
  );
}

/** 青枠の副ボタン */
function OutlineButton({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-lg border-2 border-blue-400 bg-white px-5 py-2.5 text-sm font-medium text-blue-500',
        'hover:bg-blue-50 active:bg-blue-100',
        'transition-colors',
        className
      )}
    >
      {children}
    </button>
  );
}

// =============================================================================
// Tab Navigation
// =============================================================================

type ProposalTab = 'A' | 'B' | 'C';

export default function UIProposalsPage() {
  const [activeTab, setActiveTab] = useState<ProposalTab>('A');

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Tab Bar */}
      <div className="flex items-center gap-4 border-b px-8 py-4">
        <h1 className="mr-6 text-lg font-bold text-gray-800">UI Proposals</h1>
        {[
          { id: 'A' as const, label: 'A: 基本レイアウト' },
          { id: 'B' as const, label: 'B: テーブル' },
          { id: 'C' as const, label: 'C: スキーマ' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'rounded-lg px-5 py-2.5 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-blue-500 border border-blue-600 text-white'
                : 'border border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'A' && <ProposalA />}
        {activeTab === 'B' && <ProposalB />}
        {activeTab === 'C' && <ProposalC />}
      </div>
    </div>
  );
}

// =============================================================================
// Proposal A: 基本レイアウト（スクリーンショット準拠）
// =============================================================================

function ProposalA() {
  const [selectedType, setSelectedType] = useState('characters');
  const [selectedEntry, setSelectedEntry] = useState<string | null>('alex');

  return (
    <div className="flex h-full">
      {/* ===== Left: Data Type Sidebar ===== */}
      <div className="flex w-[200px] shrink-0 flex-col border-r bg-gray-50">
        <div className="flex items-center justify-between px-5 py-5">
          <span className="text-sm font-bold text-gray-700">データタイプ</span>
          <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-500 hover:bg-gray-50">
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto px-3 pb-4">
          <div className="space-y-2">
            {MOCK_DATA_TYPES.map((dt) => {
              const isSelected = selectedType === dt.id;
              return (
                <button
                  key={dt.id}
                  onClick={() => setSelectedType(dt.id)}
                  className={cn(
                    'w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors',
                    isSelected
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300'
                  )}
                >
                  {dt.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== Center: Entry List ===== */}
      <div className="flex flex-1 flex-col border-r">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5">
          <h2 className="text-xl font-bold text-gray-800">キャラクター</h2>
          <div className="flex gap-3">
            <OutlineButton>フィールド編集</OutlineButton>
            <OutlineButton>新規作成</OutlineButton>
          </div>
        </div>

        {/* Entry cards */}
        <div className="flex-1 overflow-auto px-6 pb-6">
          <div className="space-y-4">
            {MOCK_ENTRIES.map((entry) => (
              <button
                key={entry.id}
                onClick={() => setSelectedEntry(entry.id)}
                className={cn(
                  'flex w-full items-center justify-between rounded-xl border-2 px-6 py-5 text-left transition-colors',
                  selectedEntry === entry.id
                    ? 'border-blue-400 bg-blue-50/40'
                    : 'border-blue-200 hover:border-blue-300'
                )}
              >
                <div>
                  <div className="text-base font-bold text-gray-800">{entry.name}</div>
                  {entry.desc && (
                    <div className="mt-1.5 text-sm text-gray-400">{entry.desc}</div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button className="rounded-lg p-2.5 text-gray-400 hover:bg-amber-50 hover:text-amber-600">
                    <Tag className="h-5 w-5" />
                  </button>
                  <button className="rounded-lg p-2.5 text-gray-400 hover:bg-red-50 hover:text-red-500">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===== Right: Edit Form ===== */}
      <div className="flex w-[360px] shrink-0 flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5">
          <h3 className="text-xl font-bold text-gray-800">新規キャラクター</h3>
          <button className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-auto px-6 pb-6">
          <div className="space-y-8">
            <div>
              <label className="mb-3 block text-sm font-medium text-gray-600">名前</label>
              <input
                defaultValue="マイケル"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-gray-600">説明</label>
              <textarea
                defaultValue="学生"
                rows={3}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-gray-600">画像</label>
              <button className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-400 hover:border-blue-400">
                選択してください
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-gray-600">ジョブ</label>
              <button className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-400 hover:border-blue-400">
                選択してください
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="px-6 pb-6">
          <PrimaryButton className="w-full py-3">保存</PrimaryButton>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Proposal B: テーブルビュー
// =============================================================================

function ProposalB() {
  const [selectedType, setSelectedType] = useState('monsters');
  const [selectedRow, setSelectedRow] = useState<string | null>('goblin');

  const entries = [
    { id: 'slime', name: 'スライム', hp: 10, attack: 3, defense: 2, exp: 5 },
    { id: 'goblin', name: 'ゴブリン', hp: 25, attack: 8, defense: 5, exp: 12 },
    { id: 'dragon', name: 'ドラゴン', hp: 500, attack: 45, defense: 30, exp: 300 },
    { id: 'skeleton', name: 'スケルトン', hp: 40, attack: 12, defense: 8, exp: 20 },
    { id: 'wolf', name: 'オオカミ', hp: 30, attack: 15, defense: 6, exp: 15 },
  ];

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="flex w-[200px] shrink-0 flex-col border-r bg-gray-50">
        <div className="flex items-center justify-between px-5 py-5">
          <span className="text-sm font-bold text-gray-700">データタイプ</span>
          <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-500 hover:bg-gray-50">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-auto px-3 pb-4">
          <div className="space-y-2">
            {MOCK_DATA_TYPES.map((dt) => {
              const isSelected = selectedType === dt.id;
              return (
                <button
                  key={dt.id}
                  onClick={() => setSelectedType(dt.id)}
                  className={cn(
                    'w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors',
                    isSelected
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300'
                  )}
                >
                  {dt.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex flex-1 flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-800">モンスター</h2>
            <span className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
              {entries.length} 件
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                placeholder="検索..."
                className="rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-blue-500"
              />
            </div>
            <OutlineButton>フィールド編集</OutlineButton>
            <PrimaryButton>
              <span className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                追加
              </span>
            </PrimaryButton>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto px-6 pb-6">
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border-b px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                    名前
                  </th>
                  <th className="border-b px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                    HP
                  </th>
                  <th className="border-b px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                    攻撃力
                  </th>
                  <th className="border-b px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                    防御力
                  </th>
                  <th className="border-b px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                    経験値
                  </th>
                  <th className="border-b px-5 py-4 text-right" />
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr
                    key={entry.id}
                    onClick={() => setSelectedRow(entry.id)}
                    className={cn(
                      'cursor-pointer transition-colors',
                      selectedRow === entry.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                    )}
                  >
                    <td className="border-b px-5 py-4 text-sm font-semibold text-gray-800">
                      {entry.name}
                    </td>
                    <td className="border-b px-5 py-4 text-sm tabular-nums text-gray-600">
                      {entry.hp}
                    </td>
                    <td className="border-b px-5 py-4 text-sm tabular-nums text-gray-600">
                      {entry.attack}
                    </td>
                    <td className="border-b px-5 py-4 text-sm tabular-nums text-gray-600">
                      {entry.defense}
                    </td>
                    <td className="border-b px-5 py-4 text-sm tabular-nums text-gray-600">
                      {entry.exp}
                    </td>
                    <td className="border-b px-5 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button className="rounded-lg p-2 text-gray-300 hover:bg-gray-100 hover:text-gray-500">
                          <Tag className="h-4 w-4" />
                        </button>
                        <button className="rounded-lg p-2 text-gray-300 hover:bg-red-50 hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Proposal C: スキーマエディタ（タブ切替）
// =============================================================================

function ProposalC() {
  const [activeTab, setActiveTab] = useState<'schema' | 'data'>('schema');
  const [expandedField, setExpandedField] = useState<string | null>('hp');

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="flex w-[200px] shrink-0 flex-col border-r bg-gray-50">
        <div className="flex items-center justify-between px-5 py-5">
          <span className="text-sm font-bold text-gray-700">データタイプ</span>
          <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-500 hover:bg-gray-50">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-auto px-3 pb-4">
          <div className="space-y-2">
            {MOCK_DATA_TYPES.map((dt) => {
              const isSelected = dt.id === 'monsters';
              return (
                <button
                  key={dt.id}
                  className={cn(
                    'w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors',
                    isSelected
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300'
                  )}
                >
                  {dt.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="border-b">
          <div className="flex items-center justify-between px-6 py-5">
            <h2 className="text-xl font-bold text-gray-800">モンスター</h2>
            {activeTab === 'schema' && (
              <PrimaryButton>
                <span className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  フィールド追加
                </span>
              </PrimaryButton>
            )}
            {activeTab === 'data' && (
              <PrimaryButton>
                <span className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  新規作成
                </span>
              </PrimaryButton>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-0 px-6">
            <button
              onClick={() => setActiveTab('schema')}
              className={cn(
                'border-b-2 px-5 py-3 text-sm font-medium transition-colors',
                activeTab === 'schema'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              )}
            >
              スキーマ
            </button>
            <button
              onClick={() => setActiveTab('data')}
              className={cn(
                'border-b-2 px-5 py-3 text-sm font-medium transition-colors',
                activeTab === 'data'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              )}
            >
              データ (6件)
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'schema' ? (
          <div className="flex-1 overflow-auto bg-gray-50 p-8">
            <div className="mx-auto max-w-2xl space-y-4">
              {MOCK_FIELDS.map((field) => {
                const Icon = field.icon;
                const isExpanded = expandedField === field.id;
                return (
                  <div
                    key={field.id}
                    className={cn(
                      'rounded-xl border-2 bg-white transition-colors',
                      isExpanded ? 'border-blue-400' : 'border-gray-200 hover:border-blue-200'
                    )}
                  >
                    {/* Field header */}
                    <div
                      className="flex cursor-pointer items-center gap-4 px-6 py-5"
                      onClick={() => setExpandedField(isExpanded ? null : field.id)}
                    >
                      <GripVertical className="h-5 w-5 shrink-0 cursor-grab text-gray-300" />

                      {/* Type badge */}
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5',
                          field.color
                        )}
                      >
                        <Icon className="h-3.5 w-3.5 text-white" />
                        <span className="text-xs font-medium text-white">{field.type}</span>
                      </span>

                      {/* Name */}
                      <span className="flex-1 text-sm font-bold text-gray-800">{field.name}</span>

                      {/* ID */}
                      <code className="rounded-lg bg-gray-100 px-3 py-1 text-xs text-gray-400">
                        {field.id}
                      </code>

                      <ChevronRight
                        className={cn(
                          'h-4 w-4 text-gray-400 transition-transform',
                          isExpanded && 'rotate-90'
                        )}
                      />
                    </div>

                    {/* Expanded config */}
                    {isExpanded && (
                      <div className="border-t bg-gray-50 px-6 py-6">
                        <div className="space-y-6">
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <label className="mb-3 block text-sm font-medium text-gray-600">
                                フィールドID
                              </label>
                              <input
                                defaultValue={field.id}
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 font-mono text-sm outline-none focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="mb-3 block text-sm font-medium text-gray-600">
                                フィールド名
                              </label>
                              <input
                                defaultValue={field.name}
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                              />
                            </div>
                          </div>

                          {field.type === 'number' && (
                            <div className="grid grid-cols-2 gap-6">
                              <div>
                                <label className="mb-3 block text-sm font-medium text-gray-600">
                                  最小値
                                </label>
                                <input
                                  defaultValue="0"
                                  type="number"
                                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                                />
                              </div>
                              <div>
                                <label className="mb-3 block text-sm font-medium text-gray-600">
                                  最大値
                                </label>
                                <input
                                  defaultValue="9999"
                                  type="number"
                                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                                />
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              id={`required-${field.id}`}
                              className="h-4 w-4 rounded border-gray-300"
                            />
                            <label
                              htmlFor={`required-${field.id}`}
                              className="text-sm text-gray-600"
                            >
                              必須フィールド
                            </label>
                          </div>

                          <div className="flex justify-end">
                            <button className="flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50">
                              <Trash2 className="h-4 w-4" />
                              削除
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add field */}
              <button className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-6 text-gray-400 hover:border-blue-400 hover:text-blue-500">
                <Plus className="h-5 w-5" />
                <span className="text-sm font-medium">フィールドを追加</span>
              </button>
            </div>
          </div>
        ) : (
          /* Data tab */
          <div className="flex-1 overflow-auto bg-gray-50 p-8">
            <div className="mx-auto max-w-2xl space-y-4">
              {[
                { id: 'slime', name: 'スライム', desc: 'HP: 10 / ATK: 3' },
                { id: 'goblin', name: 'ゴブリン', desc: 'HP: 25 / ATK: 8' },
                { id: 'dragon', name: 'ドラゴン', desc: 'HP: 500 / ATK: 45' },
                { id: 'skeleton', name: 'スケルトン', desc: 'HP: 40 / ATK: 12' },
                { id: 'wolf', name: 'オオカミ', desc: 'HP: 30 / ATK: 15' },
              ].map((entry) => (
                <button
                  key={entry.id}
                  className="flex w-full items-center justify-between rounded-xl border-2 border-blue-200 bg-white px-6 py-5 text-left hover:border-blue-300"
                >
                  <div>
                    <div className="text-base font-bold text-gray-800">{entry.name}</div>
                    <div className="mt-1.5 text-sm text-gray-400">{entry.desc}</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="rounded-lg p-2.5 text-gray-400 hover:bg-amber-50 hover:text-amber-600">
                      <Tag className="h-5 w-5" />
                    </button>
                    <button className="rounded-lg p-2.5 text-gray-400 hover:bg-red-50 hover:text-red-500">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
