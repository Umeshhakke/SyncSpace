import { useState } from "react";

function ConsoleInput({ onSubmit }) {
    const [value, setValue] = useState("");

    function handleSubmit(e) {
        e.preventDefault();

        onSubmit(value);

        setValue("");
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="border-t border-slate-800 bg-slate-900 p-3 flex gap-2"
        >
            <input
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Program input..."
                className="
                    flex-1
                    rounded-md
                    bg-slate-950
                    border
                    border-slate-700
                    px-3
                    py-2
                    text-sm
                    text-white
                    outline-none
                    focus:border-blue-500
                "
            />

            <button
                className="
                    rounded-md
                    bg-blue-600
                    px-4
                    text-white
                    hover:bg-blue-500
                "
            >
                Send
            </button>
        </form>
    );
}

export default ConsoleInput;