import { Head, useForm } from "@inertiajs/react";
import { useState } from "react";
import Sidebar from "../../../Components/Admin/Sidebar";

export default function Company({ admin, settings }) {
    const [isOpen, setIsOpen] = useState(true);
    const { data, setData, post, processing, errors } = useForm({
        company_name: settings?.company_name || "",
        owner_name: settings?.owner_name || "",
        nif: settings?.nif || "",
        stat: settings?.stat || "",
        rcs: settings?.rcs || "",
        logo: null,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("admin.settings.company.update"), {
            forceFormData: true,
        });
    };

    return (
        <>
            <Head title="Paramètres entreprise" />
            <Sidebar admin={admin} currentPage="admin.settings.company.edit" isOpen={isOpen} setIsOpen={setIsOpen} />
            <div style={{ ...styles.page, marginLeft: isOpen ? "280px" : "0px" }}>
                <div style={styles.header}>
                    <div style={styles.logo}>RH</div>
                    <div>
                        <h1 style={styles.title}>Paramètres de l'entreprise</h1>
                        <p style={styles.subtitle}>Logo et informations légales</p>
                    </div>
                </div>

                <div style={styles.card}>
                    <form onSubmit={submit}>
                        <Field label="Nom de l'entreprise" value={data.company_name} onChange={(v) => setData("company_name", v)} error={errors.company_name} />
                        <Field label="Propriétaire" value={data.owner_name} onChange={(v) => setData("owner_name", v)} error={errors.owner_name} />
                        <Field label="NIF" value={data.nif} onChange={(v) => setData("nif", v)} error={errors.nif} />
                        <Field label="STAT" value={data.stat} onChange={(v) => setData("stat", v)} error={errors.stat} />
                        <Field label="RCS" value={data.rcs} onChange={(v) => setData("rcs", v)} error={errors.rcs} />

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Logo (png/jpg)</label>
                            <input
                                type="file"
                                accept="image/png,image/jpeg"
                                onChange={(e) => setData("logo", e.target.files?.[0] || null)}
                                style={styles.input}
                            />
                            {errors.logo && <p style={styles.error}>{errors.logo}</p>}
                        </div>

                        <button type="submit" disabled={processing} style={styles.button}>
                            {processing ? "Enregistrement..." : "Enregistrer"}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}

function Field({ label, value, onChange, error }) {
    return (
        <div style={styles.formGroup}>
            <label style={styles.label}>{label}</label>
            <input value={value} onChange={(e) => onChange(e.target.value)} style={{ ...styles.input, borderColor: error ? "#e53e3e" : "#e2e8f0" }} />
            {error && <p style={styles.error}>{error}</p>}
        </div>
    );
}

const styles = {
    page: { minHeight: "100vh", background: "#f0f4f8", fontFamily: "system-ui, sans-serif", padding: "24px", transition: "margin-left 0.3s ease" },
    header: { display: "flex", alignItems: "center", gap: "16px", background: "white", padding: "20px 24px", borderRadius: "12px", marginBottom: "24px", border: "1px solid #e2e8f0" },
    logo: { width: "44px", height: "44px", background: "#0F6E56", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "700", fontSize: "16px", flexShrink: 0 },
    title: { fontSize: "18px", fontWeight: "600", color: "#1a202c", margin: 0 },
    subtitle: { fontSize: "13px", color: "#718096", margin: 0 },
    card: { background: "white", borderRadius: "12px", padding: "24px", border: "1px solid #e2e8f0", maxWidth: "720px" },
    formGroup: { marginBottom: "16px" },
    label: { display: "block", fontSize: "13px", fontWeight: "600", color: "#1a202c", marginBottom: "8px" },
    input: { width: "100%", padding: "10px 12px", fontSize: "14px", border: "1px solid #e2e8f0", borderRadius: "8px", boxSizing: "border-box", fontFamily: "system-ui, sans-serif" },
    error: { fontSize: "12px", color: "#e53e3e", margin: "4px 0 0" },
    button: { padding: "10px 16px", background: "#0F6E56", color: "white", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer" },
};

