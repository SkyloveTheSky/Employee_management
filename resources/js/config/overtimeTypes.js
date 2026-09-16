export const DEFAULT_OVERTIME_TYPES = [
    { key: "normal", code: "HS_NORMAL", label: "HS normale", premium: 30, enabled: true },
    { key: "night", code: "HS_NUIT", label: "HS de nuit", premium: 50, enabled: true },
    { key: "sunday", code: "HS_DIMANCHE", label: "HS dimanche", premium: 50, enabled: true },
    { key: "holiday", code: "HS_FERIE", label: "HS jour férié", premium: 100, enabled: true },
    { key: "night_holiday", code: "HS_NUIT_FERIE", label: "HS nuit + férié", premium: 100, enabled: true },
];

function slug(value, fallback = "hs") {
    const next = String(value || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/gi, "_")
        .replace(/^_+|_+$/g, "");
    return next || fallback;
}

export function normalizeOvertimeTypes(source) {
    const defaults = Object.fromEntries(DEFAULT_OVERTIME_TYPES.map((row) => [row.key, row]));
    const list = Array.isArray(source) ? source : [];
    const rows = list
        .map((row, index) => {
            if (!row || typeof row !== "object") return null;
            const key = slug(row.key || row.code || row.label, `hs_${index}`);
            const fallback = defaults[key] || {};
            return {
                key,
                code: String(row.code || fallback.code || key).toUpperCase(),
                label: String(row.label || fallback.label || key),
                premium: Number(row.premium ?? row.rate ?? fallback.premium ?? 30),
                enabled: row.enabled !== false && row.enabled !== 0 && row.enabled !== "0",
            };
        })
        .filter(Boolean);

    if (rows.length === 0) return DEFAULT_OVERTIME_TYPES.map((row) => ({ ...row }));

    const seen = new Set();
    return rows.map((row) => {
        let key = row.key;
        let i = 2;
        while (seen.has(key)) {
            key = `${row.key}_${i}`;
            i += 1;
        }
        seen.add(key);
        return { ...row, key };
    });
}

export function cloneDefaultOvertimeTypes() {
    return DEFAULT_OVERTIME_TYPES.map((row) => ({ ...row }));
}

export function normalizeOvertimePositions(source, fallbackTypes) {
    const fallback = normalizeOvertimeTypes(fallbackTypes);
    const list = Array.isArray(source) ? source : [];
    if (!Array.isArray(source) && source && typeof source === "object") {
        return Object.entries(source).map(([position, row]) => normalizePositionRow(position, row, fallback));
    }
    return list
        .map((row) => normalizePositionRow(row?.position || row?.name, row, fallback))
        .filter((row) => row.position);
}

function normalizePositionRow(position, row, fallback) {
    const name = String(position || "").trim();
    const payload = row && typeof row === "object" ? row : {};
    return {
        position: name,
        enabled: payload.enabled !== false && payload.enabled !== 0 && payload.enabled !== "0",
        types: normalizeOvertimeTypes(payload.types && payload.types.length ? payload.types : fallback),
    };
}

export function enabledOvertimeTypes(source) {
    return normalizeOvertimeTypes(source).filter((row) => row.enabled);
}

export function coefficientFromPremium(premium) {
    const n = Number(premium);
    if (Number.isNaN(n)) return 1.3;
    return Math.round((1 + Math.max(0, n) / 100) * 1000) / 1000;
}
