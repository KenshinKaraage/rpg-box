'use client';

import { useState } from 'react';

/**
 * T6: 高さの連鎖切れ
 *
 * 問題: h-full (height: 100%) は「親の高さ」の100%。
 * → 親の高さが確定していないと、h-full は「中身の高さ」になる。
 * → 中間に高さ指定のないラッパーdiv が1つあるだけで連鎖が切れる。
 *
 * 修正: 中間の全要素に h-full を付けて連鎖を繋ぐ。
 */
export default function T6() {
  const [fixed, setFixed] = useState(false);

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
        }}
      >
        <strong>T6: 高さの連鎖切れ</strong>
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
          {fixed ? '✅ Good (h-full あり)' : '❌ Bad (h-full なし)'}
        </button>
        <span style={{ fontSize: 13, opacity: 0.8 }}>
          ← クリックで切り替え。Badでは中身の量に縮む
        </span>
      </div>

      {/* flex-1 min-h-0 の外側コンテナ */}
      <div style={{ flex: 1, minHeight: 0 }}>
        {/* ★ ここが比較ポイント: 中間ラッパー */}
        {/* Bad: height なし → 子の h-full が効かない */}
        {/* Good: height: 100% → 親の高さを子に伝える */}
        <div
          style={{
            height: fixed ? '100%' : undefined,
            // 視覚的にラッパーの存在を示す
            border: '3px dashed #a855f7',
            borderRadius: 8,
          }}
        >
          {/* 3カラム構成 */}
          <div
            style={{
              display: 'grid',
              height: '100%',
              gridTemplateColumns: '200px 1fr 200px',
              gridTemplateRows: '100%',
              gap: 2,
            }}
          >
            {/* Left */}
            <div style={{ background: '#fecaca', overflowY: 'auto', padding: 12 }}>
              <strong style={{ display: 'block', marginBottom: 8 }}>Left</strong>
              <p style={{ fontSize: 12, lineHeight: 1.6, marginBottom: 12 }}>
                {fixed
                  ? '✅ 紫の枠に h-full があるので、このカラムは画面下端まで伸びる'
                  : '❌ 紫の枠に h-full がないので、中身の量でカラムが縮む'}
              </p>
              {Array.from({ length: 5 }, (_, i) => (
                <div
                  key={i}
                  style={{ padding: '4px 0', fontSize: 12, borderBottom: '1px solid #fca5a5' }}
                >
                  少ないアイテム {i + 1}
                </div>
              ))}
            </div>

            {/* Center */}
            <div
              style={{
                background: '#e0f2fe',
                overflow: 'hidden',
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <strong style={{ display: 'block', marginBottom: 8 }}>
                Center（キャンバス想定）
              </strong>
              <div
                style={{
                  flex: 1,
                  background: '#1e293b',
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                  fontSize: 14,
                  minHeight: 0,
                }}
              >
                {fixed
                  ? '✅ キャンバスが画面いっぱいに広がる'
                  : '❌ キャンバスが 0px に縮む (中身がないため)'}
              </div>
            </div>

            {/* Right */}
            <div style={{ background: '#ddd6fe', overflowY: 'auto', padding: 12 }}>
              <strong style={{ display: 'block', marginBottom: 8 }}>Right</strong>
              <div
                style={{
                  fontSize: 12,
                  marginBottom: 12,
                  padding: 12,
                  background: '#ede9fe',
                  borderRadius: 6,
                  lineHeight: 1.6,
                }}
              >
                <strong>なぜこうなる？</strong>
                <br />
                <code>height: 100%</code> は「親の高さの100%」。
                <br />
                でも親の高さが CSS で<strong>明示されていない</strong>場合、 ブラウザは「親の高さ =
                中身の高さ」と解釈する。
                <br />
                <br />
                すると <code>h-full</code> は「中身の高さの100%」= 中身の高さそのもの、
                となり、画面いっぱいにはならない。
                <br />
                <br />
                <strong>紫の点線枠</strong>が「高さ指定なし」のラッパー div。
                <br />
                Bad では、このたった1つの div が連鎖を切っている。
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
