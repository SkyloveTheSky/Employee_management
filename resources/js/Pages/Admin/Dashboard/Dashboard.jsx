import { Head, router } from "@inertiajs/react";
import Sidebar from "../../../Components/Admin/Sidebar";
import { useState, useEffect } from "react";
import { colors, gradients } from "@/config/colors";
import Chart_Users from "@/Components/Admin/Charts/Chart_Users";

export default function Dashboard({ admin, totalUsers }) {
    const [isOpen, setIsOpen] = useState(true);

    const logout = () => {
        router.post(route("admin.logout"));
    };

    const [chartData, setChartData] = useState([]);

     useEffect(() => {
        fetch(route("admin.dashboard.chart-data"))
            .then((res) => res.json())
            .then((data) => {
                setChartData(data.users_per_month);
            });
    }, []);

    return (
        <>
            <Head title="Tableau de bord" />
            <Sidebar admin={admin} currentPage="admin.dashboard" isOpen={isOpen} setIsOpen={setIsOpen} />
            <div style={{ ...styles.page, marginLeft: isOpen ? "280px" : "0px" }}>
                <div style={styles.header}>
                    <div style={styles.logo}>RH</div>
                    <div>
                        <h1 style={styles.title}>Tableau de bord</h1>
                        <p style={styles.subtitle}>
                            Bonjour, {admin.first_name_admin} {admin.name_admin}
                        </p>
                    </div>

                </div>
                <div style={styles.content}>
                    <div style={styles.card}>
                        <div style={styles.cardHeader}>
                            <img src="/assets/icon/user.svg" alt="Users" style={styles.cardIcon}/>
                            <p style={styles.cardLabel}>Nombre d'employés</p>
    </div>
                        <p style={styles.cardValue}>{totalUsers}</p>
                    </div>
                    <div style={styles.card}>
                        <p style={styles.cardLabel}>Email</p>
                        <p style={styles.cardValue}>{admin.email_admin}</p>
                    </div>
                    <div style={styles.card}>
                        <p style={styles.cardLabel}>Téléphone</p>
                        <p style={styles.cardValue}>{admin.number_phone_admin}</p>
                    </div>
                    <div>
                        <Chart_Users data={chartData} />
                    </div>
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
        background: gradients.primary,
        padding: "20px 24px",
        borderRadius: "8px",
        marginBottom: "24px",
        border: `1px solid ${colors.primaryLight}`,
    },
    logo: {
        width: "44px",
        height: "44px",
        background: colors.primaryDark,
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
        color: colors.white,
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
        fontSize: "24px",
        fontWeight: "500",
        color: "#1a202c",
        margin: 0,
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

};
