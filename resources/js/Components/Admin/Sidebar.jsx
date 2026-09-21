import { Link, router, usePage } from "@inertiajs/react";
import { colors } from "@/config/colors";
import { SIDEBAR_COLLAPSED, SIDEBAR_WIDTH } from "@/config/layout";
import { useIsMobile } from "@/hooks/useIsMobile";
import BrandMark from "@/Components/BrandMark";
import ThemeSync from "@/Components/ThemeSync";
import { useT } from "@/i18n";

export default function Sidebar({ admin, currentPage, isOpen, setIsOpen }) {
    const t = useT();
    const { company } = usePage().props;
    const companyName = company?.name || t("welcome.companyFallback");
    const isMobile = useIsMobile();
    const expanded = isMobile ? true : isOpen;

    const logout = () => {
        router.post(route("admin.logout"));
    };

    const closeIfMobile = () => {
        if (isMobile) {
            setIsOpen(false);
        }
    };

    const menuSections = [
        {
            title: t("nav.activity"),
            items: [
                { label: t("nav.dashboard"), route: "admin.dashboard", icon: "/assets/icon/dashboard.svg" },
                { label: t("nav.agenda"),          route: "admin.agenda",    icon: "/assets/icon/calendrier.svg" },
                { label: t("nav.employees"),        route: "admin.employees", icon: "/assets/icon/users.svg" },
                { label: t("nav.payroll"),            route: "admin.payrolls.index", icon: "/assets/icon/payroll.svg" },
                { label: t("nav.presences"), route: "admin.overtime.index", icon: "/assets/icon/hours.svg" },
                { label: t("nav.adminLeaves"), route: "admin.leaves.index", icon: "/assets/icon/leave.svg" },
                { label: t("nav.charges"),          route: "admin.charges.index", icon: "/assets/icon/support.svg" },
                { label: t("nav.messages"),        route: "admin.messages.index", icon: "/assets/icon/message.svg" },
                { label: t("nav.adminFiles"),        route: "admin.files.index", icon: "/assets/icon/file-manager.svg" },
            ],
        },
        {
            title: t("nav.platform"),
            items: [
                { label: t("nav.company"), route: "admin.settings.company.edit", icon: "/assets/icon/building.svg" },
                { label: t("nav.settings"), route: "admin.settings.edit", icon: "/assets/icon/gear.svg" },
            ],
        },
    ];

    return (
        <>
            <ThemeSync />
            {isMobile && !isOpen && (
                <button type="button" className="app-menu-fab" onClick={() => setIsOpen(true)} aria-label={t("nav.openMenu")}>
                    ☰
                </button>
            )}
            {isMobile && isOpen && (
                <div className="app-sidebar-overlay" onClick={() => setIsOpen(false)} />
            )}
            <aside
                style={{
                    ...styles.sidebar,
                    width: isMobile || isOpen ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED,
                    padding: expanded ? "24px 16px" : "20px 10px",
                    transform: isMobile && !isOpen ? "translateX(-110%)" : "translateX(0)",
                }}
            >
                <div style={{
                    ...styles.logoSection,
                    flexDirection: expanded ? "row" : "column",
                    justifyContent: expanded ? "space-between" : "center",
                }}>
                    <div style={styles.brandRow}>
                        <BrandMark size={expanded ? 44 : 40} />
                        {expanded && <h2 style={styles.appName}>{companyName}</h2>}
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        style={styles.toggleButton}
                        aria-label={isOpen ? t("nav.closeMenu") : t("nav.openMenu")}
                    >
                        {isMobile ? "✕" : isOpen ? "‹" : "›"}
                    </button>
                </div>

                <nav style={styles.nav}>
                    {menuSections.map((section) => (
                        <div key={section.title} style={styles.sectionBlock}>
                            {expanded && <p style={styles.sectionTitle}>{section.title}</p>}
                            {section.items.map((item) => (
                                <Link
                                    key={item.route}
                                    href={route(item.route)}
                                    title={item.label}
                                    onClick={closeIfMobile}
                                    style={{
                                        ...styles.navItem,
                                        justifyContent: expanded ? "flex-start" : "center",
                                        padding: expanded ? "12px 12px" : "12px 8px",
                                        background:
                                            currentPage === item.route
                                                ? colors.primary
                                                : "transparent",
                                        color:
                                            currentPage === item.route
                                                ? colors.white
                                                : colors.light,
                                        borderLeft:
                                            currentPage === item.route
                                                ? `4px solid ${colors.primaryLight}`
                                                : "4px solid transparent",
                                    }}
                                >
                                    <img src={item.icon} alt="" style={styles.iconImg} />
                                    {expanded && item.label}
                                </Link>
                            ))}
                        </div>
                    ))}
                </nav>

                <div style={styles.userSection}>
                    <div style={{
                        ...styles.userCard,
                        justifyContent: expanded ? "flex-start" : "center",
                        padding: expanded ? "12px" : "8px",
                    }}>
                        <div style={styles.userAvatar}>
                            {admin.first_name_admin?.charAt(0)}
                            {admin.name_admin?.charAt(0)}
                        </div>
                        {expanded && (
                            <div style={styles.userInfo}>
                                <p style={styles.userName}>
                                    {admin.first_name_admin} {admin.name_admin}
                                </p>
                                <p style={styles.userRole}>{admin.post_admin}</p>
                            </div>
                        )}
                    </div>

                    <button onClick={logout} style={styles.logoutButton} title={t("nav.logout")}>
                        {expanded ? t("nav.logout") : "⎋"}
                    </button>
                </div>
            </aside>
        </>
    );
}

const styles = {
    toggleButton: {
        background: colors.primary,
        border: "none",
        padding: "6px 10px",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "18px",
        color: colors.white,
        fontWeight: "bold",
        lineHeight: 1,
        flexShrink: 0,
    },
    sidebar: {
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: colors.primaryDark,
        borderRight: `1px solid ${colors.dark}`,
        boxSizing: "border-box",
        position: "fixed",
        top: 0,
        left: 0,
        transition: "width 0.3s ease, padding 0.3s ease, transform 0.3s ease",
        zIndex: 1000,
        overflow: "hidden",
    },
    icon: {
        fontSize: "18px",
    },
    iconImg: {
        width: "20px",
        height: "20px",
        filter: "invert(1)",
        flexShrink: 0,
    },
    logoSection: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: "24px",
        paddingBottom: "16px",
        borderBottom: `1px solid ${colors.dark}`,
    },
    brandRow: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        minWidth: 0,
    },
    appName: {
        fontSize: "16px",
        fontWeight: "600",
        color: colors.white,
        margin: 0,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        maxWidth: "140px",
    },
    nav: {
        flex: 1,
        overflow: "auto",
    },
    sectionBlock: {
        marginBottom: "20px",
    },
    sectionTitle: {
        fontSize: "12px",
        fontWeight: "600",
        color: "#a0aec0",
        textTransform: "uppercase",
        margin: "0 0 12px",
        paddingLeft: "12px",
        whiteSpace: "nowrap",
    },
    navItem: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        borderRadius: "8px",
        textDecoration: "none",
        fontSize: "14px",
        fontWeight: "500",
        cursor: "pointer",
        transition: "all 0.2s",
        marginBottom: "4px",
        whiteSpace: "nowrap",
    },
    userSection: {
        paddingTop: "16px",
        borderTop: `1px solid ${colors.dark}`,
    },
    userCard: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginBottom: "12px",
        background: colors.sidebarElevated,
        borderRadius: "8px",
    },
    userAvatar: {
        width: "40px",
        height: "40px",
        background: colors.primary,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: colors.white,
        fontWeight: "600",
        fontSize: "14px",
        flexShrink: 0,
    },
    userInfo: {
        flex: 1,
        minWidth: 0,
    },
    userName: {
        fontSize: "13px",
        fontWeight: "600",
        color: colors.white,
        margin: 0,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    userRole: {
        fontSize: "12px",
        color: "#a0aec0",
        margin: 0,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    logoutButton: {
        width: "100%",
        padding: "10px 8px",
        background: "#dc3545",
        color: colors.white,
        border: "1px solid #c53030",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: "500",
        cursor: "pointer",
        transition: "all 0.2s",
    },
};
