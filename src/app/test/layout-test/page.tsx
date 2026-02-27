/** テストケース一覧ページ */
export default function LayoutTestIndex() {
  const cases = [
    {
      href: '/test/layout-test/t1',
      label: 'T1: 生CSS grid（コンポーネントなし）',
      desc: 'display:grid + h-full のみ。最も基礎的なケース。',
    },
    {
      href: '/test/layout-test/t2',
      label: 'T2: ThreeColumnLayout + 色付きボックス',
      desc: 'ThreeColumnLayoutに色付きdivを渡すだけ。',
    },
    {
      href: '/test/layout-test/t3',
      label: 'T3: ThreeColumnLayout + flex-col内部',
      desc: '各列の中が flex h-full flex-col（ヘッダー固定＋スクロール）。',
    },
    {
      href: '/test/layout-test/t4',
      label: 'T4: 現在のDBページに近い構成',
      desc: '長いコンテンツ、スクロール、中央はoverflow-hidden。',
    },
    {
      href: '/test/layout-test/t5',
      label: 'T5: 🔴 min-h-0 の罠',
      desc: 'トグルで比較。min-h-0 がないと中身が画面外まで伸びる。',
    },
    {
      href: '/test/layout-test/t6',
      label: 'T6: 🔴 高さの連鎖切れ',
      desc: 'トグルで比較。中間divのh-fullが欠けると子が縮む。',
    },
    {
      href: '/test/layout-test/t7',
      label: 'T7: 🔴 shrink-0 の罠',
      desc: '左右並列で比較。shrink-0 がないとヘッダーが潰される。スライダーで件数調整可。',
    },
    {
      href: '/test/layout-test/t8',
      label: 'T8: 📖 AIの仮説と失敗の記録',
      desc: 'Claudeが「キャンバスが縦に伸びる」問題で仮説→失敗→成功に至るまでの全過程と教訓。',
    },
    {
      href: '/test/layout-test/t9',
      label: 'T9: 🔬 flex-row でも高さが動く理由',
      desc: 'TwoColumnLayout が flex なのにウィンドウ高になる仕組み。align-items: stretch の考察。',
    },
  ];

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold">ThreeColumnLayout 高さテスト</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        各ページで列が画面の下端まで届いているか確認してください。
        <br />
        届いていない＝縦が縮んでいる。届いている＝正常。
      </p>
      <ul className="space-y-3">
        {cases.map((c) => (
          <li key={c.href}>
            <a href={c.href} className="block rounded border p-4 hover:bg-muted">
              <div className="font-semibold">{c.label}</div>
              <div className="mt-1 text-sm text-muted-foreground">{c.desc}</div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
