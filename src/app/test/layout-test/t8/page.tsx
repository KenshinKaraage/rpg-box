'use client';

import { useState } from 'react';

/**
 * T8: AIの仮説と失敗の道筋 — ライブデモ版
 *
 * 各タブで実際のCSSレイアウトを表示。
 * Step 1-3 は flex を使っているため壊れる。
 * Step 4-5 は flex を排除し CSS Grid で強制するため正しく動く。
 *
 * 核心: flex を使わないことが修正。Grid は親がサイズを決める。
 */

// ─── ステップ定義 ─────────────────────────────────────────────────

interface StepDef {
  id: number;
  phase: 'broken' | 'fail' | 'fix';
  tabLabel: string;
  title: string;
  description: string;
  cssLabels: { element: string; value: string; note: string }[];
}

const STEPS: StepDef[] = [
  {
    id: 1,
    phase: 'broken',
    tabLabel: '初期状態',
    title: 'Step 1: flex ベースの3カラム — キャンバスが伸びる',
    description:
      'display: flex で3カラムを並べている。高さの制約がないため、左パネルの中身(40件)が全体の高さを決めてしまう。キャンバスも中身に引っ張られて伸びる。',
    cssLabels: [
      { element: 'container', value: 'display: flex', note: '❌ flex: 子の中身がサイズに影響' },
      { element: 'left', value: 'width: 180px, flex-shrink: 0', note: '高さ = 中身の量' },
      { element: 'center', value: 'flex: 1', note: '❌ 高さ = 左パネルに引きずられる' },
      { element: 'right', value: 'width: 160px, flex-shrink: 0', note: '高さ = 中身の量' },
    ],
  },
  {
    id: 2,
    phase: 'fail',
    tabLabel: '修正1 失敗',
    title: 'Step 2: カラムに flex-col 追加 — まだ伸びる',
    description:
      'AIが「カラムが flex-col じゃないから h-full が効かない」と診断し flex flex-col を追加。しかし flex-col は中を縦に並べるだけで高さを確定しない。根本は変わらない。',
    cssLabels: [
      { element: 'container', value: 'display: flex', note: '❌ まだ flex ベース' },
      {
        element: 'columns',
        value: '+ display: flex, flex-direction: column',
        note: '🔧 追加したが高さは確定しない',
      },
      {
        element: 'center',
        value: 'flex: 1, flex-col',
        note: '❌ 親の高さが不明なので flex-1 が効かない',
      },
    ],
  },
  {
    id: 3,
    phase: 'fail',
    tabLabel: '修正2 失敗',
    title: 'Step 3: 子を flex-1 min-h-0 に — まだ伸びる',
    description:
      'AIが h-full → flex-1 min-h-0 に変更。テクニックは正しいが、親の高さ自体が未確定。末端をいくら直しても上流が壊れていれば意味がない。',
    cssLabels: [
      { element: 'container', value: 'display: flex', note: '❌ まだ flex ベース' },
      {
        element: 'children',
        value: 'flex: 1, min-height: 0',
        note: '🔧 正しい技法だが上流が壊れている',
      },
      {
        element: '問題',
        value: 'flex は子の中身がサイズに影響する',
        note: 'flex を足すほど複雑になり、直らない',
      },
    ],
  },
  {
    id: 4,
    phase: 'fix',
    tabLabel: '✅ Grid化',
    title: 'Step 4: CSS Grid + gridTemplateRows: "100%" — 解決！',
    description:
      'flex を完全に排除し CSS Grid に変更。gridTemplateRows: "100%" でカラムの高さを親の100%に強制。カラムは overflow-auto / overflow-hidden だけ。flex-col も h-full も不要。',
    cssLabels: [
      {
        element: 'container',
        value: 'display: grid, rows: "100%"',
        note: '✅ Grid: 親が高さを強制',
      },
      {
        element: 'left',
        value: 'overflow-y: auto',
        note: '✅ Grid が高さを決め、中身はスクロール',
      },
      {
        element: 'center',
        value: 'overflow: hidden',
        note: '✅ Grid が高さを決め、はみ出しは切る',
      },
      { element: 'right', value: 'overflow-y: auto', note: '✅ 同上' },
    ],
  },
  {
    id: 5,
    phase: 'fix',
    tabLabel: '✅ 実物と同じ',
    title: 'Step 5: ThreeColumnLayout と同じ構造',
    description:
      '実際の ThreeColumnLayout.tsx と同じ構造。grid + gridTemplateRows: "100%"。カラムには flex なし。overflow-auto と overflow-hidden だけ。これが正解。',
    cssLabels: [
      { element: 'grid', value: 'grid h-full w-full', note: '✅ className そのまま' },
      {
        element: 'style',
        value: 'gridTemplateColumns: "Lpx 4px 1fr 4px Rpx"',
        note: '✅ リサイズ対応',
      },
      { element: 'rows', value: 'gridTemplateRows: "100%"', note: '✅ 高さを親の100%に強制' },
      { element: 'columns', value: 'overflow-auto / overflow-hidden のみ', note: '✅ flex 不使用' },
    ],
  },
];

const PHASE_COLORS = {
  broken: { tab: '#ef4444', tabBg: '#7f1d1d', badge: '❌ 壊れている' },
  fail: { tab: '#f97316', tabBg: '#7c2d12', badge: '❌ まだ壊れている' },
  fix: { tab: '#22c55e', tabBg: '#14532d', badge: '✅ 正常' },
} as const;

// ─── 共通の中身 ──────────────────────────────────────────────────

function LeftItems() {
  return (
    <>
      <div
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid #334155',
          fontWeight: 'bold',
          fontSize: 12,
          color: '#94a3b8',
        }}
      >
        チップセット
      </div>
      <div
        style={{
          padding: '4px 12px',
          borderBottom: '1px solid #1e293b',
          fontSize: 11,
          color: '#64748b',
        }}
      >
        レイヤー1
      </div>
      {Array.from({ length: 40 }, (_, i) => (
        <div
          key={i}
          style={{
            padding: '5px 12px',
            fontSize: 11,
            borderBottom: '1px solid #1e293b',
            color: '#cbd5e1',
            background: i === 3 ? '#1e3a5f' : undefined,
          }}
        >
          chip_{i + 1}
        </div>
      ))}
    </>
  );
}

function CanvasArea({ ok }: { ok: boolean }) {
  return (
    <div
      style={{
        height: '100%',
        display: 'grid',
        placeItems: 'center',
        background: '#111827',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 140,
            height: 100,
            background: '#1f2937',
            border: `2px solid ${ok ? '#22c55e' : '#ef4444'}`,
            margin: '0 auto 8px',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gridTemplateRows: 'repeat(3, 1fr)',
          }}
        >
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              style={{
                background: [
                  '#22c55e',
                  '#16a34a',
                  '#15803d',
                  '#166534',
                  '#16a34a',
                  '#15803d',
                  '#166534',
                  '#14532d',
                  '#15803d',
                  '#166534',
                  '#14532d',
                  '#052e16',
                ][i],
                border: '1px solid #0f172a',
              }}
            />
          ))}
        </div>
        <div style={{ fontSize: 11, color: ok ? '#4ade80' : '#f87171', fontWeight: 'bold' }}>
          MapCanvas {ok ? '(正常サイズ)' : '(縦に伸びている!)'}
        </div>
      </div>
    </div>
  );
}

function RightItems() {
  return (
    <>
      <div
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid #334155',
          fontWeight: 'bold',
          fontSize: 12,
          color: '#94a3b8',
        }}
      >
        プロパティ
      </div>
      {['名前', '幅', '高さ', 'チップセット'].map((label) => (
        <div
          key={label}
          style={{ padding: '6px 12px', fontSize: 11, borderBottom: '1px solid #1e293b' }}
        >
          <span style={{ color: '#64748b' }}>{label}: </span>
          <span style={{ color: '#cbd5e1' }}>—</span>
        </div>
      ))}
    </>
  );
}

// ─── 各ステップのレイアウト ──────────────────────────────────────

/** Step 1: flex ベース、高さ制約なし → 壊れる */
function DemoStep1() {
  return (
    <div style={{ display: 'flex', width: '100%' }}>
      <div
        style={{
          width: 180,
          flexShrink: 0,
          borderRight: '1px solid #334155',
          background: '#0f172a',
        }}
      >
        <LeftItems />
      </div>
      <div style={{ flex: 1, background: '#030712' }}>
        <CanvasArea ok={false} />
      </div>
      <div
        style={{
          width: 160,
          flexShrink: 0,
          borderLeft: '1px solid #334155',
          background: '#0f172a',
        }}
      >
        <RightItems />
      </div>
    </div>
  );
}

/** Step 2: flex + カラムに flex-col → まだ壊れる */
function DemoStep2() {
  return (
    <div style={{ display: 'flex', width: '100%' }}>
      <div
        style={{
          width: 180,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #334155',
          background: '#0f172a',
        }}
      >
        <LeftItems />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#030712' }}>
        <CanvasArea ok={false} />
      </div>
      <div
        style={{
          width: 160,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid #334155',
          background: '#0f172a',
        }}
      >
        <RightItems />
      </div>
    </div>
  );
}

/** Step 3: flex + 子に flex-1 min-h-0 → まだ壊れる */
function DemoStep3() {
  return (
    <div style={{ display: 'flex', width: '100%' }}>
      <div
        style={{
          width: 180,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #334155',
          background: '#0f172a',
        }}
      >
        <div style={{ flex: 1, minHeight: 0 }}>
          <LeftItems />
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#030712' }}>
        <div style={{ flex: 1, minHeight: 0 }}>
          <CanvasArea ok={false} />
        </div>
      </div>
      <div
        style={{
          width: 160,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid #334155',
          background: '#0f172a',
        }}
      >
        <div style={{ flex: 1, minHeight: 0 }}>
          <RightItems />
        </div>
      </div>
    </div>
  );
}

/** Step 4: CSS Grid + gridTemplateRows: "100%" → 解決！ */
function DemoStep4() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '180px 1fr 160px',
        gridTemplateRows: '100%',
        height: '100%',
        width: '100%',
      }}
    >
      <div style={{ overflowY: 'auto', borderRight: '1px solid #334155', background: '#0f172a' }}>
        <LeftItems />
      </div>
      <div style={{ overflow: 'hidden', background: '#030712' }}>
        <CanvasArea ok={true} />
      </div>
      <div style={{ overflowY: 'auto', borderLeft: '1px solid #334155', background: '#0f172a' }}>
        <RightItems />
      </div>
    </div>
  );
}

/** Step 5: ThreeColumnLayout と同じ構造 — grid + リサイズハンドル模擬 */
function DemoStep5() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '180px 4px 1fr 4px 160px',
        gridTemplateRows: '100%',
        height: '100%',
        width: '100%',
      }}
    >
      <div style={{ overflowY: 'auto', borderRight: '1px solid #334155', background: '#0f172a' }}>
        <LeftItems />
      </div>
      <div style={{ background: '#334155', cursor: 'col-resize' }} />
      <div style={{ overflow: 'hidden', background: '#030712' }}>
        <CanvasArea ok={true} />
      </div>
      <div style={{ background: '#334155', cursor: 'col-resize' }} />
      <div style={{ overflowY: 'auto', borderLeft: '1px solid #334155', background: '#0f172a' }}>
        <RightItems />
      </div>
    </div>
  );
}

const DEMOS = [DemoStep1, DemoStep2, DemoStep3, DemoStep4, DemoStep5];

// ─── メインページ ───────────────────────────────────────────────

export default function T8() {
  const [activeIdx, setActiveIdx] = useState(0);

  const step = STEPS[activeIdx]!;
  const phaseColor = PHASE_COLORS[step.phase];
  const Demo = DEMOS[activeIdx]!;
  const isBroken = step.phase !== 'fix';

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateRows: 'auto auto 1fr',
        height: '100%',
        width: '100%',
        background: '#020617',
        color: '#e2e8f0',
      }}
    >
      {/* タブバー */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${STEPS.length}, 1fr)`,
          background: '#0f172a',
          borderBottom: '2px solid #1e293b',
        }}
      >
        {STEPS.map((s, i) => {
          const pc = PHASE_COLORS[s.phase];
          const isActive = i === activeIdx;
          return (
            <button
              key={s.id}
              onClick={() => setActiveIdx(i)}
              style={{
                padding: '10px 8px',
                background: isActive ? pc.tabBg : 'transparent',
                border: 'none',
                borderBottom: isActive ? `3px solid ${pc.tab}` : '3px solid transparent',
                color: isActive ? '#fff' : '#64748b',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: isActive ? 'bold' : 'normal',
              }}
            >
              {s.tabLabel}
            </button>
          );
        })}
      </div>

      {/* 情報バー */}
      <div
        style={{ background: '#0f172a', borderBottom: '1px solid #1e293b', padding: '8px 16px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 4,
              background: phaseColor.tab,
              color: '#000',
              fontWeight: 'bold',
              fontSize: 11,
            }}
          >
            {phaseColor.badge}
          </span>
          <span style={{ fontWeight: 'bold', fontSize: 13 }}>{step.title}</span>
        </div>
        <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 6px', lineHeight: 1.5 }}>
          {step.description}
        </p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {step.cssLabels.map((l) => (
            <span
              key={l.element}
              style={{
                padding: '3px 8px',
                background: '#1e293b',
                borderRadius: 4,
                fontSize: 10,
                fontFamily: 'monospace',
                lineHeight: 1.4,
                border: l.note.startsWith('✅')
                  ? '1px solid #166534'
                  : l.note.startsWith('❌')
                    ? '1px solid #7f1d1d'
                    : '1px solid #334155',
              }}
            >
              <span style={{ color: '#60a5fa' }}>{l.element}</span>{' '}
              <span style={{ color: '#fbbf24' }}>{l.value}</span>{' '}
              <span style={{ color: '#64748b', fontFamily: 'sans-serif' }}>{l.note}</span>
            </span>
          ))}
        </div>
      </div>

      {/* デモエリア: 壊れているステップは overflow-auto でスクロールバーが出る */}
      <div
        style={{
          overflow: isBroken ? 'auto' : 'hidden',
          position: 'relative',
          background: '#030712',
        }}
      >
        <Demo />

        {/* 壊れている場合のヒント */}
        {isBroken && (
          <div
            style={{
              position: 'sticky',
              bottom: 12,
              marginLeft: 12,
              display: 'inline-block',
              padding: '6px 12px',
              background: 'rgba(239, 68, 68, 0.95)',
              borderRadius: 6,
              fontSize: 11,
              color: '#fff',
              fontWeight: 'bold',
            }}
          >
            ↕ スクロールバーが出ている = レイアウトが壊れている
            (左パネルの中身が全体の高さを決めている)
          </div>
        )}
      </div>
    </div>
  );
}
