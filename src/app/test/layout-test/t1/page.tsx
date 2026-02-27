/**
 * T1: 生CSS grid（ThreeColumnLayoutなし）
 * 確認ポイント: grid h-full + grid-template-rows: 100% だけで高さが正しく取れるか
 */
export default function T1() {
  return (
    <div
      style={{
        display: 'grid',
        height: '100%',
        width: '100%',
        gridTemplateColumns: '200px 4px 1fr 4px 200px',
        gridTemplateRows: '100%',
      }}
    >
      <div style={{ background: '#fecaca', overflowY: 'auto', padding: 12 }}>
        <strong>Left</strong>
        <p style={{ marginTop: 8, fontSize: 12 }}>
          生CSS grid。
          <br />
          grid-template-rows: 100%
          <br />
          この列が画面下端まで届けば OK。
        </p>
      </div>
      <div style={{ background: '#d1d5db' }} />
      <div style={{ background: '#bbf7d0', overflow: 'hidden', padding: 12 }}>
        <strong>Center</strong>
        <p style={{ marginTop: 8, fontSize: 12 }}>overflow: hidden</p>
      </div>
      <div style={{ background: '#d1d5db' }} />
      <div style={{ background: '#bfdbfe', overflowY: 'auto', padding: 12 }}>
        <strong>Right</strong>
        <p style={{ marginTop: 8, fontSize: 12 }}>overflow: auto</p>
      </div>
    </div>
  );
}
