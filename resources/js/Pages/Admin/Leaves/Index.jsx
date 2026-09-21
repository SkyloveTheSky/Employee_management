import { Head, router, usePage } from "@inertiajs/react";
import { useState } from "react";
import BrandMark from "@/Components/BrandMark";
import HeaderTools from "@/Components/HeaderTools";
import Sidebar from "@/Components/Admin/Sidebar";
import { colors } from "@/config/colors";
import { useSidebar } from "@/hooks/useSidebar";
import { useDateLocale, useT } from "@/i18n";

function slotLabel(slot, t) {
    return slot === "afternoon" ? t("leave.afternoon") : t("leave.morning");
}

function formatRange(leave, t, dateLoc) {
    const start = new Intl.DateTimeFormat(dateLoc, {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
    }).format(new Date(`${leave.start_date}T12:00:00Z`));
    const end = new Intl.DateTimeFormat(dateLoc, {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
    }).format(new Date(`${leave.end_date}T12:00:00Z`));
    const days = Number(leave.days || 0).toLocaleString(dateLoc, {
        minimumFractionDigits: leave.days % 1 === 0 ? 0 : 1,
        maximumFractionDigits: 1,
    });
    if (leave.start_date === leave.end_date) {
        const slot = leave.start_slot === leave.end_slot
            ? slotLabel(leave.start_slot, t)
            : t("leave.fullDay");
        return `${start} · ${slot} · ${t("leave.days", { count: days })}`;
    }
    return `${start} → ${end} · ${t("leave.days", { count: days })}`;
}

function statusStyle(status) {
    if (status === "approved") {
        return { background: "#c6f6d5", color: "#276749" };
    }
    if (status === "rejected") {
        return { background: "#fed7d7", color: "#c53030" };
    }
    return { background: "#feebc8", color: "#c05621" };
}

export default function Index({ admin, leaves = [], filters = {}, pending_count = 0 }) {
    const t = useT();
    const dateLoc = useDateLocale();
    const { flash, errors } = usePage().props;
    const { isOpen, setIsOpen, offset } = useSidebar();
    const [noteId, setNoteId] = useState(null);
    const [reviewNote, setReviewNote] = useState("");
    const [processing, setProcessing] = useState(false);

    const setFilter = (status) => {
        router.get(route("admin.leaves.index"), { status }, { preserveState: true, preserveScroll: true });
    };

    const decide = (leave, status) => {
        if (status === "rejected" && noteId !== leave.id) {
            setNoteId(leave.id);
            setReviewNote("");
            return;
        }
        setProcessing(true);
        router.patch(route("admin.leaves.update", leave.id), {
            status,
            review_note: status === "rejected" ? reviewNote : "",
        }, {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
            onSuccess: () => {
                setNoteId(null);
                setReviewNote("");
            },
        });
    };

    return (
        <>
            <Head title={t("admin.leaves.title")} />
            <Sidebar admin={admin} currentPage="admin.leaves.index" isOpen={isOpen} setIsOpen={setIsOpen} />
            <div className="app-page" style={{ ...styles.page, marginLeft: offset }}>
                <div className="app-header" style={styles.header}>
                    <BrandMark />
                    <div>
                        <h1 style={styles.title}>{t("admin.leaves.title")}</h1>
                        <p style={styles.subtitle}>
                            {pending_count > 0
                                ? t("admin.leaves.pending", { count: pending_count })
                                : t("admin.leaves.nonePending")}
                        </p>
                    </div>
                    <HeaderTools />
                </div>

                {flash?.success ? <p style={styles.success}>{flash.success}</p> : null}
                {errors?.status ? <p style={styles.error}>{errors.status}</p> : null}

                <div style={styles.filters}>
                    {[
                        ["all", t("common.all")],
                        ["pending", t("leave.pending")],
                        ["approved", t("admin.leaves.approved")],
                        ["rejected", t("admin.leaves.rejected")],
                    ].map(([value, label]) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => setFilter(value)}
                            style={{
                                ...styles.filterBtn,
                                background: (filters.status || "all") === value ? "var(--color-primary)" : "white",
                                color: (filters.status || "all") === value ? "white" : colors.dark,
                            }}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div style={styles.list}>
                    {leaves.length === 0 ? (
                        <p style={styles.empty}>{t("admin.leaves.empty")}</p>
                    ) : (
                        leaves.map((leave) => (
                            <article key={leave.id} style={styles.card}>
                                <div style={styles.cardTop}>
                                    <div>
                                        <p style={styles.name}>{leave.employee_name || t("common.employee")}</p>
                                        <p style={styles.meta}>
                                            {leave.position || t("common.employee")} · {(leave.type === "paid" || leave.type === "unpaid" || leave.type === "sick") ? t(`leave.${leave.type}`) : leave.type_label} · {formatRange(leave, t, dateLoc)}
                                        </p>
                                    </div>
                                    <span style={{ ...styles.badge, ...statusStyle(leave.status) }}>
                                        {(leave.status === "pending" || leave.status === "approved" || leave.status === "rejected") ? t(`leave.${leave.status}`) : leave.status_label}
                                    </span>
                                </div>
                                {leave.reason ? <p style={styles.reason}>{leave.reason}</p> : null}
                                {leave.review_note ? <p style={styles.reason}>{t("admin.leaves.note", { note: leave.review_note })}</p> : null}
                                {leave.status === "pending" ? (
                                    <div style={styles.actions}>
                                        <button
                                            type="button"
                                            style={styles.approve}
                                            disabled={processing}
                                            onClick={() => decide(leave, "approved")}
                                        >
                                            {t("admin.leaves.approve")}
                                        </button>
                                        {noteId === leave.id ? (
                                            <div style={styles.rejectBox}>
                                                <input
                                                    value={reviewNote}
                                                    onChange={(e) => setReviewNote(e.target.value)}
                                                    placeholder={t("admin.leaves.notePh")}
                                                    style={styles.input}
                                                />
                                                <button
                                                    type="button"
                                                    style={styles.reject}
                                                    disabled={processing}
                                                    onClick={() => decide(leave, "rejected")}
                                                >
                                                    {t("admin.leaves.confirmReject")}
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                style={styles.reject}
                                                disabled={processing}
                                                onClick={() => decide(leave, "rejected")}
                                            >
                                                {t("admin.leaves.reject")}
                                            </button>
                                        )}
                                    </div>
                                ) : null}
                            </article>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}

const styles = {
    page: { minHeight: "100vh", background: "var(--color-background)", fontFamily: "system-ui, sans-serif", padding: "24px", transition: "margin-left 0.3s ease" },
    header: { display: "flex", alignItems: "center", gap: "16px", background: "white", padding: "20px 24px", borderRadius: "12px", marginBottom: "24px", border: `1px solid ${colors.border}` },
    title: { fontSize: "18px", fontWeight: "600", color: colors.dark, margin: 0 },
    subtitle: { fontSize: "13px", color: colors.muted, margin: 0 },
    success: { background: "#c6f6d5", color: "#276749", padding: "10px 14px", borderRadius: "8px", marginBottom: "16px" },
    error: { background: "#fed7d7", color: "#c53030", padding: "10px 14px", borderRadius: "8px", marginBottom: "16px" },
    filters: { display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" },
    filterBtn: { border: `1px solid ${colors.border}`, borderRadius: "8px", padding: "8px 12px", fontSize: "13px", fontWeight: 600, cursor: "pointer" },
    list: { display: "flex", flexDirection: "column", gap: "12px" },
    empty: { margin: 0, color: colors.muted, fontSize: "14px" },
    card: { background: "white", border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "8px" },
    cardTop: { display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start" },
    name: { margin: 0, fontSize: "14px", fontWeight: 700, color: colors.dark },
    meta: { margin: "4px 0 0", fontSize: "13px", color: colors.muted },
    badge: { fontSize: "12px", fontWeight: 700, padding: "4px 8px", borderRadius: "999px", whiteSpace: "nowrap" },
    reason: { margin: 0, fontSize: "13px", color: colors.dark, lineHeight: 1.4 },
    actions: { display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" },
    approve: { border: "none", background: "#198754", color: "white", borderRadius: "8px", padding: "8px 12px", fontSize: "13px", fontWeight: 600, cursor: "pointer" },
    reject: { border: `1px solid ${colors.border}`, background: "white", color: colors.dark, borderRadius: "8px", padding: "8px 12px", fontSize: "13px", fontWeight: 600, cursor: "pointer" },
    rejectBox: { display: "flex", flexWrap: "wrap", gap: "8px", flex: 1 },
    input: { minWidth: "180px", flex: 1, boxSizing: "border-box", padding: "8px 10px", border: `1px solid ${colors.border}`, borderRadius: "8px", fontSize: "13px" },
};
