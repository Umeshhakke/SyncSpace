# SyncSpace : Real-Time Collaborative Whiteboard & Code Editor 

[![Badge](https://img.shields.io/badge/status-active-brightgreen)]()
[![Badge](https://img.shields.io/badge/License-MIT-yellow.svg)]()
[![Badge](https://img.shields.io/badge/React-18-blue)]()
[![Badge](https://img.shields.io/badge/Node.js-18+-green)]()
[![Badge](https://img.shields.io/badge/Yjs-CRDT-purple)]()
[![Badge](https://img.shields.io/badge/WebSocket-Socket.io-orange)]()

## Table of Contents
- [About](#about)
- [Problem Statement](#Problem-Statement)
- [Solution](#solution)
- [Use Case](#use-case)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)

## About

- SyncSpace is a real‑time collaborative platform that combines an interactive canvas (for architecture diagrams, flowcharts, and freehand drawing) with a fully‑featured code editor (powered by Monaco). Multiple users can work simultaneously on the same document – drawing, typing, and editing – with zero conflicts thanks to a Conflict‑free Replicated Data Type (CRDT) engine.

- Unlike standard request/response applications, SyncSpace uses WebSockets to broadcast every change instantly. The CRDT layer ensures that even simultaneous edits to the same line of code or the same canvas element merge cleanly – no overwrites, no race conditions.

## Problem Statement
<i> Standard web applications operate on a request/response model. Building a system where multiple users can draw on a canvas or type code simultaneously without race conditions, lag, or data overwriting requires complex state synchronization algorithms (Operational Transformation or CRDTs) that standard MERN tutorials do not cover. </i>
<br>
<br>


## Solution
SyncSpace solves this by pairing a real‑time sync engine (WebSockets/Socket.io) with a battle‑tested CRDT library (Yjs). The frontend is built with React, leveraging high‑performance canvas libraries and the Monaco editor – all glued together with a shared, conflict‑free state.
<br>
<br>


## ✨ Use Case
> A distributed engineering team uses SyncSpace for technical interviews. Candidate A draws an architecture diagram on the left side of the screen using the React canvas, while Interviewer B simultaneously writes Node.js code on the right side. The system uses WebSockets to broadcast changes instantly, and Conflict‑free Replicated Data Types (CRDTs) to ensure that if both users edit the same line of code at the exact same millisecond, the final state merges perfectly without breaking the document.

- <b>Technical interviews</b> – candidate and interviewer collaborate in real time.
- <b>Pair programming</b> – write code together, with live diagrams.
- <b>Design reviews</b> – annotate diagrams and edit specs side‑by‑side.
- <b>Remote workshops</b> – interactive whiteboards with code snippets.
<br>
<br>

##  Key Features

- 🎨 **Dual-Pane Workspace** – Interactive canvas on the left and Monaco code editor on the right for seamless design and coding.

- ✏️ **Collaborative Whiteboard** – Draw shapes, lines, text, and freehand sketches with real-time synchronization.

- 💻 **Monaco Code Editor** – VS Code-powered editor with syntax highlighting, IntelliSense, autocomplete, and multi-language support.

- 🔄 **Real-Time Collaboration** – Instant synchronization across all connected users using Socket.io and WebSockets.

- 🧩 **Conflict-Free Editing** – Yjs (CRDT) automatically merges concurrent edits without conflicts or data loss.

- 👥 **Live Presence Awareness** – View online collaborators, live cursors, and active editing indicators.

- 📦 **Persistent Workspace** – Automatically saves and restores code and canvas state across sessions.

- 🔒 **Room-Based Collaboration** – Create private rooms and invite teammates using unique shareable room links.

- ⚡ **Low-Latency Performance** – Optimized synchronization delivering near real-time updates for a smooth collaborative experience.

- 📱 **Responsive User Interface** – Clean, modern interface that adapts seamlessly across different screen sizes.
<br>
<br>

## 🏗️ Tech Stack

| Layer | Technology |
|--------|------------|
| **Frontend** | React 18, TypeScript, Vite |
| **Canvas** | Konva.js / Fabric.js (React Wrappers) |
| **Code Editor** | Monaco Editor (`@monaco-editor/react`) |
| **Synchronization** | Socket.io (WebSockets) + Yjs (CRDT) |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB |
| **State Management** | Yjs Shared Types (`Array`, `Map`, `Text`, `XmlElement`) |
