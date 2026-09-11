import { Link, router } from "@inertiajs/react";
import { colors } from "@/config/colors";

export default function Sidebar({ user, currentPage, isOpen, setIsOpen }) {
    const logout = () => {
        router.post(route("logout"));
    };

    const menuItems = [
        { label: "Tableau de bord", route: "dashboard", icon: "/assets/icon/dashboard.svg" },
        { label: "Mes fiches de paie", route: "payrolls.index", icon: "/assets/icon/payroll.svg" },
        { label: "Paramètres", route: "profile.edit", icon: "/assets/icon/gear.svg" },
    ];

    return (
        <>
            <button onClick={() => setIsOpen(!isOpen)} style={styles.toggleButton}>
                {isOpen ? "✕" : "☰"}
            </button>

            <div style={{ ...styles.sidebar, left: isOpen ? "0" : "-280px" }}>
                <div style={styles.logoSection}>
                    <div style={styles.logo}>RH</div>
                    <h2 style={styles.appName}>Espace Utilisateur</h2>
                </div>

                <nav style={styles.nav}>
                    <p style={styles.sectionTitle}>Menu Principal</p>
                    {menuItems.map((item) => (
                        <Link
                            key={item.route}
                            href={route(item.route)}
                            style={{
                                ...styles.navItem,
                                background: currentPage === item.route ? colors.primary : "transparent",
                                color: currentPage === item.route ? colors.white : colors.light,
                                borderLeft:
                                    currentPage === item.route
                                        ? `4px solid ${colors.primaryLight}`
                                        : "4px solid transparent",
                            }}
                        >
                            <img src={item.icon} alt={item.label} style={styles.iconImg} />
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div style={styles.userSection}>
                    <div style={styles.userCard}>
                        <div style={styles.userAvatar}>
                            {user?.photo_path ? (
                                <img src={`/storage/${user.photo_path}`} alt="" style={styles.userAvatarImg} />
                            ) : (
                                <>
                                    {user?.first_name?.charAt(0)}
                                    {user?.last_name?.charAt(0)}
                                </>
                            )}
                        </div>
                        <div style={styles.userInfo}>
                            <p style={styles.userName}>
                                {user?.first_name} {user?.last_name}
                            </p>
                            <p style={styles.userRole}>{user?.position || "Utilisateur"}</p>
                        </div>
                    </div>

                    <button onClick={logout} style={styles.logoutButton}>
                        Se déconnecter
                    </button>
                </div>
            </div>
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
    logoSection: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginBottom: "32px",
        paddingBottom: "20px",
        borderBottom: `1px solid ${colors.sidebarElevated}`,
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
    iconImg: {
        width: "20px",
        height: "20px",
        filter: "invert(1)",
        flexShrink: 0,
    },
    userSection: {
        paddingTop: "20px",
        borderTop: `1px solid ${colors.sidebarElevated}`,
    },
    userCard: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginBottom: "16px",
        padding: "12px",
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
        overflow: "hidden",
    },
    userAvatarImg: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
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
        background: colors.error,
        color: colors.white,
        border: "1px solid #c53030",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: "500",
        cursor: "pointer",
        transition: "all 0.2s",
    },
};
