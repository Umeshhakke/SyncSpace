# CodeBoard — Technical Documentation & Architecture Guide

Welcome to the official technical documentation for **CodeBoard**, a real-time collaborative code editor, IDE, and interactive coding workspace built with modern Web technologies and CRDT-based synchronization.

---

## 📚 Documentation Table of Contents

This documentation is organized into modular markdown guides explaining every core subsystem of CodeBoard:

1. [**01. Overview & System Architecture**](./01_OVERVIEW_AND_ARCHITECTURE.md)
   - High-level architecture, technology stack, and full system data-flow diagrams.
   - End-to-end workflow overview.

2. [**02. Collaborative CRDT Engine (Yjs & Synchronization)**](./02_COLLABORATIVE_CRDT_ENGINE.md)
   - Deep dive into the `ProjectContext`, Conflict-Free Replicated Data Types (Yjs), and signaling.
   - Synchronizing shared file trees (`Y.Array`), shared editor text (`Y.Text`), and cursor awareness.
   - Transaction tagging and echo-loop prevention.

3. [**03. Monaco Editor & File Explorer Subsystem**](./03_EDITOR_AND_FILE_EXPLORER.md)
   - Code editor integration (`CodeEditor`, `EditorHeader`, `Console`).
   - VS Code-style File Explorer (`ExplorerDrawer`, `TreeView`, `TreeNode`).
   - Inline file/folder creation, recursive search, inline renaming (`F2`), and tab management.

4. [**04. Multi-Language Runtime & Code Execution Engine**](./04_MULTI_LANGUAGE_RUNTIME.md)
   - Complete explanation of `executeCode.js`, sandboxed preview iframes, and output streaming.
   - **Browser-Native Runtime**: JavaScript, TypeScript (type-stripping), HTML, CSS, Markdown, and JSON.
   - **In-Browser WebAssembly Runtime**: Python via Pyodide (`cdn.jsdelivr.net`) with stdin/stdout redirection.
   - **Server-Side Execution API**: Java (auto `Main` wrapper) and C++ via Wandbox API (`wandbox.org`).

5. [**05. Rooms, Signaling & Whiteboard Subsystem**](./05_ROOMS_AUTH_AND_WHITEBOARD.md)
   - Dynamic room creation and joining (`CreateRoom`, `Joinroom`, `Workspace`).
   - Collaborative Whiteboard integration and UI layout.

---

## ⚡ Quick Start & Running Locally

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** or **yarn**

### Setup Commands
```bash
# 1. Install dependencies
npm install

# 2. Start local development server (Vite)
npm run dev

# 3. Build for production
npm run build
```

---

## 🛠️ Core Technology Stack

| Component | Technology / Library | Purpose |
|---|---|---|
| **Frontend Framework** | React 18 + Vite | Core UI components, reactivity, and fast bundler |
| **Styling** | Tailwind CSS + Vanilla CSS | Responsive dark-mode aesthetics and UI layout |
| **Editor Engine** | Monaco Editor (`@monaco-editor/react`) | VS Code-powered code editing and syntax highlighting |
| **Real-time CRDTs** | Yjs + `y-webrtc` / `y-websocket` | Peer-to-peer / decentralized state synchronization |
| **Python Runtime** | Pyodide (Wasm CPython 3.11) | Client-side Python execution with stdlib support |
| **Compiled Languages**| Wandbox API (`wandbox.org`) | Free cloud execution for Java and C++ |
| **Web Preview** | Sandboxed `iframe` (`createSandbox`) | Safe execution of HTML, CSS, and client-side JS |
