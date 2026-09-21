import { Head, router, useForm, usePage } from "@inertiajs/react";
import BrandMark from "@/Components/BrandMark";
import HeaderTools from "@/Components/HeaderTools";
import IconButton from "@/Components/IconButton";
import Sidebar from "@/Components/User/Sidebar";
import { colors } from "@/config/colors";
import { useSidebar } from "@/hooks/useSidebar";
import { useDateLocale, useT } from "@/i18n";

function slotLabel(slot, t) {
    return slot === "afternoon" ? t("leave.afternoon") : t("leave.morning");
}

function formatRange(leave, t, locale) {
    const start = new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
    }).format(new Date(`${leave.start_date}T12:00:00Z`));
    const end = new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
    }).format(new Date(`${leave.end_date}T12:00:00Z`));
    const days = Number(leave.days || 0).toLocaleString(locale, {
        minimumFractionDigits: leave.days % 1 === 0 ? 0 : 1,
        maximumFractionDigits: 1,
    });
    if (leave.start_date === leave.end_date) {
        const slot = leave.start_slot === leave.end_slot
            ? slotLabel(leave.start_slot, t)
            : t("leave.fullDay");
        return `${start} · ${slot} · ${t("leave.days", { count: days })}`;
    }
    return `${start} → ${end} · ${t("leave.days", { count: days })}`;
}

function statusStyle(status) {
    if (status === "approved") {
        return { background: "#c6f6d5", color: "#276749" };
    }
    if (status === "rejected") {
        return { background: "#fed7d7", color: "#c53030" };
    }
    return { background: "#feebc8", color: "#c05621" };
}

export default function Index({ leaves = [] }) {
    const t = useT();
    const dateLoc = useDateLocale();
    const { auth, errors, flash } = usePage().props;
    const user = auth?.user;
    const { isOpen, setIsOpen, offset } = useSidebar();
    const { data, setData, post, processing, reset } = useForm({
        type: "paid",
        start_date: "",
        end_date: "",
        start_slot: "morning",
        end_slot: "afternoon",
        reason: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("leaves.store"), {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    const cancelLeave = (leave) => {
        router.delete(route("leaves.destroy", leave.id), { preserveScroll: true });
    };

    return (
        <>
            <Head title={t("leave.title")} />
            <Sidebar user={user} currentPage="leaves.index" isOpen={isOpen} setIsOpen={setIsOpen} />
            <div className="app-page" style={{ ...styles.page, marginLeft: offset }}>
                <div className="app-header" style={styles.header}>
                    <BrandMark />
                    <div>
                        <h1 style={styles.title}>{t("leave.title")}</h1>
                        <p style={styles.subtitle}>{t("leave.subtitle")}</p>
                    </div>
                    <HeaderTools />
                </div>

                {flash?.success ? <p style={styles.success}>{flash.success}</p> : null}

                <form onSubmit={submit} style={styles.form}>
                    <h2 style={styles.sectionTitle}>{t("leave.newRequest")}</h2>
                    <div style={styles.types}>
                        <label style={styles.radio}>
                            <input
                                type="radio"
                                name="type"
                                value="paid"
                                checked={data.type === "paid"}
                                onChange={() => setData("type", "paid")}
                            />
                            {t("leave.paid")}
                        </label>
                        <label style={styles.radio}>
                            <input
                                type="radio"
                                name="type"
                                value="unpaid"
                                checked={data.type === "unpaid"}
                                onChange={() => setData("type", "unpaid")}
                            />
                            {t("leave.unpaid")}
                        </label>
                        <label style={styles.radio}>
                            <input
                                type="radio"
                                name="type"
                                value="sick"
                                checked={data.type === "sick"}
                                onChange={() => setData("type", "sick")}
                            />
                            {t("leave.sick")}
                        </label>
                    </div>
                    <div style={styles.grid}>
                        <label style={styles.label}>
                            {t("leave.from")}
                            <input
                                type="date"
                                value={data.start_date}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setData({
                                        ...data,
                                        start_date: value,
                                        end_date: !data.end_date || data.end_date < value ? value : data.end_date,
                                    });
                                }}
                                style={styles.input}
                                required
                            />
                            {errors?.start_date ? <span style={styles.fieldError}>{errors.start_date}</span> : null}
                        </label>
                        <label style={styles.label}>
                            {t("leave.slot")}
                            <select
                                value={data.start_slot}
                                onChange={(e) => setData("start_slot", e.target.value)}
                                style={styles.input}
                            >
                                <option value="morning">{t("leave.morning")}</option>
                                <option value="afternoon">{t("leave.afternoon")}</option>
                            </select>
                        </label>
                        <label style={styles.label}>
                            {t("leave.to")}
                            <input
                                type="date"
                                value={data.end_date}
                                onChange={(e) => setData("end_date", e.target.value)}
                                style={styles.input}
                                required
                            />
                            {errors?.end_date ? <span style={styles.fieldError}>{errors.end_date}</span> : null}
                        </label>
                        <label style={styles.label}>
                            {t("leave.slot")}
                            <select
                                value={data.end_slot}
                                onChange={(e) => setData("end_slot", e.target.value)}
                                style={styles.input}
                            >
                                <option value="morning">{t("leave.morning")}</option>
                                <option value="afternoon">{t("leave.afternoon")}</option>
                            </select>
                            {errors?.end_slot ? <span style={styles.fieldError}>{errors.end_slot}</span> : null}
                        </label>
                    </div>
                    <label style={styles.label}>
                        {t("leave.reason")}
                        <textarea
                            value={data.reason}
                            onChange={(e) => setData("reason", e.target.value)}
                            rows={3}
                            maxLength={1000}
                            style={{ ...styles.input, resize: "vertical" }}
                        />
                        {errors?.reason ? <span style={styles.fieldError}>{errors.reason}</span> : null}
                    </label>
                    <IconButton
                        icon="send"
                        label={processing ? t("leave.sending") : t("leave.send")}
                        variant="primary"
                        size={38}
                        showLabel
                        type="submit"
                        disabled={processing}
                        style={{ alignSelf: "flex-start" }}
                    />
                </form>

                <div style={styles.list}>
                    {leaves.length === 0 ? (
                        <p style={styles.empty}>{t("leave.empty")}</p>
                    ) : (
                        leaves.map((leave) => (
                            <article key={leave.id} style={styles.card}>
                                <div style={styles.cardTop}>
                                    <div>
                                        <p style={styles.cardTitle}>{t(`leave.${leave.type}`) || leave.type_label}</p>
                                        <p style={styles.cardMeta}>{formatRange(leave, t, dateLoc)}</p>
                                    </div>
                                    <span style={{ ...styles.badge, ...statusStyle(leave.status) }}>
                                        {t(`leave.${leave.status}`) || leave.status_label}
                                    </span>
                                </div>
                                {leave.reason ? <p style={styles.reason}>{leave.reason}</p> : null}
                                {leave.review_note ? <p style={styles.reason}>{t("leave.note", { note: leave.review_note })}</p> : null}
                                {leave.can_cancel ? (
                                    <div>
                                        <IconButton
                                            icon="delete"
                                            label={t("leave.cancel")}
                                            variant="danger"
                                            size={38}
                                            showLabel
                                            onClick={() => cancelLeave(leave)}
                                        />
                                    </div>
                                ) : null}
                            </article>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}

const styles = {
    page: { minHeight: "100vh", background: "var(--color-background)", fontFamily: "system-ui, sans-serif", padding: "24px", transition: "margin-left 0.3s ease" },
    header: { display: "flex", alignItems: "center", gap: "16px", background: "white", padding: "20px 24px", borderRadius: "12px", marginBottom: "24px", border: `1px solid ${colors.border}` },
    title: { fontSize: "18px", fontWeight: "600", color: colors.dark, margin: 0 },
    subtitle: { fontSize: "13px", color: colors.muted, margin: 0 },
    success: { background: "#c6f6d5", color: "#276749", padding: "10px 14px", borderRadius: "8px", marginBottom: "16px" },
    form: { background: "white", border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "20px", marginBottom: "20px", display: "flex", flexDirection: "column", gap: "14px" },
    sectionTitle: { margin: 0, fontSize: "15px", fontWeight: 700, color: colors.dark },
    types: { display: "flex", flexWrap: "wrap", gap: "16px" },
    radio: { display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600, color: colors.dark },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" },
    label: { display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", fontWeight: 600, color: colors.dark },
    input: { width: "100%", boxSizing: "border-box", padding: "9px 10px", border: `1px solid ${colors.border}`, borderRadius: "8px", fontSize: "13px", fontWeight: 400 },
    fieldError: { color: colors.error, fontSize: "12px", fontWeight: 500 },
    list: { display: "flex", flexDirection: "column", gap: "12px" },
    empty: { margin: 0, color: colors.muted, fontSize: "14px" },
    card: { background: "white", border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "8px" },
    cardTop: { display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start" },
    cardTitle: { margin: 0, fontSize: "14px", fontWeight: 700, color: colors.dark },
    cardMeta: { margin: "4px 0 0", fontSize: "13px", color: colors.muted },
    badge: { fontSize: "12px", fontWeight: 700, padding: "4px 8px", borderRadius: "999px", whiteSpace: "nowrap" },
    reason: { margin: 0, fontSize: "13px", color: colors.dark, lineHeight: 1.4 },
};
