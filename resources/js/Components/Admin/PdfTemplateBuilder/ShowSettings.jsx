import React from "react";

export default function SettingsPanel({ margins, setMargins }) {
    const marginFields = [
        { key: "top",    label: "Haut" },
        { key: "bottom", label: "Bas" },
        { key: "left",   label: "Gauche" },
        { key: "right",  label: "Droite" },
    ];

    return (
        <>
            <p style={s.panelLabel}>RÉGLAGES PDF</p>
            <div style={s.scroll}>

                {/* Marges */}
                <div style={s.section}>
                    <p style={s.sectionTitle}>Marges (mm)</p>
                    <div style={s.grid}>
                        {marginFields.map(({ key, label }) => (
                            <div key={key} style={s.row}>
                                <label style={s.fieldLabel}>{label}</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="50"
                                    value={margins[key]}
                                    onChange={(e) =>
                                        setMargins({ ...margins, [key]: Number(e.target.value) })
                                    }
                                    style={s.input}
                                />
                                <span style={s.unit}>mm</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Aperçu visuel des marges */}
                <div style={s.section}>
                    <p style={s.sectionTitle}>Aperçu</p>
                    <div style={s.previewOuter}>
                        <div style={{
                            ...s.previewInner,
                            paddingTop:    `${margins.top}px`,
                            paddingBottom: `${margins.bottom}px`,
                            paddingLeft:   `${margins.left}px`,
                            paddingRight:  `${margins.right}px`,
                        }}>
                            <div style={s.previewContent} />
                        </div>
                        {/* Labels */}
                        <span style={{ ...s.marginLabel, top: 2, left: "50%", transform: "translateX(-50%)" }}>
                            {margins.top}mm
                        </span>
                        <span style={{ ...s.marginLabel, bottom: 2, left: "50%", transform: "translateX(-50%)" }}>
                            {margins.bottom}mm
                        </span>
                        <span style={{ ...s.marginLabel, left: 2, top: "50%", transform: "translateY(-50%)" }}>
                            {margins.left}mm
                        </span>
                        <span style={{ ...s.marginLabel, right: 2, top: "50%", transform: "translateY(-50%)" }}>
                            {margins.right}mm
                        </span>
                    </div>
                </div>

            </div>
        </>
    );
}

const s = {
    panelLabel: {
        fontSize: "10px",
        fontWeight: "700",
        color: "#a0aec0",
        letterSpacing: "0.08em",
        padding: "0 16px",
        marginBottom: "8px",
        marginTop: "4px",
    },
    scroll: {
        flex: 1,
        overflowY: "auto",
        padding: "0 0 16px",
    },
    section: {
        padding: "12px 16px",
        borderBottom: "1px solid #e2e8f0",
    },
    sectionTitle: {
        fontSize: "11px",
        fontWeight: "700",
        color: "#4a5568",
        marginBottom: "12px",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
    },
    grid: {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
    },
    row: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },
    fieldLabel: {
        fontSize: "12px",
        color: "#4a5568",
        minWidth: "55px",
    },
    input: {
        width: "60px",
        padding: "6px 8px",
        border: "1px solid #e2e8f0",
        borderRadius: "6px",
        fontSize: "13px",
        textAlign: "center",
        outline: "none",
    },
    unit: {
        fontSize: "11px",
        color: "#a0aec0",
    },
    previewOuter: {
        position: "relative",
        width: "100%",
        height: "120px",
        background: "#e8ecf0",
        borderRadius: "4px",
        overflow: "hidden",
    },
    previewInner: {
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
    },
    previewContent: {
        width: "100%",
        height: "100%",
        background: "#fff",
        borderRadius: "2px",
    },
    marginLabel: {
        position: "absolute",
        fontSize: "9px",
        color: "#0F6E56",
        fontWeight: "600",
        background: "rgba(255,255,255,0.8)",
        padding: "1px 3px",
        borderRadius: "3px",
    },
};
