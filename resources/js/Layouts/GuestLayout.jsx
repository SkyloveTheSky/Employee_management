import ApplicationLogo from "@/Components/ApplicationLogo";
import SplitAuthLayout from "@/Layouts/SplitAuthLayout";
import { Link, usePage } from "@inertiajs/react";

export default function GuestLayout({ children }) {
    const { company } = usePage().props;
    const logoUrl = company?.logo_url;
    const companyName = company?.name || "Entreprise";

    return (
        <SplitAuthLayout>
            <Link href="/" className="mb-8 inline-flex items-center justify-center">
                {logoUrl ? (
                    <img
                        src={logoUrl}
                        alt={companyName}
                        className="h-20 w-auto max-w-[240px] object-contain"
                    />
                ) : (
                    <ApplicationLogo className="h-16 w-16 fill-current text-gray-500" />
                )}
            </Link>

            <div className="w-full overflow-hidden bg-white px-5 py-6 shadow-md sm:rounded-lg sm:px-8 sm:py-8">
                {children}
            </div>
        </SplitAuthLayout>
    );
}
