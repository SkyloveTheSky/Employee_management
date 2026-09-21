import { usePage } from "@inertiajs/react";
import { dictionaries } from "./dictionaries";

export function normalizeLocale(value) {
    return String(value || "").toLowerCase().startsWith("en") ? "en" : "fr";
}

export function dateLocale(locale) {
    return normalizeLocale(locale) === "en" ? "en-GB" : "fr-FR";
}

function lookup(dict, key) {
    return key.split(".").reduce((current, part) => {
        if (current && typeof current === "object" && part in current) {
            return current[part];
        }
        return undefined;
    }, dict);
}

export function translate(locale, key, replacements = {}) {
    const lang = normalizeLocale(locale);
    const count = replacements.count;
    const pluralKey = count !== undefined && Number(count) !== 1 ? `${key}_plural` : key;
    let text = lookup(dictionaries[lang], pluralKey);
    if (typeof text !== "string") {
        text = lookup(dictionaries[lang], key);
    }
    if (typeof text !== "string") {
        text = lookup(dictionaries.fr, pluralKey);
    }
    if (typeof text !== "string") {
        text = lookup(dictionaries.fr, key);
    }
    if (typeof text !== "string") {
        return key;
    }
    return Object.entries(replacements).reduce(
        (current, [name, value]) => current.replaceAll(`:${name}`, String(value ?? "")),
        text
    );
}

export function useLocale() {
    const locale = usePage().props?.locale;
    return normalizeLocale(locale);
}

export function useDateLocale() {
    return dateLocale(useLocale());
}

export function useT() {
    const locale = useLocale();
    return (key, replacements) => translate(locale, key, replacements);
}

export function weekdayShortLabels(locale) {
    const loc = dateLocale(locale);
    return Array.from({ length: 7 }, (_, i) =>
        new Intl.DateTimeFormat(loc, { weekday: "short", timeZone: "UTC" }).format(
            new Date(Date.UTC(2024, 0, 1 + i))
        )
    );
}

export function monthShortLabels(locale) {
    const loc = dateLocale(locale);
    return Array.from({ length: 12 }, (_, i) => {
        const label = new Intl.DateTimeFormat(loc, { month: "short" }).format(new Date(2026, i, 1));
        return label.charAt(0).toUpperCase() + label.slice(1).replace(/\.$/, "");
    });
}

export function monthFullLabels(locale) {
    const loc = dateLocale(locale);
    return Array.from({ length: 12 }, (_, i) =>
        new Intl.DateTimeFormat(loc, { month: "long" }).format(new Date(2026, i, 1))
    );
}
