'use client';

import { useState } from 'react';

/**
 * T5: min-h-0 の有無を比較
 *
 * 問題: flex-col の子要素はデフォルトで min-height: auto。
 * → 中身が多いと、flex-1 を指定しても子の中身サイズまで膨張する。
 * → 結果: 親を突き抜けて画面外まで伸びる（スクロールバーが画面全体に出る）
 *
 * 修正: min-h-0 を加えると「中身に引っ張られない」。overflow-auto でスクロール。
 */
export default function T5() {
  const [fixed, setFixed] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 操作パネル（固定） */}
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
        }}
      >
        <strong>T5: min-h-0 の罠</strong>
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
          {fixed ? '✅ Good (min-h-0 あり)' : '❌ Bad (min-h-0 なし)'}
        </button>
        <span style={{ fontSize: 13, opacity: 0.8 }}>
          ← クリックで切り替え。Badでは画面全体にスクロールバーが出る
        </span>
      </div>

      {/* メインエリア: flex-col の中に固定ヘッダー + リスト */}
      <div
        style={{
          flex: 1,
          // ★ ここが比較ポイント
          // Bad: min-height: auto (デフォルト) → 中身に押されて膨張
          // Good: min-height: 0 → flex計算の結果サイズに収まる
          minHeight: fixed ? 0 : undefined,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* ツールバー（固定高さ） */}
        <div
          style={{
            flexShrink: 0,
            padding: '8px 20px',
            background: '#fef3c7',
            borderBottom: '1px solid #d97706',
            fontSize: 13,
          }}
        >
          🔧 ツールバー（固定・潰れない）
        </div>

        {/* コンテンツエリア: ここが問題の中心 */}
        <div
          style={{
            flex: 1,
            // ★ Good の場合のみスクロール
            // Bad だと親自体が伸びるので、ここに overflow を付けても意味がない
            overflowY: fixed ? 'auto' : undefined,
            background: '#f0fdf4',
          }}
        >
          <div style={{ padding: 20 }}>
            <p style={{ marginBottom: 12, fontWeight: 'bold', color: '#166534' }}>
              {fixed
                ? '✅ min-h-0 あり: このエリア内でスクロールする'
                : '❌ min-h-0 なし: 親が中身に合わせて伸び、画面全体がスクロールする'}
            </p>
            <div
              style={{
                fontSize: 12,
                marginBottom: 12,
                padding: 12,
                background: '#dcfce7',
                borderRadius: 6,
                lineHeight: 1.6,
              }}
            >
              <strong>なぜこうなる？</strong>
              <br />
              flex アイテムの min-height のデフォルトは <code>auto</code>（= 中身の最小サイズ）。
              <br />
              flex: 1 で「残りを埋めて」と言っても、min-height: auto が
              「中身より小さくなるな」と矛盾する指示を出す。
              <br />
              結果、中身が多いと min-height が勝ち、要素が画面外まで伸びる。
              <br />
              <br />
              <code>min-h-0</code> (min-height: 0) を加えると 「中身がどれだけ多くても 0
              まで縮んでいい」と宣言。
              <br />
              flex: 1 が純粋に「残りスペースを埋める」だけの動作になる。
            </div>
            {/* 大量のアイテム */}
            {Array.from({ length: 60 }, (_, i) => (
              <div
                key={i}
                style={{
                  padding: '6px 12px',
                  borderBottom: '1px solid #bbf7d0',
                  fontSize: 13,
                }}
              >
                アイテム {i + 1}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
