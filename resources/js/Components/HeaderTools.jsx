import { Link, router, usePage } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";
import ConfirmDialog from "@/Components/ConfirmDialog";
import IconButton from "@/Components/IconButton";
import LanguageSwitcher from "@/Components/LanguageSwitcher";
import { colors } from "@/config/colors";
import useInboxLive from "@/hooks/useInboxLive";
import { inboxDelete } from "@/lib/inboxRequest";
import { useDateLocale, useT } from "@/i18n";

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

export default function HeaderTools({ children }) {
    const t = useT();
    const dateLoc = useDateLocale();
    const { inbox: pageInbox } = usePage().props;
    const isAdmin = pageInbox?.role === "admin";
    const liveUrl = pageInbox?.role
        ? (isAdmin ? route("admin.messages.live") : route("messages.live"))
        : null;
    const [open, setOpen] = useState(null);
    const [pending, setPending] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const wrapRef = useRef(null);
    const preview = open === "messages" || open === "notifications";
    const { data: live, refresh } = useInboxLive({
        url: liveUrl,
        enabled: Boolean(liveUrl),
        preview,
    });
    const inbox = {
        ...(pageInbox || {}),
        ...(live?.inbox || {}),
        messages: live?.inbox?.messages ?? pageInbox?.messages ?? [],
        notifications: live?.inbox?.notifications ?? pageInbox?.notifications ?? [],
    };
    const messages = inbox?.messages || [];
    const notifications = inbox?.notifications || [];
    const unreadMessages = inbox?.unread_messages || 0;
    const unreadNotifications = inbox?.unread_notifications || 0;
    const messagesUrl = inbox?.messages_url;
    const readRoute = isAdmin ? "admin.notifications.read" : "notifications.read";
    const readAllRoute = isAdmin ? "admin.notifications.read-all" : "notifications.read-all";
    const destroyRoute = isAdmin ? "admin.notifications.destroy" : "notifications.destroy";
    const destroyAllRoute = isAdmin ? "admin.notifications.destroy-all" : "notifications.destroy-all";
    const destroyMessageRoute = isAdmin ? "admin.messages.destroy" : "messages.destroy";

    const runDelete = async () => {
        if (!pending) return;
        setDeleting(true);
        try {
            await inboxDelete(pending.url);
            setPending(null);
            await refresh();
        } finally {
            setDeleting(false);
        }
    };

    useEffect(() => {
        const onClick = (event) => {
            if (wrapRef.current && !wrapRef.current.contains(event.target)) {
                setOpen(null);
            }
        };
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, []);

    const toggle = (panel) => {
        setOpen((current) => (current === panel ? null : panel));
    };

    const openNotification = (item) => {
        setOpen(null);
        if (item.unread) {
            router.post(route(readRoute, { id: item.id, to: item.href || undefined }));
            return;
        }
        if (item.href) {
            router.visit(item.href);
        }
    };

    return (
        <div className="app-header-tools" ref={wrapRef} style={styles.wrap}>
            {children}
            <LanguageSwitcher />
            <div style={styles.iconWrap}>
                <button
                    type="button"
                    style={styles.iconBtn}
                    aria-label={t("header.messages")}
                    title={t("header.messages")}
                    onClick={() => toggle("messages")}
                >
                    <img src="/assets/icon/message.svg" alt="" style={styles.icon} />
                    {unreadMessages > 0 && <span style={styles.badge}>{unreadMessages > 9 ? "9+" : unreadMessages}</span>}
                </button>
                {open === "messages" && (
                    <div style={styles.panel}>
                        <div style={styles.panelHead}>
                            <p style={styles.panelTitle}>{t("header.messages")}</p>
                            {messagesUrl && (
                                <Link href={messagesUrl} style={styles.panelLink} onClick={() => setOpen(null)}>
                                    {t("header.open")}
                                </Link>
                            )}
                        </div>
                        {messages.length === 0 ? (
                            <p style={styles.panelEmpty}>{t("header.noMessages")}</p>
                        ) : (
                            messages.map((item) => (
                                <div key={item.id} style={styles.itemRow}>
                                    <Link
                                        href={item.href}
                                        style={{ ...styles.item, fontWeight: item.unread ? 700 : 500 }}
                                        onClick={() => setOpen(null)}
                                    >
                                        <span style={styles.itemFrom}>{item.from}</span>
                                        <span style={styles.itemPreview}>{item.preview}</span>
                                        <span style={styles.itemWhen}>{formatWhen(item.at, dateLoc)}</span>
                                    </Link>
                                    <IconButton
                                        icon="close"
                                        label={t("header.deleteMessage")}
                                        variant="ghost"
                                        size={28}
                                        iconSize={14}
                                        style={styles.deleteBtn}
                                        onClick={() => setPending({
                                            title: t("header.deleteMessageTitle"),
                                            message: t("header.deleteMessageBody"),
                                            url: route(destroyMessageRoute, item.id),
                                        })}
                                    />
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
            <div style={styles.iconWrap}>
                <button
                    type="button"
                    style={styles.iconBtn}
                    aria-label={t("header.notifications")}
                    title={t("header.notifications")}
                    onClick={() => toggle("notifications")}
                >
                    <img src="/assets/icon/notifications.svg" alt="" style={styles.icon} />
                    {unreadNotifications > 0 && (
                        <span style={styles.badge}>{unreadNotifications > 9 ? "9+" : unreadNotifications}</span>
                    )}
                </button>
                {open === "notifications" && (
                    <div style={styles.panel}>
                        <div style={styles.panelHead}>
                            <p style={styles.panelTitle}>{t("header.notifications")}</p>
                            <div style={styles.panelActions}>
                                {unreadNotifications > 0 && (
                                    <button
                                        type="button"
                                        style={styles.panelLinkBtn}
                                        onClick={() => router.post(route(readAllRoute), {}, { preserveScroll: true })}
                                    >
                                        {t("header.markAllRead")}
                                    </button>
                                )}
                                {notifications.length > 0 && (
                                    <IconButton
                                        icon="close"
                                        label={t("header.deleteAll")}
                                        variant="ghost"
                                        size={28}
                                        iconSize={14}
                                        style={styles.deleteBtn}
                                        onClick={() => setPending({
                                            title: t("header.deleteAllTitle"),
                                            message: t("header.deleteAllBody"),
                                            url: route(destroyAllRoute),
                                        })}
                                    />
                                )}
                            </div>
                        </div>
                        {notifications.length === 0 ? (
                            <p style={styles.panelEmpty}>{t("header.noNotifications")}</p>
                        ) : (
                            notifications.map((item) => (
                                <div key={item.id} style={styles.itemRow}>
                                    <button
                                        type="button"
                                        style={{ ...styles.itemBtn, fontWeight: item.unread ? 700 : 500 }}
                                        onClick={() => openNotification(item)}
                                    >
                                        <span style={styles.itemFrom}>{item.title}</span>
                                        {item.preview && <span style={styles.itemPreview}>{item.preview}</span>}
                                        <span style={styles.itemWhen}>{formatWhen(item.at, dateLoc)}</span>
                                    </button>
                                    <IconButton
                                        icon="close"
                                        label={t("header.deleteNotification")}
                                        variant="ghost"
                                        size={28}
                                        iconSize={14}
                                        style={styles.deleteBtn}
                                        onClick={() => setPending({
                                            title: t("header.deleteNotificationTitle"),
                                            message: t("header.deleteNotificationBody"),
                                            url: route(destroyRoute, item.id),
                                        })}
                                    />
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
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
    wrap: {
        marginLeft: "auto",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        flexShrink: 0,
        position: "relative",
    },
    iconWrap: {
        position: "relative",
    },
    iconBtn: {
        width: "40px",
        height: "40px",
        border: `1px solid ${colors.border}`,
        background: colors.surface,
        borderRadius: "10px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        position: "relative",
    },
    icon: {
        width: "20px",
        height: "20px",
    },
    badge: {
        position: "absolute",
        top: "-4px",
        right: "-4px",
        minWidth: "18px",
        height: "18px",
        padding: "0 4px",
        borderRadius: "999px",
        background: colors.error,
        color: "white",
        fontSize: "10px",
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 1,
    },
    panel: {
        position: "absolute",
        top: "48px",
        right: 0,
        width: "min(320px, calc(100vw - 48px))",
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: "12px",
        boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
        padding: "20px 0 14px 14px",
        zIndex: 40,
        maxHeight: "70vh",
        overflow: "auto",
    },
    panelHead: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "8px",
        marginBottom: "10px",
        paddingRight: "16px",
    },
    panelActions: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        flexShrink: 0,
    },
    panelTitle: {
        margin: 0,
        fontSize: "13px",
        fontWeight: 700,
        color: colors.dark,
    },
    panelLink: {
        fontSize: "12px",
        fontWeight: 600,
        color: "var(--color-primary)",
        textDecoration: "none",
    },
    panelLinkBtn: {
        border: "none",
        background: "none",
        padding: 0,
        cursor: "pointer",
        fontSize: "12px",
        fontWeight: 600,
        color: "var(--color-primary)",
    },
    panelDangerBtn: {
        border: "none",
        background: "none",
        padding: 0,
        cursor: "pointer",
        fontSize: "12px",
        fontWeight: 600,
        color: colors.error,
    },
    itemRow: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        borderTop: `1px solid ${colors.border}`,
        paddingRight: "16px",
    },
    deleteBtn: {
        marginRight: "4px",
        flexShrink: 0,
    },
    panelEmpty: {
        margin: 0,
        fontSize: "13px",
        color: colors.muted,
        paddingRight: "16px",
    },
    item: {
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        flex: 1,
        minWidth: 0,
        padding: "8px 0",
        textDecoration: "none",
        color: colors.dark,
    },
    itemBtn: {
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        flex: 1,
        minWidth: 0,
        padding: "8px 0",
        border: "none",
        background: "transparent",
        textAlign: "left",
        cursor: "pointer",
        color: colors.dark,
    },
    itemFrom: {
        fontSize: "13px",
    },
    itemPreview: {
        fontSize: "12px",
        color: colors.muted,
        fontWeight: 400,
    },
    itemWhen: {
        fontSize: "11px",
        color: colors.muted,
        fontWeight: 400,
    },
};
