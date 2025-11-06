/**
 * GoogleSQL compiler helpers for Effect SQL.
 *
 * @since 1.0.0
 */
import * as Statement from "@effect/sql/Statement";
import { codec } from "@google-cloud/spanner/build/src/codec.js";
const escapeBacktick = Statement.defaultEscape("`");
const quoteIdentifier = (value) => escapeBacktick(value);
const ParamTypesSymbol = Symbol.for("@org/effect-sql-googlesql/param-types");
const typedParam = Statement.custom("GoogleSqlTypedParam");
export const types = Object.freeze({
    string: () => ({ code: "STRING" }),
    int64: () => ({ code: "INT64" }),
    float64: () => ({ code: "FLOAT64" }),
    bool: () => ({ code: "BOOL" }),
    json: () => ({ code: "JSON" }),
    bytes: () => ({ code: "BYTES" }),
    timestamp: () => ({ code: "TIMESTAMP" }),
    date: () => ({ code: "DATE" }),
    array: (element) => ({ code: "ARRAY", arrayElementType: element }),
});
const normalizeTypeHint = (hint) => {
    if (!hint) {
        return undefined;
    }
    if (typeof hint === "string") {
        return codec.createTypeObject(hint.toLowerCase());
    }
    return hint;
};
export const paramOf = (type, value) => typedParam(value, normalizeTypeHint(type), undefined);
export const nullOf = (type) => typedParam(null, normalizeTypeHint(type), undefined);
export const attachParamTypesMetadata = (params, metadata) => {
    if (!metadata.some((type) => type !== undefined)) {
        return;
    }
    Object.defineProperty(params, ParamTypesSymbol, {
        value: Object.freeze(metadata.slice()),
        enumerable: false,
        configurable: false,
        writable: false,
    });
};
export const getParamTypeMetadata = (params) => {
    const candidate = params[ParamTypesSymbol];
    return Array.isArray(candidate) ? candidate : undefined;
};
const makeOnIdentifier = (options) => {
    const transform = options?.transformQueryNames;
    if (!transform) {
        return (value) => quoteIdentifier(value);
    }
    return (value, withoutTransform) => quoteIdentifier(withoutTransform ? value : transform(value));
};
const replaceReturning = (sql) => sql.includes("RETURNING") ? sql.replace(/\bRETURNING\b/g, "THEN RETURN") : sql;
/**
 * Create a GoogleSQL compiler with Effect SQL.
 *
 * @since 1.0.0
 */
export const makeCompiler = (options) => {
    let activeCollector;
    let currentParamIndex = 0;
    const inferType = (value) => {
        try {
            const friendly = codec.getType(value);
            const friendlyType = friendly?.type;
            if (!friendlyType || friendlyType === "unspecified") {
                return undefined;
            }
            return codec.createTypeObject(friendly);
        }
        catch {
            return undefined;
        }
    };
    const base = Statement.makeCompiler({
        dialect: "pg",
        placeholder(index) {
            return `@param${index}`;
        },
        onIdentifier: makeOnIdentifier(options),
        onCustom(type, placeholder, _withoutTransform) {
            if (type.kind === "GoogleSqlTypedParam") {
                const sqlPlaceholder = placeholder(type.i0);
                if (activeCollector) {
                    const hint = normalizeTypeHint(type.i1);
                    if (hint) {
                        activeCollector[currentParamIndex - 1] = hint;
                    }
                }
                return [sqlPlaceholder, [type.i0]];
            }
            return ["", []];
        },
        onRecordUpdate(placeholders, alias, columns, values, returning) {
            const returningSql = returning ? ` RETURNING ${returning[0]}` : "";
            const returningBinds = returning ? returning[1] : [];
            return [
                `(VALUES ${placeholders}) AS ${alias}${columns}${returningSql}`,
                values.flat().concat(returningBinds),
            ];
        },
    });
    const wrapCompiler = (compiler) => {
        const originalCompile = compiler.compile.bind(compiler);
        const wrapped = Object.create(compiler);
        wrapped.compile = (statement, withoutTransform = false, placeholderOverride) => {
            currentParamIndex = 0;
            const placeholder = (value) => {
                currentParamIndex += 1;
                const sql = placeholderOverride ? placeholderOverride(value) : `@param${currentParamIndex}`;
                if (activeCollector) {
                    const inferred = inferType(value);
                    if (inferred) {
                        activeCollector[currentParamIndex - 1] = inferred;
                    }
                }
                return sql;
            };
            activeCollector = [];
            const result = originalCompile(statement, withoutTransform, placeholder);
            const sql = result[0];
            const params = result[1];
            if (activeCollector) {
                attachParamTypesMetadata(params, activeCollector);
            }
            activeCollector = undefined;
            const rewritten = replaceReturning(sql);
            return rewritten === sql ? result : [rewritten, params];
        };
        Object.defineProperty(wrapped, "withoutTransform", {
            get() {
                return wrapCompiler(compiler.withoutTransform);
            },
        });
        return wrapped;
    };
    return wrapCompiler(base);
};
/**
 * Default GoogleSQL compiler instance.
 *
 * @since 1.0.0
 */
export const compiler = makeCompiler();
//# sourceMappingURL=Compiler.js.map