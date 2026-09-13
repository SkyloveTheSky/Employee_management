import { Head, Link, usePage } from "@inertiajs/react";
import BrandMark from "@/Components/BrandMark";
import SplitAuthLayout from "@/Layouts/SplitAuthLayout";
import { colors } from "@/config/colors";

export default function Welcome({ auth }) {
    const { company } = usePage().props;
    const companyName = company?.name || "Entreprise";

    return (
        <SplitAuthLayout>
            <Head title="Accueil" />
            <BrandMark size={80} layout="banner" />

            <div style={styles.card}>
                <div style={styles.header}>
                    <h1 style={styles.title}>{companyName}</h1>
                    <p style={styles.subtitle}>
                        Gestion de la paie et des employés
                    </p>
                </div>

                <div style={styles.actions}>
                    {auth?.user ? (
                        <Link href={route("dashboard")} style={styles.primary}>
                            Accéder à mon espace
                        </Link>
                    ) : (
                        <>
                            <Link href={route("admin.login")} style={styles.primary}>
                                Espace administrateur
                            </Link>
                            <Link href={route("login")} style={styles.secondary}>
                                Espace employé
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </SplitAuthLayout>
    );
}

const styles = {
    card: {
        background: colors.surface,
        borderRadius: "8px",
        padding: "32px",
        width: "100%",
        marginTop: "32px",
        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.08)",
    },
    header: {
        textAlign: "center",
        marginBottom: "24px",
    },
    title: {
        fontSize: "20px",
        fontWeight: "600",
        color: colors.dark,
        margin: "0 0 8px",
    },
    subtitle: {
        fontSize: "14px",
        color: colors.muted,
        margin: 0,
    },
    actions: {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
    },
    primary: {
        display: "block",
        textAlign: "center",
        padding: "12px",
        background: colors.btnPrimary,
        color: "white",
        borderRadius: "8px",
        fontSize: "15px",
        fontWeight: "500",
        textDecoration: "none",
    },
    secondary: {
        display: "block",
        textAlign: "center",
        padding: "12px",
        background: "white",
        color: colors.dark,
        border: `1px solid ${colors.border}`,
        borderRadius: "8px",
        fontSize: "15px",
        fontWeight: "500",
        textDecoration: "none",
    },
};
