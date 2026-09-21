import { Head, Link, usePage } from "@inertiajs/react";
import Sidebar from "@/Components/User/Sidebar";
import BrandMark from "@/Components/BrandMark";
import HeaderTools from "@/Components/HeaderTools";
import { colors } from "@/config/colors";
import { useSidebar } from "@/hooks/useSidebar";
import { useDateLocale, useT } from "@/i18n";

export default function Dashboard({ latestPayroll = null, unpaidCount = 0 }) {
    const t = useT();
    const dateLoc = useDateLocale();
    const { auth } = usePage().props;
    const user = auth?.user;
    const { isOpen, setIsOpen, offset } = useSidebar();

    const formatAr = (value) => `${Number(value || 0).toLocaleString(dateLoc)} Ar`;
    const formatMonth = (payroll) => {
        if (!payroll) return t("common.dash");
        const date = new Date(payroll.period_year, payroll.period_month - 1, 1);
        return new Intl.DateTimeFormat(dateLoc, { month: "long", year: "numeric" }).format(date);
    };

    return (
        <>
            <Head title={t("dashboard.title")} />
            <Sidebar user={user} currentPage="dashboard" isOpen={isOpen} setIsOpen={setIsOpen} />
            <div className="app-page" style={{ ...styles.page, marginLeft: offset }}>
                <div className="app-header" style={styles.header}>
                    <BrandMark />
                    <div>
                        <h1 style={styles.title}>{t("dashboard.title")}</h1>
                        <p style={styles.subtitle}>
                            {t("dashboard.hello", { name: `${user?.first_name || ""} ${user?.last_name || ""}`.trim() })}
                        </p>
                    </div>
                    <HeaderTools />
                </div>

                <div className="app-cards" style={styles.content}>
                    <div style={styles.card}>
                        <p style={styles.cardLabel}>{t("dashboard.position")}</p>
                        <p style={styles.cardValue}>{user?.position || t("common.dash")}</p>
                    </div>
                    <div style={styles.card}>
                        <p style={styles.cardLabel}>{t("dashboard.lastPayslip")}</p>
                        <p style={styles.cardValue}>
                            {latestPayroll
                                ? `${formatMonth(latestPayroll)} · ${formatAr(latestPayroll.net_to_pay)}`
                                : t("dashboard.noPayslip")}
                        </p>
                        {latestPayroll && (
                            <p style={styles.cardHint}>
                                {latestPayroll.payment_status === "paid" ? t("dashboard.paid") : t("dashboard.unpaid")}
                            </p>
                        )}
                    </div>
                    <div style={styles.card}>
                        <p style={styles.cardLabel}>{t("dashboard.unpaidCount")}</p>
                        <p style={styles.cardValue}>{unpaidCount}</p>
                        <Link href={route("payrolls.index")} style={styles.cardLink}>
                            {t("dashboard.viewPayslips")}
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        background: "var(--color-background)",
        fontFamily: "system-ui, sans-serif",
        padding: "24px",
        transition: "margin-left 0.3s ease",
    },
    header: {
        display: "flex",
        alignItems: "center",
        gap: "16px",
        background: colors.surface,
        padding: "20px 24px",
        borderRadius: "12px",
        marginBottom: "24px",
        border: `1px solid ${colors.border}`,
    },
    logo: {
        width: "44px",
        height: "44px",
        background: "var(--color-primary)",
        borderRadius: "10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontWeight: "700",
        fontSize: "16px",
        flexShrink: 0,
    },
    title: {
        fontSize: "18px",
        fontWeight: "600",
        color: colors.dark,
        margin: 0,
    },
    subtitle: {
        fontSize: "13px",
        color: colors.muted,
        margin: 0,
    },
    content: {
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "16px",
    },
    card: {
        background: colors.surface,
        borderRadius: "12px",
        padding: "20px",
        border: `1px solid ${colors.border}`,
    },
    cardLabel: {
        fontSize: "12px",
        color: colors.muted,
        margin: "0 0 6px",
    },
    cardValue: {
        fontSize: "15px",
        fontWeight: "500",
        color: colors.dark,
        margin: 0,
    },
    cardHint: {
        fontSize: "12px",
        color: colors.muted,
        margin: "6px 0 0",
    },
    cardLink: {
        display: "inline-block",
        marginTop: "8px",
        fontSize: "13px",
        color: "var(--color-primary)",
        fontWeight: 600,
        textDecoration: "none",
    },
};
