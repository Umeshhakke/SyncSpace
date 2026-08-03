import { cn } from "../../utils/cn";
import { buttonVariants } from "../../theme/variants";

function IconButton({
    icon: Icon,
    tooltip,
    variant = "ghost",
    size = "md",
    active = false,
    disabled = false,
    className = "",
    ...props
}) {
    const sizes = {
        sm: "w-8 h-8",
        md: "w-10 h-10",
        lg: "w-12 h-12",
    };

    return (
        <button
            title={tooltip}
            disabled={disabled}
            className={cn(
                "flex items-center justify-center rounded-xl transition-all duration-200",
                sizes[size],
                buttonVariants[variant],
                active && "bg-blue-600 text-white",
                disabled && "opacity-50 cursor-not-allowed",
                className
            )}
            {...props}
        >
            {Icon && <Icon size={20} strokeWidth={2} />}
        </button>
    );
}

export default IconButton;