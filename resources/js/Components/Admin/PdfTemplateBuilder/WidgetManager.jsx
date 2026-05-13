import { useState } from "react";

export const WIDGET_TYPES = {
    SPACER: "spacer",
    CONTAINER: "container",
    ENTREPRISE: "entreprise",
    EMPLOYEE: "employeeBlock",
};

const clone = (obj) =>
    typeof structuredClone === "function"
        ? structuredClone(obj)
        : JSON.parse(JSON.stringify(obj));

export const WIDGET_DEFAULTS = {
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
        },
    },

    [WIDGET_TYPES.ENTREPRISE]: {
        type: WIDGET_TYPES.ENTREPRISE,
        label: "Entreprise",
        order: 101,
        visible: true,
        style: {
            backgroundColor: "#fafafa",
            border: "1px solid #999",
            padding: "8px",
            fontFamily: "Liberation Sans, sans-serif",
        },
    },

    [WIDGET_TYPES.EMPLOYEE]: {
        type: WIDGET_TYPES.EMPLOYEE,
        label: "Employé",
        order: 102,
        visible: true,
        style: {
            backgroundColor: "#fafafa",
            border: "1px solid #999",
            padding: "8px",
            fontFamily: "Liberation Sans, sans-serif",
        },
    },
};

/**
 * ✅ Template propre SANS anciens widgets
 */
export const DEFAULT_TEMPLATE = Object.values(WIDGET_DEFAULTS).map(clone);

export const useTemplateBuilder = (initialTemplate = DEFAULT_TEMPLATE) => {
    // 🔥 FILTRE DE SÉCURITÉ (TRÈS IMPORTANT)
    const cleanTemplate = initialTemplate.filter(
        (w) => WIDGET_DEFAULTS[w.type] !== undefined
    );

    const [widgets, setWidgets] = useState(cleanTemplate);

    const addWidget = (widgetType) => {
        if (!WIDGET_DEFAULTS[widgetType]) return;

        const newWidget = {
            ...clone(WIDGET_DEFAULTS[widgetType]),
            id: `widget_${Date.now()}`,
        };

        setWidgets((prev) => [...prev, newWidget]);
    };

    const removeWidget = (id) => {
        setWidgets((prev) => prev.filter((w) => w.id !== id));
    };

    const updateWidget = (id, updates) => {
        setWidgets((prev) =>
            prev.map((w) => (w.id === id ? { ...w, ...updates } : w))
        );
    };

    const toggleWidgetVisibility = (id) => {
        setWidgets((prev) =>
            prev.map((w) =>
                w.id === id ? { ...w, visible: !w.visible } : w
            )
        );
    };

    return {
        widgets,
        setWidgets,
        addWidget,
        removeWidget,
        updateWidget,
        toggleWidgetVisibility,
    };
};
