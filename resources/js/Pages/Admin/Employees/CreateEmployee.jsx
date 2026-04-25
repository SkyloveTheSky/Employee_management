import { Head, router } from "@inertiajs/react";
import Sidebar from "../../../Components/Admin/Sidebar";
import { useState } from "react";

export default function CreateEmployee({ admin, isOpen: initialOpen = true }) {
    const [isOpen, setIsOpen] = useState(initialOpen);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ""
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);

        router.post(route('admin.employees.store'), formData, {
            onError: (errors) => {
                setErrors(errors);
                setLoading(false);
            },
            onSuccess: () => {
                setLoading(false);
            }
        });
    };

    return (
        <>
            <Head title="Créer un Employé" />
            <Sidebar admin={admin} currentPage="admin.employees" isOpen={isOpen} setIsOpen={setIsOpen} />
            <div style={{ ...styles.page, marginLeft: isOpen ? "280px" : "0px" }}>
                <div style={styles.header}>
                    <div style={styles.logo}>RH</div>
                    <div>
                        <h1 style={styles.title}>Créer un Nouvel Employé</h1>
                        <p style={styles.subtitle}>
                            Ajoutez un nouvel employé à votre plateforme
                        </p>
                    </div>
                </div>

                <div style={styles.formContainer}>
                    <form onSubmit={handleSubmit}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Nom Complet</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Ex: Jean Dupont"
                                style={{
                                    ...styles.input,
                                    borderColor: errors.name ? "#e53e3e" : "#e2e8f0",
                                }}
                            />
                            {errors.name && <p style={styles.error}>{errors.name}</p>}
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Ex: jean@example.com"
                                style={{
                                    ...styles.input,
                                    borderColor: errors.email ? "#e53e3e" : "#e2e8f0",
                                }}
                            />
                            {errors.email && <p style={styles.error}>{errors.email}</p>}
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Mot de passe</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Minimum 6 caractères"
                                style={{
                                    ...styles.input,
                                    borderColor: errors.password ? "#e53e3e" : "#e2e8f0",
                                }}
                            />
                            {errors.password && <p style={styles.error}>{errors.password}</p>}
                        </div>

                        <div style={styles.formActions}>
                            <button
                                type="button"
                                onClick={() => router.visit(route('admin.employees'))}
                                style={styles.cancelButton}
                                disabled={loading}
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                style={styles.submitButton}
                                disabled={loading}
                            >
                                {loading ? "Création en cours..." : "Créer l'Employé"}
                            </button>
                        </div>
                    </form>
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
    formContainer: {
        background: "white",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        padding: "24px",
        maxWidth: "500px",
    },
    formGroup: {
        marginBottom: "20px",
    },
    label: {
        display: "block",
        fontSize: "13px",
        fontWeight: "600",
        color: "#1a202c",
        marginBottom: "8px",
    },
    input: {
        width: "100%",
        padding: "10px 12px",
        fontSize: "14px",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        boxSizing: "border-box",
        fontFamily: "system-ui, sans-serif",
    },
    error: {
        fontSize: "12px",
        color: "#e53e3e",
        marginTop: "4px",
        margin: "4px 0 0 0",
    },
    formActions: {
        display: "flex",
        gap: "12px",
        marginTop: "24px",
    },
    cancelButton: {
        flex: 1,
        padding: "10px 16px",
        background: "white",
        color: "#718096",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.2s",
    },
    submitButton: {
        flex: 1,
        padding: "10px 16px",
        background: "#0F6E56",
        color: "white",
        border: "none",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.2s",
    },
};
