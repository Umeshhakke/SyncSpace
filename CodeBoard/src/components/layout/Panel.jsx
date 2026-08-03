import { cn } from "../../utils/cn";
import { Card } from "../ui";

function Panel({
    children,
    className = "",
    ...props
}) {
    return (
        <Card
            className={cn(
                "h-full w-full overflow-hidden",
                className
            )}
            {...props}
        >
            {children}
        </Card>
    );
}

export default Panel;