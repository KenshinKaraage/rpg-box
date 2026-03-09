# J2R Engine Design Document

## Overview

**J2R Engine** (JavaScript to Rust) は、Rust/WASM ベースの 2D ゲームエンジン。
ホットパス（描画、当たり判定、Tween 補間）を Rust で処理し、ユーザースクリプトはブラウザの JS エンジンで実行する。

**2つのプロジェクトで共有:**

- **J2R Engine（独立 OSS）**: 汎用 2D ゲームエンジン + VSCode 拡張エディタ
- **RPG Box**: J2R の Rust コア + JS ブリッジのみ使用。エディタ UI は RPG 特化の Next.js

---

## Architecture Decisions

| 項目 | 決定 | 理由 |
|------|------|------|
| デプロイ | WASM のみ（ブラウザ完結） | シンプル。ネイティブは考えない |
| JS 実行 | ブラウザの JS エンジン | V8 JIT が世界最速。変換・埋め込みは不要 |
| レンダリング | WebGPU (wgpu) | Rust エコシステムで成熟。WASM 対応 |
| レンダラー数 | 1つ（エディタ / ランタイム共通） | 二重メンテ防止。描画可能なものに差分なし |
| 状態管理 | 編集=Zustand、再生=Rust メモリ | requirements.md 変更不要。Zustand は静的データストア |
| エクスポート | スタンドアロン HTML | itch.io 等にそのまま配布可能 |
| 音声 | JS 側 (Web Audio API) | WASM からの音声処理は制約が多い |
| オブジェクト管理 | コンポーネントベース | エディタのデータモデルと一貫性を保つ |
| ブリッジ方式 | シンレイヤーブリッジ (wasm-bindgen) | ARPG でも十分。ホットループは Rust 内完結 |
| エンジン拡張 | Rust ソース直接編集 + クラウドコンパイル | プラグインシステム不要。最も自由度が高い |

---

## Project Structure

### J2R Engine (独立 OSS リポジトリ)

```
j2r-engine/
├── engine/                    # Rust クレート
│   ├── Cargo.toml
│   └── src/
│       ├── lib.rs             # wasm-bindgen エントリポイント
│       ├── renderer/          # wgpu 2D レンダラー
│       │   ├── mod.rs
│       │   ├── gpu.rs         # GPU 初期化、サーフェス管理
│       │   ├── sprite_pipeline.rs
│       │   ├── tilemap_pipeline.rs
│       │   ├── shape_pipeline.rs
│       │   ├── text_pipeline.rs
│       │   ├── batch.rs       # スプライトバッチング
│       │   └── camera.rs      # 2D カメラ
│       ├── game/              # ゲームランタイム
│       │   ├── mod.rs
│       │   ├── world.rs       # オブジェクト管理
│       │   ├── component.rs   # Component trait + 組み込み
│       │   ├── game_loop.rs   # requestAnimationFrame ループ
│       │   ├── collision.rs   # 矩形 / タイルベース当たり判定
│       │   ├── tween.rs       # アニメーション補間 + easing
│       │   ├── scene.rs       # シーン / マップ管理
│       │   └── input.rs       # 入力状態
│       └── bridge/            # JS ↔ Rust インターフェース
│           ├── mod.rs
│           ├── editor_api.rs  # エディタモード用 API
│           ├── runtime_api.rs # ゲーム再生用 API
│           ├── callbacks.rs   # JS コールバック定義
│           └── serialization.rs
├── engine-js/                 # TypeScript グルーコード
│   ├── engineBridge.ts        # WASM 初期化 + API ラッパー
│   ├── audioManager.ts        # Web Audio API
│   ├── inputManager.ts        # キーボード / マウス / タッチ
│   └── scriptRunner.ts        # ユーザースクリプト実行
├── vscode-extension/          # VSCode 拡張 (汎用エディタ)
│   ├── src/
│   │   ├── extension.ts
│   │   └── panels/
│   │       ├── GamePreview.ts     # ゲームプレビュー Webview
│   │       ├── ObjectView.ts      # オブジェクトツリー
│   │       ├── UIPanel.ts         # UI 編集
│   │       ├── VisualScripting.ts # ビジュアルスクリプティング
│   │       ├── DataEdit.ts        # データ編集
│   │       └── AnimationEdit.ts   # アニメーション編集
│   └── package.json
├── examples/                  # サンプルゲーム
└── pkg/                       # wasm-pack ビルド出力
```

### RPG Box (J2R エンジンコアを内包)

```
rpg-box/
├── src/                       # Next.js エディタ (既存)
│   ├── features/
│   │   ├── map-editor/        # ← J2R の Object View 相当
│   │   ├── ui-editor/         # ← J2R の UI Panel 相当
│   │   ├── event-editor/      # ← J2R の Visual Scripting 相当
│   │   ├── database/          # ← J2R の Data Edit 相当
│   │   └── ...
│   └── stores/                # Zustand (静的データストア)
├── engine/                    # J2R Engine Rust コア (同一コード)
│   ├── Cargo.toml
│   └── src/
├── engine-js/                 # JS ブリッジ
└── pkg/                       # wasm-pack ビルド出力
```

RPG Box は J2R の `engine/` と `engine-js/` のみ使用。
VSCode 拡張や汎用パネルは使わない。

---

## Rendering Architecture

### 描画パイプライン

```
Scene Data (objects + components)
    │
    ▼
Render Graph
    │
    ├── Pass 1: Tilemap (背景レイヤー × N、バッチ描画)
    ├── Pass 2: Sprites (Y ソート、キャラ + オブジェクト + エフェクト)
    ├── Pass 3: 前景レイヤー
    └── Pass 4: UI オーバーレイ (メッセージ、メニュー、HUD)
    │
    ▼
  WebGPU
```

レンダラーは1つ。エディタ用 / ゲーム用の描画区別はない。
何を描くかを決めるのはロジック層の仕事。
エディタが選択枠を描きたければ、選択枠オブジェクトをシーンに追加するだけ。

### スプライトバッチング

```rust
struct SpriteBatch {
    vertices: Vec<SpriteVertex>,
    gpu_buffer: wgpu::Buffer,
    texture_atlas: wgpu::Texture,
    max_sprites: usize,           // e.g. 4096
}

struct SpriteVertex {
    position: [f32; 2],
    uv: [f32; 2],
    color: [f32; 4],              // tint
}
```

- 同じテクスチャアトラスのスプライトは 1 ドローコール
- タイルマップは事前アトラス化 → 1 レイヤー = 1 ドローコール
- ARPG 200 体でもアトラスが同じなら 1 ドローコール

---

## Data Flow

### エディタモード

```
Zustand 変更
    → React
    → engine.set_transform(id, x, y, ...)  [wasm-bindgen]
    → Rust: 内部状態更新
    → engine.render()
    → WebGPU 描画
```

Zustand が静的データ（マップ定義、スクリプト定義、UI 定義）の単一真実の源。
Rust は描画指示を受けて描くだけ（レンダースレーブ）。

### ゲーム再生モード

```
engine.start_game(project_json)
    → Rust: Zustand JSON をパースしてゲーム状態を構築
    → ゲームループ開始 (requestAnimationFrame)

毎フレーム (Rust 内完結):
    1. 入力状態を更新 (on_key_down 等で蓄積済み)
    2. コンポーネント更新 (移動、AI、トリガー判定)
    3. Tween 更新
    4. 当たり判定
    5. 描画 → WebGPU

スクリプト実行時:
    Rust → JS: callbacks.executeScript(scriptId, args)
    → ブラウザ JS で実行
    → showMessage() 等は JS → Rust で UI 描画
    → 完了後 JS → Rust: 次のアクションへ

音声再生時:
    Rust → JS: callbacks.playSound(assetId)
    → Web Audio API
```

---

## Bridge API

### エディタモード API (React → Rust)

```rust
#[wasm_bindgen]
impl Engine {
    pub async fn init(canvas_id: &str) -> Engine;
    pub fn load_scene(&mut self, json: &str);
    pub fn set_transform(&mut self, obj_id: &str, x: f32, y: f32,
                         scale_x: f32, scale_y: f32, rotation: f32);
    pub fn set_component_data(&mut self, obj_id: &str,
                              comp_type: &str, json: &str);
    pub fn add_object(&mut self, json: &str) -> String;
    pub fn remove_object(&mut self, obj_id: &str);
    pub fn set_camera(&mut self, x: f32, y: f32, zoom: f32);
    pub fn set_selection(&mut self, obj_ids: &str);
    pub fn render(&mut self);
}
```

### ランタイムモード API

```rust
#[wasm_bindgen]
impl Engine {
    pub fn start_game(&mut self, project_json: &str);
    pub fn stop_game(&mut self);
    pub fn on_key_down(&mut self, key_code: u32);
    pub fn on_key_up(&mut self, key_code: u32);
    pub fn on_mouse_move(&mut self, x: f32, y: f32);
    pub fn on_mouse_down(&mut self, button: u32);
    pub fn on_mouse_up(&mut self, button: u32);
}
```

### Rust → JS コールバック

```typescript
const callbacks = {
    playSound(assetId: string, volume: number, loop: boolean): void;
    stopSound(assetId: string): void;
    executeScript(scriptId: string, argsJson: string): Promise<string>;
    showMessage(text: string): Promise<void>;
    showChoice(choices: string[]): Promise<number>;
};
```

---

## Game Runtime

### ゲームループ

```rust
pub struct GameLoop {
    world: World,
    renderer: Renderer,
    input: InputState,
    tween_engine: TweenEngine,
    running: bool,
}

impl GameLoop {
    pub fn tick(&mut self, dt: f32) {
        self.world.update_components(dt, &self.input);
        self.tween_engine.update(dt, &mut self.world);
        self.world.resolve_collisions();
        self.renderer.render(&self.world);
    }
}
```

### World / GameObject

```rust
pub struct World {
    objects: Vec<GameObject>,
    id_map: HashMap<String, usize>,
}

pub struct GameObject {
    pub id: String,
    pub transform: Transform,
    pub components: Vec<Box<dyn Component>>,
    pub active: bool,
}

pub struct Transform {
    pub x: f32,
    pub y: f32,
    pub scale_x: f32,
    pub scale_y: f32,
    pub rotation: f32,
    pub z_order: i32,
}
```

### Component Trait

```rust
pub trait Component {
    fn type_name(&self) -> &str;
    fn update(&mut self, dt: f32, ctx: &mut UpdateContext) {}
    fn render_data(&self) -> Option<RenderCommand> { None }
    fn from_json(data: &serde_json::Value) -> Self where Self: Sized;
}
```

組み込みコンポーネント:
SpriteComponent, ImageComponent, TextComponent, ShapeComponent,
AnimationComponent, ColliderComponent, MovementComponent, TriggerComponent

### 当たり判定

```rust
pub struct CollisionSystem;

impl CollisionSystem {
    pub fn check_aabb(a: &Rect, b: &Rect) -> bool;
    pub fn check_tile_passable(tilemap: &TileMap, x: i32, y: i32) -> bool;
    pub fn detect_all(objects: &[GameObject]) -> Vec<CollisionPair>;
}
```

物理シミュレーションなし。矩形衝突検出 + タイル通行判定のみ。

---

## Engine Customization (上級者向け)

### 3段階のカスタマイズレベル

| レベル | 対象 | ツール |
|--------|------|--------|
| 初級 | GUI のみ（ノーコード） | RPG Box エディタ / J2R VSCode パネル |
| 中級 | JS スクリプト | VSCode / ブラウザエディタ |
| 上級 | Rust エンジンソース | VSCode + クラウドコンパイル or ローカルビルド |

### Rust ソース編集フロー

1. プロジェクトごとにエンジンソースのコピーを持つ
2. ユーザーが `collision.rs`, `tween.rs` 等を直接編集
3. ビルド方法:
   - **クラウドコンパイル**: コードをサーバーに送信 → `cargo build --target wasm32` → WASM を返す
   - **ローカルビルド**: `.wasm` ファイルをインポート（Rust ツールチェーン必要）
4. エディタが WASM を差し替えてリロード

### ビルド高速化

- クラウド側でユーザーごとに `target/` をキャッシュ
- `sccache` で依存クレートの共有キャッシュ
- 初回ビルド: 30s〜、増分ビルド: 数秒

---

## Export Format

### ゲームプロジェクト構造

```
my-game/
├── project.json
├── scenes/
│   ├── title.json
│   └── field01.json
├── scripts/
│   ├── main.js
│   └── battle.js
├── assets/
│   ├── images/
│   └── audio/
└── engine/               # (上級者のみ) Rust ソース
    └── src/
```

### スタンドアロン HTML エクスポート

```
export/
├── index.html
├── engine.wasm           # カスタムエンジン含む
├── engine.js             # wasm-bindgen グルー
├── game.js               # ブリッジ + スクリプト
├── game-data.json        # 全シーン + スクリプトバンドル
└── assets/
    ├── atlas.png
    ├── atlas.json
    └── audio/
```

---

## Performance Characteristics

### WASM ↔ JS 境界コスト

| 処理 | 頻度 | コスト |
|------|------|--------|
| 入力取得 | 1 回 / フレーム | 無視可 |
| 音声コマンド | イベント発火時 | 無視可 |
| スクリプト実行 | イベント発火時 | 無視可 |
| 描画 | Rust → WebGPU 直接 | JS 経由しない |

ゲームループ（移動、当たり判定、Tween、描画）は全て Rust 内完結。
ARPG でエンティティ 200 体 + 毎フレーム数千回の当たり判定でも問題なし。

### JS をRust に変換する方式を採用しない理由

- V8 JIT が世界最速の JS エンジン。これより速くする方法は存在しない
- JS → WASM AOT は動的型付けの制約で V8 JIT より遅い
- QuickJS 埋め込みは V8 の 10〜100 倍遅い
- ユーザースクリプトは軽い処理（イベント発火時に 1 回走るだけ）で毎フレーム実行しない
