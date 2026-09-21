import { Head, router, useForm, usePage } from "@inertiajs/react";
import { Fragment, useState } from "react";
import axios from "axios";
import Sidebar from "../../../Components/Admin/Sidebar";
import BrandMark from "@/Components/BrandMark";
import ConfirmDialog from "@/Components/ConfirmDialog";
import HeaderTools from "@/Components/HeaderTools";
import IconButton from "@/Components/IconButton";
import EmployeePicker from "@/Components/EmployeePicker";
import ScientificCalculator from "@/Components/Admin/ScientificCalculator";
import { useSidebar } from "@/hooks/useSidebar";
import { monthShortLabels, useDateLocale, useLocale, useT } from "@/i18n";

export default function Index({ admin, payrolls, employees, filters = {}, covered_periods = {} }) {
    const t = useT();
    const locale = useLocale();
    const dateLoc = useDateLocale();
    const { flash } = usePage().props;
    const warnings = flash?.payroll_warnings || [];
    const { isOpen, setIsOpen, offset } = useSidebar();
    const [expandedId, setExpandedId] = useState(null);
    const [question, setQuestion] = useState("");
    const [assistant, setAssistant] = useState(null);
    const [asking, setAsking] = useState(false);
    const [assistantOpen, setAssistantOpen] = useState(false);
    const [assistantGreeted, setAssistantGreeted] = useState(false);
    const [calculatorOpen, setCalculatorOpen] = useState(false);
    const [pendingDelete, setPendingDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const [pickerYear, setPickerYear] = useState(currentYear);
    const assistantWelcome = {
        reply: t("admin.payroll.assistantWelcome"),
        actions: [],
    };

    const openAssistant = () => {
        setAssistantOpen(true);
        if (!assistantGreeted) {
            setAssistant(assistantWelcome);
            setAssistantGreeted(true);
        }
    };
    const currentMonth = String(currentYear).padStart(4, '0') + '-' +
                         String(currentDate.getMonth() + 1).padStart(2, '0');
    const pickerMonthLabels = monthShortLabels(locale);
    const payrollItems = payrolls?.data ?? [];
    const payrollLinks = payrolls?.links ?? payrolls?.meta?.links ?? [];
    const payrollTotal = payrolls?.total ?? payrolls?.meta?.total ?? 0;
    const payrollFrom = payrolls?.from ?? payrolls?.meta?.from;
    const payrollTo = payrolls?.to ?? payrolls?.meta?.to;
    const payrollLastPage = payrolls?.last_page ?? payrolls?.meta?.last_page ?? 1;

    const { data, setData, post, processing, errors, reset } = useForm({
        user_id: "",
        period_month_years: [currentMonth],
        prime_amount: 0,
        assurance_rate: 1,
        payment_method: "virement",
        payment_status: "unpaid",
        paid_at: "",
        notes: "",
        confirm_anomalies: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("admin.payrolls.store"), {
            onSuccess: () => reset("prime_amount", "assurance_rate", "paid_at", "notes", "user_id"),
        });
    };

    const formatAr = (value) => `${Number(value || 0).toLocaleString(dateLoc)} Ar`;
    const formatDate = (value) => {
        if (!value) return t("common.dash");
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return t("common.dash");
        return new Intl.DateTimeFormat(dateLoc, { day: "2-digit", month: "long", year: "numeric" }).format(date);
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

    const monthsList = generateMonthsList();
    const coveredMonths = new Set(
        covered_periods[data.user_id] || covered_periods[String(data.user_id)] || []
    );

    const selectEmployee = (userId) => {
        const covered = new Set(covered_periods[userId] || covered_periods[String(userId)] || []);
        const nextPeriods = (data.period_month_years || []).filter((month) => !covered.has(month));
        setData({ ...data, user_id: userId, period_month_years: nextPeriods });
    };

    const toggleMonth = (value) => {
        if (coveredMonths.has(value)) {
            return;
        }
        const selected = data.period_month_years || [];
        if (selected.includes(value)) {
            setData("period_month_years", selected.filter((month) => month !== value));
            return;
        }
        setData("period_month_years", [...selected, value]);
    };

    const askAssistant = async (e) => {
        e.preventDefault();
        if (!question.trim()) return;
        setAsking(true);
        try {
            const csrf = decodeURIComponent((document.cookie.match(/XSRF-TOKEN=([^;]+)/) || [])[1] || "");
            const response = await axios.post(route("admin.payrolls.assistant"), { message: question }, {
                headers: { "X-XSRF-TOKEN": csrf },
            });
            setAssistant(response.data);
        } catch (error) {
            setAssistant({
                reply: error.response?.data?.message || t("admin.payroll.assistantError"),
                actions: [],
            });
        } finally {
            setAsking(false);
        }
    };

    const runAssistantAction = (action) => {
        if (action.type === "filter_unpaid") {
            applyFilters({ period: action.period, filter_status: "unpaid" });
            return;
        }
        if (action.type === "generate_missing") {
            if (confirm(t("admin.payroll.assistantConfirm", { label: action.label }))) {
                router.post(route("admin.payrolls.generate-missing"), {
                    period: action.period,
                    user_ids: action.user_ids,
                }, { preserveScroll: true });
            }
        }
    };

    const applyFilters = (next) => {
        router.get(route("admin.payrolls.index"), {
            period: next.period ?? filters.period ?? currentMonth,
            filter_user_id: next.filter_user_id ?? filters.filter_user_id ?? "",
            filter_status: next.filter_status ?? filters.filter_status ?? "all",
        }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const buildLines = (payroll) => {
        const rows = [
            { designation: t("admin.payroll.baseSalary"), base: payroll.base_salary, taux: t("common.dash"), gain: payroll.base_salary, retenu: 0 },
            { designation: t("admin.payroll.bonusLine"), base: payroll.base_salary, taux: t("common.dash"), gain: payroll.prime_amount || 0, retenu: 0 },
        ];
        const otLines = Array.isArray(payroll.overtime_lines) ? payroll.overtime_lines : [];
        if (otLines.length > 0) {
            otLines.forEach((line) => {
                const hours = Number(line.hours || 0);
                const premium = Number(line.premium ?? 0);
                rows.push({
                    designation: `${line.label || t("admin.payroll.overtime")} (${hours.toLocaleString(dateLoc)} h)`,
                    base: payroll.base_salary,
                    taux: `+${premium.toLocaleString(dateLoc)} %`,
                    gain: line.amount || 0,
                    retenu: 0,
                });
            });
        } else if (Number(payroll.overtime_amount || 0) > 0 || Number(payroll.overtime_hours || 0) > 0) {
            const hours = Number(payroll.overtime_hours || 0);
            const coeff = Number(payroll.overtime_coefficient || 0);
            const premium = coeff > 0 ? Math.round((coeff - 1) * 1000) / 10 : 30;
            rows.push({
                designation: `${t("admin.payroll.overtime")} (${hours.toLocaleString(dateLoc)} h)`,
                base: payroll.base_salary,
                taux: `+${premium} %`,
                gain: payroll.overtime_amount || 0,
                retenu: 0,
            });
        }
        rows.push(
            { designation: "CNAPS", base: payroll.gross_salary, taux: `${Number(payroll.cnaps_rate || 0).toFixed(2)}%`, gain: 0, retenu: payroll.cnaps_amount || 0 },
            { designation: "Assurance", base: payroll.gross_salary, taux: `${Number(payroll.assurance_rate || 0).toFixed(2)}%`, gain: 0, retenu: payroll.assurance_amount || 0 },
            { designation: "IRSA", base: Math.max(0, Number(payroll.gross_salary || 0) - Number(payroll.cnaps_amount || 0)), taux: t("admin.payroll.scale"), gain: 0, retenu: payroll.irsa_amount || 0 },
        );
        return rows.map((row, index) => ({ ...row, numero: index + 1 }));
    };

    return (
        <>
            <Head title={t("admin.payroll.title")} />
            <Sidebar admin={admin} currentPage="admin.payrolls.index" isOpen={isOpen} setIsOpen={setIsOpen} />
            <div className="app-page" style={{
                ...styles.page,
                marginLeft: offset,
                paddingBottom: assistantOpen || calculatorOpen ? "280px" : "24px",
            }}>
                <div className="app-header" style={styles.header}>
                    <BrandMark />
                    <div>
                        <h1 style={styles.title}>{t("admin.payroll.heading")}</h1>
                        <p style={styles.subtitle}>{t("admin.payroll.subtitle")}</p>
                    </div>
                    <HeaderTools />
                </div>

                {flash?.success && <p style={styles.success}>{flash.success}</p>}

                <form onSubmit={submit} style={styles.formCard}>
                    <h2 style={styles.sectionTitle}>{t("admin.payroll.generateTitle")}</h2>
                    <div style={styles.employeeBlock}>
                        <label style={styles.label}>{t("common.employee")}</label>
                        <EmployeePicker
                            employees={employees}
                            value={data.user_id}
                            onChange={selectEmployee}
                            placeholder={t("common.searchEmployee")}
                            emptyLabel={t("common.choose")}
                            formatOption={(employee) => `${employee.first_name} ${employee.last_name} (${formatAr(employee.salary_base)})`}
                        />
                        {errors.user_id && <p style={styles.error}>{errors.user_id}</p>}
                    </div>

                    <div style={styles.periodBlock}>
                        <label style={styles.label}>{t("admin.payroll.periods")}</label>
                        <div style={styles.yearNav}>
                            <button
                                type="button"
                                style={styles.navBtn}
                                onClick={() => setPickerYear((year) => year - 1)}
                                aria-label={t("common.previousYear")}
                            >
                                ←
                            </button>
                            <p style={styles.yearTitle}>{pickerYear}</p>
                            <button
                                type="button"
                                style={styles.navBtn}
                                onClick={() => setPickerYear((year) => year + 1)}
                                aria-label={t("common.nextYear")}
                            >
                                →
                            </button>
                            {pickerYear !== currentYear && (
                                <button type="button" style={styles.yearNowBtn} onClick={() => setPickerYear(currentYear)}>
                                    {t("common.currentYear")}
                                </button>
                            )}
                        </div>
                        <div className="app-month-grid" style={styles.monthGrid}>
                            {pickerMonthLabels.map((label, index) => {
                                const value = `${pickerYear}-${String(index + 1).padStart(2, "0")}`;
                                const exists = coveredMonths.has(value);
                                const selected = !exists && (data.period_month_years || []).includes(value);
                                const isCurrent = value === currentMonth;
                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        disabled={exists}
                                        title={exists ? t("admin.payroll.alreadyCreated") : undefined}
                                        onClick={() => toggleMonth(value)}
                                        style={{
                                            ...styles.monthBtn,
                                            ...(isCurrent && !exists ? styles.monthBtnCurrent : {}),
                                            ...(selected ? styles.monthBtnSelected : {}),
                                            ...(exists ? styles.monthBtnExists : {}),
                                        }}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                        {(data.period_month_years || []).length > 0 && (
                            <p style={styles.periodSummary}>
                                {t("admin.payroll.slipCount", { count: (data.period_month_years || []).length })}{" "}
                                <strong>
                                    {(data.period_month_years || [])
                                        .slice()
                                        .sort()
                                        .map(formatMonth)
                                        .join(", ")}
                                </strong>
                            </p>
                        )}
                        {errors.period_month_years && <p style={styles.error}>{errors.period_month_years}</p>}
                        {errors["period_month_years.0"] && <p style={styles.error}>{errors["period_month_years.0"]}</p>}
                    </div>

                    <div className="app-grid-3" style={styles.grid}>
                        <div>
                            <label style={styles.label}>{t("admin.payroll.bonus")}</label>
                            <input type="number" min="0" step="1" value={data.prime_amount} onChange={(e) => setData("prime_amount", e.target.value)} style={styles.input} />
                            {errors.prime_amount && <p style={styles.error}>{errors.prime_amount}</p>}
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
                    </div>

                    <p style={{ fontSize: "12px", color: "#718096", margin: "0 0 14px" }}>
                        {t("admin.payroll.otHint")}
                    </p>

                    {warnings.length > 0 && (
                        <div style={styles.warningBox}>
                            <p style={styles.warningTitle}>{t("admin.payroll.anomalyTitle")}</p>
                            <ul style={styles.warningList}>
                                {warnings.map((warning, index) => (
                                    <li key={`${warning.code}-${index}`}>{warning.message}</li>
                                ))}
                            </ul>
                            <label style={styles.monthItem}>
                                <input
                                    type="checkbox"
                                    checked={!!data.confirm_anomalies}
                                    onChange={(e) => setData("confirm_anomalies", e.target.checked)}
                                />
                                {t("admin.payroll.anomalyConfirm")}
                            </label>
                        </div>
                    )}

                    <button type="submit" disabled={processing || (data.period_month_years || []).length === 0} style={styles.button}>
                        {processing
                            ? t("admin.payroll.generating")
                            : (data.period_month_years || []).length > 1
                                ? t("admin.payroll.generateMany", { count: (data.period_month_years || []).length })
                                : t("admin.payroll.generate")}
                    </button>
                </form>

                <div className="app-table-wrap" style={styles.tableContainer}>
                    <h2 style={styles.sectionTitle}>{t("admin.payroll.tracking")}</h2>
                    <div className="app-filter-grid" style={styles.filterGrid}>
                        <div>
                            <label style={styles.label}>{t("admin.payroll.period")}</label>
                            <select
                                value={filters.period ?? currentMonth}
                                onChange={(e) => applyFilters({ period: e.target.value })}
                                style={styles.input}
                            >
                                <option value="">{t("admin.payroll.allPeriods")}</option>
                                {monthsList.map((month) => (
                                    <option key={month.value} value={month.value}>{month.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={styles.label}>{t("common.employee")}</label>
                            <EmployeePicker
                                employees={employees}
                                value={filters.filter_user_id ?? ""}
                                onChange={(userId) => applyFilters({ filter_user_id: userId })}
                                placeholder={t("common.searchEmployee")}
                                emptyLabel={t("admin.payroll.allEmployees")}
                            />
                        </div>
                        <div>
                            <label style={styles.label}>{t("admin.payroll.status")}</label>
                            <select
                                value={filters.filter_status ?? "all"}
                                onChange={(e) => applyFilters({ filter_status: e.target.value })}
                                style={styles.input}
                            >
                                <option value="all">{t("common.all")}</option>
                                <option value="paid">{t("payrolls.paid")}</option>
                                <option value="unpaid">{t("payrolls.unpaid")}</option>
                            </select>
                        </div>
                    </div>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}></th>
                                <th style={styles.th}>{t("common.employee")}</th>
                                <th style={styles.th}>{t("admin.payroll.period")}</th>
                                <th style={styles.th}>{t("admin.payroll.net")}</th>
                                <th style={styles.th}>{t("admin.payroll.status")}</th>
                                <th style={styles.th}>{t("common.actions")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payrollItems.length > 0 ? (
                                payrollItems.map((payroll) => (
                                    <Fragment key={payroll.id}>
                                        <tr>
                                            <td style={styles.td}>
                                                <button
                                                    type="button"
                                                    onClick={() => setExpandedId(expandedId === payroll.id ? null : payroll.id)}
                                                    style={styles.detailToggle}
                                                >
                                                    {expandedId === payroll.id ? "▾" : "▸"}
                                                </button>
                                            </td>
                                            <td style={styles.td}>{payroll.user?.first_name} {payroll.user?.last_name}</td>
                                            <td style={styles.td}>{formatMonth(`${payroll.period_year}-${String(payroll.period_month).padStart(2, "0")}`)}</td>
                                            <td style={{ ...styles.td, fontWeight: 600 }}>{formatAr(payroll.net_to_pay)}</td>
                                            <td style={styles.td}>
                                                <span style={payroll.payment_status === "paid" ? styles.paidBadge : styles.unpaidBadge}>
                                                    {payroll.payment_status === "paid" ? t("payrolls.paid") : t("payrolls.unpaid")}
                                                </span>
                                            </td>
                                            <td style={styles.actionsCell}>
                                                <button
                                                    onClick={() => {
                                                        const nextStatus = payroll.payment_status === "paid" ? "unpaid" : "paid";
                                                        router.patch(route("admin.payrolls.payment", payroll.id), {
                                                            payment_status: nextStatus,
                                                        }, { preserveScroll: true });
                                                    }}
                                                    style={payroll.payment_status === "paid" ? styles.unpayButton : styles.payButton}
                                                >
                                                    {payroll.payment_status === "paid" ? t("admin.payroll.markUnpaid") : t("admin.payroll.markPaid")}
                                                </button>
                                                <IconButton
                                                    icon="edit"
                                                    label={t("common.edit")}
                                                    variant="muted"
                                                    onClick={() => router.visit(route("admin.payrolls.edit", payroll.id))}
                                                />
                                                <button onClick={() => window.open(route("admin.payrolls.pdf", payroll.id), "_blank")} style={styles.pdfButton}>PDF</button>
                                                <IconButton
                                                    icon="delete"
                                                    label={t("common.delete")}
                                                    variant="danger"
                                                    onClick={() => setPendingDelete(payroll)}
                                                />
                                            </td>
                                        </tr>
                                        {expandedId === payroll.id && (
                                            <tr>
                                                <td style={styles.td} colSpan="6">
                                                    <table style={styles.innerTable}>
                                                        <thead>
                                                            <tr>
                                                                <th style={styles.innerTh}>{t("admin.payroll.number")}</th>
                                                                <th style={styles.innerTh}>{t("admin.payroll.designation")}</th>
                                                                <th style={styles.innerTh}>{t("admin.payroll.base")}</th>
                                                                <th style={styles.innerTh}>{t("admin.payroll.rate")}</th>
                                                                <th style={styles.innerTh}>{t("admin.payroll.gain")}</th>
                                                                <th style={styles.innerTh}>{t("admin.payroll.withheld")}</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {buildLines(payroll).map((line) => (
                                                                <tr key={`${payroll.id}-${line.numero}`}>
                                                                    <td style={styles.innerTd}>{line.numero}</td>
                                                                    <td style={styles.innerTd}>{line.designation}</td>
                                                                    <td style={styles.innerTd}>{formatAr(line.base)}</td>
                                                                    <td style={styles.innerTd}>{line.taux}</td>
                                                                    <td style={styles.innerTd}>{formatAr(line.gain)}</td>
                                                                    <td style={styles.innerTd}>{formatAr(line.retenu)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" style={{ ...styles.td, textAlign: "center" }}>{t("admin.payroll.empty")}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    {payrollLastPage > 1 && (
                        <div style={styles.pagination}>
                            {payrollLinks.map((link, index) => (
                                <button
                                    key={`${link.label}-${index}`}
                                    type="button"
                                    disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url, {}, { preserveState: true, preserveScroll: true })}
                                    style={link.active ? styles.pageActive : styles.pageBtn}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                    {payrollTotal > 0 && (
                        <p style={styles.pageInfo}>
                            {payrollFrom}–{payrollTo} {t("common.of")} {payrollTotal}
                        </p>
                    )}
                </div>
            </div>

            <div className="app-tools-dock" style={styles.toolsDock}>
                {calculatorOpen && (
                    <ScientificCalculator onClose={() => setCalculatorOpen(false)} />
                )}
                {assistantOpen && (
                    <div style={styles.floatBar}>
                        <div style={styles.floatHeader}>
                            <img src="/assets/icon/bot.svg" alt="" style={styles.headerBotIcon} />
                            <button
                                type="button"
                                style={styles.floatClose}
                                onClick={() => setAssistantOpen(false)}
                            >
                                {t("common.close")}
                            </button>
                        </div>
                        {assistant?.reply && (
                            <div style={styles.floatReply}>
                                <p style={styles.assistantReply}>{assistant.reply}</p>
                                {(assistant.actions || []).map((action) => (
                                    <button key={action.label} type="button" style={styles.suggestButton} onClick={() => runAssistantAction(action)}>
                                        {action.label}
                                    </button>
                                ))}
                            </div>
                        )}
                        <form onSubmit={askAssistant} style={styles.assistantRow}>
                            <input
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                placeholder={t("admin.payroll.assistantPlaceholder")}
                                style={styles.floatInput}
                            />
                            <button type="submit" disabled={asking} style={styles.button}>{asking ? t("admin.payroll.asking") : t("admin.payroll.ask")}</button>
                        </form>
                    </div>
                )}
                {(!calculatorOpen || !assistantOpen) && (
                    <div style={styles.floatToggles}>
                        {!calculatorOpen && (
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
                        {!assistantOpen && (
                            <button
                                type="button"
                                onClick={openAssistant}
                                style={styles.iconToggle}
                                aria-label={t("admin.payroll.openAssistant")}
                                title={t("admin.payroll.assistant")}
                            >
                                <img src="/assets/icon/bot.svg" alt="" style={styles.toggleIcon} />
                            </button>
                        )}
                    </div>
                )}
            </div>
            <ConfirmDialog
                show={!!pendingDelete}
                title={t("admin.payroll.deleteTitle")}
                message={t("admin.payroll.deleteBody")}
                processing={deleting}
                onConfirm={() => {
                    if (!pendingDelete) return;
                    setDeleting(true);
                    router.delete(route("admin.payrolls.delete", pendingDelete.id), {
                        preserveScroll: true,
                        onFinish: () => {
                            setDeleting(false);
                            setPendingDelete(null);
                        },
                    });
                }}
                onClose={() => !deleting && setPendingDelete(null)}
            />
        </>
    );
}

const styles = {
    page: { minHeight: "100vh", background: "var(--color-background)", fontFamily: "system-ui, sans-serif", padding: "24px", transition: "margin-left 0.3s ease" },
    header: { display: "flex", alignItems: "center", gap: "16px", background: "white", padding: "20px 24px", borderRadius: "12px", marginBottom: "24px", border: "1px solid #e2e8f0" },
    logo: { width: "44px", height: "44px", background: "var(--color-primary)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "700", fontSize: "16px", flexShrink: 0 },
    title: { fontSize: "18px", fontWeight: "600", color: "#1a202c", margin: 0 },
    subtitle: { fontSize: "13px", color: "#718096", margin: 0 },
    formCard: { background: "white", borderRadius: "12px", marginBottom: "24px", border: "1px solid #e2e8f0", padding: "20px" },
    assistantRow: { display: "flex", gap: "8px", alignItems: "center" },
    assistantReply: { margin: "0 0 8px", fontSize: "13px", color: "#e2e8f0", lineHeight: 1.45 },
    suggestButton: { marginRight: "8px", marginTop: "4px", padding: "6px 10px", background: "#2d3748", color: "white", border: "1px solid #4a5568", borderRadius: "8px", cursor: "pointer", fontSize: "12px" },
    floatBar: {
        background: "#1a202c",
        border: "1px solid #2d3748",
        borderRadius: "12px",
        padding: "12px 14px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        width: "min(520px, calc(100vw - 48px))",
    },
    toolsDock: {
        position: "fixed",
        bottom: "16px",
        right: "16px",
        zIndex: 1200,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "10px",
        maxWidth: "min(520px, calc(100vw - 32px))",
    },
    floatToggles: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "8px",
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
    headerBotIcon: { width: "22px", height: "22px", filter: "invert(1)" },
    floatHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" },
    floatClose: { background: "transparent", color: "#a0aec0", border: "1px solid #4a5568", borderRadius: "6px", padding: "4px 8px", fontSize: "12px", cursor: "pointer" },
    floatInput: { flex: 1, border: "1px solid #4a5568", background: "#2d3748", color: "white", borderRadius: "8px", padding: "9px 10px", fontSize: "13px", boxSizing: "border-box" },
    floatReply: { marginBottom: "10px", paddingBottom: "10px", borderBottom: "1px solid #2d3748" },
    success: { background: "#c6f6d5", color: "#276749", padding: "10px 14px", borderRadius: "8px", marginBottom: "16px" },
    warningBox: { background: "#fffaf0", border: "1px solid #f6ad55", borderRadius: "8px", padding: "12px", marginBottom: "14px" },
    warningTitle: { margin: "0 0 8px", fontWeight: 600, color: "#9c4221", fontSize: "13px" },
    warningList: { margin: "0 0 10px", paddingLeft: "18px", color: "#9c4221", fontSize: "13px" },
    sectionTitle: { fontSize: "16px", fontWeight: 600, color: "#1a202c", margin: "0 0 16px" },
    grid: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "12px", marginBottom: "14px" },
    employeeBlock: { marginBottom: "14px", maxWidth: "420px" },
    label: { display: "block", fontSize: "12px", marginBottom: "6px", color: "#4a5568" },
    input: { width: "100%", border: "1px solid #cbd5e0", borderRadius: "8px", padding: "9px 10px", fontSize: "13px", boxSizing: "border-box" },
    button: { background: "var(--color-primary)", color: "white", border: "none", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", cursor: "pointer" },
    error: { marginTop: "4px", marginBottom: 0, color: "#e53e3e", fontSize: "12px" },
    periodBlock: { marginBottom: "14px" },
    yearNav: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", flexWrap: "wrap" },
    navBtn: { width: "36px", height: "36px", border: "1px solid #e2e8f0", background: "white", borderRadius: "8px", cursor: "pointer", fontSize: "16px" },
    yearTitle: { margin: 0, minWidth: "64px", textAlign: "center", fontSize: "16px", fontWeight: 600, color: "#1a202c" },
    yearNowBtn: { padding: "8px 12px", border: "none", background: "var(--color-primary)", color: "white", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer" },
    monthGrid: { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "6px" },
    monthBtn: { border: "1px solid #cbd5e0", background: "white", borderRadius: "8px", padding: "10px 8px", fontSize: "13px", color: "#2d3748", cursor: "pointer", fontFamily: "inherit" },
    monthBtnCurrent: { borderColor: "var(--color-primary)" },
    monthBtnSelected: { background: "var(--color-primary)", color: "white", borderColor: "var(--color-primary)", fontWeight: 600 },
    monthBtnExists: { background: "#edf2f7", color: "#a0aec0", borderColor: "#e2e8f0", cursor: "not-allowed" },
    periodSummary: { fontSize: "13px", color: "#4a5568", margin: "8px 0 0" },
    monthItem: { display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#2d3748", cursor: "pointer" },
    tableContainer: { background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "auto", padding: "20px" },
    filterGrid: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "12px", marginBottom: "16px" },
    table: { width: "100%", borderCollapse: "collapse", fontSize: "14px" },
    th: { background: "#f7fafc", padding: "12px 16px", textAlign: "left", fontWeight: "600", color: "#1a202c", borderBottom: "1px solid #e2e8f0" },
    td: { padding: "12px 16px", color: "#4a5568", borderBottom: "1px solid #e2e8f0" },
    actionsCell: { padding: "12px 16px", color: "#4a5568", borderBottom: "1px solid #e2e8f0", display: "flex", gap: "8px", flexWrap: "wrap" },
    paidBadge: { display: "inline-block", padding: "4px 8px", borderRadius: "999px", background: "#c6f6d5", color: "#276749", fontSize: "12px", fontWeight: 600 },
    unpaidBadge: { display: "inline-block", padding: "4px 8px", borderRadius: "999px", background: "#feebc8", color: "#9c4221", fontSize: "12px", fontWeight: 600 },
    payButton: { padding: "6px 12px", background: "#198754", color: "white", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" },
    unpayButton: { padding: "6px 12px", background: "#ffc107", color: "#212529", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" },
    editButton: { padding: "6px 12px", background: "#6c757d", color: "white", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" },
    pdfButton: { padding: "6px 12px", background: "#212529", color: "white", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" },
    deleteButton: { padding: "6px 12px", background: "#dc3545", color: "white", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" },
    innerTable: { width: "100%", borderCollapse: "collapse", background: "#f9fafb" },
    innerTh: { border: "1px solid #e2e8f0", padding: "8px", textAlign: "left", fontSize: "12px", color: "#1a202c" },
    innerTd: { border: "1px solid #e2e8f0", padding: "8px", fontSize: "12px", color: "#4a5568" },
    detailToggle: { border: "1px solid #e2e8f0", background: "white", borderRadius: "6px", width: "28px", height: "28px", cursor: "pointer", fontSize: "12px" },
    pagination: { display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "16px" },
    pageBtn: { padding: "6px 10px", border: "1px solid #e2e8f0", background: "white", borderRadius: "6px", cursor: "pointer", fontSize: "12px" },
    pageActive: { padding: "6px 10px", border: "1px solid var(--color-primary)", background: "var(--color-primary)", color: "white", borderRadius: "6px", cursor: "pointer", fontSize: "12px" },
    pageInfo: { fontSize: "12px", color: "#718096", margin: "10px 0 0" },
};

