'use client';
/**
 * T4: 現在のマップ/DBページに最も近い構成
 * 確認ポイント: Tabs、スクロール列、overflow-hidden な中央列を組み合わせたとき
 */
import { useState } from 'react';
import { ThreeColumnLayout } from '@/components/common/ThreeColumnLayout';

function LeftPanel() {
  const [tab, setTab] = useState<'a' | 'b'>('a');
  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fef9c3' }}
    >
      {/* タブ */}
      <div style={{ display: 'flex', borderBottom: '1px solid #aaa', flexShrink: 0 }}>
        {(['a', 'b'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: '6px 0',
              fontSize: 12,
              fontWeight: 'bold',
              background: tab === t ? '#fff' : 'transparent',
              border: 'none',
              borderBottom: tab === t ? '2px solid #f97316' : 'none',
              cursor: 'pointer',
            }}
          >
            タブ {t.toUpperCase()}
          </button>
        ))}
      </div>
      {/* タブコンテンツ */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {Array.from({ length: 40 }, (_, i) => (
          <div key={i} style={{ padding: '4px 0', fontSize: 12, borderBottom: '1px solid #eee' }}>
            [{tab.toUpperCase()}] アイテム {i + 1}
          </div>
        ))}
      </div>
    </div>
  );
}

function CenterPanel() {
  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f0fdf4' }}
    >
      {/* ツールバー */}
      <div
        style={{
          borderBottom: '1px solid #aaa',
          padding: '6px 12px',
          flexShrink: 0,
          fontSize: 12,
          fontWeight: 'bold',
        }}
      >
        ツールバー（固定）
      </div>
      {/* メインエリア（overflow-hidden、中身がサイズを自己管理） */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          background: '#166534',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ color: '#fff', fontSize: 14 }}>キャンバスエリア（overflow: hidden）</span>
      </div>
    </div>
  );
}

function RightPanel() {
  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#eff6ff', padding: 12 }}>
      <div style={{ fontWeight: 'bold', marginBottom: 8, fontSize: 12 }}>プロパティパネル</div>
      {Array.from({ length: 20 }, (_, i) => (
        <div key={i} style={{ padding: '6px 0', fontSize: 12, borderBottom: '1px solid #ddd' }}>
          プロパティ {i + 1}
        </div>
      ))}
    </div>
  );
}

export default function T4() {
  return (
    <ThreeColumnLayout
      left={<LeftPanel />}
      center={<CenterPanel />}
      right={<RightPanel />}
      leftDefaultWidth={240}
      rightDefaultWidth={280}
    />
  );
}
