/**
 * GoogleSQL compiler helpers for Effect SQL.
 *
 * @since 1.0.0
 */
import * as Statement from "@effect/sql/Statement";
import { codec } from "@google-cloud/spanner/build/src/codec.js";
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

const escapeBacktick = Statement.defaultEscape("`");

const quoteIdentifier = (value: string): string => escapeBacktick(value);

const ParamTypesSymbol: unique symbol = Symbol.for("@org/effect-sql-googlesql/param-types");

export interface TypedParamSegment
  extends Statement.Custom<"GoogleSqlTypedParam", unknown, string | SpannerType | undefined> {}

type SpannerType = SpannerProto.spanner.v1.IType;

const typedParam = Statement.custom<TypedParamSegment>("GoogleSqlTypedParam");

export const types = Object.freeze({
  string: (): SpannerType => ({ code: "STRING" }),
  int64: (): SpannerType => ({ code: "INT64" }),
  float64: (): SpannerType => ({ code: "FLOAT64" }),
  bool: (): SpannerType => ({ code: "BOOL" }),
  json: (): SpannerType => ({ code: "JSON" }),
  bytes: (): SpannerType => ({ code: "BYTES" }),
  timestamp: (): SpannerType => ({ code: "TIMESTAMP" }),
  date: (): SpannerType => ({ code: "DATE" }),
  array: (element: SpannerType): SpannerType => ({ code: "ARRAY", arrayElementType: element }),
} as const);

const normalizeTypeHint = (hint: SpannerType | string | undefined): SpannerType | undefined => {
  if (!hint) {
    return undefined;
  }
  if (typeof hint === "string") {
    return codec.createTypeObject(hint.toLowerCase()) as SpannerType;
  }
  return hint;
};

export const paramOf = (type: SpannerType | string, value: unknown): Statement.Fragment =>
  typedParam(value, normalizeTypeHint(type), undefined);

export const nullOf = (type: SpannerType | string): Statement.Fragment =>
  typedParam(null, normalizeTypeHint(type), undefined);

export const attachParamTypesMetadata = (
  params: ReadonlyArray<Statement.Primitive>,
  metadata: ReadonlyArray<SpannerType | undefined>,
) => {
  if (!metadata.some((type) => type !== undefined)) {
    return;
  }
  Object.defineProperty(params as object, ParamTypesSymbol, {
    value: Object.freeze(metadata.slice()),
    enumerable: false,
    configurable: false,
    writable: false,
  });
};

export const getParamTypeMetadata = (
  params: ReadonlyArray<Statement.Primitive>,
): ReadonlyArray<SpannerType | undefined> | undefined => {
  const candidate = (params as any)[ParamTypesSymbol] as
    | ReadonlyArray<SpannerType | undefined>
    | undefined;
  return Array.isArray(candidate) ? candidate : undefined;
};

const makeOnIdentifier = (
  options: GoogleSqlCompilerOptions | undefined,
): ((value: string, withoutTransform: boolean) => string) => {
  const transform = options?.transformQueryNames;
  if (!transform) {
    return (value) => quoteIdentifier(value);
  }
  return (value, withoutTransform) =>
    quoteIdentifier(withoutTransform ? value : transform(value));
};

const replaceReturning = (sql: string): string =>
  sql.includes("RETURNING") ? sql.replace(/\bRETURNING\b/g, "THEN RETURN") : sql;

/**
 * Create a GoogleSQL compiler with Effect SQL.
 *
 * @since 1.0.0
 */
export const makeCompiler = (
  options?: GoogleSqlCompilerOptions,
): Statement.Compiler => {
  let activeCollector: Array<SpannerType | undefined> | undefined;
  let currentParamIndex = 0;

  const inferType = (value: unknown): SpannerType | undefined => {
    try {
      const friendly = codec.getType(value as any);
      const friendlyType = friendly?.type;
      if (!friendlyType || friendlyType === "unspecified") {
        return undefined;
      }
      return codec.createTypeObject(friendly);
    } catch {
      return undefined;
    }
  };

  const base = Statement.makeCompiler<TypedParamSegment>({
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
        return [sqlPlaceholder, [type.i0] as unknown as ReadonlyArray<Statement.Primitive>];
      }
      return ["", []];
    },
    onRecordUpdate(placeholders, alias, columns, values, returning) {
      const returningSql = returning ? ` RETURNING ${returning[0]}` : "";
      const returningBinds = returning ? returning[1] : [];
      return [
        `(VALUES ${placeholders}) AS ${alias}${columns}${returningSql}`,
        (values.flat() as ReadonlyArray<Statement.Primitive>).concat(returningBinds),
      ];
    },
  });

  const wrapCompiler = (compiler: Statement.Compiler): Statement.Compiler => {
    const originalCompile = compiler.compile.bind(compiler);
    const wrapped = Object.create(compiler);

    wrapped.compile = (
      statement: Statement.Fragment,
      withoutTransform = false,
      placeholderOverride?: (value: unknown) => string,
    ) => {
      currentParamIndex = 0;
      const placeholder = (value: unknown) => {
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
      const result = (originalCompile as any)(statement, withoutTransform, placeholder) as readonly [
        string,
        ReadonlyArray<Statement.Primitive>,
      ];
      const sql = result[0];
      const params = result[1];
      if (activeCollector) {
        attachParamTypesMetadata(params, activeCollector);
      }
      activeCollector = undefined;
      const rewritten = replaceReturning(sql);
      return rewritten === sql ? result : [rewritten, params] as const;
    };

    Object.defineProperty(wrapped, "withoutTransform", {
      get() {
        return wrapCompiler(compiler.withoutTransform);
      },
    });

    return wrapped as Statement.Compiler;
  };

  return wrapCompiler(base);
};

/**
 * Default GoogleSQL compiler instance.
 *
 * @since 1.0.0
 */
export const compiler: Statement.Compiler = makeCompiler();
