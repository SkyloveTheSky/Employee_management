import React, { useState, useRef } from "react";
import { Head, router, Link } from "@inertiajs/react";
import {
    useTemplateBuilder,
    WIDGET_TYPES,
    WIDGET_DEFAULTS,
} from "../../../Components/Admin/PdfTemplateBuilder/WidgetManager.jsx";
import WidgetPropertyEditor from "../../../Components/Admin/PdfTemplateBuilder/WidgetPropertyEditor.jsx";
import WidgetRenderer from "../../../Components/Admin/PdfTemplateBuilder/WidgetRenderer.jsx";

export default function PdfTemplateBuilder({
    admin,
    initialTemplate = null,
    currentPage,
    sampleData: initialSampleData,
}) {
    const [selectedWidgetId, setSelectedWidgetId] = useState(null);
    const [saved, setSaved] = useState(false);
    const [dragOverId, setDragOverId] = useState(null);
    const dragWidgetId = useRef(null);

    const [sampleData] = useState(initialSampleData ?? {
        company_name: "Entreprise Demo",
        owner_name: "John Doe",
        nif: "1234567",
        stat: "N/A",
        rcs: "N/A",
        employee_name: "Jean Martin",
        employee_position: "Responsable",
        period: "04/2026",
        base_salary: "500 000",
        prime_amount: "20 000",
        overtime_amount: "0",
        gross_salary: "520 000",
        cnaps_rate: "1",
        assurance_rate: "1",
        cnaps_amount: "5 200",
        assurance_amount: "5 200",
        total_retenu: "10 400",
        net_to_pay: "509 600",
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
        setWidgets,
    } = useTemplateBuilder(initialTemplate);

    const selectedWidget = widgets.find((w) => w.id === selectedWidgetId);

    const handleSave = () => {
        router.post(
            route("admin.payrolls.style.update"),
            { styles: widgets },
            {
                onSuccess: () => {
                    setSaved(true);
                    setTimeout(() => setSaved(false), 3000);
                },
            }
        );
    };

    // Drag & drop
    const handleDragStart = (e, widgetId) => {
        dragWidgetId.current = widgetId;
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e, widgetId) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOverId(widgetId);
    };

    const handleDrop = (e, targetId) => {
        e.preventDefault();
        const sourceId = dragWidgetId.current;
        if (!sourceId || sourceId === targetId) {
            setDragOverId(null);
            return;
        }
        const newWidgets = [...widgets];
        const sourceIdx = newWidgets.findIndex((w) => w.id === sourceId);
        const targetIdx = newWidgets.findIndex((w) => w.id === targetId);
        const [moved] = newWidgets.splice(sourceIdx, 1);
        newWidgets.splice(targetIdx, 0, moved);
        setWidgets(newWidgets);
        setDragOverId(null);
        dragWidgetId.current = null;
    };

    const handleDragEnd = () => {
        setDragOverId(null);
        dragWidgetId.current = null;
    };

    const widgetIcons = {
    company_info: (
        <img src="/assets/icon/building.svg" alt="company info" className="w-5 h-5" />
    ),
    employee_info: (
        <img src="/assets/icon/users.svg" alt="employee info" className="w-5 h-5" />
    ),
    earnings_table: (
        <img src="/assets/icon/up.svg" alt="earnings table" className="w-5 h-5" />
    ),
    deductions_table: (
        <img src="/assets/icon/down.svg" alt="deductions table" className="w-5 h-5" />
    ),
    summary_box: (
        <img src="/assets/icon/summary.svg" alt="summary box" className="w-5 h-5" />
    ),
    payment_info: (
        <img src="/assets/icon/information.svg" alt="payment info" className="w-5 h-5" />
    ),
    custom_text: (
        <img src="/assets/icon/editor.svg" alt="custom text" className="w-5 h-5" />
    ),
    spacer: (
        <img src="/assets/icon/backspace-outline.svg" alt="spacer" className="w-5 h-5" />
    ),
};s

    return (
        <>
            <Head title="Éditeur Template PDF" />

            <div style={s.root}>
                {/* ── TOPBAR ── */}
                <header style={s.topbar}>
                    <div style={s.topLeft}>
                        <Link href={route("admin.payrolls.index")} style={s.backBtn}>
                            ← Retour
                        </Link>
                        <span style={s.topTitle}>Éditeur de Template PDF</span>
                    </div>

                    <div style={s.topCenter}>
                        <span style={s.topBadge}>Aperçu en direct</span>
                    </div>

                    <div style={s.topRight}>
                        {saved && <span style={s.savedBadge}>✓ Enregistré</span>}
                        <button onClick={handleSave} style={s.saveBtn}>
                            <img src="/assets/icon/save.svg" alt="save" style={{ width: 18, height: 18,                     verticalAlign: "middle", marginRight: 6 }} />
                            Enregistrer
                        </button>
                    </div>
                </header>

                {/* ── BODY ── */}
                <div style={s.body}>
                    {/* ── PANEL GAUCHE : bibliothèque ── */}
                    <aside style={s.leftPanel}>
                        <p style={s.panelLabel}>WIDGETS DISPONIBLES</p>
                        <div style={s.widgetLibrary}>
                            {Object.entries(WIDGET_TYPES).map(([key, type]) => (
                                <button
                                    key={type}
                                    onClick={() => addWidget(type)}
                                    style={s.addWidgetBtn}
                                    title={`Ajouter ${WIDGET_DEFAULTS[type]?.label}`}
                                >
                                    <span style={s.widgetIcon}>{widgetIcons[type] ?? "◻️"}</span>
                                    <span style={s.widgetBtnLabel}>
                                        {WIDGET_DEFAULTS[type]?.label ?? type}
                                    </span>
                                    <span style={s.widgetPlus}>+</span>
                                </button>
                            ))}
                        </div>

                        <div style={s.divider} />

                        <p style={s.panelLabel}>ORDRE DES SECTIONS</p>
                        <div style={s.widgetOrderList}>
                            {widgets.map((widget, idx) => (
                                <div
                                    key={widget.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, widget.id)}
                                    onDragOver={(e) => handleDragOver(e, widget.id)}
                                    onDrop={(e) => handleDrop(e, widget.id)}
                                    onDragEnd={handleDragEnd}
                                    onClick={() =>
                                        setSelectedWidgetId(
                                            widget.id === selectedWidgetId ? null : widget.id
                                        )
                                    }
                                    style={{
                                        ...s.orderItem,
                                        background:
                                            widget.id === selectedWidgetId
                                                ? "#0F6E56"
                                                : dragOverId === widget.id
                                                ? "#e6f4f1"
                                                : "#fff",
                                        color:
                                            widget.id === selectedWidgetId ? "#fff" : "#1a202c",
                                        opacity: widget.visible ? 1 : 0.45,
                                        borderColor:
                                            dragOverId === widget.id ? "#0F6E56" : "#e2e8f0",
                                    }}
                                >
                                    <span style={s.dragHandle}>⠿</span>
                                    <span style={s.orderIcon}>{widgetIcons[widget.type] ?? "◻️"}</span>
                                    <span style={s.orderLabel}>{widget.label}</span>
                                    <div style={s.orderActions}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleWidgetVisibility(widget.id);
                                            }}
                                            style={s.iconBtn}
                                            title={widget.visible ? "Masquer" : "Afficher"}
                                        >
                                            {widget.visible ? "👁" : "🚫"}
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeWidget(widget.id);
                                                if (selectedWidgetId === widget.id)
                                                    setSelectedWidgetId(null);
                                            }}
                                            style={{ ...s.iconBtn, color: "#e53e3e" }}
                                            title="Supprimer"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </aside>

                    {/* ── CENTRE : aperçu A4 ── */}
                    <main style={s.center}>
                        <div style={s.a4Wrapper}>
                            <div style={s.a4Sheet}>
                                {/* En-tête PDF */}
                                <div style={s.pdfTitle}>FICHE DE PAIE</div>
                                <div style={s.pdfPeriod}>
                                    Période : {sampleData.period}
                                </div>
                                <div style={s.pdfDivider} />

                                {/* Widgets rendus dans l'ordre */}
                                {widgets
                                    .filter((w) => w.visible)
                                    .map((widget) => (
                                        <div
                                            key={widget.id}
                                            onClick={() =>
                                                setSelectedWidgetId(
                                                    widget.id === selectedWidgetId
                                                        ? null
                                                        : widget.id
                                                )
                                            }
                                            style={{
                                                ...s.widgetWrapper,
                                                outline:
                                                    widget.id === selectedWidgetId
                                                        ? "2px solid #0F6E56"
                                                        : "2px solid transparent",
                                                cursor: "pointer",
                                            }}
                                        >
                                            {widget.id === selectedWidgetId && (
                                                <div style={s.widgetSelectedBadge}>
                                                    {widget.label}
                                                </div>
                                            )}
                                            <WidgetRenderer
                                                widgets={[widget]}
                                                data={sampleData}
                                            />
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </main>

                    {/* ── PANEL DROIT : propriétés ── */}
                    <aside style={s.rightPanel}>
                        {selectedWidget ? (
                            <>
                                <p style={s.panelLabel}>PROPRIÉTÉS</p>
                                <div style={s.propWidgetName}>
                                    <span style={s.propWidgetIcon}>
                                        {widgetIcons[selectedWidget.type] ?? "◻️"}
                                    </span>
                                    {selectedWidget.label}
                                </div>
                                <div style={s.propScroll}>
                                    <WidgetPropertyEditor
                                        widget={selectedWidget}
                                        onUpdate={(updated) =>
                                            updateWidget(selectedWidget.id, updated)
                                        }
                                    />
                                </div>
                            </>
                        ) : (
                            <div style={s.noPropMsg}>
                                <div style={s.noPropIcon}>🖱️</div>
                                <p style={s.noPropText}>
                                    Cliquez sur un widget dans l'aperçu ou dans la liste pour
                                    modifier ses propriétés
                                </p>
                            </div>
                        )}
                    </aside>
                </div>
            </div>
        </>
    );
}

const s = {
    root: {
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "#f0f2f5",
        fontFamily: "system-ui, -apple-system, sans-serif",
        overflow: "hidden",
    },

    /* Topbar */
    topbar: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        height: "56px",
        background: "#1a202c",
        borderBottom: "1px solid #2d3748",
        flexShrink: 0,
        zIndex: 100,
    },
    topLeft: {
        display: "flex",
        alignItems: "center",
        gap: "16px",
    },
    backBtn: {
        color: "#a0aec0",
        textDecoration: "none",
        fontSize: "13px",
        padding: "6px 12px",
        borderRadius: "6px",
        border: "1px solid #2d3748",
        transition: "all 0.2s",
        whiteSpace: "nowrap",
    },
    topTitle: {
        color: "#fff",
        fontSize: "14px",
        fontWeight: "600",
    },
    topCenter: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },
    topBadge: {
        fontSize: "11px",
        color: "#68d391",
        background: "#1c4532",
        padding: "3px 10px",
        borderRadius: "20px",
        fontWeight: "500",
    },
    topRight: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
    },
    savedBadge: {
        fontSize: "12px",
        color: "#68d391",
        fontWeight: "500",
    },
    saveBtn: {
        background: "#0F6E56",
        color: "#fff",
        border: "none",
        padding: "8px 18px",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: "600",
        cursor: "pointer",
    },

    /* Body */
    body: {
        display: "flex",
        flex: 1,
        overflow: "hidden",
    },

    /* Panel gauche */
    leftPanel: {
        width: "240px",
        flexShrink: 0,
        background: "#fff",
        borderRight: "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        padding: "16px 0",
    },
    panelLabel: {
        fontSize: "10px",
        fontWeight: "700",
        color: "#a0aec0",
        letterSpacing: "0.08em",
        padding: "0 16px",
        marginBottom: "8px",
        marginTop: "4px",
    },
    widgetLibrary: {
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        padding: "0 12px",
    },
    addWidgetBtn: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 10px",
        background: "#f7fafc",
        border: "1px solid #e2e8f0",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "12px",
        color: "#2d3748",
        transition: "all 0.15s",
        textAlign: "left",
    },
    widgetIcon: { fontSize: "14px" },
    widgetBtnLabel: { flex: 1, fontSize: "12px" },
    widgetPlus: { fontSize: "16px", color: "#0F6E56", fontWeight: "bold" },
    divider: {
        height: "1px",
        background: "#e2e8f0",
        margin: "16px 0",
    },
    widgetOrderList: {
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        padding: "0 12px",
    },
    orderItem: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "8px 10px",
        borderRadius: "6px",
        border: "1px solid #e2e8f0",
        cursor: "grab",
        fontSize: "12px",
        transition: "all 0.15s",
        userSelect: "none",
    },
    dragHandle: {
        fontSize: "14px",
        color: "#a0aec0",
        cursor: "grab",
        flexShrink: 0,
    },
    orderIcon: { fontSize: "13px", flexShrink: 0 },
    orderLabel: { flex: 1, fontSize: "12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
    orderActions: { display: "flex", gap: "4px", flexShrink: 0 },
    iconBtn: {
        background: "none",
        border: "none",
        cursor: "pointer",
        fontSize: "12px",
        padding: "2px 4px",
        borderRadius: "4px",
        lineHeight: 1,
    },

    /* Centre */
    center: {
        flex: 1,
        overflowY: "auto",
        display: "flex",
        justifyContent: "center",
        padding: "32px 24px",
        background: "#e8ecf0",
    },
    a4Wrapper: {
        width: "100%",
        maxWidth: "680px",
    },
    a4Sheet: {
        background: "#fff",
        minHeight: "960px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
        borderRadius: "2px",
        padding: "40px 44px",
    },
    pdfTitle: {
        fontSize: "20px",
        fontWeight: "bold",
        textAlign: "center",
        color: "#1a202c",
        marginBottom: "4px",
        letterSpacing: "0.05em",
    },
    pdfPeriod: {
        fontSize: "12px",
        textAlign: "center",
        color: "#718096",
        marginBottom: "12px",
    },
    pdfDivider: {
        height: "1px",
        background: "#e2e8f0",
        marginBottom: "16px",
    },
    widgetWrapper: {
        position: "relative",
        borderRadius: "4px",
        marginBottom: "8px",
        transition: "outline 0.15s",
    },
    widgetSelectedBadge: {
        position: "absolute",
        top: "-10px",
        left: "8px",
        fontSize: "9px",
        background: "#0F6E56",
        color: "#fff",
        padding: "2px 8px",
        borderRadius: "4px",
        fontWeight: "600",
        zIndex: 10,
        letterSpacing: "0.04em",
    },

    /* Panel droit */
    rightPanel: {
        width: "280px",
        flexShrink: 0,
        background: "#fff",
        borderLeft: "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        padding: "16px 0 0",
    },
    propWidgetName: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "13px",
        fontWeight: "600",
        color: "#1a202c",
        padding: "0 16px 12px",
        borderBottom: "1px solid #e2e8f0",
        marginBottom: "8px",
    },
    propWidgetIcon: { fontSize: "16px" },
    propScroll: {
        flex: 1,
        overflowY: "auto",
        padding: "0 8px 16px",
    },
    noPropMsg: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        gap: "12px",
    },
    noPropIcon: { fontSize: "32px", opacity: 0.4 },
    noPropText: {
        fontSize: "12px",
        color: "#a0aec0",
        textAlign: "center",
        lineHeight: "1.6",
    },
};
