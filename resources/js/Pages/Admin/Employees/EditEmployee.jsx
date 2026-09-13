import { Head, router } from "@inertiajs/react";
import Sidebar from "../../../Components/Admin/Sidebar";
import BrandMark from "@/Components/BrandMark";
import HeaderTools from "@/Components/HeaderTools";
import { useState } from "react";
import { useSidebar } from "@/hooks/useSidebar";

export default function EditEmployee({ admin, employee, isOpen: initialOpen = true }) {
    const { isOpen, setIsOpen, offset } = useSidebar();
    const [formData, setFormData] = useState({
        first_name: employee.first_name || "",
        last_name: employee.last_name || "",
        phone: employee.phone || "",
        email: employee.email || "",
        position: employee.position || "",
        hire_date: employee.hire_date || "",
        salary_base: employee.salary_base || 0,
        password: "",
        password_confirmation: "",
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [photo, setPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(
        employee.photo_path ? `/storage/${employee.photo_path}` : null
    );

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files?.[0] || null;
        setPhoto(file);
        setPhotoPreview(file ? URL.createObjectURL(file) : (employee.photo_path ? `/storage/${employee.photo_path}` : null));
        if (errors.photo) setErrors((prev) => ({ ...prev, photo: "" }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        const payload = new FormData();
        Object.entries(formData).forEach(([key, value]) => payload.append(key, value ?? ""));
        payload.append("_method", "PATCH");
        if (photo) payload.append("photo", photo);
        router.post(route("admin.employees.update", employee.id), payload, {
            onError: (validationErrors) => {
                setErrors(validationErrors);
                setLoading(false);
            },
            onSuccess: () => setLoading(false),
        });
    };

    return (
        <>
            <Head title="Modifier un Employé" />
            <Sidebar admin={admin} currentPage="admin.employees" isOpen={isOpen} setIsOpen={setIsOpen} />
            <div className="app-page" style={{ ...styles.page, marginLeft: offset }}>
                <div className="app-header" style={styles.header}>
                    <BrandMark />
                    <div>
                        <h1 style={styles.title}>Modifier un Employé</h1>
                        <p style={styles.subtitle}>Mettez à jour les informations et le mot de passe de l'employé</p>
                    </div>
                    <HeaderTools />
                </div>

                <div style={styles.formContainer}>
                    <form onSubmit={handleSubmit}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Photo</label>
                            {photoPreview && <img src={photoPreview} alt="Photo de l'employé" style={styles.photoPreview} />}
                            <input type="file" accept="image/jpeg,image/png" onChange={handlePhotoChange} />
                            {errors.photo && <p style={styles.error}>{errors.photo}</p>}
                        </div>
                        <Field label="Prénom" name="first_name" value={formData.first_name} onChange={handleChange} error={errors.first_name} />
                        <Field label="Nom" name="last_name" value={formData.last_name} onChange={handleChange} error={errors.last_name} />
                        <Field label="Numéro Téléphone" name="phone" value={formData.phone} onChange={handleChange} error={errors.phone} />
                        <Field label="Email (Optionnel)" name="email" type="email" value={formData.email} onChange={handleChange} error={errors.email} />
                        <Field label="Poste" name="position" value={formData.position} onChange={handleChange} error={errors.position} />

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Date d'embauche</label>
                            <input
                                type="date"
                                name="hire_date"
                                value={formData.hire_date}
                                onChange={handleChange}
                                style={{ ...styles.input, borderColor: errors.hire_date ? "#e53e3e" : "#e2e8f0" }}
                            />
                            {errors.hire_date && <p style={styles.error}>{errors.hire_date}</p>}
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Salaire de base (Ar)</label>
                            <input
                                type="number"
                                min="0"
                                step="1"
                                name="salary_base"
                                value={formData.salary_base}
                                onChange={handleChange}
                                style={{ ...styles.input, borderColor: errors.salary_base ? "#e53e3e" : "#e2e8f0" }}
                            />
                            {errors.salary_base && <p style={styles.error}>{errors.salary_base}</p>}
                        </div>

                        <p style={styles.sectionHint}>Mot de passe — laisser vide pour ne pas le modifier</p>
                        <Field label="Nouveau mot de passe" name="password" type="password" value={formData.password} onChange={handleChange} error={errors.password} />
                        <Field label="Confirmer le mot de passe" name="password_confirmation" type="password" value={formData.password_confirmation} onChange={handleChange} error={errors.password_confirmation} />

                        <div style={styles.formActions}>
                            <button type="button" onClick={() => router.visit(route("admin.employees"))} style={styles.cancelButton} disabled={loading}>
                                Annuler
                            </button>
                            <button type="submit" style={styles.submitButton} disabled={loading}>
                                {loading ? "Mise à jour..." : "Enregistrer"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

function Field({ label, name, value, onChange, error, type = "text" }) {
    return (
        <div style={styles.formGroup}>
            <label style={styles.label}>{label}</label>
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                style={{ ...styles.input, borderColor: error ? "#e53e3e" : "#e2e8f0" }}
            />
            {error && <p style={styles.error}>{error}</p>}
        </div>
    );
}

const styles = {
    page: { minHeight: "100vh", background: "var(--color-background)", fontFamily: "system-ui, sans-serif", padding: "24px", transition: "margin-left 0.3s ease" },
    header: { display: "flex", alignItems: "center", gap: "16px", background: "white", padding: "20px 24px", borderRadius: "12px", marginBottom: "24px", border: "1px solid #e2e8f0" },
    logo: { width: "44px", height: "44px", background: "var(--color-primary)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "700", fontSize: "16px", flexShrink: 0 },
    title: { fontSize: "18px", fontWeight: "600", color: "#1a202c", margin: 0 },
    subtitle: { fontSize: "13px", color: "#718096", margin: 0 },
    formContainer: { background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px", maxWidth: "520px", width: "100%", boxSizing: "border-box" },
    formGroup: { marginBottom: "18px" },
    label: { display: "block", fontSize: "13px", fontWeight: "600", color: "#1a202c", marginBottom: "8px" },
    input: { width: "100%", padding: "10px 12px", fontSize: "14px", border: "1px solid #e2e8f0", borderRadius: "8px", boxSizing: "border-box", fontFamily: "system-ui, sans-serif" },
    error: { fontSize: "12px", color: "#e53e3e", margin: "4px 0 0" },
    photoPreview: { width: "88px", height: "88px", objectFit: "cover", borderRadius: "8px", display: "block", marginBottom: "8px", border: "1px solid #e2e8f0" },
    sectionHint: { fontSize: "13px", fontWeight: "600", color: "#1a202c", margin: "8px 0 14px", paddingTop: "8px", borderTop: "1px solid #e2e8f0" },
    formActions: { display: "flex", gap: "12px", marginTop: "18px" },
    cancelButton: { flex: 1, padding: "10px 16px", background: "white", color: "#718096", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer" },
    submitButton: { flex: 1, padding: "10px 16px", background: "var(--color-primary)", color: "white", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer" },
};

