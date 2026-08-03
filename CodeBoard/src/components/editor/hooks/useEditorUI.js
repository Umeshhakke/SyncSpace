import { useState, useRef } from "react";
import executeCode from "../runtime/executeCode";

export default function useEditorUI() {
    const [isExplorerOpen, setIsExplorerOpen] = useState(false);
    const [isConsoleVisible, setIsConsoleVisible] = useState(false);
    const [outputLines, setOutputLines] = useState([]);
    const [stdin, setStdin] = useState("");
    const [runStatus, setRunStatus] = useState("idle");
    const [executionTime, setExecutionTime] = useState(null);

    const cleanupRef = useRef(null);

    const toggleExplorer = () => {
        setIsExplorerOpen((prev) => !prev);
    };

    const closeExplorer = () => {
        setIsExplorerOpen(false);
    };

    const openExplorer = () => {
        setIsExplorerOpen(true);
    };

    const runEditor = (code, language = "javascript") => {
        // Always show the console so users see status even for empty runs
        setOutputLines([]);
        setIsConsoleVisible(true);
        setRunStatus("running");
        setExecutionTime(null);

        if (!code) {
            setOutputLines([
                {
                    type: "info",
                    text: "No code to run.",
                    timestamp: new Date(),
                },
            ]);
            setRunStatus("idle");
            return;
        }

        if (cleanupRef.current) {
            cleanupRef.current();
            cleanupRef.current = null;
        }

        cleanupRef.current = executeCode(language, code, stdin, (message) => {
            switch (message.type) {
                case "log":
                case "info":
                case "warn":
                case "error":
                    setOutputLines((prev) => [
                        ...prev,
                        {
                            type: message.type,
                            text: message.data
                                .map((item) =>
                                    typeof item === "object"
                                        ? JSON.stringify(item, null, 2)
                                        : String(item)
                                )
                                .join(" "),
                            timestamp: new Date(),
                        },
                    ]);
                    break;

                case "runtime-error":
                    setOutputLines((prev) => [
                        ...prev,
                        {
                            type: "error",
                            text: message.data.message,
                            timestamp: new Date(),
                        },
                    ]);
                    setRunStatus("failed");
                    break;

                case "clear":
                    setOutputLines([]);
                    break;

                case "success":
                    setOutputLines((prev) => [
                        ...prev,
                        {
                            type: "success",
                            text: `✔ Finished in ${message.data.executionTime} ms`,
                            timestamp: new Date(),
                        },
                    ]);
                    setRunStatus("success");
                    setExecutionTime(message.data.executionTime);

                    if (cleanupRef.current) {
                        cleanupRef.current();
                        cleanupRef.current = null;
                    }
                    break;

                default:
                    break;
            }
        });
    };

    const stopExecution = () => {
        if (!cleanupRef.current) {
            return;
        }

        cleanupRef.current();
        cleanupRef.current = null;
        setRunStatus("stopped");
        setOutputLines((prev) => [
            ...prev,
            {
                type: "info",
                text: "Execution stopped.",
                timestamp: new Date(),
            },
        ]);
    };

    const clearConsole = () => {
        setOutputLines([]);
        setRunStatus("idle");

        if (cleanupRef.current) {
            cleanupRef.current();
            cleanupRef.current = null;
        }
    };

    const closeConsole = () => {
        setIsConsoleVisible(false);
        setOutputLines([]);
        setRunStatus("idle");
        setExecutionTime(null);

        if (cleanupRef.current) {
            cleanupRef.current();
            cleanupRef.current = null;
        }
    };

    return {
        isExplorerOpen,
        isConsoleVisible,
        outputLines,
        stdin,
        runStatus,
        executionTime,

        toggleExplorer,
        closeExplorer,
        openExplorer,

        runEditor,
        stopExecution,
        clearConsole,
        closeConsole,
        setStdin,
    };
}