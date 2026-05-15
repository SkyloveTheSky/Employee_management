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

    /*
    ==================================================
    NOUVELLES PROPRIÉTÉS
    ==================================================

    columns:
        nombre de colonnes

    fullWidth:
        pleine largeur ou encadré

    gap:
        espace entre colonnes

    direction:
        row / column

    */

    const columns = widget?.columns ?? 1;

    const gap = widget?.gap ?? 12;

    const fullWidth = widget?.fullWidth ?? false;

    const direction = widget?.direction ?? "row";

    return (
        <div
            onClick={onClick}
            style={{

                position: "relative",

                boxSizing: "border-box",

                width: fullWidth ? "100%" : "fit-content",

                display: "grid",

                gridTemplateColumns:
                    direction === "column"
                        ? "1fr"
                        : `repeat(${columns}, 1fr)`,

                gap: `${gap}px`,

                padding: cleanStyle.padding ?? "16px",

                border:
                    cleanStyle.border ??
                    (
                        fullWidth
                            ? "none"
                            : "1px solid #d1d5db"
                    ),

                borderRadius:
                    cleanStyle.borderRadius ?? "8px",

                background:
                    cleanStyle.backgroundColor ?? "#ffffff",

                minHeight:
                    cleanStyle.minHeight ?? "100px",

                width:
                    fullWidth
                        ? "100%"
                        : cleanStyle.width ?? "100%",

                transition: "all 0.2s ease",

                ...(isSelected
                    ? {
                        outline: "2px solid #0F6E56",
                        outlineOffset: "2px",
                    }
                    : {}),

                ...cleanStyle,
            }}
        >

            {/* =========================== */}
            {/* BADGE */}
            {/* =========================== */}

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
                    CONTAINER
                </div>
            )}

            {/* =========================== */}
            {/* CONTENU */}
            {/* =========================== */}

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

                        gridColumn:
                            columns > 1
                                ? `span ${columns}`
                                : "span 1",
                    }}
                >
                    Déposez des widgets ici
                </div>
            )}
        </div>
    );
}
