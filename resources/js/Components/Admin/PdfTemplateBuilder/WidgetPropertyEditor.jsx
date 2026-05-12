import React from "react";

/**
 * Éditeur de propriétés de widget (inclut support Container)
 */
export default function WidgetPropertyEditor({ widget, onUpdate }) {
    const isContainer = widget.type === "container";

    const handleChange = (section, property, value) => {
        onUpdate({
            ...widget,
            [section]: {
                ...widget[section],
                [property]: value,
            },
        });
    };

    const handleStyleChange = (property, value) => {
        onUpdate({
            ...widget,
            style: {
                ...widget.style,
                [property]: value,
            },
        });
    };

    const colorProperties = [
        "backgroundColor",
        "borderColor",
        "headerBackgroundColor",
        "color",
    ];

    const textProperties = [
        "fontSize",
        "fontFamily",
        "fontWeight",
        "textAlign",
        "padding",
        "paddingTop",
        "paddingBottom",
        "marginTop",
        "marginBottom",
        "borderWidth",
        "borderRadius",
    ];

    return (
        <div style={styles.container}>
            <h3 style={styles.title}>{widget.label}</h3>

            {/* =========================
                STYLE EDITOR
            ========================= */}
            <h4 style={styles.sectionTitle}>Style</h4>

            {Object.keys(widget.style || {}).map((prop) => (
                <div key={prop} style={styles.propertyRow}>
                    <label style={styles.label}>{formatPropName(prop)}</label>

                    {colorProperties.includes(prop) ? (
                        <input
                            type="color"
                            value={widget.style[prop] || "#000000"}
                            onChange={(e) =>
                                handleStyleChange(prop, e.target.value)
                            }
                            style={styles.colorInput}
                        />
                    ) : prop === "fontWeight" ? (
                        <select
                            value={widget.style[prop] || "normal"}
                            onChange={(e) =>
                                handleStyleChange(prop, e.target.value)
                            }
                            style={styles.select}
                        >
                            <option value="normal">Normal</option>
                            <option value="bold">Gras</option>
                            <option value="lighter">Léger</option>
                            <option value="900">Très gras</option>
                        </select>
                    ) : prop === "textAlign" ? (
                        <select
                            value={widget.style[prop] || "left"}
                            onChange={(e) =>
                                handleStyleChange(prop, e.target.value)
                            }
                            style={styles.select}
                        >
                            <option value="left">Gauche</option>
                            <option value="center">Centre</option>
                            <option value="right">Droite</option>
                        </select>
                    ) : prop === "fontFamily" ? (
                        <select
                            value={widget.style[prop] || "Liberation Sans, sans-serif"}
                            onChange={(e) =>
                                handleStyleChange(prop, e.target.value)
                            }
                            style={styles.select}
                        >
                            <option value="Liberation Sans, sans-serif">Liberation Sans</option>
                            <option value="DejaVu Sans, sans-serif">DejaVu Sans</option>
                            <option value="Arial, sans-serif">Arial</option>
                            <option value="Times New Roman, serif">Times</option>
                            <option value="Courier New, monospace">Courier</option>
                        </select>
                    ) : (
                        <input
                            type="text"
                            value={widget.style[prop] || ""}
                            onChange={(e) =>
                                handleStyleChange(prop, e.target.value)
                            }
                            style={styles.textInput}
                            placeholder={prop}
                        />
                    )}
                </div>
            ))}

            {/* =========================
                CONTAINER SPECIFIC
            ========================= */}
            {isContainer && (
                <>
                    <h4 style={styles.sectionTitle}>Container Layout</h4>

                    {/* display */}
                    <div style={styles.propertyRow}>
                        <label style={styles.label}>Display</label>
                        <select
                            value={widget.style?.display || "flex"}
                            onChange={(e) =>
                                handleStyleChange("display", e.target.value)
                            }
                            style={styles.select}
                        >
                            <option value="flex">Flex</option>
                            <option value="block">Block</option>
                            <option value="grid">Grid</option>
                        </select>
                    </div>

                    {/* flex direction */}
                    <div style={styles.propertyRow}>
                        <label style={styles.label}>Direction</label>
                        <select
                            value={widget.style?.flexDirection || "column"}
                            onChange={(e) =>
                                handleStyleChange("flexDirection", e.target.value)
                            }
                            style={styles.select}
                        >
                            <option value="column">Column</option>
                            <option value="row">Row</option>
                        </select>
                    </div>

                    {/* justify */}
                    <div style={styles.propertyRow}>
                        <label style={styles.label}>Justify</label>
                        <select
                            value={widget.style?.justifyContent || "flex-start"}
                            onChange={(e) =>
                                handleStyleChange("justifyContent", e.target.value)
                            }
                            style={styles.select}
                        >
                            <option value="flex-start">Start</option>
                            <option value="center">Center</option>
                            <option value="space-between">Space Between</option>
                            <option value="space-around">Space Around</option>
                        </select>
                    </div>

                    {/* align */}
                    <div style={styles.propertyRow}>
                        <label style={styles.label}>Align</label>
                        <select
                            value={widget.style?.alignItems || "stretch"}
                            onChange={(e) =>
                                handleStyleChange("alignItems", e.target.value)
                            }
                            style={styles.select}
                        >
                            <option value="flex-start">Start</option>
                            <option value="center">Center</option>
                            <option value="flex-end">End</option>
                            <option value="stretch">Stretch</option>
                        </select>
                    </div>

                    {/* gap */}
                    <div style={styles.propertyRow}>
                        <label style={styles.label}>Gap</label>
                        <input
                            type="text"
                            value={widget.style?.gap || ""}
                            onChange={(e) =>
                                handleStyleChange("gap", e.target.value)
                            }
                            style={styles.textInput}
                            placeholder="10px"
                        />
                    </div>
                </>
            )}
        </div>
    );
}

/* =========================
   HELPERS
========================= */
function formatPropName(prop) {
    return prop
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
}

/* =========================
   STYLES
========================= */
const styles = {
    container: {
        padding: "15px",
        backgroundColor: "#fff",
        borderRadius: "8px",
        marginTop: "10px",
    },
    title: {
        fontSize: "14px",
        fontWeight: "600",
        marginBottom: "15px",
        color: "#333",
    },
    sectionTitle: {
        fontSize: "12px",
        fontWeight: "700",
        marginTop: "15px",
        marginBottom: "10px",
        color: "#444",
    },
    propertyRow: {
        marginBottom: "12px",
        display: "flex",
        gap: "10px",
        alignItems: "center",
    },
    label: {
        fontSize: "12px",
        fontWeight: "500",
        color: "#555",
        minWidth: "120px",
        textAlign: "right",
    },
    colorInput: {
        width: "50px",
        height: "36px",
        border: "1px solid #ddd",
        borderRadius: "4px",
        cursor: "pointer",
        flex: 1,
    },
    textInput: {
        flex: 1,
        padding: "8px 10px",
        fontSize: "12px",
        border: "1px solid #ddd",
        borderRadius: "4px",
        fontFamily: "monospace",
    },
    select: {
        flex: 1,
        padding: "8px 10px",
        fontSize: "12px",
        border: "1px solid #ddd",
        borderRadius: "4px",
    },
};
