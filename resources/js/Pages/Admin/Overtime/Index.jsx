import { Head, Link, router, usePage } from "@inertiajs/react";
import { useMemo, useState } from "react";
import BrandMark from "@/Components/BrandMark";
import HeaderTools from "@/Components/HeaderTools";
import Sidebar from "@/Components/Admin/Sidebar";
import { colors } from "@/config/colors";
import { useSidebar } from "@/hooks/useSidebar";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function formatDays(value) {
    const n = Number(value || 0);
    return n.toLocaleString("fr-FR", {
        minimumFractionDigits: n % 1 === 0 ? 0 : 1,
        maximumFractionDigits: 1,
    });
}

function dayWord(value) {
    return Number(value || 0) > 1 ? "jours" : "jour";
}

function formatHours(value) {
    return `${Number(value || 0).toLocaleString("fr-FR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    })} h`;
}

function overtimeFromHalf(hours, half) {
    const value = Number(hours || 0);
    const cap = Number(half || 0);
    if (cap <= 0) return 0;
    return Math.max(0, Math.round((value - cap) * 100) / 100);
}

function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
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

function namedRoute(name, params, fallback) {
    try {
        return route(name, params);
    } catch {
        return fallback;
    }
}

function shiftPeriod(period, delta) {
    const [year, month] = String(period).split("-").map(Number);
    const date = new Date(year, month - 1 + delta, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export default function Index({
    admin,
    period,
    hours_per_day = 8,
    hours_per_half = 4,
    overtime_enabled = true,
    employees = [],
    detail = null,
    urls = {},
}) {
    const { flash } = usePage().props;
    const { isOpen, setIsOpen, offset } = useSidebar();
    const [query, setQuery] = useState("");
    const selectedId = Number(detail?.employee?.id || 0);

    const periodLabel = useMemo(() => {
        const [year, month] = String(period || "").split("-");
        if (!year || !month) return "";
        return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(
            new Date(Number(year), Number(month) - 1, 1)
        );
    }, [period]);

    const goTo = (next = {}) => {
        router.get(
            urls.index || namedRoute("admin.overtime.index", {}, "/admin/overtime"),
            {
                period: next.period ?? period,
                user_id: next.user_id ?? (selectedId || ""),
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    const filtered = employees.filter((row) => {
        const needle = query.trim().toLowerCase();
        if (!needle) return true;
        return `${row.name} ${row.position || ""}`.toLowerCase().includes(needle);
    });

    const hsOn = overtime_enabled !== false;

    const stats = detail
        ? { worked: detail.worked_hours, present: detail.present_days, overtime: detail.overtime_hours }
        : employees.reduce(
            (acc, row) => {
                acc.worked += Number(row.worked_hours || 0);
                acc.present += Number(row.present_days || 0);
                acc.overtime += Number(row.overtime_hours || 0);
                return acc;
            },
            { worked: 0, present: 0, overtime: 0 }
        );

    return (
        <>
            <Head title="Gestion des présences" />
            <Sidebar admin={admin} currentPage="admin.overtime.index" isOpen={isOpen} setIsOpen={setIsOpen} />
            <div className="app-page" style={{ ...styles.page, marginLeft: offset }}>
                <div className="app-header" style={styles.header}>
                    <BrandMark />
                    <div>
                        <h1 style={styles.title}>Gestion des présences</h1>
                        <p style={styles.subtitle}>
                            Cliquez sur Matin ou Après-midi pour marquer. Cliquez sur le numéro du jour pour saisir les heures
                            {hsOn
                                ? ` : au-delà de ${formatHours(hours_per_half)}, le surplus est en heures supplémentaires.`
                                : "."}
                        </p>
                    </div>
                    <HeaderTools />
                </div>

                {flash?.success && <p style={styles.success}>{flash.success}</p>}

                <div className="app-toolbar" style={styles.toolbar}>
                    <button type="button" style={styles.navBtn} onClick={() => goTo({ period: shiftPeriod(period, -1) })}>
                        ←
                    </button>
                    <h2 style={styles.monthTitle}>{periodLabel}</h2>
                    <button type="button" style={styles.navBtn} onClick={() => goTo({ period: shiftPeriod(period, 1) })}>
                        →
                    </button>
                    <button
                        type="button"
                        style={styles.todayBtn}
                        onClick={() => {
                            const now = new Date();
                            goTo({
                                period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
                            });
                        }}
                    >
                        Aujourd’hui
                    </button>
                    <label style={styles.period}>
                        Employé
                        <select
                            value={selectedId || ""}
                            onChange={(e) => goTo({ user_id: e.target.value || "" })}
                            style={styles.select}
                        >
                            <option value="">Choisir un employé</option>
                            {employees.map((row) => (
                                <option key={row.id} value={row.id}>
                                    {row.name}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                <div className="app-cards" style={styles.cards}>
                    <div style={styles.stat}>
                        <p style={styles.statLabel}>{detail ? "Jours présents" : "Jours présents (tous)"}</p>
                        <p style={styles.statValue}>{formatDays(stats.present || 0)}</p>
                    </div>
                    <div style={styles.stat}>
                        <p style={styles.statLabel}>{detail ? "Heures travaillées" : "Heures travaillées (tous)"}</p>
                        <p style={styles.statValue}>{formatHours(stats.worked)}</p>
                    </div>
                    {hsOn ? (
                        <div style={styles.stat}>
                            <p style={styles.statLabel}>{detail ? "Heures supplémentaires" : "Heures supplémentaires (tous)"}</p>
                            <p style={styles.statValue}>{formatHours(stats.overtime)}</p>
                        </div>
                    ) : (
                        <div style={styles.stat}>
                            <p style={styles.statLabel}>Heures supplémentaires</p>
                            <p style={styles.statHint}>Désactivées</p>
                        </div>
                    )}
                    <div style={styles.stat}>
                        <p style={styles.statLabel}>Demi-journée type</p>
                        <p style={styles.statHint}>{formatHours(hours_per_half)} / demi-journée</p>
                    </div>
                </div>

                <div style={styles.legend}>
                    <span style={{ ...styles.chip, background: "#c6f6d5", color: "#276749" }}>Journée complète</span>
                    <span style={{ ...styles.chip, background: "#fefcbf", color: "#975a16" }}>Demi-journée</span>
                    {hsOn ? (
                        <span style={{ ...styles.chip, background: "#feebc8", color: "#c05621" }}>Heures supplémentaires</span>
                    ) : null}
                    <span style={{ ...styles.chip, background: "#edf2f7", color: "#4a5568" }}>Non renseigné</span>
                    <span style={{ ...styles.chip, background: "#fafafa", color: "#718096" }}>Week-end</span>
                </div>

                <div style={styles.layout}>
                    <div style={styles.listCard}>
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Rechercher un employé"
                            style={styles.search}
                        />
                        <div style={styles.list}>
                            {filtered.map((row) => (
                                <Link
                                    key={row.id}
                                    href={namedRoute(
                                        "admin.overtime.index",
                                        { period, user_id: row.id },
                                        `/admin/overtime?period=${encodeURIComponent(period)}&user_id=${row.id}`
                                    )}
                                    preserveState
                                    preserveScroll
                                    style={{
                                        ...styles.person,
                                        borderColor: selectedId === Number(row.id) ? "var(--color-primary)" : colors.border,
                                        background: selectedId === Number(row.id) ? "#f7fafc" : "white",
                                        textDecoration: "none",
                                    }}
                                >
                                    <span style={styles.personName}>{row.name}</span>
                                    <span style={styles.personMeta}>
                                        {formatDays(row.present_days || 0)} {dayWord(row.present_days)} · {formatHours(row.worked_hours)}
                                        {row.overtime_enabled !== false && Number(row.overtime_hours || 0) > 0
                                            ? ` · ${formatHours(row.overtime_hours)} HS`
                                            : ""}
                                    </span>
                                </Link>
                            ))}
                            {filtered.length === 0 && <p style={styles.empty}>Aucun employé.</p>}
                        </div>
                    </div>

                    <div style={styles.detailCard}>
                        {!detail ? (
                            <p style={styles.empty}>Choisissez un employé pour afficher son calendrier de présence.</p>
                        ) : (
                            <AttendanceCalendar
                                key={`${detail.employee.id}-${period}`}
                                detail={detail}
                                period={period}
                                dayUrl={urls.day}
                                overtimeEnabled={detail.overtime_enabled !== false}
                            />
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

function AttendanceCalendar({ detail, period, dayUrl, overtimeEnabled = true }) {
    const [year, month] = String(period).split("-").map(Number);
    const days = useMemo(() => buildMonthGrid(year, month), [year, month]);
    const hoursByDate = useMemo(() => {
        const map = {};
        (detail.days || []).forEach((day) => {
            map[day.date] = {
                morning: Number(day.morning_hours || 0),
                afternoon: Number(day.afternoon_hours || 0),
                morningOt: Number(day.morning_overtime || 0),
                afternoonOt: Number(day.afternoon_overtime || 0),
                note: day.note || "",
            };
        });
        return map;
    }, [detail.days]);

    const hoursPerDay = Number(detail.hours_per_day || 8);
    const hoursPerHalf = Number(detail.hours_per_half || hoursPerDay / 2);
    const today = formatDate(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [morning, setMorning] = useState(hoursPerHalf);
    const [afternoon, setAfternoon] = useState(hoursPerHalf);
    const [note, setNote] = useState("");
    const [saving, setSaving] = useState(false);
    const { errors } = usePage().props;

    const entryFor = (key) => hoursByDate[key] || { morning: 0, afternoon: 0, morningOt: 0, afternoonOt: 0, note: "" };

    const openDay = (key, inMonth) => {
        if (!inMonth) return;
        const current = entryFor(key);
        setMorning(current.morning);
        setAfternoon(current.afternoon);
        setNote(current.note || "");
        setSelectedDate(key);
    };

    const closeDay = () => {
        setSelectedDate(null);
        setSaving(false);
    };

    const save = (nextMorning, nextAfternoon, nextNote = note, { close = true, date = selectedDate } = {}) => {
        if (!date) return;
        setSaving(true);
        router.put(
            dayUrl || namedRoute("admin.overtime.day", {}, "/admin/overtime/day"),
            {
                user_id: detail.employee.id,
                date,
                morning_hours: nextMorning,
                afternoon_hours: nextAfternoon,
                note: nextNote,
            },
            {
                preserveScroll: true,
                onFinish: () => setSaving(false),
                onSuccess: () => {
                    if (close) closeDay();
                },
            }
        );
    };

    const toggleHalf = (key, slot, inMonth) => {
        if (!inMonth) return;
        const current = entryFor(key);
        const nextMorning = slot === "morning" ? (current.morning > 0 ? 0 : hoursPerHalf) : current.morning;
        const nextAfternoon = slot === "afternoon" ? (current.afternoon > 0 ? 0 : hoursPerHalf) : current.afternoon;
        save(nextMorning, nextAfternoon, current.note, { close: false, date: key });
    };

    const submit = (e) => {
        e.preventDefault();
        save(morning, afternoon, note);
    };

    const selectedLabel = selectedDate
        ? new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(
            new Date(`${selectedDate}T12:00:00`)
        )
        : "";

    return (
        <>
            <div style={styles.detailHead}>
                <div>
                    <h2 style={styles.detailTitle}>{detail.employee.name}</h2>
                    <p style={styles.subtitle}>
                        {detail.employee.position || "Employé"} · {formatDays(detail.present_days || 0)}{" "}
                        {dayWord(detail.present_days)} · {formatHours(detail.worked_hours)}
                        {overtimeEnabled && Number(detail.overtime_hours || 0) > 0 ? ` · ${formatHours(detail.overtime_hours)} HS` : ""}
                    </p>
                </div>
            </div>

            <div className="app-agenda-scroll">
                <div className="app-agenda-head" style={styles.weekHead}>
                    {WEEKDAYS.map((day) => (
                        <div key={day} style={styles.weekCell}>{day}</div>
                    ))}
                </div>
                <div className="app-agenda-grid" style={styles.grid}>
                    {days.map((day) => {
                        const key = formatDate(day);
                        const inMonth = day.getMonth() === month - 1;
                        const entry = entryFor(key);
                        const morningPresent = Number(entry.morning) > 0;
                        const afternoonPresent = Number(entry.afternoon) > 0;
                        const morningOt = overtimeEnabled ? overtimeFromHalf(entry.morning, hoursPerHalf) : 0;
                        const afternoonOt = overtimeEnabled ? overtimeFromHalf(entry.afternoon, hoursPerHalf) : 0;
                        const both = morningPresent && afternoonPresent;
                        const half = morningPresent !== afternoonPresent;
                        const hasOt = morningOt > 0 || afternoonOt > 0;
                        const weekend = day.getDay() === 0 || day.getDay() === 6;
                        return (
                            <div
                                key={key}
                                style={{
                                    ...styles.day,
                                    opacity: inMonth ? 1 : 0.35,
                                    background: hasOt ? "#fffaf0" : both ? "#f0fff4" : half ? "#fffff0" : weekend ? "#fafafa" : "white",
                                    borderColor: key === selectedDate
                                        ? "var(--color-primary)"
                                        : key === today
                                            ? colors.primaryLight
                                            : colors.border,
                                    boxShadow: hasOt
                                        ? "inset 0 0 0 1px #f6ad55"
                                        : both
                                        ? "inset 0 0 0 1px #9ae6b4"
                                        : half
                                            ? "inset 0 0 0 1px #f6e05e"
                                            : "none",
                                }}
                            >
                                <button
                                    type="button"
                                    disabled={!inMonth}
                                    onClick={() => openDay(key, inMonth)}
                                    title="Saisir les heures"
                                    style={styles.dayNumBtn}
                                >
                                    {day.getDate()}
                                </button>
                                {inMonth ? (
                                    <div style={styles.halves}>
                                        <button
                                            type="button"
                                            disabled={saving}
                                            onClick={() => toggleHalf(key, "morning", inMonth)}
                                            style={{
                                                ...styles.halfBtn,
                                                background: morningOt > 0 ? "#feebc8" : morningPresent ? "#c6f6d5" : "#edf2f7",
                                                color: morningOt > 0 ? "#c05621" : morningPresent ? "#276749" : "#718096",
                                            }}
                                        >
                                            <span>Matin</span>
                                            <span>{morningPresent ? formatHours(entry.morning) : "—"}</span>
                                            {morningOt > 0 ? <span style={styles.otLine}>+{formatHours(morningOt)} HS</span> : null}
                                        </button>
                                        <button
                                            type="button"
                                            disabled={saving}
                                            onClick={() => toggleHalf(key, "afternoon", inMonth)}
                                            style={{
                                                ...styles.halfBtn,
                                                background: afternoonOt > 0 ? "#feebc8" : afternoonPresent ? "#c6f6d5" : "#edf2f7",
                                                color: afternoonOt > 0 ? "#c05621" : afternoonPresent ? "#276749" : "#718096",
                                            }}
                                        >
                                            <span>A-m.</span>
                                            <span>{afternoonPresent ? formatHours(entry.afternoon) : "—"}</span>
                                            {afternoonOt > 0 ? <span style={styles.otLine}>+{formatHours(afternoonOt)} HS</span> : null}
                                        </button>
                                    </div>
                                ) : null}
                                {entry.note ? <span style={styles.notePreview}>{entry.note}</span> : null}
                            </div>
                        );
                    })}
                </div>
            </div>

            {selectedDate && (
                <div style={styles.overlay} onClick={closeDay}>
                    <form style={styles.modal} onSubmit={submit} onClick={(e) => e.stopPropagation()}>
                        <h3 style={styles.modalTitle}>{selectedLabel}</h3>
                        <p style={styles.subtitle}>{detail.employee.name}</p>
                        <div style={styles.quickRow}>
                            <button
                                type="button"
                                style={styles.presentBtn}
                                disabled={saving}
                                onClick={() => save(hoursPerHalf, hoursPerHalf, note)}
                            >
                                Journée complète
                            </button>
                            <button
                                type="button"
                                style={styles.absentBtn}
                                disabled={saving}
                                onClick={() => save(0, 0, "")}
                            >
                                Absent
                            </button>
                        </div>
                        <p style={styles.subtitle}>
                            {overtimeEnabled
                                ? `Heures manuelles (matin et après-midi). Au-delà de ${formatHours(hoursPerHalf)}, le surplus est en heures supplémentaires.`
                                : "Heures manuelles (matin et après-midi)."}
                        </p>
                        <div style={styles.splitFields}>
                            <label style={styles.fieldLabel}>
                                Matin
                                <input
                                    type="number"
                                    min="0"
                                    max="12"
                                    step="0.25"
                                    autoFocus
                                    value={morning}
                                    onChange={(e) => setMorning(e.target.value)}
                                    style={styles.input}
                                />
                                <HalfBreakdown hours={morning} half={hoursPerHalf} enabled={overtimeEnabled} />
                            </label>
                            <label style={styles.fieldLabel}>
                                Après-midi
                                <input
                                    type="number"
                                    min="0"
                                    max="12"
                                    step="0.25"
                                    value={afternoon}
                                    onChange={(e) => setAfternoon(e.target.value)}
                                    style={styles.input}
                                />
                                <HalfBreakdown hours={afternoon} half={hoursPerHalf} enabled={overtimeEnabled} />
                            </label>
                        </div>
                        {(errors?.morning_hours || errors?.afternoon_hours || errors?.hours) && (
                            <p style={styles.error}>{errors.morning_hours || errors.afternoon_hours || errors.hours}</p>
                        )}
                        <label style={styles.fieldLabel}>
                            Note
                            <input
                                type="text"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Optionnel"
                                style={styles.input}
                            />
                        </label>
                        <div style={styles.modalActions}>
                            <button type="button" style={styles.cancelBtn} onClick={closeDay}>
                                Fermer
                            </button>
                            <button type="submit" style={styles.save} disabled={saving}>
                                {saving ? "Enregistrement…" : "Enregistrer"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
}

function HalfBreakdown({ hours, half, enabled = true }) {
    if (!enabled) return null;
    const overtime = overtimeFromHalf(hours, half);
    if (overtime <= 0) return null;

    return (
        <span style={styles.otHint}>
            {formatHours(half)} de présence · {formatHours(overtime)} HS
        </span>
    );
}

const styles = {
    page: { minHeight: "100vh", background: "var(--color-background)", fontFamily: "system-ui, sans-serif", padding: "24px", transition: "margin-left 0.3s ease" },
    header: { display: "flex", alignItems: "center", gap: "16px", background: "white", padding: "20px 24px", borderRadius: "12px", marginBottom: "24px", border: `1px solid ${colors.border}` },
    title: { fontSize: "18px", fontWeight: "600", color: colors.dark, margin: 0 },
    subtitle: { fontSize: "13px", color: colors.muted, margin: "4px 0 0" },
    success: { background: "#c6f6d5", color: "#276749", padding: "10px 14px", borderRadius: "8px", marginBottom: "16px" },
    error: { color: colors.error, fontSize: "13px", margin: "0 0 8px" },
    toolbar: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px", marginBottom: "16px" },
    monthTitle: { fontSize: "18px", fontWeight: 600, color: colors.dark, margin: 0, textTransform: "capitalize", minWidth: "180px", textAlign: "center" },
    navBtn: { width: "36px", height: "36px", border: `1px solid ${colors.border}`, background: "white", borderRadius: "8px", cursor: "pointer", fontSize: "16px" },
    todayBtn: { padding: "8px 12px", border: "none", background: "var(--color-primary)", color: "white", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer" },
    period: { display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600, color: colors.dark, marginLeft: "auto" },
    select: { padding: "8px 10px", border: `1px solid ${colors.border}`, borderRadius: "8px", fontSize: "13px", fontWeight: 400 },
    cards: { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "12px", marginBottom: "12px" },
    stat: { background: "white", border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "16px 18px" },
    statLabel: { margin: 0, fontSize: "12px", color: colors.muted, fontWeight: 600 },
    statValue: { margin: "8px 0 0", fontSize: "22px", fontWeight: 700, color: colors.dark },
    statHint: { margin: "8px 0 0", fontSize: "16px", color: colors.dark, fontWeight: 700 },
    legend: { display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" },
    chip: { fontSize: "12px", fontWeight: 600, padding: "4px 8px", borderRadius: "999px" },
    layout: { display: "grid", gridTemplateColumns: "minmax(220px, 280px) minmax(0, 1fr)", gap: "16px", alignItems: "start" },
    listCard: { background: "white", border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "12px" },
    search: { width: "100%", boxSizing: "border-box", padding: "10px 12px", border: `1px solid ${colors.border}`, borderRadius: "8px", fontSize: "13px", marginBottom: "10px" },
    list: { display: "flex", flexDirection: "column", gap: "8px", maxHeight: "70vh", overflow: "auto" },
    person: { display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "2px", width: "100%", border: `1px solid ${colors.border}`, borderRadius: "10px", padding: "10px 12px", cursor: "pointer", textAlign: "left" },
    personName: { fontSize: "13px", fontWeight: 700, color: colors.dark },
    personMeta: { fontSize: "12px", color: colors.muted },
    detailCard: { background: "white", border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "16px 18px", minHeight: "420px" },
    empty: { margin: 0, color: colors.muted, fontSize: "14px", padding: "12px 4px" },
    detailHead: { marginBottom: "14px" },
    detailTitle: { margin: 0, fontSize: "16px", color: colors.dark },
    weekHead: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px", marginBottom: "8px" },
    weekCell: { fontSize: "12px", fontWeight: 600, color: colors.muted, textAlign: "center" },
    grid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px" },
    day: { minHeight: "128px", border: `1px solid ${colors.border}`, borderRadius: "10px", padding: "8px", display: "flex", flexDirection: "column", alignItems: "stretch", gap: "6px", textAlign: "left" },
    dayNumBtn: { alignSelf: "flex-start", border: "none", background: "transparent", padding: 0, fontSize: "12px", fontWeight: 700, color: colors.dark, cursor: "pointer" },
    halves: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", width: "100%" },
    halfBtn: { border: "none", borderRadius: "8px", padding: "6px 4px", display: "flex", flexDirection: "column", gap: "2px", fontSize: "10px", fontWeight: 700, cursor: "pointer", lineHeight: 1.2 },
    otLine: { fontSize: "9px", fontWeight: 800 },
    otHint: { fontSize: "11px", fontWeight: 600, color: "#c05621" },
    notePreview: { fontSize: "11px", color: colors.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" },
    overlay: { position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2500, padding: "16px" },
    modal: { width: "min(420px, 100%)", background: "white", borderRadius: "12px", border: `1px solid ${colors.border}`, padding: "22px 24px", boxShadow: "0 20px 50px rgba(15, 23, 42, 0.2)", display: "flex", flexDirection: "column", gap: "10px" },
    modalTitle: { margin: 0, fontSize: "17px", fontWeight: 700, color: colors.dark, textTransform: "capitalize" },
    quickRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", margin: "6px 0 4px" },
    splitFields: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" },
    presentBtn: { border: "none", background: "#198754", color: "white", borderRadius: "8px", padding: "10px 12px", fontSize: "13px", fontWeight: 600, cursor: "pointer" },
    absentBtn: { border: `1px solid ${colors.border}`, background: "white", color: colors.dark, borderRadius: "8px", padding: "10px 12px", fontSize: "13px", fontWeight: 600, cursor: "pointer" },
    fieldLabel: { display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", fontWeight: 600, color: colors.dark },
    input: { width: "100%", boxSizing: "border-box", padding: "8px 10px", border: `1px solid ${colors.border}`, borderRadius: "8px", fontSize: "13px", fontWeight: 400 },
    modalActions: { display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "6px" },
    cancelBtn: { border: `1px solid ${colors.border}`, background: "white", color: colors.dark, borderRadius: "8px", padding: "10px 14px", fontSize: "13px", fontWeight: 600, cursor: "pointer" },
    save: { border: "none", background: "var(--color-primary)", color: "white", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", fontWeight: 600, cursor: "pointer" },
};
