import { Head, usePage } from "@inertiajs/react";
import { useState } from "react";
import Sidebar from "@/Components/User/Sidebar";

export default function Dashboard() {
    const { auth } = usePage().props;
    const user = auth?.user;
    const [isOpen, setIsOpen] = useState(true);

    return (
        <>
            <Head title="Tableau de bord" />
            <Sidebar user={user} currentPage="dashboard" isOpen={isOpen} setIsOpen={setIsOpen} />
            <div style={{ ...styles.page, marginLeft: isOpen ? "280px" : "0px" }}>
                <div style={styles.header}>
                    <div style={styles.logo}>RH</div>
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
                        <p style={styles.cardLabel}>Email</p>
                        <p style={styles.cardValue}>{user?.email || "-"}</p>
                    </div>
                    <div style={styles.card}>
                        <p style={styles.cardLabel}>Téléphone</p>
                        <p style={styles.cardValue}>{user?.phone || "-"}</p>
                    </div>
                </div>
            </div>
        </>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        background: "#f0f4f8",
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
        background: "#0F6E56",
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
};
