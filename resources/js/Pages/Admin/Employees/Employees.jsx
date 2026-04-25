import { Head, router } from "@inertiajs/react";
import Sidebar from "../../../Components/Admin/Sidebar";
import { useState } from "react";

export default function Employees({ admin, employees, isOpen: initialOpen = true }) {
    const [isOpen, setIsOpen] = useState(initialOpen);

    const handleDelete = (id, name) => {
        if (confirm(`Êtes-vous sûr de vouloir supprimer ${name} ?`)) {
            router.delete(route('admin.employees.delete', id));
        }
    };

    return (
        <>
            <Head title="Employés" />
            <Sidebar admin={admin} currentPage="admin.employees" isOpen={isOpen} setIsOpen={setIsOpen} />
            <div style={{ ...styles.page, marginLeft: isOpen ? "280px" : "0px" }}>
                <div style={styles.header}>
                    <div style={styles.logo}>RH</div>
                    <div>
                        <h1 style={styles.title}>Gestion des Employés</h1>
                        <p style={styles.subtitle}>
                            Gérez et consultez la liste des employés
                        </p>
                    </div>
                    <button
                        onClick={() => router.visit(route('admin.employees.create'))}
                        style={styles.createButton}
                    >
                        + Créer un Employé
                    </button>
                </div>

                <div style={styles.tableContainer}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>ID</th>
                                <th style={styles.th}>Nom</th>
                                <th style={styles.th}>Email</th>
                                <th style={styles.th}>Téléphone</th>
                                <th style={styles.th}>Date de création</th>
                                <th style={styles.th}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees && employees.length > 0 ? (
                                employees.map((employee) => (
                                    <tr key={employee.id} style={styles.tr}>
                                        <td style={styles.td}>{employee.id}</td>
                                        <td style={styles.td}>{employee.name}</td>
                                        <td style={styles.td}>{employee.email}</td>
                                        <td style={styles.td}>{employee.phone || "N/A"}</td>
                                        <td style={styles.td}>
                                            {new Date(employee.created_at).toLocaleDateString("fr-FR")}
                                        </td>
                                        <td style={styles.td}>
                                            <button
                                                onClick={() => handleDelete(employee.id, employee.name)}
                                                style={styles.deleteButton}
                                            >
                                                Supprimer
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" style={{ ...styles.td, textAlign: "center" }}>
                                        Aucun employé trouvé
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
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
    createButton: {
        marginLeft: "auto",
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
    tableContainer: {
        background: "white",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        overflow: "auto",
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
        fontSize: "14px",
    },
    th: {
        background: "#f7fafc",
        padding: "12px 16px",
        textAlign: "left",
        fontWeight: "600",
        color: "#1a202c",
        borderBottom: "1px solid #e2e8f0",
    },
    tr: {
        borderBottom: "1px solid #e2e8f0",
        transition: "background 0.2s",
    },
    td: {
        padding: "12px 16px",
        color: "#4a5568",
    },
    deleteButton: {
        padding: "6px 12px",
        background: "#e53e3e",
        color: "white",
        border: "none",
        borderRadius: "6px",
        fontSize: "12px",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.2s",
    },
};
