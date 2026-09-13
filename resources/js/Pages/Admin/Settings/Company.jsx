import { Head, useForm, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import BrandMark from "@/Components/BrandMark";
import FeedbackDialog from "@/Components/FeedbackDialog";
import HeaderTools from "@/Components/HeaderTools";
import Sidebar from "../../../Components/Admin/Sidebar";
import { colors } from "@/config/colors";
import { useSidebar } from "@/hooks/useSidebar";

function suggestedDivisor(weeklyGoal) {
    const goal = Number(weeklyGoal);
    if (!goal || Number.isNaN(goal)) return "";
    return (Math.round(((goal * 52) / 12) * 100) / 100).toFixed(2);
}

const DEFAULT_IRSA_BRACKETS = [
    { min: 0, max: 350000, rate: 0 },
    { min: 350001, max: 400000, rate: 5 },
    { min: 400001, max: 500000, rate: 10 },
    { min: 500001, max: 600000, rate: 15 },
    { min: 600001, max: 4000000, rate: 20 },
    { min: 4000001, max: "", rate: 25 },
];

function normalizeBrackets(rows) {
    if (!Array.isArray(rows) || rows.length === 0) return DEFAULT_IRSA_BRACKETS;
    return rows.map((row) => ({
        min: row.min ?? 0,
        max: row.max === null || row.max === undefined ? "" : row.max,
        rate: row.rate ?? 0,
    }));
}

export default function Company({ admin, settings, irsa_brackets }) {
    const { flash } = usePage().props;
    const { isOpen, setIsOpen, offset } = useSidebar();
    const [openSection, setOpenSection] = useState("identity");
    const [feedback, setFeedback] = useState(null);
    const { data, setData, post, processing, errors } = useForm({
        company_name: settings?.company_name || "",
        owner_name: settings?.owner_name || "",
        nif: settings?.nif || "",
        stat: settings?.stat || "",
        rcs: settings?.rcs || "",
        logo: null,
        overtime_hours_per_day: settings?.overtime_hours_per_day ?? "8",
        overtime_weekly_goal: settings?.overtime_weekly_goal ?? "40",
        overtime_divisor: settings?.overtime_divisor ?? suggestedDivisor(settings?.overtime_weekly_goal ?? 40),
        overtime_coefficient: settings?.overtime_coefficient ?? "1.30",
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

    const updateOvertime = (field, value) => {
        const next = { ...data, [field]: value, logo: data.logo };
        if (field === "overtime_weekly_goal" || field === "overtime_hours_per_day") {
            const goal = field === "overtime_weekly_goal" ? value : next.overtime_weekly_goal;
            const divisor = suggestedDivisor(goal);
            if (divisor) next.overtime_divisor = divisor;
        }
        setData(next);
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

    return (
        <>
            <Head title="Paramètres entreprise" />
            <Sidebar admin={admin} currentPage="admin.settings.company.edit" isOpen={isOpen} setIsOpen={setIsOpen} />
            <div className="app-page" style={{ ...styles.page, marginLeft: offset }}>
                <div className="app-header" style={styles.header}>
                    <BrandMark />
                    <div>
                        <h1 style={styles.title}>Paramètres de l'entreprise</h1>
                        <p style={styles.subtitle}>Identité, heures supplémentaires, cotisations et impôts</p>
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
                        title="Heures supplémentaires"
                        open={openSection === "overtime"}
                        onToggle={() => toggle("overtime")}
                    >
                        <div className="app-grid-2" style={styles.grid}>
                            <Field
                                label="Nombre d’heures de travail par jour"
                                type="number"
                                step="0.25"
                                min="0"
                                max="24"
                                value={data.overtime_hours_per_day}
                                onChange={(v) => updateOvertime("overtime_hours_per_day", v)}
                                error={errors.overtime_hours_per_day}
                            />
                            <Field
                                label="Objectif (heures / semaine)"
                                type="number"
                                step="0.25"
                                min="0"
                                max="168"
                                value={data.overtime_weekly_goal}
                                onChange={(v) => updateOvertime("overtime_weekly_goal", v)}
                                error={errors.overtime_weekly_goal}
                            />
                            <Field
                                label="Diviseur"
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={data.overtime_divisor}
                                onChange={(v) => setData("overtime_divisor", v)}
                                error={errors.overtime_divisor}
                            />
                            <Field
                                label="Coefficient"
                                type="number"
                                step="0.01"
                                min="1"
                                max="5"
                                value={data.overtime_coefficient}
                                onChange={(v) => setData("overtime_coefficient", v)}
                                error={errors.overtime_coefficient}
                            />
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
    list: { maxWidth: "800px", display: "flex", flexDirection: "column", gap: "12px" },
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
    itemBody: { padding: "0 20px 20px", borderTop: `1px solid ${colors.border}` },
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
    scaleInput: { width: "100%", padding: "8px 10px", fontSize: "13px", border: `1px solid ${colors.border}`, borderRadius: "8px", boxSizing: "border-box", fontFamily: "inherit" },
    scaleActions: { display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" },
    secondary: { border: `1px solid ${colors.border}`, background: "white", color: colors.dark, borderRadius: "8px", padding: "8px 12px", fontSize: "13px", fontWeight: 600, cursor: "pointer" },
    removeBtn: { border: "none", background: "transparent", color: colors.error, fontSize: "12px", fontWeight: 600, cursor: "pointer", padding: 0 },
    button: { alignSelf: "flex-start", padding: "10px 16px", background: "var(--color-primary)", color: "white", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer" },
};
