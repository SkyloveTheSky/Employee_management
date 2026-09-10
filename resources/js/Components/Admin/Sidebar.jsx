import { Link, router } from "@inertiajs/react";
import { colors, gradients } from "@/config/colors";

export default function Sidebar({ admin, currentPage, isOpen, setIsOpen }) {

    const logout = () => {
        router.post(route("admin.logout"));
    };

    const menuItems = [
        { label: "Tableau de bord", route: "admin.dashboard", icon: "/assets/icon/dashboard.svg", isSvg: true },
        { label: "Employés",        route: "admin.employees",              icon: "/assets/icon/users.svg", isSvg: true },
        { label: "Paie",        route: "admin.payrolls.index",         icon: "/assets/icon/payroll.svg", isSvg: true },
        { label: "Entreprise",      route: "admin.settings.company.edit",  icon: "/assets/icon/building.svg", isSvg: true },
    ];

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={styles.toggleButton}
            >
                {isOpen ? "✕" : "☰"}
            </button>

            {/* Sidebar */}
            <div style={{ ...styles.sidebar, left: isOpen ? "0" : "-280px" }}>
                {/* Logo Section */}
                <div style={styles.logoSection}>
                    <div style={styles.logo}>RH</div>
                    <h2 style={styles.appName}>Management</h2>
                </div>

                {/* Navigation Menu */}
                <nav style={styles.nav}>
                    <p style={styles.sectionTitle}>Menu Principal</p>
                    {menuItems.map((item) => (
                        <Link
                            key={item.route}
                            href={route(item.route)}
                            style={{
                                ...styles.navItem,
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
                                        ? `4px solid ${colors.accent}`
                                        : "4px solid transparent",
                            }}
                        >
                            {item.isSvg
                                ? <img src={item.icon} alt={item.label} style={styles.iconImg} />
                                : <span style={styles.icon}>{item.icon}</span>
                            }
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {/* User Profile Section */}
                <div style={styles.userSection}>
                    <div style={styles.userCard}>
                        <div style={styles.userAvatar}>
                            {admin.first_name_admin?.charAt(0)}
                            {admin.name_admin?.charAt(0)}
                        </div>
                        <div style={styles.userInfo}>
                            <p style={styles.userName}>
                                {admin.first_name_admin} {admin.name_admin}
                            </p>
                            <p style={styles.userRole}>{admin.post_admin}</p>
                        </div>
                    </div>

                    <button onClick={logout} style={styles.logoutButton}>
                        Se déconnecter
                    </button>
                </div>
            </div>

            {/* Overlay for mobile */}
            {/* Removed: overlay now allows clicking on content without closing sidebar */}
        </>
    );
}

const styles = {
    toggleButton: {
        position: "fixed",
        top: "16px",
        left: "16px",
        zIndex: 1001,
        background: colors.primary,
        border: "none",
        padding: "10px 14px",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "20px",
        color: colors.white,
        fontWeight: "bold",
    },
    sidebar: {
        display: "flex",
        flexDirection: "column",
        width: "280px",
        height: "100vh",
        background: colors.primaryDark,
        borderRight: `1px solid ${colors.dark}`,
        padding: "24px 16px",
        boxSizing: "border-box",
        position: "fixed",
        top: 0,
        left: 0,
        transition: "left 0.3s ease",
        zIndex: 1000,
    },
    icon: {
        fontSize: "18px",
    },

    iconImg: {
        width: "20px",
        height: "20px",
        filter: "invert(1)",
    },
    logoSection: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginBottom: "32px",
        paddingBottom: "20px",
        borderBottom: `1px solid ${colors.dark}`,
    },
    logo: {
        width: "44px",
        height: "44px",
        background: colors.primary,
        borderRadius: "10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: colors.white,
        fontWeight: "700",
        fontSize: "16px",
        flexShrink: 0,
    },
    appName: {
        fontSize: "16px",
        fontWeight: "600",
        color: colors.white,
        margin: 0,
    },
    nav: {
        flex: 1,
        overflow: "auto",
    },
    sectionTitle: {
        fontSize: "12px",
        fontWeight: "600",
        color: "#a0aec0",
        textTransform: "uppercase",
        margin: "0 0 12px",
        paddingLeft: "12px",
    },
    navItem: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px 12px",
        borderRadius: "8px",
        textDecoration: "none",
        color: colors.light,
        fontSize: "14px",
        fontWeight: "500",
        cursor: "pointer",
        transition: "all 0.2s",
        marginBottom: "4px",
    },
    icon: {
        fontSize: "18px",
    },
    userSection: {
        paddingTop: "20px",
        borderTop: `1px solid ${colors.dark}`,
    },
    userCard: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginBottom: "16px",
        padding: "12px",
        background: gradients.primary,
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
        padding: "10px 12px",
        background: "#e53e3e",
        color: colors.white,
        border: "1px solid #c53030",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: "500",
        cursor: "pointer",
        transition: "all 0.2s",
    },
    overlay: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.5)",
        zIndex: 999,
    },
};
