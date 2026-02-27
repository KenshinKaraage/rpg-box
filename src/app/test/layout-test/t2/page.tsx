/**
 * T2: ThreeColumnLayout + 単純な色付きボックス
 * 確認ポイント: ThreeColumnLayoutコンポーネント自体が高さを維持できるか
 */
import { ThreeColumnLayout } from '@/components/common/ThreeColumnLayout';

export default function T2() {
  return (
    <ThreeColumnLayout
      left={
        <div style={{ background: '#fecaca', height: '100%', padding: 12 }}>
          <strong>Left</strong>
          <p style={{ marginTop: 8, fontSize: 12 }}>
            ThreeColumnLayout + h-full な色付きdiv。
            <br />
            下端まで届けばOK。
          </p>
        </div>
      }
      center={
        <div style={{ background: '#bbf7d0', height: '100%', padding: 12 }}>
          <strong>Center</strong>
        </div>
      }
      right={
        <div style={{ background: '#bfdbfe', height: '100%', padding: 12 }}>
          <strong>Right</strong>
        </div>
      }
    />
  );
}
