import { Minus, Plus } from "lucide-react";
import { useWhiteboard } from "./context/WhiteboardContext";

function ZoomControls() {
    const { zoom, setZoom } = useWhiteboard();

    const zoomIn = () => {
        setZoom(prev => Math.min(500, prev + 10));
    };

    const zoomOut = () => {
        setZoom(prev => Math.max(10, prev - 10));
    };

    return (
        <div className="absolute bottom-5 right-5 z-20 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
            <button
                onClick={zoomOut}
                className="rounded-md p-1 hover:bg-slate-100"
                disabled={zoom <= 10}
            >
                <Minus size={16} />
            </button>

            <span className="w-12 text-center text-sm font-medium">
                {Math.round(zoom)}%
            </span>

            <button
                onClick={zoomIn}
                className="rounded-md p-1 hover:bg-slate-100"
                disabled={zoom >= 500}
            >
                <Plus size={16} />
            </button>
        </div>
    );
}

export default ZoomControls;