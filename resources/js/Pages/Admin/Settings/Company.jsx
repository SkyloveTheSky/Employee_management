import { Head, useForm, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import BrandMark from "@/Components/BrandMark";
import FeedbackDialog from "@/Components/FeedbackDialog";
import HeaderTools from "@/Components/HeaderTools";
import Sidebar from "../../../Components/Admin/Sidebar";
import { colors } from "@/config/colors";
import { cloneDefaultOvertimeTypes, normalizeOvertimePositions, normalizeOvertimeTypes } from "@/config/overtimeTypes";
import { useSidebar } from "@/hooks/useSidebar";

const DEFAULT_IRSA_BRACKETS = [
    { min: 0, max: 350000, rate: 0 },
    { min: 350001, max: 400000, rate: 5 },
    { min: 400001, max: 500000, rate: 10 },
    { min: 500001, max: 600000, rate: 15 },
    { min: 600001, max: 4000000, rate: 20 },
    { min: 4000001, max: "", rate: 25 },
];

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
    });

    useEffect(() => {
        if (flash?.success) {
            setFeedback({
                variant: "success",
                title: "Enregistrement réussi",
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
                    title: "Enregistrement réussi",
                    message: "Les paramètres de l’entreprise ont bien été enregistrés.",
                });
            },
            onError: () => {
                setFeedback({
                    variant: "error",
                    title: "Enregistrement impossible",
                    message: "Vérifiez les champs indiqués, puis réessayez.",
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
                { key: `hs_${n}`, code: `HS_${n}`, label: "Nouveau type", premium: 30, enabled: true },
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
            ].sort((a, b) => a.position.localeCompare(b.position, "fr"));
            setData("overtime_positions", next);
            setSelectedPosition(next.findIndex((row) => row.position === name));
        }
        setNewPosition("");
    };

    return (
        <>
            <Head title="Paramètres entreprise" />
            <Sidebar admin={admin} currentPage="admin.settings.company.edit" isOpen={isOpen} setIsOpen={setIsOpen} />
            <div className="app-page" style={{ ...styles.page, marginLeft: offset }}>
                <div className="app-header" style={styles.header}>
                    <BrandMark />
                    <div>
                        <h1 style={styles.title}>Paramètres de l'entreprise</h1>
                        <p style={styles.subtitle}>Identité, journée de travail, heures supplémentaires, cotisations et impôts</p>
                    </div>
                    <HeaderTools />
                </div>

                <form onSubmit={submit} style={styles.list}>
                    <Accordion
                        title="Identité"
                        open={openSection === "identity"}
                        onToggle={() => toggle("identity")}
                    >
                        <Field label="Nom de l'entreprise" value={data.company_name} onChange={(v) => setData("company_name", v)} error={errors.company_name} />
                        <Field label="Propriétaire" value={data.owner_name} onChange={(v) => setData("owner_name", v)} error={errors.owner_name} />
                        <Field label="NIF" value={data.nif} onChange={(v) => setData("nif", v)} error={errors.nif} />
                        <Field label="STAT" value={data.stat} onChange={(v) => setData("stat", v)} error={errors.stat} />
                        <Field label="RCS" value={data.rcs} onChange={(v) => setData("rcs", v)} error={errors.rcs} />
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Logo (png/jpg)</label>
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
                        title="Journée de travail"
                        open={openSection === "overtime"}
                        onToggle={() => toggle("overtime")}
                    >
                        <Field
                            label="Nombre d’heures de travail par jour"
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
                        title="Heures supplémentaires"
                        open={openSection === "overtime_rules"}
                        onToggle={() => toggle("overtime_rules")}
                    >
                        <label style={styles.switchRow}>
                            <input
                                type="checkbox"
                                checked={asFlag(data.overtime_enabled)}
                                onChange={(e) => setData("overtime_enabled", e.target.checked)}
                            />
                            <span>
                                <strong>Activer les heures supplémentaires</strong>
                                <span style={styles.switchHint}>
                                    Si cette option est désactivée, aucun surplus n’est compté, quel que soit le poste.
                                </span>
                            </span>
                        </label>
                        <p style={styles.scaleHint}>
                            Sur une demi-journée (matin ou après-midi), le surplus au-delà du seuil est compté en heures supplémentaires.
                        </p>
                        <Field
                            label="Seuil par demi-journée (h)"
                            type="number"
                            step="0.25"
                            min="0"
                            max="12"
                            value={data.overtime_hours_per_half}
                            onChange={(v) => setData("overtime_hours_per_half", v)}
                            error={errors.overtime_hours_per_half}
                        />

                        <p style={styles.scaleTitle}>Types d’heures supplémentaires par poste</p>
                        <p style={styles.scaleHint}>
                            Choisissez un poste pour définir ses types de HS (code, libellé, majoration). Chaque poste a sa propre liste, et peut désactiver les HS.
                        </p>
                        {data.overtime_positions.length === 0 ? (
                            <p style={styles.scaleHint}>Aucun poste pour le moment. Ils apparaissent dès qu’un employé a un poste, ou ajoutez-en un ci-dessous.</p>
                        ) : (
                            <div style={styles.posLayout}>
                                <div style={styles.posList}>
                                    {data.overtime_positions.map((row, index) => (
                                        <button
                                            key={row.position}
                                            type="button"
                                            onClick={() => setSelectedPosition(index)}
                                            style={{
                                                ...styles.posItem,
                                                borderColor: selectedPosition === index ? "var(--color-primary)" : colors.border,
                                                background: selectedPosition === index ? "#f7fafc" : "white",
                                            }}
                                        >
                                            <span>{row.position}</span>
                                            <span style={styles.posMeta}>
                                                {asFlag(row.enabled)
                                                    ? `${(row.types || []).filter((type) => asFlag(type.enabled)).length} type${(row.types || []).filter((type) => asFlag(type.enabled)).length > 1 ? "s" : ""}`
                                                    : "HS off"}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                                {data.overtime_positions[selectedPosition] && (
                                    <div style={styles.posEditor}>
                                        <label style={styles.switchRow}>
                                            <input
                                                type="checkbox"
                                                checked={asFlag(data.overtime_positions[selectedPosition].enabled)}
                                                onChange={(e) => updatePosition(selectedPosition, { enabled: e.target.checked })}
                                            />
                                            <span>
                                                <strong>Activer les HS — {data.overtime_positions[selectedPosition].position}</strong>
                                                <span style={styles.switchHint}>Si cette option est désactivée, ce poste n’a pas d’heures supplémentaires.</span>
                                            </span>
                                        </label>
                                        <div style={styles.otHead}>
                                            <span>Actif</span>
                                            <span>Code</span>
                                            <span>Libellé</span>
                                            <span>Maj. (%)</span>
                                            <span />
                                        </div>
                                        {data.overtime_positions[selectedPosition].types.map((row, index) => (
                                            <div key={row.key || index} style={styles.otRow}>
                                                <input
                                                    type="checkbox"
                                                    checked={asFlag(row.enabled)}
                                                    onChange={(e) => updatePositionType(selectedPosition, index, "enabled", e.target.checked)}
                                                    aria-label={`Activer ${row.label || row.code}`}
                                                />
                                                <input
                                                    value={row.code}
                                                    onChange={(e) => updatePositionType(selectedPosition, index, "code", e.target.value.toUpperCase())}
                                                    style={styles.scaleInput}
                                                />
                                                <input
                                                    value={row.label}
                                                    onChange={(e) => updatePositionType(selectedPosition, index, "label", e.target.value)}
                                                    style={styles.scaleInput}
                                                />
                                                <div>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="400"
                                                        step="0.1"
                                                        value={row.premium}
                                                        onChange={(e) => updatePositionType(selectedPosition, index, "premium", e.target.value)}
                                                        style={styles.scaleInput}
                                                    />
                                                    <p style={styles.coeff}>× {coefficientFromPremium(row.premium)}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    style={styles.removeBtn}
                                                    onClick={() => removePositionType(selectedPosition, index)}
                                                    disabled={data.overtime_positions[selectedPosition].types.length <= 1}
                                                >
                                                    Retirer
                                                </button>
                                            </div>
                                        ))}
                                        <div style={styles.scaleActions}>
                                            <button type="button" style={styles.secondary} onClick={() => addPositionType(selectedPosition)}>
                                                Ajouter un type
                                            </button>
                                            <button
                                                type="button"
                                                style={styles.secondary}
                                                onClick={() => updatePosition(selectedPosition, { types: cloneDefaultOvertimeTypes() })}
                                            >
                                                Types par défaut
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        <div style={styles.addRow}>
                            <input
                                value={newPosition}
                                onChange={(e) => setNewPosition(e.target.value)}
                                placeholder="Nouveau poste"
                                style={styles.scaleInput}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        addPosition();
                                    }
                                }}
                            />
                            <button type="button" style={styles.secondary} onClick={addPosition}>
                                Ajouter un poste
                            </button>
                        </div>
                    </Accordion>

                    <Accordion
                        title="Cotisation et impôts"
                        open={openSection === "contributions"}
                        onToggle={() => toggle("contributions")}
                    >
                        <p style={styles.scaleTitle}>CNAPS</p>
                        <div className="app-grid-2" style={styles.grid}>
                            <div>
                                <p style={styles.partTitle}>Part patronale (employeur)</p>
                                <Field
                                    label="Taux de cotisation (%)"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={data.cnaps_employer_percent}
                                    onChange={(v) => setData("cnaps_employer_percent", v)}
                                    error={errors.cnaps_employer_percent}
                                />
                                <p style={styles.scaleHint}>Détails : retraite et prestations familiales. Charge entreprise, non retenue sur le salaire.</p>
                            </div>
                            <div>
                                <p style={styles.partTitle}>Part salariale (employé)</p>
                                <Field
                                    label="Taux de cotisation (%)"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={data.cnaps_employee_percent}
                                    onChange={(v) => setData("cnaps_employee_percent", v)}
                                    error={errors.cnaps_employee_percent}
                                />
                                <p style={styles.scaleHint}>Détails : retraite uniquement. Retenue directement sur le salaire.</p>
                            </div>
                        </div>
                        <p style={styles.scaleTitle}>Barème IRSA</p>
                        <p style={styles.scaleHint}>Modifiable selon l’actualité fiscale. Laissez le maximum vide pour la dernière tranche.</p>
                        <div style={styles.scaleHead}>
                            <span>Minimum (Ar)</span>
                            <span>Maximum (Ar)</span>
                            <span>Taux (%)</span>
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
                                    placeholder="Et plus"
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
                                <button
                                    type="button"
                                    style={styles.removeBtn}
                                    onClick={() => removeBracket(index)}
                                    disabled={data.irsa_brackets.length <= 1}
                                >
                                    Retirer
                                </button>
                            </div>
                        ))}
                        {errors.irsa_brackets && <p style={styles.error}>{errors.irsa_brackets}</p>}
                        <div style={styles.scaleActions}>
                            <button type="button" style={styles.secondary} onClick={addBracket}>
                                Ajouter une tranche
                            </button>
                            <button type="button" style={styles.secondary} onClick={() => setData("irsa_brackets", DEFAULT_IRSA_BRACKETS)}>
                                Barème 2026
                            </button>
                        </div>
                    </Accordion>

                    <button type="submit" disabled={processing} style={styles.button}>
                        {processing ? "Enregistrement..." : "Enregistrer"}
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
    list: { maxWidth: "1040px", display: "flex", flexDirection: "column", gap: "12px" },
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
    otHead: {
        display: "grid",
        gridTemplateColumns: "52px 140px minmax(0, 1.4fr) 100px 72px",
        gap: "8px",
        fontSize: "12px",
        fontWeight: 700,
        color: colors.muted,
        marginBottom: "6px",
        alignItems: "center",
    },
    otRow: {
        display: "grid",
        gridTemplateColumns: "52px 140px minmax(0, 1.4fr) 100px 72px",
        gap: "8px",
        marginBottom: "10px",
        alignItems: "center",
    },
    posLayout: {
        display: "grid",
        gridTemplateColumns: "220px minmax(0, 1fr)",
        gap: "16px",
        alignItems: "start",
        marginTop: "8px",
    },
    posList: {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        maxHeight: "420px",
        overflowY: "auto",
        paddingRight: "4px",
    },
    posItem: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "2px",
        width: "100%",
        textAlign: "left",
        border: `1px solid ${colors.border}`,
        borderRadius: "8px",
        background: "white",
        padding: "8px 10px",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: "13px",
        fontWeight: 600,
        color: colors.dark,
    },
    posMeta: { fontSize: "11px", fontWeight: 500, color: colors.muted },
    posEditor: { minWidth: 0 },
    switchRow: {
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        margin: "0 0 16px",
        fontSize: "14px",
        color: colors.dark,
    },
    switchHint: {
        display: "block",
        fontSize: "12px",
        color: colors.muted,
        fontWeight: 400,
        marginTop: "2px",
        lineHeight: 1.4,
    },
    addRow: { display: "flex", gap: "8px", alignItems: "center", marginTop: "8px" },
    coeff: { fontSize: "11px", color: colors.muted, fontWeight: 600, margin: "4px 0 0" },
    scaleInput: { width: "100%", padding: "8px 10px", fontSize: "13px", border: `1px solid ${colors.border}`, borderRadius: "8px", boxSizing: "border-box", fontFamily: "inherit" },
    scaleActions: { display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" },
    secondary: { border: `1px solid ${colors.border}`, background: "white", color: colors.dark, borderRadius: "8px", padding: "8px 12px", fontSize: "13px", fontWeight: 600, cursor: "pointer" },
    removeBtn: { border: "none", background: "transparent", color: colors.error, fontSize: "12px", fontWeight: 600, cursor: "pointer", padding: 0 },
    button: { alignSelf: "flex-start", padding: "10px 16px", background: "var(--color-primary)", color: "white", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer" },
};
