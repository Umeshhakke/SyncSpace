import runJavascript from "./runJavascript";
import createSandbox, { destroySandbox } from "./createSandbox";

// ── Language metadata ─────────────────────────────────────────────────────────
export const LANGUAGE_META = {
    javascript: { label: "JavaScript", color: "#f7df1e", bg: "bg-yellow-400/10", text: "text-yellow-300" },
    typescript: { label: "TypeScript", color: "#3178c6", bg: "bg-blue-500/10",   text: "text-blue-300"   },
    python:     { label: "Python",     color: "#3572a5", bg: "bg-blue-400/10",   text: "text-sky-300"    },
    java:       { label: "Java",       color: "#b07219", bg: "bg-orange-400/10", text: "text-orange-300" },
    cpp:        { label: "C++",        color: "#f34b7d", bg: "bg-pink-500/10",   text: "text-pink-300"   },
    html:       { label: "HTML",       color: "#e34c26", bg: "bg-orange-500/10", text: "text-orange-400" },
    css:        { label: "CSS",        color: "#563d7c", bg: "bg-purple-500/10", text: "text-purple-300" },
    json:       { label: "JSON",       color: "#40bf77", bg: "bg-green-500/10",  text: "text-green-300"  },
    markdown:   { label: "Markdown",   color: "#083fa1", bg: "bg-indigo-500/10", text: "text-indigo-300" },
    plaintext:  { label: "Plain Text", color: "#888",    bg: "bg-slate-500/10",  text: "text-slate-300"  },
};

export function getRuntimeLabel(language) {
    return LANGUAGE_META[language]?.label ?? "Runtime";
}

function makeSuccess(onMessage, startTime) {
    onMessage({ type: "success", data: { executionTime: (performance.now() - startTime).toFixed(2) } });
}

// ═══════════════════════════════════════════════════════════════════════════════
// PYTHON — Pyodide (CPython compiled to WebAssembly, runs in browser)
// No API, no account, no rate limit. ~8 MB download on first run, then cached.
// ═══════════════════════════════════════════════════════════════════════════════
const PYODIDE_CDN = "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js";
let _pyodide = null;          // cached instance
let _pyodidePromise = null;   // in-flight load promise

function loadPyodide() {
    if (_pyodide)        return Promise.resolve(_pyodide);
    if (_pyodidePromise) return _pyodidePromise;

    _pyodidePromise = new Promise((resolve, reject) => {
        function init() {
            window.loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/" })
                .then(py => { _pyodide = py; _pyodidePromise = null; resolve(py); })
                .catch(err  => { _pyodidePromise = null; reject(err); });
        }

        if (typeof window.loadPyodide === "function") { init(); return; }

        const s = document.createElement("script");
        s.src = PYODIDE_CDN;
        s.onload  = init;
        s.onerror = () => reject(new Error("Could not load Pyodide from CDN. Check your internet connection."));
        document.head.appendChild(s);
    });

    return _pyodidePromise;
}

function runPython(code, stdin, onMessage, startTime) {
    let cancelled = false;

    onMessage({
        type: "info",
        data: [_pyodide
            ? "▶ Running Python…"
            : "▶ Loading Python runtime (first run ~8 MB, cached after that)…"],
    });

    loadPyodide()
        .then(pyodide => {
            if (cancelled) return;

            onMessage({ type: "info", data: ["▶ Executing…"] });

            // Redirect stdout / stderr
            pyodide.runPython(`
import sys, io, traceback
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
`);

            // Provide stdin lines to input()
            const stdinLines = (stdin || "").split("\n");
            pyodide.globals.set("_stdin_lines", pyodide.toPy(stdinLines));
            pyodide.runPython(`
_stdin_idx = [0]
import builtins
def _input(prompt=""):
    if prompt:
        sys.stdout.write(str(prompt))
    if _stdin_idx[0] < len(_stdin_lines):
        v = _stdin_lines[_stdin_idx[0]]; _stdin_idx[0] += 1; return v
    return ""
builtins.input = _input
`);

            try {
                pyodide.runPython(code);
            } catch (err) {
                const stdout = pyodide.runPython("sys.stdout.getvalue()").trim();
                const stderr = pyodide.runPython("sys.stderr.getvalue()").trim();
                if (stdout) onMessage({ type: "log",   data: [stdout] });
                // err.message already contains the traceback from Pyodide
                onMessage({ type: "runtime-error", data: { message: err.message || String(err) } });
                return;
            }

            const stdout = pyodide.runPython("sys.stdout.getvalue()").trim();
            const stderr = pyodide.runPython("sys.stderr.getvalue()").trim();

            if (stdout) onMessage({ type: "log",   data: [stdout] });
            if (stderr) onMessage({ type: "error", data: [stderr] });
            if (!stdout && !stderr) onMessage({ type: "log", data: ["(no output)"] });

            makeSuccess(onMessage, startTime);
        })
        .catch(err => {
            if (cancelled) return;
            onMessage({ type: "runtime-error", data: { message: `Python load failed: ${err.message}` } });
        });

    return () => { cancelled = true; };
}

// ═══════════════════════════════════════════════════════════════════════════════
// JAVA / C++ — Wandbox (free, no account, no key)
// https://wandbox.org — open source, runs on AWS, online since 2013.
// Using *-head compilers so they always exist regardless of version rollouts.
// ═══════════════════════════════════════════════════════════════════════════════
const WANDBOX_URL = "https://wandbox.org/api/compile.json";

// "head" variants always point to the latest available version on Wandbox,
// so they never go stale when Wandbox updates their compiler fleet.
const WANDBOX_COMPILER = {
    java: "openjdk-head",
    cpp:  "gcc-head",
};

function wrapJava(code) {
    // If the user already wrote a class, use it as-is (rename to Main if needed).
    if (/\bclass\s+\w+/.test(code)) {
        return code.replace(/\bpublic\s+class\s+\w+/, "public class Main");
    }
    // Otherwise wrap in a Main class so simple snippets like
    //   System.out.println("hi");
    // just work without boilerplate.
    const indented = code.split("\n").map(l => "        " + l).join("\n");
    return `public class Main {\n    public static void main(String[] args) throws Exception {\n${indented}\n    }\n}`;
}

function runWithWandbox(language, code, stdin, onMessage, startTime) {
    const compiler = WANDBOX_COMPILER[language];
    if (!compiler) return null;

    const controller = new AbortController();
    onMessage({ type: "info", data: [`▶ Running ${getRuntimeLabel(language)} via Wandbox…`] });

    const source = language === "java" ? wrapJava(code) : code;
    const compilerOptions = language === "cpp" ? "-std=c++17 -O2" : "";

    fetch(WANDBOX_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            code: source,
            compiler: compiler,
            stdin: stdin || "",
            "compiler-option-raw": compilerOptions,
            save: false,
        }),
        signal: controller.signal,
    })
        .then(r => {
            if (!r.ok) throw new Error(`Wandbox HTTP ${r.status} — server may be overloaded, try again.`);
            return r.json();
        })
        .then(data => {
            // Wandbox returns compiler_error for compile failures
            const compileErr = (data.compiler_error || "").trim();
            const programOut = (data.program_output || "").trim();
            const programErr = (data.program_error  || "").trim();
            const exitCode   = parseInt(data.status ?? "0", 10);

            if (compileErr) {
                onMessage({ type: "error",        data: [compileErr] });
                onMessage({ type: "runtime-error", data: { message: "Compilation failed — see errors above." } });
                return;
            }

            if (programOut) onMessage({ type: "log",   data: [programOut] });
            if (programErr) onMessage({ type: "error", data: [programErr] });

            if (exitCode !== 0) {
                onMessage({
                    type: "runtime-error",
                    data: { message: programErr || `Process exited with code ${exitCode}` },
                });
                return;
            }

            if (!programOut && !programErr) onMessage({ type: "log", data: ["(no output)"] });

            makeSuccess(onMessage, startTime);
        })
        .catch(err => {
            if (err.name === "AbortError") return;
            onMessage({
                type: "runtime-error",
                data: { message: `Wandbox error: ${err.message}` },
            });
        });

    return () => controller.abort();
}

// ═══════════════════════════════════════════════════════════════════════════════
// TYPESCRIPT — type-strip then run as JavaScript in browser
// Handles annotations, interfaces, generics. No API needed.
// ═══════════════════════════════════════════════════════════════════════════════
function runTypeScript(code, stdin, onMessage) {
    let js = code
        // Remove standalone interface / type blocks
        .replace(/^\s*(export\s+)?(interface|type)\s+\w[^{]*\{[^}]*\}/gm, "")
        // Remove primitive type annotations on variables: let x: number
        .replace(/:\s*(string|number|boolean|any|void|never|unknown|null|undefined|object)\b/g, "")
        // Remove generic type params e.g. Array<string>, Map<K, V>
        .replace(/<[A-Za-z,\s\[\]]+>/g, "")
        // Remove return type from arrow / regular functions: ): ReturnType =>  or ): ReturnType {
        .replace(/\)\s*:\s*\w[\w<>\[\]|]*\s*(?=[{=])/g, ") ")
        // Remove typed function params: (x: number, y: string)
        .replace(/(\w+)\s*:\s*[\w<>\[\]|]+(?=[,)])/g, "$1")
        // Remove "as Type" casts
        .replace(/\s+as\s+\w[\w<>\[\]|]*/g, "");

    return runJavascript(js, stdin, onMessage);
}

// ═══════════════════════════════════════════════════════════════════════════════
// BROWSER-NATIVE — HTML, CSS, Markdown, JSON, Plaintext
// ═══════════════════════════════════════════════════════════════════════════════
function runHtml(code, onMessage, startTime) {
    const iframe = createSandbox();
    iframe.srcdoc = code;
    onMessage({ type: "info", data: ["▶ HTML rendered in preview panel."] });
    makeSuccess(onMessage, startTime);
    return () => destroySandbox();
}

function runCss(code, onMessage, startTime) {
    const iframe = createSandbox();
    iframe.srcdoc = `<!DOCTYPE html><html><head><style>${code}</style></head>
<body style="padding:24px;font-family:sans-serif;color:#444;">
  <p style="color:#aaa;font-size:13px;">(CSS applied — add HTML to see styled elements)</p>
</body></html>`;
    onMessage({ type: "info", data: ["▶ CSS applied in preview."] });
    makeSuccess(onMessage, startTime);
    return () => destroySandbox();
}

function runMarkdown(code, onMessage, startTime) {
    const html = code
        .replace(/^###### (.*)$/gm, "<h6>$1</h6>")
        .replace(/^##### (.*)$/gm,  "<h5>$1</h5>")
        .replace(/^#### (.*)$/gm,   "<h4>$1</h4>")
        .replace(/^### (.*)$/gm,    "<h3>$1</h3>")
        .replace(/^## (.*)$/gm,     "<h2>$1</h2>")
        .replace(/^# (.*)$/gm,      "<h1>$1</h1>")
        .replace(/\*\*(.+?)\*\*/g,  "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g,      "<em>$1</em>")
        .replace(/`(.+?)`/g,        "<code style='background:#f0f0f0;padding:2px 5px;border-radius:3px'>$1</code>")
        .replace(/^> (.*)$/gm,      "<blockquote>$1</blockquote>")
        .replace(/^---$/gm,         "<hr>")
        .replace(/\n/g,             "<br>");
    const iframe = createSandbox();
    iframe.srcdoc = `<!DOCTYPE html><html><head><style>
body{font-family:system-ui,sans-serif;padding:24px;line-height:1.7;color:#1a1a1a;max-width:700px}
h1,h2,h3,h4,h5,h6{margin:.8em 0 .3em}
blockquote{border-left:4px solid #ccc;margin:0;padding-left:1em;color:#666}
hr{border:none;border-top:1px solid #ddd;margin:1em 0}
</style></head><body>${html}</body></html>`;
    onMessage({ type: "info", data: ["▶ Markdown rendered in preview."] });
    makeSuccess(onMessage, startTime);
    return () => destroySandbox();
}

function runJson(code, onMessage, startTime) {
    try {
        const parsed = JSON.parse(code);
        onMessage({ type: "log", data: [JSON.stringify(parsed, null, 2)] });
        makeSuccess(onMessage, startTime);
    } catch (err) {
        onMessage({ type: "runtime-error", data: { message: `JSON error: ${err.message}` } });
    }
    return () => {};
}

function runPlaintext(code, onMessage, startTime) {
    onMessage({ type: "log", data: [code || "(empty)"] });
    makeSuccess(onMessage, startTime);
    return () => {};
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN ENTRY POINT
// ═══════════════════════════════════════════════════════════════════════════════
export default function executeCode(language, code, stdin, onMessage) {
    const startTime = performance.now();

    if (!code?.trim()) {
        onMessage({ type: "info",    data: ["Nothing to run — file is empty."] });
        onMessage({ type: "success", data: { executionTime: "0.00" } });
        return () => {};
    }

    switch (language) {
        // Instant — runs in your browser, no network call
        case "javascript": return runJavascript(code, stdin, onMessage);
        case "typescript": return runTypeScript(code, stdin, onMessage);
        case "html":       return runHtml(code, onMessage, startTime);
        case "css":        return runCss(code, onMessage, startTime);
        case "markdown":   return runMarkdown(code, onMessage, startTime);
        case "json":       return runJson(code, onMessage, startTime);
        case "plaintext":  return runPlaintext(code, onMessage, startTime);

        // Python — Pyodide (WebAssembly, runs in browser, no API)
        case "python":
            return runPython(code, stdin, onMessage, startTime);

        // Java / C++ — Wandbox (free API, no account)
        case "java":
        case "cpp": {
            const cleanup = runWithWandbox(language, code, stdin, onMessage, startTime);
            return cleanup ?? (() => {});
        }

        default:
            onMessage({
                type: "runtime-error",
                data: { message: `"${language}" is not supported for execution yet.` },
            });
            return () => {};
    }
}
