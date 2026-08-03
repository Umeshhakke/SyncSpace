import {
    MousePointer2,
    PenTool,
    Square,
    Circle,
    ArrowRight,
    Type,
    Eraser,
    Palette,
} from "lucide-react";
import { useWhiteboard } from "./context/WhiteboardContext";
import ToolOptions from "./ToolOptions";

const tools = [
    { id: "select", icon: MousePointer2 },
    { id: "pen", icon: PenTool },
    { id: "rectangle", icon: Square },
    { id: "circle", icon: Circle },
    { id: "arrow", icon: ArrowRight },
    { id: "text", icon: Type },
    { id: "eraser", icon: Eraser },
];

function Toolbar() {
    const { activeTool, setActiveTool, showOptions, setShowOptions } = useWhiteboard();

    return (
        <>
            {/* Main toolbar */}
            <div className="absolute left-5 top-5 z-20 flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                {tools.map((tool) => {
                    const Icon = tool.icon;
                    return (
                        <button
                            key={tool.id}
                            onClick={() => setActiveTool(tool.id)}
                            className={`rounded-lg p-3 transition ${
                                activeTool === tool.id
                                    ? "bg-blue-500 text-white"
                                    : "hover:bg-slate-100"
                            }`}
                        >
                            <Icon size={18} />
                        </button>
                    );
                })}

                {/* Separator */}
                <div className="border-t border-slate-200 my-1" />

                {/* Toggle color/stroke options */}
                <button
                    onClick={() => setShowOptions(!showOptions)}
                    data-palette-toggle="true"
                    className={`rounded-lg p-3 transition ${
                        showOptions ? "bg-blue-500 text-white" : "hover:bg-slate-100"
                    }`}
                    title="Toggle color & stroke options"
                >
                    <Palette size={18} />
                </button>
            </div>

            {/* Floating tool options */}
            <ToolOptions />
        </>
    );
}

export default Toolbar;