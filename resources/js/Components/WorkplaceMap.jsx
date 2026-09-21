import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { colors } from "@/config/colors";
import { getCurrentCoords } from "@/utils/geolocation";
import { useT } from "@/i18n";

const ANTANANARIVO = [-18.8792, 47.5079];

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).href,
    iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).href,
    shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).href,
});

function parseCoord(value) {
    if (value === "" || value === null || value === undefined) {
        return null;
    }
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

export default function WorkplaceMap({
    latitude,
    longitude,
    radius = 150,
    lockPosition = false,
    onChange,
    onLocateError,
    onLocateApproximate,
}) {
    const t = useT();
    const mapEl = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const circleRef = useRef(null);
    const onChangeRef = useRef(onChange);
    const lockPositionRef = useRef(lockPosition);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState("");
    const [locating, setLocating] = useState(false);

    onChangeRef.current = onChange;
    lockPositionRef.current = lockPosition;

    const lat = parseCoord(latitude);
    const lng = parseCoord(longitude);
    const hasPoint = lat !== null && lng !== null;
    const radiusM = Math.max(20, Number(radius) || 150);

    useEffect(() => {
        if (!mapEl.current || mapRef.current) {
            return undefined;
        }

        const start = hasPoint ? [lat, lng] : ANTANANARIVO;
        const map = L.map(mapEl.current, { scrollWheelZoom: true }).setView(start, hasPoint ? 17 : 12);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap",
            maxZoom: 19,
        }).addTo(map);
        map.on("click", (event) => {
            if (lockPositionRef.current) {
                return;
            }
            onChangeRef.current?.({
                latitude: event.latlng.lat.toFixed(7),
                longitude: event.latlng.lng.toFixed(7),
            });
        });
        mapRef.current = map;
        const frame = requestAnimationFrame(() => map.invalidateSize());

        return () => {
            cancelAnimationFrame(frame);
            map.remove();
            mapRef.current = null;
            markerRef.current = null;
            circleRef.current = null;
        };
        // Initial view only; marker/circle follow lat/lng in the next effect.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) {
            return;
        }
        if (!hasPoint) {
            markerRef.current?.remove();
            circleRef.current?.remove();
            markerRef.current = null;
            circleRef.current = null;
            return;
        }

        const position = [lat, lng];
        if (!markerRef.current) {
            const marker = L.marker(position, { draggable: !lockPositionRef.current }).addTo(map);
            marker.on("dragend", () => {
                if (lockPositionRef.current) {
                    return;
                }
                const next = marker.getLatLng();
                onChangeRef.current?.({
                    latitude: next.lat.toFixed(7),
                    longitude: next.lng.toFixed(7),
                });
            });
            markerRef.current = marker;
            circleRef.current = L.circle(position, {
                radius: radiusM,
                color: "#261fb3",
                fillColor: "#261fb3",
                fillOpacity: 0.12,
                weight: 2,
            }).addTo(map);
        } else {
            markerRef.current.setLatLng(position);
            if (lockPosition) {
                markerRef.current.dragging?.disable();
            } else {
                markerRef.current.dragging?.enable();
            }
            circleRef.current.setLatLng(position);
            circleRef.current.setRadius(radiusM);
        }

        const bounds = circleRef.current.getBounds();
        map.fitBounds(bounds, { padding: [24, 24], maxZoom: 18 });
        map.invalidateSize();
    }, [hasPoint, lat, lng, radiusM]);

    const searchPlace = async () => {
        const needle = query.trim();
        if (needle.length < 3) {
            setSearchError(t("workplace.minChars"));
            return;
        }
        setSearching(true);
        setSearchError("");
        try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&limit=6&countrycodes=mg&q=${encodeURIComponent(needle)}`;
            const response = await fetch(url, {
                headers: { Accept: "application/json" },
            });
            if (!response.ok) {
                throw new Error("search failed");
            }
            const rows = await response.json();
            setResults(Array.isArray(rows) ? rows : []);
            if (!rows?.length) {
                setSearchError(t("workplace.noPlace"));
            }
        } catch {
            setSearchError(t("workplace.searchFailed"));
        } finally {
            setSearching(false);
        }
    };

    const pickResult = (row) => {
        onChangeRef.current?.({
            latitude: Number(row.lat).toFixed(7),
            longitude: Number(row.lon).toFixed(7),
        });
        setResults([]);
        setQuery(row.display_name || query);
    };

    const locateMe = async () => {
        if (locating) {
            return;
        }
        setLocating(true);
        setSearchError("");
        try {
            const pos = await getCurrentCoords({ allowIpFallback: true });
            onChangeRef.current?.({
                latitude: pos.latitude.toFixed(7),
                longitude: pos.longitude.toFixed(7),
            });
            if (pos.source === "ip") {
                onLocateApproximate?.(pos);
            }
        } catch (error) {
            onLocateError?.(error);
            if (!onLocateError) {
                setSearchError(t("workplace.locateFailed"));
            }
        } finally {
            setLocating(false);
        }
    };

    return (
        <div style={styles.wrap}>
            <p style={styles.label}>{lockPosition ? t("workplace.zone") : t("workplace.place")}</p>
            <p style={styles.hint}>
                {lockPosition
                    ? t("workplace.lockedHint", { radius: radiusM })
                    : t("workplace.unlockedHint")}
            </p>
            {!lockPosition && (
            <div style={styles.searchRow}>
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("workplace.searchPh")}
                    style={styles.searchInput}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            searchPlace();
                        }
                    }}
                />
                <button type="button" onClick={searchPlace} disabled={searching} style={styles.searchBtn}>
                    {searching ? t("workplace.searching") : t("workplace.search")}
                </button>
                <button type="button" onClick={locateMe} disabled={locating} style={styles.searchBtn}>
                    {locating ? t("workplace.locating") : t("workplace.myPosition")}
                </button>
            </div>
            )}
            {searchError ? <p style={styles.error}>{searchError}</p> : null}
            {results.length > 0 && (
                <ul style={styles.results}>
                    {results.map((row) => (
                        <li key={`${row.place_id}`}>
                            <button type="button" style={styles.resultBtn} onClick={() => pickResult(row)}>
                                {row.display_name}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            <div ref={mapEl} className="workplace-map" style={styles.map} />
        </div>
    );
}

const styles = {
    wrap: { marginTop: "16px" },
    label: { display: "block", fontSize: "13px", fontWeight: "600", color: colors.dark, marginBottom: "4px" },
    hint: { fontSize: "12px", color: colors.muted, margin: "0 0 10px", lineHeight: 1.4 },
    searchRow: { display: "flex", gap: "8px", marginBottom: "8px" },
    searchInput: {
        flex: 1,
        height: "38px",
        padding: "0 12px",
        fontSize: "14px",
        border: `1px solid ${colors.border}`,
        borderRadius: "8px",
        boxSizing: "border-box",
        fontFamily: "inherit",
        minWidth: 0,
    },
    searchBtn: {
        height: "38px",
        padding: "0 12px",
        border: `1px solid ${colors.border}`,
        background: "white",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: 600,
        cursor: "pointer",
        flexShrink: 0,
    },
    results: {
        listStyle: "none",
        margin: "0 0 8px",
        padding: 0,
        border: `1px solid ${colors.border}`,
        borderRadius: "8px",
        overflow: "hidden",
        maxHeight: "160px",
        overflowY: "auto",
    },
    resultBtn: {
        width: "100%",
        textAlign: "left",
        border: "none",
        background: "white",
        padding: "8px 12px",
        fontSize: "12px",
        cursor: "pointer",
        fontFamily: "inherit",
        color: colors.dark,
        borderBottom: `1px solid ${colors.border}`,
    },
    map: {
        height: "320px",
        width: "100%",
        borderRadius: "8px",
        border: `1px solid ${colors.border}`,
        overflow: "hidden",
        zIndex: 1,
    },
    error: { fontSize: "12px", color: colors.error, margin: "0 0 8px" },
};
