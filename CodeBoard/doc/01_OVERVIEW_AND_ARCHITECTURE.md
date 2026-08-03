# 01. Overview & System Architecture

This document provides a high-level overview of **CodeBoard**, explaining how the frontend application, collaborative synchronization engine, and code execution runtimes fit together.

---

## 1. System Overview

CodeBoard is a real-time collaborative coding platform that allows multiple developers to write, inspect, share, and execute code in a shared workspace—similar to Google Docs combined with VS Code.

### Key Architectural Pillars:
1. **Decentralized Collaborative State (Yjs):**  
   Rather than relying on a centralized database that overwrites file states, CodeBoard uses **Conflict-Free Replicated Data Types (CRDTs)** via **Yjs**. All peers in a room hold a replica of the document and converge deterministically without data loss.
2. **VS Code-like Workspace Ergonomics:**  
   The UI incorporates the **Monaco Editor** (the same editor engine powering VS Code), a full-featured multi-file explorer with tree structures, tabs management, and an interactive execution console.
3. **Hybrid Execution Engine:**  
   Code execution is intelligently routed depending on the language:
   - **In-Browser Sandboxed DOM** for Web languages (`HTML`, `CSS`, `JavaScript`, `TypeScript`).
   - **In-Browser WebAssembly** for `Python` (via Pyodide).
   - **Remote Free Compiler API** for compiled languages (`Java`, `C++`) via Wandbox.

---

## 2. High-Level Architecture Diagram

```mermaid
graph TB
    subgraph ClientA [Client A - CodeBoard Workspace]
        UI_A[React UI Components<br/>Workspace / Header / Toolbar]
        EX_A[ExplorerDrawer<br/>File Tree State]
        MON_A[Monaco Editor<br/>CodeEditor / y-monaco]
        CON_A[Console & Preview Panel]
        CTX_A[[ProjectContext<br/>State Bridge]]
        
        UI_A --> CTX_A
        EX_A <--> CTX_A
        MON_A <--> CTX_A
    end

    subgraph CRDT_Sync [Yjs CRDT Collaborative Layer]
        YDOC((Y.Doc<br/>Shared Document))
        YTREE[Y.Array : fileTree]
        YTEXT[Y.Text : file-{id}]
        
        YDOC --- YTREE
        YDOC --- YTEXT
    end

    subgraph ClientB [Client B - Peer in Room]
        CTX_B[[ProjectContext B]]
        MON_B[Monaco Editor B]
        EX_B[ExplorerDrawer B]
    end

    subgraph Runtimes [Multi-Language Code Execution Engine]
        SANDBOX[Sandboxed iframe<br/>JS / HTML / CSS / TS]
        PYODIDE[Pyodide WebAssembly<br/>Python 3.11 Runtime]
        WANDBOX[Wandbox Cloud API<br/>Java / C++ Compiler]
    end

    CTX_A <==>|WebRTC / WebSocket<br/>Signaling & Peer Sync| YDOC
    YDOC <==>|Real-time CRDT updates| CTX_B

    CON_A -->|Web / JS / TS| SANDBOX
    CON_A -->|Python| PYODIDE
    CON_A -->|Java / C++| WANDBOX
```

---

## 3. Module Hierarchy & Directory Structure

```
src/
├── components/
│   ├── common/             # Reusable UI widgets (buttons, modals, tooltips)
│   ├── editor/             # Editor & IDE Core Subsystem
│   │   ├── context/        # ProjectContext.jsx (Yjs CRDT state management)
│   │   ├── explorer/       # ExplorerDrawer, TreeView, TreeNode, SearchBox
│   │   ├── runtime/        # executeCode.js, runJavascript.js, createSandbox.js
│   │   ├── CodeEditor.jsx  # Monaco editor wrapper & Ctrl+Enter bindings
│   │   ├── Console.jsx     # Terminal output, badges, execution metrics
│   │   └── EditorHeader.jsx# Active file tabs, language badge, Run button
│   ├── layout/             # Top navigation, sidebars, workspace frames
│   ├── toolbar/            # Action toolbar
│   └── whiteboard/         # Collaborative canvas / drawing whiteboard
├── pages/
│   ├── Home.jsx            # Landing page
│   ├── CreateRoom.jsx      # Room generation & configuration
│   ├── Joinroom.jsx        # Room join interface (via code/URL)
│   └── Workspace.jsx       # Main collaborative coding workspace page
└── services/               # Socket & Workspace communication helpers
```

---

## 4. Complete Application Flow

```mermaid
sequenceDiagram
    autonumber
    actor UserA as User A (Room Creator)
    participant WS as Workspace UI
    participant CTX as ProjectContext
    participant YJS as Y.Doc (CRDT)
    actor UserB as User B (Joined Peer)

    UserA->>WS: Creates / Joins Room (Room ID)
    WS->>CTX: Initialize ProjectProvider(roomId)
    CTX->>YJS: Connect to Yjs provider (WebRTC/Socket)
    
    UserB->>YJS: Joins Room with identical Room ID
    YJS-->>CTX: Sync initial fileTree (Y.Array) & open documents
    CTX-->>WS: Render File Explorer & Editor for both users

    Note over UserA,UserB: Real-time File & Code Editing
    UserA->>CTX: Create new file "main.py"
    CTX->>YJS: Insert node into Y.Array (fileTree)
    YJS->>>UserB: Trigger observer -> Update local state
    
    UserA->>WS: Types code in Monaco Editor
    WS->>YJS: Y.Text update (char-by-char delta)
    YJS->>>UserB: Reflects character immediately on User B screen
```

---

## 5. Summary of Key Subsystems

- **ProjectContext (`src/components/editor/context/ProjectContext.jsx`):**  
  The single source of truth for all IDE state. Manages the active `fileTree`, open tabs, active file selection, and binds local React state to the underlying Yjs CRDT arrays and maps.
- **Explorer Subsystem (`src/components/editor/explorer/`):**  
  Provides recursive tree traversal, search filtering, VS Code-style `F2` inline rename, and folder-scoped file/folder creation without double-create race conditions.
- **Runtime Execution Engine (`src/components/editor/runtime/`):**  
  Dispatches source code to the appropriate sandbox or runtime, streaming logs, errors, compilation warnings, and execution duration back to the user console.
