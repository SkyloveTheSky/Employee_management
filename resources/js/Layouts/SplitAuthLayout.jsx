import ThemeSync from "@/Components/ThemeSync";

const USER_HERO =
    "/assets/Img/beautiful-view-tranquil-desert-clear-sky-captured-morocco.webp";

export default function SplitAuthLayout({ children, imageSrc = USER_HERO }) {
    return (
        <div className="flex min-h-screen font-[system-ui,sans-serif]">
            <ThemeSync />
            <div className="relative hidden w-1/2 md:block">
                <img
                    src={imageSrc}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                />
            </div>
            <div className="flex w-full items-center justify-center px-6 py-12 md:w-1/2" style={{ background: "var(--color-background)" }}>
                <div className="flex w-full max-w-[400px] flex-col items-center">
                    {children}
                </div>
            </div>
        </div>
    );
}
