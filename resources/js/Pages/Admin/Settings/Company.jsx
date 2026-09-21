import { Head, useForm, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import BrandMark from "@/Components/BrandMark";
import FeedbackDialog from "@/Components/FeedbackDialog";
import HeaderTools from "@/Components/HeaderTools";
import IconButton from "@/Components/IconButton";
import WorkplaceMap from "@/Components/WorkplaceMap";
import Sidebar from "../../../Components/Admin/Sidebar";
import { colors } from "@/config/colors";
import { cloneDefaultOvertimeTypes, normalizeOvertimePositions, normalizeOvertimeTypes } from "@/config/overtimeTypes";
import { useSidebar } from "@/hooks/useSidebar";
import { useLocale, useT } from "@/i18n";

const DEFAULT_IRSA_BRACKETS = [
    { min: 0, max: 350000, rate: 0 },
    { min: 350001, max: 400000, rate: 5 },
    { min: 400001, max: 500000, rate: 10 },
    { min: 500001, max: 600000, rate: 15 },
    { min: 600001, max: 4000000, rate: 20 },
    { min: 4000001, max: "", rate: 25 },
];

const RADIUS_PRESETS = [50, 100, 150, 200, 300, 500];

function defaultHalf(hoursPerDay) {
    const day = Number(hoursPerDay);
    if (!day || Number.isNaN(day)) return "4";
    return String(Math.round((day / 2) * 100) / 100);
}

function coefficientFromPremium(premium) {
    const n = Number(premium);
    if (Number.isNaN(n)) return "1.300";
    return (1 + Math.max(0, n) / 100).toFixed(3);
}

function asFlag(value) {
    return value === true || value === 1 || value === "1";
}

function normalizeBrackets(rows) {
    if (!Array.isArray(rows) || rows.length === 0) return DEFAULT_IRSA_BRACKETS;
    return rows.map((row) => ({
        min: row.min ?? 0,
        max: row.max === null || row.max === undefined ? "" : row.max,
        rate: row.rate ?? 0,
    }));
}

export default function Company({ admin, settings, irsa_brackets, overtime_types, overtime_positions }) {
    const t = useT();
    const locale = useLocale();
    const { flash } = usePage().props;
    const { isOpen, setIsOpen, offset } = useSidebar();
    const [openSection, setOpenSection] = useState("identity");
    const [feedback, setFeedback] = useState(null);
    const [newPosition, setNewPosition] = useState("");
    const [selectedPosition, setSelectedPosition] = useState(0);
    const { data, setData, post, processing, errors, transform } = useForm({
        company_name: settings?.company_name || "",
        owner_name: settings?.owner_name || "",
        nif: settings?.nif || "",
        stat: settings?.stat || "",
        rcs: settings?.rcs || "",
        logo: null,
        overtime_hours_per_day: settings?.overtime_hours_per_day ?? "8",
        overtime_hours_per_half: settings?.overtime_hours_per_half ?? defaultHalf(settings?.overtime_hours_per_day ?? 8),
        overtime_enabled: settings?.overtime_enabled !== false,
        overtime_types: normalizeOvertimeTypes(overtime_types ?? settings?.overtime_types),
        overtime_positions: normalizeOvertimePositions(
            overtime_positions,
            overtime_types ?? settings?.overtime_types
        ),
        cnaps_percent: settings?.cnaps_percent ?? "1",
        cnaps_employer_percent: settings?.cnaps_employer_percent ?? "13",
        cnaps_employee_percent: settings?.cnaps_employee_percent ?? settings?.cnaps_percent ?? "1",
        irsa_brackets: normalizeBrackets(irsa_brackets),
        attendance_timezone: settings?.attendance_timezone || "Indian/Antananarivo",
        attendance_morning_start: settings?.attendance_morning_start || "06:00",
        attendance_morning_end: settings?.attendance_morning_end || "12:30",
        attendance_afternoon_start: settings?.attendance_afternoon_start || "12:00",
        attendance_afternoon_end: settings?.attendance_afternoon_end || "20:00",
        attendance_latitude: settings?.attendance_latitude ?? "",
        attendance_longitude: settings?.attendance_longitude ?? "",
        attendance_radius_m: settings?.attendance_radius_m ?? 150,
    });

    useEffect(() => {
        if (flash?.success) {
            setFeedback({
                variant: "success",
                title: t("admin.company.savedTitle"),
                message: flash.success,
            });
        }
    }, [flash?.success]);

    const submit = (e) => {
        e.preventDefault();
        transform((current) => {
            const { overtime_types, overtime_positions, ...rest } = current;
            return {
                ...rest,
                overtime_enabled: current.overtime_enabled ? 1 : 0,
                overtime_types_json: JSON.stringify(
                    (overtime_types || []).map((row) => ({
                        ...row,
                        enabled: row.enabled ? 1 : 0,
                    }))
                ),
                overtime_positions_json: JSON.stringify(
                    (overtime_positions || []).map((row) => ({
                        position: row.position,
                        enabled: row.enabled ? 1 : 0,
                        types: (row.types || []).map((type) => ({
                            ...type,
                            enabled: type.enabled ? 1 : 0,
                        })),
                    }))
                ),
            };
        });
        post(route("admin.settings.company.update"), {
            forceFormData: true,
            onSuccess: () => {
                setFeedback({
                    variant: "success",
                    title: t("admin.company.savedTitle"),
                    message: t("admin.company.savedBody"),
                });
            },
            onError: () => {
                setFeedback({
                    variant: "error",
                    title: t("admin.company.errorTitle"),
                    message: t("admin.company.errorBody"),
                });
            },
        });
    };

    const toggle = (id) => setOpenSection((current) => (current === id ? null : id));

    const updateBracket = (index, field, value) => {
        const next = data.irsa_brackets.map((row, i) => (i === index ? { ...row, [field]: value } : row));
        setData("irsa_brackets", next);
    };

    const addBracket = () => {
        const last = data.irsa_brackets[data.irsa_brackets.length - 1];
        setData("irsa_brackets", [
            ...data.irsa_brackets,
            { min: last?.max ? Number(last.max) + 1 : 0, max: "", rate: 0 },
        ]);
    };

    const removeBracket = (index) => {
        if (data.irsa_brackets.length <= 1) return;
        setData("irsa_brackets", data.irsa_brackets.filter((_, i) => i !== index));
    };

    const updatePosition = (index, patch) => {
        setData(
            "overtime_positions",
            data.overtime_positions.map((row, i) => (i === index ? { ...row, ...patch } : row))
        );
    };

    const updatePositionType = (positionIndex, typeIndex, field, value) => {
        const row = data.overtime_positions[positionIndex];
        if (!row) return;
        updatePosition(positionIndex, {
            types: row.types.map((type, i) => (i === typeIndex ? { ...type, [field]: value } : type)),
        });
    };

    const addPositionType = (positionIndex) => {
        const row = data.overtime_positions[positionIndex];
        if (!row) return;
        const n = row.types.length + 1;
        updatePosition(positionIndex, {
            types: [
                ...row.types,
                { key: `hs_${n}`, code: `HS_${n}`, label: t("admin.company.newType"), premium: 30, enabled: true },
            ],
        });
    };

    const removePositionType = (positionIndex, typeIndex) => {
        const row = data.overtime_positions[positionIndex];
        if (!row || row.types.length <= 1) return;
        updatePosition(positionIndex, {
            types: row.types.filter((_, i) => i !== typeIndex),
        });
    };

    const addPosition = () => {
        const name = newPosition.trim();
        if (!name) return;
        const exists = data.overtime_positions.some(
            (row) => row.position.toLowerCase() === name.toLowerCase()
        );
        if (!exists) {
            const next = [
                ...data.overtime_positions,
                { position: name, enabled: true, types: cloneDefaultOvertimeTypes() },
            ].sort((a, b) => a.position.localeCompare(b.position, locale === "en" ? "en" : "fr"));
            setData("overtime_positions", next);
            setSelectedPosition(next.findIndex((row) => row.position === name));
        }
        setNewPosition("");
    };

    const currentIndex = data.overtime_positions.length
        ? Math.min(selectedPosition, data.overtime_positions.length - 1)
        : -1;
    const currentPos = currentIndex >= 0 ? data.overtime_positions[currentIndex] : null;

    return (
        <>
            <Head title={t("admin.company.title")} />
            <Sidebar admin={admin} currentPage="admin.settings.company.edit" isOpen={isOpen} setIsOpen={setIsOpen} />
            <div className="app-page" style={{ ...styles.page, marginLeft: offset }}>
                <div className="app-header" style={styles.header}>
                    <BrandMark />
                    <div>
                        <h1 style={styles.title}>{t("admin.company.heading")}</h1>
                        <p style={styles.subtitle}>{t("admin.company.subtitle")}</p>
                    </div>
                    <HeaderTools />
                </div>

                <form onSubmit={submit} style={styles.list}>
                    <Accordion
                        title={t("admin.company.identity")}
                        open={openSection === "identity"}
                        onToggle={() => toggle("identity")}
                    >
                        <Field label={t("admin.company.companyName")} value={data.company_name} onChange={(v) => setData("company_name", v)} error={errors.company_name} />
                        <Field label={t("admin.company.owner")} value={data.owner_name} onChange={(v) => setData("owner_name", v)} error={errors.owner_name} />
                        <Field label="NIF" value={data.nif} onChange={(v) => setData("nif", v)} error={errors.nif} />
                        <Field label="STAT" value={data.stat} onChange={(v) => setData("stat", v)} error={errors.stat} />
                        <Field label="RCS" value={data.rcs} onChange={(v) => setData("rcs", v)} error={errors.rcs} />
                        <div style={styles.formGroup}>
                            <label style={styles.label}>{t("admin.company.logo")}</label>
                            <input
                                type="file"
                                accept="image/png,image/jpeg"
                                onChange={(e) => setData("logo", e.target.files?.[0] || null)}
                                style={styles.input}
                            />
                            {errors.logo && <p style={styles.error}>{errors.logo}</p>}
                        </div>
                    </Accordion>

                    <Accordion
                        title={t("admin.company.workday")}
                        open={openSection === "overtime"}
                        onToggle={() => toggle("overtime")}
                    >
                        <Field
                            label={t("admin.company.hoursPerDay")}
                            type="number"
                            step="0.25"
                            min="0"
                            max="24"
                            value={data.overtime_hours_per_day}
                            onChange={(v) => {
                                const next = { ...data, overtime_hours_per_day: v, logo: data.logo };
                                const day = Number(v);
                                if (day > 0) {
                                    next.overtime_hours_per_half = defaultHalf(day);
                                }
                                setData(next);
                            }}
                            error={errors.overtime_hours_per_day}
                        />
                    </Accordion>

                    <Accordion
                        title={t("admin.company.attendance")}
                        open={openSection === "attendance"}
                        onToggle={() => toggle("attendance")}
                    >
                        <p style={styles.scaleHint}>
                            {t("admin.company.attendanceHint")}
                        </p>
                        <Field
                            label={t("admin.company.timezone")}
                            value={data.attendance_timezone}
                            onChange={(v) => setData("attendance_timezone", v)}
                            error={errors.attendance_timezone}
                        />
                        <div className="app-grid-2" style={styles.grid}>
                            <Field
                                label={t("admin.company.morningStart")}
                                type="time"
                                value={data.attendance_morning_start}
                                onChange={(v) => setData("attendance_morning_start", v)}
                                error={errors.attendance_morning_start}
                            />
                            <Field
                                label={t("admin.company.morningEnd")}
                                type="time"
                                value={data.attendance_morning_end}
                                onChange={(v) => setData("attendance_morning_end", v)}
                                error={errors.attendance_morning_end}
                            />
                            <Field
                                label={t("admin.company.afternoonStart")}
                                type="time"
                                value={data.attendance_afternoon_start}
                                onChange={(v) => setData("attendance_afternoon_start", v)}
                                error={errors.attendance_afternoon_start}
                            />
                            <Field
                                label={t("admin.company.afternoonEnd")}
                                type="time"
                                value={data.attendance_afternoon_end}
                                onChange={(v) => setData("attendance_afternoon_end", v)}
                                error={errors.attendance_afternoon_end}
                            />
                        </div>
                    </Accordion>

                    <Accordion
                        title={t("admin.company.location")}
                        open={openSection === "localisation"}
                        onToggle={() => toggle("localisation")}
                    >
                        <p style={styles.scaleHint}>
                            {t("admin.company.locationHint")}
                        </p>
                        <WorkplaceMap
                            latitude={data.attendance_latitude}
                            longitude={data.attendance_longitude}
                            radius={data.attendance_radius_m}
                            lockPosition={Boolean(data.attendance_latitude && data.attendance_longitude)}
                            onChange={({ latitude, longitude }) => {
                                setData((current) => ({
                                    ...current,
                                    attendance_latitude: latitude,
                                    attendance_longitude: longitude,
                                }));
                            }}
                        />
                        <div style={styles.geofence}>
                            <p style={styles.label}>{t("admin.company.geofence")}</p>
                            <p style={styles.scaleHint}>
                                {data.attendance_latitude && data.attendance_longitude
                                    ? t("admin.company.geofenceLocked")
                                    : t("admin.company.geofenceUnlock")}
                            </p>
                            <div style={styles.geofenceRow}>
                                <input
                                    type="range"
                                    min="20"
                                    max="1000"
                                    step="10"
                                    value={Math.min(1000, Math.max(20, Number(data.attendance_radius_m) || 150))}
                                    onChange={(e) => setData("attendance_radius_m", e.target.value)}
                                    style={styles.slider}
                                />
                                <input
                                    type="number"
                                    min="20"
                                    max="5000"
                                    step="1"
                                    value={data.attendance_radius_m}
                                    onChange={(e) => setData("attendance_radius_m", e.target.value)}
                                    style={{ ...styles.input, width: "110px", margin: 0 }}
                                />
                                <span style={styles.geofenceUnit}>m</span>
                            </div>
                            {errors.attendance_radius_m ? (
                                <p style={styles.error}>{errors.attendance_radius_m}</p>
                            ) : null}
                            <div style={styles.scaleActions}>
                                {RADIUS_PRESETS.map((meters) => (
                                    <button
                                        key={meters}
                                        type="button"
                                        onClick={() => setData("attendance_radius_m", meters)}
                                        style={{
                                            ...styles.secondary,
                                            background:
                                                Number(data.attendance_radius_m) === meters
                                                    ? "var(--color-primary)"
                                                    : "white",
                                            color: Number(data.attendance_radius_m) === meters ? "white" : colors.dark,
                                            borderColor:
                                                Number(data.attendance_radius_m) === meters
                                                    ? "var(--color-primary)"
                                                    : colors.border,
                                        }}
                                    >
                                        {meters} m
                                    </button>
                                ))}
                            </div>
                        </div>
                    </Accordion>

                    <Accordion
                        title={t("admin.company.overtime")}
                        open={openSection === "overtime_rules"}
                        onToggle={() => toggle("overtime_rules")}
                    >
                        <label style={styles.switchRow}>
                            <input
                                type="checkbox"
                                checked={asFlag(data.overtime_enabled)}
                                onChange={(e) => setData("overtime_enabled", e.target.checked)}
                            />
                            <span><strong>{t("admin.company.overtimeEnable")}</strong></span>
                        </label>

                        {asFlag(data.overtime_enabled) && (
                            <>
                                <Field
                                    label={t("admin.company.halfThreshold")}
                                    type="number"
                                    step="0.25"
                                    min="0"
                                    max="12"
                                    value={data.overtime_hours_per_half}
                                    onChange={(v) => setData("overtime_hours_per_half", v)}
                                    error={errors.overtime_hours_per_half}
                                />
                                <p style={styles.scaleHint}>
                                    {t("admin.company.halfHint")}
                                </p>

                                <div style={styles.block}>
                                    <p style={styles.blockTitle}>{t("admin.company.byPosition")}</p>
                                    <div style={styles.posToolbar}>
                                        {data.overtime_positions.length > 0 ? (
                                            <select
                                                value={currentIndex}
                                                onChange={(e) => setSelectedPosition(Number(e.target.value))}
                                                style={styles.select}
                                            >
                                                {data.overtime_positions.map((row, index) => (
                                                    <option key={row.position} value={index}>
                                                        {row.position}{asFlag(row.enabled) ? "" : ` — ${t("admin.company.disabled")}`}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : null}
                                        <div style={styles.addRow}>
                                            <input
                                                value={newPosition}
                                                onChange={(e) => setNewPosition(e.target.value)}
                                                placeholder={t("admin.company.newPosition")}
                                                style={styles.scaleInput}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        e.preventDefault();
                                                        addPosition();
                                                    }
                                                }}
                                            />
                                            <IconButton
                                                icon="add"
                                                label={t("admin.company.addPosition")}
                                                variant="primary"
                                                showLabel
                                                onClick={addPosition}
                                            />
                                        </div>
                                    </div>

                                    {!currentPos ? (
                                        <p style={styles.emptyHint}>{t("admin.company.noPosition")}</p>
                                    ) : (
                                        <>
                                            <label style={styles.switchInline}>
                                                <input
                                                    type="checkbox"
                                                    checked={asFlag(currentPos.enabled)}
                                                    onChange={(e) => updatePosition(currentIndex, { enabled: e.target.checked })}
                                                />
                                                <span>{t("admin.company.enableFor", { name: currentPos.position })}</span>
                                            </label>

                                            {asFlag(currentPos.enabled) ? (
                                                <>
                                                    <div className="app-table-wrap">
                                                    <div style={styles.otHead}>
                                                        <span />
                                                        <span>{t("admin.company.type")}</span>
                                                        <span>{t("admin.company.premium")}</span>
                                                        <span>{t("admin.company.coeff")}</span>
                                                        <span />
                                                    </div>
                                                    {currentPos.types.map((row, index) => (
                                                        <div key={row.key || index} style={styles.otRow}>
                                                            <input
                                                                type="checkbox"
                                                                checked={asFlag(row.enabled)}
                                                                onChange={(e) => updatePositionType(currentIndex, index, "enabled", e.target.checked)}
                                                                aria-label={t("admin.company.enableType", { name: row.label || row.code })}
                                                            />
                                                            <input
                                                                value={row.label}
                                                                onChange={(e) => updatePositionType(currentIndex, index, "label", e.target.value)}
                                                                style={styles.scaleInput}
                                                            />
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="400"
                                                                step="0.1"
                                                                value={row.premium}
                                                                onChange={(e) => updatePositionType(currentIndex, index, "premium", e.target.value)}
                                                                style={styles.scaleInput}
                                                            />
                                                            <span style={styles.coeff}>× {coefficientFromPremium(row.premium)}</span>
                                                            <IconButton
                                                                icon="less"
                                                                label={t("admin.company.removeType")}
                                                                variant="ghost"
                                                                onClick={() => removePositionType(currentIndex, index)}
                                                                disabled={currentPos.types.length <= 1}
                                                            />
                                                        </div>
                                                    ))}
                                                    </div>
                                                    <div style={styles.scaleActions}>
                                                        <IconButton
                                                            icon="add"
                                                            label={t("admin.company.addType")}
                                                            variant="primary"
                                                            showLabel
                                                            onClick={() => addPositionType(currentIndex)}
                                                        />
                                                        <button
                                                            type="button"
                                                            style={styles.secondary}
                                                            onClick={() => updatePosition(currentIndex, { types: cloneDefaultOvertimeTypes() })}
                                                        >
                                                            {t("admin.company.defaultTypes")}
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <p style={styles.emptyHint}>{t("admin.company.noOt")}</p>
                                            )}
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </Accordion>

                    <Accordion
                        title={t("admin.company.contributions")}
                        open={openSection === "contributions"}
                        onToggle={() => toggle("contributions")}
                    >
                        <p style={styles.scaleTitle}>CNAPS</p>
                        <div className="app-grid-2" style={styles.grid}>
                            <div>
                                <p style={styles.partTitle}>{t("admin.company.employerShare")}</p>
                                <Field
                                    label={t("admin.company.rate")}
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={data.cnaps_employer_percent}
                                    onChange={(v) => setData("cnaps_employer_percent", v)}
                                    error={errors.cnaps_employer_percent}
                                />
                                <p style={styles.scaleHint}>{t("admin.company.employerHint")}</p>
                            </div>
                            <div>
                                <p style={styles.partTitle}>{t("admin.company.employeeShare")}</p>
                                <Field
                                    label={t("admin.company.rate")}
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={data.cnaps_employee_percent}
                                    onChange={(v) => setData("cnaps_employee_percent", v)}
                                    error={errors.cnaps_employee_percent}
                                />
                                <p style={styles.scaleHint}>{t("admin.company.employeeHint")}</p>
                            </div>
                        </div>
                        <p style={styles.scaleTitle}>{t("admin.company.irsa")}</p>
                        <p style={styles.scaleHint}>{t("admin.company.irsaHint")}</p>
                        <div style={styles.scaleHead}>
                            <span>{t("admin.company.min")}</span>
                            <span>{t("admin.company.max")}</span>
                            <span>{t("admin.company.ratePct")}</span>
                            <span />
                        </div>
                        {data.irsa_brackets.map((row, index) => (
                            <div key={index} style={styles.scaleRow}>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={row.min}
                                    onChange={(e) => updateBracket(index, "min", e.target.value)}
                                    style={styles.scaleInput}
                                />
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={row.max}
                                    placeholder={t("admin.company.andMore")}
                                    onChange={(e) => updateBracket(index, "max", e.target.value)}
                                    style={styles.scaleInput}
                                />
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={row.rate}
                                    onChange={(e) => updateBracket(index, "rate", e.target.value)}
                                    style={styles.scaleInput}
                                />
                                <IconButton
                                    icon="less"
                                    label={t("admin.company.removeBracket")}
                                    variant="ghost"
                                    onClick={() => removeBracket(index)}
                                    disabled={data.irsa_brackets.length <= 1}
                                />
                            </div>
                        ))}
                        {errors.irsa_brackets && <p style={styles.error}>{errors.irsa_brackets}</p>}
                        <div style={styles.scaleActions}>
                            <IconButton
                                icon="add"
                                label={t("admin.company.addBracket")}
                                variant="primary"
                                showLabel
                                onClick={addBracket}
                            />
                            <button type="button" style={styles.secondary} onClick={() => setData("irsa_brackets", DEFAULT_IRSA_BRACKETS)}>
                                {t("admin.company.scale2026")}
                            </button>
                        </div>
                    </Accordion>

                    <button type="submit" disabled={processing} style={styles.button}>
                        {processing ? t("common.saving") : t("common.save")}
                    </button>
                </form>
                <FeedbackDialog
                    show={!!feedback}
                    variant={feedback?.variant || "success"}
                    title={feedback?.title}
                    message={feedback?.message}
                    onClose={() => setFeedback(null)}
                />
            </div>
        </>
    );
}

function Accordion({ title, open, onToggle, children }) {
    return (
        <div style={styles.item}>
            <button type="button" style={styles.itemHeader} onClick={onToggle} aria-expanded={open}>
                <span>{title}</span>
                <span style={styles.chevron}>{open ? "▾" : "▸"}</span>
            </button>
            {open && <div style={styles.itemBody}>{children}</div>}
        </div>
    );
}

function Field({ label, value, onChange, error, type = "text", step, min, max }) {
    return (
        <div style={styles.formGroup}>
            <label style={styles.label}>{label}</label>
            <input
                type={type}
                step={step}
                min={min}
                max={max}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                style={{ ...styles.input, borderColor: error ? colors.error : colors.border }}
            />
            {error && <p style={styles.error}>{error}</p>}
        </div>
    );
}

const styles = {
    page: { minHeight: "100vh", background: "var(--color-background)", fontFamily: "system-ui, sans-serif", padding: "24px", transition: "margin-left 0.3s ease" },
    header: { display: "flex", alignItems: "center", gap: "16px", background: "white", padding: "20px 24px", borderRadius: "12px", marginBottom: "24px", border: `1px solid ${colors.border}` },
    title: { fontSize: "18px", fontWeight: "600", color: colors.dark, margin: 0 },
    subtitle: { fontSize: "13px", color: colors.muted, margin: 0 },
    list: { width: "100%", maxWidth: "100%", display: "flex", flexDirection: "column", gap: "12px" },
    item: { background: "white", borderRadius: "12px", border: `1px solid ${colors.border}`, overflow: "hidden" },
    itemHeader: {
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        padding: "16px 20px",
        border: "none",
        background: "transparent",
        cursor: "pointer",
        fontSize: "15px",
        fontWeight: 700,
        color: colors.dark,
        fontFamily: "inherit",
        textAlign: "left",
    },
    chevron: { color: colors.muted, fontSize: "14px" },
    itemBody: { padding: "16px 20px 20px", borderTop: `1px solid ${colors.border}` },
    grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px", paddingTop: "16px" },
    formGroup: { margin: "16px 0 0" },
    label: { display: "block", fontSize: "13px", fontWeight: "600", color: colors.dark, marginBottom: "8px" },
    input: { width: "100%", padding: "10px 12px", fontSize: "14px", border: `1px solid ${colors.border}`, borderRadius: "8px", boxSizing: "border-box", fontFamily: "system-ui, sans-serif" },
    error: { fontSize: "12px", color: colors.error, margin: "4px 0 0" },
    scaleTitle: { fontSize: "13px", fontWeight: 700, color: colors.dark, margin: "20px 0 4px" },
    partTitle: { fontSize: "13px", fontWeight: 700, color: colors.dark, margin: "8px 0 0" },
    scaleHint: { fontSize: "12px", color: colors.muted, margin: "0 0 12px", lineHeight: 1.4 },
    geofence: { marginTop: "16px" },
    geofenceRow: { display: "flex", alignItems: "center", gap: "12px" },
    geofenceUnit: { fontSize: "13px", fontWeight: 600, color: colors.dark, flexShrink: 0 },
    slider: { flex: 1, accentColor: "var(--color-primary)" },
    scaleHead: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr 110px 72px",
        gap: "8px",
        fontSize: "12px",
        fontWeight: 700,
        color: colors.muted,
        marginBottom: "6px",
    },
    scaleRow: { display: "grid", gridTemplateColumns: "1fr 1fr 110px 72px", gap: "8px", marginBottom: "8px", alignItems: "center" },
    block: {
        marginTop: "20px",
        padding: "16px",
        border: `1px solid ${colors.border}`,
        borderRadius: "10px",
        background: "#fafbfc",
    },
    blockTitle: { fontSize: "13px", fontWeight: 700, color: colors.dark, margin: "0 0 12px" },
    posToolbar: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        marginBottom: "16px",
    },
    select: {
        width: "100%",
        height: "38px",
        padding: "0 10px",
        fontSize: "13px",
        border: `1px solid ${colors.border}`,
        borderRadius: "8px",
        background: "white",
        fontFamily: "inherit",
        color: colors.dark,
        boxSizing: "border-box",
    },
    otHead: {
        display: "grid",
        gridTemplateColumns: "36px minmax(140px, 1fr) 90px 56px 40px",
        gap: "8px",
        fontSize: "12px",
        fontWeight: 700,
        color: colors.muted,
        marginBottom: "6px",
        alignItems: "center",
        minWidth: "420px",
    },
    otRow: {
        display: "grid",
        gridTemplateColumns: "36px minmax(140px, 1fr) 90px 56px 40px",
        gap: "8px",
        marginBottom: "8px",
        alignItems: "center",
        minWidth: "420px",
    },
    switchRow: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        margin: "0",
        fontSize: "14px",
        color: colors.dark,
    },
    switchInline: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        margin: "0 0 14px",
        fontSize: "14px",
        fontWeight: 600,
        color: colors.dark,
    },
    emptyHint: { fontSize: "12px", color: colors.muted, margin: "0", lineHeight: 1.4 },
    addRow: { display: "flex", gap: "8px", alignItems: "center", minWidth: 0 },
    coeff: { fontSize: "12px", color: colors.muted, fontWeight: 600, textAlign: "center" },
    scaleInput: { width: "100%", padding: "8px 10px", fontSize: "13px", border: `1px solid ${colors.border}`, borderRadius: "8px", boxSizing: "border-box", fontFamily: "inherit" },
    scaleActions: { display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" },
    secondary: { border: `1px solid ${colors.border}`, background: "white", color: colors.dark, borderRadius: "8px", padding: "8px 12px", fontSize: "13px", fontWeight: 600, cursor: "pointer" },
    removeBtn: { border: "none", background: "transparent", color: colors.error, fontSize: "12px", fontWeight: 600, cursor: "pointer", padding: 0 },
    button: { alignSelf: "flex-start", padding: "10px 16px", background: "var(--color-primary)", color: "white", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer" },
};
