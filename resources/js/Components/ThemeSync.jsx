import { useEffect } from "react";
import { usePage } from "@inertiajs/react";

export function applyTheme(theme) {
    if (!theme || typeof document === "undefined") {
        return;
    }

    const root = document.documentElement;
    if (theme.primary) {
        root.style.setProperty("--color-primary", theme.primary);
    }
    if (theme.secondary) {
        root.style.setProperty("--color-secondary", theme.secondary);
    }
    if (theme.tertiary) {
        root.style.setProperty("--color-tertiary", theme.tertiary);
    }
    if (theme.background) {
        root.style.setProperty("--color-background", theme.background);
    }
}

export default function ThemeSync() {
    const { theme } = usePage().props;
    applyTheme(theme);

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    return null;
}
