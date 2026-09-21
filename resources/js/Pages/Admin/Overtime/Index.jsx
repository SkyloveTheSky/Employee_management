import { Head, router, usePage } from "@inertiajs/react";
import { useEffect, useMemo, useRef, useState } from "react";
import BrandMark from "@/Components/BrandMark";
import HeaderTools from "@/Components/HeaderTools";
import Sidebar from "@/Components/Admin/Sidebar";
import { colors } from "@/config/colors";
import { useSidebar } from "@/hooks/useSidebar";
import { useDateLocale, useLocale, useT, weekdayShortLabels } from "@/i18n";

function formatDays(value, loc = "fr-FR") {
    const n = Number(value || 0);
    return n.toLocaleString(loc, {
        minimumFractionDigits: n % 1 === 0 ? 0 : 1,
        maximumFractionDigits: 1,
    });
}

function formatHours(value, loc = "fr-FR") {
    return `${Number(value || 0).toLocaleString(loc, {
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

function leaveTone(type, t) {
    if (type === "paid") {
        return { background: "#bee3f8", color: "#2b6cb0", label: t("leave.paidShort"), full: t("leave.paid") };
    }
    if (type === "unpaid") {
        return { background: "#e9d8fd", color: "#6b46c1", label: t("leave.unpaidShort"), full: t("leave.unpaid") };
    }
    if (type === "sick") {
        return { background: "#fed7e2", color: "#97266d", label: t("leave.sickShort"), full: t("leave.sick") };
    }
    return null;
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

function normalize(value) {
    return String(value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function employeeMeta(row, t, loc) {
    const hs = row.overtime_enabled !== false && Number(row.overtime_hours || 0) > 0
        ? ` · ${formatHours(row.overtime_hours, loc)} ${t("admin.payroll.overtime")}`
        : "";

    return `${formatDays(row.present_days || 0, loc)} ${t("common.day", { count: row.present_days || 0 })} · ${formatHours(row.worked_hours, loc)}${hs}`;
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
    const t = useT();
    const dateLoc = useDateLocale();
    const { flash } = usePage().props;
    const { isOpen, setIsOpen, offset } = useSidebar();
    const [query, setQuery] = useState("");
    const [pickerOpen, setPickerOpen] = useState(false);
    const [highlight, setHighlight] = useState(0);
    const pickerRef = useRef(null);
    const selectedId = Number(detail?.employee?.id || 0);
    const selectedEmployee = employees.find((row) => Number(row.id) === selectedId) || null;

    const periodLabel = useMemo(() => {
        const [year, month] = String(period || "").split("-");
        if (!year || !month) return "";
        return new Intl.DateTimeFormat(dateLoc, { month: "long", year: "numeric" }).format(
            new Date(Number(year), Number(month) - 1, 1)
        );
    }, [period, dateLoc]);

    const filtered = useMemo(() => {
        const needle = normalize(query).trim();
        if (!needle) return employees;
        return employees.filter((row) => normalize(`${row.name} ${row.position || ""}`).includes(needle));
    }, [employees, query]);

    useEffect(() => {
        if (!pickerOpen) return;
        const index = filtered.findIndex((row) => Number(row.id) === selectedId);
        setHighlight(index >= 0 ? index : 0);
    }, [query, pickerOpen, filtered, selectedId]);

    useEffect(() => {
        if (!pickerOpen) return undefined;
        const onPointer = (event) => {
            if (!pickerRef.current?.contains(event.target)) {
                setPickerOpen(false);
                setQuery("");
            }
        };
        const timer = window.setTimeout(() => {
            document.addEventListener("mousedown", onPointer);
        }, 0);
        return () => {
            window.clearTimeout(timer);
            document.removeEventListener("mousedown", onPointer);
        };
    }, [pickerOpen]);

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

    const pickEmployee = (row) => {
        setQuery("");
        setPickerOpen(false);
        goTo({ user_id: row.id });
    };

    const onSearchKeyDown = (event) => {
        if (!pickerOpen && (event.key === "ArrowDown" || event.key === "Enter")) {
            event.preventDefault();
            setPickerOpen(true);
            return;
        }
        if (!pickerOpen) return;
        if (event.key === "ArrowDown") {
            event.preventDefault();
            setHighlight((index) => Math.min(index + 1, Math.max(filtered.length - 1, 0)));
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setHighlight((index) => Math.max(index - 1, 0));
        } else if (event.key === "Enter") {
            event.preventDefault();
            const row = filtered[highlight];
            if (row) pickEmployee(row);
        } else if (event.key === "Escape") {
            event.preventDefault();
            setPickerOpen(false);
            setQuery("");
        }
    };

    const hsOn = overtime_enabled !== false;

    return (
        <>
            <Head title={t("admin.presence.title")} />
            <Sidebar admin={admin} currentPage="admin.overtime.index" isOpen={isOpen} setIsOpen={setIsOpen} />
            <div className="app-page" style={{ ...styles.page, marginLeft: offset }}>
                <div className="app-header" style={styles.header}>
                    <BrandMark />
                    <div>
                        <h1 style={styles.title}>{t("admin.presence.title")}</h1>
                        <p style={styles.subtitle}>
                            {t("admin.presence.subtitle")}
                            {hsOn
                                ? t("admin.presence.subtitleOt", { hours: formatHours(hours_per_half, dateLoc) })
                                : t("admin.presence.subtitleEnd")}
                        </p>
                    </div>
                    <HeaderTools />
                </div>

                {flash?.success && <p style={styles.success}>{flash.success}</p>}

                <div className="app-toolbar" style={styles.toolbar}>
                    <div style={styles.monthNav}>
                        <button type="button" style={styles.navBtn} onClick={() => goTo({ period: shiftPeriod(period, -1) })} aria-label={t("common.previousMonth")}>
                            ←
                        </button>
                        <h2 style={styles.monthTitle}>{periodLabel}</h2>
                        <button type="button" style={styles.navBtn} onClick={() => goTo({ period: shiftPeriod(period, 1) })} aria-label={t("common.nextMonth")}>
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
                            {t("common.today")}
                        </button>
                    </div>
                    <div className="app-presence-search-wrap" ref={pickerRef} style={styles.searchWrap}>
                        <div style={styles.searchField}>
                            <svg viewBox="0 0 24 24" aria-hidden="true" className="app-presence-search-icon" style={styles.searchIcon}>
                                <path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14" />
                            </svg>
                            <input
                                type="text"
                                value={pickerOpen ? query : (selectedEmployee?.name || "")}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    setPickerOpen(true);
                                }}
                                onFocus={() => {
                                    setPickerOpen(true);
                                    setQuery("");
                                }}
                                onMouseDown={() => setPickerOpen(true)}
                                onKeyDown={onSearchKeyDown}
                                placeholder={t("common.searchEmployee")}
                                className="app-presence-search"
                                aria-label={t("common.searchEmployee")}
                                aria-expanded={pickerOpen}
                                aria-controls="presence-employee-list"
                                autoComplete="off"
                                style={styles.search}
                            />
                            {pickerOpen && query ? (
                                <button type="button" onClick={() => setQuery("")} aria-label={t("common.clearSearch")} style={styles.searchClear}>
                                    <img src="/assets/icon/close.svg" alt="" style={styles.searchClearIcon} />
                                </button>
                            ) : null}
                        </div>
                        {pickerOpen && (
                            <div id="presence-employee-list" role="listbox" style={styles.pickerMenu}>
                                <p style={styles.listCount}>
                                    {t("common.employeeCount", { count: filtered.length })}
                                </p>
                                <div style={styles.pickerList}>
                                    {filtered.map((row, index) => {
                                        const active = Number(row.id) === selectedId;
                                        return (
                                            <button
                                                key={row.id}
                                                type="button"
                                                role="option"
                                                aria-selected={active}
                                                onMouseEnter={() => setHighlight(index)}
                                                onClick={() => pickEmployee(row)}
                                                style={{
                                                    ...styles.pickerItem,
                                                    ...(index === highlight ? styles.pickerItemActive : {}),
                                                    ...(active ? styles.pickerItemSelected : {}),
                                                }}
                                            >
                                                <span style={styles.personName}>{row.name}</span>
                                                <span style={styles.personMeta}>{employeeMeta(row, t, dateLoc)}</span>
                                            </button>
                                        );
                                    })}
                                    {filtered.length === 0 && <p style={styles.empty}>{t("admin.presence.noEmployee")}</p>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div style={styles.legend}>
                    <span style={{ ...styles.chip, background: "#c6f6d5", color: "#276749" }}>{t("admin.presence.fullDay")}</span>
                    <span style={{ ...styles.chip, background: "#fefcbf", color: "#975a16" }}>{t("admin.presence.halfDay")}</span>
                    {hsOn ? (
                        <span style={{ ...styles.chip, background: "#feebc8", color: "#c05621" }}>{t("admin.presence.overtime")}</span>
                    ) : null}
                    <span style={{ ...styles.chip, background: "#edf2f7", color: "#4a5568" }}>{t("admin.presence.unset")}</span>
                    <span style={{ ...styles.chip, background: "#bee3f8", color: "#2b6cb0" }}>{t("leave.paid")}</span>
                    <span style={{ ...styles.chip, background: "#e9d8fd", color: "#6b46c1" }}>{t("leave.unpaid")}</span>
                    <span style={{ ...styles.chip, background: "#fed7e2", color: "#97266d" }}>{t("leave.sick")}</span>
                    <span style={{ ...styles.chip, background: "#fafafa", color: "#718096" }}>{t("admin.presence.weekend")}</span>
                </div>

                <div style={styles.detailCard}>
                    {!detail ? (
                        <p style={styles.empty}>{t("admin.presence.pickEmployee")}</p>
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
        </>
    );
}

function AttendanceCalendar({ detail, period, dayUrl, overtimeEnabled = true }) {
    const t = useT();
    const locale = useLocale();
    const dateLoc = useDateLocale();
    const weekdays = weekdayShortLabels(locale);
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
                punches: day.punches || [],
                morningLeave: day.morning_leave || null,
                afternoonLeave: day.afternoon_leave || null,
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

    const entryFor = (key) => hoursByDate[key] || { morning: 0, afternoon: 0, morningOt: 0, afternoonOt: 0, note: "", punches: [], morningLeave: null, afternoonLeave: null };

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
        const current = entryFor(date);
        const morningHours = current.morningLeave ? 0 : nextMorning;
        const afternoonHours = current.afternoonLeave ? 0 : nextAfternoon;
        setSaving(true);
        router.put(
            dayUrl || namedRoute("admin.overtime.day", {}, "/admin/overtime/day"),
            {
                user_id: detail.employee.id,
                date,
                morning_hours: morningHours,
                afternoon_hours: afternoonHours,
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
        if ((slot === "morning" && current.morningLeave) || (slot === "afternoon" && current.afternoonLeave)) {
            return;
        }
        const nextMorning = slot === "morning" ? (current.morning > 0 ? 0 : hoursPerHalf) : current.morning;
        const nextAfternoon = slot === "afternoon" ? (current.afternoon > 0 ? 0 : hoursPerHalf) : current.afternoon;
        save(nextMorning, nextAfternoon, current.note, { close: false, date: key });
    };

    const submit = (e) => {
        e.preventDefault();
        save(morning, afternoon, note);
    };

    const selectedPunches = selectedDate ? entryFor(selectedDate).punches || [] : [];
    const selectedLeave = selectedDate ? entryFor(selectedDate) : null;
    const selectedMorningLeave = leaveTone(selectedLeave?.morningLeave, t);
    const selectedAfternoonLeave = leaveTone(selectedLeave?.afternoonLeave, t);
    const selectedLabel = selectedDate
        ? new Intl.DateTimeFormat(dateLoc, { weekday: "long", day: "numeric", month: "long" }).format(
            new Date(`${selectedDate}T12:00:00`)
        )
        : "";

    return (
        <>
            <div style={styles.detailHead}>
                <div>
                    <h2 style={styles.detailTitle}>{detail.employee.name}</h2>
                    <p style={styles.subtitle}>
                        {detail.employee.position || t("common.employee")} · {formatDays(detail.present_days || 0, dateLoc)}{" "}
                        {t("common.day", { count: detail.present_days || 0 })} · {formatHours(detail.worked_hours, dateLoc)}
                        {overtimeEnabled && Number(detail.overtime_hours || 0) > 0 ? ` · ${formatHours(detail.overtime_hours, dateLoc)} ${t("admin.payroll.overtime")}` : ""}
                    </p>
                </div>
            </div>

            <div className="app-agenda-scroll app-presence-scroll">
                <div className="app-agenda-head app-presence-head" style={styles.weekHead}>
                    {weekdays.map((day) => (
                        <div key={day} style={styles.weekCell}>{day}</div>
                    ))}
                </div>
                <div className="app-agenda-grid app-presence-grid" style={styles.grid}>
                    {days.map((day) => {
                        const key = formatDate(day);
                        const inMonth = day.getMonth() === month - 1;
                        const entry = entryFor(key);
                        const morningPresent = Number(entry.morning) > 0;
                        const afternoonPresent = Number(entry.afternoon) > 0;
                        const morningOt = overtimeEnabled ? overtimeFromHalf(entry.morning, hoursPerHalf) : 0;
                        const afternoonOt = overtimeEnabled ? overtimeFromHalf(entry.afternoon, hoursPerHalf) : 0;
                        const morningLeave = leaveTone(entry.morningLeave, t);
                        const afternoonLeave = leaveTone(entry.afternoonLeave, t);
                        const both = morningPresent && afternoonPresent;
                        const half = morningPresent !== afternoonPresent;
                        const hasOt = morningOt > 0 || afternoonOt > 0;
                        const hasLeave = Boolean(morningLeave || afternoonLeave);
                        const weekend = day.getDay() === 0 || day.getDay() === 6;
                        return (
                            <div
                                key={key}
                                className="app-presence-day"
                                style={{
                                    ...styles.day,
                                    opacity: inMonth ? 1 : 0.35,
                                    background: hasLeave ? "#f7fafc" : hasOt ? "#fffaf0" : both ? "#f0fff4" : half ? "#fffff0" : weekend ? "#fafafa" : "white",
                                    borderColor: key === selectedDate
                                        ? "var(--color-primary)"
                                        : key === today
                                            ? colors.primaryLight
                                            : colors.border,
                                    boxShadow: hasLeave
                                        ? "inset 0 0 0 1px #90cdf4"
                                        : hasOt
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
                                    title={t("admin.presence.enterHours")}
                                    style={styles.dayNumBtn}
                                >
                                    {day.getDate()}
                                </button>
                                {inMonth ? (
                                    <div style={styles.halves}>
                                        <button
                                            type="button"
                                            disabled={saving || Boolean(morningLeave)}
                                            onClick={() => toggleHalf(key, "morning", inMonth)}
                                            style={{
                                                ...styles.halfBtn,
                                                background: morningLeave
                                                    ? morningLeave.background
                                                    : morningOt > 0 ? "#feebc8" : morningPresent ? "#c6f6d5" : "#edf2f7",
                                                color: morningLeave
                                                    ? morningLeave.color
                                                    : morningOt > 0 ? "#c05621" : morningPresent ? "#276749" : "#718096",
                                                cursor: morningLeave ? "default" : "pointer",
                                            }}
                                        >
                                            <span>{t("leave.morning")}</span>
                                            <span>{morningLeave ? morningLeave.label : morningPresent ? formatHours(entry.morning, dateLoc) : t("common.dash")}</span>
                                            {!morningLeave && morningOt > 0 ? <span style={styles.otLine}>+{formatHours(morningOt, dateLoc)} {t("admin.payroll.overtime")}</span> : null}
                                        </button>
                                        <button
                                            type="button"
                                            disabled={saving || Boolean(afternoonLeave)}
                                            onClick={() => toggleHalf(key, "afternoon", inMonth)}
                                            style={{
                                                ...styles.halfBtn,
                                                background: afternoonLeave
                                                    ? afternoonLeave.background
                                                    : afternoonOt > 0 ? "#feebc8" : afternoonPresent ? "#c6f6d5" : "#edf2f7",
                                                color: afternoonLeave
                                                    ? afternoonLeave.color
                                                    : afternoonOt > 0 ? "#c05621" : afternoonPresent ? "#276749" : "#718096",
                                                cursor: afternoonLeave ? "default" : "pointer",
                                            }}
                                        >
                                            <span>{t("leave.morningShort")}</span>
                                            <span>{afternoonLeave ? afternoonLeave.label : afternoonPresent ? formatHours(entry.afternoon, dateLoc) : t("common.dash")}</span>
                                            {!afternoonLeave && afternoonOt > 0 ? <span style={styles.otLine}>+{formatHours(afternoonOt, dateLoc)} {t("admin.payroll.overtime")}</span> : null}
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
                                disabled={saving || Boolean(selectedMorningLeave && selectedAfternoonLeave)}
                                onClick={() => save(hoursPerHalf, hoursPerHalf, note)}
                            >
                                {t("admin.presence.fullDay")}
                            </button>
                            <button
                                type="button"
                                style={styles.absentBtn}
                                disabled={saving}
                                onClick={() => save(0, 0, "")}
                            >
                                {t("admin.presence.absent")}
                            </button>
                        </div>
                        <p style={styles.subtitle}>
                            {overtimeEnabled
                                ? t("admin.presence.manualHoursOt", { hours: formatHours(hoursPerHalf, dateLoc) })
                                : t("admin.presence.manualHours")}
                        </p>
                        <div style={styles.splitFields}>
                            <label style={styles.fieldLabel}>
                                {t("leave.morning")}
                                {selectedMorningLeave ? (
                                    <p style={styles.leaveHint}>{selectedMorningLeave.full}</p>
                                ) : (
                                    <>
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
                                    </>
                                )}
                            </label>
                            <label style={styles.fieldLabel}>
                                {t("leave.afternoon")}
                                {selectedAfternoonLeave ? (
                                    <p style={styles.leaveHint}>{selectedAfternoonLeave.full}</p>
                                ) : (
                                    <>
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
                                    </>
                                )}
                            </label>
                        </div>
                        {(errors?.morning_hours || errors?.afternoon_hours || errors?.hours) && (
                            <p style={styles.error}>{errors.morning_hours || errors.afternoon_hours || errors.hours}</p>
                        )}
                        <label style={styles.fieldLabel}>
                            {t("common.note")}
                            <input
                                type="text"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder={t("common.optional")}
                                style={styles.input}
                            />
                        </label>
                        {selectedPunches.length > 0 && (
                            <div style={styles.punchBox}>
                                <p style={styles.punchTitle}>{t("admin.presence.punches")}</p>
                                {selectedPunches.map((punch, index) => (
                                    <p key={`${punch.slot}-${punch.type}-${index}`} style={styles.punchLine}>
                                        {punch.slot === "morning" ? t("leave.morning") : t("leave.afternoon")}
                                        {" · "}
                                        {punch.type === "in" ? t("admin.presence.punchIn") : t("admin.presence.punchOut")}
                                        {" · "}
                                        {punch.at}
                                        {punch.distance_m != null ? ` · ${Number(punch.distance_m).toLocaleString(dateLoc)} m` : ""}
                                    </p>
                                ))}
                            </div>
                        )}
                        <div style={styles.modalActions}>
                            <button type="button" style={styles.cancelBtn} onClick={closeDay}>
                                {t("common.close")}
                            </button>
                            <button type="submit" style={styles.save} disabled={saving}>
                                {saving ? t("common.saving") : t("common.save")}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
}

function HalfBreakdown({ hours, half, enabled = true }) {
    const t = useT();
    const dateLoc = useDateLocale();
    if (!enabled) return null;
    const overtime = overtimeFromHalf(hours, half);
    if (overtime <= 0) return null;

    return (
        <span style={styles.otHint}>
            {t("admin.presence.otHint", { hours: formatHours(half, dateLoc), ot: formatHours(overtime, dateLoc) })}
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
    monthNav: { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" },
    monthTitle: { fontSize: "18px", fontWeight: 600, color: colors.dark, margin: 0, textTransform: "capitalize", minWidth: "180px", textAlign: "center" },
    navBtn: { width: "36px", height: "36px", border: `1px solid ${colors.border}`, background: "white", borderRadius: "8px", cursor: "pointer", fontSize: "16px" },
    todayBtn: { padding: "8px 12px", border: "none", background: "var(--color-primary)", color: "white", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer" },
    searchWrap: { position: "relative", flex: "1 1 280px", minWidth: "240px", maxWidth: "460px", marginLeft: "auto", zIndex: 5 },
    searchField: { position: "relative" },
    searchIcon: { position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: colors.muted, pointerEvents: "none" },
    search: { width: "100%", boxSizing: "border-box", padding: "10px 36px 10px 36px", border: `1px solid ${colors.border}`, borderRadius: "10px", fontSize: "13px", background: "white" },
    searchClear: { position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", width: "24px", height: "24px", border: "none", background: "transparent", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
    searchClearIcon: { width: "12px", height: "12px", opacity: 0.55 },
    pickerMenu: {
        position: "absolute",
        left: 0,
        right: 0,
        top: "calc(100% + 6px)",
        background: "white",
        border: `1px solid ${colors.border}`,
        borderRadius: "12px",
        boxShadow: "0 16px 40px rgba(15, 23, 42, 0.14)",
        padding: "10px",
        zIndex: 30,
    },
    pickerList: { display: "flex", flexDirection: "column", gap: "4px", maxHeight: "320px", overflow: "auto" },
    pickerItem: { display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "2px", width: "100%", border: "none", background: "white", borderRadius: "8px", padding: "8px 10px", cursor: "pointer", textAlign: "left" },
    pickerItemActive: { background: "#edf2f7" },
    pickerItemSelected: { background: "#eef2ff" },
    legend: { display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" },
    chip: { fontSize: "12px", fontWeight: 600, padding: "4px 8px", borderRadius: "999px" },
    listCount: { margin: "0 4px 8px", fontSize: "12px", fontWeight: 600, color: colors.muted },
    personName: { fontSize: "13px", fontWeight: 700, color: colors.dark },
    personMeta: { fontSize: "12px", color: colors.muted },
    detailCard: { background: "white", border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "16px 18px", minHeight: "420px" },
    empty: { margin: 0, color: colors.muted, fontSize: "14px", padding: "12px 4px" },
    detailHead: { marginBottom: "14px" },
    detailTitle: { margin: 0, fontSize: "16px", color: colors.dark },
    weekHead: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px", marginBottom: "8px" },
    weekCell: { fontSize: "12px", fontWeight: 600, color: colors.muted, textAlign: "center" },
    grid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px" },
    day: { aspectRatio: "1 / 1", width: "100%", minHeight: 0, overflow: "hidden", boxSizing: "border-box", border: `1px solid ${colors.border}`, borderRadius: "10px", padding: "8px", display: "flex", flexDirection: "column", alignItems: "stretch", gap: "6px", textAlign: "left" },
    dayNumBtn: { alignSelf: "flex-start", border: "none", background: "transparent", padding: 0, fontSize: "12px", fontWeight: 700, color: colors.dark, cursor: "pointer" },
    halves: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", width: "100%", flex: 1, minHeight: 0 },
    halfBtn: { border: "none", borderRadius: "8px", padding: "6px 4px", display: "flex", flexDirection: "column", justifyContent: "center", gap: "2px", fontSize: "10px", fontWeight: 700, cursor: "pointer", lineHeight: 1.2, minHeight: 0, overflow: "hidden" },
    otLine: { fontSize: "9px", fontWeight: 800 },
    otHint: { fontSize: "11px", fontWeight: 600, color: "#c05621" },
    leaveHint: { margin: 0, fontSize: "13px", fontWeight: 600, color: "#2b6cb0" },
    notePreview: { fontSize: "11px", color: colors.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" },
    overlay: { position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2500, padding: "16px" },
    punchBox: { background: "#f7fafc", border: `1px solid ${colors.border}`, borderRadius: "8px", padding: "10px 12px" },
    punchTitle: { margin: "0 0 6px", fontSize: "12px", fontWeight: 700, color: colors.dark },
    punchLine: { margin: "0 0 4px", fontSize: "12px", color: colors.muted },
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
