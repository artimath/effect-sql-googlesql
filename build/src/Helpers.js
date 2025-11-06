/**
 * GoogleSQL function helpers.
 *
 * @since 1.0.0
 */
import * as Statement from "@effect/sql/Statement";
const escapeSingleQuotes = (value) => value.replace(/'/g, "''");
/**
 * Wraps an expression in `SAFE_CAST`.
 *
 * @since 1.0.0
 */
export const safeCast = (expression, targetType) => Statement.unsafeFragment(`SAFE_CAST(${expression} AS ${targetType})`);
/**
 * Calls `JSON_VALUE` for the provided JSON path.
 *
 * @since 1.0.0
 */
export const jsonValue = (expression, path) => Statement.unsafeFragment(`JSON_VALUE(${expression}, '${escapeSingleQuotes(path)}')`);
/**
 * Calls `JSON_QUERY` for the provided JSON path.
 *
 * @since 1.0.0
 */
export const jsonQuery = (expression, path) => Statement.unsafeFragment(`JSON_QUERY(${expression}, '${escapeSingleQuotes(path)}')`);
/**
 * Calls `JSON_EXISTS` with a boolean default of FALSE when NULL.
 *
 * @since 1.0.0
 */
export const jsonExists = (expression, path) => Statement.unsafeFragment(`IFNULL(JSON_EXISTS(${expression}, '${escapeSingleQuotes(path)}'), FALSE)`);
/**
 * Wraps an expression in `SAFE_OFFSET`.
 *
 * @since 1.0.0
 */
export const safeOffset = (expression, offset) => Statement.unsafeFragment(`SAFE_OFFSET(${expression}, ${offset})`);
//# sourceMappingURL=Helpers.js.map