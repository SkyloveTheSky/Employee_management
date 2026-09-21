import { Head, router, usePage } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";
import BrandMark from "@/Components/BrandMark";
import ConfirmDialog from "@/Components/ConfirmDialog";
import HeaderTools from "@/Components/HeaderTools";
import Sidebar from "@/Components/User/Sidebar";
import { colors } from "@/config/colors";
import { useSidebar } from "@/hooks/useSidebar";
import { useT } from "@/i18n";

export default function Index({ path = "", crumbs = [], folders = [], files = [], q = "", canWrite = true }) {
    const t = useT();
    const page = usePage().props;
    const user = page.auth?.user;
    const flash = page.flash || {};
    const errors = page.errors || {};
    const folderList = Array.isArray(folders) ? folders : Object.values(folders || {});
    const fileList = Array.isArray(files) ? files : Object.values(files || {});
    const { isOpen, setIsOpen, offset } = useSidebar();
    const [query, setQuery] = useState(q || "");
    const [preview, setPreview] = useState(null);
    const [pendingDelete, setPendingDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const fileInput = useRef(null);

    useEffect(() => {
        setQuery(q || "");
    }, [q, path]);

    useEffect(() => {
        const next = query.trim();
        const current = (q || "").trim();
        if (next === current) return undefined;
        const timer = setTimeout(() => {
            router.get("/files", {
                ...(path ? { path } : {}),
                ...(next ? { q: next } : {}),
            }, { preserveState: true, preserveScroll: true, replace: true });
        }, 350);
        return () => clearTimeout(timer);
    }, [query, path, q]);

    const openPath = (next = "") => {
        router.get("/files", next ? { path: next } : {}, { preserveState: true });
    };

    const uploadFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        router.post("/files/upload", { path, file }, {
            forceFormData: true,
            preserveScroll: true,
            onFinish: () => {
                if (fileInput.current) fileInput.current.value = "";
            },
        });
    };

    const removeItem = (item, isFolder) => {
        setPendingDelete({
            path: item.path,
            isFolder,
            name: item.name,
        });
    };

    const confirmDelete = () => {
        if (!pendingDelete) return;
        setDeleting(true);
        router.delete("/files", {
            data: { path: pendingDelete.path },
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setPendingDelete(null);
            },
        });
    };

    return (
        <>
            <Head title={t("files.title")} />
            <Sidebar user={user} currentPage="files.index" isOpen={isOpen} setIsOpen={setIsOpen} />
            <div className="app-page" style={{ ...styles.page, marginLeft: offset }}>
                <div className="app-header" style={styles.header}>
                    <BrandMark />
                    <div>
                        <h1 style={styles.title}>{t("files.title")}</h1>
                        <p style={styles.subtitle}>{t("files.subtitle")}</p>
                    </div>
                    <HeaderTools />
                </div>

                {flash?.success && <p style={styles.success}>{flash.success}</p>}
                {errors?.name && <p style={styles.error}>{errors.name}</p>}
                {errors?.file && <p style={styles.error}>{errors.file}</p>}
                {errors?.path && <p style={styles.error}>{errors.path}</p>}

                <div style={styles.toolbar}>
                    <nav style={styles.crumbs}>
                        <button type="button" style={styles.crumb} onClick={() => openPath("")}>{t("files.title")}</button>
                        {crumbs.map((crumb) => (
                            <span key={crumb.path} style={styles.crumbWrap}>
                                <span style={styles.sep}>/</span>
                                <button type="button" style={styles.crumb} onClick={() => openPath(crumb.path)}>
                                    {crumb.name}
                                </button>
                            </span>
                        ))}
                    </nav>
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t("common.search")}
                        style={styles.search}
                    />
                    {canWrite && (
                        <div style={styles.actions}>
                            <button type="button" style={styles.secondary} onClick={() => fileInput.current?.click()}>
                                {t("files.upload")}
                            </button>
                            <input ref={fileInput} type="file" hidden onChange={uploadFile} />
                        </div>
                    )}
                </div>

                {folderList.length === 0 && fileList.length === 0 ? (
                    <div style={styles.empty}>{q ? t("files.noResults") : t("files.empty")}</div>
                ) : (
                    <div className="app-cards" style={styles.grid}>
                        {folderList.map((folder) => (
                            <div key={folder.path} style={styles.card}>
                                <button type="button" style={styles.cardMain} onClick={() => openPath(folder.path)}>
                                    <img src="/assets/icon/file-manager.svg" alt="" style={styles.folderIcon} />
                                    <span style={styles.cardName}>{folderLabel(folder.name, t)}</span>
                                    <span style={styles.meta}>
                                        {folder.location && folder.location !== "." ? `${folder.location} · ` : ""}
                                        {t(folder.items > 1 ? "files.items_plural" : "files.items", { count: folder.items })}
                                    </span>
                                </button>
                                {!folder.locked && (
                                    <button type="button" style={styles.delete} onClick={() => removeItem(folder, true)}>
                                        {t("files.delete")}
                                    </button>
                                )}
                            </div>
                        ))}
                        {fileList.map((file) => (
                            <div key={file.path} style={styles.card}>
                                <button
                                    type="button"
                                    style={styles.cardMain}
                                    onClick={() => (file.preview ? setPreview(file) : window.open(file.download))}
                                >
                                    {file.preview ? (
                                        <img src={file.url} alt="" style={styles.thumb} />
                                    ) : (
                                        <div style={styles.fileBadge}>{ext(file.name)}</div>
                                    )}
                                    <span style={styles.cardName}>{file.name}</span>
                                    <span style={styles.meta}>
                                        {file.location && file.location !== "." ? `${file.location} · ` : ""}
                                        {formatSize(file.size)}
                                    </span>
                                </button>
                                <div style={styles.cardActions}>
                                    <a href={file.download} style={styles.link}>{t("files.download")}</a>
                                    {!file.locked && (
                                        <button type="button" style={styles.delete} onClick={() => removeItem(file, false)}>
                                            {t("files.delete")}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {preview && (
                <div style={styles.overlay} onClick={() => setPreview(null)}>
                    <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <img src={preview.url} alt={preview.name} style={styles.previewImg} />
                        <p style={styles.cardName}>{preview.name}</p>
                        <button type="button" style={styles.secondary} onClick={() => setPreview(null)}>
                            {t("common.close")}
                        </button>
                    </div>
                </div>
            )}
            <ConfirmDialog
                show={!!pendingDelete}
                title={pendingDelete?.isFolder ? t("files.deleteFolderTitle") : t("files.deleteFileTitle")}
                message={
                    pendingDelete?.isFolder
                        ? t("files.deleteFolderBody", { name: pendingDelete.name })
                        : t("files.deleteFileBody", { name: pendingDelete?.name })
                }
                processing={deleting}
                onConfirm={confirmDelete}
                onClose={() => !deleting && setPendingDelete(null)}
            />
        </>
    );
}

function folderLabel(name, t) {
    const labels = {
        documents: t("files.documents"),
        images: t("files.images"),
        payrolls: t("files.payrolls"),
    };
    return labels[name] || name;
}

function ext(name) {
    const part = name.split(".").pop();
    return (part || "FILE").slice(0, 4).toUpperCase();
}

function formatSize(bytes) {
    if (!bytes) return "0 o";
    const units = ["o", "Ko", "Mo", "Go"];
    let index = 0;
    let value = bytes;
    while (value >= 1024 && index < units.length - 1) {
        value /= 1024;
        index += 1;
    }
    return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

const styles = {
    page: { minHeight: "100vh", background: colors.background, fontFamily: "system-ui, sans-serif", padding: "24px", transition: "margin-left 0.3s ease" },
    header: { display: "flex", alignItems: "center", gap: "16px", background: colors.surface, padding: "20px 24px", borderRadius: "12px", marginBottom: "24px", border: `1px solid ${colors.border}` },
    title: { fontSize: "18px", fontWeight: "600", color: colors.dark, margin: 0 },
    subtitle: { fontSize: "13px", color: colors.muted, margin: 0 },
    success: { background: colors.successBg, color: "#276749", padding: "10px 14px", borderRadius: "8px", marginBottom: "16px" },
    error: { color: colors.error, fontSize: "13px", margin: "0 0 12px" },
    toolbar: { display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" },
    search: {
        flex: "1 1 220px",
        minWidth: "180px",
        maxWidth: "360px",
        height: "38px",
        border: `1px solid ${colors.border}`,
        borderRadius: "8px",
        padding: "0 10px",
        fontSize: "13px",
        boxSizing: "border-box",
        fontFamily: "inherit",
    },
    crumbs: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px" },
    crumbWrap: { display: "inline-flex", alignItems: "center", gap: "4px" },
    crumb: { border: "none", background: "transparent", color: colors.btnPrimary, cursor: "pointer", fontSize: "13px", fontWeight: 600, padding: 0 },
    sep: { color: colors.muted },
    actions: { display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" },
    folderForm: { display: "flex", gap: "8px", alignItems: "center" },
    input: { height: "38px", border: `1px solid ${colors.border}`, borderRadius: "8px", padding: "0 10px", fontSize: "13px", boxSizing: "border-box", fontFamily: "inherit" },
    button: { height: "38px", background: colors.btnPrimary, color: "white", border: "none", borderRadius: "8px", padding: "0 12px", fontSize: "13px", fontWeight: 600, cursor: "pointer" },
    secondary: { height: "38px", background: colors.surface, color: colors.dark, border: `1px solid ${colors.border}`, borderRadius: "8px", padding: "0 12px", fontSize: "13px", fontWeight: 600, cursor: "pointer", boxSizing: "border-box" },
    empty: { background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "32px", textAlign: "center", color: colors.muted },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px" },
    card: { background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "12px", display: "flex", flexDirection: "column", gap: "8px" },
    cardMain: { border: "none", background: "transparent", cursor: "pointer", textAlign: "left", display: "flex", flexDirection: "column", gap: "8px", padding: 0 },
    folderIcon: { width: "40px", height: "40px" },
    thumb: { width: "100%", height: "88px", objectFit: "cover", borderRadius: "8px", background: "#f7fafc" },
    fileBadge: { width: "48px", height: "48px", borderRadius: "10px", background: "#edf2f7", color: colors.dark, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700 },
    cardName: { fontSize: "13px", fontWeight: 600, color: colors.dark, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
    meta: { fontSize: "12px", color: colors.muted },
    cardActions: { display: "flex", justifyContent: "space-between", gap: "8px" },
    link: { fontSize: "12px", color: colors.btnPrimary, textDecoration: "none", fontWeight: 600 },
    delete: { border: "none", background: "transparent", color: colors.error, cursor: "pointer", fontSize: "12px", fontWeight: 600, padding: 0, alignSelf: "flex-start" },
    overlay: { position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1300, padding: "16px" },
    modal: { background: colors.surface, borderRadius: "12px", padding: "16px", maxWidth: "min(640px, 100%)", display: "flex", flexDirection: "column", gap: "12px" },
    previewImg: { maxWidth: "100%", maxHeight: "70vh", objectFit: "contain", borderRadius: "8px" },
};
