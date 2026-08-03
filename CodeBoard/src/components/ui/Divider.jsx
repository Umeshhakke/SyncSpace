import { cn } from "../../utils/cn";

function Divider({
    orientation = "horizontal",
    className = "",
}) {
    const isHorizontal = orientation === "horizontal";

    return (
        <div
            className={cn(
                "bg-slate-200 shrink-0",
                isHorizontal
                    ? "w-full h-px"
                    : "w-px h-full",
                className
            )}
        />
    );
}

export default Divider;