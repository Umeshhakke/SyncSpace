let sandbox = null;

export default function createSandbox() {
    // Reuse the existing sandbox if it already exists
    if (sandbox) {
        return sandbox;
    }

    sandbox = document.createElement("iframe");

    sandbox.setAttribute(
        "sandbox",
        "allow-scripts"
    );

    sandbox.style.display = "none";

    document.body.appendChild(sandbox);

    return sandbox;
}

export function destroySandbox() {
    if (!sandbox) {
        return;
    }

    sandbox.remove();
    sandbox = null;
}