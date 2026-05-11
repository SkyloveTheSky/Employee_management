import { useState, useRef } from "react";
import { router } from "@inertiajs/react";
import {
    useTemplateBuilder,
} from "../Admin/PdfTemplateBuilder/WidgetManager.jsx";

// ── Marges par défaut ──
export const DEFAULT_MARGINS = { top: 20, bottom: 20, left: 20, right: 20 };

// ── Icônes des widgets ──
export const WIDGET_ICONS = {
    company_info:     <img src="/assets/icon/building.svg"          alt="" style={{ width: 16, height: 16 }} />,
    employee_info:    <img src="/assets/icon/users.svg"             alt="" style={{ width: 16, height: 16 }} />,
    earnings_table:   <img src="/assets/icon/up.svg"                alt="" style={{ width: 16, height: 16 }} />,
    deductions_table: <img src="/assets/icon/down.svg"              alt="" style={{ width: 16, height: 16 }} />,
    summary_box:      <img src="/assets/icon/summary.svg"           alt="" style={{ width: 16, height: 16 }} />,
    payment_info:     <img src="/assets/icon/information.svg"       alt="" style={{ width: 16, height: 16 }} />,
    custom_text:      <img src="/assets/icon/editor.svg"            alt="" style={{ width: 16, height: 16 }} />,
    spacer:           <img src="/assets/icon/backspace-outline.svg" alt="" style={{ width: 16, height: 16 }} />,
};

// ── Données d'exemple par défaut ──
export const DEFAULT_SAMPLE_DATA = {
    company_name:      "Entreprise Demo",
    owner_name:        "John Doe",
    nif:               "1234567",
    stat:              "N/A",
    rcs:               "N/A",
    employee_name:     "Jean Martin",
    employee_position: "Responsable",
    period:            "04/2026",
    base_salary:       "500 000",
    prime_amount:      "20 000",
    overtime_amount:   "0",
    gross_salary:      "520 000",
    cnaps_rate:        "1",
    assurance_rate:    "1",
    cnaps_amount:      "5 200",
    assurance_amount:  "5 200",
    total_retenu:      "10 400",
    net_to_pay:        "509 600",
    payment_method:    "Mobile Money",
    payment_status:    "Non payé",
};

// ── Propriétés de style par type de widget ──
// Définit quelles propriétés sont éditables pour chaque widget
export const WIDGET_STYLE_PROPERTIES = {
    company_info: [
        { key: "backgroundColor",  label: "Couleur fond",     type: "color" },
        { key: "borderColor",      label: "Couleur bordure",  type: "color" },
        { key: "borderWidth",      label: "Épaisseur bordure",type: "text",  placeholder: "1px" },
        { key: "padding",          label: "Espacement interne",type: "text", placeholder: "8px" },
        { key: "borderRadius",     label: "Arrondi",          type: "text",  placeholder: "0px" },
        { key: "fontFamily",       label: "Police",           type: "select", options: FONT_OPTIONS },
        { key: "fontSize",         label: "Taille texte",     type: "text",  placeholder: "11px" },
    ],
    employee_info: [
        { key: "backgroundColor",  label: "Couleur fond",     type: "color" },
        { key: "borderColor",      label: "Couleur bordure",  type: "color" },
        { key: "borderWidth",      label: "Épaisseur bordure",type: "text",  placeholder: "1px" },
        { key: "padding",          label: "Espacement interne",type: "text", placeholder: "8px" },
        { key: "borderRadius",     label: "Arrondi",          type: "text",  placeholder: "0px" },
        { key: "fontFamily",       label: "Police",           type: "select", options: FONT_OPTIONS },
        { key: "fontSize",         label: "Taille texte",     type: "text",  placeholder: "11px" },
    ],
    earnings_table: [
        { key: "headerBackgroundColor", label: "Fond en-tête",      type: "color" },
        { key: "headerBorderColor",     label: "Bordure en-tête",   type: "color" },
        { key: "headerFontSize",        label: "Taille en-tête",    type: "text", placeholder: "10px" },
        { key: "headerFontWeight",      label: "Graisse en-tête",   type: "select", options: FONT_WEIGHT_OPTIONS },
        { key: "bodyBorderColor",       label: "Bordure corps",     type: "color" },
        { key: "bodyFontSize",          label: "Taille corps",      type: "text", placeholder: "10px" },
        { key: "backgroundColor",       label: "Fond totaux",       type: "color" },
    ],
    deductions_table: [
        { key: "headerBackgroundColor", label: "Fond en-tête",      type: "color" },
        { key: "headerBorderColor",     label: "Bordure en-tête",   type: "color" },
        { key: "headerFontSize",        label: "Taille en-tête",    type: "text", placeholder: "10px" },
        { key: "headerFontWeight",      label: "Graisse en-tête",   type: "select", options: FONT_WEIGHT_OPTIONS },
        { key: "bodyBorderColor",       label: "Bordure corps",     type: "color" },
        { key: "bodyFontSize",          label: "Taille corps",      type: "text", placeholder: "10px" },
        { key: "backgroundColor",       label: "Fond totaux",       type: "color" },
    ],
    summary_box: [
        { key: "backgroundColor", label: "Couleur fond",  type: "color" },
        { key: "fontSize",        label: "Taille texte",  type: "text", placeholder: "11px" },
        { key: "fontWeight",      label: "Graisse",       type: "select", options: FONT_WEIGHT_OPTIONS },
        { key: "padding",         label: "Espacement",    type: "text", placeholder: "10px" },
    ],
    payment_info: [
        { key: "backgroundColor", label: "Couleur fond",      type: "color" },
        { key: "borderColor",     label: "Couleur bordure",   type: "color" },
        { key: "borderWidth",     label: "Épaisseur bordure", type: "text", placeholder: "1px" },
        { key: "padding",         label: "Espacement interne",type: "text", placeholder: "8px" },
        { key: "marginTop",       label: "Marge en haut",     type: "text", placeholder: "18px" },
    ],
    spacer: [
        { key: "height", label: "Hauteur", type: "text", placeholder: "10px" },
    ],
    custom_text: [
        { key: "fontSize",   label: "Taille texte", type: "text",   placeholder: "11px" },
        { key: "color",      label: "Couleur",      type: "color" },
        { key: "fontFamily", label: "Police",       type: "select", options: FONT_OPTIONS },
        { key: "textAlign",  label: "Alignement",   type: "select", options: TEXT_ALIGN_OPTIONS },
        { key: "padding",    label: "Espacement",   type: "text",   placeholder: "8px" },
    ],
};

// ── Options partagées ──
export const FONT_OPTIONS = [
    { value: "Liberation Sans, sans-serif", label: "Liberation Sans" },
    { value: "DejaVu Sans, sans-serif",     label: "DejaVu Sans" },
    { value: "Arial, sans-serif",           label: "Arial" },
    { value: "Times New Roman, serif",      label: "Times New Roman" },
    { value: "Courier New, monospace",      label: "Courier New" },
];

export const FONT_WEIGHT_OPTIONS = [
    { value: "normal", label: "Normal" },
    { value: "bold",   label: "Gras" },
    { value: "lighter",label: "Léger" },
    { value: "900",    label: "Très gras" },
];

export const TEXT_ALIGN_OPTIONS = [
    { value: "left",   label: "Gauche" },
    { value: "center", label: "Centre" },
    { value: "right",  label: "Droite" },
];

// ── Styles par défaut par widget ──
export const WIDGET_DEFAULT_STYLES = {
    company_info: {
        backgroundColor: "#fafafa",
        borderColor:     "#999",
        borderWidth:     "1px",
        padding:         "8px",
        borderRadius:    "0px",
        fontFamily:      "Liberation Sans, sans-serif",
        fontSize:        "11px",
    },
    employee_info: {
        backgroundColor: "#fafafa",
        borderColor:     "#999",
        borderWidth:     "1px",
        padding:         "8px",
        borderRadius:    "0px",
        fontFamily:      "Liberation Sans, sans-serif",
        fontSize:        "11px",
    },
    earnings_table: {
        headerBackgroundColor: "#e0e0e0",
        headerBorderColor:     "#999",
        headerFontSize:        "10px",
        headerFontWeight:      "bold",
        bodyBorderColor:       "#999",
        bodyFontSize:          "10px",
        backgroundColor:       "#f0f0f0",
    },
    deductions_table: {
        headerBackgroundColor: "#e0e0e0",
        headerBorderColor:     "#999",
        headerFontSize:        "10px",
        headerFontWeight:      "bold",
        bodyBorderColor:       "#999",
        bodyFontSize:          "10px",
        backgroundColor:       "#f0f0f0",
    },
    summary_box: {
        backgroundColor: "#f0f0f0",
        fontSize:        "11px",
        fontWeight:      "bold",
        padding:         "10px",
    },
    payment_info: {
        backgroundColor: "#fafafa",
        borderColor:     "#999",
        borderWidth:     "1px",
        padding:         "8px",
        marginTop:       "18px",
    },
    spacer: {
        height: "10px",
    },
    custom_text: {
        fontSize:   "11px",
        color:      "#1a1a1a",
        fontFamily: "Liberation Sans, sans-serif",
        textAlign:  "left",
        padding:    "0px",
    },
};

// ── Hook principal de l'éditeur ──
export function useEditor({ initialTemplate, initialSampleData, initialMargins }) {
    const [margins, setMargins]       = useState(initialMargins ?? DEFAULT_MARGINS);
    const [saved, setSaved]           = useState(false);
    const [dragOverId, setDragOverId] = useState(null);
    const dragWidgetId                = useRef(null);

    const [sampleData] = useState(initialSampleData ?? DEFAULT_SAMPLE_DATA);

    const {
        widgets,
        addWidget,
        removeWidget,
        updateWidget,
        toggleWidgetVisibility,
        setWidgets,
    } = useTemplateBuilder(initialTemplate);

    const handleSave = (onSuccess) => {
        router.post(
            route("admin.payrolls.style.update"),
            { styles: widgets, margins },
            {
                onSuccess: () => {
                    setSaved(true);
                    setTimeout(() => setSaved(false), 3000);
                    onSuccess?.();
                },
            }
        );
    };

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
        if (!sourceId || sourceId === targetId) { setDragOverId(null); return; }
        const newWidgets  = [...widgets];
        const sourceIdx   = newWidgets.findIndex((w) => w.id === sourceId);
        const targetIdx   = newWidgets.findIndex((w) => w.id === targetId);
        const [moved]     = newWidgets.splice(sourceIdx, 1);
        newWidgets.splice(targetIdx, 0, moved);
        // Mettre à jour l'order après drag & drop
        const withOrder   = newWidgets.map((w, idx) => ({ ...w, order: idx + 1 }));
        setWidgets(withOrder);
        setDragOverId(null);
        dragWidgetId.current = null;
    };

    const handleDragEnd = () => {
        setDragOverId(null);
        dragWidgetId.current = null;
    };

    return {
        widgets,
        margins,        setMargins,
        saved,
        sampleData,
        dragOverId,
        addWidget,
        removeWidget,
        updateWidget,
        toggleWidgetVisibility,
        handleDragStart,
        handleDragOver,
        handleDrop,
        handleDragEnd,
        handleSave,
    };
}
