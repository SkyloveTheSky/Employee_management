import { translate } from "@/i18n";

export function geolocationErrorMessage(error, options) {
    const forPunch = Boolean(options && options.forPunch);
    const locale = options?.locale;
    const t = (key) => translate(locale, key);
    if (typeof window !== "undefined" && window.isSecureContext === false) {
        return t("geo.insecure");
    }

    const code = error?.code;
    if (code === 1) {
        return t("geo.denied");
    }
    if (code === 2 || code === 3) {
        if (forPunch) {
            return t("geo.punchUnavailable");
        }
        return t("geo.mapUnavailable");
    }

    return error?.message || t("geo.failed");
}

function readPosition(pos, source = "gps") {
    return {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        source,
    };
}

function requestPosition(options) {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
            (pos) => resolve(readPosition(pos, "gps")),
            (error) => reject(error),
            options
        );
    });
}

async function getApproximateIpCoords() {
    const endpoints = [
        {
            url: "https://get.geojs.io/v1/ip/geo.json",
            parse: (data) => ({ latitude: Number(data?.latitude), longitude: Number(data?.longitude) }),
        },
        {
            url: "https://ipapi.co/json/",
            parse: (data) => ({ latitude: Number(data?.latitude), longitude: Number(data?.longitude) }),
        },
    ];

    let lastError = Object.assign(new Error("ip"), { code: 2 });
    for (const endpoint of endpoints) {
        try {
            const response = await fetch(endpoint.url);
            if (!response.ok) {
                continue;
            }
            const data = await response.json();
            const { latitude, longitude } = endpoint.parse(data);
            if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
                return {
                    latitude,
                    longitude,
                    accuracy: 25000,
                    source: "ip",
                };
            }
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError;
}

export async function getCurrentCoords(options) {
    const allowIpFallback = Boolean(options && options.allowIpFallback);
    if (typeof window !== "undefined" && window.isSecureContext === false) {
        throw Object.assign(new Error(geolocationErrorMessage({ code: 1 })), { code: 1 });
    }

    if (!navigator.geolocation) {
        if (allowIpFallback) {
            return getApproximateIpCoords();
        }
        throw Object.assign(new Error(translate("fr", "geo.unsupported")), { code: 2 });
    }

    const gpsAttempts = allowIpFallback
        ? [{ enableHighAccuracy: true, timeout: 2500, maximumAge: 0 }]
        : [
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
            { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 },
        ];

    let lastError;
    for (const options of gpsAttempts) {
        try {
            return await requestPosition(options);
        } catch (error) {
            lastError = error;
            if (error?.code === 1) {
                throw error;
            }
        }
    }

    if (allowIpFallback) {
        return getApproximateIpCoords();
    }

    throw lastError;
}
