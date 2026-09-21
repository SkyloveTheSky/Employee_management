import { useCallback, useEffect, useRef, useState } from "react";
import { inboxGet } from "@/lib/inboxRequest";

const HEADER_MS = 12000;
const PAGE_MS = 8000;

const listeners = new Set();
let timer = null;
let debounce = null;
let lastData = null;
let lastRevision = null;
let visibilityBound = false;

function collectNeeds() {
    const needs = {
        url: null,
        preview: false,
        threads: false,
        thread: false,
        userId: null,
    };
    listeners.forEach((listener) => {
        if (!listener.enabled || !listener.url) {
            return;
        }
        needs.url = listener.url;
        needs.preview = needs.preview || Boolean(listener.preview);
        needs.threads = needs.threads || Boolean(listener.threads);
        needs.thread = needs.thread || Boolean(listener.thread);
        if (listener.userId) {
            needs.userId = listener.userId;
        }
    });
    return needs;
}

function mergeData(prev, next) {
    if (!next || next.unchanged) {
        return prev;
    }

    return {
        ...prev,
        ...next,
        inbox: next.inbox
            ? {
                ...(prev?.inbox || {}),
                ...next.inbox,
                messages: next.inbox.messages ?? prev?.inbox?.messages,
                notifications: next.inbox.notifications ?? prev?.inbox?.notifications,
            }
            : prev?.inbox,
        threads: next.threads ?? prev?.threads,
        messages: next.messages ?? prev?.messages,
        revision: next.revision ?? prev?.revision,
        unchanged: false,
    };
}

function emit(data) {
    listeners.forEach((listener) => listener.notify(data));
}

function buildUrl(needs, revision) {
    const params = new URLSearchParams();
    if (needs.preview) params.set("preview", "1");
    if (needs.threads) params.set("threads", "1");
    if (needs.thread) params.set("thread", "1");
    if (needs.userId) params.set("user_id", String(needs.userId));
    if (revision) params.set("since", revision);
    const query = params.toString();
    return query ? `${needs.url}?${query}` : needs.url;
}

function intervalFor(needs) {
    return needs.threads || needs.thread || needs.userId ? PAGE_MS : HEADER_MS;
}

function stopTimer() {
    if (timer) {
        window.clearInterval(timer);
        timer = null;
    }
}

function onVisibility() {
    if (!document.hidden) {
        tick();
    }
}

function bindVisibility() {
    if (visibilityBound) {
        return;
    }
    document.addEventListener("visibilitychange", onVisibility);
    visibilityBound = true;
}

function unbindVisibility() {
    if (!visibilityBound) {
        return;
    }
    document.removeEventListener("visibilitychange", onVisibility);
    visibilityBound = false;
}

function ensureTimer(needs) {
    stopTimer();
    if (!needs.url) {
        unbindVisibility();
        return;
    }
    bindVisibility();
    timer = window.setInterval(() => tick(), intervalFor(needs));
}

async function tick({ force = false } = {}) {
    const needs = collectNeeds();
    if (!needs.url || document.hidden) {
        return lastData;
    }

    const url = buildUrl(needs, force ? null : lastRevision);
    return inboxGet(url)
        .then((response) => {
            lastData = mergeData(lastData, response.data);
            lastRevision = response.data?.revision ?? lastRevision;
            emit(lastData);
            return lastData;
        })
        .catch(() => lastData);
}

function scheduleTick(force = false) {
    window.clearTimeout(debounce);
    debounce = window.setTimeout(() => {
        const needs = collectNeeds();
        if (!needs.url) {
            stopTimer();
            unbindVisibility();
            return;
        }
        ensureTimer(needs);
        tick({ force });
    }, 0);
}

export default function useInboxLive({
    url,
    enabled = true,
    preview = false,
    threads = false,
    thread = false,
    userId = null,
} = {}) {
    const [data, setData] = useState(lastData);
    const listenerRef = useRef(null);

    useEffect(() => {
        const listener = {
            url,
            enabled,
            preview,
            threads,
            thread,
            userId: userId ? String(userId) : null,
            notify: setData,
        };
        listenerRef.current = listener;
        listeners.add(listener);
        if (lastData) {
            setData(lastData);
        }
        if (enabled && url) {
            scheduleTick(Boolean(preview || threads || thread || userId));
        }
        return () => {
            listeners.delete(listener);
            listenerRef.current = null;
            if (listeners.size === 0) {
                stopTimer();
                unbindVisibility();
                window.clearTimeout(debounce);
            } else {
                scheduleTick(false);
            }
        };
    }, [url, enabled]);

    useEffect(() => {
        const listener = listenerRef.current;
        if (!listener) {
            return undefined;
        }
        listener.preview = preview;
        listener.threads = threads;
        listener.thread = thread;
        listener.userId = userId ? String(userId) : null;
        listener.url = url;
        listener.enabled = enabled;
        if (preview || threads || thread || userId) {
            scheduleTick(true);
        }
        return undefined;
    }, [preview, threads, thread, userId, url, enabled]);

    const refresh = useCallback(() => tick({ force: true }), []);

    return { data, refresh };
}
