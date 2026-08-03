import { useWhiteboard } from "./context/WhiteboardContext";
import { Minus, Minus as DashedIcon } from "lucide-react";

const widths = [1, 2, 3, 4, 6, 8, 12];

function StrokeSelector() {
    const { strokeWidth, setStrokeWidth, isDashed, setIsDashed } = useWhiteboard();

    return (
        <div className="flex items-center gap-1 flex-wrap">
            {widths.map((w) => (
                <button
                    key={w}
                    onClick={() => setStrokeWidth(w)}
                    className={`w-8 h-8 flex items-center justify-center rounded-md transition ${
                        strokeWidth === w ? "bg-blue-100 border border-blue-500" : "hover:bg-slate-100"
                    }`}
                >
                    <span
                        className="block bg-slate-700 rounded-full"
                        style={{
                            width: Math.min(w * 2, 24),
                            height: Math.min(w, 8),
                        }}
                    />
                </button>
            ))}
            <button
                onClick={() => setIsDashed(!isDashed)}
                className={`w-8 h-8 flex items-center justify-center rounded-md transition ${
                    isDashed ? "bg-blue-100 border border-blue-500" : "hover:bg-slate-100"
                }`}
                title="Dashed stroke"
            >
                <span className="block w-5 h-0.5 bg-slate-700" style={{ borderTop: "2px dashed currentColor" }} />
            </button>
        </div>
    );
}

export default StrokeSelector;