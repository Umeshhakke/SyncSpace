import { Whiteboard } from "../whiteboard";
import { CodeEditor } from "../editor";
import useResizablePanels from "../../hooks/useResizablePanels";
import SplitView from "./SplitView";
import ChatBox from "../chat/ChatBox";
import VoiceChat from "../chat/VoiceChat"; 

function Workspace() {
    const {
        leftWidth,
        setLeftWidth,
        isDragging,
        setIsDragging,
        resetLayout,
        DEFAULT_WIDTH,
        MIN_WIDTH,
        MAX_WIDTH,
    } = useResizablePanels();

    return (
        <main className="flex flex-1 gap-4 overflow-hidden">
            <SplitView
                left={<Whiteboard />}
                right={<CodeEditor />}
                resize={{
                    leftWidth,
                    onResize: setLeftWidth,
                    isDragging,
                    setIsDragging,
                    resetLayout,
                    minWidth: MIN_WIDTH,
                    maxWidth: MAX_WIDTH,
                    defaultWidth: DEFAULT_WIDTH,
                }}
            />
            <ChatBox />
            <VoiceChat />
        </main>
    );
}

export default Workspace;
