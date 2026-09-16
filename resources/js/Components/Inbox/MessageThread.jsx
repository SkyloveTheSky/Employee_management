import { useForm, usePage } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";
import ConfirmDialog from "@/Components/ConfirmDialog";
import { colors } from "@/config/colors";
import useInboxLive from "@/hooks/useInboxLive";
import { inboxDelete } from "@/lib/inboxRequest";

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

function formatWhen(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("fr-FR", {
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

export default function MessageThread({
    messages: initialMessages = [],
    me = "user",
    otherLabel = "RH",
    otherIcon = "/assets/icon/building.svg",
    storeUrl,
    pollUrl,
    deleteUrl,
    clearUrl,
    emptyText = "Aucun message.",
}) {
    const { errors } = usePage().props;
    const { data: live, refresh } = useInboxLive(pollUrl, { enabled: Boolean(pollUrl) });
    const liveMessages = Array.isArray(live?.messages) ? live.messages : null;
    const lastInitial = Number(initialMessages[initialMessages.length - 1]?.id || 0);
    const lastLive = Number(liveMessages?.[liveMessages.length - 1]?.id || 0);
    const [hiddenIds, setHiddenIds] = useState([]);
    const [pending, setPending] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const source = liveMessages && lastLive >= lastInitial ? liveMessages : initialMessages;
    const messages = source.filter((message) => !hiddenIds.includes(message.id));
    const { data, setData, post, processing, reset } = useForm({
        body: "",
        attachments: [],
    });
    const bottomRef = useRef(null);
    const fileInput = useRef(null);
    const textareaRef = useRef(null);
    const pickerRef = useRef(null);
    const [emojiOpen, setEmojiOpen] = useState(false);
    const [emojiGroup, setEmojiGroup] = useState(EMOJI_GROUPS[0].id);
    const files = Array.from(data.attachments || []);
    const activeEmojis = EMOJI_GROUPS.find((group) => group.id === emojiGroup)?.items || EMOJI_GROUPS[0].items;

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

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
        post(storeUrl, {
            forceFormData: true,
            preserveScroll: true,
            preserveState: true,
            only: ["messages", "inbox", "errors"],
            onSuccess: () => {
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
        <div style={styles.card}>
            {clearUrl && messages.length > 0 && (
                <div style={styles.threadTools}>
                    <button
                        type="button"
                        style={styles.clearBtn}
                        onClick={() => setPending({
                            type: "all",
                            url: clearUrl,
                            title: "Vider la conversation ?",
                            message: "Tous les messages de cette conversation seront supprimés.",
                        })}
                    >
                        Vider la conversation
                    </button>
                </div>
            )}
            <div style={styles.thread}>
                {messages.length === 0 ? (
                    <p style={styles.empty}>{emptyText}</p>
                ) : (
                    messages.map((message) => {
                        const mine = message.author === me;
                        return (
                            <div
                                key={message.id}
                                style={{
                                    ...styles.row,
                                    flexDirection: mine ? "row-reverse" : "row",
                                }}
                            >
                                <img
                                    src={mine ? "/assets/icon/user.svg" : otherIcon}
                                    alt=""
                                    style={{
                                        ...styles.avatar,
                                        padding: mine || !String(otherIcon).includes("/storage/") ? "6px" : "0",
                                        objectFit: "cover",
                                        filter: mine ? "invert(1)" : "none",
                                        background: mine ? "var(--color-primary)" : "#edf2f7",
                                    }}
                                />
                                <div
                                    style={{
                                        ...styles.bubble,
                                        background: mine ? "var(--color-primary)" : "#f7fafc",
                                        color: mine ? "white" : colors.dark,
                                    }}
                                >
                                    <p style={{ ...styles.bubbleAuthor, display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "center" }}>
                                        <span>{mine ? "Vous" : otherLabel}</span>
                                        {deleteUrl && (
                                            <button
                                                type="button"
                                                style={{
                                                    ...styles.bubbleDelete,
                                                    color: mine ? "rgba(255,255,255,0.85)" : colors.muted,
                                                }}
                                                title="Supprimer"
                                                aria-label="Supprimer ce message"
                                                onClick={() => setPending({
                                                    type: "one",
                                                    id: message.id,
                                                    url: deleteUrl(message.id),
                                                    title: "Supprimer ce message ?",
                                                    message: "Le message sera retiré définitivement.",
                                                })}
                                            >
                                                ×
                                            </button>
                                        )}
                                    </p>
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
                                    <p style={styles.bubbleWhen}>{formatWhen(message.at)}</p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={bottomRef} />
            </div>
            {errors?.body && <p style={styles.error}>{errors.body}</p>}
            {errors?.attachments && <p style={styles.error}>{errors.attachments}</p>}
            {files.length > 0 && (
                <div style={styles.pending}>
                    {files.map((file, index) => (
                        <span key={`${file.name}-${index}`} style={styles.pendingChip}>
                            {file.name} · {formatSize(file.size)}
                            <button type="button" style={styles.pendingRemove} onClick={() => removeFile(index)}>
                                ×
                            </button>
                        </span>
                    ))}
                </div>
            )}
            <form onSubmit={submit} style={styles.form}>
                <div ref={pickerRef} style={styles.tools}>
                    <button
                        type="button"
                        style={styles.iconBtn}
                        title="Joindre un fichier"
                        aria-label="Joindre un fichier"
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
                        title="Emojis"
                        aria-label="Emojis"
                        aria-expanded={emojiOpen}
                        onClick={() => setEmojiOpen((open) => !open)}
                    >
                        <img src="/assets/icon/emoji.svg" alt="" style={styles.icon} />
                    </button>
                    {emojiOpen && (
                        <div style={styles.picker} role="listbox" aria-label="Choisir un emoji">
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
                                        {group.label}
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
                    placeholder="Votre message…"
                    rows={3}
                    style={styles.textarea}
                />
                <button type="submit" disabled={processing || !canSend} style={styles.send} title="Envoyer" aria-label="Envoyer">
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
    card: { background: "white", borderRadius: "12px", border: `1px solid ${colors.border}`, padding: "16px", display: "flex", flexDirection: "column", minHeight: "60vh" },
    thread: { flex: 1, display: "flex", flexDirection: "column", gap: "12px", overflow: "auto", padding: "8px 4px 16px" },
    threadTools: { display: "flex", justifyContent: "flex-end", marginBottom: "8px" },
    clearBtn: { border: "none", background: "transparent", color: colors.error, fontSize: "12px", fontWeight: 600, cursor: "pointer", padding: 0 },
    bubbleDelete: { border: "none", background: "transparent", cursor: "pointer", fontSize: "16px", lineHeight: 1, padding: 0 },
    empty: { margin: "auto", color: colors.muted, fontSize: "14px" },
    row: { display: "flex", alignItems: "flex-end", gap: "8px", maxWidth: "100%" },
    avatar: { width: "32px", height: "32px", borderRadius: "50%", padding: "6px", boxSizing: "border-box", flexShrink: 0 },
    bubble: { maxWidth: "min(520px, 82%)", borderRadius: "12px", padding: "10px 12px" },
    bubbleAuthor: { margin: 0, fontSize: "11px", fontWeight: 700, opacity: 0.8 },
    bubbleBody: { margin: "4px 0", fontSize: "15px", lineHeight: 1.45, whiteSpace: "pre-wrap", fontFamily: 'system-ui, "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif' },
    bubbleWhen: { margin: "6px 0 0", fontSize: "11px", opacity: 0.7 },
    files: { display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" },
    fileChip: { display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", borderRadius: "8px", padding: "6px", fontSize: "12px", fontWeight: 600 },
    fileIcon: { width: "18px", height: "18px", flexShrink: 0 },
    thumb: { width: "72px", height: "52px", objectFit: "cover", borderRadius: "6px", flexShrink: 0 },
    fileName: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
    error: { color: colors.error, fontSize: "13px", margin: "0 0 8px" },
    pending: { display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" },
    pendingChip: { display: "inline-flex", alignItems: "center", gap: "6px", background: "#edf2f7", borderRadius: "999px", padding: "4px 8px", fontSize: "12px", color: colors.dark },
    pendingRemove: { border: "none", background: "transparent", cursor: "pointer", fontSize: "16px", lineHeight: 1, padding: 0 },
    form: { display: "flex", gap: "8px", alignItems: "flex-end", borderTop: `1px solid ${colors.border}`, paddingTop: "12px", position: "relative" },
    tools: { display: "flex", gap: "6px", position: "relative", flexShrink: 0 },
    picker: { position: "absolute", left: 0, bottom: "50px", width: "min(280px, calc(100vw - 96px))", background: "white", border: `1px solid ${colors.border}`, borderRadius: "12px", boxShadow: "0 10px 30px rgba(15, 23, 42, 0.12)", padding: "8px", zIndex: 5 },
    pickerTabs: { display: "flex", gap: "4px", marginBottom: "8px" },
    pickerTab: { flex: 1, border: "none", background: "transparent", padding: "6px 4px", fontSize: "12px", fontWeight: 700, cursor: "pointer", borderBottom: "2px solid transparent" },
    pickerGrid: { display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: "2px" },
    emojiBtn: { border: "none", background: "transparent", fontSize: "20px", lineHeight: 1.3, cursor: "pointer", borderRadius: "8px", padding: "4px" },
    iconBtn: { width: "42px", height: "42px", border: `1px solid ${colors.border}`, background: "white", borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 0 },
    icon: { width: "20px", height: "20px" },
    textarea: { flex: 1, border: `1px solid ${colors.border}`, borderRadius: "10px", padding: "10px 12px", fontSize: "15px", fontFamily: 'system-ui, "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif', resize: "vertical" },
    send: { width: "42px", height: "42px", border: "none", background: "var(--color-primary)", borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 0 },
    sendIcon: { width: "18px", height: "18px", filter: "invert(1)" },
};
