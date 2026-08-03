function ResizeHandle({
    isDragging,
    onMouseDown,
    onDoubleClick,
}) {
    return (
        <div
            className="
                relative
                w-3
                flex
                justify-center
                cursor-col-resize
                select-none
                flex-shrink-0
            "
            onMouseDown={onMouseDown}
            onDoubleClick={onDoubleClick}
        >
            <div
                className={`
                    w-[2px]
                    h-full
                    rounded-full
                    transition-all
                    duration-150
                    ${
                        isDragging
                            ? "bg-blue-600"
                            : "bg-slate-300 hover:bg-blue-500"
                    }
                `}
            />
        </div>
    );
}

export default ResizeHandle;