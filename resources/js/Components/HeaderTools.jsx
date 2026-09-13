import { Link, router, useForm, usePage } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";
import { colors } from "@/config/colors";

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

export default function HeaderTools({ children }) {
    const { inbox } = usePage().props;
    const [open, setOpen] = useState(null);
    const wrapRef = useRef(null);
    const isAdmin = inbox?.role === "admin";
    const messages = inbox?.messages || [];
    const notifications = inbox?.notifications || [];
    const unreadMessages = inbox?.unread_messages || 0;
    const unreadNotifications = inbox?.unread_notifications || 0;
    const messagesUrl = inbox?.messages_url;
    const readRoute = isAdmin ? "admin.notifications.read" : "notifications.read";
    const readAllRoute = isAdmin ? "admin.notifications.read-all" : "notifications.read-all";

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
            <div style={styles.iconWrap}>
                <button
                    type="button"
                    style={styles.iconBtn}
                    aria-label="Messages"
                    title="Messages"
                    onClick={() => toggle("messages")}
                >
                    <img src="/assets/icon/message.svg" alt="" style={styles.icon} />
                    {unreadMessages > 0 && <span style={styles.badge}>{unreadMessages > 9 ? "9+" : unreadMessages}</span>}
                </button>
                {open === "messages" && (
                    <div style={styles.panel}>
                        <div style={styles.panelHead}>
                            <p style={styles.panelTitle}>Messages</p>
                            {messagesUrl && (
                                <Link href={messagesUrl} style={styles.panelLink} onClick={() => setOpen(null)}>
                                    Ouvrir
                                </Link>
                            )}
                        </div>
                        {messages.length === 0 ? (
                            <p style={styles.panelEmpty}>Aucun message pour le moment.</p>
                        ) : (
                            messages.map((item) => (
                                <Link
                                    key={item.id}
                                    href={item.href}
                                    style={{ ...styles.item, fontWeight: item.unread ? 700 : 500 }}
                                    onClick={() => setOpen(null)}
                                >
                                    <span style={styles.itemFrom}>{item.from}</span>
                                    <span style={styles.itemPreview}>{item.preview}</span>
                                    <span style={styles.itemWhen}>{formatWhen(item.at)}</span>
                                </Link>
                            ))
                        )}
                    </div>
                )}
            </div>
            <div style={styles.iconWrap}>
                <button
                    type="button"
                    style={styles.iconBtn}
                    aria-label="Notifications"
                    title="Notifications"
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
                            <p style={styles.panelTitle}>Notifications</p>
                            {unreadNotifications > 0 && (
                                <button
                                    type="button"
                                    style={styles.panelLinkBtn}
                                    onClick={() => router.post(route(readAllRoute), {}, { preserveScroll: true })}
                                >
                                    Tout lu
                                </button>
                            )}
                        </div>
                        {notifications.length === 0 ? (
                            <p style={styles.panelEmpty}>Aucune notification pour le moment.</p>
                        ) : (
                            notifications.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    style={{ ...styles.itemBtn, fontWeight: item.unread ? 700 : 500 }}
                                    onClick={() => openNotification(item)}
                                >
                                    <span style={styles.itemFrom}>{item.title}</span>
                                    {item.preview && <span style={styles.itemPreview}>{item.preview}</span>}
                                    <span style={styles.itemWhen}>{formatWhen(item.at)}</span>
                                </button>
                            ))
                        )}
                    </div>
                )}
            </div>
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
        padding: "12px 14px",
        zIndex: 40,
        maxHeight: "70vh",
        overflow: "auto",
    },
    panelHead: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "8px",
        marginBottom: "8px",
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
    panelEmpty: {
        margin: 0,
        fontSize: "13px",
        color: colors.muted,
    },
    item: {
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        padding: "8px 0",
        borderTop: `1px solid ${colors.border}`,
        textDecoration: "none",
        color: colors.dark,
    },
    itemBtn: {
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        width: "100%",
        padding: "8px 0",
        border: "none",
        borderTop: `1px solid ${colors.border}`,
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
