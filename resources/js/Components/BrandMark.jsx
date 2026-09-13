import { usePage } from "@inertiajs/react";

export default function BrandMark({ size = 44, layout = "square" }) {
    const { company } = usePage().props;

    if (layout === "banner" && company?.logo_url) {
        return (
            <img
                src={company.logo_url}
                alt={company.name || "Logo"}
                style={{
                    height: size,
                    width: "auto",
                    maxWidth: Math.round(size * 2.4),
                    objectFit: "contain",
                    display: "block",
                    margin: "0 auto",
                }}
            />
        );
    }

    const box = {
        width: size,
        height: size,
        borderRadius: "10px",
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-primary)",
        color: "white",
        fontWeight: "700",
        fontSize: Math.round(size * 0.36),
        overflow: "hidden",
    };

    if (company?.logo_url) {
        return (
            <img
                src={company.logo_url}
                alt={company.name || "Logo"}
                style={{ ...box, background: "white", objectFit: "contain", padding: "4px", boxSizing: "border-box" }}
            />
        );
    }

    return <div style={box}>RH</div>;
}
