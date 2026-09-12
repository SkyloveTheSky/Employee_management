import { Head, usePage } from "@inertiajs/react";
import { useState } from "react";
import Sidebar from "@/Components/User/Sidebar";
import BrandMark from "@/Components/BrandMark";

export default function Index({ payrolls }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const [isOpen, setIsOpen] = useState(true);

    const formatAr = (value) => `${Number(value || 0).toLocaleString("fr-FR")} Ar`;
    const formatDate = (value) => {
        if (!value) return "-";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "-";
        return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(date);
    };
    const formatMonth = (monthYear) => {
        if (!monthYear) return "-";
        const [year, month] = monthYear.split("-");
        const date = new Date(year, parseInt(month, 10) - 1, 1);
        return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(date);
    };

    return (
        <>
            <Head title="Mes fiches de paie" />
            <Sidebar user={user} currentPage="payrolls.index" isOpen={isOpen} setIsOpen={setIsOpen} />
            <div style={{ ...styles.page, marginLeft: isOpen ? "280px" : "0px" }}>
                <div style={styles.header}>
                    <BrandMark />
                    <div>
                        <h1 style={styles.title}>Mes fiches de paie</h1>
                        <p style={styles.subtitle}>Consultation et téléchargement de vos bulletins</p>
                    </div>
                </div>

                <div style={styles.tableContainer}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Période</th>
                                <th style={styles.th}>Brut</th>
                                <th style={styles.th}>Total retenu</th>
                                <th style={styles.th}>Net à payer</th>
                                <th style={styles.th}>Date paiement</th>
                                <th style={styles.th}>Statut</th>
                                <th style={styles.th}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payrolls.length > 0 ? (
                                payrolls.map((payroll) => (
                                    <tr key={payroll.id}>
                                        <td style={styles.td}>
                                            {formatMonth(`${payroll.period_year}-${String(payroll.period_month).padStart(2, "0")}`)}
                                        </td>
                                        <td style={styles.td}>{formatAr(payroll.gross_salary)}</td>
                                        <td style={styles.td}>{formatAr(payroll.total_retenu)}</td>
                                        <td style={{ ...styles.td, fontWeight: 600 }}>{formatAr(payroll.net_to_pay)}</td>
                                        <td style={styles.td}>{formatDate(payroll.paid_at)}</td>
                                        <td style={styles.td}>
                                            <span style={payroll.payment_status === "paid" ? styles.paidBadge : styles.unpaidBadge}>
                                                {payroll.payment_status === "paid" ? "Payé" : "Non payé"}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            <button
                                                onClick={() => window.open(route("payrolls.pdf", payroll.id), "_blank")}
                                                style={styles.pdfButton}
                                            >
                                                PDF
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" style={{ ...styles.td, textAlign: "center" }}>
                                        Aucune fiche de paie disponible
                                    </td>
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
    page: { minHeight: "100vh", background: "#ffffff", fontFamily: "system-ui, sans-serif", padding: "24px", transition: "margin-left 0.3s ease" },
    header: { display: "flex", alignItems: "center", gap: "16px", background: "white", padding: "20px 24px", borderRadius: "12px", marginBottom: "24px", border: "1px solid #e2e8f0" },
    logo: { width: "44px", height: "44px", background: "var(--color-primary)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "700", fontSize: "16px", flexShrink: 0 },
    title: { fontSize: "18px", fontWeight: "600", color: "#1a202c", margin: 0 },
    subtitle: { fontSize: "13px", color: "#718096", margin: 0 },
    tableContainer: { background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "auto", padding: "20px" },
    table: { width: "100%", borderCollapse: "collapse", fontSize: "14px" },
    th: { background: "#f7fafc", padding: "12px 16px", textAlign: "left", fontWeight: "600", color: "#1a202c", borderBottom: "1px solid #e2e8f0" },
    td: { padding: "12px 16px", color: "#4a5568", borderBottom: "1px solid #e2e8f0" },
    paidBadge: { display: "inline-block", padding: "4px 8px", borderRadius: "999px", background: "#c6f6d5", color: "#276749", fontSize: "12px", fontWeight: 600 },
    unpaidBadge: { display: "inline-block", padding: "4px 8px", borderRadius: "999px", background: "#feebc8", color: "#9c4221", fontSize: "12px", fontWeight: 600 },
    pdfButton: { padding: "6px 12px", background: "#212529", color: "white", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" },
};
