import { Head, router, usePage } from "@inertiajs/react";
import { useState } from "react";
import BrandMark from "@/Components/BrandMark";
import HeaderTools from "@/Components/HeaderTools";
import Sidebar from "@/Components/User/Sidebar";
import { colors } from "@/config/colors";
import { useSidebar } from "@/hooks/useSidebar";
import { geolocationErrorMessage, getCurrentCoords } from "@/utils/geolocation";
import { useDateLocale, useLocale, useT } from "@/i18n";

function formatDay(value, locale) {
    if (!value) return "";
    return new Intl.DateTimeFormat(locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
    }).format(new Date(`${value}T12:00:00Z`));
}

function SlotCard({ slot, punching, onPunch, t }) {
    return (
        <div style={styles.card}>
            <div style={styles.cardHead}>
                <h2 style={styles.cardTitle}>{t(`attendance.${slot.key}`) || slot.label}</h2>
                <p style={styles.cardMeta}>
                    {slot.start} — {slot.end}
                </p>
            </div>
            <div style={styles.times}>
                <p style={styles.timeLine}>
                    {t("attendance.arrival")} : <strong>{slot.in?.at || t("common.dash")}</strong>
                </p>
                <p style={styles.timeLine}>
                    {t("attendance.departure")} : <strong>{slot.out?.at || t("common.dash")}</strong>
                </p>
            </div>
            <div style={styles.actions}>
                <button
                    type="button"
                    disabled={!slot.can_in || punching}
                    onClick={() => onPunch(slot.key, "in")}
                    style={{
                        ...styles.button,
                        ...styles.primary,
                        opacity: !slot.can_in || punching ? 0.45 : 1,
                        cursor: !slot.can_in || punching ? "not-allowed" : "pointer",
                    }}
                >
                    {punching ? t("attendance.punching") : t("attendance.punchIn")}
                </button>
                <button
                    type="button"
                    disabled={!slot.can_out || punching}
                    onClick={() => onPunch(slot.key, "out")}
                    style={{
                        ...styles.button,
                        ...styles.secondary,
                        opacity: !slot.can_out || punching ? 0.45 : 1,
                        cursor: !slot.can_out || punching ? "not-allowed" : "pointer",
                    }}
                >
                    {punching ? t("attendance.punching") : t("attendance.punchOut")}
                </button>
            </div>
            {slot.reason ? <p style={styles.reason}>{slot.reason}</p> : null}
        </div>
    );
}

export default function Today({
    today,
    now,
    timezone,
    workplace_ready = false,
    radius_m = 150,
    slots = {},
}) {
    const t = useT();
    const locale = useLocale();
    const dateLoc = useDateLocale();
    const { auth, errors, flash } = usePage().props;
    const user = auth?.user;
    const { isOpen, setIsOpen, offset } = useSidebar();
    const [punching, setPunching] = useState(false);
    const [geoError, setGeoError] = useState("");

    const punch = async (slot, type) => {
        setGeoError("");
        setPunching(true);
        try {
            const pos = await getCurrentCoords();
            router.post(
                route("attendance.punch"),
                {
                    slot,
                    type,
                    latitude: pos.latitude,
                    longitude: pos.longitude,
                    accuracy: pos.accuracy,
                },
                {
                    preserveScroll: true,
                    onFinish: () => setPunching(false),
                }
            );
        } catch (error) {
            setPunching(false);
            setGeoError(geolocationErrorMessage(error, { forPunch: true, locale }));
        }
    };

    return (
        <>
            <Head title={t("attendance.title")} />
            <Sidebar user={user} currentPage="attendance.index" isOpen={isOpen} setIsOpen={setIsOpen} />
            <div className="app-page" style={{ ...styles.page, marginLeft: offset }}>
                <div className="app-header" style={styles.header}>
                    <BrandMark />
                    <div>
                        <h1 style={styles.title}>{t("attendance.title")}</h1>
                        <p style={styles.subtitle}>
                            {formatDay(today, dateLoc)} · {now} ({timezone})
                        </p>
                    </div>
                    <HeaderTools />
                </div>

                {flash?.success ? <p style={styles.success}>{flash.success}</p> : null}
                {errors?.punch ? <p style={styles.error}>{errors.punch}</p> : null}
                {geoError ? <p style={styles.error}>{geoError}</p> : null}

                {!workplace_ready ? (
                    <p style={styles.warning}>
                        {t("attendance.workplaceMissing")}
                    </p>
                ) : (
                    <p style={styles.hint}>
                        {t("attendance.hint", { radius: radius_m })}
                    </p>
                )}

                <div style={styles.grid}>
                    <SlotCard
                        slot={slots.morning || { key: "morning", label: t("attendance.morning"), start: "06:00", end: "12:30", can_in: false, can_out: false }}
                        punching={punching}
                        onPunch={punch}
                        t={t}
                    />
                    <SlotCard
                        slot={slots.afternoon || { key: "afternoon", label: t("attendance.afternoon"), start: "12:00", end: "20:00", can_in: false, can_out: false }}
                        punching={punching}
                        onPunch={punch}
                        t={t}
                    />
                </div>
            </div>
        </>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        background: "var(--color-background)",
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
    subtitle: { fontSize: "13px", color: colors.muted, margin: 0, textTransform: "capitalize" },
    success: { background: "#c6f6d5", color: "#276749", padding: "10px 14px", borderRadius: "8px", marginBottom: "16px" },
    error: { background: "#fed7d7", color: "#c53030", padding: "10px 14px", borderRadius: "8px", marginBottom: "16px" },
    warning: { background: "#feebc8", color: "#c05621", padding: "10px 14px", borderRadius: "8px", marginBottom: "16px" },
    hint: { fontSize: "13px", color: colors.muted, margin: "0 0 16px" },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", maxWidth: "760px" },
    card: {
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: "12px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
    },
    cardHead: { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px" },
    cardTitle: { margin: 0, fontSize: "16px", fontWeight: 700, color: colors.dark },
    cardMeta: { margin: 0, fontSize: "12px", color: colors.muted, fontWeight: 600 },
    times: { display: "flex", flexDirection: "column", gap: "4px" },
    timeLine: { margin: 0, fontSize: "14px", color: colors.dark },
    actions: { display: "flex", gap: "8px" },
    button: {
        flex: 1,
        height: "38px",
        padding: "0 12px",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: 600,
        boxSizing: "border-box",
    },
    primary: {
        background: "var(--color-primary)",
        color: "white",
        border: "none",
    },
    secondary: {
        background: "white",
        color: colors.dark,
        border: `1px solid ${colors.border}`,
    },
    reason: { margin: 0, fontSize: "12px", color: colors.muted, lineHeight: 1.4 },
};
