import { Head, Link } from "@inertiajs/react";
import { useMemo, useState } from "react";
import BrandMark from "@/Components/BrandMark";
import ConfirmDialog from "@/Components/ConfirmDialog";
import HeaderTools from "@/Components/HeaderTools";
import IconButton from "@/Components/IconButton";
import Sidebar from "@/Components/Admin/Sidebar";
import { colors } from "@/config/colors";
import useInboxLive from "@/hooks/useInboxLive";
import { useSidebar } from "@/hooks/useSidebar";
import { inboxDelete } from "@/lib/inboxRequest";
import { useDateLocale, useT } from "@/i18n";

function normalize(value) {
    return String(value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function formatWhen(value, dateLoc, emptyLabel) {
    if (!value) return emptyLabel;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat(dateLoc, {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

export default function Index({ admin, threads: initialThreads = [] }) {
    const t = useT();
    const dateLoc = useDateLocale();
    const { isOpen, setIsOpen, offset } = useSidebar();
    const { data: live, refresh } = useInboxLive({
        url: route("admin.messages.live"),
        threads: true,
    });
    const threads = Array.isArray(live?.threads) ? live.threads : initialThreads;
    const [query, setQuery] = useState("");
    const [pending, setPending] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const needle = normalize(query).trim();
    const visible = useMemo(() => {
        if (!needle) {
            return threads;
        }
        return threads.filter((thread) => normalize(
            `${thread.name || ""} ${thread.position || ""} ${thread.last_body || ""}`
        ).includes(needle));
    }, [threads, needle]);

    const runDelete = async () => {
        if (!pending) return;
        setDeleting(true);
        try {
            await inboxDelete(route("admin.messages.destroy-thread", pending.id));
            setPending(null);
            await refresh();
        } finally {
            setDeleting(false);
        }
    };

    return (
        <>
            <Head title={t("admin.messages.title")} />
            <Sidebar admin={admin} currentPage="admin.messages.index" isOpen={isOpen} setIsOpen={setIsOpen} />
            <div className="app-page" style={{ ...styles.page, marginLeft: offset }}>
                <div className="app-header" style={styles.header}>
                    <BrandMark />
                    <div>
                        <h1 style={styles.title}>{t("admin.messages.title")}</h1>
                        <p style={styles.subtitle}>{t("admin.messages.subtitle")}</p>
                    </div>
                    <HeaderTools />
                </div>

                <div style={styles.panel}>
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t("admin.messages.search")}
                        style={styles.search}
                    />
                    <div style={styles.list}>
                    {visible.length === 0 ? (
                        <p style={styles.empty}>{threads.length === 0 ? t("admin.messages.empty") : t("admin.messages.noneMatch")}</p>
                    ) : (
                        visible.map((thread) => (
                            <div key={thread.id} style={styles.rowWrap}>
                                <Link href={route("admin.messages.show", thread.id)} style={styles.row}>
                                    <div style={styles.avatar}>
                                        {thread.photo_path ? (
                                            <img src={`/storage/${thread.photo_path}`} alt="" style={styles.avatarImg} />
                                        ) : (
                                            thread.name?.slice(0, 2).toUpperCase()
                                        )}
                                    </div>
                                    <div style={styles.meta}>
                                        <p style={styles.name}>
                                            {thread.name}
                                            {thread.unread > 0 && <span style={styles.unread}>{thread.unread}</span>}
                                        </p>
                                        <p style={styles.preview}>
                                            {thread.last_author === "admin" ? t("admin.messages.you") : ""}
                                            {thread.last_body || t("admin.messages.noMessage")}
                                        </p>
                                    </div>
                                    <span style={styles.when}>{formatWhen(thread.last_at, dateLoc, t("admin.messages.noMessage"))}</span>
                                </Link>
                                {thread.last_at && (
                                    <IconButton
                                        icon="close"
                                        label={t("admin.messages.deleteThread", { name: thread.name })}
                                        variant="ghost"
                                        size={28}
                                        iconSize={14}
                                        style={styles.deleteBtn}
                                        onClick={() => setPending(thread)}
                                    />
                                )}
                            </div>
                        ))
                    )}
                    </div>
                </div>
            </div>
            <ConfirmDialog
                show={!!pending}
                title={t("admin.messages.deleteTitle")}
                message={t("admin.messages.deleteBody", { name: pending?.name || t("admin.messages.employeeFallback") })}
                processing={deleting}
                onConfirm={runDelete}
                onClose={() => !deleting && setPending(null)}
            />
        </>
    );
}

const styles = {
    page: { minHeight: "100vh", background: colors.background, fontFamily: "system-ui, sans-serif", padding: "24px", transition: "margin-left 0.3s ease" },
    header: { display: "flex", alignItems: "center", gap: "16px", background: "white", padding: "20px 24px", borderRadius: "12px", marginBottom: "24px", border: `1px solid ${colors.border}` },
    title: { fontSize: "18px", fontWeight: "600", color: colors.dark, margin: 0 },
    subtitle: { fontSize: "13px", color: colors.muted, margin: 0 },
    panel: { background: "white", borderRadius: "12px", border: `1px solid ${colors.border}`, overflow: "hidden" },
    search: {
        width: "100%",
        boxSizing: "border-box",
        border: "none",
        borderBottom: `1px solid ${colors.border}`,
        padding: "12px 16px",
        fontSize: "14px",
        fontFamily: "inherit",
        outline: "none",
    },
    list: { overflow: "hidden" },
    empty: { padding: "24px", color: colors.muted, margin: 0 },
    rowWrap: { display: "flex", alignItems: "center", borderBottom: `1px solid ${colors.border}`, paddingRight: "12px", gap: "8px" },
    row: { flex: 1, display: "flex", alignItems: "center", gap: "12px", padding: "14px 8px 14px 16px", textDecoration: "none", color: colors.dark, minWidth: 0 },
    deleteBtn: { marginRight: "4px", flexShrink: 0 },
    avatar: { width: "40px", height: "40px", borderRadius: "50%", background: "var(--color-primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "12px", overflow: "hidden", flexShrink: 0 },
    avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
    meta: { flex: 1, minWidth: 0 },
    name: { margin: 0, fontSize: "14px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" },
    unread: { minWidth: "18px", height: "18px", padding: "0 5px", borderRadius: "999px", background: colors.error, color: "white", fontSize: "11px", display: "inline-flex", alignItems: "center", justifyContent: "center" },
    preview: { margin: "4px 0 0", fontSize: "13px", color: colors.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
    when: { fontSize: "12px", color: colors.muted, flexShrink: 0 },
};
