import { describe, expect, it } from "@effect/vitest";
import * as Statement from "@effect/sql/Statement";
import * as Effect from "effect/Effect";
import { makeCompiler } from "../src/Compiler.js";
import * as Helpers from "../src/Helpers.js";

const dummyAcquirer = Effect.fail(new Error("not used")) as any;

describe("GoogleSQL compiler", () => {
  const compiler = makeCompiler();
  const sql = Statement.make(dummyAcquirer, compiler, [], undefined);

  it("quotes identifiers with backticks and uses @param placeholders", () => {
    const insertHelper = sql.insert({ userId: 1, displayName: "Alice" }).returning("userId");
    const statement = sql`INSERT INTO Project.User ${insertHelper}`;
    const [compiledSql, params] = statement.compile();

    expect(compiledSql).toContain("(`userId`,`displayName`)");
    expect(compiledSql).toContain("@param1");
    expect(compiledSql).toContain("@param2");
    expect(compiledSql).toContain("THEN RETURN");
    expect(params).toEqual([1, "Alice"]);
  });

  it("rewrites RETURNING clauses to THEN RETURN", () => {
    const updateHelper = sql.update({ displayName: "Bob" });
    const statement = sql`UPDATE Project.User SET ${updateHelper} WHERE id = ${1} RETURNING id`;
    const [compiledSql] = statement.compile();

    expect(compiledSql).not.toContain("RETURNING");
    expect(compiledSql).toContain("THEN RETURN id");
  });
});

describe("GoogleSQL helpers", () => {
  it("generates SAFE_CAST expressions", () => {
    const fragment = Helpers.safeCast("value", "INT64");
    const [segment] = fragment.segments;
    expect(segment).toBeDefined();
    if (!segment || segment._tag !== "Literal") {
      throw new Error("expected literal fragment");
    }
    expect(segment.value).toBe("SAFE_CAST(value AS INT64)");
  });

  it("escapes JSON paths", () => {
    const fragment = Helpers.jsonValue("payload", "$.foo['bar']");
    const [segment] = fragment.segments;
    expect(segment).toBeDefined();
    if (!segment || segment._tag !== "Literal") {
      throw new Error("expected literal fragment");
    }
    expect(segment.value).toContain("JSON_VALUE(payload, '$.foo[''bar'']')");
  });
});
