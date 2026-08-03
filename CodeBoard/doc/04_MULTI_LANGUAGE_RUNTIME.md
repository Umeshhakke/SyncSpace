# 04. Multi-Language Runtime & Code Execution Engine

This document explains CodeBoard's code execution engine (`src/components/editor/runtime/executeCode.js`) and how it supports instant frontend execution, WebAssembly Python, and cloud-compiled Java and C++.

---

## 1. Runtime Routing Architecture

When a user clicks **"Run"** or presses `Ctrl+Enter` / `Cmd+Enter`, `executeCode(language, code, stdin, onMessage)` routes the code to one of three execution tiers:

```mermaid
graph TD
    Start[User Triggers Code Execution] --> CheckEmpty{Is code empty?}
    CheckEmpty -->|Yes| LogEmpty[Log 'Nothing to run']
    CheckEmpty -->|No| Router[Language Router - switch language]

    subgraph Tier1 [Tier 1: Instant Browser-Native Execution]
        Router -->|javascript| JS_Runner[JavaScript Function Eval Sandbox]
        Router -->|typescript| TS_Runner[Type-Stripper -> JS_Runner]
        Router -->|html / css| HTML_CSS[Secure Sandboxed iframe.srcdoc]
        Router -->|markdown| MD_Runner[Markdown-to-HTML Renderer]
        Router -->|json| JSON_Runner[JSON.parse Validator & Pretty-Printer]
    end

    subgraph Tier2 [Tier 2: In-Browser WebAssembly Runtime]
        Router -->|python| PY_Runner[Pyodide CPython 3.11 Wasm Engine]
    end

    subgraph Tier3 [Tier 3: Free Cloud Compiler API]
        Router -->|java| JAVA_Runner[Java Auto-Wrapper -> Wandbox API]
        Router -->|cpp| CPP_Runner[C++17 -O2 -> Wandbox API]
    end

    JS_Runner --> ConsoleOutput[Console Output Stream]
    TS_Runner --> ConsoleOutput
    HTML_CSS --> ConsoleOutput
    MD_Runner --> ConsoleOutput
    JSON_Runner --> ConsoleOutput
    PY_Runner --> ConsoleOutput
    JAVA_Runner --> ConsoleOutput
    CPP_Runner --> ConsoleOutput
```

---

## 2. Tier 1: Instant Browser-Native Execution (0ms Latency)

### 1. JavaScript (`runJavascript.js`)
- Executes using a secure browser sandbox evaluation.
- Captures `console.log`, `console.warn`, and `console.error` calls and streams them to CodeBoard's output terminal.

### 2. TypeScript (`runTypeScript`)
- Uses regex-based type stripping to remove type annotations, interfaces, type aliases, generics, and return type colons.
- Passes the clean JavaScript code directly into `runJavascript`, allowing instant TypeScript execution without a server-side TypeScript compiler.

### 3. HTML & CSS (`createSandbox.js`, `runHtml`, `runCss`)
- Generates an isolated `iframe` with sandboxed security policies (`allow-scripts`, `allow-modals`).
- Renders the user's markup or styling dynamically in the preview drawer.

---

## 3. Tier 2: In-Browser WebAssembly Python (Pyodide)

To avoid cloud API rate limits, authentication requirements, and server crashes, CodeBoard runs Python **locally inside the user's browser tab** using **Pyodide** (CPython compiled to WebAssembly).

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Exec as executeCode.js
    participant CDN as jsdelivr CDN
    participant Wasm as Pyodide WebAssembly
    participant Console as Console UI

    User->>Exec: Run Python Code (code + stdin)
    Exec->>Wasm: Check if Pyodide is cached
    alt First execution of session
        Exec->>CDN: Fetch Pyodide Wasm (~8 MB)
        CDN-->>Wasm: Initialize CPython runtime
    end
    Exec->>Wasm: Redirect sys.stdout & sys.stderr to StringIO
    Exec->>Wasm: Inject stdin lines into Python builtins.input()
    Wasm->>Wasm: Execute Python scripts
    Wasm-->>Exec: Return stdout / stderr strings
    Exec->>Console: Stream formatted logs & traceback to terminal
```

### Key Technical Advantages of Pyodide:
- **Zero Cost & Zero Authentication:** No API keys or backend server infrastructure required.
- **Offline Capable:** Once the ~8 MB Wasm bundle is cached by the browser, Python code executes offline.
- **Standard Library Support:** Supports `math`, `re`, `datetime`, `json`, and more.
- **Standard Input (`stdin`) Support:** CodeBoard injects `_stdin_lines` into the Pyodide environment and overrides `builtins.input()` to supply console input sequentially.

---

## 4. Tier 3: Free Cloud Compilers (Wandbox API)

For compiled languages (`Java`, `C++`), CodeBoard integrates with **Wandbox** (`wandbox.org`), a free open-source compilation platform online since 2013.

```mermaid
graph LR
    Code[Source Code] --> LangCheck{Language?}
    LangCheck -->|Java| AutoWrap[wrapJava: Auto-wrap in 'public class Main']
    LangCheck -->|C++| AddFlags[Inject '-std=c++17 -O2' flags]
    
    AutoWrap --> Post[POST https://wandbox.org/api/compile.json]
    AddFlags --> Post
    
    Post --> Resp[Wandbox Server Compilation]
    Resp -->|status == 0| Success[Stream Program Stdout]
    Resp -->|status != 0| Err[Stream Compiler Error / Stderr]
```

### 1. Stable Compiler Target Names (`*-head`)
- CodeBoard uses `"openjdk-head"` for Java and `"gcc-head"` for C++.
- The `*-head` target always references the latest installed compiler version on Wandbox, preventing version mismatch HTTP errors when Wandbox updates its compilers.

### 2. Java Auto-Wrapper (`wrapJava`)
- In Java, code must reside inside a class definition.
- If a beginner writes a snippet like `System.out.println("Hello World");` without boilerplate, `wrapJava(code)` automatically wraps it:
```java
// Automatically generated wrapper:
public class Main {
    public static void main(String[] args) throws Exception {
        System.out.println("Hello World");
    }
}
```
- If the user wrote a class with a different name, CodeBoard automatically renames it to `public class Main` to satisfy Wandbox's compilation requirements.

---

## 5. Execution Summary Table

| Language | Engine | Location | Latency | External API Needed? |
|---|---|---|---|---|
| **JavaScript** | Browser Sandbox | Local Tab | ~2ms | No |
| **TypeScript** | Type-Strip + Sandbox | Local Tab | ~5ms | No |
| **HTML / CSS** | Sandboxed `iframe` | Local Tab | ~10ms | No |
| **Markdown** | Regex HTML Renderer | Local Tab | ~5ms | No |
| **JSON** | `JSON.parse` | Local Tab | ~1ms | No |
| **Python** | Pyodide (Wasm CPython) | Local Tab | ~300ms | No (CDN download on first run) |
| **Java** | Wandbox (`openjdk-head`) | Remote Server | ~1.5s–3s | Yes (Free Wandbox API) |
| **C++** | Wandbox (`gcc-head`) | Remote Server | ~1.5s–3s | Yes (Free Wandbox API) |
