import { Head, router, useForm, usePage } from "@inertiajs/react";
import { useState } from "react";
import BrandMark from "@/Components/BrandMark";
import Sidebar from "../../../Components/Admin/Sidebar";
import { colors } from "@/config/colors";

const DEFAULT_THEME = {
    primary: "#261FB3",
    secondary: "#161179",
    tertiary: "#0C0950",
    background: "#FFFFFF",
};

export default function Account({ admin }) {
    const [isOpen, setIsOpen] = useState(true);
    const { flash, theme } = usePage().props;
    const passwordForm = useForm({
        current_password: "",
        password: "",
        password_confirmation: "",
    });
    const themeForm = useForm({
        primary: theme?.primary || DEFAULT_THEME.primary,
        secondary: theme?.secondary || DEFAULT_THEME.secondary,
        tertiary: theme?.tertiary || DEFAULT_THEME.tertiary,
        background: theme?.background || DEFAULT_THEME.background,
    });

    const submitPassword = (e) => {
        e.preventDefault();
        passwordForm.patch(route("admin.settings.password"), {
            preserveScroll: true,
            onSuccess: () => passwordForm.reset(),
        });
    };

    const submitTheme = (e) => {
        e.preventDefault();
        themeForm.patch(route("admin.settings.theme"), {
            preserveScroll: true,
        });
    };

    const resetTheme = () => {
        themeForm.setData(DEFAULT_THEME);
        router.patch(route("admin.settings.theme"), DEFAULT_THEME, {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Paramètres" />
            <Sidebar admin={admin} currentPage="admin.settings.edit" isOpen={isOpen} setIsOpen={setIsOpen} />
            <div style={{ ...styles.page, marginLeft: isOpen ? "280px" : "0px" }}>
                <div style={styles.header}>
                    <BrandMark />
                    <div>
                        <h1 style={styles.title}>Paramètres</h1>
                        <p style={styles.subtitle}>Compte administrateur et affichage de la plateforme</p>
                    </div>
                </div>

                {flash?.success && <p style={styles.success}>{flash.success}</p>}

                <div style={styles.card}>
                    <h2 style={styles.sectionTitle}>Compte</h2>
                    <p style={styles.meta}>
                        {admin.email_admin}
                        {admin.number_phone_admin ? ` · ${admin.number_phone_admin}` : ""}
                    </p>
                    <form onSubmit={submitPassword}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Mot de passe actuel</label>
                            <input
                                type="password"
                                value={passwordForm.data.current_password}
                                onChange={(e) => passwordForm.setData("current_password", e.target.value)}
                                style={styles.input}
                            />
                            {passwordForm.errors.current_password && (
                                <p style={styles.error}>{passwordForm.errors.current_password}</p>
                            )}
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Nouveau mot de passe</label>
                            <input
                                type="password"
                                value={passwordForm.data.password}
                                onChange={(e) => passwordForm.setData("password", e.target.value)}
                                style={styles.input}
                            />
                            {passwordForm.errors.password && <p style={styles.error}>{passwordForm.errors.password}</p>}
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Confirmer le mot de passe</label>
                            <input
                                type="password"
                                value={passwordForm.data.password_confirmation}
                                onChange={(e) => passwordForm.setData("password_confirmation", e.target.value)}
                                style={styles.input}
                            />
                        </div>
                        <button type="submit" disabled={passwordForm.processing} style={styles.button}>
                            {passwordForm.processing ? "Enregistrement..." : "Mettre à jour le mot de passe"}
                        </button>
                    </form>
                </div>

                <div style={styles.card}>
                    <h2 style={styles.sectionTitle}>Affichage</h2>
                    <p style={styles.meta}>Charte graphique de la plateforme (admin et employés).</p>
                    <form onSubmit={submitTheme}>
                        <ColorField
                            label="Primaire"
                            hint="Logo RH, menu actif, graphiques"
                            value={themeForm.data.primary}
                            onChange={(v) => themeForm.setData("primary", v)}
                            error={themeForm.errors.primary}
                        />
                        <ColorField
                            label="Secondaire"
                            hint="Carte profil dans la barre latérale"
                            value={themeForm.data.secondary}
                            onChange={(v) => themeForm.setData("secondary", v)}
                            error={themeForm.errors.secondary}
                        />
                        <ColorField
                            label="Tertiaire"
                            hint="Fond de la barre latérale"
                            value={themeForm.data.tertiary}
                            onChange={(v) => themeForm.setData("tertiary", v)}
                            error={themeForm.errors.tertiary}
                        />
                        <ColorField
                            label="Fond"
                            hint="Arrière-plan des pages"
                            value={themeForm.data.background}
                            onChange={(v) => themeForm.setData("background", v)}
                            error={themeForm.errors.background}
                        />
                        <div style={styles.previewRow}>
                            <span style={{ ...styles.swatch, background: themeForm.data.primary }} />
                            <span style={{ ...styles.swatch, background: themeForm.data.secondary }} />
                            <span style={{ ...styles.swatch, background: themeForm.data.tertiary }} />
                            <span style={{ ...styles.swatch, background: themeForm.data.background, border: "1px solid #e2e8f0" }} />
                        </div>
                        <div style={styles.actions}>
                            <button type="submit" disabled={themeForm.processing} style={styles.button}>
                                {themeForm.processing ? "Enregistrement..." : "Enregistrer l'affichage"}
                            </button>
                            <button type="button" onClick={resetTheme} style={styles.secondaryButton}>
                                Réinitialiser
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

function ColorField({ label, hint, value, onChange, error }) {
    return (
        <div style={styles.formGroup}>
            <label style={styles.label}>{label}</label>
            {hint && <p style={styles.hint}>{hint}</p>}
            <div style={styles.colorRow}>
                <input type="color" value={value} onChange={(e) => onChange(e.target.value.toUpperCase())} style={styles.colorInput} />
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    style={styles.input}
                />
            </div>
            {error && <p style={styles.error}>{error}</p>}
        </div>
    );
}

const styles = {
    page: { minHeight: "100vh", background: colors.background, fontFamily: "system-ui, sans-serif", padding: "24px", transition: "margin-left 0.3s ease" },
    header: { display: "flex", alignItems: "center", gap: "16px", background: "white", padding: "20px 24px", borderRadius: "12px", marginBottom: "24px", border: "1px solid #e2e8f0" },
    logo: { width: "44px", height: "44px", background: colors.primary, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "700", fontSize: "16px", flexShrink: 0 },
    title: { fontSize: "18px", fontWeight: "600", color: "#1a202c", margin: 0 },
    subtitle: { fontSize: "13px", color: "#718096", margin: 0 },
    card: { background: "white", borderRadius: "12px", padding: "24px", border: "1px solid #e2e8f0", maxWidth: "720px", marginBottom: "24px" },
    sectionTitle: { fontSize: "16px", fontWeight: 600, color: "#1a202c", margin: "0 0 12px" },
    meta: { fontSize: "13px", color: "#718096", margin: "0 0 16px" },
    hint: { fontSize: "12px", color: "#718096", margin: "0 0 8px" },
    success: { background: "#c6f6d5", color: "#276749", padding: "10px 14px", borderRadius: "8px", marginBottom: "16px", maxWidth: "720px" },
    formGroup: { marginBottom: "16px" },
    label: { display: "block", fontSize: "13px", fontWeight: "600", color: "#1a202c", marginBottom: "4px" },
    input: { flex: 1, width: "100%", padding: "10px 12px", fontSize: "14px", border: "1px solid #e2e8f0", borderRadius: "8px", boxSizing: "border-box", fontFamily: "system-ui, sans-serif" },
    colorRow: { display: "flex", gap: "10px", alignItems: "center" },
    colorInput: { width: "48px", height: "40px", padding: 0, border: "1px solid #e2e8f0", borderRadius: "8px", background: "white", cursor: "pointer" },
    error: { fontSize: "12px", color: "#dc3545", margin: "4px 0 0" },
    previewRow: { display: "flex", gap: "8px", marginBottom: "16px" },
    swatch: { width: "36px", height: "36px", borderRadius: "8px" },
    actions: { display: "flex", gap: "10px", flexWrap: "wrap" },
    button: { padding: "10px 16px", background: "#0d6efd", color: "white", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer" },
    secondaryButton: { padding: "10px 16px", background: "white", color: "#4a5568", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer" },
};
