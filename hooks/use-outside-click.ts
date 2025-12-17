import React, { useEffect } from "react";

export const useOutsideClick = (
    ref: React.RefObject<HTMLElement | null>,
    callback: Function
) => {
    useEffect(() => {
        const listener = (event: any) => {
            // DO NOTHING if the element being clicked is the ref element or their children
            if (!ref.current || ref.current.contains(event.target)) {
                return;
            }
            callback(event);
        };

        document.addEventListener("mousedown", listener);
        document.addEventListener("touchstart", listener);

        return () => {
            document.removeEventListener("mousedown", listener);
            document.removeEventListener("touchstart", listener);
        };
    }, [ref, callback]);
};
