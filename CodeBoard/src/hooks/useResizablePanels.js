import { useState } from "react";

const DEFAULT_WIDTH = 60;
const MIN_WIDTH = 25;
const MAX_WIDTH = 75;

export default function useResizablePanels() {
    const [leftWidth, setLeftWidth] = useState(DEFAULT_WIDTH);
    const [isDragging, setIsDragging] = useState(false);

    const resetLayout = () => {
        setLeftWidth(DEFAULT_WIDTH);
    };

    return {
        leftWidth,
        setLeftWidth,

        isDragging,
        setIsDragging,

        resetLayout,

        DEFAULT_WIDTH,
        MIN_WIDTH,
        MAX_WIDTH,
    };
}