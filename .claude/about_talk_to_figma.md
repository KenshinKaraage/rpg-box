# Claude Code プロジェクト設定

## Talk to Figma MCP の使用方法

### 前提条件

1. **Figmaデスクトップアプリ**がインストールされていること
2. **Claude Talk to Figma プラグイン**がFigmaにインストールされていること
3. **claude-talk-to-figma-mcp** がセットアップされていること

### 起動手順

#### 1. WebSocketサーバーを起動

**重要**: MCPサーバーとは別に、WebSocketサーバーを手動で起動する必要があります。

```bash
/Users/kenshin/.bun/bin/bun /Users/kenshin/claude-talk-to-figma-mcp/dist/socket.js
```

成功すると以下のメッセージが表示されます：

```
[INFO] Claude to Figma WebSocket server running on port 3055
[INFO] Status endpoint available at http://localhost:3055/status
```

#### 2. Figmaでプラグインを接続

1. Figmaでデザインファイルを開く
2. プラグイン「Claude Talk to Figma」を起動
3. 「Connect」ボタンをクリック
4. 表示される**チャンネルID**をメモ

#### 3. Claude Codeでチャンネルに参加

Claude Codeで以下のように指示：

```
Talk to Figma, channel [チャンネルID]
```

### 注意点

- **WebSocketサーバーは必須**: サーバーが起動していないと「Disconnected from server」エラーが表示される
- **チャンネルIDは毎回変わる**: Figmaプラグインを再接続するたびに新しいチャンネルIDが生成される
- **ポート3055**: WebSocketサーバーはデフォルトでポート3055を使用

### トラブルシューティング

| 症状                     | 原因                              | 解決方法                                      |
| ------------------------ | --------------------------------- | --------------------------------------------- |
| Disconnected from server | WebSocketサーバーが起動していない | 上記の起動手順1を実行                         |
| Not connected to Figma   | チャンネル未参加                  | 正しいチャンネルIDで再接続                    |
| bun: command not found   | PATHが通っていない                | フルパスで実行: `/Users/kenshin/.bun/bin/bun` |

### MCP設定

このプロジェクトのMCP設定（`~/.claude.json`内）:

```json
{
  "mcpServers": {
    "ClaudeTalkToFigma": {
      "type": "stdio",
      "command": "/Users/kenshin/.bun/bin/bun",
      "args": ["run", "/Users/kenshin/claude-talk-to-figma-mcp/dist/talk_to_figma_mcp/server.js"]
    }
  }
}
```

### 利用可能な操作

- フレーム、矩形、楕円、テキスト、星、ポリゴンの作成
- ノードの色、サイズ、位置、角丸の変更
- エフェクト（シャドウ、ブラー）の適用
- ノードのグループ化/解除
- テキスト内容とスタイルの変更
- ドキュメント情報の取得
