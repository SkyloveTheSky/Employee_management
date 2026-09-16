import { useCallback, useEffect, useRef, useState } from "react";
import { inboxGet } from "@/lib/inboxRequest";

export default function useInboxLive(url, { enabled = true, interval = 3000 } = {}) {
    const [data, setData] = useState(null);
    const urlRef = useRef(url);
    urlRef.current = url;
    const tickRef = useRef(async () => {});

    useEffect(() => {
        if (!enabled || !url) {
            tickRef.current = async () => {};
            return undefined;
        }

        let cancelled = false;

        const tick = async () => {
            if (document.hidden) {
                return;
            }
            try {
                const response = await inboxGet(urlRef.current);
                if (!cancelled) {
                    setData(response.data);
                }
            } catch {
                // Le fil continue au prochain intervalle.
            }
        };

        tickRef.current = tick;
        tick();
        const timer = window.setInterval(tick, interval);
        const onVisibility = () => {
            if (!document.hidden) {
                tick();
            }
        };
        document.addEventListener("visibilitychange", onVisibility);

        return () => {
            cancelled = true;
            window.clearInterval(timer);
            document.removeEventListener("visibilitychange", onVisibility);
        };
    }, [enabled, url, interval]);

    const refresh = useCallback(() => tickRef.current(), []);

    return { data, refresh };
}
