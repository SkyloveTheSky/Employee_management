import { Head, router, useForm, usePage } from "@inertiajs/react";
import { useState } from "react";
import Sidebar from "../../../Components/Admin/Sidebar";
import BrandMark from "@/Components/BrandMark";
import HeaderTools from "@/Components/HeaderTools";
import EmployeePicker from "@/Components/EmployeePicker";
import ScientificCalculator from "@/Components/Admin/ScientificCalculator";
import { useSidebar } from "@/hooks/useSidebar";
import { useDateLocale, useT } from "@/i18n";

export default function Edit({ admin, payroll, employees }) {
    const t = useT();
    const dateLoc = useDateLocale();
    const { flash } = usePage().props;
    const warnings = flash?.payroll_warnings || [];
    const { isOpen, setIsOpen, offset } = useSidebar();
    const [calculatorOpen, setCalculatorOpen] = useState(false);
    const monthYear = `${payroll.period_year}-${String(payroll.period_month).padStart(2, '0')}`;
    const { data, setData, patch, processing, errors } = useForm({
        user_id: payroll.user_id || "",
        period_month_year: monthYear,
        prime_amount: Number(payroll.prime_amount || 0),
        assurance_rate: Number(payroll.assurance_rate || 1),
        payment_method: payroll.payment_method || "virement",
        payment_status: payroll.payment_status || "unpaid",
        paid_at: payroll.paid_at ? String(payroll.paid_at).slice(0, 10) : "",
        notes: payroll.notes || "",
        confirm_anomalies: false,
    });

    const submit = (e) => {
        e.preventDefault();
        patch(route("admin.payrolls.update", payroll.id));
    };

    const formatMonth = (monthYear) => {
        if (!monthYear) return t("common.dash");
        const [year, month] = monthYear.split('-');
        const date = new Date(year, parseInt(month) - 1, 1);
        return new Intl.DateTimeFormat(dateLoc, { month: "long", year: "numeric" }).format(date);
    };

    // Générer une liste de 24 mois (2 ans précédents + mois actuel + 1 futur)
    const generateMonthsList = () => {
        const months = [];
        const today = new Date();

        for (let i = -24; i <= 3; i++) {
            const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const monthYear = `${year}-${month}`;
            const label = formatMonth(monthYear);
            months.push({ value: monthYear, label });
        }

        return months;
    };

    return (
        <>
            <Head title={t("admin.payroll.editTitle")} />
            <Sidebar admin={admin} currentPage="admin.payrolls.index" isOpen={isOpen} setIsOpen={setIsOpen} />
            <div className="app-page" style={{
                ...styles.page,
                marginLeft: offset,
                paddingBottom: calculatorOpen ? "280px" : "24px",
            }}>
                <div className="app-header" style={styles.header}>
                    <BrandMark />
                    <div>
                        <h1 style={styles.title}>{t("admin.payroll.editHeading")}</h1>
                        <p style={styles.subtitle}>{t("admin.payroll.editSubtitle")}</p>
                    </div>
                    <HeaderTools />
                </div>

                <form onSubmit={submit} style={styles.formCard}>
                    <div className="app-grid-3" style={styles.grid}>
                        <div>
                            <label style={styles.label}>{t("common.employee")}</label>
                            <EmployeePicker
                                employees={employees}
                                value={data.user_id}
                                onChange={(userId) => setData("user_id", userId)}
                                placeholder={t("common.searchEmployee")}
                                emptyLabel={t("common.choose")}
                            />
                            {errors.user_id && <p style={styles.error}>{errors.user_id}</p>}
                        </div>
                        <div>
                            <label style={styles.label}>{t("admin.payroll.periodMonthYear")}</label>
                            <select
                                value={data.period_month_year}
                                onChange={(e) => setData("period_month_year", e.target.value)}
                                style={styles.input}
                            >
                                <option value="">{t("admin.payroll.selectMonth")}</option>
                                {generateMonthsList().map((month) => (
                                    <option key={month.value} value={month.value}>
                                        {month.label}
                                    </option>
                                ))}
                            </select>
                            {data.period_month_year && (
                                <p style={{ fontSize: '14px', color: '#666', marginTop: '5px', fontWeight: '500' }}>
                                    {t("admin.payroll.slipFor")} <strong>{formatMonth(data.period_month_year)}</strong>
                                </p>
                            )}
                            {errors.period_month_year && <p style={styles.error}>{errors.period_month_year}</p>}
                            {errors.period_month && <p style={styles.error}>{errors.period_month}</p>}
                            {errors.period_year && <p style={styles.error}>{errors.period_year}</p>}
                        </div>
                        <div>
                            <label style={styles.label}>{t("admin.payroll.bonus")}</label>
                            <input type="number" min="0" step="1" value={data.prime_amount} onChange={(e) => setData("prime_amount", e.target.value)} style={styles.input} />
                            {errors.prime_amount && <p style={styles.error}>{errors.prime_amount}</p>}
                        </div>
                        <div>
                            <label style={styles.label}>{t("admin.payroll.overtimeHours")}</label>
                            <p style={styles.hint}>
                                {t("admin.payroll.overtimeRecalc")}{" "}
                                {Number(payroll.overtime_hours || 0) > 0
                                    ? t("admin.payroll.overtimeCurrent", {
                                        hours: Number(payroll.overtime_hours).toLocaleString(dateLoc),
                                        amount: Number(payroll.overtime_amount || 0).toLocaleString(dateLoc),
                                    })
                                    : t("admin.payroll.overtimeNone")}
                            </p>
                        </div>
                        <div>
                            <label style={styles.label}>{t("admin.payroll.unpaidLeave")}</label>
                            <p style={styles.hint}>
                                {t("admin.payroll.unpaidRecalc")}{" "}
                                {Number(payroll.unpaid_leave_days || 0) > 0
                                    ? t("admin.payroll.unpaidCurrent", {
                                        days: Number(payroll.unpaid_leave_days).toLocaleString(dateLoc),
                                        amount: Number(payroll.unpaid_leave_amount || 0).toLocaleString(dateLoc),
                                    })
                                    : t("admin.payroll.unpaidNone")}
                            </p>
                        </div>
                        <div>
                            <label style={styles.label}>{t("admin.payroll.assurance")}</label>
                            <input type="number" min="0" max="100" step="0.01" value={data.assurance_rate} onChange={(e) => setData("assurance_rate", e.target.value)} style={styles.input} />
                            {errors.assurance_rate && <p style={styles.error}>{errors.assurance_rate}</p>}
                        </div>
                        <div>
                            <label style={styles.label}>{t("admin.payroll.paymentMethod")}</label>
                            <select value={data.payment_method} onChange={(e) => setData("payment_method", e.target.value)} style={styles.input}>
                                <option value="virement">{t("admin.payroll.transfer")}</option>
                                <option value="especes">{t("admin.payroll.cash")}</option>
                                <option value="mobile_money">{t("admin.payroll.mobile")}</option>
                                <option value="cheque">{t("admin.payroll.cheque")}</option>
                                <option value="autre">{t("admin.payroll.other")}</option>
                            </select>
                            {errors.payment_method && <p style={styles.error}>{errors.payment_method}</p>}
                        </div>
                        <div>
                            <label style={styles.label}>{t("admin.payroll.status")}</label>
                            <select
                                value={data.payment_status}
                                onChange={(e) => {
                                    const status = e.target.value;
                                    setData({
                                        ...data,
                                        payment_status: status,
                                        paid_at: status === "paid"
                                            ? (data.paid_at || new Date().toISOString().slice(0, 10))
                                            : "",
                                    });
                                }}
                                style={styles.input}
                            >
                                <option value="unpaid">{t("payrolls.unpaid")}</option>
                                <option value="paid">{t("payrolls.paid")}</option>
                            </select>
                            {errors.payment_status && <p style={styles.error}>{errors.payment_status}</p>}
                        </div>
                        {data.payment_status === "paid" ? (
                            <div>
                                <label style={styles.label}>{t("admin.payroll.paidAt")}</label>
                                <input type="date" value={data.paid_at} onChange={(e) => setData("paid_at", e.target.value)} style={styles.input} />
                                {errors.paid_at && <p style={styles.error}>{errors.paid_at}</p>}
                            </div>
                        ) : (
                            <div>
                                <label style={styles.label}>{t("admin.payroll.paidAt")}</label>
                                <p style={{ margin: 0, fontSize: "13px", color: "#718096" }}>{t("admin.payroll.paidAtHint")}</p>
                            </div>
                        )}
                    </div>

                    {warnings.length > 0 && (
                        <div style={{ background: "#fffaf0", border: "1px solid #f6ad55", borderRadius: "8px", padding: "12px", marginBottom: "14px" }}>
                            <p style={{ margin: "0 0 8px", fontWeight: 600, color: "#9c4221", fontSize: "13px" }}>{t("admin.payroll.anomalyTitleShort")}</p>
                            <ul style={{ margin: "0 0 10px", paddingLeft: "18px", color: "#9c4221", fontSize: "13px" }}>
                                {warnings.map((warning, index) => (
                                    <li key={`${warning.code}-${index}`}>{warning.message}</li>
                                ))}
                            </ul>
                            <label style={{ display: "flex", gap: "8px", fontSize: "13px" }}>
                                <input
                                    type="checkbox"
                                    checked={!!data.confirm_anomalies}
                                    onChange={(e) => setData("confirm_anomalies", e.target.checked)}
                                />
                                {t("admin.payroll.anomalySave")}
                            </label>
                        </div>
                    )}

                    <div style={styles.actions}>
                        <button type="button" style={styles.cancelButton} onClick={() => router.visit(route("admin.payrolls.index"))}>
                            {t("common.cancel")}
                        </button>
                        <button type="submit" style={styles.submitButton} disabled={processing}>
                            {processing ? t("common.updating") : t("common.update")}
                        </button>
                    </div>
                </form>
            </div>

            <div className="app-tools-dock" style={styles.toolsDock}>
                {calculatorOpen ? (
                    <ScientificCalculator onClose={() => setCalculatorOpen(false)} />
                ) : (
                    <button
                        type="button"
                        onClick={() => setCalculatorOpen(true)}
                        style={styles.iconToggle}
                        aria-label={t("admin.payroll.openCalculator")}
                        title={t("admin.payroll.calculator")}
                    >
                        <img src="/assets/icon/calculator.svg" alt="" style={styles.toggleIcon} />
                    </button>
                )}
            </div>
        </>
    );
}

const styles = {
    page: { minHeight: "100vh", background: "var(--color-background)", fontFamily: "system-ui, sans-serif", padding: "24px", transition: "margin-left 0.3s ease" },
    header: { display: "flex", alignItems: "center", gap: "16px", background: "white", padding: "20px 24px", borderRadius: "12px", marginBottom: "24px", border: "1px solid #e2e8f0" },
    logo: { width: "44px", height: "44px", background: "var(--color-primary)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "700", fontSize: "16px", flexShrink: 0 },
    title: { fontSize: "18px", fontWeight: "600", color: "#1a202c", margin: 0 },
    subtitle: { fontSize: "13px", color: "#718096", margin: 0 },
    formCard: { background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "20px" },
    grid: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "12px", marginBottom: "14px" },
    label: { display: "block", fontSize: "12px", marginBottom: "6px", color: "#4a5568" },
    input: { width: "100%", border: "1px solid #cbd5e0", borderRadius: "8px", padding: "9px 10px", fontSize: "13px", boxSizing: "border-box" },
    error: { marginTop: "4px", marginBottom: 0, color: "#e53e3e", fontSize: "12px" },
    hint: { fontSize: "12px", color: "#718096", margin: "6px 0 0" },
    linkBtn: { border: "none", background: "transparent", color: "var(--color-primary)", fontWeight: 600, cursor: "pointer", padding: 0, fontSize: "12px" },
    actions: { display: "flex", gap: "12px", marginTop: "10px" },
    cancelButton: { padding: "10px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "white", cursor: "pointer" },
    submitButton: { background: "var(--color-primary)", color: "white", border: "none", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", cursor: "pointer" },
    toolsDock: {
        position: "fixed",
        bottom: "16px",
        right: "16px",
        zIndex: 1200,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "10px",
    },
    iconToggle: {
        width: "44px",
        height: "44px",
        borderRadius: "999px",
        border: "none",
        background: "#2d3748",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
    },
    toggleIcon: {
        width: "22px",
        height: "22px",
        filter: "invert(1)",
    },
};

