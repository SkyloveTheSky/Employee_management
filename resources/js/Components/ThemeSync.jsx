import { useEffect } from "react";
import { usePage } from "@inertiajs/react";

export default function ThemeSync() {
    const { theme } = usePage().props;

    useEffect(() => {
        if (!theme) {
            return;
        }

        const root = document.documentElement;
        root.style.setProperty("--color-primary", theme.primary);
        root.style.setProperty("--color-secondary", theme.secondary);
        root.style.setProperty("--color-tertiary", theme.tertiary);
        root.style.setProperty("--color-background", theme.background);
    }, [theme]);

    return null;
}
