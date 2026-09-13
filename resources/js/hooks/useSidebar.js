import { useEffect, useState } from "react";
import { MOBILE_BREAKPOINT, SIDEBAR_COLLAPSED, SIDEBAR_WIDTH } from "@/config/layout";
import { useIsMobile } from "@/hooks/useIsMobile";

export function sidebarOffset(isOpen, isMobile = false) {
    if (isMobile) {
        return 0;
    }
    return isOpen ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED;
}

export function useSidebar() {
    const isMobile = useIsMobile();
    const [isOpen, setIsOpen] = useState(() =>
        typeof window !== "undefined" ? window.innerWidth >= MOBILE_BREAKPOINT : true
    );

    useEffect(() => {
        setIsOpen(!isMobile);
    }, [isMobile]);

    return {
        isOpen,
        setIsOpen,
        isMobile,
        offset: sidebarOffset(isOpen, isMobile),
    };
}
