import React, { useState } from "react";
import { Head, router } from "@inertiajs/react";
import Sidebar from "../../../Components/Admin/Sidebar";
import { useTemplateBuilder, WIDGET_TYPES, WIDGET_DEFAULTS } from "../../../Components/Admin/PdfTemplateBuilder/WidgetManager.jsx";
import WidgetPropertyEditor from "../../../Components/Admin/PdfTemplateBuilder/WidgetPropertyEditor.jsx";
import WidgetRenderer from "../../../Components/Admin/PdfTemplateBuilder/WidgetRenderer.jsx";

export default function PdfTemplateBuilder({ admin, initialTemplate = null }) {
    const [isOpen, setIsOpen] = useState(true);
    const [selectedWidgetId, setSelectedWidgetId] = useState(null);
    const [sampleData, setSampleData] = useState({
        company_name: "Entreprise Demo",
        owner_name: "John Doe",
        nif: "1234567",
        employee_name: "Jean Martin",
        employee_position: "Responsable",
        period: "Avril 2026",
        base_salary: "500 000",
        prime_amount: "20 000",
        gross_salary: "530 000",
        cnaps_amount: "4 600",
        assurance_amount: "4 600",
        total_retenu: "9 200",
        net_to_pay: "520 800",
        payment_method: "Mobile Money",
        payment_status: "Non payé",
    });

    const {
        widgets,
        addWidget,
        removeWidget,
        updateWidget,
        reorderWidgets,
        toggleWidgetVisibility,
    } = useTemplateBuilder(initialTemplate);

    const selectedWidget = widgets.find((w) => w.id === selectedWidgetId);

    const handleSaveTemplate = () => {
        router.post(route("admin.payrolls.style.update"), {
            styles: widgets,
        });
    };

    const addNewWidget = (widgetType) => {
        addWidget(widgetType);
    };

    return (
        <>
            <Head title="Éditeur Template PDF" />
            <Sidebar
                admin={admin}
                currentPage="admin.payrolls.index"
                isOpen={isOpen}
                setIsOpen={setIsOpen}
            />

            <div style={{ ...styles.page, marginLeft: isOpen ? "280px" : "0px" }}>
                {/* Header */}
                <div style={styles.header}>
                    <div style={styles.logo}>RH</div>
                    <div>
                        <h1 style={styles.title}>Éditeur de Template PDF</h1>
                        <p style={styles.subtitle}>
                            Créez et personnalisez vos modèles de fiches de paie
                        </p>
                    </div>
                </div>

                {/* Main Content */}
                <div style={styles.container}>
                    {/* Panel Gauche: Widgets & Propriétés */}
                    <div style={styles.leftPanel}>
                        {/* Widget Library */}
                        <div style={styles.section}>
                            <h3 style={styles.sectionTitle}>Ajouter un widget</h3>
                            <div style={styles.widgetLibrary}>
                                {Object.entries(WIDGET_TYPES).map(([key, type]) => (
                                    <button
                                        key={type}
                                        onClick={() => addNewWidget(type)}
                                        style={styles.widgetButton}
                                        title={`Ajouter ${WIDGET_DEFAULTS[type]?.label}`}
                                    >
                                        + {WIDGET_DEFAULTS[type]?.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Widget List */}
                        <div style={styles.section}>
                            <h3 style={styles.sectionTitle}>Widgets ({widgets.length})</h3>
                            <div style={styles.widgetList}>
                                {widgets.map((widget, idx) => (
                                    <div
                                        key={widget.id}
                                        onClick={() => setSelectedWidgetId(widget.id)}
                                        style={{
                                            ...styles.widgetListItem,
                                            ...(selectedWidgetId === widget.id &&
                                                styles.widgetListItemActive),
                                        }}
                                    >
                                        <div style={styles.widgetListItemHeader}>
                                            <span style={styles.widgetListItemLabel}>
                                                {idx + 1}. {widget.label}
                                            </span>
                                            <div style={styles.widgetListItemActions}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        reorderWidgets(widget.id, "up");
                                                    }}
                                                    style={styles.smallButton}
                                                    title="Monter"
                                                >
                                                    ↑
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        reorderWidgets(widget.id, "down");
                                                    }}
                                                    style={styles.smallButton}
                                                    title="Descendre"
                                                >
                                                    ↓
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleWidgetVisibility(widget.id);
                                                    }}
                                                    style={styles.smallButton}
                                                    title={widget.visible ? "Masquer" : "Afficher"}
                                                >
                                                    {widget.visible ? "👁️" : "👁️‍🗨️"}
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeWidget(widget.id);
                                                        setSelectedWidgetId(null);
                                                    }}
                                                    style={{
                                                        ...styles.smallButton,
                                                        color: "#e74c3c",
                                                    }}
                                                    title="Supprimer"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Properties */}
                        {selectedWidget && (
                            <div style={styles.section}>
                                <h3 style={styles.sectionTitle}>Propriétés</h3>
                                <WidgetPropertyEditor
                                    widget={selectedWidget}
                                    onUpdate={(updated) => {
                                        updateWidget(selectedWidget.id, updated);
                                    }}
                                />
                            </div>
                        )}

                        {/* Save Button */}
                        <button onClick={handleSaveTemplate} style={styles.saveButton}>
                            💾 Enregistrer le template
                        </button>
                    </div>

                    {/* Panel Central: Aperçu */}
                    <div style={styles.centerPanel}>
                        <div style={styles.previewHeader}>Aperçu en temps réel</div>
                        <div style={styles.previewContent}>
                            <WidgetRenderer widgets={widgets} data={sampleData} />
                        </div>
                    </div>

                    {/* Panel Droit: Données d'exemple */}
                    <div style={styles.rightPanel}>
                        <h3 style={styles.sectionTitle}>Données d'exemple</h3>
                        <div style={styles.sampleDataForm}>
                            {Object.entries(sampleData).map(([key, value]) => (
                                <div key={key} style={styles.formGroup}>
                                    <label style={styles.formLabel}>{key}</label>
                                    <input
                                        type="text"
                                        value={value}
                                        onChange={(e) =>
                                            setSampleData({
                                                ...sampleData,
                                                [key]: e.target.value,
                                            })
                                        }
                                        style={styles.formInput}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        background: "#f5f5f5",
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
    container: {
        display: "grid",
        gridTemplateColumns: "300px 1fr 250px",
        gap: "20px",
        height: "calc(100vh - 200px)",
    },
    leftPanel: {
        display: "flex",
        flexDirection: "column",
        gap: "15px",
        overflowY: "auto",
        paddingRight: "10px",
    },
    centerPanel: {
        background: "white",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
    },
    previewHeader: {
        padding: "12px 16px",
        borderBottom: "1px solid #e2e8f0",
        fontSize: "12px",
        fontWeight: "600",
        color: "#666",
        background: "#f9f9f9",
        stickyTop: 0,
    },
    previewContent: {
        padding: "20px",
        flex: 1,
        overflowY: "auto",
    },
    rightPanel: {
        background: "white",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
    },
    section: {
        background: "white",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        padding: "16px",
    },
    sectionTitle: {
        fontSize: "13px",
        fontWeight: "600",
        color: "#1a202c",
        marginBottom: "12px",
        margin: 0,
    },
    widgetLibrary: {
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: "6px",
    },
    widgetButton: {
        padding: "8px 12px",
        background: "#0F6E56",
        color: "white",
        border: "none",
        borderRadius: "6px",
        fontSize: "11px",
        cursor: "pointer",
        transition: "all 0.2s",
    },
    widgetList: {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
    },
    widgetListItem: {
        padding: "10px 12px",
        background: "#f9f9f9",
        border: "1px solid #e2e8f0",
        borderRadius: "6px",
        cursor: "pointer",
        transition: "all 0.2s",
        fontSize: "12px",
    },
    widgetListItemActive: {
        background: "#e3f2fd",
        borderColor: "#0F6E56",
    },
    widgetListItemHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "8px",
    },
    widgetListItemLabel: {
        flex: 1,
        fontWeight: "500",
    },
    widgetListItemActions: {
        display: "flex",
        gap: "4px",
    },
    smallButton: {
        padding: "4px 6px",
        fontSize: "10px",
        background: "#f0f0f0",
        border: "1px solid #ddd",
        borderRadius: "4px",
        cursor: "pointer",
        transition: "all 0.2s",
    },
    saveButton: {
        padding: "12px 16px",
        background: "#0F6E56",
        color: "white",
        border: "none",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.2s",
        marginTop: "auto",
    },
    sampleDataForm: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        fontSize: "12px",
    },
    formGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "4px",
    },
    formLabel: {
        fontSize: "11px",
        fontWeight: "600",
        color: "#555",
    },
    formInput: {
        padding: "6px 8px",
        fontSize: "11px",
        border: "1px solid #ddd",
        borderRadius: "4px",
        fontFamily: "monospace",
    },
};
