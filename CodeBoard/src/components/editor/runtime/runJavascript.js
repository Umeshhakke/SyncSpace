import createSandbox, { destroySandbox } from "./createSandbox";
import sandboxTemplate from "./sandboxTemplate";

export default function runJavascript(code, stdin, onMessage) {
    const iframe = createSandbox();
    const startTime = performance.now();

    function handleMessage(event) {
        if (event.source !== iframe.contentWindow) {
            return;
        }

        onMessage(event.data);

        if (event.data.type === "finished") {
                const endTime = performance.now();

                onMessage({
                    type: "success",
                    data: {
                        executionTime: (endTime - startTime).toFixed(2),
                    },
                });
            }
    }

    window.addEventListener("message", handleMessage);
    iframe.srcdoc = sandboxTemplate(code, stdin);

    return () => {
        window.removeEventListener("message", handleMessage);
        destroySandbox();
    };
}