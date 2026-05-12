import React from "react";
import { WIDGET_TYPES } from "./WidgetManager.jsx";
import Container from "../Widgets/Container";

/**
 * Rend les widgets du template pour l'aperçu PDF
 */
export default function WidgetRenderer({ widgets, data = {} }) {
    const renderWidget = (widget) => {
        if (!widget.visible) return null;

        switch (widget.type) {

            /* =========================
               CONTAINER (IMPORTANT)
            ========================= */
            case WIDGET_TYPES.CONTAINER:
                return (
                    <Container key={widget.id} style={widget.style}>
                        {(widget.children || []).map((child) =>
                            renderWidget(child)
                        )}
                    </Container>
                );

            /* =========================
               COMPANY INFO
            ========================= */
            case WIDGET_TYPES.COMPANY_INFO:
                return (
                    <div key={widget.id} style={{ ...styles.box, ...widget.style }}>
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

            /* =========================
               EMPLOYEE INFO
            ========================= */
            case WIDGET_TYPES.EMPLOYEE_INFO:
                return (
                    <div key={widget.id} style={{ ...styles.box, ...widget.style }}>
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
               EARNINGS TABLE
            ========================= */
            case WIDGET_TYPES.EARNINGS_TABLE:
                return (
                    <div key={widget.id} style={styles.tableContainer}>
                        <table style={styles.table}>
                            <thead>
                                <tr style={styles.trHeader(widget.style)}>
                                    <th style={styles.th(widget.style)}>Désignation</th>
                                    <th style={{ ...styles.th(widget.style), textAlign: "right" }}>
                                        Montant (Ar)
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style={styles.trBody(widget.style)}>
                                    <td style={styles.td(widget.style)}>Salaire de base</td>
                                    <td style={{ ...styles.td(widget.style), textAlign: "right" }}>
                                        {data.base_salary || "500 000"}
                                    </td>
                                </tr>

                                {data.prime_amount && (
                                    <tr style={styles.trBody(widget.style)}>
                                        <td style={styles.td(widget.style)}>Prime</td>
                                        <td style={{ ...styles.td(widget.style), textAlign: "right" }}>
                                            {data.prime_amount}
                                        </td>
                                    </tr>
                                )}

                                <tr style={styles.trTotal(widget.style)}>
                                    <td colSpan="2" style={styles.tdTotal(widget.style)}>
                                        <strong>TOTAL GAINS</strong>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                );

            /* =========================
               DEDUCTIONS TABLE
            ========================= */
            case WIDGET_TYPES.DEDUCTIONS_TABLE:
                return (
                    <div key={widget.id} style={styles.tableContainer}>
                        <table style={styles.table}>
                            <thead>
                                <tr style={styles.trHeader(widget.style)}>
                                    <th style={styles.th(widget.style)}>Désignation</th>
                                    <th style={{ ...styles.th(widget.style), textAlign: "right" }}>
                                        Montant (Ar)
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style={styles.trBody(widget.style)}>
                                    <td style={styles.td(widget.style)}>CNAPS</td>
                                    <td style={{ ...styles.td(widget.style), textAlign: "right" }}>
                                        {data.cnaps_amount || "4 600"}
                                    </td>
                                </tr>

                                <tr style={styles.trBody(widget.style)}>
                                    <td style={styles.td(widget.style)}>Assurance</td>
                                    <td style={{ ...styles.td(widget.style), textAlign: "right" }}>
                                        {data.assurance_amount || "4 600"}
                                    </td>
                                </tr>

                                <tr style={styles.trTotal(widget.style)}>
                                    <td colSpan="2" style={styles.tdTotal(widget.style)}>
                                        <strong>TOTAL RETENUE</strong>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                );

            /* =========================
               SUMMARY
            ========================= */
            case WIDGET_TYPES.SUMMARY_BOX:
                return (
                    <div key={widget.id} style={{ ...styles.summaryBox, ...widget.style }}>
                        <div style={styles.summaryRow}>
                            <span>Salaire brut:</span>
                            <strong>{data.gross_salary || "530 000"} Ar</strong>
                        </div>

                        <div style={styles.summaryRow}>
                            <span>Retenues:</span>
                            <strong>{data.total_retenu || "9 200"} Ar</strong>
                        </div>

                        <div style={{ ...styles.summaryRow, fontSize: "12px", fontWeight: "bold" }}>
                            <span>NET À PAYER:</span>
                            <strong>{data.net_to_pay || "520 800"} Ar</strong>
                        </div>
                    </div>
                );

            /* =========================
               PAYMENT INFO
            ========================= */
            case WIDGET_TYPES.PAYMENT_INFO:
                return (
                    <div key={widget.id} style={{ ...styles.box, ...widget.style }}>
                        <div style={styles.boxTitle}>PAIEMENT</div>
                        <div style={styles.boxContent}>
                            <p style={styles.line}>
                                <strong>Mode:</strong> {data.payment_method || "Mobile Money"}
                            </p>
                            <p style={styles.line}>
                                <strong>Statut:</strong> {data.payment_status || "Non payé"}
                            </p>
                            <p style={styles.line}>
                                <strong>Date:</strong> {data.paid_at || "À déterminer"}
                            </p>
                        </div>
                    </div>
                );

            /* =========================
               CUSTOM TEXT
            ========================= */
            case WIDGET_TYPES.CUSTOM_TEXT:
                return (
                    <div key={widget.id} style={widget.style}>
                        {widget.content || "Texte personnalisé"}
                    </div>
                );

            /* =========================
               SPACER
            ========================= */
            case WIDGET_TYPES.SPACER:
                return (
                    <div
                        key={widget.id}
                        style={{ height: widget.height || "10px" }}
                    />
                );

            default:
                return null;
        }
    };

    return <>{widgets.map(renderWidget)}</>;
}

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
