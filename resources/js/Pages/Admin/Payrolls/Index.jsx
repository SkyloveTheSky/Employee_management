import { Head, router, useForm, usePage } from "@inertiajs/react";
import { Fragment, useState } from "react";
import axios from "axios";
import Sidebar from "../../../Components/Admin/Sidebar";
import BrandMark from "@/Components/BrandMark";

export default function Index({ admin, payrolls, employees, filters = {}, insights = { unpaid: [], missing: [] } }) {
    const { flash } = usePage().props;
    const warnings = flash?.payroll_warnings || [];
    const [isOpen, setIsOpen] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [question, setQuestion] = useState("");
    const [assistant, setAssistant] = useState(null);
    const [asking, setAsking] = useState(false);
    const [assistantOpen, setAssistantOpen] = useState(true);
    const currentDate = new Date();
    const currentMonth = String(currentDate.getFullYear()).padStart(4, '0') + '-' +
                         String(currentDate.getMonth() + 1).padStart(2, '0');
    const payrollItems = payrolls?.data ?? [];
    const payrollLinks = payrolls?.links ?? payrolls?.meta?.links ?? [];
    const payrollTotal = payrolls?.total ?? payrolls?.meta?.total ?? 0;
    const payrollFrom = payrolls?.from ?? payrolls?.meta?.from;
    const payrollTo = payrolls?.to ?? payrolls?.meta?.to;
    const payrollLastPage = payrolls?.last_page ?? payrolls?.meta?.last_page ?? 1;

    const { data, setData, post, processing, errors, reset } = useForm({
        user_id: "",
        period_month_years: [currentMonth],
        prime_amount: 0,
        overtime_amount: 0,
        cnaps_rate: 1,
        assurance_rate: 1,
        payment_method: "virement",
        payment_status: "unpaid",
        paid_at: "",
        notes: "",
        confirm_anomalies: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("admin.payrolls.store"), {
            onSuccess: () => reset("prime_amount", "overtime_amount", "cnaps_rate", "assurance_rate", "paid_at", "notes", "user_id"),
        });
    };

    const formatAr = (value) => `${Number(value || 0).toLocaleString("fr-FR")} Ar`;
    const formatDate = (value) => {
        if (!value) return "-";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "-";
        return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(date);
    };
    const formatMonth = (monthYear) => {
        if (!monthYear) return "-";
        const [year, month] = monthYear.split('-');
        const date = new Date(year, parseInt(month) - 1, 1);
        return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(date);
    };

    // Générer une liste de 24 mois (2 ans précédents + mois actuel + 1 futur)
    const generateMonthsList = () => {
        const months = [];
        const today = new Date();

        for (let i = -24; i <= 3; i++) {
            const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const monthYear = `${year}-${month}`;
            const label = formatMonth(monthYear);
            months.push({ value: monthYear, label });
        }

        return months;
    };

    const monthsList = generateMonthsList();

    const toggleMonth = (value) => {
        const selected = data.period_month_years || [];
        if (selected.includes(value)) {
            setData("period_month_years", selected.filter((month) => month !== value));
            return;
        }
        setData("period_month_years", [...selected, value]);
    };

    const askAssistant = async (e) => {
        e.preventDefault();
        if (!question.trim()) return;
        setAsking(true);
        try {
            const csrf = decodeURIComponent((document.cookie.match(/XSRF-TOKEN=([^;]+)/) || [])[1] || "");
            const response = await axios.post(route("admin.payrolls.assistant"), { message: question }, {
                headers: { "X-XSRF-TOKEN": csrf },
            });
            setAssistant(response.data);
        } catch (error) {
            setAssistant({
                reply: error.response?.data?.message || "Impossible de contacter l'assistant.",
                actions: [],
            });
        } finally {
            setAsking(false);
        }
    };

    const runAssistantAction = (action) => {
        if (action.type === "filter_unpaid") {
            applyFilters({ period: action.period, filter_status: "unpaid" });
            return;
        }
        if (action.type === "generate_missing") {
            if (confirm(`${action.label} ? Les fiches seront créées en non payé, sans paiement automatique.`)) {
                router.post(route("admin.payrolls.generate-missing"), {
                    period: action.period,
                    user_ids: action.user_ids,
                }, { preserveScroll: true });
            }
        }
    };

    const applyFilters = (next) => {
        router.get(route("admin.payrolls.index"), {
            period: next.period ?? filters.period ?? currentMonth,
            filter_user_id: next.filter_user_id ?? filters.filter_user_id ?? "",
            filter_status: next.filter_status ?? filters.filter_status ?? "all",
        }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const buildLines = (payroll) => [
        { numero: 1, designation: "Salaire de base", base: payroll.base_salary, taux: "-", gain: payroll.base_salary, retenu: 0 },
        { numero: 2, designation: "Prime", base: payroll.base_salary, taux: "-", gain: payroll.prime_amount || 0, retenu: 0 },
        { numero: 3, designation: "Heures supplémentaires", base: payroll.base_salary, taux: "-", gain: payroll.overtime_amount || 0, retenu: 0 },
        { numero: 4, designation: "CNAPS", base: payroll.gross_salary, taux: `${Number(payroll.cnaps_rate || 1).toFixed(2)}%`, gain: 0, retenu: payroll.cnaps_amount || 0 },
        { numero: 5, designation: "Assurance", base: payroll.gross_salary, taux: `${Number(payroll.assurance_rate || 1).toFixed(2)}%`, gain: 0, retenu: payroll.assurance_amount || 0 },
    ];

    return (
        <>
            <Head title="Payrolls" />
            <Sidebar admin={admin} currentPage="admin.payrolls.index" isOpen={isOpen} setIsOpen={setIsOpen} />
            <div style={{
                ...styles.page,
                marginLeft: isOpen ? "280px" : "0px",
                paddingBottom: assistantOpen ? (assistant?.reply ? "220px" : "120px") : "24px",
            }}>
                <div style={styles.header}>
                    <BrandMark />
                    <div>
                        <h1 style={styles.title}>Fiches de paie</h1>
                        <p style={styles.subtitle}>Génération semi-automatique et suivi de paiement</p>
                    </div>
                </div>

                {((insights.unpaid || []).length > 0 || (insights.missing || []).length > 0) && (
                    <div style={styles.insightGrid}>
                        <div style={styles.insightCard}>
                            <p style={styles.insightLabel}>Non payés (période du contrôle)</p>
                            <p style={styles.insightValue}>{(insights.unpaid || []).length}</p>
                            <p style={styles.hint}>{(insights.unpaid || []).slice(0, 4).map((item) => item.name).join(", ") || "—"}</p>
                        </div>
                        <div style={styles.insightCard}>
                            <p style={styles.insightLabel}>Sans fiche depuis 2 mois</p>
                            <p style={styles.insightValue}>{(insights.missing || []).length}</p>
                            <p style={styles.hint}>{(insights.missing || []).slice(0, 4).map((item) => item.name).join(", ") || "—"}</p>
                        </div>
                    </div>
                )}

                {flash?.success && <p style={styles.success}>{flash.success}</p>}

                <form onSubmit={submit} style={styles.formCard}>
                    <h2 style={styles.sectionTitle}>Générer une ou plusieurs fiches</h2>
                    <div style={styles.grid}>
                        <div>
                            <label style={styles.label}>Employé</label>
                            <select value={data.user_id} onChange={(e) => setData("user_id", e.target.value)} style={styles.input}>
                                <option value="">-- Choisir --</option>
                                {employees.map((employee) => (
                                    <option key={employee.id} value={employee.id}>
                                        {employee.first_name} {employee.last_name} ({formatAr(employee.salary_base)})
                                    </option>
                                ))}
                            </select>
                            {errors.user_id && <p style={styles.error}>{errors.user_id}</p>}
                        </div>
                        <div style={{ gridColumn: "span 2" }}>
                            <label style={styles.label}>Périodes (un ou plusieurs mois)</label>
                            <div style={styles.monthList}>
                                {monthsList.map((month) => (
                                    <label key={month.value} style={styles.monthItem}>
                                        <input
                                            type="checkbox"
                                            checked={(data.period_month_years || []).includes(month.value)}
                                            onChange={() => toggleMonth(month.value)}
                                        />
                                        <span>{month.label}</span>
                                    </label>
                                ))}
                            </div>
                            {(data.period_month_years || []).length > 0 && (
                                <p style={{ fontSize: "14px", color: "#666", marginTop: "8px", fontWeight: 500 }}>
                                    {(data.period_month_years || []).length} fiche{(data.period_month_years || []).length > 1 ? "s" : ""} :{" "}
                                    <strong>
                                        {(data.period_month_years || [])
                                            .slice()
                                            .sort()
                                            .map(formatMonth)
                                            .join(", ")}
                                    </strong>
                                </p>
                            )}
                            {errors.period_month_years && <p style={styles.error}>{errors.period_month_years}</p>}
                            {errors["period_month_years.0"] && <p style={styles.error}>{errors["period_month_years.0"]}</p>}
                        </div>
                        <div>
                            <label style={styles.label}>Prime (Ar)</label>
                            <input type="number" min="0" step="1" value={data.prime_amount} onChange={(e) => setData("prime_amount", e.target.value)} style={styles.input} />
                            {errors.prime_amount && <p style={styles.error}>{errors.prime_amount}</p>}
                        </div>
                        <div>
                            <label style={styles.label}>Heures supplémentaires (Ar)</label>
                            <input type="number" min="0" step="1" value={data.overtime_amount} onChange={(e) => setData("overtime_amount", e.target.value)} style={styles.input} />
                            {errors.overtime_amount && <p style={styles.error}>{errors.overtime_amount}</p>}
                        </div>
                        <div>
                            <label style={styles.label}>Taux CNAPS (%)</label>
                            <input type="number" min="0" max="100" step="0.01" value={data.cnaps_rate} onChange={(e) => setData("cnaps_rate", e.target.value)} style={styles.input} />
                            {errors.cnaps_rate && <p style={styles.error}>{errors.cnaps_rate}</p>}
                        </div>
                        <div>
                            <label style={styles.label}>Taux Assurance (%)</label>
                            <input type="number" min="0" max="100" step="0.01" value={data.assurance_rate} onChange={(e) => setData("assurance_rate", e.target.value)} style={styles.input} />
                            {errors.assurance_rate && <p style={styles.error}>{errors.assurance_rate}</p>}
                        </div>
                        <div>
                            <label style={styles.label}>Mode de paiement</label>
                            <select value={data.payment_method} onChange={(e) => setData("payment_method", e.target.value)} style={styles.input}>
                                <option value="virement">Virement</option>
                                <option value="especes">Espèces</option>
                                <option value="mobile_money">Mobile Money</option>
                                <option value="cheque">Chèque</option>
                                <option value="autre">Autre</option>
                            </select>
                            {errors.payment_method && <p style={styles.error}>{errors.payment_method}</p>}
                        </div>
                    </div>

                    {warnings.length > 0 && (
                        <div style={styles.warningBox}>
                            <p style={styles.warningTitle}>Contrôle d’anomalies — aucune fiche n’a été enregistrée</p>
                            <ul style={styles.warningList}>
                                {warnings.map((warning, index) => (
                                    <li key={`${warning.code}-${index}`}>{warning.message}</li>
                                ))}
                            </ul>
                            <label style={styles.monthItem}>
                                <input
                                    type="checkbox"
                                    checked={!!data.confirm_anomalies}
                                    onChange={(e) => setData("confirm_anomalies", e.target.checked)}
                                />
                                J’ai lu les alertes, générer quand même
                            </label>
                        </div>
                    )}

                    <button type="submit" disabled={processing} style={styles.button}>
                        {processing
                            ? "Génération..."
                            : (data.period_month_years || []).length > 1
                                ? `Générer ${(data.period_month_years || []).length} fiches`
                                : "Générer"}
                    </button>
                </form>

                <div style={styles.tableContainer}>
                    <h2 style={styles.sectionTitle}>Suivi des paiements</h2>
                    <div style={styles.filterGrid}>
                        <div>
                            <label style={styles.label}>Période</label>
                            <select
                                value={filters.period ?? currentMonth}
                                onChange={(e) => applyFilters({ period: e.target.value })}
                                style={styles.input}
                            >
                                <option value="">Toutes les périodes</option>
                                {monthsList.map((month) => (
                                    <option key={month.value} value={month.value}>{month.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={styles.label}>Employé</label>
                            <select
                                value={filters.filter_user_id ?? ""}
                                onChange={(e) => applyFilters({ filter_user_id: e.target.value })}
                                style={styles.input}
                            >
                                <option value="">Tous les employés</option>
                                {employees.map((employee) => (
                                    <option key={employee.id} value={employee.id}>
                                        {employee.first_name} {employee.last_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={styles.label}>Statut</label>
                            <select
                                value={filters.filter_status ?? "all"}
                                onChange={(e) => applyFilters({ filter_status: e.target.value })}
                                style={styles.input}
                            >
                                <option value="all">Tous</option>
                                <option value="paid">Payé</option>
                                <option value="unpaid">Non payé</option>
                            </select>
                        </div>
                    </div>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}></th>
                                <th style={styles.th}>Employé</th>
                                <th style={styles.th}>Période</th>
                                <th style={styles.th}>Net à payer</th>
                                <th style={styles.th}>Statut</th>
                                <th style={styles.th}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payrollItems.length > 0 ? (
                                payrollItems.map((payroll) => (
                                    <Fragment key={payroll.id}>
                                        <tr>
                                            <td style={styles.td}>
                                                <button
                                                    type="button"
                                                    onClick={() => setExpandedId(expandedId === payroll.id ? null : payroll.id)}
                                                    style={styles.detailToggle}
                                                >
                                                    {expandedId === payroll.id ? "▾" : "▸"}
                                                </button>
                                            </td>
                                            <td style={styles.td}>{payroll.user?.first_name} {payroll.user?.last_name}</td>
                                            <td style={styles.td}>{formatMonth(`${payroll.period_year}-${String(payroll.period_month).padStart(2, "0")}`)}</td>
                                            <td style={{ ...styles.td, fontWeight: 600 }}>{formatAr(payroll.net_to_pay)}</td>
                                            <td style={styles.td}>
                                                <span style={payroll.payment_status === "paid" ? styles.paidBadge : styles.unpaidBadge}>
                                                    {payroll.payment_status === "paid" ? "Payé" : "Non payé"}
                                                </span>
                                            </td>
                                            <td style={styles.actionsCell}>
                                                <button
                                                    onClick={() => {
                                                        const nextStatus = payroll.payment_status === "paid" ? "unpaid" : "paid";
                                                        router.patch(route("admin.payrolls.payment", payroll.id), {
                                                            payment_status: nextStatus,
                                                        }, { preserveScroll: true });
                                                    }}
                                                    style={payroll.payment_status === "paid" ? styles.unpayButton : styles.payButton}
                                                >
                                                    {payroll.payment_status === "paid" ? "Marquer non payé" : "Marquer payé"}
                                                </button>
                                                <button onClick={() => router.visit(route("admin.payrolls.edit", payroll.id))} style={styles.editButton}>Modifier</button>
                                                <button onClick={() => window.open(route("admin.payrolls.pdf", payroll.id), "_blank")} style={styles.pdfButton}>PDF</button>
                                                <button
                                                    onClick={() => {
                                                        if (confirm("Supprimer cette fiche de paie ?")) router.delete(route("admin.payrolls.delete", payroll.id));
                                                    }}
                                                    style={styles.deleteButton}
                                                >
                                                    Supprimer
                                                </button>
                                            </td>
                                        </tr>
                                        {expandedId === payroll.id && (
                                            <tr>
                                                <td style={styles.td} colSpan="6">
                                                    <table style={styles.innerTable}>
                                                        <thead>
                                                            <tr>
                                                                <th style={styles.innerTh}>Numéro</th>
                                                                <th style={styles.innerTh}>Désignation</th>
                                                                <th style={styles.innerTh}>Base</th>
                                                                <th style={styles.innerTh}>Taux</th>
                                                                <th style={styles.innerTh}>Gain</th>
                                                                <th style={styles.innerTh}>Retenu</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {buildLines(payroll).map((line) => (
                                                                <tr key={`${payroll.id}-${line.numero}`}>
                                                                    <td style={styles.innerTd}>{line.numero}</td>
                                                                    <td style={styles.innerTd}>{line.designation}</td>
                                                                    <td style={styles.innerTd}>{formatAr(line.base)}</td>
                                                                    <td style={styles.innerTd}>{line.taux}</td>
                                                                    <td style={styles.innerTd}>{formatAr(line.gain)}</td>
                                                                    <td style={styles.innerTd}>{formatAr(line.retenu)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" style={{ ...styles.td, textAlign: "center" }}>Aucune fiche pour ces filtres</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    {payrollLastPage > 1 && (
                        <div style={styles.pagination}>
                            {payrollLinks.map((link, index) => (
                                <button
                                    key={`${link.label}-${index}`}
                                    type="button"
                                    disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url, {}, { preserveState: true, preserveScroll: true })}
                                    style={link.active ? styles.pageActive : styles.pageBtn}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                    {payrollTotal > 0 && (
                        <p style={styles.pageInfo}>
                            {payrollFrom}–{payrollTo} sur {payrollTotal}
                        </p>
                    )}
                </div>
            </div>

            {assistantOpen ? (
                <div style={{
                    ...styles.floatBar,
                    left: isOpen ? "300px" : "16px",
                }}>
                    <div style={styles.floatHeader}>
                        <span style={styles.floatLabel}>Assistant paie</span>
                        <button type="button" onClick={() => setAssistantOpen(false)} style={styles.floatClose} aria-label="Fermer l'assistant">
                            Fermer
                        </button>
                    </div>
                    {assistant?.reply && (
                        <div style={styles.floatReply}>
                            <p style={styles.assistantReply}>{assistant.reply}</p>
                            {(assistant.actions || []).map((action) => (
                                <button key={action.label} type="button" style={styles.suggestButton} onClick={() => runAssistantAction(action)}>
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    )}
                    <form onSubmit={askAssistant} style={styles.assistantRow}>
                        <input
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="Ex. Génère mars pour ceux sans fiche / Qui n’est pas payé ce mois-ci ?"
                            style={styles.floatInput}
                        />
                        <button type="submit" disabled={asking} style={styles.button}>{asking ? "Analyse..." : "Demander"}</button>
                    </form>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => setAssistantOpen(true)}
                    style={styles.floatToggle}
                    aria-label="Ouvrir l'assistant paie"
                >
                    Assistant paie
                </button>
            )}
        </>
    );
}

const styles = {
    page: { minHeight: "100vh", background: "#ffffff", fontFamily: "system-ui, sans-serif", padding: "24px", transition: "margin-left 0.3s ease" },
    header: { display: "flex", alignItems: "center", gap: "16px", background: "white", padding: "20px 24px", borderRadius: "12px", marginBottom: "24px", border: "1px solid #e2e8f0" },
    logo: { width: "44px", height: "44px", background: "var(--color-primary)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "700", fontSize: "16px", flexShrink: 0 },
    title: { fontSize: "18px", fontWeight: "600", color: "#1a202c", margin: 0 },
    subtitle: { fontSize: "13px", color: "#718096", margin: 0 },
    formCard: { background: "white", borderRadius: "12px", marginBottom: "24px", border: "1px solid #e2e8f0", padding: "20px" },
    hint: { fontSize: "12px", color: "#718096", margin: "0 0 10px" },
    assistantRow: { display: "flex", gap: "8px", alignItems: "center" },
    assistantReply: { margin: "0 0 8px", fontSize: "13px", color: "#e2e8f0", lineHeight: 1.45 },
    suggestButton: { marginRight: "8px", marginTop: "4px", padding: "6px 10px", background: "#2d3748", color: "white", border: "1px solid #4a5568", borderRadius: "8px", cursor: "pointer", fontSize: "12px" },
    floatBar: {
        position: "fixed",
        bottom: "16px",
        right: "16px",
        zIndex: 1200,
        background: "#1a202c",
        border: "1px solid #2d3748",
        borderRadius: "12px",
        padding: "12px 14px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        maxWidth: "none",
        width: "auto",
    },
    floatLabel: { color: "white", fontSize: "12px", fontWeight: 600, whiteSpace: "nowrap" },
    floatHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" },
    floatClose: { background: "transparent", color: "#a0aec0", border: "1px solid #4a5568", borderRadius: "6px", padding: "4px 8px", fontSize: "12px", cursor: "pointer" },
    floatToggle: {
        position: "fixed",
        bottom: "16px",
        right: "16px",
        zIndex: 1200,
        background: "#0d6efd",
        color: "white",
        border: "none",
        borderRadius: "999px",
        padding: "12px 16px",
        fontSize: "13px",
        fontWeight: 600,
        cursor: "pointer",
        boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
    },
    floatInput: { flex: 1, border: "1px solid #4a5568", background: "#2d3748", color: "white", borderRadius: "8px", padding: "9px 10px", fontSize: "13px", boxSizing: "border-box" },
    floatReply: { marginBottom: "10px", paddingBottom: "10px", borderBottom: "1px solid #2d3748" },
    insightGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "12px", marginBottom: "24px" },
    insightCard: { background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px" },
    insightLabel: { fontSize: "12px", color: "#718096", margin: 0 },
    insightValue: { fontSize: "22px", fontWeight: 700, color: "#1a202c", margin: "6px 0" },
    success: { background: "#c6f6d5", color: "#276749", padding: "10px 14px", borderRadius: "8px", marginBottom: "16px" },
    warningBox: { background: "#fffaf0", border: "1px solid #f6ad55", borderRadius: "8px", padding: "12px", marginBottom: "14px" },
    warningTitle: { margin: "0 0 8px", fontWeight: 600, color: "#9c4221", fontSize: "13px" },
    warningList: { margin: "0 0 10px", paddingLeft: "18px", color: "#9c4221", fontSize: "13px" },
    sectionTitle: { fontSize: "16px", fontWeight: 600, color: "#1a202c", margin: "0 0 16px" },
    grid: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "12px", marginBottom: "14px" },
    label: { display: "block", fontSize: "12px", marginBottom: "6px", color: "#4a5568" },
    input: { width: "100%", border: "1px solid #cbd5e0", borderRadius: "8px", padding: "9px 10px", fontSize: "13px", boxSizing: "border-box" },
    button: { background: "#0d6efd", color: "white", border: "none", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", cursor: "pointer" },
    error: { marginTop: "4px", marginBottom: 0, color: "#e53e3e", fontSize: "12px" },
    monthList: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "6px", maxHeight: "180px", overflow: "auto", border: "1px solid #cbd5e0", borderRadius: "8px", padding: "10px" },
    monthItem: { display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#2d3748", cursor: "pointer" },
    tableContainer: { background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "auto", padding: "20px" },
    filterGrid: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "12px", marginBottom: "16px" },
    table: { width: "100%", borderCollapse: "collapse", fontSize: "14px" },
    th: { background: "#f7fafc", padding: "12px 16px", textAlign: "left", fontWeight: "600", color: "#1a202c", borderBottom: "1px solid #e2e8f0" },
    td: { padding: "12px 16px", color: "#4a5568", borderBottom: "1px solid #e2e8f0" },
    actionsCell: { padding: "12px 16px", color: "#4a5568", borderBottom: "1px solid #e2e8f0", display: "flex", gap: "8px", flexWrap: "wrap" },
    paidBadge: { display: "inline-block", padding: "4px 8px", borderRadius: "999px", background: "#c6f6d5", color: "#276749", fontSize: "12px", fontWeight: 600 },
    unpaidBadge: { display: "inline-block", padding: "4px 8px", borderRadius: "999px", background: "#feebc8", color: "#9c4221", fontSize: "12px", fontWeight: 600 },
    payButton: { padding: "6px 12px", background: "#198754", color: "white", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" },
    unpayButton: { padding: "6px 12px", background: "#ffc107", color: "#212529", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" },
    editButton: { padding: "6px 12px", background: "#6c757d", color: "white", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" },
    pdfButton: { padding: "6px 12px", background: "#212529", color: "white", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" },
    deleteButton: { padding: "6px 12px", background: "#dc3545", color: "white", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" },
    innerTable: { width: "100%", borderCollapse: "collapse", background: "#f9fafb" },
    innerTh: { border: "1px solid #e2e8f0", padding: "8px", textAlign: "left", fontSize: "12px", color: "#1a202c" },
    innerTd: { border: "1px solid #e2e8f0", padding: "8px", fontSize: "12px", color: "#4a5568" },
    detailToggle: { border: "1px solid #e2e8f0", background: "white", borderRadius: "6px", width: "28px", height: "28px", cursor: "pointer", fontSize: "12px" },
    pagination: { display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "16px" },
    pageBtn: { padding: "6px 10px", border: "1px solid #e2e8f0", background: "white", borderRadius: "6px", cursor: "pointer", fontSize: "12px" },
    pageActive: { padding: "6px 10px", border: "1px solid #0d6efd", background: "#0d6efd", color: "white", borderRadius: "6px", cursor: "pointer", fontSize: "12px" },
    pageInfo: { fontSize: "12px", color: "#718096", margin: "10px 0 0" },
};

