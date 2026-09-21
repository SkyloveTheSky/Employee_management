import React from "react";
import { usePage } from "@inertiajs/react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { monthFullLabels, monthShortLabels, useDateLocale, useLocale, useT } from "@/i18n";

export default function Chart_Payroll({ data = [] }) {
    const t = useT();
    const locale = useLocale();
    const dateLoc = useDateLocale();
    const fill = usePage().props.theme?.primary || "#261FB3";
    const shorts = monthShortLabels(locale);
    const fulls = monthFullLabels(locale);
    const totalsByMonth = new Map(
        data.map((item) => [Number(item.month), Number(item.total) || 0])
    );
    const formatAr = (value) =>
        `${Number(value || 0).toLocaleString(dateLoc, { maximumFractionDigits: 0 })} Ar`;

    const formattedData = shorts.map((monthLabel, index) => ({
        month: index + 1,
        monthLabel,
        monthFull: fulls[index],
        total: totalsByMonth.get(index + 1) || 0,
    }));

    return (
        <div style={styles.container}>
            <h3 style={styles.title}>{t("dashboard.chartPayroll")}</h3>
            <p style={styles.subtitle}>{t("dashboard.chartPayrollHelp")}</p>

            <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                    <BarChart data={formattedData} barCategoryGap="28%">
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                        <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: "#718096" }} interval={0} />
                        <YAxis
                            tick={{ fontSize: 11, fill: "#718096" }}
                            tickFormatter={(value) =>
                                Number(value).toLocaleString(dateLoc, { notation: "compact", maximumFractionDigits: 1 })
                            }
                        />
                        <Tooltip
                            formatter={(value) => [formatAr(value), t("payrolls.net")]}
                            labelFormatter={(_, payload) => payload?.[0]?.payload?.monthFull || ""}
                            labelStyle={{ color: "#1A202C" }}
                        />
                        <Bar dataKey="total" name={t("dashboard.payrollMass")} fill={fill} radius={[4, 4, 0, 0]} maxBarSize={42} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

const styles = {
    container: {
        backgroundColor: "#fff",
        padding: "15px",
        borderRadius: "10px",
    },
    title: {
        fontSize: "14px",
        fontWeight: "600",
        marginBottom: "4px",
        color: "#1A202C",
    },
    subtitle: {
        fontSize: "12px",
        color: "#718096",
        margin: "0 0 12px",
    },
};
