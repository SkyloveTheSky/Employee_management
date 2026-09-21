import { Head, router, useForm, usePage } from "@inertiajs/react";
import { useMemo, useState } from "react";
import BrandMark from "@/Components/BrandMark";
import ConfirmDialog from "@/Components/ConfirmDialog";
import HeaderTools from "@/Components/HeaderTools";
import IconButton from "@/Components/IconButton";
import Sidebar from "@/Components/Admin/Sidebar";
import { colors } from "@/config/colors";
import { useSidebar } from "@/hooks/useSidebar";
import { useDateLocale, useLocale, useT, weekdayShortLabels } from "@/i18n";

const TYPE_COLORS = {
    unpaid: { bg: "#feebc8", color: "#9c4221" },
    paid: { bg: "#c6f6d5", color: "#276749" },
    payroll: { bg: "#d4d2f5", color: "#161179" },
    hire: { bg: "#bee3f8", color: "#2b6cb0" },
    note: { bg: "#faf5ff", color: "#553c9a" },
};

export default function Index({ admin, month, year, events = [], summaries = { unpaid: 0, paid: 0, period: "" } }) {
    const t = useT();
    const locale = useLocale();
    const dateLoc = useDateLocale();
    const weekdays = weekdayShortLabels(locale);
    const { errors } = usePage().props;
    const { isOpen, setIsOpen, offset } = useSidebar();
    const [editorOpen, setEditorOpen] = useState(false);
    const [dayList, setDayList] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const { data, setData, post, patch, delete: destroyNote, processing, reset, clearErrors } = useForm({
        id: null,
        date: "",
        title: "",
        note: "",
    });

    const label = useMemo(
        () =>
            new Intl.DateTimeFormat(dateLoc, { month: "long", year: "numeric" }).format(
                new Date(year, month - 1, 1)
            ),
        [month, year, dateLoc]
    );

    const days = useMemo(() => buildMonthGrid(year, month), [year, month]);
    const byDate = useMemo(() => {
        const map = {};
        events.forEach((event) => {
            if (!map[event.date]) map[event.date] = [];
            map[event.date].push(event);
        });
        return map;
    }, [events]);

    const goTo = (nextMonth, nextYear) => {
        router.get(route("admin.agenda"), { month: nextMonth, year: nextYear }, { preserveState: true });
    };

    const shift = (delta) => {
        const date = new Date(year, month - 1 + delta, 1);
        goTo(date.getMonth() + 1, date.getFullYear());
    };

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const period = summaries.period || `${year}-${String(month).padStart(2, "0")}`;
    const MAX_VISIBLE = 3;

    const openEvent = (event) => {
        if (event.type === "note") {
            openEdit(event);
            return;
        }
        if ((event.items || []).length > 1) {
            setDayList({
                title: event.label,
                items: event.items,
            });
            return;
        }
        if (event.href) router.visit(event.href);
    };

    const openCreate = (date) => {
        clearErrors();
        reset();
        setData({ id: null, date, title: "", note: "" });
        setEditorOpen(true);
    };

    const openEdit = (event) => {
        clearErrors();
        setData({
            id: event.id,
            date: event.date,
            title: event.label || "",
            note: event.note || "",
        });
        setEditorOpen(true);
    };

    const closeEditor = () => {
        setEditorOpen(false);
        reset();
        clearErrors();
    };

    const selectDay = (date) => {
        openCreate(date);
    };

    const saveNote = (e) => {
        e.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => closeEditor(),
        };
        if (data.id) {
            patch(route("admin.agenda.update", data.id), options);
            return;
        }
        post(route("admin.agenda.store"), options);
    };

    const deleteNote = () => {
        if (!data.id) return;
        setConfirmDelete(true);
    };

    const confirmDeleteNote = () => {
        if (!data.id) return;
        destroyNote(route("admin.agenda.destroy", data.id), {
            preserveScroll: true,
            onSuccess: () => {
                setConfirmDelete(false);
                closeEditor();
            },
        });
    };

    return (
        <>
            <Head title={t("admin.agenda.title")} />
            <Sidebar admin={admin} currentPage="admin.agenda" isOpen={isOpen} setIsOpen={setIsOpen} />
            <div className="app-page" style={{ ...styles.page, marginLeft: offset }}>
                <div className="app-header" style={styles.header}>
                    <BrandMark />
                    <div>
                        <h1 style={styles.title}>{t("admin.agenda.title")}</h1>
                        <p style={styles.subtitle}>{t("admin.agenda.subtitle")}</p>
                    </div>
                    <HeaderTools />
                </div>

                <div className="app-toolbar" style={styles.toolbar}>
                    <button type="button" style={styles.navBtn} onClick={() => shift(-1)}>←</button>
                    <h2 style={styles.monthTitle}>{label}</h2>
                    <button type="button" style={styles.navBtn} onClick={() => shift(1)}>→</button>
                    <button
                        type="button"
                        style={styles.todayBtn}
                        onClick={() => goTo(new Date().getMonth() + 1, new Date().getFullYear())}
                    >
                        {t("common.today")}
                    </button>
                    <IconButton
                        icon="add"
                        label={t("admin.agenda.addNote")}
                        variant="primary"
                        showLabel
                        size={38}
                        onClick={() => openCreate(data.date || today)}
                    />
                </div>

                <div style={styles.legend}>
                    <span style={{ ...styles.chip, ...TYPE_COLORS.unpaid }}>{t("admin.agenda.unpaid")}</span>
                    <span style={{ ...styles.chip, ...TYPE_COLORS.paid }}>{t("admin.agenda.paid")}</span>
                    <span style={{ ...styles.chip, ...TYPE_COLORS.hire }}>{t("admin.agenda.hire")}</span>
                    <span style={{ ...styles.chip, ...TYPE_COLORS.note }}>{t("admin.agenda.note")}</span>
                </div>

                {(summaries.unpaid > 0 || summaries.paid > 0) && (
                    <div style={styles.summaryRow}>
                        {summaries.unpaid > 0 && (
                            <button
                                type="button"
                                style={{ ...styles.summaryBtn, ...TYPE_COLORS.unpaid }}
                                onClick={() => router.visit(route("admin.payrolls.index", { period, filter_status: "unpaid" }))}
                            >
                                {t("admin.agenda.unpaidSummary", { count: summaries.unpaid })}
                            </button>
                        )}
                        {summaries.paid > 0 && (
                            <button
                                type="button"
                                style={{ ...styles.summaryBtn, ...TYPE_COLORS.paid }}
                                onClick={() => router.visit(route("admin.payrolls.index", { period, filter_status: "paid" }))}
                            >
                                {t("admin.agenda.paidSummary", { count: summaries.paid })}
                            </button>
                        )}
                    </div>
                )}

                <div className="app-agenda-scroll">
                <div className="app-agenda-head" style={styles.weekHead}>
                    {weekdays.map((day) => (
                        <div key={day} style={styles.weekCell}>{day}</div>
                    ))}
                </div>
                <div className="app-agenda-grid" style={styles.grid}>
                    {days.map((day) => {
                        const key = formatDate(day);
                        const inMonth = day.getMonth() === month - 1;
                        const dayEvents = byDate[key] || [];
                        const visible = dayEvents.slice(0, MAX_VISIBLE);
                        const extra = dayEvents.length - visible.length;
                        return (
                            <div
                                key={key}
                                role="button"
                                tabIndex={0}
                                onClick={() => selectDay(key)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        selectDay(key);
                                    }
                                }}
                                style={{
                                    ...styles.day,
                                    opacity: inMonth ? 1 : 0.4,
                                    cursor: "pointer",
                                    outline: key === data.date
                                        ? `2px solid ${colors.btnPrimary}`
                                        : key === today
                                            ? `2px solid ${colors.primary}`
                                            : "none",
                                    background: key === data.date ? "#eef4ff" : colors.surface,
                                }}
                            >
                                <div style={styles.dayHead}>
                                    <span style={styles.dayNum}>{day.getDate()}</span>
                                    <button
                                        type="button"
                                        style={styles.dayAdd}
                                        aria-label={t("admin.agenda.addNoteOn", { date: key })}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openCreate(key);
                                        }}
                                    >
                                        +
                                    </button>
                                </div>
                                {visible.map((event, index) => (
                                    <button
                                        key={`${event.type}-${event.id || index}`}
                                        type="button"
                                        title={event.note ? `${event.label}\n${event.note}` : event.label}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openEvent(event);
                                        }}
                                        style={{
                                            ...styles.event,
                                            background: TYPE_COLORS[event.type]?.bg || "#edf2f7",
                                            color: TYPE_COLORS[event.type]?.color || "#2d3748",
                                        }}
                                    >
                                        {event.label}
                                    </button>
                                ))}
                                {extra > 0 && (
                                    <button
                                        type="button"
                                        style={styles.moreBtn}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDayList({
                                                title: t("admin.agenda.moreOn", { day: day.getDate(), month: label }),
                                                items: dayEvents.flatMap((event) =>
                                                    (event.items || []).length
                                                        ? event.items
                                                        : [{ label: event.label, href: event.href, type: event.type, event }]
                                                ),
                                            });
                                        }}
                                    >
                                        +{extra} {t("common.more")}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
                </div>
            </div>

            {dayList && (
                <div style={styles.overlay} onClick={() => setDayList(null)}>
                    <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h3 style={styles.modalTitle}>{dayList.title}</h3>
                        <div style={styles.list}>
                            {dayList.items.map((item, index) => (
                                <button
                                    key={`${item.label}-${index}`}
                                    type="button"
                                    style={styles.listItem}
                                    onClick={() => {
                                        if (item.event?.type === "note") {
                                            setDayList(null);
                                            openEdit(item.event);
                                            return;
                                        }
                                        if (item.href) {
                                            router.visit(item.href);
                                        }
                                    }}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                        <div style={styles.modalActions}>
                            <button type="button" style={styles.cancelBtn} onClick={() => setDayList(null)}>
                                {t("common.close")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {editorOpen && (
                <div style={styles.overlay} onClick={closeEditor}>
                    <form style={styles.modal} onSubmit={saveNote} onClick={(e) => e.stopPropagation()}>
                        <h3 style={styles.modalTitle}>{data.id ? t("admin.agenda.editNote") : t("admin.agenda.newNote")}</h3>
                        <label style={styles.label}>
                            {t("common.date")}
                            <input
                                type="date"
                                value={data.date}
                                onChange={(e) => setData("date", e.target.value)}
                                style={styles.input}
                                required
                            />
                        </label>
                        {errors.date && <p style={styles.error}>{errors.date}</p>}
                        <label style={styles.label}>
                            {t("common.title")}
                            <input
                                type="text"
                                value={data.title}
                                onChange={(e) => setData("title", e.target.value)}
                                style={styles.input}
                                maxLength={120}
                                required
                                autoFocus
                                placeholder={t("admin.agenda.titlePlaceholder")}
                            />
                        </label>
                        {errors.title && <p style={styles.error}>{errors.title}</p>}
                        <label style={styles.label}>
                            {t("common.note")}
                            <textarea
                                value={data.note}
                                onChange={(e) => setData("note", e.target.value)}
                                style={styles.textarea}
                                rows={4}
                                maxLength={2000}
                                placeholder={t("admin.agenda.notePlaceholder")}
                            />
                        </label>
                        {errors.note && <p style={styles.error}>{errors.note}</p>}
                        <div style={styles.modalActions}>
                            {data.id && (
                                <IconButton
                                    icon="delete"
                                    label={t("common.delete")}
                                    variant="danger"
                                    onClick={deleteNote}
                                    disabled={processing}
                                />
                            )}
                            <button type="button" style={styles.cancelBtn} onClick={closeEditor}>
                                {t("common.cancel")}
                            </button>
                            <button type="submit" style={styles.saveBtn} disabled={processing}>
                                {processing ? t("common.saving") : t("common.save")}
                            </button>
                        </div>
                    </form>
                </div>
            )}
            <ConfirmDialog
                show={confirmDelete}
                title={t("admin.agenda.deleteTitle")}
                message={
                    data.title
                        ? t("admin.agenda.deleteNamed", { title: data.title })
                        : t("admin.agenda.deleteUnnamed")
                }
                processing={processing}
                onConfirm={confirmDeleteNote}
                onClose={() => !processing && setConfirmDelete(false)}
            />
        </>
    );
}

function buildMonthGrid(year, month) {
    const first = new Date(year, month - 1, 1);
    const mondayIndex = (first.getDay() + 6) % 7;
    const start = new Date(year, month - 1, 1 - mondayIndex);
    return Array.from({ length: 42 }, (_, i) => {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        return date;
    });
}

function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

const styles = {
    page: {
        minHeight: "100vh",
        background: colors.background,
        fontFamily: "system-ui, sans-serif",
        padding: "24px",
        transition: "margin-left 0.3s ease",
    },
    header: {
        display: "flex",
        alignItems: "center",
        gap: "16px",
        background: colors.surface,
        padding: "20px 24px",
        borderRadius: "12px",
        marginBottom: "24px",
        border: `1px solid ${colors.border}`,
    },
    title: { fontSize: "18px", fontWeight: "600", color: colors.dark, margin: 0 },
    subtitle: { fontSize: "13px", color: colors.muted, margin: 0 },
    toolbar: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginBottom: "12px",
        flexWrap: "wrap",
    },
    monthTitle: {
        fontSize: "18px",
        fontWeight: "600",
        color: colors.dark,
        margin: 0,
        textTransform: "capitalize",
        minWidth: "180px",
        textAlign: "center",
    },
    navBtn: {
        width: "36px",
        height: "36px",
        border: `1px solid ${colors.border}`,
        background: colors.surface,
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "16px",
    },
    todayBtn: {
        marginLeft: "8px",
        padding: "8px 12px",
        border: "none",
        background: colors.btnPrimary,
        color: "white",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: "600",
        cursor: "pointer",
    },
    addBtn: {
        padding: "8px 12px",
        border: `1px solid ${colors.border}`,
        background: colors.surface,
        color: colors.dark,
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: "600",
        cursor: "pointer",
    },
    legend: { display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" },
    chip: { fontSize: "12px", fontWeight: "600", padding: "4px 8px", borderRadius: "999px" },
    summaryRow: { display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" },
    summaryBtn: {
        border: "none",
        borderRadius: "999px",
        padding: "8px 12px",
        fontSize: "13px",
        fontWeight: 600,
        cursor: "pointer",
    },
    weekHead: {
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: "8px",
        marginBottom: "8px",
    },
    weekCell: {
        fontSize: "12px",
        fontWeight: "600",
        color: colors.muted,
        textAlign: "center",
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: "8px",
    },
    day: {
        minHeight: "110px",
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: "10px",
        padding: "8px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        overflow: "hidden",
    },
    dayHead: { display: "flex", alignItems: "center", justifyContent: "space-between" },
    dayNum: { fontSize: "12px", fontWeight: "700", color: colors.dark },
    dayAdd: {
        width: "22px",
        height: "22px",
        border: "none",
        background: "transparent",
        color: colors.muted,
        cursor: "pointer",
        fontSize: "16px",
        lineHeight: 1,
        borderRadius: "6px",
    },
    event: {
        border: "none",
        borderRadius: "6px",
        fontSize: "11px",
        textAlign: "left",
        padding: "4px 6px",
        cursor: "pointer",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    moreBtn: {
        border: "none",
        background: "transparent",
        color: colors.muted,
        fontSize: "11px",
        fontWeight: 600,
        textAlign: "left",
        padding: "2px 4px",
        cursor: "pointer",
    },
    list: {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        maxHeight: "320px",
        overflow: "auto",
    },
    listItem: {
        border: `1px solid ${colors.border}`,
        background: colors.surface,
        borderRadius: "8px",
        padding: "8px 10px",
        textAlign: "left",
        fontSize: "13px",
        cursor: "pointer",
        color: colors.dark,
    },
    overlay: {
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1300,
        padding: "16px",
    },
    modal: {
        width: "min(420px, 100%)",
        background: colors.surface,
        borderRadius: "12px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
    },
    modalTitle: { margin: 0, fontSize: "16px", fontWeight: 600, color: colors.dark },
    label: { display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", color: colors.muted },
    input: {
        width: "100%",
        border: `1px solid ${colors.border}`,
        borderRadius: "8px",
        padding: "9px 10px",
        fontSize: "13px",
        boxSizing: "border-box",
        color: colors.dark,
    },
    textarea: {
        width: "100%",
        border: `1px solid ${colors.border}`,
        borderRadius: "8px",
        padding: "9px 10px",
        fontSize: "13px",
        boxSizing: "border-box",
        color: colors.dark,
        resize: "vertical",
        fontFamily: "inherit",
    },
    error: { margin: 0, color: "#e53e3e", fontSize: "12px" },
    modalActions: { display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px", flexWrap: "wrap" },
    cancelBtn: {
        padding: "8px 12px",
        border: `1px solid ${colors.border}`,
        background: colors.surface,
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "13px",
    },
    saveBtn: {
        padding: "8px 12px",
        border: "none",
        background: colors.btnPrimary,
        color: "white",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: 600,
    },
    deleteBtn: {
        marginRight: "auto",
        padding: "8px 12px",
        border: "none",
        background: "#dc3545",
        color: "white",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: 600,
    },
};
