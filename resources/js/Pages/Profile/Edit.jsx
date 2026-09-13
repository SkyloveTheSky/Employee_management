import { Head, usePage } from "@inertiajs/react";
import Sidebar from "@/Components/User/Sidebar";
import BrandMark from "@/Components/BrandMark";
import HeaderTools from "@/Components/HeaderTools";
import { colors } from "@/config/colors";
import { useSidebar } from "@/hooks/useSidebar";
import UpdatePasswordForm from "./Partials/UpdatePasswordForm";

export default function Edit() {
    const { auth } = usePage().props;
    const user = auth?.user;
    const { isOpen, setIsOpen, offset } = useSidebar();

    return (
        <>
            <Head title="Paramètres" />
            <Sidebar user={user} currentPage="profile.edit" isOpen={isOpen} setIsOpen={setIsOpen} />
            <div className="app-page" style={{ ...styles.page, marginLeft: offset }}>
                <div className="app-header" style={styles.header}>
                    <BrandMark />
                    <div>
                        <h1 style={styles.title}>Paramètres</h1>
                        <p style={styles.subtitle}>Modifier uniquement votre mot de passe</p>
                    </div>
                    <HeaderTools />
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
        background: "var(--color-background)",
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
        color: colors.dark,
        margin: 0,
    },
    subtitle: {
        fontSize: "13px",
        color: colors.muted,
        margin: 0,
    },
    card: {
        background: colors.surface,
        borderRadius: "12px",
        padding: "24px",
        border: `1px solid ${colors.border}`,
        maxWidth: "720px",
    },
};
