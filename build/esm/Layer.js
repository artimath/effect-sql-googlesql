import * as Context from "effect/Context";
import * as Layer from "effect/Layer";
import { makeCompiler } from "./Compiler.js";
/**
 * Context tag carrying a GoogleSQL compiler instance.
 *
 * @since 1.0.0
 */
export const GoogleSqlCompiler = Context.GenericTag("@org/effect-sql-googlesql/Compiler");
/**
 * Builds a layer that installs a GoogleSQL compiler in the Effect context.
 *
 * @since 1.0.0
 */
export const layer = (options) => Layer.succeedContext(Context.make(GoogleSqlCompiler, makeCompiler(options)));
//# sourceMappingURL=Layer.js.map