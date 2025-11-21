# LeetCode to Notion Sync

A tool to automatically sync your "Accepted" LeetCode and NeetCode submissions to a Notion database using a Chrome Extension and a local Node.js server.

## Features

- **Automatic Sync**: Detects successful submissions on LeetCode and NeetCode.
- **Spaced Repetition**: Calculates the next review date based on your review history.
- **Notion Integration**: Updates your Notion database with status, review count, and next review date.

## Prerequisites

- Node.js (v18+ recommended)
- A Notion account and a database.
- A Notion Integration Token.

## Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd code-sync
make install
```

### LeetCode to Notion Sync

自動同步 LeetCode/NeetCode 的 "Accepted" 提交到 Notion 資料庫，用於間隔重複學習。

## 系統架構

- **Chrome Extension**: 偵測 LeetCode/NeetCode 上的 "Accepted" 狀態，提取題目資訊
- **Node.js Server**: 接收 extension 請求，更新 Notion 資料庫

## 前置需求

1. Node.js (v16+)
2. Chrome 瀏覽器
3. Notion 帳號和 Integration Token

## Notion 設置

### 1. 創建 Notion Integration

1. 前往 [Notion Integrations](https://www.notion.so/my-integrations)
2. 點擊 "New integration"
3. 命名（例如：LeetCode Sync）
4. 複製 **Internal Integration Token**

### 2. 設置 Notion Database

在你的 Notion workspace 中創建一個 database，包含以下屬性：

| 屬性名稱           | 類型     | 說明                      |
| ------------------ | -------- | ------------------------- |
| `Name`             | Title    | 題目名稱（必須）          |
| `Status`           | Checkbox | 完成狀態                  |
| `Reviewed`         | Checkbox | 是否已複習                |
| `Review Date`      | Date     | 下次複習日期              |
| `Completion Dates` | Text     | 完成日期記錄（JSON 陣列） |

### 3. 連接 Integration 到 Database

1. 打開你的 database
2. 點擊右上角 `...` → `Connections` → 選擇你的 integration
3. 複製 database URL 中的 **Database ID**
   - URL 格式：`https://notion.so/workspace/DATABASE_ID?v=...`

## 安裝步驟

### 1. Clone 專案

```bash
git clone <repository-url>
cd code-sync
```

### 2. 設置環境變數

在專案根目錄創建 `.env` 檔案：

```env
NOTION_KEY=your_notion_integration_token
NOTION_DATABASE_ID=your_database_id
SERVER_URL=http://localhost:3099
SELECTOR_ELEMENT=.submission-result-accepted
```

### 3. 安裝依賴並建置

```bash
make install  # 安裝 server 和 extension 的依賴
make build    # 建置 extension
```

### 4. 啟動 Server

```bash
make dev      # 開發模式（自動重載）
# 或
make start    # 生產模式
```

Server 會在 `http://localhost:3099` 啟動。

### 5. 安裝 Chrome Extension

1. 打開 Chrome，前往 `chrome://extensions/`
2. 開啟右上角的 "開發人員模式"
3. 點擊 "載入未封裝項目"
4. 選擇 `code-sync/extension` 資料夾
5. Extension 安裝完成！

## 使用方法

### 自動同步

1. **確保 server 正在運行**（`make dev`）
2. **前往 LeetCode 或 NeetCode**
3. **解題並提交**
4. **當看到 "Accepted" 狀態時**，extension 會自動：
   - 從 URL 提取題目名稱
   - 發送請求到本地 server
   - Server 在 Notion 中搜尋題目
   - 更新 Notion 資料庫

### Notion 更新內容

每次成功提交後，Notion 會更新：

- ✅ `Status`: 勾選
- ✅ `Reviewed`: 勾選
- 📅 `Review Date`: 設為 2 天後
- 📝 `Completion Dates`: 添加今天的日期到 JSON 陣列

**範例**：

```json
["2025-11-21", "2025-11-25", "2025-11-30"]
```

### 題目名稱匹配

系統會自動嘗試多種變體來匹配 Notion 中的題目：

1. 原始名稱（例如：`linked list cycle detection`）
2. 移除 "detection" 後綴（例如：`linked list cycle`）
3. 添加羅馬數字（例如：`two sum ii`）
4. Title Case（例如：`Linked List Cycle`）

## Notion Formula（選用）

為了更好地顯示完成日期，你可以添加以下 Formula 屬性：

### 1. 完成次數 (Completion Count)

顯示題目完成的總次數：

```
if(empty(prop("Completion Dates")), 0, length(prop("Completion Dates")) - length(replace(prop("Completion Dates"), ",", "")) + 1)
```

**顯示範例**：`3`

**說明**：計算逗號數量 + 1 = 日期數量

### 2. 熟悉度 (Proficiency)

根據完成次數顯示熟悉度：

```
if(empty(prop("Completion Dates")), "❌ 未完成", if(length(prop("Completion Dates")) - length(replace(prop("Completion Dates"), ",", "")) + 1 >= 5, "✅✅✅ 精通", if(length(prop("Completion Dates")) - length(replace(prop("Completion Dates"), ",", "")) + 1 >= 2, "✅✅ 熟悉", "✅ 初次完成")))
```

**顯示範例**：

- 1 次：`✅ 初次完成`
- 2-4 次：`✅✅ 熟悉`
- 5+ 次：`✅✅✅ 精通`

### 注意事項

- `Completion Dates` 屬性會儲存 JSON 格式：`["2025-11-21","2025-11-25"]`
- 你可以直接查看這個屬性來確認所有完成日期
- 上面的 formula 會自動計算次數和熟悉度

**顯示範例**：

- 1 次：`✅ 初次完成`
- 2-4 次：`✅✅ 熟悉`
- 5+ 次：`✅✅✅ 精通`

**添加方法**：

1. 在 Notion database 點擊 `+` 添加屬性
2. 選擇 **Formula** 類型
3. 複製貼上對應的 formula（不要包含 ``` 符號）
4. 點擊 Done

## 開發指令

```bash
make install   # 安裝所有依賴
make build     # 建置 extension
make start     # 啟動 server（生產模式）
make dev       # 啟動 server（開發模式，自動重載）
make all       # install + build
```

## 疑難排解

### Extension 沒有偵測到 "Accepted"

- 檢查 Chrome DevTools Console 是否有錯誤
- 確認 extension 已載入（`chrome://extensions/`）
- 重新載入 extension

### Server 連線失敗

- 確認 server 正在運行（`make dev`）
- 檢查 `.env` 中的 `SERVER_URL` 是否正確
- 檢查瀏覽器是否有 AdBlock 阻擋 localhost 請求

### Notion 找不到題目

- 確認題目名稱在 Notion database 中存在
- 檢查 server logs 查看嘗試的變體
- 手動在 Notion 中添加題目（使用 URL slug 格式，例如 `linked list cycle`）

### Notion API 錯誤

- 確認 `NOTION_KEY` 和 `NOTION_DATABASE_ID` 正確
- 確認 Integration 已連接到 database
- 確認 database 屬性名稱和類型正確

## 技術細節

- **Extension**: TypeScript + esbuild
- **Server**: Node.js + Express + Notion SDK
- **Title Extraction**: 從 URL 提取（`/problems/problem-name`）
- **Fuzzy Matching**: 自動嘗試多種題目名稱變體

## License

MIT

## License

ISC
