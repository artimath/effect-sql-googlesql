# effect-sql-googlesql

GoogleSQL compiler for [@effect/sql](https://github.com/Effect-TS/effect/tree/main/packages/sql) with Cloud Spanner support.

## Features

- 🎯 Type-safe GoogleSQL query compilation
- ☁️ Cloud Spanner integration
- 🔒 Proper type hints for Spanner data types
- ⚡ Built for production use with Effect.ts

## Installation

```bash
pnpm add effect-sql-googlesql @effect/sql effect @google-cloud/spanner
```

## Usage

### Basic Setup

```typescript
import * as Compiler from "effect-sql-googlesql/Compiler"
import * as Statement from "@effect/sql/Statement"

// Create a GoogleSQL compiler
const compiler = Compiler.make({
  // Optional: transform column names (e.g. camelCase → snake_case)
  transformQueryNames: (name) => name
})

// Compile Effect SQL statements to GoogleSQL
const query = Statement.make`SELECT * FROM users WHERE id = ${userId}`
const compiled = compiler.compile(query)
```

### Type Hints for Spanner

GoogleSQL/Spanner requires explicit type hints for parameters in some contexts. This package provides helpers:

```typescript
import * as Compiler from "effect-sql-googlesql/Compiler"

// Use typed parameters with explicit Spanner types
const query = Statement.make`
  SELECT * FROM users
  WHERE metadata = ${Compiler.param(jsonData, Compiler.types.json())}
`

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

### Integration with Effect SQL Client

```typescript
import * as Sql from "@effect/sql"
import * as Compiler from "effect-sql-googlesql/Compiler"
import * as Layer from "effect-sql-googlesql/Layer"
import * as Effect from "effect/Effect"

// Create a client with GoogleSQL compiler
const program = Effect.gen(function* () {
  const sql = yield* Sql.client.Client

  // Queries are automatically compiled to GoogleSQL
  const users = yield* sql`SELECT * FROM users WHERE active = ${true}`

  return users
})

// Provide the GoogleSQL compiler layer
const GoogleSqlLayer = Layer.make({
  transformQueryNames: (name) => name // or your transformer
})

Effect.runPromise(
  program.pipe(
    Effect.provide(GoogleSqlLayer),
    Effect.provide(YourSpannerClientLayer)
  )
)
```

### With Cloud Spanner

This package is designed to work with Cloud Spanner's GoogleSQL dialect:

```typescript
import { Spanner } from "@google-cloud/spanner"
import * as Compiler from "effect-sql-googlesql/Compiler"
import * as Effect from "effect/Effect"

const spanner = new Spanner({
  projectId: "your-project",
})

const instance = spanner.instance("your-instance")
const database = instance.database("your-database")

// Use the compiler with Spanner queries
const compiler = Compiler.make({})
const compiled = compiler.compile(yourSqlStatement)

// Execute with Spanner
const [rows] = await database.run({
  sql: compiled.sql,
  params: compiled.params,
  types: compiled.types
})
```

## API Reference

### `Compiler.make(options)`

Creates a GoogleSQL compiler instance.

**Options**:
- `transformQueryNames?: (value: string) => string` - Optional transformer for identifiers (e.g., table/column names)

**Returns**: Compiler instance with `compile()` method

### `Compiler.param(value, type)`

Creates a typed parameter for GoogleSQL queries with explicit Spanner type hints.

**Parameters**:
- `value` - The parameter value
- `type` - Spanner type from `Compiler.types`

**Returns**: Typed parameter that will be compiled correctly for Spanner

### `Compiler.types`

Spanner data type constructors:

- `string()` - STRING type
- `int64()` - INT64 type
- `float64()` - FLOAT64 type
- `bool()` - BOOL type
- `json()` - JSON type
- `bytes()` - BYTES type
- `timestamp()` - TIMESTAMP type
- `date()` - DATE type
- `array(elementType)` - ARRAY type with element type

### `Layer.make(options)`

Creates an Effect Layer that provides the GoogleSQL compiler to `@effect/sql` clients.

**Options**: Same as `Compiler.make()`

**Returns**: `Layer.Layer<Sql.client.Compiler>`

## How It Works

1. Takes Effect SQL statements (using `@effect/sql/Statement`)
2. Compiles to GoogleSQL dialect with proper escaping (backticks)
3. Handles Spanner-specific type hints for parameters
4. Integrates with Cloud Spanner client libraries
5. Works seamlessly with Effect.ts dependency injection

## GoogleSQL vs PostgreSQL

Key differences handled by this compiler:

- **Identifier escaping**: Uses backticks `` `identifier` `` instead of `"identifier"`
- **Type hints**: Spanner requires explicit type hints for parameters in certain contexts
- **Array syntax**: Follows GoogleSQL array conventions
- **JSON handling**: Uses Spanner JSON type with proper casting

## License

Apache-2.0

## Author

Ryan Hunter ([@artimath](https://github.com/artimath))

## Links

- [@effect/sql Documentation](https://effect.website/docs/guides/sql)
- [Cloud Spanner GoogleSQL Reference](https://cloud.google.com/spanner/docs/reference/standard-sql/query-syntax)
- [Effect.ts Documentation](https://effect.website)
