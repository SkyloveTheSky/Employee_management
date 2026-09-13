import { Head, Link } from "@inertiajs/react";
import BrandMark from "@/Components/BrandMark";
import HeaderTools from "@/Components/HeaderTools";
import MessageThread from "@/Components/Inbox/MessageThread";
import Sidebar from "@/Components/Admin/Sidebar";
import { colors } from "@/config/colors";
import { useSidebar } from "@/hooks/useSidebar";

export default function Show({ admin, employee, messages = [] }) {
    const { isOpen, setIsOpen, offset } = useSidebar();

    return (
        <>
            <Head title={`Messages · ${employee.name}`} />
            <Sidebar admin={admin} currentPage="admin.messages.index" isOpen={isOpen} setIsOpen={setIsOpen} />
            <div className="app-page" style={{ ...styles.page, marginLeft: offset }}>
                <div className="app-header" style={styles.header}>
                    <BrandMark />
                    <div>
                        <h1 style={styles.title}>{employee.name}</h1>
                        <p style={styles.subtitle}>{employee.position || "Employé"}</p>
                    </div>
                    <HeaderTools>
                        <Link href={route("admin.messages.index")} style={styles.back}>
                            Tous les messages
                        </Link>
                    </HeaderTools>
                </div>

                <MessageThread
                    messages={messages}
                    me="admin"
                    otherLabel={employee.name}
                    otherIcon={employee.photo_path ? `/storage/${employee.photo_path}` : "/assets/icon/user.svg"}
                    storeUrl={route("admin.messages.store", employee.id)}
                    emptyText="Aucun message. Écrivez le premier ou joignez un fichier."
                />
            </div>
        </>
    );
}

const styles = {
    page: { minHeight: "100vh", background: colors.background, fontFamily: "system-ui, sans-serif", padding: "24px", transition: "margin-left 0.3s ease" },
    header: { display: "flex", alignItems: "center", gap: "16px", background: "white", padding: "20px 24px", borderRadius: "12px", marginBottom: "24px", border: `1px solid ${colors.border}` },
    title: { fontSize: "18px", fontWeight: "600", color: colors.dark, margin: 0 },
    subtitle: { fontSize: "13px", color: colors.muted, margin: 0 },
    back: { fontSize: "13px", fontWeight: 600, color: "var(--color-primary)", textDecoration: "none", marginRight: "4px" },
};
