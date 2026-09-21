import { useState } from "react";
import { useT } from "@/i18n";

function factorial(n) {
    if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n || n > 170) {
        throw new Error("Factorielle invalide");
    }
    let result = 1;
    for (let i = 2; i <= n; i += 1) {
        result *= i;
    }
    return result;
}

function tokenize(source) {
    const tokens = [];
    const text = source.replace(/\s+/g, "").replace(/,/g, ".");
    let i = 0;
    while (i < text.length) {
        const rest = text.slice(i);
        const fn = rest.match(/^(sin|cos|tan|asin|acos|atan|log|ln|sqrt|abs|exp|fact)/);
        if (fn) {
            tokens.push({ type: "fn", value: fn[1] });
            i += fn[1].length;
            continue;
        }
        if (rest.startsWith("PI")) {
            tokens.push({ type: "num", value: Math.PI });
            i += 2;
            continue;
        }
        if (rest[0] === "π") {
            tokens.push({ type: "num", value: Math.PI });
            i += 1;
            continue;
        }
        const num = rest.match(/^\d+(\.\d+)?([eE][+-]?\d+)?/);
        if (num) {
            tokens.push({ type: "num", value: Number(num[0]) });
            i += num[0].length;
            continue;
        }
        if (rest[0] === "e") {
            tokens.push({ type: "num", value: Math.E });
            i += 1;
            continue;
        }
        if (rest[0] === "(" || rest[0] === ")") {
            tokens.push({ type: rest[0] });
            i += 1;
            continue;
        }
        if ("+-*/^".includes(rest[0])) {
            tokens.push({ type: "op", value: rest[0] });
            i += 1;
            continue;
        }
        throw new Error("Expression invalide");
    }
    return tokens;
}

function evaluate(expression, degrees) {
    const tokens = tokenize(expression.replace(/×/g, "*").replace(/÷/g, "/"));
    let index = 0;

    const peek = () => tokens[index];
    const take = () => tokens[index++];

    const toAngle = (value) => (degrees ? (value * Math.PI) / 180 : value);

    const parseExpression = () => parseAdd();

    const parseAdd = () => {
        let value = parseMul();
        while (peek()?.type === "op" && (peek().value === "+" || peek().value === "-")) {
            const op = take().value;
            const right = parseMul();
            value = op === "+" ? value + right : value - right;
        }
        return value;
    };

    const parseMul = () => {
        let value = parsePow();
        while (peek()?.type === "op" && (peek().value === "*" || peek().value === "/")) {
            const op = take().value;
            const right = parsePow();
            value = op === "*" ? value * right : value / right;
        }
        return value;
    };

    const parsePow = () => {
        let value = parseUnary();
        if (peek()?.type === "op" && peek().value === "^") {
            take();
            const exp = parsePow();
            value = value ** exp;
        }
        return value;
    };

    const parseUnary = () => {
        if (peek()?.type === "op" && peek().value === "+") {
            take();
            return parseUnary();
        }
        if (peek()?.type === "op" && peek().value === "-") {
            take();
            return -parseUnary();
        }
        return parsePrimary();
    };

    const parsePrimary = () => {
        const token = peek();
        if (!token) {
            throw new Error("Expression incomplète");
        }
        if (token.type === "num") {
            take();
            return token.value;
        }
        if (token.type === "fn") {
            const name = take().value;
            if (take()?.type !== "(") {
                throw new Error("Parenthèse manquante");
            }
            const arg = parseExpression();
            if (take()?.type !== ")") {
                throw new Error("Parenthèse manquante");
            }
            const fns = {
                sin: (x) => Math.sin(toAngle(x)),
                cos: (x) => Math.cos(toAngle(x)),
                tan: (x) => Math.tan(toAngle(x)),
                asin: (x) => (degrees ? (Math.asin(x) * 180) / Math.PI : Math.asin(x)),
                acos: (x) => (degrees ? (Math.acos(x) * 180) / Math.PI : Math.acos(x)),
                atan: (x) => (degrees ? (Math.atan(x) * 180) / Math.PI : Math.atan(x)),
                log: (x) => Math.log10(x),
                ln: (x) => Math.log(x),
                sqrt: (x) => Math.sqrt(x),
                abs: (x) => Math.abs(x),
                exp: (x) => Math.exp(x),
                fact: factorial,
            };
            return fns[name](arg);
        }
        if (token.type === "(") {
            take();
            const value = parseExpression();
            if (take()?.type !== ")") {
                throw new Error("Parenthèse manquante");
            }
            return value;
        }
        throw new Error("Expression invalide");
    };

    const value = parseExpression();
    if (index !== tokens.length) {
        throw new Error("Expression invalide");
    }
    if (!Number.isFinite(value)) {
        throw new Error("Résultat non défini");
    }
    return value;
}

const KEYS = [
    ["sin", "cos", "tan", "log", "ln"],
    ["x²", "√", "x^y", "π", "e"],
    ["(", ")", "n!", "1/x", "±"],
    ["7", "8", "9", "÷", "C"],
    ["4", "5", "6", "×", "⌫"],
    ["1", "2", "3", "-", "="],
    ["0", ".", "+", "Ans", "DEG"],
];

export default function ScientificCalculator({ onClose }) {
    const t = useT();
    const [expr, setExpr] = useState("");
    const [output, setOutput] = useState("0");
    const [degrees, setDegrees] = useState(true);
    const [error, setError] = useState("");

    const append = (chunk) => {
        setError("");
        setExpr((current) => current + chunk);
    };

    const press = (key) => {
        if (key === "C") {
            setExpr("");
            setOutput("0");
            setError("");
            return;
        }
        if (key === "⌫") {
            setExpr((current) => current.slice(0, -1));
            return;
        }
        if (key === "DEG") {
            setDegrees((current) => !current);
            return;
        }
        if (key === "Ans") {
            append(output);
            return;
        }
        if (key === "=") {
            try {
                const value = evaluate(expr || "0", degrees);
                const formatted = Number(value.toPrecision(12)).toString();
                setOutput(formatted);
                setExpr(formatted);
                setError("");
            } catch (err) {
                setError(err.message || "Erreur");
            }
            return;
        }
        const map = {
            sin: "sin(",
            cos: "cos(",
            tan: "tan(",
            log: "log(",
            ln: "ln(",
            "x²": "^2",
            "√": "sqrt(",
            "x^y": "^",
            π: "π",
            e: "e",
            "n!": "fact(",
            "1/x": "1/(",
            "±": "*(-1)",
            "÷": "/",
            "×": "*",
        };
        append(map[key] ?? key);
    };

    return (
        <div style={styles.panel}>
            <div style={styles.header}>
                <button type="button" style={styles.close} onClick={onClose}>
                    {t("common.close")}
                </button>
            </div>
            <div style={styles.display}>
                <div style={styles.expr}>{expr || "0"}</div>
                <div style={styles.result}>{error || output}</div>
                <div style={styles.mode}>{degrees ? "DEG" : "RAD"}</div>
            </div>
            <div style={styles.grid}>
                {KEYS.flat().map((key) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => press(key)}
                        style={{
                            ...styles.key,
                            ...(key === "=" ? styles.equals : {}),
                            ...(key === "C" ? styles.clear : {}),
                            ...(key === "DEG" ? styles.modeKey : {}),
                        }}
                    >
                        {key === "DEG" ? (degrees ? "DEG" : "RAD") : key}
                    </button>
                ))}
            </div>
        </div>
    );
}

const styles = {
    panel: {
        width: "min(320px, calc(100vw - 24px))",
        background: "#1a202c",
        border: "1px solid #2d3748",
        borderRadius: "12px",
        padding: "12px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
    },
    header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        marginBottom: "10px",
    },
    close: {
        background: "transparent",
        color: "#a0aec0",
        border: "1px solid #4a5568",
        borderRadius: "6px",
        padding: "4px 8px",
        fontSize: "12px",
        cursor: "pointer",
    },
    display: {
        background: "#0f172a",
        borderRadius: "8px",
        padding: "10px",
        marginBottom: "10px",
        minHeight: "72px",
        position: "relative",
    },
    expr: { color: "#a0aec0", fontSize: "12px", wordBreak: "break-all", minHeight: "16px" },
    result: { color: "white", fontSize: "22px", fontWeight: 700, marginTop: "6px", wordBreak: "break-all" },
    mode: { position: "absolute", top: "8px", right: "10px", color: "#63b3ed", fontSize: "11px", fontWeight: 700 },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
        gap: "6px",
    },
    key: {
        border: "none",
        background: "#2d3748",
        color: "white",
        borderRadius: "8px",
        minHeight: "36px",
        fontSize: "12px",
        fontWeight: 600,
        cursor: "pointer",
    },
    equals: { background: "#0d6efd", gridColumn: "span 1" },
    clear: { background: "#c53030" },
    modeKey: { background: "#2b6cb0" },
};
