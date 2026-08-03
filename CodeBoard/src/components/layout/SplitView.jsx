import { useEffect, useRef } from "react";
import ResizeHandle from "./ResizeHandle";

function SplitView({
    left,
    right,
    resize,
}) {
    const containerRef = useRef(null);

    const {
        leftWidth,
        onResize,
        isDragging,
        setIsDragging,
        resetLayout,
        minWidth,
        maxWidth,
    } = resize;

    useEffect(() => {
        function handleMouseMove(e) {
            if (!isDragging || !containerRef.current) return;

            const rect = containerRef.current.getBoundingClientRect();

            let percentage =
                ((e.clientX - rect.left) / rect.width) * 100;

            percentage = Math.max(minWidth, percentage);
            percentage = Math.min(maxWidth, percentage);

            onResize(percentage);
        }

        function handleMouseUp() {
            setIsDragging(false);
        }

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [
        isDragging,
        onResize,
        setIsDragging,
        minWidth,
        maxWidth,
    ]);

    return (
        <div
            ref={containerRef}
            className="flex flex-1 overflow-hidden"
        >
            <div
                className="min-w-[350px] h-full"
                style={{
                    width: `${leftWidth}%`,
                }}
            >
                {left}
            </div>

            <ResizeHandle
                isDragging={isDragging}
                onMouseDown={() => setIsDragging(true)}
                onDoubleClick={resetLayout}
            />

            <div
                className="min-w-[350px] h-full"
                style={{
                    width: `${100 - leftWidth}%`,
                }}
            >
                {right}
            </div>
        </div>
    );
}

export default SplitView;