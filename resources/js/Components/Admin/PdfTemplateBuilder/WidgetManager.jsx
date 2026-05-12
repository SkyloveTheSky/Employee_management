import React, { useState } from "react";

export const WIDGET_TYPES = {
    COMPANY_INFO: "company_info",
    EMPLOYEE_INFO: "employee_info",
    EARNINGS_TABLE: "earnings_table",
    DEDUCTIONS_TABLE: "deductions_table",
    SUMMARY_BOX: "summary_box",
    PAYMENT_INFO: "payment_info",
    CUSTOM_TEXT: "custom_text",
    SPACER: "spacer",
    CONTAINER: "container",
    ENTREPRISE: "entreprise",
};

/**
 * 🔥 IMPORTANT FIX:
 * On évite les références partagées (deep clone)
 */
const clone = (obj) =>
    typeof structuredClone === "function"
        ? structuredClone(obj)
        : JSON.parse(JSON.stringify(obj));

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

    [WIDGET_TYPES.CONTAINER]: {
        type: WIDGET_TYPES.CONTAINER,
        label: "Conteneur",
        order: 100,
        visible: true,
        children: [],
        style: {
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            width: "100%",
            minHeight: "100px",
            padding: "10px",
            backgroundColor: "#ffffff",
            borderWidth: "1px",
            borderStyle: "dashed",
            borderColor: "#d1d5db",
            borderRadius: "6px",
            marginTop: "10px",
            marginBottom: "10px",
        },
    },
    [WIDGET_TYPES.ENTREPRISE]: {
        type: WIDGET_TYPES.ENTREPRISE,
        label: "Informations Entreprise",
        order: 101,
        style: {
            backgroundColor: "#fafafa",
            borderColor: "#999",
            borderWidth: "1px",
            padding: "8px",
            borderRadius: "0px",
            fontFamily: "Liberation Sans, sans-serif",},
        visible: true,
    },
};

/**
 * 🔥 FIX IMPORTANT:
 * Plus de référence partagée entre widgets
 */
export const DEFAULT_TEMPLATE = Object.values(WIDGET_TYPES).map((type) =>
    clone(WIDGET_DEFAULTS[type])
);

/**
 * Hook pour gérer les widgets du template
 */
export const useTemplateBuilder = (initialTemplate = DEFAULT_TEMPLATE) => {
    const [widgets, setWidgets] = useState(initialTemplate);

    const addWidget = (widgetType) => {
        const newWidget = clone(WIDGET_DEFAULTS[widgetType]);
        newWidget.id = `widget_${Date.now()}_${Math.random()}`; // ID unique garanti

        setWidgets((prev) => [...prev, newWidget]);
    };

    const removeWidget = (widgetId) => {
        setWidgets((prev) => prev.filter((w) => w.id !== widgetId));
    };

    const updateWidget = (widgetId, updates) => {
        setWidgets((prev) =>
            prev.map((w) =>
                w.id === widgetId ? { ...w, ...updates } : w
            )
        );
    };

    const reorderWidgets = (widgetId, direction) => {
        setWidgets((prev) => {
            const index = prev.findIndex((w) => w.id === widgetId);
            if (index === -1) return prev;

            const newWidgets = [...prev];

            if (direction === "up" && index > 0) {
                [newWidgets[index], newWidgets[index - 1]] = [
                    newWidgets[index - 1],
                    newWidgets[index],
                ];
            }

            if (direction === "down" && index < newWidgets.length - 1) {
                [newWidgets[index], newWidgets[index + 1]] = [
                    newWidgets[index + 1],
                    newWidgets[index],
                ];
            }

            return newWidgets;
        });
    };

    const toggleWidgetVisibility = (widgetId) => {
        setWidgets((prev) =>
            prev.map((w) =>
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
