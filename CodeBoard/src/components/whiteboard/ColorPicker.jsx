import { useWhiteboard } from "./context/WhiteboardContext";

const colors = [
    "#2563eb", "#dc2626", "#16a34a", "#d97706",
    "#7c3aed", "#ec4899", "#000000", "#ffffff",
    "transparent",
];

function ColorPicker({ value, onChange, label }) {
    const { color: defaultColor, setColor } = useWhiteboard();
    const currentColor = value !== undefined ? value : defaultColor;
    const setCurrentColor = onChange || setColor;

    return (
        <div className="flex items-center gap-2 flex-wrap">
            {colors.map((c) => (
                <button
                    key={c}
                    onClick={() => setCurrentColor(c)}
                    className={`w-6 h-6 rounded-full border-2 ${
                        c === currentColor ? "border-blue-500" : "border-transparent"
                    }`}
                    style={{
                        backgroundColor: c === "transparent" ? "url(#transparent)" : c,
                        borderColor: c === "#ffffff" ? "#ccc" : undefined,
                    }}
                    title={c === "transparent" ? "None" : c}
                />
            ))}
            {label && <span className="text-xs text-slate-500 ml-1">{label}</span>}
        </div>
    );
}

export default ColorPicker;