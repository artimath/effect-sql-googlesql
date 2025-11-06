/**
 * GoogleSQL function helpers.
 *
 * @since 1.0.0
 */
import * as Statement from "@effect/sql/Statement";
/**
 * Wraps an expression in `SAFE_CAST`.
 *
 * @since 1.0.0
 */
export declare const safeCast: (expression: string, targetType: string) => Statement.Fragment;
/**
 * Calls `JSON_VALUE` for the provided JSON path.
 *
 * @since 1.0.0
 */
export declare const jsonValue: (expression: string, path: string) => Statement.Fragment;
/**
 * Calls `JSON_QUERY` for the provided JSON path.
 *
 * @since 1.0.0
 */
export declare const jsonQuery: (expression: string, path: string) => Statement.Fragment;
/**
 * Calls `JSON_EXISTS` with a boolean default of FALSE when NULL.
 *
 * @since 1.0.0
 */
export declare const jsonExists: (expression: string, path: string) => Statement.Fragment;
/**
 * Wraps an expression in `SAFE_OFFSET`.
 *
 * @since 1.0.0
 */
export declare const safeOffset: (expression: string, offset: number) => Statement.Fragment;
//# sourceMappingURL=Helpers.d.ts.map