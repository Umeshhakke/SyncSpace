import Toolbar from "./Toolbar";
import Canvas from "./Canvas";
import ZoomControls from "./ZoomControls";

function CanvasContainer() {
    return (
        <div
            className="
                relative
                flex-1
                overflow-hidden
                bg-slate-100
            "
        >
            <Toolbar />

            <Canvas />

            <ZoomControls />
        </div>
    );
}

export default CanvasContainer;