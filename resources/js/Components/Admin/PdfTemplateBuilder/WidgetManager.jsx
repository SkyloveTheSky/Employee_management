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

/**
 * Génère un ID unique
 */
const generateId = () => {
    return crypto.randomUUID
        ? crypto.randomUUID()
        : `widget_${Date.now()}_${Math.random()}`;
};

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

    columns: 1,

    gap: 12,

    direction: "row",

    fullWidth: true,

    children: [],

    style: {
        width: "100%",
        minHeight: "100px",
        padding: "16px",
        backgroundColor: "#ffffff",
        border: "1px dashed #d1d5db",
        borderRadius: "8px",
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
 * ✅ TEMPLATE PAR DÉFAUT AVEC IDS
 */
export const DEFAULT_TEMPLATE = Object.values(WIDGET_DEFAULTS).map(
    (widget) => ({
        ...clone(widget),
        id: generateId(),
    })
);

export const useTemplateBuilder = (
    initialTemplate = DEFAULT_TEMPLATE
) => {

    /**
     * ✅ Nettoyage + génération des IDs manquants
     */
    const cleanTemplate = initialTemplate
        .filter((w) => WIDGET_DEFAULTS[w.type] !== undefined)
        .map((widget) => ({
            ...clone(widget),
            id: widget.id || generateId(),
        }));

    const [widgets, setWidgets] = useState(cleanTemplate);

    /**
     * Ajouter widget
     */
    const addWidget = (widgetType) => {
        if (!WIDGET_DEFAULTS[widgetType]) return;

        const newWidget = {
            ...clone(WIDGET_DEFAULTS[widgetType]),
            id: generateId(),
            visible: true,
        };

        setWidgets((prev) => [...prev, newWidget]);
    };

    /**
     * Supprimer widget
     */
    const removeWidget = (id) => {
        setWidgets((prev) =>
            prev.filter((w) => w.id !== id)
        );
    };

    /**
     * Mettre à jour widget
     */
    const updateWidget = (id, updates) => {
        setWidgets((prev) =>
            prev.map((w) =>
                w.id === id
                    ? { ...w, ...updates }
                    : w
            )
        );
    };

    /**
     * Afficher / masquer widget
     */
    const toggleWidgetVisibility = (id) => {
        setWidgets((prev) =>
            prev.map((w) =>
                w.id === id
                    ? { ...w, visible: !w.visible }
                    : w
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
