/**
 * GoogleSQL compiler helpers for Effect SQL.
 *
 * @since 1.0.0
 */
import * as Statement from "@effect/sql/Statement";
import { google as SpannerProto } from "@google-cloud/spanner/build/protos/protos.js";
/**
 * Options for creating a GoogleSQL compiler.
 *
 * @since 1.0.0
 */
export interface GoogleSqlCompilerOptions {
    /**
     * Optional identifier transformer (e.g. camelCase → snake_case).
     */
    readonly transformQueryNames?: (value: string) => string;
}
export interface TypedParamSegment extends Statement.Custom<"GoogleSqlTypedParam", unknown, string | SpannerType | undefined> {
}
type SpannerType = SpannerProto.spanner.v1.IType;
export declare const types: Readonly<{
    readonly string: () => SpannerType;
    readonly int64: () => SpannerType;
    readonly float64: () => SpannerType;
    readonly bool: () => SpannerType;
    readonly json: () => SpannerType;
    readonly bytes: () => SpannerType;
    readonly timestamp: () => SpannerType;
    readonly date: () => SpannerType;
    readonly array: (element: SpannerType) => SpannerType;
}>;
export declare const paramOf: (type: SpannerType | string, value: unknown) => Statement.Fragment;
export declare const nullOf: (type: SpannerType | string) => Statement.Fragment;
export declare const attachParamTypesMetadata: (params: ReadonlyArray<Statement.Primitive>, metadata: ReadonlyArray<SpannerType | undefined>) => void;
export declare const getParamTypeMetadata: (params: ReadonlyArray<Statement.Primitive>) => ReadonlyArray<SpannerType | undefined> | undefined;
/**
 * Create a GoogleSQL compiler with Effect SQL.
 *
 * @since 1.0.0
 */
export declare const makeCompiler: (options?: GoogleSqlCompilerOptions) => Statement.Compiler;
/**
 * Default GoogleSQL compiler instance.
 *
 * @since 1.0.0
 */
export declare const compiler: Statement.Compiler;
export {};
//# sourceMappingURL=Compiler.d.ts.map