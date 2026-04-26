import React from "react";

/**
 * Compose pour éditer les propriétés d'un widget
 */
export default function WidgetPropertyEditor({ widget, onUpdate }) {
    const handlePropertyChange = (property, value) => {
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
        "paddingBottom",
        "padding",
        "borderWidth",
        "borderRadius",
        "marginTop",
        "marginBottom",
    ];

    return (
        <div style={styles.container}>
            <h3 style={styles.title}>{widget.label}</h3>

            {Object.keys(widget.style || {}).map((prop) => (
                <div key={prop} style={styles.propertyRow}>
                    <label style={styles.label}>{formatPropName(prop)}</label>

                    {colorProperties.includes(prop) ? (
                        <input
                            type="color"
                            value={widget.style[prop] || "#000000"}
                            onChange={(e) => handlePropertyChange(prop, e.target.value)}
                            style={styles.colorInput}
                        />
                    ) : prop === "fontWeight" ? (
                        <select
                            value={widget.style[prop] || "normal"}
                            onChange={(e) => handlePropertyChange(prop, e.target.value)}
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
                            onChange={(e) => handlePropertyChange(prop, e.target.value)}
                            style={styles.select}
                        >
                            <option value="left">Gauche</option>
                            <option value="center">Centre</option>
                            <option value="right">Droite</option>
                        </select>
                    ) : prop === "fontFamily" ? (
                        <select
                            value={widget.style[prop] || "Liberation Sans, sans-serif"}
                            onChange={(e) => handlePropertyChange(prop, e.target.value)}
                            style={styles.select}
                        >
                            <option value="Liberation Sans, sans-serif">Liberation Sans</option>
                            <option value="DejaVu Sans, sans-serif">DejaVu Sans</option>
                            <option value="Arial, sans-serif">Arial</option>
                            <option value="Times New Roman, serif">Times New Roman</option>
                            <option value="Courier New, monospace">Courier New</option>
                        </select>
                    ) : (
                        <input
                            type="text"
                            value={widget.style[prop] || ""}
                            onChange={(e) => handlePropertyChange(prop, e.target.value)}
                            style={styles.textInput}
                            placeholder={prop}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}

function formatPropName(prop) {
    return prop
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
}

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
