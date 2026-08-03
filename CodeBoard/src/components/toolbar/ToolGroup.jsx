import Divider from "../ui/Divider";

function ToolGroup({ children }) {
    return (
        <div className="flex flex-col items-center gap-2">
            {children}
            <Divider className="mt-2" />
        </div>
    );
}

export default ToolGroup;