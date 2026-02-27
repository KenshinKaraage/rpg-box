'use client';

import { useState } from 'react';

/**
 * T7: shrink-0 の有無を比較
 *
 * 問題: flex-col の中にヘッダー＋コンテンツがあるとき、
 * コンテンツの overflow 管理がなく min-height が auto のままだと、
 * 中身の固有サイズが flex コンテナを超えて、全アイテムが縮小対象になる。
 * flex-shrink のデフォルトは 1 (= 縮んでいい) なので、ヘッダーも潰される。
 *
 * 重要な前提:
 * - overflow: auto/hidden/scroll を付けると min-height: auto が 0 に変わる
 * - その場合、中身がどれだけ多くても縮小圧力が発生しない
 * - つまり shrink-0 が効果を持つのは「overflow管理がない」場合
 *
 * 修正: 固定サイズ要素に shrink-0 + コンテンツに min-h-0 + overflow-auto。
 */
export default function T7() {
  const [fixed, setFixed] = useState(false);
  const [itemCount, setItemCount] = useState(40);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 操作パネル */}
      <div
        style={{
          flexShrink: 0,
          padding: '12px 20px',
          borderBottom: '2px solid #888',
          background: '#1e293b',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <strong>T7: shrink-0 の罠</strong>
        <button
          onClick={() => setFixed((v) => !v)}
          style={{
            padding: '6px 16px',
            borderRadius: 6,
            border: 'none',
            background: fixed ? '#22c55e' : '#ef4444',
            color: '#fff',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          {fixed ? '✅ Good (shrink-0 あり)' : '❌ Bad (shrink-0 なし)'}
        </button>
        <span style={{ fontSize: 13, opacity: 0.8 }}>アイテム数:</span>
        <input
          type="range"
          min={5}
          max={100}
          value={itemCount}
          onChange={(e) => setItemCount(Number(e.target.value))}
          style={{ width: 120 }}
        />
        <span style={{ fontSize: 13, fontFamily: 'monospace' }}>{itemCount}</span>
        <span style={{ fontSize: 13, opacity: 0.8 }}>← 数を増やすとBadの方でヘッダーが潰れる</span>
      </div>

      {/* メインエリア: 2カラムで比較 */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '100%',
          gap: 4,
        }}
      >
        {/* 左: 常に Bad (shrink-0 なし) */}
        <ColumnDemo
          label="❌ shrink-0 なし"
          useShrink={false}
          itemCount={itemCount}
          bgHeader="#fef2f2"
          bgContent="#fff1f2"
          borderColor="#fca5a5"
        />

        {/* 右: 常に Good (shrink-0 あり) */}
        <ColumnDemo
          label="✅ shrink-0 あり"
          useShrink={true}
          itemCount={itemCount}
          bgHeader="#f0fdf4"
          bgContent="#ecfdf5"
          borderColor="#86efac"
        />
      </div>
    </div>
  );
}

function ColumnDemo({
  label,
  useShrink,
  itemCount,
  bgHeader,
  bgContent,
  borderColor,
}: {
  label: string;
  useShrink: boolean;
  itemCount: number;
  bgHeader: string;
  bgContent: string;
  borderColor: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* ヘッダー1: タブバー風 */}
      <div
        style={{
          // ★ ここが比較ポイント
          flexShrink: useShrink ? 0 : undefined,
          padding: '10px 16px',
          background: bgHeader,
          borderBottom: `2px solid ${borderColor}`,
          fontWeight: 'bold',
          fontSize: 14,
        }}
      >
        {label}
      </div>

      {/* ヘッダー2: ツールバー風 (ボタンが複数ある) */}
      <div
        style={{
          // ★ ここも比較ポイント
          flexShrink: useShrink ? 0 : undefined,
          padding: '8px 16px',
          background: bgHeader,
          borderBottom: `1px solid ${borderColor}`,
          display: 'flex',
          gap: 8,
          fontSize: 12,
        }}
      >
        <span
          style={{
            padding: '4px 12px',
            background: borderColor,
            borderRadius: 4,
          }}
        >
          ペン
        </span>
        <span
          style={{
            padding: '4px 12px',
            background: borderColor,
            borderRadius: 4,
          }}
        >
          消しゴム
        </span>
        <span
          style={{
            padding: '4px 12px',
            background: borderColor,
            borderRadius: 4,
          }}
        >
          選択
        </span>
      </div>

      {/* ヘッダー3: セレクトボックス風 */}
      <div
        style={{
          // ★ ここも比較ポイント
          flexShrink: useShrink ? 0 : undefined,
          padding: '8px 16px',
          background: bgHeader,
          borderBottom: `1px solid ${borderColor}`,
          fontSize: 12,
        }}
      >
        レイヤー: <strong>レイヤー1</strong>
      </div>

      {/* コンテンツ: リスト */}
      <div
        style={{
          flex: 1,
          // ★ Good: min-h-0 + overflow-auto → 中身がスクロール、縮小圧力なし
          // ★ Bad: どちらもなし → min-height: auto (中身の固有サイズ) → 縮小圧力が発生
          ...(useShrink ? { minHeight: 0, overflowY: 'auto' as const } : {}),
          background: bgContent,
        }}
      >
        <div style={{ padding: '8px 16px' }}>
          <p style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
            {useShrink
              ? 'ヘッダーは固定(shrink-0)。リストはスクロール(min-h-0 + overflow-auto)。'
              : 'min-h-0もoverflow-autoもないので、中身の量がflex計算に影響 → ヘッダーが潰れる。'}
          </p>
          {Array.from({ length: itemCount }, (_, i) => (
            <div
              key={i}
              style={{
                padding: '6px 0',
                fontSize: 13,
                borderBottom: `1px solid ${borderColor}`,
              }}
            >
              アイテム {i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* 説明 */}
      <div
        style={{
          flexShrink: useShrink ? 0 : undefined,
          padding: '12px 16px',
          background: bgHeader,
          borderTop: `2px solid ${borderColor}`,
          fontSize: 11,
          lineHeight: 1.6,
        }}
      >
        {useShrink ? (
          <>
            <strong>shrink-0 + min-h-0 + overflow-auto</strong>
            <br />
            ヘッダー: shrink-0 →「絶対に縮まない」
            <br />
            コンテンツ: min-h-0 + overflow-auto → 枠内でスクロール
          </>
        ) : (
          <>
            <strong>shrink-0 なし + overflow 管理なし</strong>
            <br />
            コンテンツの min-height = auto = 中身の固有サイズ(数千px)
            <br />
            コンテナに入りきらず、全要素が均等に縮む → ヘッダー潰れる
            <br />
            <em>※ overflow: auto を付けるだけで min-height が 0 になり問題が消える</em>
          </>
        )}
      </div>
    </div>
  );
}
