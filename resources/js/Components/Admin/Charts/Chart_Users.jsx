import React from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

/**
 * Chart des utilisateurs par mois
 * data format attendu :
 * [
 *   { month: 1, total: 10 },
 *   { month: 2, total: 25 },
 * ]
 */

export default function Chart_Users({ data = [] }) {
    // Convertir mois numérique en label lisible
    const formattedData = data.map((item) => ({
        ...item,
        monthLabel: `Mois ${item.month}`,
    }));

    return (
        <div style={styles.container}>
            <h3 style={styles.title}>Évolution des utilisateurs</h3>

            <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                    <LineChart data={formattedData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="monthLabel" />
                        <YAxis />
                        <Tooltip />
                        <Line
                            type="monotone"
                            dataKey="total"
                            stroke="#4f46e5"
                            strokeWidth={3}
                            dot={{ r: 4 }}
                        />
                    </LineChart>
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
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
    },
    title: {
        fontSize: "14px",
        fontWeight: "600",
        marginBottom: "10px",
        color: "#333",
    },
};
