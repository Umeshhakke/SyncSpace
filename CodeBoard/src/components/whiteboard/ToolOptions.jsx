import { useRef, useEffect } from "react";
import { useWhiteboard } from "./context/WhiteboardContext";
import ColorPicker from "./ColorPicker";
import StrokeSelector from "./StrokeSelector";

function ToolOptions() {
    const {
        showOptions,
        setShowOptions,
        fillColor,
        setFillColor,
        opacity,
        setOpacity,
        fontFamily,
        setFontFamily,
        isBold,
        setIsBold,
        isItalic,
        setIsItalic,
        isUnderline,
        setIsUnderline,
        color,
        setColor,
    } = useWhiteboard();

    const panelRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            const target = event.target;
            if (target.closest('[data-palette-toggle]')) return;
            if (panelRef.current && !panelRef.current.contains(target)) {
                setShowOptions(false);
            }
        }
        if (showOptions) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showOptions, setShowOptions]);

    if (!showOptions) return null;

    return (
        <div
            ref={panelRef}
            className="absolute left-24 top-5 z-30 rounded-xl border border-slate-200 bg-white p-4 shadow-xl max-h-[80vh] overflow-y-auto w-64"
        >
            <div className="flex flex-col gap-3">
                {/* Stroke Color */}
                <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Stroke Color</label>
                    <ColorPicker value={color} onChange={setColor} />
                </div>

                {/* Fill Color */}
                <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Fill Color</label>
                    <ColorPicker value={fillColor} onChange={setFillColor} />
                </div>

                {/* Opacity Slider – with its own row and extra bottom margin */}
                <div className="mb-2">
                    <label className="text-xs font-medium text-slate-600 block mb-1">
                        Opacity: {Math.round(opacity * 100)}%
                    </label>
                    <div className="relative z-10">
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={opacity}
                            onChange={(e) => setOpacity(parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            style={{
                                background: `linear-gradient(to right, #3b82f6 ${opacity * 100}%, #e2e8f0 ${opacity * 100}%)`,
                            }}
                        />
                    </div>
                </div>

                {/* Stroke Width & Dashed */}
                <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Stroke Width & Dashed</label>
                    <div className="relative z-10">
                        <StrokeSelector />
                    </div>
                </div>

                <hr className="border-slate-200 my-1" />

                {/* Font Family */}
                <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Font Family</label>
                    <select
                        value={fontFamily}
                        onChange={(e) => setFontFamily(e.target.value)}
                        className="w-full border border-slate-200 rounded-md px-2 py-1 text-sm"
                    >
                        <option value="sans-serif">Sans-serif</option>
                        <option value="serif">Serif</option>
                        <option value="monospace">Monospace</option>
                        <option value="Arial">Arial</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Verdana">Verdana</option>
                        <option value="Courier New">Courier New</option>
                    </select>
                </div>

                {/* Text Styling Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsBold(!isBold)}
                        className={`px-3 py-1 rounded-md text-sm font-medium border ${
                            isBold ? "bg-blue-500 text-white border-blue-500" : "border-slate-300 hover:bg-slate-100"
                        }`}
                    >
                        B
                    </button>
                    <button
                        onClick={() => setIsItalic(!isItalic)}
                        className={`px-3 py-1 rounded-md text-sm font-medium border ${
                            isItalic ? "bg-blue-500 text-white border-blue-500" : "border-slate-300 hover:bg-slate-100"
                        }`}
                        style={{ fontStyle: "italic" }}
                    >
                        I
                    </button>
                    <button
                        onClick={() => setIsUnderline(!isUnderline)}
                        className={`px-3 py-1 rounded-md text-sm font-medium border ${
                            isUnderline ? "bg-blue-500 text-white border-blue-500" : "border-slate-300 hover:bg-slate-100"
                        }`}
                        style={{ textDecoration: "underline" }}
                    >
                        U
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ToolOptions;