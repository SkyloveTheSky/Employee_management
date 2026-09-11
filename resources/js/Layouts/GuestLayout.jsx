import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link, usePage } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    const { company } = usePage().props;
    const logoUrl = company?.logo_url;
    const companyName = company?.name || 'Entreprise';

    return (
        <div className="flex min-h-screen flex-col items-center bg-white pt-6 sm:justify-center sm:pt-0">
            <div>
                <Link href="/" className="inline-flex items-center justify-center">
                    {logoUrl ? (
                        <img
                            src={logoUrl}
                            alt={companyName}
                            className="h-28 w-auto max-w-[320px] object-contain"
                        />
                    ) : (
                        <ApplicationLogo className="h-20 w-20 fill-current text-gray-500" />
                    )}
                </Link>
            </div>

            <div className="mt-6 w-full overflow-hidden bg-white px-6 py-4 shadow-md sm:max-w-md sm:rounded-lg">
                {children}
            </div>
        </div>
    );
}
