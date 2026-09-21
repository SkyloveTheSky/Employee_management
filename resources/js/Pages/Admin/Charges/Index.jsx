import { Head, Link, router } from "@inertiajs/react";
import { useMemo, useState } from "react";
import BrandMark from "@/Components/BrandMark";
import HeaderTools from "@/Components/HeaderTools";
import Sidebar from "@/Components/Admin/Sidebar";
import { colors } from "@/config/colors";
import { useSidebar } from "@/hooks/useSidebar";
import { useDateLocale, useT } from "@/i18n";

export default function Index({
    admin,
    period,
    view = "global",
    employees = [],
    global = {},
}) {
    const t = useT();
    const dateLoc = useDateLocale();
    const { isOpen, setIsOpen, offset } = useSidebar();
    const [query, setQuery] = useState("");

    const formatAr = (value) =>
        `${Number(value || 0).toLocaleString(dateLoc, { maximumFractionDigits: 0 })} Ar`;

    const periodLabel = useMemo(() => {
        const [year, month] = String(period || "").split("-");
        if (!year || !month) return "";
        return new Intl.DateTimeFormat(dateLoc, { month: "long", year: "numeric" }).format(
            new Date(Number(year), Number(month) - 1, 1)
        );
    }, [period, dateLoc]);

    const goTo = (next = {}) => {
        router.get(
            route("admin.charges.index"),
            {
                period: next.period ?? period,
                view: next.view ?? view,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    const filtered = employees.filter((row) => {
        const needle = query.trim().toLowerCase();
        if (!needle) return true;
        return `${row.name} ${row.position}`.toLowerCase().includes(needle);
    });

    const rateLabel = `${Number(global.cnaps_employer_rate || 0).toLocaleString(dateLoc, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    })} %`;

    return (
        <>
            <Head title={t("admin.charges.title")} />
            <Sidebar admin={admin} currentPage="admin.charges.index" isOpen={isOpen} setIsOpen={setIsOpen} />
            <div className="app-page" style={{ ...styles.page, marginLeft: offset }}>
                <div className="app-header" style={styles.header}>
                    <BrandMark />
                    <div>
                        <h1 style={styles.title}>{t("admin.charges.title")}</h1>
                        <p style={styles.subtitle}>
                            {t("admin.charges.subtitle")}
                        </p>
                    </div>
                    <HeaderTools />
                </div>

                <div style={styles.toolbar}>
                    <label style={styles.period}>
                        {t("admin.charges.month")}
                        <input
                            type="month"
                            value={period}
                            onChange={(e) => goTo({ period: e.target.value })}
                            style={styles.monthInput}
                        />
                    </label>
                    <div style={styles.tabs}>
                        <button
                            type="button"
                            onClick={() => goTo({ view: "global" })}
                            style={view === "global" ? styles.tabActive : styles.tab}
                        >
                            {t("admin.charges.global")}
                        </button>
                        <button
                            type="button"
                            onClick={() => goTo({ view: "employees" })}
                            style={view === "employees" ? styles.tabActive : styles.tab}
                        >
                            {t("admin.charges.byEmployee")}
                        </button>
                    </div>
                </div>

                {view === "global" ? (
                    <>
                        <div className="app-cards" style={styles.cards}>
                            <div style={styles.stat}>
                                <p style={styles.statLabel}>{t("admin.charges.salaries")}</p>
                                <p style={styles.statValue}>{formatAr(global.gross_total)}</p>
                                <p style={styles.statHint}>
                                    {t("admin.charges.slipsPeriod", { count: global.employee_count || 0, period: periodLabel })}
                                </p>
                            </div>
                            <div style={styles.stat}>
                                <p style={styles.statLabel}>{t("admin.charges.cnapsEmployer")}</p>
                                <p style={styles.statValue}>{formatAr(global.cnaps_employer_total)}</p>
                                <p style={styles.statHint}>{t("admin.charges.cnapsHint", { rate: rateLabel })}</p>
                            </div>
                            <div style={styles.stat}>
                                <p style={styles.statLabel}>{t("admin.charges.employerCharge")}</p>
                                <p style={styles.statValue}>{formatAr(global.employer_charge_total)}</p>
                                <p style={styles.statHint}>{t("admin.charges.salariesPlus")}</p>
                            </div>
                        </div>

                        <div className="app-table-wrap" style={styles.card}>
                            {employees.length === 0 ? (
                                <p style={styles.empty}>{t("admin.charges.empty")}</p>
                            ) : (
                                <table style={styles.table}>
                                    <thead>
                                        <tr>
                                            <th style={styles.th}>{t("admin.charges.label")}</th>
                                            <th style={styles.th}>{t("admin.charges.detail")}</th>
                                            <th style={{ ...styles.th, textAlign: "right" }}>{t("admin.charges.baseGross")}</th>
                                            <th style={{ ...styles.th, textAlign: "right" }}>{t("admin.charges.amount")}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td style={styles.td}>{t("admin.charges.salaries")}</td>
                                            <td style={styles.td}>{t("admin.charges.salariesDetail")}</td>
                                            <td style={{ ...styles.td, textAlign: "right" }}>{formatAr(global.gross_total)}</td>
                                            <td style={{ ...styles.td, textAlign: "right" }}>{formatAr(global.gross_total)}</td>
                                        </tr>
                                        <tr>
                                            <td style={styles.td}>{t("admin.charges.cnapsRow")}</td>
                                            <td style={styles.td}>
                                                {t("admin.charges.cnapsDetail", { rate: rateLabel })}
                                            </td>
                                            <td style={{ ...styles.td, textAlign: "right" }}>{formatAr(global.gross_total)}</td>
                                            <td style={{ ...styles.td, textAlign: "right" }}>
                                                {formatAr(global.cnaps_employer_total)}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ ...styles.td, fontWeight: 700 }}>{t("admin.charges.employerCharge")}</td>
                                            <td style={styles.td}>{t("admin.charges.salariesPlus")}</td>
                                            <td style={styles.td} />
                                            <td style={{ ...styles.td, textAlign: "right", fontWeight: 700 }}>
                                                {formatAr(global.employer_charge_total)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <div style={styles.employeeBar}>
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={t("common.searchEmployee")}
                                style={styles.search}
                            />
                            <div style={styles.totalBox}>
                                <span style={styles.totalLabel}>{t("admin.charges.total", { period: periodLabel })}</span>
                                <strong style={styles.totalValue}>{formatAr(global.employer_charge_total)}</strong>
                            </div>
                        </div>
                        <div className="app-table-wrap" style={styles.card}>
                            {filtered.length === 0 ? (
                                <p style={styles.empty}>
                                    {employees.length === 0
                                        ? t("admin.charges.emptyMonth")
                                        : t("admin.charges.noMatch")}
                                </p>
                            ) : (
                                <table style={styles.table}>
                                    <thead>
                                        <tr>
                                            <th style={styles.th}>{t("common.employee")}</th>
                                            <th style={{ ...styles.th, textAlign: "right" }}>{t("admin.charges.salary")}</th>
                                            <th style={{ ...styles.th, textAlign: "right" }}>{t("admin.charges.employerShare")}</th>
                                            <th style={{ ...styles.th, textAlign: "right" }}>{t("admin.charges.employerCharge")}</th>
                                            <th style={styles.th} />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map((row) => (
                                            <tr key={row.payroll_id}>
                                                <td style={styles.td}>
                                                    <div style={styles.name}>{row.name}</div>
                                                    {row.position ? <div style={styles.notes}>{row.position}</div> : null}
                                                </td>
                                                <td style={{ ...styles.td, textAlign: "right" }}>{formatAr(row.gross_salary)}</td>
                                                <td style={{ ...styles.td, textAlign: "right" }}>
                                                    {formatAr(row.cnaps_employer_amount)}
                                                    <div style={styles.notes}>
                                                        {Number(row.cnaps_employer_rate || 0).toLocaleString(dateLoc, {
                                                            maximumFractionDigits: 2,
                                                        })}{" "}
                                                        %
                                                    </div>
                                                </td>
                                                <td style={{ ...styles.td, textAlign: "right", fontWeight: 700 }}>
                                                    {formatAr(row.employer_charge)}
                                                </td>
                                                <td style={{ ...styles.td, textAlign: "right" }}>
                                                    <Link href={route("admin.payrolls.edit", row.payroll_id)} style={styles.link}>
                                                        {t("admin.charges.payslip")}
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </>
                )}
            </div>
        </>
    );
}

const styles = {
    page: { minHeight: "100vh", background: "var(--color-background)", fontFamily: "system-ui, sans-serif", padding: "24px", transition: "margin-left 0.3s ease" },
    header: { display: "flex", alignItems: "center", gap: "16px", background: "white", padding: "20px 24px", borderRadius: "12px", marginBottom: "24px", border: `1px solid ${colors.border}` },
    title: { fontSize: "18px", fontWeight: "600", color: colors.dark, margin: 0 },
    subtitle: { fontSize: "13px", color: colors.muted, margin: 0 },
    toolbar: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px", marginBottom: "16px" },
    period: { display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600, color: colors.dark },
    monthInput: { padding: "8px 10px", border: `1px solid ${colors.border}`, borderRadius: "8px", fontSize: "13px" },
    tabs: { display: "flex", gap: "8px" },
    tab: {
        border: `1px solid ${colors.border}`,
        background: "white",
        color: colors.dark,
        borderRadius: "8px",
        padding: "8px 14px",
        fontSize: "13px",
        fontWeight: 600,
        cursor: "pointer",
    },
    tabActive: {
        border: "none",
        background: "var(--color-primary)",
        color: "white",
        borderRadius: "8px",
        padding: "8px 14px",
        fontSize: "13px",
        fontWeight: 600,
        cursor: "pointer",
    },
    cards: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "12px", marginBottom: "16px" },
    stat: { background: "white", border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "16px 18px" },
    statLabel: { margin: 0, fontSize: "12px", color: colors.muted, fontWeight: 600 },
    statValue: { margin: "8px 0 4px", fontSize: "22px", fontWeight: 700, color: colors.dark },
    statHint: { margin: 0, fontSize: "12px", color: colors.muted, lineHeight: 1.4 },
    card: { background: "white", borderRadius: "12px", border: `1px solid ${colors.border}`, padding: "8px 0" },
    empty: { margin: 0, padding: "28px 20px", color: colors.muted, fontSize: "14px" },
    table: { width: "100%", borderCollapse: "collapse" },
    th: { textAlign: "left", fontSize: "12px", color: colors.muted, padding: "10px 16px", borderBottom: `1px solid ${colors.border}` },
    td: { fontSize: "13px", color: colors.dark, padding: "12px 16px", borderBottom: `1px solid ${colors.border}`, verticalAlign: "top" },
    name: { fontWeight: 600 },
    notes: { fontSize: "12px", color: colors.muted, marginTop: "4px" },
    employeeBar: { display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", marginBottom: "16px" },
    search: { flex: 1, minWidth: "200px", padding: "10px 12px", border: `1px solid ${colors.border}`, borderRadius: "8px", fontSize: "14px" },
    totalBox: {
        background: "white",
        border: `1px solid ${colors.border}`,
        borderRadius: "10px",
        padding: "8px 14px",
        display: "flex",
        flexDirection: "column",
        minWidth: "160px",
    },
    totalLabel: { fontSize: "12px", color: colors.muted, textTransform: "capitalize" },
    totalValue: { fontSize: "16px", color: colors.dark },
    link: { color: "var(--color-primary)", fontWeight: 600, textDecoration: "none", fontSize: "13px" },
};
