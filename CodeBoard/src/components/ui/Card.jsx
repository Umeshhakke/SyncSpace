import { cn } from "../../utils/cn";
import {
    cardVariants,
    RADIUS,
    SHADOW,
    SPACING,
} from "../../theme";

function Card({
    children,
    variant = "default",
    padding = "md",
    shadow = "md",
    className = "",
    ...props
}) {
    return (
        <div
            className={cn(
                cardVariants[variant],
                RADIUS.lg,
                SPACING[padding],
                SHADOW[shadow],
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export default Card;