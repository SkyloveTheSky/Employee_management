import { router } from "@inertiajs/react";
import { colors } from "@/config/colors";
import { useLocale, useT } from "@/i18n";

export default function LanguageSwitcher() {
    const locale = useLocale();
    const t = useT();

    const switchTo = (next) => {
        if (next === locale) return;
        router.get(route("locale.update", next), {}, {
            preserveScroll: true,
            preserveState: false,
        });
    };

    return (
        <div role="group" aria-label={t("language.label")} style={styles.wrap}>
            {["fr", "en"].map((code) => {
                const active = locale === code;
                return (
                    <button
                        key={code}
                        type="button"
                        aria-pressed={active}
                        onClick={() => switchTo(code)}
                        style={{
                            ...styles.button,
                            background: active ? "var(--color-primary)" : "transparent",
                            color: active ? "white" : colors.dark,
                        }}
                    >
                        {t(`language.${code}`)}
                    </button>
                );
            })}
        </div>
    );
}

const styles = {
    wrap: {
        display: "inline-flex",
        alignItems: "stretch",
        height: "40px",
        border: `1px solid ${colors.border}`,
        borderRadius: "10px",
        overflow: "hidden",
        background: colors.surface,
        flexShrink: 0,
    },
    button: {
        minWidth: "40px",
        border: "none",
        padding: "0 10px",
        fontSize: "12px",
        fontWeight: 700,
        letterSpacing: "0.04em",
        cursor: "pointer",
        lineHeight: 1,
    },
};
