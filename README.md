# effect-sql-googlesql

GoogleSQL compiler for [@effect/sql](https://github.com/Effect-TS/effect/tree/main/packages/sql) with Cloud Spanner support.

## Features

- 🎯 Type-safe GoogleSQL query compilation
- ☁️ Cloud Spanner type hints for parameters
- 🔒 Proper escaping with backticks
- ⚡ Built for production use with Effect.ts

## Installation

```bash
pnpm add effect-sql-googlesql @effect/sql effect
```

## Usage

This package is typically consumed via effect-sql-spanner, not used directly. It provides the GoogleSQL compiler that translates Effect SQL statements to Spanner-compatible GoogleSQL.

### Type Hints for Spanner Parameters

GoogleSQL/Spanner requires explicit type hints for parameters in some contexts:

```typescript
import * as Compiler from "effect-sql-googlesql/Compiler"
import * as Statement from "@effect/sql/Statement"

// Use paramOf for typed parameters
const jsonData = { user: "alice", role: "admin" }
const fragment = Compiler.paramOf(Compiler.types.json(), jsonData)

// Available types:
Compiler.types.string()
Compiler.types.int64()
Compiler.types.float64()
Compiler.types.bool()
Compiler.types.json()
Compiler.types.bytes()
Compiler.types.timestamp()
Compiler.types.date()
Compiler.types.array(Compiler.types.string())  // Array types
```

### Creating a Compiler

```typescript
import { makeCompiler } from "effect-sql-googlesql/Compiler"

const compiler = makeCompiler({
  // Optional: transform column names (e.g. camelCase → snake_case)
  transformQueryNames: (name) => name
})

// Compile statements manually (rare - usually handled by @effect/sql)
const statement = Statement.make`SELECT * FROM users WHERE id = ${userId}`
const [sql, params] = compiler.compile(statement)
```

### Using as Effect Layer

```typescript
import * as Layer from "effect-sql-googlesql/Layer"
import * as Sql from "@effect/sql"
import * as Effect from "effect/Effect"

// Provide compiler via layer
const GoogleSqlCompilerLayer = Layer.layer({
  transformQueryNames: (name) => name
})

const program = Effect.gen(function* () {
  const sql = yield* Sql.client.Client

  // Compiler is used automatically by @effect/sql
  const users = yield* sql`SELECT * FROM users WHERE active = ${true}`

  return users
})
```

### Null Values with Type Hints

```typescript
import { nullOf, types } from "effect-sql-googlesql/Compiler"

// Create typed null values
const fragment = Statement.make`INSERT INTO users (data) VALUES (${nullOf(types.json())})`
```

## API Reference

### `makeCompiler(options?)`

Creates a GoogleSQL compiler instance.

**Parameters:**
- `options.transformQueryNames?: (value: string) => string` - Optional transformer for identifiers

**Returns:** `Statement.Compiler`

### `paramOf(type, value)`

Creates a typed parameter for GoogleSQL with explicit Spanner type hints.

**Parameters:**
- `type` - Spanner type from `types` object or string type code
- `value` - The parameter value

**Returns:** `Statement.Fragment`

### `nullOf(type)`

Creates a typed null parameter.

**Parameters:**
- `type` - Spanner type from `types` object or string type code

**Returns:** `Statement.Fragment`

### `types`

Spanner data type constructors:

```typescript
types.string()     // STRING
types.int64()      // INT64
types.float64()    // FLOAT64
types.bool()       // BOOL
types.json()       // JSON
types.bytes()      // BYTES
types.timestamp()  // TIMESTAMP
types.date()       // DATE
types.array(elementType)  // ARRAY<T>
```

### `layer(options?)`

Creates an Effect Layer that provides the GoogleSQL compiler.

**Parameters:**
- `options` - Same as `makeCompiler()`

**Returns:** `Layer.Layer<never, never, typeof GoogleSqlCompiler>`

### `compiler`

Default compiler instance (no name transformation).

**Type:** `Statement.Compiler`

## How It Works

1. Takes Effect SQL statements (using `@effect/sql/Statement`)
2. Compiles to GoogleSQL dialect:
   - Escapes identifiers with backticks: `` `table_name` ``
   - Converts placeholders to `@param1`, `@param2`, etc.
   - Handles RETURNING → THEN RETURN conversion
3. Attaches Spanner type hints as metadata on parameters
4. Returns `[sql: string, params: Primitive[]]` tuple
5. Type metadata retrieved via `getParamTypeMetadata(params)`

## GoogleSQL vs PostgreSQL

Key differences handled by this compiler:

| Feature | PostgreSQL | GoogleSQL |
|---------|-----------|-----------|
| Identifier escaping | `"identifier"` | `` `identifier` `` |
| Parameter placeholders | `$1`, `$2` | `@param1`, `@param2` |
| RETURNING clause | `RETURNING` | `THEN RETURN` |
| Type hints | Optional | Required in some contexts |
| Array syntax | `ARRAY[1,2,3]` | `[1,2,3]` |

## Production Usage

This package is designed to be consumed via effect-sql-spanner, which provides a complete Spanner client with automatic GoogleSQL compilation:

```typescript
import * as SpannerClient from "effect-sql-spanner/Client"
import * as Effect from "effect/Effect"

const program = Effect.gen(function* () {
  const sql = yield* SpannerClient.ClientTag

  // GoogleSQL compilation happens automatically
  const users = yield* sql`SELECT * FROM users`

  return users
})
```

## License

Apache-2.0

## Author

Ryan Hunter ([@artimath](https://github.com/artimath))

## Links

- [@effect/sql Documentation](https://effect.website/docs/guides/sql)
- [Cloud Spanner GoogleSQL Reference](https://cloud.google.com/spanner/docs/reference/standard-sql/query-syntax)
- [Effect.ts Documentation](https://effect.website)
