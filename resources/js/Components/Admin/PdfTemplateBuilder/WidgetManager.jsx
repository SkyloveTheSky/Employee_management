import React, { useState } from "react";

export const WIDGET_TYPES = {
    SPACER: "spacer",
    CONTAINER: "container",
    ENTREPRISE: "entreprise",
    EMPLOYEE: "employeeBlock",
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
    [WIDGET_TYPES.EMPLOYEE]: {
        type: WIDGET_TYPES.EMPLOYEE,
        label: "Bloc Employé",
        order: 102,
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
        const newWidget = { ...WIDGET_DEFAULTS[widgetType], id: `widget_${Date.now()}` };// ID unique garanti

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
