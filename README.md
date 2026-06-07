# katarive-web-ui

Web UI for [Katarive](https://github.com/heptaliane/katarive-proto) — a service that generates audio narrations from web content.

## Overview

Katarive fetches articles and web pages, extracts their content, and generates audio narrations using a text-to-speech narrator. This UI provides a browser-based interface to browse source collections, read item content, and play back generated narrations.

## Features

- Browse **Source Collections** and their items
- Load any URL directly to fetch and narrate its content
- Select a **narrator and speaker** for audio generation
- Automatic narration polling — audio starts generating as soon as content is loaded
- **Batch narration** — generate narrations for all items in a collection sequentially, with a progress bar
- Collapsible content viewer with plain-text formatting
- Refresh collections with cache bypass (`disable_cache`)

## UI Layout

```
┌─────────────────────────────────────────────────────────┐
│  Katarive  [narrator] [speaker]       [URL input  ] [→] │  Header
├──────────────┬──────────────────┬────────────────────────┤
│              │                  │                        │
│ Collections  │ Collection       │ Source Item            │
│              │ Detail           │ Narration              │
│  - col A     │                  │                        │
│  - col B  ←──│── items list  ←──│── content + audio      │
│              │                  │                        │
└──────────────┴──────────────────┴────────────────────────┘
```

## Usage flows

**Flow 1 — Load from URL**

Enter a URL in the header input and press Enter or the load button. The app fetches the source item, loads its parent collection into the detail panel, and starts generating a narration automatically.

**Flow 2 — Browse collections**

Select a collection from the left panel → select an item from the detail panel → narration starts automatically.

## Development

### Prerequisites

- Node.js 20+
- [Buf CLI](https://buf.build/docs/installation) (for regenerating protobuf types)

### Install

```bash
npm install
```

### Run dev server

Set the API server URL in `.env.local`:

```
VITE_API_BASE_URL=http://localhost:9421
```

Then start the dev server:

```bash
npm run dev
```

When `VITE_API_BASE_URL` is set, Vite proxies `/api.v1.KatariveService/*` and `/file/*` to the API server. When unset, a stub client with mock data is used instead.

### Build

```bash
npm run build
```

The production build outputs to `dist/`. The server is expected to serve the contents of `dist/` at `/static/`.

### Regenerate protobuf types

```bash
buf generate https://github.com/heptaliane/katarive-proto.git --path api
```

Generated files are written to `src/gen/`.

## Project structure

```
src/
├── api/
│   ├── client.ts       # KatariveClient interface
│   ├── rpc.ts          # connect-es (gRPC-Web) implementation
│   └── stub.ts         # Stub implementation with mock data
├── components/
│   ├── Header.tsx
│   ├── SourceCollections.tsx
│   ├── SourceCollectionDetail.tsx
│   └── SourceItemNarration.tsx
├── gen/
│   └── api/v1/
│       └── api_pb.ts   # Generated from katarive-proto
├── store/
│   └── AppContext.tsx  # Global state (useReducer + Context)
├── App.tsx
└── App.css
```

## Tech stack

|           |                                          |
| --------- | ---------------------------------------- |
| Framework | React 19 + Vite 8                        |
| Language  | TypeScript 6                             |
| RPC       | connect-es v2 (gRPC-Web transport)       |
| Protobuf  | @bufbuild/protobuf v2 + protoc-gen-es v2 |
| State     | React Context + useReducer               |
