import { cn } from "../../utils/cn";
import {
    BUTTON_SIZE,
    RADIUS,
    buttonVariants,
} from "../../theme";

function Button({
    children,
    variant = "primary",
    size = "md",
    className = "",
    ...props
}) {
    return (
        <button
            className={cn(
                "transition-all duration-200 outline-none",
                BUTTON_SIZE[size],
                RADIUS.md,
                buttonVariants[variant],
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
}

export default Button;