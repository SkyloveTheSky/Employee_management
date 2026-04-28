import { Head, router, useForm } from "@inertiajs/react";
import { useState } from "react";
import Sidebar from "../../../Components/Admin/Sidebar";

export default function Edit({ admin, payroll, employees }) {
    const [isOpen, setIsOpen] = useState(true);
    const monthYear = `${payroll.period_year}-${String(payroll.period_month).padStart(2, '0')}`;
    const { data, setData, patch, processing, errors } = useForm({
        user_id: payroll.user_id || "",
        period_month_year: monthYear,
        prime_amount: Number(payroll.prime_amount || 0),
        overtime_amount: Number(payroll.overtime_amount || 0),
        cnaps_rate: Number(payroll.cnaps_rate || 1),
        assurance_rate: Number(payroll.assurance_rate || 1),
        payment_method: payroll.payment_method || "virement",
        payment_status: payroll.payment_status || "unpaid",
        paid_at: payroll.paid_at ? String(payroll.paid_at).slice(0, 10) : "",
        notes: payroll.notes || "",
    });

    const submit = (e) => {
        e.preventDefault();
        patch(route("admin.payrolls.update", payroll.id));
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

    return (
        <>
            <Head title="Modifier une fiche de paie" />
            <Sidebar admin={admin} currentPage="admin.payrolls.index" isOpen={isOpen} setIsOpen={setIsOpen} />
            <div style={{ ...styles.page, marginLeft: isOpen ? "280px" : "0px" }}>
                <div style={styles.header}>
                    <div style={styles.logo}>RH</div>
                    <div>
                        <h1 style={styles.title}>Modifier une fiche</h1>
                        <p style={styles.subtitle}>Mettre à jour les montants et le paiement</p>
                    </div>
                </div>

                <form onSubmit={submit} style={styles.formCard}>
                    <div style={styles.grid}>
                        <div>
                            <label style={styles.label}>Employé</label>
                            <select value={data.user_id} onChange={(e) => setData("user_id", e.target.value)} style={styles.input}>
                                <option value="">-- Choisir --</option>
                                {employees.map((employee) => (
                                    <option key={employee.id} value={employee.id}>
                                        {employee.first_name} {employee.last_name}
                                    </option>
                                ))}
                            </select>
                            {errors.user_id && <p style={styles.error}>{errors.user_id}</p>}
                        </div>
                        <div>
                            <label style={styles.label}>Période (Mois et Année)</label>
                            <select
                                value={data.period_month_year}
                                onChange={(e) => setData("period_month_year", e.target.value)}
                                style={styles.input}
                            >
                                <option value="">-- Sélectionner un mois --</option>
                                {generateMonthsList().map((month) => (
                                    <option key={month.value} value={month.value}>
                                        {month.label}
                                    </option>
                                ))}
                            </select>
                            {data.period_month_year && (
                                <p style={{ fontSize: '14px', color: '#666', marginTop: '5px', fontWeight: '500' }}>
                                    📅 Fiche de paie pour: <strong>{formatMonth(data.period_month_year)}</strong>
                                </p>
                            )}
                            {errors.period_month_year && <p style={styles.error}>{errors.period_month_year}</p>}
                            {errors.period_month && <p style={styles.error}>{errors.period_month}</p>}
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
                        <div>
                            <label style={styles.label}>Statut</label>
                            <select value={data.payment_status} onChange={(e) => setData("payment_status", e.target.value)} style={styles.input}>
                                <option value="unpaid">Non payé</option>
                                <option value="paid">Payé</option>
                            </select>
                            {errors.payment_status && <p style={styles.error}>{errors.payment_status}</p>}
                        </div>
                        <div>
                            <label style={styles.label}>Date de paiement</label>
                            <input type="date" value={data.paid_at} onChange={(e) => setData("paid_at", e.target.value)} style={styles.input} />
                            {errors.paid_at && <p style={styles.error}>{errors.paid_at}</p>}
                        </div>
                    </div>

                    <div style={styles.actions}>
                        <button type="button" style={styles.cancelButton} onClick={() => router.visit(route("admin.payrolls.index"))}>
                            Annuler
                        </button>
                        <button type="submit" style={styles.submitButton} disabled={processing}>
                            {processing ? "Mise à jour..." : "Mettre à jour"}
                        </button>
                    </div>
                </form>
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
    formCard: { background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "20px" },
    grid: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "12px", marginBottom: "14px" },
    label: { display: "block", fontSize: "12px", marginBottom: "6px", color: "#4a5568" },
    input: { width: "100%", border: "1px solid #cbd5e0", borderRadius: "8px", padding: "9px 10px", fontSize: "13px", boxSizing: "border-box" },
    error: { marginTop: "4px", marginBottom: 0, color: "#e53e3e", fontSize: "12px" },
    actions: { display: "flex", gap: "12px", marginTop: "10px" },
    cancelButton: { padding: "10px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "white", cursor: "pointer" },
    submitButton: { background: "#0F6E56", color: "white", border: "none", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", cursor: "pointer" },
};

