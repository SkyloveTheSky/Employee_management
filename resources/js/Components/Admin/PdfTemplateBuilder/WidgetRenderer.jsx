import React from "react";
import { WIDGET_TYPES } from "./WidgetManager.jsx";
import Container from "../Widgets/Container.jsx";

export default function WidgetRenderer({ widget, data = {} }) {

    const renderWidget = (w, index = 0) => {
        if (!w || !w.visible) return null;

        switch (w.type) {

            case WIDGET_TYPES.ENTREPRISE:
                return (
                    <div style={{ ...styles.box, ...w.style }}>
                        <div style={styles.boxTitle}>ENTREPRISE</div>
                        <div style={styles.boxContent}>
                            <p style={styles.line}><strong>Nom:</strong> {data.company_name || "Entreprise Demo"}</p>
                            <p style={styles.line}><strong>Propriétaire:</strong> {data.owner_name || "John Doe"}</p>
                            <p style={styles.line}><strong>NIF:</strong> {data.nif || "---"}</p>
                            <p style={styles.line}><strong>STAT:</strong> {data.stat || "---"}</p>
                            <p style={styles.line}><strong>RCS:</strong> {data.rcs || "---"}</p>
                        </div>
                    </div>
                );

            case WIDGET_TYPES.EMPLOYEE:
                return (
                    <div style={{ ...styles.box, ...w.style }}>
                        <div style={styles.boxTitle}>EMPLOYÉ</div>
                        <div style={styles.boxContent}>
                            <p style={styles.line}><strong>Nom:</strong> {data.employee_name || "Jean Martin"}</p>
                            <p style={styles.line}><strong>Poste:</strong> {data.employee_position || "Responsable"}</p>
                            <p style={styles.line}><strong>Période:</strong> {data.period || "04/2026"}</p>
                        </div>
                    </div>
                );

            case WIDGET_TYPES.CONTAINER:
                return (
                    <Container style={w.style}>
                        {(w.children || []).map((child, childIndex) => (
                            <React.Fragment key={child.id ?? `${child.type}_${childIndex}`}>
                                {renderWidget(child, childIndex)}
                            </React.Fragment>
                        ))}
                    </Container>
                );

            case WIDGET_TYPES.SPACER:
                return <div style={{ height: w.height || "10px" }} />;

            default:
                return null;
        }
    };

    return renderWidget(widget, 0);
}

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
};
