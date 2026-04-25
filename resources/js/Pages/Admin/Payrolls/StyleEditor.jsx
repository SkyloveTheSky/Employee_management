import { Head, router, useForm } from "@inertiajs/react";
import { useState } from "react";
import Sidebar from "../../../Components/Admin/Sidebar";

export default function StyleEditor({ admin, styles }) {
    const [isOpen, setIsOpen] = useState(true);
    const [activeTab, setActiveTab] = useState("company_box");
    const [localStyles, setLocalStyles] = useState(styles);

    const { data, setData, post, processing, errors } = useForm({
        styles: localStyles,
    });

    const handleStyleChange = (widget, property, value) => {
        const newStyles = { ...localStyles };
        if (!newStyles[widget]) newStyles[widget] = {};
        newStyles[widget][property] = value;
        setLocalStyles(newStyles);
        setData({ ...data, styles: newStyles });
    };

    const submit = (e) => {
        e.preventDefault();
        post(route("admin.payrolls.style.update"));
    };

    const resetStyles = () => {
        const defaultStyles = {
            company_box: {
                backgroundColor: "#fafafa",
                borderColor: "#999",
                borderWidth: "1px",
                padding: "8px",
                borderRadius: "0px",
                fontFamily: "Liberation Sans, sans-serif",
            },
            employee_box: {
                backgroundColor: "#fafafa",
                borderColor: "#999",
                borderWidth: "1px",
                padding: "8px",
                borderRadius: "0px",
                fontFamily: "Liberation Sans, sans-serif",
            },
            title_text: {
                fontSize: "18px",
                fontWeight: "bold",
                color: "#1a1a1a",
                textAlign: "center",
                marginBottom: "10px",
            },
            box_title: {
                fontSize: "12px",
                fontWeight: "bold",
                color: "#1a1a1a",
                borderBottomColor: "#ccc",
                borderBottomWidth: "1px",
                paddingBottom: "3px",
            },
            table_header: {
                backgroundColor: "#e0e0e0",
                borderColor: "#999",
                fontSize: "10px",
                fontWeight: "bold",
                color: "#1a1a1a",
            },
            table_body: {
                borderColor: "#999",
                fontSize: "10px",
                color: "#1a1a1a",
            },
            table_totals: {
                backgroundColor: "#f0f0f0",
                fontSize: "10px",
                fontWeight: "bold",
                color: "#1a1a1a",
            },
            payment_info_box: {
                backgroundColor: "#fafafa",
                borderColor: "#999",
                borderWidth: "1px",
                padding: "8px",
                marginTop: "18px",
            },
        };
        setLocalStyles(defaultStyles);
        setData({ ...data, styles: defaultStyles });
    };

    const widgetLabels = {
        company_box: "Boite Entreprise",
        employee_box: "Boite Employe",
        title_text: "Titre Principal",
        box_title: "Titre des Boites",
        table_header: "En-tete Tableau",
        table_body: "Corps du Tableau",
        table_totals: "Totaux Tableau",
        payment_info_box: "Boite Paiement",
    };

    const propertyLabels = {
        backgroundColor: "Couleur de fond",
        borderColor: "Couleur bordure",
        borderWidth: "Largeur bordure",
        borderRadius: "Rayon bordure",
        padding: "Rembourrage",
        fontFamily: "Police",
        fontSize: "Taille police",
        fontWeight: "Poids police",
        color: "Couleur texte",
        textAlign: "Alignement",
        marginBottom: "Marge bas",
        paddingBottom: "Rembourrage bas",
    };

    return (
        <>
            <Head title="Editeur de Styles" />
            <Sidebar admin={admin} currentPage="admin.payrolls.index" isOpen={isOpen} setIsOpen={setIsOpen} />

            <div style={{ ...styles_page.page, marginLeft: isOpen ? "280px" : "0px" }}>
                <div style={styles_page.header}>
                    <div style={styles_page.logo}>RH</div>
                    <div>
                        <h1 style={styles_page.title}>Editeur de Styles PDF</h1>
                        <p style={styles_page.subtitle}>Personnalisez l'apparence de vos fiches de paie</p>
                    </div>
                </div>

                <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
                    {/* Editeur a gauche */}
                    <div style={{ flex: 1, paddingRight: "20px", borderRight: "1px solid #e0e0e0" }}>
                        <form onSubmit={submit} style={styles_page.formCard}>
                            <div style={styles_page.tabsContainer}>
                                {Object.keys(widgetLabels).map((widget) => (
                                    <button
                                        key={widget}
                                        type="button"
                                        onClick={() => setActiveTab(widget)}
                                        style={{
                                            ...styles_page.tabButton,
                                            ...(activeTab === widget && styles_page.tabButtonActive),
                                        }}
                                    >
                                        {widgetLabels[widget]}
                                    </button>
                                ))}
                            </div>

                            {/* Proprietes du widget actif */}
                            <div style={styles_page.propertiesPanel}>
                                <h3 style={{ marginBottom: "15px" }}>Proprietes: {widgetLabels[activeTab]}</h3>

                                {localStyles[activeTab] && Object.keys(localStyles[activeTab]).map((property) => (
                                    <div key={property} style={styles_page.propertyRow}>
                                        <label style={styles_page.label}>{propertyLabels[property] || property}</label>

                                        {property === "backgroundColor" ||
                                        property === "borderColor" ||
                                        property === "color" ? (
                                            <input
                                                type="color"
                                                value={localStyles[activeTab][property]}
                                                onChange={(e) => handleStyleChange(activeTab, property, e.target.value)}
                                                style={styles_page.colorInput}
                                            />
                                        ) : property === "fontWeight" || property === "textAlign" ? (
                                            <select
                                                value={localStyles[activeTab][property]}
                                                onChange={(e) => handleStyleChange(activeTab, property, e.target.value)}
                                                style={styles_page.select}
                                            >
                                                {property === "fontWeight" ? (
                                                    <>
                                                        <option value="normal">Normal</option>
                                                        <option value="bold">Gras</option>
                                                        <option value="lighter">Leger</option>
                                                    </>
                                                ) : (
                                                    <>
                                                        <option value="left">Gauche</option>
                                                        <option value="center">Centre</option>
                                                        <option value="right">Droite</option>
                                                    </>
                                                )}
                                            </select>
                                        ) : property === "fontFamily" ? (
                                            <select
                                                value={localStyles[activeTab][property]}
                                                onChange={(e) => handleStyleChange(activeTab, property, e.target.value)}
                                                style={styles_page.select}
                                            >
                                                <option value="Liberation Sans, sans-serif">Liberation Sans</option>
                                                <option value="DejaVu Sans, sans-serif">DejaVu Sans</option>
                                                <option value="Arial, sans-serif">Arial</option>
                                                <option value="Times New Roman, serif">Times New Roman</option>
                                            </select>
                                        ) : (
                                            <input
                                                type="text"
                                                value={localStyles[activeTab][property]}
                                                onChange={(e) => handleStyleChange(activeTab, property, e.target.value)}
                                                style={styles_page.textInput}
                                                placeholder={property}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    style={styles_page.submitButton}
                                >
                                    {processing ? "Enregistrement..." : "Enregistrer les styles"}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetStyles}
                                    style={styles_page.resetButton}
                                >
                                    Reinitialiser par defaut
                                </button>
                            </div>

                            {errors.styles && <p style={styles_page.error}>{errors.styles}</p>}
                        </form>
                    </div>

                    {/* Apercu a droite */}
                    <div style={{ flex: 1 }}>
                        <div style={styles_page.previewHeader}>Apercu en temps reel</div>
                        <div style={styles_page.previewContainer}>
                            {/* Boite Entreprise */}
                            <div style={{
                                ...styles_page.previewBox,
                                backgroundColor: localStyles.company_box?.backgroundColor,
                                border: `${localStyles.company_box?.borderWidth} solid ${localStyles.company_box?.borderColor}`,
                                padding: localStyles.company_box?.padding,
                                borderRadius: localStyles.company_box?.borderRadius,
                                fontFamily: localStyles.company_box?.fontFamily,
                            }}>
                                <div style={{
                                    fontSize: localStyles.box_title?.fontSize,
                                    fontWeight: localStyles.box_title?.fontWeight,
                                    color: localStyles.box_title?.color,
                                    borderBottom: `${localStyles.box_title?.borderBottomWidth} solid ${localStyles.box_title?.borderBottomColor}`,
                                    paddingBottom: localStyles.box_title?.paddingBottom,
                                }}>
                                    ENTREPRISE
                                </div>
                                <div style={{ fontSize: "11px", marginTop: "5px" }}>Nom: Entreprise Demo</div>
                                <div style={{ fontSize: "11px" }}>Proprietaire: John Doe</div>
                            </div>

                            {/* Tableau apercu */}
                            <table style={{
                                ...styles_page.previewTable,
                                borderCollapse: "collapse",
                                marginTop: "15px",
                                width: "100%",
                                fontSize: "9px",
                            }}>
                                <thead>
                                    <tr>
                                        <th style={{
                                            ...styles_page.previewTableHeader,
                                            backgroundColor: localStyles.table_header?.backgroundColor,
                                            borderColor: localStyles.table_header?.borderColor,
                                            color: localStyles.table_header?.color,
                                            fontSize: localStyles.table_header?.fontSize,
                                            fontWeight: localStyles.table_header?.fontWeight,
                                            padding: "4px",
                                            border: `1px solid ${localStyles.table_header?.borderColor}`,
                                        }}>N</th>
                                        <th style={{
                                            ...styles_page.previewTableHeader,
                                            backgroundColor: localStyles.table_header?.backgroundColor,
                                            borderColor: localStyles.table_header?.borderColor,
                                            color: localStyles.table_header?.color,
                                            fontSize: localStyles.table_header?.fontSize,
                                            fontWeight: localStyles.table_header?.fontWeight,
                                            padding: "4px",
                                            border: `1px solid ${localStyles.table_header?.borderColor}`,
                                        }}>Designation</th>
                                        <th style={{
                                            ...styles_page.previewTableHeader,
                                            backgroundColor: localStyles.table_header?.backgroundColor,
                                            borderColor: localStyles.table_header?.borderColor,
                                            color: localStyles.table_header?.color,
                                            fontSize: localStyles.table_header?.fontSize,
                                            fontWeight: localStyles.table_header?.fontWeight,
                                            padding: "4px",
                                            border: `1px solid ${localStyles.table_header?.borderColor}`,
                                        }}>Gain (Ar)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style={{
                                            borderColor: localStyles.table_body?.borderColor,
                                            color: localStyles.table_body?.color,
                                            fontSize: localStyles.table_body?.fontSize,
                                            padding: "4px",
                                            border: `1px solid ${localStyles.table_body?.borderColor}`,
                                        }}>1</td>
                                        <td style={{
                                            borderColor: localStyles.table_body?.borderColor,
                                            color: localStyles.table_body?.color,
                                            fontSize: localStyles.table_body?.fontSize,
                                            padding: "4px",
                                            border: `1px solid ${localStyles.table_body?.borderColor}`,
                                        }}>Salaire de base</td>
                                        <td style={{
                                            borderColor: localStyles.table_body?.borderColor,
                                            color: localStyles.table_body?.color,
                                            fontSize: localStyles.table_body?.fontSize,
                                            padding: "4px",
                                            border: `1px solid ${localStyles.table_body?.borderColor}`,
                                            textAlign: "right",
                                        }}>500 000</td>
                                    </tr>
                                    <tr style={{
                                        backgroundColor: localStyles.table_totals?.backgroundColor,
                                        fontWeight: localStyles.table_totals?.fontWeight,
                                        color: localStyles.table_totals?.color,
                                    }}>
                                        <td colspan="2" style={{
                                            borderColor: localStyles.table_body?.borderColor,
                                            fontSize: localStyles.table_totals?.fontSize,
                                            padding: "4px",
                                            border: `1px solid ${localStyles.table_body?.borderColor}`,
                                            textAlign: "right",
                                        }}>NET A PAYER</td>
                                        <td style={{
                                            borderColor: localStyles.table_body?.borderColor,
                                            fontSize: localStyles.table_totals?.fontSize,
                                            padding: "4px",
                                            border: `1px solid ${localStyles.table_body?.borderColor}`,
                                            textAlign: "right",
                                        }}>450 000</td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Boite Paiement */}
                            <div style={{
                                ...styles_page.previewBox,
                                backgroundColor: localStyles.payment_info_box?.backgroundColor,
                                border: `${localStyles.payment_info_box?.borderWidth} solid ${localStyles.payment_info_box?.borderColor}`,
                                padding: localStyles.payment_info_box?.padding,
                                marginTop: localStyles.payment_info_box?.marginTop,
                                fontFamily: localStyles.company_box?.fontFamily,
                            }}>
                                <div style={{
                                    fontSize: localStyles.box_title?.fontSize,
                                    fontWeight: localStyles.box_title?.fontWeight,
                                    color: localStyles.box_title?.color,
                                    borderBottom: `${localStyles.box_title?.borderBottomWidth} solid ${localStyles.box_title?.borderBottomColor}`,
                                    paddingBottom: localStyles.box_title?.paddingBottom,
                                }}>
                                    INFORMATIONS DE PAIEMENT
                                </div>
                                <div style={{ fontSize: "11px", marginTop: "5px" }}>Mode: Virement</div>
                                <div style={{ fontSize: "11px" }}>Statut: PAYE</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

const styles_page = {
    page: {
        minHeight: "100vh",
        background: "#f0f4f8",
        fontFamily: "system-ui, sans-serif",
        padding: "24px",
        transition: "margin-left 0.3s ease",
    },
    header: {
        display: "flex",
        alignItems: "flex-start",
        gap: "16px",
        marginBottom: "24px",
    },
    logo: {
        width: "60px",
        height: "60px",
        background: "#3b82f6",
        color: "white",
        borderRadius: "8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "24px",
        fontWeight: "bold",
    },
    title: {
        fontSize: "28px",
        fontWeight: "bold",
        margin: 0,
        color: "#1f2937",
    },
    subtitle: {
        fontSize: "14px",
        color: "#6b7280",
        margin: 0,
        marginTop: "4px",
    },
    formCard: {
        background: "white",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    },
    tabsContainer: {
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
        marginBottom: "20px",
        borderBottom: "1px solid #e5e7eb",
        paddingBottom: "10px",
    },
    tabButton: {
        padding: "8px 12px",
        border: "none",
        background: "#f3f4f6",
        cursor: "pointer",
        borderRadius: "4px",
        fontSize: "12px",
        fontWeight: "500",
        color: "#6b7280",
        transition: "all 0.2s",
    },
    tabButtonActive: {
        background: "#3b82f6",
        color: "white",
    },
    propertiesPanel: {
        paddingTop: "10px",
    },
    propertyRow: {
        display: "flex",
        gap: "10px",
        marginBottom: "15px",
        alignItems: "center",
    },
    label: {
        flex: "0 0 150px",
        fontSize: "12px",
        fontWeight: "500",
        color: "#374151",
    },
    textInput: {
        flex: 1,
        padding: "6px 8px",
        border: "1px solid #d1d5db",
        borderRadius: "4px",
        fontSize: "12px",
    },
    colorInput: {
        flex: 1,
        height: "32px",
        border: "1px solid #d1d5db",
        borderRadius: "4px",
        cursor: "pointer",
    },
    select: {
        flex: 1,
        padding: "6px 8px",
        border: "1px solid #d1d5db",
        borderRadius: "4px",
        fontSize: "12px",
    },
    submitButton: {
        flex: 1,
        padding: "12px 16px",
        background: "#10b981",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontWeight: "500",
    },
    resetButton: {
        flex: 1,
        padding: "12px 16px",
        background: "#f59e0b",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontWeight: "500",
    },
    error: {
        color: "#ef4444",
        fontSize: "12px",
        marginTop: "10px",
    },
    previewHeader: {
        fontSize: "14px",
        fontWeight: "bold",
        marginBottom: "15px",
        color: "#1f2937",
        paddingBottom: "10px",
        borderBottom: "2px solid #3b82f6",
    },
    previewContainer: {
        background: "white",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    },
    previewBox: {
        marginBottom: "15px",
    },
    previewTable: {
        marginTop: "15px",
    },
    previewTableHeader: {
        textAlign: "center",
    },
};
