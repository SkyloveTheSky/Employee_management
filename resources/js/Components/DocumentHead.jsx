import { Head, usePage } from "@inertiajs/react";

const FALLBACK_ICON = "/favicon.svg";
const FALLBACK_NAME = "Gestion RH";

export function brandName(company) {
    const name = (company?.name || "").trim();
    return name || import.meta.env.VITE_APP_NAME || FALLBACK_NAME;
}

export function brandIcon(company) {
    return company?.logo_url || FALLBACK_ICON;
}

export default function DocumentHead() {
    const { company } = usePage().props;
    const icon = brandIcon(company);
    const brand = brandName(company);
    window.__appBrand = brand;

    return (
        <Head>
            <link head-key="favicon" rel="icon" href={icon} />
            <link head-key="shortcut-icon" rel="shortcut icon" href={icon} />
            <link head-key="apple-touch-icon" rel="apple-touch-icon" href={icon} />
            <meta head-key="app-brand" name="application-name" content={brand} />
        </Head>
    );
}
