import { Link, router } from "@inertiajs/react";

export default function Sidebar({ admin, currentPage, isOpen, setIsOpen }) {

    const logout = () => {
        router.post(route("admin.logout"));
    };

    const menuItems = [
        { label: "Tableau de bord", route: "admin.dashboard", icon: "📊" },
        { label: "Employés", route: "admin.employees", icon: "👥" },
        // { label: "Paramètres", route: "admin.settings", icon: "⚙️" },
        // { label: "Rapports", route: "admin.reports", icon: "📈" },
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
                                        ? "#0F6E56"
                                        : "transparent",
                                color:
                                    currentPage === item.route
                                        ? "#ffffff"
                                        : "#cbd5e0",
                                borderLeft:
                                    currentPage === item.route
                                        ? "4px solid #26c281"
                                        : "4px solid transparent",
                            }}
                        >
                            <span style={styles.icon}>{item.icon}</span>
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
        background: "#0F6E56",
        border: "none",
        padding: "10px 14px",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "20px",
        color: "white",
        fontWeight: "bold",
    },
    sidebar: {
        display: "flex",
        flexDirection: "column",
        width: "280px",
        height: "100vh",
        background: "#1a202c",
        borderRight: "1px solid #2d3748",
        padding: "24px 16px",
        boxSizing: "border-box",
        position: "fixed",
        top: 0,
        left: 0,
        transition: "left 0.3s ease",
        zIndex: 1000,
    },
    logoSection: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginBottom: "32px",
        paddingBottom: "20px",
        borderBottom: "1px solid #2d3748",
    },
    logo: {
        width: "44px",
        height: "44px",
        background: "#0F6E56",
        borderRadius: "10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontWeight: "700",
        fontSize: "16px",
        flexShrink: 0,
    },
    appName: {
        fontSize: "16px",
        fontWeight: "600",
        color: "#ffffff",
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
        color: "#cbd5e0",
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
        borderTop: "1px solid #2d3748",
    },
    userCard: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginBottom: "16px",
        padding: "12px",
        background: "#2d3748",
        borderRadius: "8px",
    },
    userAvatar: {
        width: "40px",
        height: "40px",
        background: "#0F6E56",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
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
        color: "#ffffff",
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
        color: "#ffffff",
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
