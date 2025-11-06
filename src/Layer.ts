/**
 * Layer utilities for consuming the GoogleSQL compiler via Context.
 *
 * @since 1.0.0
 */
import * as Statement from "@effect/sql/Statement";
import * as Context from "effect/Context";
import * as Layer from "effect/Layer";
import type { GoogleSqlCompilerOptions } from "./Compiler.js";
import { makeCompiler } from "./Compiler.js";

/**
 * Context tag carrying a GoogleSQL compiler instance.
 *
 * @since 1.0.0
 */
export const GoogleSqlCompiler = Context.GenericTag<Statement.Compiler>(
  "@org/effect-sql-googlesql/Compiler",
);

/**
 * Builds a layer that installs a GoogleSQL compiler in the Effect context.
 *
 * @since 1.0.0
 */
export const layer = (
  options?: GoogleSqlCompilerOptions,
): Layer.Layer<never, never, typeof GoogleSqlCompiler> =>
  Layer.succeedContext(Context.make(GoogleSqlCompiler, makeCompiler(options)));
