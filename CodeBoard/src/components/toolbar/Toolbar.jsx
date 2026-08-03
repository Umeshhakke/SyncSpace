import {
    Pencil,
    Square,
    Circle,
    Slash,
    Type,
    Eraser,
    Undo2,
    Redo2,
    Settings,
} from "lucide-react";

import ToolbarButton from "./ToolbarButton";
import ToolGroup from "./ToolGroup";

function Toolbar() {
    return (
        <aside
            className="
                w-20
                bg-slate-900
                rounded-2xl
                flex
                flex-col
                items-center
                py-5
                gap-5
            "
        >
            {/* Logo */}

            <div className="text-white font-bold text-lg">
                CB
            </div>

            <ToolGroup>

                <ToolbarButton
                    icon={Pencil}
                    tooltip="Pencil"
                    active
                />

                <ToolbarButton
                    icon={Square}
                    tooltip="Rectangle"
                />

                <ToolbarButton
                    icon={Circle}
                    tooltip="Circle"
                />

                <ToolbarButton
                    icon={Slash}
                    tooltip="Line"
                />

                <ToolbarButton
                    icon={Type}
                    tooltip="Text"
                />

                <ToolbarButton
                    icon={Eraser}
                    tooltip="Eraser"
                />

            </ToolGroup>

            <ToolGroup>

                <ToolbarButton
                    icon={Undo2}
                    tooltip="Undo"
                />

                <ToolbarButton
                    icon={Redo2}
                    tooltip="Redo"
                />

            </ToolGroup>

            <div className="mt-auto">

                <ToolbarButton
                    icon={Settings}
                    tooltip="Settings"
                />

            </div>

        </aside>
    );
}

export default Toolbar;