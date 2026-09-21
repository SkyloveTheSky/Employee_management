import { colors } from "@/config/colors";
import { useT } from "@/i18n";

export default function ConfirmDialog({
    show = false,
    title,
    message,
    confirmLabel,
    cancelLabel,
    processing = false,
    onConfirm,
    onClose,
}) {
    const t = useT();
    if (!show) return null;
    const resolvedTitle = title || t("confirm.title");
    const resolvedMessage = message || t("confirm.message");
    const resolvedConfirm = confirmLabel || t("common.delete");
    const resolvedCancel = cancelLabel || t("common.cancel");

    return (
        <div
            style={styles.overlay}
            onClick={() => {
                if (!processing) onClose?.();
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-dialog-title"
                style={styles.box}
                onClick={(e) => e.stopPropagation()}
            >
                <h3 id="confirm-dialog-title" style={styles.title}>
                    {resolvedTitle}
                </h3>
                <p style={styles.message}>{resolvedMessage}</p>
                <div style={styles.actions}>
                    <button type="button" style={styles.cancel} onClick={onClose} disabled={processing}>
                        {resolvedCancel}
                    </button>
                    <button type="button" style={styles.confirm} onClick={onConfirm} disabled={processing}>
                        {processing ? t("common.deleting") : resolvedConfirm}
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
    actions: { display: "flex", justifyContent: "flex-end", gap: "8px" },
    cancel: {
        border: `1px solid ${colors.border}`,
        background: "white",
        color: colors.dark,
        borderRadius: "8px",
        padding: "8px 14px",
        fontSize: "13px",
        fontWeight: 600,
        cursor: "pointer",
    },
    confirm: {
        border: "none",
        background: colors.error,
        color: "white",
        borderRadius: "8px",
        padding: "8px 14px",
        fontSize: "13px",
        fontWeight: 600,
        cursor: "pointer",
    },
};
