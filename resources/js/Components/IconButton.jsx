const ICONS = {
    add: "/assets/icon/add.svg",
    delete: "/assets/icon/delete.svg",
    edit: "/assets/icon/edit.svg",
    close: "/assets/icon/close.svg",
    less: "/assets/icon/less.svg",
    send: "/assets/icon/send.svg",
};

const VARIANTS = {
    ghost: {
        background: "white",
        border: "1px solid #e2e8f0",
        invert: false,
        color: "#1a202c",
    },
    primary: {
        background: "var(--color-primary)",
        border: "1px solid transparent",
        invert: true,
        color: "white",
    },
    muted: {
        background: "#6c757d",
        border: "1px solid transparent",
        invert: true,
        color: "white",
    },
    danger: {
        background: "#dc3545",
        border: "1px solid transparent",
        invert: true,
        color: "white",
    },
};

export default function IconButton({
    icon,
    label,
    variant = "ghost",
    size = 32,
    iconSize = 16,
    showLabel = false,
    disabled = false,
    type = "button",
    style,
    ...props
}) {
    const look = VARIANTS[variant] || VARIANTS.ghost;

    return (
        <button
            type={type}
            aria-label={label}
            title={label}
            disabled={disabled}
            style={{
                width: showLabel ? "auto" : size,
                height: size,
                minWidth: size,
                minHeight: size,
                padding: showLabel ? "0 12px" : 0,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: showLabel ? "8px" : 0,
                background: look.background,
                border: look.border,
                borderRadius: "8px",
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.4 : 1,
                flexShrink: 0,
                color: look.color,
                fontSize: "13px",
                fontWeight: 600,
                fontFamily: "inherit",
                whiteSpace: "nowrap",
                ...style,
            }}
            {...props}
        >
            <img
                src={ICONS[icon]}
                alt=""
                style={{
                    width: iconSize,
                    height: iconSize,
                    display: "block",
                    filter: look.invert ? "brightness(0) invert(1)" : "none",
                    pointerEvents: "none",
                }}
            />
            {showLabel ? <span>{label}</span> : null}
        </button>
    );
}
