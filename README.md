# Private Emotion Diary API (Bun + Hono + Supabase)

Backend API for the Private Emotion Diary application. The service is built with [Bun](https://bun.sh/), [Hono](https://hono.dev/), and [Supabase](https://supabase.com/) Postgres. It provides Supabase-authenticated endpoints for diary profile initialization, encrypted diary entry management, and privileged admin operations with audit logging.

## Features

- Bun runtime with Hono router exposing `/api` endpoints.
- Supabase Auth token validation using the Supabase service role key.
- Diary entry CRUD endpoints storing only ciphertext and wrapped keys.
- Server-side AES-256-GCM helper utilities for wrapping account master keys with `SERVER_WRAP_KEY`.
- Admin routes for user suspension/reactivation and logging unwrap requests in `audit_logs`.
- SQL migrations enabling Row Level Security (RLS) and policies aligned with Supabase best practices.
- Postman collection for quick testing plus example `.env` file.
- GitHub Actions CI workflow running linting and Bun tests.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) v1.1+
- Supabase project with the schema migrations applied
- Environment variables provided via shell, `.env`, or your deployment platform

### Installation

```bash
bun install
```

### Environment Variables

| Variable               | Description                                         |
| ---------------------- | --------------------------------------------------- |
| `SUPABASE_URL`         | Supabase project URL (https://\*.supabase.co)       |
| `SUPABASE_ANON_KEY`    | Public anon key (used for Postman collection)       |
| `SUPABASE_SERVICE_KEY` | Service role key used by the API for Admin queries  |
| `SUPABASE_JWT_SECRET`  | Optional JWT secret if validating tokens locally    |
| `SERVER_WRAP_KEY`      | Base64-encoded 32-byte key for AES-256-GCM wrapping |
| `PORT`                 | Port Bun should listen on (default `3000`)          |

To generate a suitable `SERVER_WRAP_KEY` locally:

```bash
bun run "console.log(Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64'))"
```

### Running the Server

```bash
bun run src/index.ts
```

For hot reloading during development:

```bash
bun run --hot src/index.ts
```

### Database Migrations

The SQL migrations live in the [`migrations/`](./migrations) directory. To inspect the migration order:

```bash
bun run scripts/run-migrations.ts
```

Apply the SQL files sequentially using the Supabase SQL editor or `psql` against your project database.

### Testing

```bash
bun test
```

### Linting

```bash
bunx eslint .
```

## API Overview

| Method | Path                              | Description                                               |
| ------ | --------------------------------- | --------------------------------------------------------- |
| `GET`  | `/api/health`                     | Health check                                              |
| `POST` | `/api/init`                       | Initialize diary profile (requires Supabase access token) |
| `GET`  | `/api/entries?date=YYYY-MM-DD`    | List entry metadata for a date                            |
| `POST` | `/api/entries`                    | Create a new encrypted entry                              |
| `GET`  | `/api/entries/:id`                | Retrieve a single entry (ciphertext + metadata)           |
| `GET`  | `/api/admin/users`                | Admin list of users                                       |
| `POST` | `/api/admin/users/:id/suspend`    | Suspend a user account                                    |
| `POST` | `/api/admin/users/:id/reactivate` | Reactivate a user account                                 |
| `POST` | `/api/admin/request-unwrap`       | Log an admin unwrap request                               |

Admin routes require both a valid Supabase access token and membership in the `admin_roles` table.

## Postman Collection

The [Postman collection](./postman/collection.json) includes environment variables for server URL, Supabase project, and example tokens. Import the collection into Postman and configure the `access_token` or `admin_access_token` values after authenticating via Supabase Auth.

## Security Notes

- Never expose the Supabase service role key to clients; load it from server-side environment variables.
- Rotate `SERVER_WRAP_KEY` regularly and store it using a secure secrets manager in production.
- All admin actions are logged to `audit_logs` with actor, target, and reason metadata.
- The server only handles ciphertext and wrapped keys. Plaintext decrypt operations must be performed client-side or through a documented unwrap process.

## License

[MIT](./LICENSE)
