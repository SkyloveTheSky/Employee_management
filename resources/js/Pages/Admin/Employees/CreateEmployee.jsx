import { Head, router } from "@inertiajs/react";
import Sidebar from "../../../Components/Admin/Sidebar";
import BrandMark from "@/Components/BrandMark";
import HeaderTools from "@/Components/HeaderTools";
import { useState } from "react";
import { useSidebar } from "@/hooks/useSidebar";
import { useT } from "@/i18n";

export default function CreateEmployee({ admin, isOpen: initialOpen = true }) {
    const t = useT();
    const { isOpen, setIsOpen, offset } = useSidebar();
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        phone: "",
        email: "",
        position: "",
        hire_date: "",
        salary_base: "",
        password: "",
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [photo, setPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);

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

    const handlePhotoChange = (e) => {
        const file = e.target.files?.[0] || null;
        setPhoto(file);
        setPhotoPreview(file ? URL.createObjectURL(file) : null);
        if (errors.photo) setErrors((prev) => ({ ...prev, photo: "" }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);

        const payload = new FormData();
        Object.entries(formData).forEach(([key, value]) => payload.append(key, value ?? ""));
        if (photo) payload.append("photo", photo);

        router.post(route("admin.employees.store"), payload, {
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
            <Head title={t("admin.employees.createTitle")} />
            <Sidebar admin={admin} currentPage="admin.employees" isOpen={isOpen} setIsOpen={setIsOpen} />
            <div className="app-page" style={{ ...styles.page, marginLeft: offset }}>
                <div className="app-header" style={styles.header}>
                    <BrandMark />
                    <div>
                        <h1 style={styles.title}>{t("admin.employees.createHeading")}</h1>
                        <p style={styles.subtitle}>
                            {t("admin.employees.createSubtitle")}
                        </p>
                    </div>
                    <HeaderTools />
                </div>

                <div style={styles.formContainer}>
                    <form onSubmit={handleSubmit}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>{t("common.photo")}</label>
                            {photoPreview && <img src={photoPreview} alt={t("common.preview")} style={styles.photoPreview} />}
                            <input type="file" accept="image/jpeg,image/png" onChange={handlePhotoChange} />
                            {errors.photo && <p style={styles.error}>{errors.photo}</p>}
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>{t("common.firstName")}</label>
                            <input
                                type="text"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                placeholder={t("admin.employees.firstNamePh")}
                                style={{
                                    ...styles.input,
                                    borderColor: errors.first_name ? "#e53e3e" : "#e2e8f0",
                                }}
                            />
                            {errors.first_name && <p style={styles.error}>{errors.first_name}</p>}
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>{t("common.lastName")}</label>
                            <input
                                type="text"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                placeholder={t("admin.employees.lastNamePh")}
                                style={{
                                    ...styles.input,
                                    borderColor: errors.last_name ? "#e53e3e" : "#e2e8f0",
                                }}
                            />
                            {errors.last_name && <p style={styles.error}>{errors.last_name}</p>}
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>{t("admin.employees.phone")}</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder={t("admin.employees.phonePh")}
                                style={{
                                    ...styles.input,
                                    borderColor: errors.phone ? "#e53e3e" : "#e2e8f0",
                                }}
                            />
                            {errors.phone && <p style={styles.error}>{errors.phone}</p>}
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>{t("admin.employees.emailOptional")}</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder={t("admin.employees.emailPh")}
                                style={{
                                    ...styles.input,
                                    borderColor: errors.email ? "#e53e3e" : "#e2e8f0",
                                }}
                            />
                            {errors.email && <p style={styles.error}>{errors.email}</p>}
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>{t("common.position")}</label>
                            <input
                                type="text"
                                name="position"
                                value={formData.position}
                                onChange={handleChange}
                                placeholder={t("admin.employees.positionPh")}
                                style={{
                                    ...styles.input,
                                    borderColor: errors.position ? "#e53e3e" : "#e2e8f0",
                                }}
                            />
                            {errors.position && <p style={styles.error}>{errors.position}</p>}
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>{t("common.hireDate")}</label>
                            <input
                                type="date"
                                name="hire_date"
                                value={formData.hire_date}
                                onChange={handleChange}
                                style={{
                                    ...styles.input,
                                    borderColor: errors.hire_date ? "#e53e3e" : "#e2e8f0",
                                }}
                            />
                            {errors.hire_date && <p style={styles.error}>{errors.hire_date}</p>}
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>{t("admin.employees.salary")}</label>
                            <input
                                type="number"
                                min="0"
                                step="1"
                                name="salary_base"
                                value={formData.salary_base}
                                onChange={handleChange}
                                style={{
                                    ...styles.input,
                                    borderColor: errors.salary_base ? "#e53e3e" : "#e2e8f0",
                                }}
                            />
                            {errors.salary_base && <p style={styles.error}>{errors.salary_base}</p>}
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>{t("auth.password")}</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder={t("admin.employees.passwordMin")}
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
                                {t("common.cancel")}
                            </button>
                            <button
                                type="submit"
                                style={styles.submitButton}
                                disabled={loading}
                            >
                                {loading ? t("common.creating") : t("admin.employees.createSubmit")}
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
        background: "var(--color-background)",
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
    formContainer: {
        background: "white",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        padding: "24px",
        maxWidth: "500px",
        width: "100%",
        boxSizing: "border-box",
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
        height: "38px",
        padding: "0 12px",
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
    photoPreview: {
        width: "88px",
        height: "88px",
        objectFit: "cover",
        borderRadius: "8px",
        display: "block",
        marginBottom: "8px",
        border: "1px solid #e2e8f0",
    },
    formActions: {
        display: "flex",
        gap: "12px",
        marginTop: "24px",
        alignItems: "center",
    },
    cancelButton: {
        flex: 1,
        height: "38px",
        padding: "0 16px",
        background: "white",
        color: "#718096",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: "600",
        cursor: "pointer",
        boxSizing: "border-box",
        transition: "all 0.2s",
    },
    submitButton: {
        flex: 1,
        height: "38px",
        padding: "0 16px",
        background: "var(--color-primary)",
        color: "white",
        border: "none",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: "600",
        cursor: "pointer",
        boxSizing: "border-box",
        transition: "all 0.2s",
    },
};
