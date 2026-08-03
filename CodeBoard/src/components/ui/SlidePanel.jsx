import { useEffect } from "react";

function SlidePanel({
    isOpen,
    onClose,
    side = "left",
    width = "18rem",
    children,
}) {
    // Close with ESC
    useEffect(() => {
        function handleKeyDown(event) {
            if (event.key === "Escape") {
                onClose?.();
            }
        }

        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
        }

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onClose]);

    return (
        <>
            {/* Overlay */}
            <div
                onClick={onClose}
                className={`
                    absolute inset-0
                    bg-black/20
                    transition-opacity
                    duration-200
                    z-20
                    ${
                        isOpen
                            ? "opacity-100 pointer-events-auto"
                            : "opacity-0 pointer-events-none"
                    }
                `}
            />

            {/* Panel */}
            <aside
                style={{ width }}
                className={`
                    absolute
                    top-0
                    ${side === "left" ? "left-0" : "right-0"}
                    h-full
                    bg-white
                    border-slate-200
                    shadow-xl
                    z-30
                    transition-transform
                    duration-200
                    ease-in-out
                    ${
                        side === "left"
                            ? isOpen
                                ? "translate-x-0 border-r"
                                : "-translate-x-full border-r"
                            : isOpen
                            ? "translate-x-0 border-l"
                            : "translate-x-full border-l"
                    }
                `}
            >
                {children}
            </aside>
        </>
    );
}

export default SlidePanel;