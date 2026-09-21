import { useForm, usePage } from "@inertiajs/react";
import { useEffect, useMemo, useRef, useState } from "react";
import ConfirmDialog from "@/Components/ConfirmDialog";
import IconButton from "@/Components/IconButton";
import { colors } from "@/config/colors";
import useInboxLive from "@/hooks/useInboxLive";
import { inboxDelete } from "@/lib/inboxRequest";
import { useDateLocale, useT } from "@/i18n";

const EMOJI_GROUPS = [
    {
        id: "smileys",
        label: "Smileys",
        items: ["😀", "😁", "😂", "🤣", "😊", "😍", "🤩", "😘", "😎", "🤔", "😴", "😭", "😡", "🤯", "😅", "😇"],
    },
    {
        id: "gestes",
        label: "Gestes",
        items: ["👍", "👎", "👏", "🙏", "👌", "✌️", "🤝", "💪", "👋", "🙌", "❤️", "🧡", "💛", "💚", "💙", "💜"],
    },
    {
        id: "travail",
        label: "Travail",
        items: ["📌", "✅", "❗", "❓", "📅", "⏰", "💼", "📁", "📄", "📊", "📈", "💡", "🛠️", "🏠", "☕", "🎉"],
    },
];

function normalize(value) {
    return String(value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function formatWhen(value, locale) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

function formatSize(bytes) {
    if (!bytes) return "0 o";
    const units = ["o", "Ko", "Mo", "Go"];
    let index = 0;
    let value = bytes;
    while (value >= 1024 && index < units.length - 1) {
        value /= 1024;
        index += 1;
    }
    return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function messageText(message) {
    const names = (message.attachments || []).map((file) => file.name).join(" ");
    return `${message.body || ""} ${names}`;
}

export default function MessageThread({
    messages: initialMessages = [],
    me = "user",
    otherLabel = "RH",
    otherIcon = "/assets/icon/building.svg",
    storeUrl,
    liveUrl,
    liveUserId = null,
    liveThread = false,
    deleteUrl,
    clearUrl,
    emptyText,
}) {
    const t = useT();
    const dateLoc = useDateLocale();
    const resolvedEmpty = emptyText || t("messages.empty");
    const { errors } = usePage().props;
    const { data: live, refresh } = useInboxLive({
        url: liveUrl,
        enabled: Boolean(liveUrl),
        userId: liveUserId,
        thread: liveThread,
    });
    const liveMessages = Array.isArray(live?.messages) ? live.messages : null;
    const lastInitial = Number(initialMessages[initialMessages.length - 1]?.id || 0);
    const lastLive = Number(liveMessages?.[liveMessages.length - 1]?.id || 0);
    const [hiddenIds, setHiddenIds] = useState([]);
    const [pending, setPending] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [query, setQuery] = useState("");
    const source = liveMessages && lastLive >= lastInitial ? liveMessages : initialMessages;
    const messages = source.filter((message) => !hiddenIds.includes(message.id));
    const needle = normalize(query).trim();
    const visible = useMemo(() => {
        if (!needle) {
            return messages;
        }
        return messages.filter((message) => normalize(messageText(message)).includes(needle));
    }, [messages, needle]);
    const lastId = visible[visible.length - 1]?.id || 0;
    const { data, setData, post, processing, reset } = useForm({
        body: "",
        attachments: [],
    });
    const threadRef = useRef(null);
    const stickToBottom = useRef(true);
    const fileInput = useRef(null);
    const textareaRef = useRef(null);
    const pickerRef = useRef(null);
    const [emojiOpen, setEmojiOpen] = useState(false);
    const [emojiGroup, setEmojiGroup] = useState(EMOJI_GROUPS[0].id);
    const files = Array.from(data.attachments || []);
    const activeEmojis = EMOJI_GROUPS.find((group) => group.id === emojiGroup)?.items || EMOJI_GROUPS[0].items;

    const onThreadScroll = () => {
        const el = threadRef.current;
        if (!el) {
            return;
        }
        stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 72;
    };

    useEffect(() => {
        if (needle) {
            stickToBottom.current = false;
            return undefined;
        }
        if (!stickToBottom.current) {
            return undefined;
        }
        const el = threadRef.current;
        if (!el) {
            return undefined;
        }
        const frame = window.requestAnimationFrame(() => {
            el.scrollTop = el.scrollHeight;
        });
        return () => window.cancelAnimationFrame(frame);
    }, [lastId, visible.length, needle]);

    useEffect(() => {
        if (!emojiOpen) return undefined;
        const onPointer = (event) => {
            if (!pickerRef.current?.contains(event.target)) {
                setEmojiOpen(false);
            }
        };
        const onKey = (event) => {
            if (event.key === "Escape") setEmojiOpen(false);
        };
        document.addEventListener("mousedown", onPointer);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onPointer);
            document.removeEventListener("keydown", onKey);
        };
    }, [emojiOpen]);

    const canSend = data.body.trim() !== "" || files.length > 0;

    const submit = (e) => {
        e.preventDefault();
        if (!canSend) return;
        setQuery("");
        stickToBottom.current = true;
        post(storeUrl, {
            forceFormData: true,
            preserveScroll: true,
            preserveState: true,
            only: ["messages", "inbox", "errors"],
            onSuccess: () => {
                stickToBottom.current = true;
                reset("body", "attachments");
                if (fileInput.current) fileInput.current.value = "";
            },
        });
    };

    const addFiles = (event) => {
        const next = Array.from(event.target.files || []);
        setData("attachments", [...files, ...next].slice(0, 5));
        event.target.value = "";
    };

    const removeFile = (index) => {
        setData("attachments", files.filter((_, i) => i !== index));
    };

    const insertEmoji = (emoji) => {
        const field = textareaRef.current;
        const current = data.body || "";
        if (!field) {
            setData("body", current + emoji);
            return;
        }
        const start = field.selectionStart ?? current.length;
        const end = field.selectionEnd ?? current.length;
        const next = current.slice(0, start) + emoji + current.slice(end);
        setData("body", next);
        const cursor = start + emoji.length;
        requestAnimationFrame(() => {
            field.focus();
            field.setSelectionRange(cursor, cursor);
        });
    };

    const runDelete = async () => {
        if (!pending?.url) return;
        setDeleting(true);
        try {
            await inboxDelete(pending.url);
            if (pending.type === "one") {
                setHiddenIds((current) => [...current, pending.id]);
            } else {
                setHiddenIds(source.map((message) => message.id));
            }
            setPending(null);
            await refresh();
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="app-msg-card" style={styles.card}>
            <div style={styles.toolbar}>
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("messages.search")}
                    style={styles.search}
                />
                {needle ? (
                    <span style={styles.searchMeta}>
                        {t(visible.length > 1 ? "messages.results_plural" : "messages.results", { count: visible.length })}
                    </span>
                ) : null}
                {clearUrl && messages.length > 0 && (
                    <button
                        type="button"
                        style={styles.clearBtn}
                        onClick={() => setPending({
                            type: "all",
                            url: clearUrl,
                            title: t("messages.clearTitle"),
                            message: t("messages.clearBody"),
                        })}
                    >
                        {t("messages.clear")}
                    </button>
                )}
            </div>
            <div ref={threadRef} className="app-msg-thread" style={styles.thread} onScroll={onThreadScroll}>
                {visible.length === 0 ? (
                    <p style={styles.empty}>{needle ? t("messages.noneMatch") : resolvedEmpty}</p>
                ) : (
                    visible.map((message) => {
                        const mine = message.author === me;
                        const photo = !mine && String(otherIcon).includes("/storage/");
                        return (
                            <div
                                key={message.id}
                                className="app-msg-row"
                                style={{
                                    ...styles.row,
                                    flexDirection: mine ? "row-reverse" : "row",
                                }}
                            >
                                {!mine ? (
                                    <img
                                        src={otherIcon}
                                        alt=""
                                        style={{
                                            ...styles.avatar,
                                            padding: photo ? "0" : "6px",
                                            objectFit: "cover",
                                        }}
                                    />
                                ) : (
                                    <span style={styles.avatarSpacer} />
                                )}
                                <div
                                    style={{
                                        ...styles.bubble,
                                        background: mine ? "var(--color-primary)" : "#f4f6fb",
                                        color: mine ? "white" : colors.dark,
                                        borderBottomRightRadius: mine ? "4px" : "16px",
                                        borderBottomLeftRadius: mine ? "16px" : "4px",
                                    }}
                                >
                                    {message.body ? <p style={styles.bubbleBody}>{message.body}</p> : null}
                                    {(message.attachments || []).length > 0 && (
                                        <div style={styles.files}>
                                            {message.attachments.map((file) => (
                                                <a
                                                    key={file.url}
                                                    href={file.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    style={{
                                                        ...styles.fileChip,
                                                        background: mine ? "rgba(255,255,255,0.16)" : "white",
                                                        color: "inherit",
                                                    }}
                                                >
                                                    {file.preview ? (
                                                        <img src={file.url} alt="" style={styles.thumb} />
                                                    ) : (
                                                        <img
                                                            src="/assets/icon/box.svg"
                                                            alt=""
                                                            style={{
                                                                ...styles.fileIcon,
                                                                filter: mine ? "invert(1)" : "none",
                                                            }}
                                                        />
                                                    )}
                                                    <span style={styles.fileName}>{file.name}</span>
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                    <p style={styles.bubbleWhen}>{formatWhen(message.at, dateLoc)}</p>
                                </div>
                                {deleteUrl && (
                                    <span className="app-msg-delete">
                                        <IconButton
                                            icon="close"
                                            label={t("messages.deleteMessage")}
                                            variant="ghost"
                                            size={24}
                                            iconSize={12}
                                            onClick={() => setPending({
                                                type: "one",
                                                id: message.id,
                                                url: deleteUrl(message.id),
                                                title: t("messages.deleteMessageTitle"),
                                                message: t("messages.deleteMessageBody"),
                                            })}
                                        />
                                    </span>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
            {errors?.body && <p style={styles.error}>{errors.body}</p>}
            {errors?.attachments && <p style={styles.error}>{errors.attachments}</p>}
            {files.length > 0 && (
                <div style={styles.pending}>
                    {files.map((file, index) => (
                        <span key={`${file.name}-${index}`} style={styles.pendingChip}>
                            {file.name} · {formatSize(file.size)}
                            <IconButton
                                icon="close"
                                label={t("messages.removeFile")}
                                variant="ghost"
                                size={22}
                                iconSize={12}
                                onClick={() => removeFile(index)}
                            />
                        </span>
                    ))}
                </div>
            )}
            <form onSubmit={submit} style={styles.form}>
                <div ref={pickerRef} style={styles.tools}>
                    <button
                        type="button"
                        style={styles.iconBtn}
                        title={t("messages.attach")}
                        aria-label={t("messages.attach")}
                        onClick={() => {
                            setEmojiOpen(false);
                            fileInput.current?.click();
                        }}
                    >
                        <img src="/assets/icon/paperclip.svg" alt="" style={styles.icon} />
                    </button>
                    <button
                        type="button"
                        style={{
                            ...styles.iconBtn,
                            borderColor: emojiOpen ? "var(--color-primary)" : colors.border,
                        }}
                        title={t("messages.emojis")}
                        aria-label={t("messages.emojis")}
                        aria-expanded={emojiOpen}
                        onClick={() => setEmojiOpen((open) => !open)}
                    >
                        <img src="/assets/icon/emoji.svg" alt="" style={styles.icon} />
                    </button>
                    {emojiOpen && (
                        <div style={styles.picker} role="listbox" aria-label={t("messages.chooseEmoji")}>
                            <div style={styles.pickerTabs}>
                                {EMOJI_GROUPS.map((group) => (
                                    <button
                                        key={group.id}
                                        type="button"
                                        style={{
                                            ...styles.pickerTab,
                                            color: group.id === emojiGroup ? "var(--color-primary)" : colors.muted,
                                            borderBottomColor: group.id === emojiGroup ? "var(--color-primary)" : "transparent",
                                        }}
                                        onClick={() => setEmojiGroup(group.id)}
                                    >
                                        {t(`messages.${group.id === "gestes" ? "gestures" : group.id === "travail" ? "work" : "smileys"}`)}
                                    </button>
                                ))}
                            </div>
                            <div style={styles.pickerGrid}>
                                {activeEmojis.map((emoji) => (
                                    <button
                                        key={emoji}
                                        type="button"
                                        style={styles.emojiBtn}
                                        onClick={() => insertEmoji(emoji)}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <input
                    ref={fileInput}
                    type="file"
                    hidden
                    multiple
                    accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip"
                    onChange={addFiles}
                />
                <textarea
                    ref={textareaRef}
                    value={data.body}
                    onChange={(e) => setData("body", e.target.value)}
                    placeholder={t("messages.placeholder")}
                    rows={1}
                    style={styles.textarea}
                    onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault();
                            if (canSend && !processing) {
                                event.currentTarget.form?.requestSubmit();
                            }
                        }
                    }}
                />
                <button type="submit" disabled={processing || !canSend} style={styles.send} title={t("messages.send")} aria-label={t("messages.send")}>
                    <img src="/assets/icon/send.svg" alt="" style={styles.sendIcon} />
                </button>
            </form>
            <ConfirmDialog
                show={!!pending}
                title={pending?.title}
                message={pending?.message}
                processing={deleting}
                onConfirm={runDelete}
                onClose={() => !deleting && setPending(null)}
            />
        </div>
    );
}

const styles = {
    card: {
        background: "white",
        borderRadius: "12px",
        border: `1px solid ${colors.border}`,
        padding: "12px 12px 12px",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
    },
    toolbar: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "0 4px 10px",
        borderBottom: `1px solid ${colors.border}`,
        flexShrink: 0,
    },
    search: {
        flex: 1,
        minWidth: 0,
        border: `1px solid ${colors.border}`,
        borderRadius: "8px",
        padding: "8px 10px",
        fontSize: "13px",
        boxSizing: "border-box",
        fontFamily: "inherit",
    },
    searchMeta: { fontSize: "12px", color: colors.muted, whiteSpace: "nowrap", flexShrink: 0 },
    thread: { flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto", padding: "12px 4px" },
    clearBtn: { border: "none", background: "transparent", color: colors.error, fontSize: "13px", fontWeight: 600, cursor: "pointer", padding: "4px 2px", flexShrink: 0 },
    empty: { margin: "auto", color: colors.muted, fontSize: "14px" },
    row: { display: "flex", alignItems: "flex-end", gap: "8px", maxWidth: "100%" },
    avatar: { width: "32px", height: "32px", borderRadius: "50%", padding: "6px", boxSizing: "border-box", flexShrink: 0, background: "#edf2f7" },
    avatarSpacer: { width: "32px", flexShrink: 0 },
    bubble: { maxWidth: "min(520px, 78%)", borderRadius: "16px", padding: "8px 12px 6px" },
    bubbleBody: { margin: 0, fontSize: "15px", lineHeight: 1.45, whiteSpace: "pre-wrap", fontFamily: 'system-ui, "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif' },
    bubbleWhen: { margin: "4px 0 0", fontSize: "11px", opacity: 0.65 },
    files: { display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" },
    fileChip: { display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", borderRadius: "8px", padding: "6px", fontSize: "12px", fontWeight: 600 },
    fileIcon: { width: "18px", height: "18px", flexShrink: 0 },
    thumb: { width: "72px", height: "52px", objectFit: "cover", borderRadius: "6px", flexShrink: 0 },
    fileName: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
    error: { color: colors.error, fontSize: "13px", margin: "0 0 8px" },
    pending: { display: "flex", flexWrap: "wrap", gap: "6px", margin: "0 0 8px" },
    pendingChip: { display: "inline-flex", alignItems: "center", gap: "6px", background: "#edf2f7", borderRadius: "999px", padding: "4px 8px", fontSize: "12px", color: colors.dark },
    form: { display: "flex", gap: "8px", alignItems: "flex-end", borderTop: `1px solid ${colors.border}`, paddingTop: "10px", position: "relative", flexShrink: 0 },
    tools: { display: "flex", gap: "6px", position: "relative", flexShrink: 0 },
    picker: { position: "absolute", left: 0, bottom: "50px", width: "min(280px, calc(100vw - 96px))", background: "white", border: `1px solid ${colors.border}`, borderRadius: "12px", boxShadow: "0 10px 30px rgba(15, 23, 42, 0.12)", padding: "8px", zIndex: 5 },
    pickerTabs: { display: "flex", gap: "4px", marginBottom: "8px" },
    pickerTab: { flex: 1, border: "none", background: "transparent", padding: "6px 4px", fontSize: "12px", fontWeight: 700, cursor: "pointer", borderBottom: "2px solid transparent" },
    pickerGrid: { display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: "2px" },
    emojiBtn: { border: "none", background: "transparent", fontSize: "20px", lineHeight: 1.3, cursor: "pointer", borderRadius: "8px", padding: "4px" },
    iconBtn: { width: "40px", height: "40px", border: `1px solid ${colors.border}`, background: "white", borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 0 },
    icon: { width: "18px", height: "18px" },
    textarea: { flex: 1, border: `1px solid ${colors.border}`, borderRadius: "10px", padding: "10px 12px", fontSize: "15px", fontFamily: 'system-ui, "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif', resize: "none", minHeight: "40px", maxHeight: "120px", lineHeight: 1.4 },
    send: { width: "40px", height: "40px", border: "none", background: "var(--color-primary)", borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 0 },
    sendIcon: { width: "18px", height: "18px", filter: "invert(1)" },
};
