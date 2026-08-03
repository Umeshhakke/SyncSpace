export default function sandboxTemplate(code, stdin) {
    return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
</head>

<body>

<script>

const send = (type, data) => {
    window.parent.postMessage(
        {
            type,
            data,
        },
        "*"
    );
};

console.log = (...args) => {
    send("log", args);
};

console.info = (...args) => {
    send("info", args);
};

console.warn = (...args) => {
    send("warn", args);
};

console.error = (...args) => {
    send("error", args);
};

console.clear = () => {
    send("clear", []);
};

const stdin = ${JSON.stringify(stdin)};

window.onerror = (message, source, line, column) => {
    send("runtime-error", {
        message,
        line,
        column,
    });
};

try {
    // User code
    ${code}

    send("finished", {});
} catch (error) {
    send("runtime-error", {
        message: error.message,
        stack: error.stack,
    });
}

</script>

</body>
</html>
`;
}