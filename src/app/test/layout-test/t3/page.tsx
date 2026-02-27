/**
 * T3: ThreeColumnLayout + flex h-full flex-col（ヘッダー固定＋スクロール）
 * 確認ポイント: 列内部が flex-col のとき高さが壊れないか
 */
import { ThreeColumnLayout } from '@/components/common/ThreeColumnLayout';

function Column({ label, color }: { label: string; color: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: color }}>
      {/* 固定ヘッダー */}
      <div
        style={{
          borderBottom: '1px solid #aaa',
          padding: '8px 12px',
          fontWeight: 'bold',
          flexShrink: 0,
        }}
      >
        {label} ヘッダー（固定）
      </div>
      {/* スクロールエリア */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {Array.from({ length: 30 }, (_, i) => (
          <div key={i} style={{ padding: '4px 0', fontSize: 12, borderBottom: '1px solid #eee' }}>
            アイテム {i + 1}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function T3() {
  return (
    <ThreeColumnLayout
      left={<Column label="Left" color="#fef9c3" />}
      center={<Column label="Center" color="#f0fdf4" />}
      right={<Column label="Right" color="#eff6ff" />}
    />
  );
}
