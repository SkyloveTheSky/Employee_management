import { Head, Link, usePage } from "@inertiajs/react";
import { useState } from "react";
import Sidebar from "@/Components/User/Sidebar";
import BrandMark from "@/Components/BrandMark";

export default function Dashboard({ latestPayroll = null, unpaidCount = 0 }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const [isOpen, setIsOpen] = useState(true);

    const formatAr = (value) => `${Number(value || 0).toLocaleString("fr-FR")} Ar`;
    const formatMonth = (payroll) => {
        if (!payroll) return "-";
        const date = new Date(payroll.period_year, payroll.period_month - 1, 1);
        return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(date);
    };

    return (
        <>
            <Head title="Tableau de bord" />
            <Sidebar user={user} currentPage="dashboard" isOpen={isOpen} setIsOpen={setIsOpen} />
            <div style={{ ...styles.page, marginLeft: isOpen ? "280px" : "0px" }}>
                <div style={styles.header}>
                    <BrandMark />
                    <div>
                        <h1 style={styles.title}>Tableau de bord</h1>
                        <p style={styles.subtitle}>
                            Bonjour, {user?.first_name} {user?.last_name}
                        </p>
                    </div>
                </div>

                <div style={styles.content}>
                    <div style={styles.card}>
                        <p style={styles.cardLabel}>Poste</p>
                        <p style={styles.cardValue}>{user?.position || "-"}</p>
                    </div>
                    <div style={styles.card}>
                        <p style={styles.cardLabel}>Dernière fiche</p>
                        <p style={styles.cardValue}>
                            {latestPayroll
                                ? `${formatMonth(latestPayroll)} · ${formatAr(latestPayroll.net_to_pay)}`
                                : "Aucune fiche"}
                        </p>
                        {latestPayroll && (
                            <p style={styles.cardHint}>
                                {latestPayroll.payment_status === "paid" ? "Payée" : "Non payée"}
                            </p>
                        )}
                    </div>
                    <div style={styles.card}>
                        <p style={styles.cardLabel}>Fiches non payées</p>
                        <p style={styles.cardValue}>{unpaidCount}</p>
                        <Link href={route("payrolls.index")} style={styles.cardLink}>
                            Voir mes fiches
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        background: "#ffffff",
        fontFamily: "system-ui, sans-serif",
        padding: "24px",
        transition: "margin-left 0.3s ease",
    },
    header: {
        display: "flex",
        alignItems: "center",
        gap: "16px",
        background: "white",
        padding: "20px 24px",
        borderRadius: "12px",
        marginBottom: "24px",
        border: "1px solid #e2e8f0",
    },
    logo: {
        width: "44px",
        height: "44px",
        background: "var(--color-primary)",
        borderRadius: "10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
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
        color: "#718096",
        margin: 0,
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
        fontSize: "15px",
        fontWeight: "500",
        color: "#1a202c",
        margin: 0,
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
        color: "var(--color-primary)",
        fontWeight: 600,
        textDecoration: "none",
    },
};
