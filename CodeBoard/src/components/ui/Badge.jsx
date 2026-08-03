import { cn } from "../../utils/cn";
import { badgeVariants } from "../../theme/variants";

function Badge({
    children,
    variant = "default",
    className = "",
}) {
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
                badgeVariants[variant],
                className
            )}
        >
            {children}
        </span>
    );
}

export default Badge;