import { Head, router, useForm } from "@inertiajs/react";
import { Fragment, useState } from "react";
import Sidebar from "../../../Components/Admin/Sidebar";

export default function Index({ admin, payrolls, employees }) {
    const [isOpen, setIsOpen] = useState(true);
    const { data, setData, post, processing, errors, reset } = useForm({
        user_id: "",
        period_month: "",
        period_year: new Date().getFullYear(),
        prime_amount: 0,
        overtime_amount: 0,
        cnaps_rate: 1,
        assurance_rate: 1,
        payment_method: "virement",
        payment_status: "unpaid",
        paid_at: "",
        notes: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("admin.payrolls.store"), {
            onSuccess: () => reset("prime_amount", "overtime_amount", "cnaps_rate", "assurance_rate", "paid_at", "notes"),
        });
    };

    const formatAr = (value) => `${Number(value || 0).toLocaleString("fr-FR")} Ar`;
    const formatDate = (value) => {
        if (!value) return "-";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "-";
        return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(date);
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
            <div style={{ ...styles.page, marginLeft: isOpen ? "280px" : "0px" }}>
                <div style={styles.header}>
                    <div style={styles.logo}>RH</div>
                    <div>
                        <h1 style={styles.title}>Fiches de paie</h1>
                        <p style={styles.subtitle}>Génération semi-automatique et suivi de paiement</p>
                    </div>
                </div>

                <form onSubmit={submit} style={styles.formCard}>
                    <h2 style={styles.sectionTitle}>Générer une fiche</h2>
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
                        <div>
                            <label style={styles.label}>Mois (1-12)</label>
                            <input type="number" min="1" max="12" value={data.period_month} onChange={(e) => setData("period_month", e.target.value)} style={styles.input} />
                            {errors.period_month && <p style={styles.error}>{errors.period_month}</p>}
                        </div>
                        <div>
                            <label style={styles.label}>Année</label>
                            <input type="number" min="2000" max="2100" value={data.period_year} onChange={(e) => setData("period_year", e.target.value)} style={styles.input} />
                            {errors.period_year && <p style={styles.error}>{errors.period_year}</p>}
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

                    <button type="submit" disabled={processing} style={styles.button}>
                        Générer
                    </button>
                </form>

                <div style={styles.tableContainer}>
                    <h2 style={styles.sectionTitle}>Suivi des paiements</h2>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Employé</th>
                                <th style={styles.th}>Période</th>
                                <th style={styles.th}>Brut</th>
                                <th style={styles.th}>Total retenu</th>
                                <th style={styles.th}>Net à payer</th>
                                <th style={styles.th}>Mode</th>
                                <th style={styles.th}>Date paiement</th>
                                <th style={styles.th}>Statut</th>
                                <th style={styles.th}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payrolls.length > 0 ? (
                                payrolls.map((payroll) => (
                                    <Fragment key={payroll.id}>
                                        <tr>
                                            <td style={styles.td}>{payroll.user?.first_name} {payroll.user?.last_name}</td>
                                            <td style={styles.td}>{String(payroll.period_month).padStart(2, "0")}/{payroll.period_year}</td>
                                            <td style={styles.td}>{formatAr(payroll.gross_salary)}</td>
                                            <td style={styles.td}>{formatAr(payroll.total_retenu)}</td>
                                            <td style={{ ...styles.td, fontWeight: 600 }}>{formatAr(payroll.net_to_pay)}</td>
                                            <td style={styles.td}>{payroll.payment_method}</td>
                                            <td style={styles.td}>{formatDate(payroll.paid_at)}</td>
                                            <td style={styles.td}>{payroll.payment_status === "paid" ? "Payé" : "Non payé"}</td>
                                            <td style={styles.actionsCell}>
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
                                        <tr>
                                            <td style={styles.td} colSpan="9">
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
                                    </Fragment>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="9" style={{ ...styles.td, textAlign: "center" }}>Aucune fiche générée</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

const styles = {
    page: { minHeight: "100vh", background: "#f0f4f8", fontFamily: "system-ui, sans-serif", padding: "24px", transition: "margin-left 0.3s ease" },
    header: { display: "flex", alignItems: "center", gap: "16px", background: "white", padding: "20px 24px", borderRadius: "12px", marginBottom: "24px", border: "1px solid #e2e8f0" },
    logo: { width: "44px", height: "44px", background: "#0F6E56", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "700", fontSize: "16px", flexShrink: 0 },
    title: { fontSize: "18px", fontWeight: "600", color: "#1a202c", margin: 0 },
    subtitle: { fontSize: "13px", color: "#718096", margin: 0 },
    formCard: { background: "white", borderRadius: "12px", marginBottom: "24px", border: "1px solid #e2e8f0", padding: "20px" },
    sectionTitle: { fontSize: "16px", fontWeight: 600, color: "#1a202c", margin: "0 0 16px" },
    grid: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "12px", marginBottom: "14px" },
    label: { display: "block", fontSize: "12px", marginBottom: "6px", color: "#4a5568" },
    input: { width: "100%", border: "1px solid #cbd5e0", borderRadius: "8px", padding: "9px 10px", fontSize: "13px", boxSizing: "border-box" },
    button: { background: "#0F6E56", color: "white", border: "none", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", cursor: "pointer" },
    error: { marginTop: "4px", marginBottom: 0, color: "#e53e3e", fontSize: "12px" },
    tableContainer: { background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "auto", padding: "20px" },
    table: { width: "100%", borderCollapse: "collapse", fontSize: "14px" },
    th: { background: "#f7fafc", padding: "12px 16px", textAlign: "left", fontWeight: "600", color: "#1a202c", borderBottom: "1px solid #e2e8f0" },
    td: { padding: "12px 16px", color: "#4a5568", borderBottom: "1px solid #e2e8f0" },
    actionsCell: { padding: "12px 16px", color: "#4a5568", borderBottom: "1px solid #e2e8f0", display: "flex", gap: "8px" },
    editButton: { padding: "6px 12px", background: "#3182ce", color: "white", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" },
    pdfButton: { padding: "6px 12px", background: "#111827", color: "white", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" },
    deleteButton: { padding: "6px 12px", background: "#e53e3e", color: "white", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" },
    innerTable: { width: "100%", borderCollapse: "collapse", background: "#f9fafb" },
    innerTh: { border: "1px solid #e2e8f0", padding: "8px", textAlign: "left", fontSize: "12px", color: "#1a202c" },
    innerTd: { border: "1px solid #e2e8f0", padding: "8px", fontSize: "12px", color: "#4a5568" },
};

