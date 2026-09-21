import { useEffect, useMemo, useRef, useState } from "react";
import { useT } from "@/i18n";

function employeeName(employee) {
    return `${employee.first_name || ""} ${employee.last_name || ""}`.trim();
}

function normalize(value) {
    return String(value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

export default function EmployeePicker({
    employees = [],
    value = "",
    onChange,
    placeholder,
    emptyLabel,
    formatOption,
    allowEmpty = true,
}) {
    const t = useT();
    const searchPlaceholder = placeholder ?? t("common.searchEmployee");
    const emptyOption = emptyLabel ?? t("common.choose");
    const boxRef = useRef(null);
    const inputRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [highlight, setHighlight] = useState(0);

    const selected = employees.find((employee) => String(employee.id) === String(value));
    const selectedLabel = selected
        ? (formatOption ? formatOption(selected) : employeeName(selected))
        : "";

    const filtered = useMemo(() => {
        const needle = normalize(query).trim();
        if (!needle) {
            return employees;
        }

        return employees.filter((employee) => {
            const label = formatOption ? formatOption(employee) : employeeName(employee);
            return normalize(`${employeeName(employee)} ${label}`).includes(needle);
        });
    }, [employees, formatOption, query]);

    const rows = allowEmpty && !normalize(query).trim()
        ? [{ id: "", label: emptyOption }, ...filtered.map((employee) => ({
            id: employee.id,
            label: formatOption ? formatOption(employee) : employeeName(employee),
        }))]
        : filtered.map((employee) => ({
            id: employee.id,
            label: formatOption ? formatOption(employee) : employeeName(employee),
        }));

    useEffect(() => {
        if (!open) {
            return undefined;
        }
        const onPointer = (event) => {
            if (!boxRef.current?.contains(event.target)) {
                setOpen(false);
                setQuery("");
            }
        };
        document.addEventListener("mousedown", onPointer);
        return () => document.removeEventListener("mousedown", onPointer);
    }, [open]);

    useEffect(() => {
        setHighlight(0);
    }, [query, open]);

    const pick = (id) => {
        onChange(id === "" || id == null ? "" : String(id));
        setOpen(false);
        setQuery("");
    };

    const onKeyDown = (event) => {
        if (!open && (event.key === "ArrowDown" || event.key === "Enter")) {
            event.preventDefault();
            setOpen(true);
            return;
        }
        if (!open) {
            return;
        }
        if (event.key === "ArrowDown") {
            event.preventDefault();
            setHighlight((index) => Math.min(index + 1, Math.max(rows.length - 1, 0)));
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setHighlight((index) => Math.max(index - 1, 0));
        } else if (event.key === "Enter") {
            event.preventDefault();
            const row = rows[highlight];
            if (row) {
                pick(row.id);
            }
        } else if (event.key === "Escape") {
            event.preventDefault();
            setOpen(false);
            setQuery("");
        }
    };

    return (
        <div ref={boxRef} style={styles.wrap}>
            <input
                ref={inputRef}
                value={open ? query : selectedLabel}
                placeholder={searchPlaceholder}
                autoComplete="off"
                onFocus={() => {
                    setOpen(true);
                    setQuery("");
                }}
                onChange={(event) => {
                    setQuery(event.target.value);
                    setOpen(true);
                }}
                onKeyDown={onKeyDown}
                style={styles.input}
            />
            {open && (
                <div style={styles.menu} role="listbox">
                    {rows.length === 0 ? (
                        <p style={styles.empty}>{t("common.noEmployeeMatch")}</p>
                    ) : (
                        rows.map((row, index) => (
                            <button
                                key={row.id === "" ? "empty" : row.id}
                                type="button"
                                role="option"
                                aria-selected={String(row.id) === String(value)}
                                onMouseEnter={() => setHighlight(index)}
                                onClick={() => pick(row.id)}
                                style={{
                                    ...styles.option,
                                    ...(index === highlight ? styles.optionActive : {}),
                                    ...(String(row.id) === String(value) ? styles.optionSelected : {}),
                                }}
                            >
                                {row.label}
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

const styles = {
    wrap: { position: "relative" },
    input: {
        width: "100%",
        border: "1px solid #cbd5e0",
        borderRadius: "8px",
        padding: "9px 10px",
        fontSize: "13px",
        boxSizing: "border-box",
        fontFamily: "inherit",
    },
    menu: {
        position: "absolute",
        zIndex: 20,
        left: 0,
        right: 0,
        top: "calc(100% + 4px)",
        maxHeight: "240px",
        overflowY: "auto",
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
    },
    option: {
        display: "block",
        width: "100%",
        textAlign: "left",
        border: "none",
        background: "white",
        padding: "8px 10px",
        fontSize: "13px",
        color: "#2d3748",
        cursor: "pointer",
        fontFamily: "inherit",
    },
    optionActive: { background: "#edf2f7" },
    optionSelected: { fontWeight: 600 },
    empty: { margin: 0, padding: "10px", fontSize: "13px", color: "#718096" },
};
