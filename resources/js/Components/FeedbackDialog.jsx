import { colors } from "@/config/colors";

export default function FeedbackDialog({
    show = false,
    title = "Enregistrement réussi",
    message = "Les modifications ont bien été enregistrées.",
    confirmLabel = "OK",
    variant = "success",
    onClose,
}) {
    if (!show) return null;

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="feedback-dialog-title"
                style={styles.box}
                onClick={(e) => e.stopPropagation()}
            >
                <h3 id="feedback-dialog-title" style={styles.title}>
                    {title}
                </h3>
                <p style={styles.message}>{message}</p>
                <div style={styles.actions}>
                    <button
                        type="button"
                        style={{
                            ...styles.confirm,
                            background: variant === "error" ? colors.error : "var(--color-primary)",
                        }}
                        onClick={onClose}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

const styles = {
    overlay: {
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2500,
        padding: "16px",
    },
    box: {
        width: "min(420px, 100%)",
        background: "white",
        borderRadius: "12px",
        border: `1px solid ${colors.border}`,
        padding: "22px 24px",
        boxShadow: "0 20px 50px rgba(15, 23, 42, 0.2)",
    },
    title: { margin: 0, fontSize: "17px", fontWeight: 700, color: colors.dark },
    message: { margin: "12px 0 20px", fontSize: "14px", lineHeight: 1.5, color: colors.muted },
    actions: { display: "flex", justifyContent: "flex-end" },
    confirm: {
        border: "none",
        color: "white",
        borderRadius: "8px",
        padding: "8px 16px",
        fontSize: "13px",
        fontWeight: 600,
        cursor: "pointer",
    },
};
