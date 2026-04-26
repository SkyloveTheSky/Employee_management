import React, { useState } from "react";

/**
 * Gère les widgets du template PDF
 * Chaque widget peut être :
 * - Company Info
 * - Employee Info
 * - Earnings Table
 * - Deductions Table
 * - Summary Box
 * - Payment Info
 */

export const WIDGET_TYPES = {
    COMPANY_INFO: "company_info",
    EMPLOYEE_INFO: "employee_info",
    EARNINGS_TABLE: "earnings_table",
    DEDUCTIONS_TABLE: "deductions_table",
    SUMMARY_BOX: "summary_box",
    PAYMENT_INFO: "payment_info",
    CUSTOM_TEXT: "custom_text",
    SPACER: "spacer",
};

export const WIDGET_DEFAULTS = {
    [WIDGET_TYPES.COMPANY_INFO]: {
        type: WIDGET_TYPES.COMPANY_INFO,
        label: "Informations Entreprise",
        order: 1,
        style: {
            backgroundColor: "#fafafa",
            borderColor: "#999",
            borderWidth: "1px",
            padding: "8px",
            borderRadius: "0px",
            fontFamily: "Liberation Sans, sans-serif",
            fontSize: "11px",
        },
        visible: true,
    },
    [WIDGET_TYPES.EMPLOYEE_INFO]: {
        type: WIDGET_TYPES.EMPLOYEE_INFO,
        label: "Informations Employé",
        order: 2,
        style: {
            backgroundColor: "#fafafa",
            borderColor: "#999",
            borderWidth: "1px",
            padding: "8px",
            borderRadius: "0px",
            fontFamily: "Liberation Sans, sans-serif",
            fontSize: "11px",
        },
        visible: true,
    },
    [WIDGET_TYPES.EARNINGS_TABLE]: {
        type: WIDGET_TYPES.EARNINGS_TABLE,
        label: "Tableau des Gains",
        order: 3,
        columns: ["designation", "montant"],
        style: {
            headerBackgroundColor: "#e0e0e0",
            headerBorderColor: "#999",
            headerFontSize: "10px",
            headerFontWeight: "bold",
            bodyBorderColor: "#999",
            bodyFontSize: "10px",
        },
        visible: true,
    },
    [WIDGET_TYPES.DEDUCTIONS_TABLE]: {
        type: WIDGET_TYPES.DEDUCTIONS_TABLE,
        label: "Tableau des Retenues",
        order: 4,
        columns: ["designation", "montant"],
        style: {
            headerBackgroundColor: "#e0e0e0",
            headerBorderColor: "#999",
            headerFontSize: "10px",
            headerFontWeight: "bold",
            bodyBorderColor: "#999",
            bodyFontSize: "10px",
        },
        visible: true,
    },
    [WIDGET_TYPES.SUMMARY_BOX]: {
        type: WIDGET_TYPES.SUMMARY_BOX,
        label: "Résumé",
        order: 5,
        style: {
            backgroundColor: "#f0f0f0",
            fontSize: "11px",
            fontWeight: "bold",
        },
        visible: true,
    },
    [WIDGET_TYPES.PAYMENT_INFO]: {
        type: WIDGET_TYPES.PAYMENT_INFO,
        label: "Informations Paiement",
        order: 6,
        style: {
            backgroundColor: "#fafafa",
            borderColor: "#999",
            borderWidth: "1px",
            padding: "8px",
            marginTop: "18px",
        },
        visible: true,
    },
    [WIDGET_TYPES.SPACER]: {
        type: WIDGET_TYPES.SPACER,
        label: "Espace",
        order: 99,
        height: "10px",
        visible: true,
    },
};

export const DEFAULT_TEMPLATE = Object.values(WIDGET_TYPES).map((type) => WIDGET_DEFAULTS[type]);

/**
 * Hook pour gérer les widgets du template
 */
export const useTemplateBuilder = (initialTemplate = DEFAULT_TEMPLATE) => {
    const [widgets, setWidgets] = useState(initialTemplate);

    const addWidget = (widgetType) => {
        const newWidget = { ...WIDGET_DEFAULTS[widgetType], id: `widget_${Date.now()}` };
        setWidgets([...widgets, newWidget]);
    };

    const removeWidget = (widgetId) => {
        setWidgets(widgets.filter((w) => w.id !== widgetId));
    };

    const updateWidget = (widgetId, updates) => {
        setWidgets(widgets.map((w) => (w.id === widgetId ? { ...w, ...updates } : w)));
    };

    const reorderWidgets = (widgetId, direction) => {
        const index = widgets.findIndex((w) => w.id === widgetId);
        if (direction === "up" && index > 0) {
            const newWidgets = [...widgets];
            [newWidgets[index], newWidgets[index - 1]] = [newWidgets[index - 1], newWidgets[index]];
            setWidgets(newWidgets);
        } else if (direction === "down" && index < widgets.length - 1) {
            const newWidgets = [...widgets];
            [newWidgets[index], newWidgets[index + 1]] = [newWidgets[index + 1], newWidgets[index]];
            setWidgets(newWidgets);
        }
    };

    const toggleWidgetVisibility = (widgetId) => {
        setWidgets(
            widgets.map((w) =>
                w.id === widgetId ? { ...w, visible: !w.visible } : w
            )
        );
    };

    return {
        widgets,
        setWidgets,
        addWidget,
        removeWidget,
        updateWidget,
        reorderWidgets,
        toggleWidgetVisibility,
    };
};
