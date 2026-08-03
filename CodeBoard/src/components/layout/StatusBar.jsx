import { useWhiteboard } from "../whiteboard/context/WhiteboardContext";
import { useWorkspace } from "../../context/WorkspaceContext";
import {
    CheckCircle2,
    AlertCircle,
    Users,
    MousePointer2,
    ZoomIn,
    Cpu,
} from "lucide-react";

function StatusBar() {
    const {
        activeTool,
        objects,
        zoom,
        cursorPosition,
        saveStatus,
    } = useWhiteboard();
    const { participants, connectionStatus } = useWorkspace();

    const isSaved = saveStatus === "Saved";

    return (
        <footer
            className="
                h-10
                rounded-xl
                border
                border-slate-200
                bg-white
                px-5
                shadow-md
                flex
                items-center
                justify-between
                text-sm
            "
        >
            {/* LEFT */}
            <div className="flex items-center gap-6">

                {/* Save Status */}
                <div className="flex items-center gap-2">

                    {isSaved ? (
                        <CheckCircle2
                            size={15}
                            className="text-emerald-500"
                        />
                    ) : (
                        <AlertCircle
                            size={15}
                            className="text-amber-500"
                        />
                    )}

                    <span
                        className={`font-medium ${
                            isSaved
                                ? "text-emerald-600"
                                : "text-amber-600"
                        }`}
                    >
                        {saveStatus}
                    </span>

                </div>

                {/* Active Tool */}

                <div className="flex items-center gap-2 text-slate-600">

                    <MousePointer2 size={15} />

                    <span>
                        Tool :
                    </span>

                    <span className="font-semibold capitalize text-slate-800">
                        {activeTool}
                    </span>

                </div>

                {/* Objects */}

                <div className="text-slate-600">

                    Objects :

                    <span className="ml-1 font-semibold text-slate-800">
                        {objects.length}
                    </span>

                </div>

            </div>

            {/* RIGHT */}

            <div className="flex items-center gap-6">

                {/* Zoom */}

                <div className="flex items-center gap-2 text-slate-600">

                    <ZoomIn size={15} />

                    <span>

                        {Math.round(zoom)}%

                    </span>

                </div>

                {/* Cursor */}

                <div className="text-slate-600">

                    Cursor :

                    <span className="ml-1 font-medium text-slate-800">
                        ({cursorPosition.x}, {cursorPosition.y})
                    </span>

                </div>

                {/* Users */}

                <div className="flex items-center gap-2 text-slate-600">

                    <Users
                        size={15}
                        className="text-blue-500"
                    />

                    <span>
                        {participants.length}
                    </span>

                </div>

                {/* Connection */}

                <div className="flex items-center gap-2 text-slate-600">
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                        {connectionStatus}
                    </span>
                </div>

            </div>

        </footer>
    );
}

export default StatusBar;