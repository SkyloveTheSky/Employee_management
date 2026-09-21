import { Head, usePage } from "@inertiajs/react";
import Sidebar from "@/Components/User/Sidebar";
import BrandMark from "@/Components/BrandMark";
import HeaderTools from "@/Components/HeaderTools";
import { colors } from "@/config/colors";
import { useSidebar } from "@/hooks/useSidebar";
import { useDateLocale, useT } from "@/i18n";

export default function Index({ payrolls }) {
    const t = useT();
    const dateLoc = useDateLocale();
    const { auth } = usePage().props;
    const user = auth?.user;
    const { isOpen, setIsOpen, offset } = useSidebar();

    const formatAr = (value) => `${Number(value || 0).toLocaleString(dateLoc)} Ar`;
    const formatDate = (value) => {
        if (!value) return t("common.dash");
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return t("common.dash");
        return new Intl.DateTimeFormat(dateLoc, { day: "2-digit", month: "long", year: "numeric" }).format(date);
    };
    const formatMonth = (monthYear) => {
        if (!monthYear) return t("common.dash");
        const [year, month] = monthYear.split("-");
        const date = new Date(year, parseInt(month, 10) - 1, 1);
        return new Intl.DateTimeFormat(dateLoc, { month: "long", year: "numeric" }).format(date);
    };

    return (
        <>
            <Head title={t("payrolls.title")} />
            <Sidebar user={user} currentPage="payrolls.index" isOpen={isOpen} setIsOpen={setIsOpen} />
            <div className="app-page" style={{ ...styles.page, marginLeft: offset }}>
                <div className="app-header" style={styles.header}>
                    <BrandMark />
                    <div>
                        <h1 style={styles.title}>{t("payrolls.title")}</h1>
                        <p style={styles.subtitle}>{t("payrolls.subtitle")}</p>
                    </div>
                    <HeaderTools />
                </div>

                <div className="app-table-wrap" style={styles.tableContainer}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>{t("payrolls.period")}</th>
                                <th style={styles.th}>{t("payrolls.gross")}</th>
                                <th style={styles.th}>{t("payrolls.withheld")}</th>
                                <th style={styles.th}>{t("payrolls.net")}</th>
                                <th style={styles.th}>{t("payrolls.paidAt")}</th>
                                <th style={styles.th}>{t("payrolls.status")}</th>
                                <th style={styles.th}>{t("payrolls.actions")}</th>
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
                                                {payroll.payment_status === "paid" ? t("payrolls.paid") : t("payrolls.unpaid")}
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
                                        {t("payrolls.empty")}
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
    page: { minHeight: "100vh", background: "var(--color-background)", fontFamily: "system-ui, sans-serif", padding: "24px", transition: "margin-left 0.3s ease" },
    header: { display: "flex", alignItems: "center", gap: "16px", background: colors.surface, padding: "20px 24px", borderRadius: "12px", marginBottom: "24px", border: `1px solid ${colors.border}` },
    logo: { width: "44px", height: "44px", background: "var(--color-primary)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "700", fontSize: "16px", flexShrink: 0 },
    title: { fontSize: "18px", fontWeight: "600", color: colors.dark, margin: 0 },
    subtitle: { fontSize: "13px", color: colors.muted, margin: 0 },
    tableContainer: { background: colors.surface, borderRadius: "12px", border: `1px solid ${colors.border}`, overflow: "auto", padding: "20px" },
    table: { width: "100%", borderCollapse: "collapse", fontSize: "14px" },
    th: { background: "#f7fafc", padding: "12px 16px", textAlign: "left", fontWeight: "600", color: colors.dark, borderBottom: `1px solid ${colors.border}` },
    td: { padding: "12px 16px", color: "#4a5568", borderBottom: `1px solid ${colors.border}` },
    paidBadge: { display: "inline-block", padding: "4px 8px", borderRadius: "999px", background: "#c6f6d5", color: "#276749", fontSize: "12px", fontWeight: 600 },
    unpaidBadge: { display: "inline-block", padding: "4px 8px", borderRadius: "999px", background: "#feebc8", color: "#9c4221", fontSize: "12px", fontWeight: 600 },
    pdfButton: { padding: "6px 12px", background: "var(--color-primary)", color: "white", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" },
};
