import PrimaryButton from '@/Components/PrimaryButton';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useT } from '@/i18n';

export default function VerifyEmail({ status }) {
    const t = useT();
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <GuestLayout>
            <Head title={t('auth.verifyTitle')} />

            <div className="mb-4 text-sm text-gray-600">
                {t('auth.verifyHelp')}
            </div>

            {status === 'verification-link-sent' && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    {t('auth.verifySent')}
                </div>
            )}

            <form onSubmit={submit}>
                <div className="mt-4 flex items-center justify-between">
                    <PrimaryButton disabled={processing}>
                        {t('auth.resend')}
                    </PrimaryButton>

                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-bootstrap-primary focus:ring-offset-2"
                    >
                        {t('nav.logout')}
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
