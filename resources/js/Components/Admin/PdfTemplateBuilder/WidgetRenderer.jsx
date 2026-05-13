import React from "react";
import { WIDGET_TYPES } from "./WidgetManager.jsx";
import Container from "../Widgets/Container";


/**
 * Rend les widgets du template pour l'aperçu PDF
 */
export default function WidgetRenderer({ widgets, data = {} }) {
    const renderWidget = (widget, index) => {
        if (!widget.visible) return null;

        switch (widget.type) {


            case WIDGET_TYPES.ENTREPRISE:
                return (
                    <div key={widget.id ?? `${widget.type}_${index}`} style={{ ...styles.box, ...widget.style }}>
                        <div style={styles.boxTitle}>ENTREPRISE</div>
                        <div style={styles.boxContent}>
                            <p style={styles.line}>
                                <strong>Nom:</strong> {data.company_name || "Entreprise Demo"}
                            </p>
                            <p style={styles.line}>
                                <strong>Propriétaire:</strong> {data.owner_name || "John Doe"}
                            </p>
                            <p style={styles.line}>
                                <strong>NIF:</strong> {data.nif || "---"}
                            </p>
                        </div>
                    </div>
                );
            case WIDGET_TYPES.EMPLOYEE:
                return (
                    <div key={widget.id ?? `${widget.type}_${index}`} style={{ ...styles.box, ...widget.style }}>
                        <div style={styles.boxTitle}>EMPLOYE</div>
                        <div style={styles.boxContent}>
                            <p style={styles.line}>
                                <strong>Nom:</strong> {data.employee_name || "Jean Martin"}
                            </p>
                            <p style={styles.line}>
                                <strong>Poste:</strong> {data.employee_position || "Responsable"}
                            </p>
                            <p style={styles.line}>
                                <strong>Période:</strong> {data.period || "Avril 2026"}
                            </p>
                        </div>
                    </div>
                );

            /* =========================
               CONTAINER (IMPORTANT)
            ========================= */
            case WIDGET_TYPES.CONTAINER:
                return (
                    <Container key={widget.id ?? `${widget.type}_${index}`} style={widget.style}>
                        {(widget.children || []).map((child, childIndex) =>
                            renderWidget(child, childIndex)
                        )}
                    </Container>
                );


            /* =========================
               SPACER
            ========================= */
            case WIDGET_TYPES.SPACER:
                return (
                    <div
                        key={widget.id ?? `${widget.type}_${index}`}
                        style={{ height: widget.height || "10px" }}
                    />
                );

            default:
                return null;
        }
    };

    return <>{widgets.map((w, i) => renderWidget(w, i))}</>;}

/* =========================
   STYLES
========================= */
const styles = {
    box: {
        border: "1px solid #999",
        padding: "8px",
        marginBottom: "10px",
        borderRadius: "0px",
    },
    boxTitle: {
        fontSize: "12px",
        fontWeight: "bold",
        borderBottom: "1px solid #ccc",
        paddingBottom: "3px",
        marginBottom: "5px",
    },
    boxContent: {
        fontSize: "11px",
    },
    line: {
        margin: "2px 0",
    },
    tableContainer: {
        marginBottom: "10px",
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
        fontSize: "10px",
    },
    trHeader: (style) => ({
        backgroundColor: style?.headerBackgroundColor || "#e0e0e0",
    }),
    th: (style) => ({
        border: `1px solid ${style?.headerBorderColor || "#999"}`,
        padding: "4px",
        textAlign: "left",
        fontWeight: "bold",
        backgroundColor: style?.headerBackgroundColor || "#e0e0e0",
    }),
    trBody: (style) => ({
        borderColor: style?.bodyBorderColor || "#999",
    }),
    td: (style) => ({
        border: `1px solid ${style?.bodyBorderColor || "#999"}`,
        padding: "4px",
    }),
    trTotal: (style) => ({
        backgroundColor: style?.backgroundColor || "#f0f0f0",
    }),
    tdTotal: (style) => ({
        border: `1px solid ${style?.bodyBorderColor || "#999"}`,
        padding: "4px",
        backgroundColor: style?.backgroundColor || "#f0f0f0",
    }),
    summaryBox: {
        backgroundColor: "#f9f9f9",
        padding: "10px",
        marginBottom: "10px",
        borderRadius: "4px",
    },
    summaryRow: {
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "5px",
        fontSize: "11px",
    },
};
