import { Head, usePage } from "@inertiajs/react";
import { useState } from "react";
import Sidebar from "@/Components/User/Sidebar";
import UpdatePasswordForm from "./Partials/UpdatePasswordForm";

export default function Edit() {
    const { auth } = usePage().props;
    const user = auth?.user;
    const [isOpen, setIsOpen] = useState(true);

    return (
        <>
            <Head title="Paramètres" />
            <Sidebar user={user} currentPage="profile.edit" isOpen={isOpen} setIsOpen={setIsOpen} />
            <div style={{ ...styles.page, marginLeft: isOpen ? "280px" : "0px" }}>
                <div style={styles.header}>
                    <div style={styles.logo}>RH</div>
                    <div>
                        <h1 style={styles.title}>Paramètres</h1>
                        <p style={styles.subtitle}>Modifier uniquement votre mot de passe</p>
                    </div>
                </div>

                <div style={styles.card}>
                    <UpdatePasswordForm />
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
        background: "#261FB3",
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
    card: {
        background: "white",
        borderRadius: "12px",
        padding: "24px",
        border: "1px solid #e2e8f0",
        maxWidth: "720px",
    },
};
