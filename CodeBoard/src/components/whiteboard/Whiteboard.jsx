import WhiteboardHeader from "./WhiteboardHeader";
import CanvasContainer from "./CanvasContainer";

function Whiteboard() {
    return (
        <div
            className="
                flex
                h-full
                flex-col
                overflow-hidden
                rounded-xl
                border
                border-slate-200
                bg-white
            "
        >
            <WhiteboardHeader />
            <CanvasContainer />
        </div>
    );
}

export default Whiteboard;