import '../css/app.css';
import './bootstrap';

import DocumentHead, { brandName } from '@/Components/DocumentHead';
import ThemeSync from '@/Components/ThemeSync';
import FilesIndex from './Pages/Files/Index';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const fallbackName = import.meta.env.VITE_APP_NAME || 'Gestion RH';
const pages = import.meta.glob('./Pages/**/*.jsx');

createInertiaApp({
    title: (title) => {
        const brand = window.__appBrand || fallbackName;
        return title ? `${title} · ${brand}` : brand;
    },
    resolve: (name) => {
        if (name === 'Files/Index') {
            return Promise.resolve({ default: FilesIndex });
        }

        return resolvePageComponent(`./Pages/${name}.jsx`, pages);
    },
    setup({ el, App, props }) {
        window.__appBrand = brandName(props.initialPage?.props?.company);
        const root = createRoot(el);

        root.render(
            <App {...props}>
                {({ Component, key, props: pageProps }) => {
                    const page = <Component key={key} {...pageProps} />;
                    let content = page;
                    if (typeof Component.layout === "function") {
                        content = Component.layout(page);
                    } else if (Array.isArray(Component.layout)) {
                        content = Component.layout
                            .concat(page)
                            .reverse()
                            .reduce((children, Layout) => (
                                <Layout {...pageProps}>{children}</Layout>
                            ));
                    }

                    return (
                        <>
                            <DocumentHead />
                            <ThemeSync />
                            {content}
                        </>
                    );
                }}
            </App>,
        );
    },
    progress: {
        color: 'var(--color-primary)',
    },
});
