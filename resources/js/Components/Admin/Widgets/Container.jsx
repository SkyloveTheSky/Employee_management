import React from "react";

export default function Container({
    widget,
    children,
    isSelected = false,
    onClick = null,
}) {
    const rawStyle = widget?.style || {};


    const cleanStyle = Object.fromEntries(
        Object.entries(rawStyle).filter(
            ([_, value]) =>
                value !== "" &&
                value !== null &&
                value !== undefined
        )
    );

    return (
        <div
            onClick={onClick}
            style={{
                position: "relative",
                boxSizing: "border-box",

                ...(isSelected
                    ? {
                          outline: "2px solid #0F6E56",
                          outlineOffset: "2px",
                      }
                    : {}),

                ...cleanStyle,
            }}
        >
            {/* Badge sélection */}
            {isSelected && (
                <div
                    style={{
                        position: "absolute",
                        top: "-10px",
                        left: "8px",
                        background: "#0F6E56",
                        color: "#fff",
                        fontSize: "10px",
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: "4px",
                        zIndex: 100,
                        letterSpacing: "0.04em",
                    }}
                >
                    CONTENEUR
                </div>
            )}

            {/* Widgets enfants */}
            {children && children.length > 0 ? (
                children
            ) : (
                <div
                    style={{
                        minHeight: "80px",
                        width: "100%",

                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",

                        border: "1px dashed #cbd5e0",
                        borderRadius: "6px",

                        padding: "20px",

                        color: "#a0aec0",
                        fontSize: "12px",
                        textAlign: "center",
                    }}
                >
                    Déposez des widgets ici
                </div>
            )}
        </div>
    );
}
