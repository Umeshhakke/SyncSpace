import { IconButton } from "../ui";

function ToolbarButton({
    icon,
    active = false,
    tooltip,
    onClick,
}) {
    return (
        <IconButton
            icon={icon}
            active={active}
            tooltip={tooltip}
            onClick={onClick}
            size="md"
            variant={active ? "primary" : "ghost"}
        />
    );
}

export default ToolbarButton;