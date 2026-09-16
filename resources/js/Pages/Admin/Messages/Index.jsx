import { Head, Link } from "@inertiajs/react";
import { useState } from "react";
import BrandMark from "@/Components/BrandMark";
import ConfirmDialog from "@/Components/ConfirmDialog";
import HeaderTools from "@/Components/HeaderTools";
import Sidebar from "@/Components/Admin/Sidebar";
import { colors } from "@/config/colors";
import useInboxLive from "@/hooks/useInboxLive";
import { useSidebar } from "@/hooks/useSidebar";
import { inboxDelete } from "@/lib/inboxRequest";

function formatWhen(value) {
    if (!value) return "Aucun message";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

export default function Index({ admin, threads: initialThreads = [] }) {
    const { isOpen, setIsOpen, offset } = useSidebar();
    const { data: live, refresh } = useInboxLive(`${route("admin.messages.live")}?threads=1`);
    const threads = Array.isArray(live?.threads) ? live.threads : initialThreads;
    const [pending, setPending] = useState(null);
    const [deleting, setDeleting] = useState(false);

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
            <Head title="Messages" />
            <Sidebar admin={admin} currentPage="admin.messages.index" isOpen={isOpen} setIsOpen={setIsOpen} />
            <div className="app-page" style={{ ...styles.page, marginLeft: offset }}>
                <div className="app-header" style={styles.header}>
                    <BrandMark />
                    <div>
                        <h1 style={styles.title}>Messages</h1>
                        <p style={styles.subtitle}>Conversations avec les employés</p>
                    </div>
                    <HeaderTools />
                </div>

                <div style={styles.list}>
                    {threads.length === 0 ? (
                        <p style={styles.empty}>Aucun employé pour le moment.</p>
                    ) : (
                        threads.map((thread) => (
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
                                            {thread.last_author === "admin" ? "Vous : " : ""}
                                            {thread.last_body || "Aucun message"}
                                        </p>
                                    </div>
                                    <span style={styles.when}>{formatWhen(thread.last_at)}</span>
                                </Link>
                                {thread.last_at && (
                                    <button
                                        type="button"
                                        style={styles.deleteBtn}
                                        title="Supprimer la conversation"
                                        aria-label={`Supprimer la conversation avec ${thread.name}`}
                                        onClick={() => setPending(thread)}
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
            <ConfirmDialog
                show={!!pending}
                title="Supprimer cette conversation ?"
                message={`Tous les messages avec ${pending?.name || "cet employé"} seront retirés définitivement.`}
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
    list: { background: "white", borderRadius: "12px", border: `1px solid ${colors.border}`, overflow: "hidden" },
    empty: { padding: "24px", color: colors.muted, margin: 0 },
    rowWrap: { display: "flex", alignItems: "center", borderBottom: `1px solid ${colors.border}` },
    row: { flex: 1, display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", textDecoration: "none", color: colors.dark, minWidth: 0 },
    deleteBtn: { border: "none", background: "transparent", color: colors.muted, cursor: "pointer", fontSize: "22px", lineHeight: 1, padding: "0 16px 0 0", flexShrink: 0 },
    avatar: { width: "40px", height: "40px", borderRadius: "50%", background: "var(--color-primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "12px", overflow: "hidden", flexShrink: 0 },
    avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
    meta: { flex: 1, minWidth: 0 },
    name: { margin: 0, fontSize: "14px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" },
    unread: { minWidth: "18px", height: "18px", padding: "0 5px", borderRadius: "999px", background: colors.error, color: "white", fontSize: "11px", display: "inline-flex", alignItems: "center", justifyContent: "center" },
    preview: { margin: "4px 0 0", fontSize: "13px", color: colors.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
    when: { fontSize: "12px", color: colors.muted, flexShrink: 0 },
};
