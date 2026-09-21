import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import BrandMark from "@/Components/BrandMark";
import ConfirmDialog from "@/Components/ConfirmDialog";
import HeaderTools from "@/Components/HeaderTools";
import IconButton from "@/Components/IconButton";
import Sidebar from "../../../Components/Admin/Sidebar";
import { useSidebar } from "@/hooks/useSidebar";
import { useDateLocale, useT } from "@/i18n";

export default function Employees({ admin, employees, isOpen: initialOpen = true }) {
    const t = useT();
    const dateLoc = useDateLocale();
    const { isOpen, setIsOpen, offset } = useSidebar();
    const [pendingDelete, setPendingDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const formatDate = (value) => {
        if (!value) return t("common.dash");
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return t("common.dash");
        return new Intl.DateTimeFormat(dateLoc, {
            day: "2-digit",
            month: "long",
            year: "numeric",
        }).format(date);
    };
    const formatAr = (value) => `${Number(value || 0).toLocaleString(dateLoc)} Ar`;

    const confirmDelete = () => {
        if (!pendingDelete) return;
        setDeleting(true);
        router.delete(route("admin.employees.delete", pendingDelete.id), {
            onFinish: () => {
                setDeleting(false);
                setPendingDelete(null);
            },
        });
    };

    return (
        <>
            <Head title={t("nav.employees")} />
            <Sidebar admin={admin} currentPage="admin.employees" isOpen={isOpen} setIsOpen={setIsOpen} />
            <div className="app-page" style={{ ...styles.page, marginLeft: offset }}>
                <div className="app-header" style={styles.header}>
                    <BrandMark />
                    <div>
                        <h1 style={styles.title}>{t("admin.employees.title")}</h1>
                        <p style={styles.subtitle}>
                            {t("admin.employees.subtitle")}
                        </p>
                    </div>
                    <HeaderTools />
                </div>

                <div style={styles.toolbar}>
                    <p style={styles.toolbarHint}>
                        {t("common.employeeCount", { count: employees?.length || 0 })}
                    </p>
                    <IconButton
                        icon="add"
                        label={t("admin.employees.create")}
                        variant="primary"
                        showLabel
                        size={38}
                        onClick={() => router.visit(route("admin.employees.create"))}
                    />
                </div>

                <div className="app-table-wrap" style={styles.tableContainer}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>{t("common.photo")}</th>
                                <th style={styles.th}>{t("common.id")}</th>
                                <th style={styles.th}>{t("common.firstName")}</th>
                                <th style={styles.th}>{t("common.lastName")}</th>
                                <th style={styles.th}>{t("common.phone")}</th>
                                <th style={styles.th}>{t("common.email")}</th>
                                <th style={styles.th}>{t("common.position")}</th>
                                <th style={styles.th}>{t("common.hireDate")}</th>
                                <th style={styles.th}>{t("common.baseSalary")}</th>
                                <th style={styles.th}>{t("common.actions")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees && employees.length > 0 ? (
                                employees.map((employee) => (
                                    <tr key={employee.id} style={styles.tr}>
                                        <td style={styles.td}>
                                            {employee.photo_path ? (
                                                <img src={`/storage/${employee.photo_path}`} alt="" style={styles.photo} />
                                            ) : (
                                                <span style={styles.photoPlaceholder}>
                                                    {employee.first_name?.charAt(0)}
                                                    {employee.last_name?.charAt(0)}
                                                </span>
                                            )}
                                        </td>
                                        <td style={styles.td}>{employee.id}</td>
                                        <td style={styles.td}>{employee.first_name}</td>
                                        <td style={styles.td}>{employee.last_name}</td>
                                        <td style={styles.td}>{employee.phone}</td>
                                        <td style={styles.td}>{employee.email || t("common.na")}</td>
                                        <td style={styles.td}>{employee.position}</td>
                                        <td style={styles.td}>{formatDate(employee.hire_date)}</td>
                                        <td style={styles.td}>{formatAr(employee.salary_base)}</td>
                                        <td style={styles.actionsCell}>
                                            <IconButton
                                                icon="edit"
                                                label={t("common.edit")}
                                                variant="muted"
                                                onClick={() => router.visit(route("admin.employees.edit", employee.id))}
                                            />
                                            <IconButton
                                                icon="delete"
                                                label={t("common.delete")}
                                                variant="danger"
                                                onClick={() =>
                                                    setPendingDelete({
                                                        id: employee.id,
                                                        name: `${employee.first_name} ${employee.last_name}`,
                                                    })
                                                }
                                            />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="10" style={{ ...styles.td, textAlign: "center" }}>
                                        {t("admin.employees.empty")}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <ConfirmDialog
                show={!!pendingDelete}
                title={t("admin.employees.deleteTitle")}
                message={
                    pendingDelete
                        ? t("admin.employees.deleteBody", { name: pendingDelete.name })
                        : ""
                }
                processing={deleting}
                onConfirm={confirmDelete}
                onClose={() => !deleting && setPendingDelete(null)}
            />
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
    createButton: {
        padding: "10px 16px",
        background: "var(--color-primary)",
        color: "white",
        border: "none",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.2s",
    },
    toolbar: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        marginBottom: "16px",
        flexWrap: "wrap",
    },
    toolbarHint: {
        margin: 0,
        fontSize: "13px",
        color: "#718096",
        fontWeight: 600,
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
    photo: {
        width: "40px",
        height: "40px",
        objectFit: "cover",
        borderRadius: "8px",
        display: "block",
    },
    photoPlaceholder: {
        width: "40px",
        height: "40px",
        borderRadius: "8px",
        background: "var(--color-primary)",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "12px",
        fontWeight: "600",
    },
    actionsCell: {
        padding: "12px 16px",
        color: "#4a5568",
        display: "flex",
        gap: "8px",
    },
    editButton: {
        padding: "6px 12px",
        background: "#6c757d",
        color: "white",
        border: "none",
        borderRadius: "6px",
        fontSize: "12px",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.2s",
    },
    deleteButton: {
        padding: "6px 12px",
        background: "#dc3545",
        color: "white",
        border: "none",
        borderRadius: "6px",
        fontSize: "12px",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.2s",
    },
};
