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

### 2. Notion Configuration

1.  Create a Notion Integration at [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations).
2.  Share your target database with the integration.
3.  Ensure your Notion Database has the following properties:
    - `Name` (Title)
    - `Status` (Select) - Options should include "Completed"
    - `Reviewed` (Checkbox)
    - `Review Date` (Date)

### 3. Environment Variables

Create a `.env` file in the root directory. See `.env.example` for an example.

### 4. Build the Extension

Generate the extension manifest with your configured port:

```bash
make build
```

## Usage

### Start the Server

```bash
make start
# Or for development with auto-reload:
make dev
```

### Load the Extension

1.  Open Chrome and navigate to `chrome://extensions`.
2.  Enable **Developer mode** in the top right.
3.  Click **Load unpacked**.
4.  Select the `extension` directory inside this project.

### Syncing

1.  Go to [LeetCode](https://leetcode.com) or [NeetCode](https://neetcode.io).
2.  Solve a problem and submit.
3.  Upon "Accepted", the extension will trigger and update your Notion database.

## Development

- **Server**: Located in `server/`. Run `make dev` to watch for changes.
- **Extension**: Located in `extension/`. Run `make build` after making changes to TypeScript files or `.env`.

## License

ISC
