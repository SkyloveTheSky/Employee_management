import { Head, usePage } from "@inertiajs/react";
import BrandMark from "@/Components/BrandMark";
import HeaderTools from "@/Components/HeaderTools";
import MessageThread from "@/Components/Inbox/MessageThread";
import Sidebar from "@/Components/User/Sidebar";
import { colors } from "@/config/colors";
import { useSidebar } from "@/hooks/useSidebar";

export default function Index({ messages = [] }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const { isOpen, setIsOpen, offset } = useSidebar();

    return (
        <>
            <Head title="Messages" />
            <Sidebar user={user} currentPage="messages.index" isOpen={isOpen} setIsOpen={setIsOpen} />
            <div className="app-page" style={{ ...styles.page, marginLeft: offset }}>
                <div className="app-header" style={styles.header}>
                    <BrandMark />
                    <div>
                        <h1 style={styles.title}>Messages</h1>
                        <p style={styles.subtitle}>Échangez avec le service RH</p>
                    </div>
                    <HeaderTools />
                </div>

                <MessageThread
                    messages={messages}
                    me="user"
                    otherLabel="RH"
                    otherIcon="/assets/icon/building.svg"
                    storeUrl={route("messages.store")}
                    emptyText="Aucun message. Écrivez à la RH ou joignez un fichier."
                />
            </div>
        </>
    );
}

const styles = {
    page: { minHeight: "100vh", background: "var(--color-background)", fontFamily: "system-ui, sans-serif", padding: "24px", transition: "margin-left 0.3s ease" },
    header: { display: "flex", alignItems: "center", gap: "16px", background: "white", padding: "20px 24px", borderRadius: "12px", marginBottom: "24px", border: `1px solid ${colors.border}` },
    title: { fontSize: "18px", fontWeight: "600", color: colors.dark, margin: 0 },
    subtitle: { fontSize: "13px", color: colors.muted, margin: 0 },
};
