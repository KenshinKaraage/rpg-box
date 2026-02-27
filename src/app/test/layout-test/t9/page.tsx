'use client';

import { useState } from 'react';

/**
 * T9: flex-row でも高さが正しく動く理由の考察
 *
 * TwoColumnLayout は flex ベース（Grid ではない）なのに
 * カラムがウィンドウ高さまで伸びる。なぜか？
 *
 * 答え: flex-direction: row + align-items: stretch (デフォルト)
 *
 * flex-row の場合:
 *   主軸 = 横方向 → flex-1, flex-shrink-0 は「幅」を制御
 *   交差軸 = 縦方向 → align-items: stretch で「高さ」がコンテナに揃う
 *
 * flex-col の場合:
 *   主軸 = 縦方向 → flex-1 は「高さ」を制御（ここが問題になる）
 *   交差軸 = 横方向 → align-items: stretch で「幅」がコンテナに揃う
 *
 * つまり flex-row は高さに対して「中身に影響されない」性質を持つ。
 * ただし条件がある:
 *   1. コンテナに h-full (高さ確定) が必要
 *   2. カラムに overflow-auto が必要（ないと中身が高さを押し広げる）
 */

// ─── 比較パターン定義 ────────────────────────────────────────────

interface Pattern {
  id: string;
  tabLabel: string;
  title: string;
  description: string;
  /** コンテナ: h-full があるか */
  containerHFull: boolean;
  /** カラム: overflow-auto があるか */
  columnOverflow: boolean;
  /** flex-direction */
  direction: 'row' | 'column';
  /** 期待結果 */
  expected: 'ok' | 'broken';
}

const PATTERNS: Pattern[] = [
  {
    id: 'current',
    tabLabel: '現状(flex-row)',
    title: '現在の TwoColumnLayout: flex-row + h-full + overflow-auto',
    description:
      'flex-direction: row。交差軸(縦)は align-items: stretch で親の高さに揃う。カラムに overflow-auto があるので中身が押し広げない。これが正常に動いている理由。',
    containerHFull: true,
    columnOverflow: true,
    direction: 'row',
    expected: 'ok',
  },
  {
    id: 'no-overflow',
    tabLabel: 'overflow なし',
    title: 'flex-row + h-full だが overflow-auto なし',
    description:
      'overflow-auto を外すと、中身の多いカラムが stretch の高さを超えて膨張する。コンテナの overflow 処理次第で表示が変わる。',
    containerHFull: true,
    columnOverflow: false,
    direction: 'row',
    expected: 'broken',
  },
  {
    id: 'no-hfull',
    tabLabel: 'h-full なし',
    title: 'flex-row だが h-full なし + overflow-auto あり',
    description:
      'コンテナに h-full がないと高さが auto（中身依存）になる。align-items: stretch は「コンテナの高さ」に揃えるので、コンテナが縮むと全カラムも縮む。',
    containerHFull: false,
    columnOverflow: true,
    direction: 'row',
    expected: 'broken',
  },
  {
    id: 'col',
    tabLabel: 'flex-col にしたら',
    title: 'flex-col + h-full + overflow-auto（参考: 方向を変えた場合）',
    description:
      'flex-direction: column にすると主軸が縦になる。flex-1 は高さの制御になり、min-height: auto の罠にハマる可能性が出てくる。ただし overflow-auto があれば min-height が 0 になるので動く。',
    containerHFull: true,
    columnOverflow: true,
    direction: 'column',
    expected: 'ok',
  },
];

// ─── デモレイアウト ──────────────────────────────────────────────

function LeftContent() {
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
        フォルダツリー
      </div>
      {[
        '画像',
        'BGM',
        'SE',
        'キャラクター',
        'モンスター',
        'アイテム',
        'エフェクト',
        'タイルセット',
      ].map((name, i) => (
        <div
          key={name}
          style={{
            padding: '6px 12px',
            fontSize: 11,
            borderBottom: '1px solid #1e293b',
            color: '#cbd5e1',
            background: i === 0 ? '#1e3a5f' : undefined,
          }}
        >
          📁 {name}
        </div>
      ))}
    </>
  );
}

function RightContent() {
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
        アセット一覧
      </div>
      {Array.from({ length: 30 }, (_, i) => (
        <div
          key={i}
          style={{
            padding: '6px 12px',
            fontSize: 11,
            borderBottom: '1px solid #1e293b',
            color: '#cbd5e1',
          }}
        >
          asset_{i + 1}.png
        </div>
      ))}
    </>
  );
}

function DemoLayout({ pattern }: { pattern: Pattern }) {
  if (pattern.direction === 'column') {
    return <DemoFlexCol pattern={pattern} />;
  }
  return <DemoFlexRow pattern={pattern} />;
}

function DemoFlexRow({ pattern }: { pattern: Pattern }) {
  return (
    <div
      style={{
        display: 'flex',
        // flex-direction: row はデフォルト（明示不要）
        height: pattern.containerHFull ? '100%' : undefined,
        width: '100%',
      }}
    >
      <div
        style={{
          width: 200,
          flexShrink: 0,
          borderRight: '1px solid #334155',
          background: '#0f172a',
          overflowY: pattern.columnOverflow ? 'auto' : undefined,
        }}
      >
        <LeftContent />
      </div>
      <div style={{ width: 4, flexShrink: 0, background: '#334155', cursor: 'col-resize' }} />
      <div
        style={{
          flex: 1,
          background: '#0f172a',
          overflowY: pattern.columnOverflow ? 'auto' : undefined,
        }}
      >
        <RightContent />
      </div>
    </div>
  );
}

function DemoFlexCol({ pattern }: { pattern: Pattern }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: pattern.containerHFull ? '100%' : undefined,
        width: '100%',
      }}
    >
      <div
        style={{
          flexShrink: 0,
          borderBottom: '1px solid #334155',
          background: '#0f172a',
          overflowY: pattern.columnOverflow ? 'auto' : undefined,
          maxHeight: pattern.columnOverflow ? 200 : undefined,
        }}
      >
        <LeftContent />
      </div>
      <div style={{ height: 4, flexShrink: 0, background: '#334155' }} />
      <div
        style={{
          flex: 1,
          background: '#0f172a',
          overflowY: pattern.columnOverflow ? 'auto' : undefined,
          minHeight: pattern.columnOverflow ? 0 : undefined,
        }}
      >
        <RightContent />
      </div>
    </div>
  );
}

// ─── メインページ ───────────────────────────────────────────────

export default function T9() {
  const [activeIdx, setActiveIdx] = useState(0);

  const pattern = PATTERNS[activeIdx]!;
  const isBroken = pattern.expected === 'broken';

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
      {/* タブ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${PATTERNS.length}, 1fr)`,
          background: '#0f172a',
          borderBottom: '2px solid #1e293b',
        }}
      >
        {PATTERNS.map((p, i) => {
          const isActive = i === activeIdx;
          const color = p.expected === 'ok' ? '#22c55e' : '#ef4444';
          return (
            <button
              key={p.id}
              onClick={() => setActiveIdx(i)}
              style={{
                padding: '10px 8px',
                background: isActive
                  ? p.expected === 'ok'
                    ? '#14532d'
                    : '#7f1d1d'
                  : 'transparent',
                border: 'none',
                borderBottom: isActive ? `3px solid ${color}` : '3px solid transparent',
                color: isActive ? '#fff' : '#64748b',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: isActive ? 'bold' : 'normal',
              }}
            >
              {p.tabLabel}
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
              background: isBroken ? '#ef4444' : '#22c55e',
              color: '#000',
              fontWeight: 'bold',
              fontSize: 11,
            }}
          >
            {isBroken ? '❌ 壊れる' : '✅ 正常'}
          </span>
          <span style={{ fontWeight: 'bold', fontSize: 13 }}>{pattern.title}</span>
        </div>
        <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
          {pattern.description}
        </p>

        {/* CSS状態の図解 */}
        <div
          style={{
            marginTop: 8,
            padding: '8px 12px',
            background: '#1e293b',
            borderRadius: 6,
            fontSize: 11,
            fontFamily: 'monospace',
            lineHeight: 1.8,
            color: '#cbd5e1',
          }}
        >
          <span style={{ color: '#60a5fa' }}>container</span>: display: flex; flex-direction:{' '}
          {pattern.direction};{' '}
          {pattern.containerHFull ? (
            <span style={{ color: '#4ade80' }}>height: 100%; ✅</span>
          ) : (
            <span style={{ color: '#f87171' }}>height: auto; ❌</span>
          )}
          <br />
          <span style={{ color: '#60a5fa' }}>columns</span>:{' '}
          {pattern.columnOverflow ? (
            <span style={{ color: '#4ade80' }}>overflow-y: auto; ✅</span>
          ) : (
            <span style={{ color: '#f87171' }}>overflow: visible (default); ❌</span>
          )}
          <br />
          <span style={{ color: '#60a5fa' }}>仕組み</span>:{' '}
          {pattern.direction === 'row' ? (
            <>
              主軸=横, 交差軸=縦 → <span style={{ color: '#fbbf24' }}>align-items: stretch</span>{' '}
              が高さを親に揃える
            </>
          ) : (
            <>
              主軸=縦, 交差軸=横 → <span style={{ color: '#fbbf24' }}>flex-1</span>{' '}
              が高さを制御（min-height の罠に注意）
            </>
          )}
        </div>
      </div>

      {/* デモエリア */}
      <div
        style={{
          overflow: isBroken ? 'auto' : 'hidden',
          position: 'relative',
          background: '#030712',
        }}
      >
        <DemoLayout pattern={pattern} />

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
            ↕ スクロールバーが出ている or カラムが縮んでいる = レイアウト壊れ
          </div>
        )}
      </div>
    </div>
  );
}
