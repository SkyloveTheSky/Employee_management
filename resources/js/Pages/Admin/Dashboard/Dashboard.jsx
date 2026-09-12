import { Head, Link, router } from "@inertiajs/react";
import BrandMark from "@/Components/BrandMark";
import Sidebar from "../../../Components/Admin/Sidebar";
import { useState, useEffect } from "react";
import { colors } from "@/config/colors";
import Chart_Users from "@/Components/Admin/Charts/Chart_Users";
import Chart_Payroll from "@/Components/Admin/Charts/Chart_Payroll";

export default function Dashboard({
    admin,
    totalUsers,
    payrollMass = 0,
    unpaidCount = 0,
    unpaidAmount = 0,
    periodMonth,
    periodYear,
}) {
    const [isOpen, setIsOpen] = useState(true);
    const [chartData, setChartData] = useState([]);
    const [payrollChartData, setPayrollChartData] = useState([]);

    const logout = () => {
        router.post(route("admin.logout"));
    };

    const formatAr = (value) =>
        `${Number(value || 0).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} Ar`;
    const periodLabel =
        periodMonth && periodYear
            ? new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(
                  new Date(periodYear, periodMonth - 1, 1)
              )
            : "";

    useEffect(() => {
        fetch(route("admin.dashboard.chart-data"))
            .then((res) => res.json())
            .then((data) => {
                setChartData(data.users_per_month);
                setPayrollChartData(data.payroll_per_month || []);
            });
    }, []);

    return (
        <>
            <Head title="Tableau de bord" />

            <Sidebar
                admin={admin}
                currentPage="admin.dashboard"
                isOpen={isOpen}
                setIsOpen={setIsOpen}
            />

            <div style={{ ...styles.page, marginLeft: isOpen ? "280px" : "0px" }}>
                <div style={styles.header}>
                    <BrandMark />
                    <div>
                        <h1 style={styles.title}>Tableau de bord</h1>
                        <p style={styles.subtitle}>
                            Bonjour, {admin.first_name_admin} {admin.name_admin}
                        </p>
                    </div>
                </div>

                {/* CARDS */}
                <div style={styles.content}>
                    <div style={styles.card}>
                        <div style={styles.cardHeader}>
                            <img src="/assets/icon/user.svg" alt="Users" style={styles.cardIcon}/>
                            <p style={styles.cardLabel}>Nombre d'employés</p>
                        </div>
                        <p style={styles.cardValue}>{totalUsers}</p>
                    </div>

                    <div style={styles.card}>
                        <p style={styles.cardLabel}>Masse salariale{periodLabel ? ` · ${periodLabel}` : ""}</p>
                        <p style={styles.cardValue}>{formatAr(payrollMass)}</p>
                        <p style={styles.cardHint}>Nets à payer du mois</p>
                    </div>

                    <div style={styles.card}>
                        <p style={styles.cardLabel}>Fiches non payées{periodLabel ? ` · ${periodLabel}` : ""}</p>
                        <p style={{ ...styles.cardValue, color: unpaidCount > 0 ? "#9c4221" : "#1a202c" }}>
                            {unpaidCount}
                        </p>
                        <p style={styles.cardHint}>{formatAr(unpaidAmount)} en attente</p>
                        <Link
                            href={route("admin.payrolls.index", { filter_status: "unpaid" })}
                            style={styles.cardLink}
                        >
                            Voir le suivi
                        </Link>
                    </div>
                </div>
                <div style={styles.chartWrapper}>
                    <Chart_Users data={chartData || []} />
                </div>
                <div style={styles.chartWrapper}>
                    <Chart_Payroll data={payrollChartData || []} />
                </div>
            </div>
        </>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        background: colors.background,
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
    logo: {
        width: "44px",
        height: "44px",
        background: colors.primary,
        borderRadius: "10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: colors.white,
        fontWeight: "700",
        fontSize: "16px",
        flexShrink: 0,
    },
    title: {
        fontSize: "18px",
        fontWeight: "600",
        color: "#1a202c",
        margin: 0,
    },
    subtitle: {
        fontSize: "13px",
        color: colors.muted,
        margin: 0,
    },
    logout: {
        marginLeft: "auto",
        padding: "8px 16px",
        background: colors.error,
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        fontSize: "13px",
        cursor: "pointer",
        color: "#718096",
    },
    content: {
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "16px",
    },
    card: {
        background: "white",
        borderRadius: "12px",
        padding: "20px",
        border: "1px solid #e2e8f0",
    },
    cardLabel: {
        fontSize: "12px",
        color: "#718096",
        margin: "0 0 6px",
    },
    cardValue: {
        fontSize: "22px",
        fontWeight: "500",
        color: "#1a202c",
        margin: 0,
        wordBreak: "break-word",
    },
    cardHint: {
        fontSize: "12px",
        color: "#718096",
        margin: "6px 0 0",
    },
    cardLink: {
        display: "inline-block",
        marginTop: "8px",
        fontSize: "13px",
        color: colors.primary,
        fontWeight: 600,
        textDecoration: "none",
    },
    cardHeader: {
        display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "10px",
    },

    cardIcon: {
        width: "22px",
        height: "22px",
    },
    chartWrapper: {
    marginTop: "20px",
    background: "white",
    borderRadius: "12px",
    padding: "20px",
    border: "1px solid #e2e8f0",
},

};
