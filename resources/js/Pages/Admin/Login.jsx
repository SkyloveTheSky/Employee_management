import { useForm, Head } from "@inertiajs/react";
import { colors } from "@/config/colors";
import BrandMark from "@/Components/BrandMark";
import ThemeSync from "@/Components/ThemeSync";

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email_admin: "",
        password_admin: "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("admin.login.post"));
    };

    return (
        <>
            <Head title="Connexion Admin" />
            <ThemeSync />
            <div style={styles.page}>
                <div style={styles.card}>
                    <div style={styles.header}>
                        <BrandMark size={56} />
                        <h1 style={styles.title}>Espace Administrateur</h1>
                        <p style={styles.subtitle}>
                            Connectez-vous pour accéder au tableau de bord
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} style={styles.form}>
                        <div style={styles.field}>
                            <label style={styles.label}>Adresse email</label>
                            <input
                                type="email"
                                value={data.email_admin}
                                onChange={(e) =>
                                    setData("email_admin", e.target.value)
                                }
                                placeholder="admin@entreprise.mg"
                                style={{
                                    ...styles.input,
                                    ...(errors.email_admin
                                        ? styles.inputError
                                        : {}),
                                }}
                            />
                            {errors.email_admin && (
                                <span style={styles.error}>
                                    {errors.email_admin}
                                </span>
                            )}
                        </div>

                        <div style={styles.field}>
                            <label style={styles.label}>Mot de passe</label>
                            <input
                                type="password"
                                value={data.password_admin}
                                onChange={(e) =>
                                    setData("password_admin", e.target.value)
                                }
                                placeholder="••••••••"
                                style={{
                                    ...styles.input,
                                    ...(errors.password_admin
                                        ? styles.inputError
                                        : {}),
                                }}
                            />
                            {errors.password_admin && (
                                <span style={styles.error}>
                                    {errors.password_admin}
                                </span>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            style={{
                                ...styles.button,
                                ...(processing ? styles.buttonDisabled : {}),
                            }}
                        >
                            {processing ? "Connexion..." : "Se connecter"}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        background: colors.background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, sans-serif",
        padding: "20px",
    },
    card: {
        background: colors.surface,
        borderRadius: "12px",
        padding: "40px",
        width: "100%",
        maxWidth: "420px",
        border: `1px solid ${colors.border}`,
    },
    header: {
        textAlign: "center",
        marginBottom: "32px",
    },
    logo: {
        width: "56px",
        height: "56px",
        background: colors.primary,
        borderRadius: "14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontSize: "20px",
        fontWeight: "700",
        margin: "0 auto 16px",
    },
    title: {
        fontSize: "22px",
        fontWeight: "600",
        color: colors.dark,
        margin: "0 0 8px",
    },
    subtitle: {
        fontSize: "14px",
        color: colors.muted,
        margin: 0,
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "20px",
    },
    field: {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
    },
    label: {
        fontSize: "13px",
        fontWeight: "500",
        color: colors.dark,
    },
    input: {
        padding: "10px 14px",
        borderRadius: "8px",
        border: "1px solid #e2e8f0",
        fontSize: "14px",
        color: "#1a202c",
        outline: "none",
        transition: "border-color 0.2s",
    },
    inputError: {
        borderColor: "#e53e3e",
    },
    error: {
        fontSize: "12px",
        color: "#e53e3e",
    },
    button: {
        padding: "12px",
        background: colors.btnPrimary,
        color: "white",
        border: "none",
        borderRadius: "8px",
        fontSize: "15px",
        fontWeight: "500",
        cursor: "pointer",
        marginTop: "4px",
        transition: "background 0.2s",
    },
    buttonDisabled: {
        background: colors.btnSecondary,
        cursor: "not-allowed",
    },
};
