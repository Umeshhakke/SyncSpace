import { cn } from "../../utils/cn";
import { inputVariants } from "../../theme/variants";

function Input({
    label,
    error,
    helperText,
    className = "",
    disabled = false,
    ...props
}) {
    return (
        <div className="flex flex-col gap-1.5 w-full">
            {label && (
                <label className="text-sm font-medium text-slate-700">
                    {label}
                </label>
            )}

            <input
                disabled={disabled}
                className={cn(
                    "w-full h-10 rounded-xl border px-4 outline-none transition-all duration-200",
                    disabled
                        ? inputVariants.disabled
                        : error
                        ? inputVariants.error
                        : inputVariants.default,
                    className
                )}
                {...props}
            />

            {helperText && !error && (
                <p className="text-xs text-slate-500">
                    {helperText}
                </p>
            )}

            {error && (
                <p className="text-xs text-red-600">
                    {error}
                </p>
            )}
        </div>
    );
}

export default Input;