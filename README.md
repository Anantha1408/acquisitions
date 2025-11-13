# Acquisitions API

A modular, secure REST API for user management with JWT authentication, role-based access control, and PostgreSQL (via Neon + Drizzle ORM). Production-ready Docker setup, structured logging, request validation, and layered architecture.

- Live endpoints (local): `http://localhost:3000/`
- Health: `GET /health`
- API root: `GET /api`

## Key features

- Express 5 (ES modules) with layered architecture (routes → controllers → services → db models)
- Authentication and RBAC
  - JWT access token stored in HTTP-only cookie `token`
  - Route guards: `authenticateToken`, `requireRole('admin')`
- PostgreSQL with Drizzle ORM and Neon serverless driver
- Security: Helmet, CORS, Arcjet shield/bot detection/rate limit
- Validation with Zod
- Logging with Winston + Morgan
- Testing with Jest + Supertest
- Docker and Compose for dev/prod
- Linting/formatting with ESLint + Prettier

## Tech stack

- Runtime: Node.js 20, Express 5
- Database: PostgreSQL (Neon serverless), Drizzle ORM
- Auth: jsonwebtoken, bcrypt, http-only cookies
- Validation: Zod
- Security: Helmet, CORS, Arcjet (@arcjet/node)
- Logging: Winston, Morgan
- Tooling: ESLint, Prettier, Jest, Supertest
- Containers: Docker, docker-compose

## How it works (architecture)

- `src/app.js`: Sets up Express, global middleware (Helmet, CORS, body parsers, cookies, Arcjet, Morgan), and routes
- `src/server.js`: Boots the HTTP server
- `src/routes/*`: Route definitions (auth, users)
- `src/controllers/*`: IO layer: validate input, authZ, shape responses
- `src/services/*`: Business logic (auth, users), talks to DB
- `src/models/*`: Drizzle ORM schema (e.g., `users` table)
- `src/config/*`: DB, logger, Arcjet configuration
- `src/middleware/*`: Cross-cutting concerns (auth, security)
- `src/utils/*`: JWT, cookies, formatting helpers
- `src/validations/*`: Zod schemas

Project structure (high level):

```
src/
  app.js
  server.js
  index.js
  config/         # db, logger, arcjet
  controllers/    # auth, users
  middleware/     # security, auth
  models/         # drizzle schema (users)
  routes/         # /api/auth, /api/users
  services/       # auth, users
  utils/          # jwt, cookies
  validations/    # zod schemas
Dockerfile
docker-compose.dev.yml
docker-compose.prod.yml
```

## Setup

1) Install dependencies

```
npm ci
```

2) Environment variables

Create `.env.development` for local dev and `.env.production` for prod. Example:

```
# Common
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# Database
# For Neon: postgres://user:password@host:port/dbname
DATABASE_URL=postgres://user:password@localhost:5432/postgres

# Auth
JWT_SECRET=replace-with-a-strong-random-secret

# Arcjet
ARCJET_KEY=your-arcjet-key
```

Notes:
- `src/config/database.js` enables Neon Local proxy settings when `NODE_ENV=development`.
- Arcjet is active by default. For local testing, add header `x-bypass-arcjet: 1` if needed.

3) Run (node)

- Development (file watch):

```
npm run dev
```

- Production:

```
npm start
```

4) Run (Docker)

- Dev:

```
docker-compose -f docker-compose.dev.yml up --build
```

- Prod:

```
docker-compose -f docker-compose.prod.yml up --build
```

The app exposes `http://localhost:3000` and reports health at `/health`.

## Database

- Drizzle ORM with Neon serverless driver
- Schema defined in `src/models/user.model.js`
- Drizzle scripts (if you add `drizzle.config.*`):
  - `npm run db:generate`
  - `npm run db:migrate`
  - `npm run db:studio`

If you intend to manage SQL migrations, add a proper `drizzle.config.ts/js` and point it to your schema directory and migrations folder.

## API reference (summary)

- `GET /health` — health check
- `GET /api` — API banner

Auth
- `POST /api/auth/sign-up` — Create user, set `token` cookie
- `POST /api/auth/sign-in` — Authenticate user, set `token` cookie
- `POST /api/auth/sign-out` — Clear `token` cookie

Users
- `GET /api/users` — List all users (admin only)
- `GET /api/users/:id` — Fetch user by id (authenticated)
- `PUT /api/users/:id` — Update user (authenticated; only self or admin; only admin may change role)
- `DELETE /api/users/:id` — Delete user (admin only; controller allows self-delete if desired)

Auth and cookies
- JWT is issued on sign-up/sign-in and stored as an HTTP-only cookie named `token`
- Cookie options: `httpOnly`, `sameSite=strict`, `secure` in production

## Security

- Helmet: secure headers
- CORS: enabled (configure allowed origins for production)
- Arcjet: shield (common attack patterns), bot detection, and rate limiting
  - Custom role-based rate limiting is applied in `security.middleware.js` using `req.user?.role` (guest/user/admin)
- JWT: HS256 token (1d expiry) stored in an HTTP-only cookie

Bypass (local testing only): send header `x-bypass-arcjet: 1` to ease iterative testing.

## Logging

- Winston: writes to `logs/error.log` and `logs/combined.log`; logs to console in non-prod
- Morgan: HTTP access logs piped into Winston

## Testing

```
npm test
```

Uses Jest + Supertest. Add tests under `__tests__` or alongside modules.

## Examples (curl)

Create a regular user and test access denial:

```bash
# Create regular user
curl -i -c cookies.txt -H 'Content-Type: application/json' \
  -X POST http://localhost:3000/api/auth/sign-up \
  -d '{"name":"Regular","email":"regular@test.com","password":"password123","role":"user"}'

# Sign in as regular user (stores token cookie in cookies.txt)
curl -i -c cookies.txt -b cookies.txt -H 'Content-Type: application/json' \
  -X POST http://localhost:3000/api/auth/sign-in \
  -d '{"email":"regular@test.com","password":"password123"}'

# Try to list all users (should be 403)
curl -i -b cookies.txt -H 'x-bypass-arcjet: 1' http://localhost:3000/api/users

# Try to delete a user (should be 403)
curl -i -b cookies.txt -H 'x-bypass-arcjet: 1' -X DELETE http://localhost:3000/api/users/1
```

Create an admin user and verify access:

```bash
# Create admin user
curl -i -c admin_cookies.txt -H 'Content-Type: application/json' \
  -X POST http://localhost:3000/api/auth/sign-up \
  -d '{"name":"Admin","email":"admin@test.com","password":"password123","role":"admin"}'

# Sign in as admin (stores token)
curl -i -c admin_cookies.txt -b admin_cookies.txt -H 'Content-Type: application/json' \
  -X POST http://localhost:3000/api/auth/sign-in \
  -d '{"email":"admin@test.com","password":"password123"}'

# List all users (should be 200)
curl -i -b admin_cookies.txt -H 'x-bypass-arcjet: 1' http://localhost:3000/api/users

# Delete a user by id (should be 200 if user exists)
# Replace <USER_ID> with the id of a non-admin user
curl -i -b admin_cookies.txt -H 'x-bypass-arcjet: 1' -X DELETE http://localhost:3000/api/users/<USER_ID>
```

## Examples (PowerShell)

```powershell
# Regular user
$regular = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Invoke-WebRequest -Uri "http://localhost:3000/api/auth/sign-up" -Method POST -ContentType "application/json" -Body '{"name":"Regular","email":"regular@test.com","password":"password123","role":"user"}' -WebSession $regular -UseBasicParsing | Out-Null
Invoke-WebRequest -Uri "http://localhost:3000/api/auth/sign-in" -Method POST -ContentType "application/json" -Body '{"email":"regular@test.com","password":"password123"}' -WebSession $regular -UseBasicParsing | Out-Null
# Expect 403
try { Invoke-WebRequest -Uri "http://localhost:3000/api/users" -Method GET -Headers @{ 'x-bypass-arcjet'='1' } -WebSession $regular -UseBasicParsing } catch { $_.Exception.Response.StatusCode.value__ }
try { Invoke-WebRequest -Uri "http://localhost:3000/api/users/1" -Method DELETE -Headers @{ 'x-bypass-arcjet'='1' } -WebSession $regular -UseBasicParsing } catch { $_.Exception.Response.StatusCode.value__ }

# Admin user
$admin = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Invoke-WebRequest -Uri "http://localhost:3000/api/auth/sign-up" -Method POST -ContentType "application/json" -Body '{"name":"Admin","email":"admin@test.com","password":"password123","role":"admin"}' -WebSession $admin -UseBasicParsing | Out-Null
Invoke-WebRequest -Uri "http://localhost:3000/api/auth/sign-in" -Method POST -ContentType "application/json" -Body '{"email":"admin@test.com","password":"password123"}' -WebSession $admin -UseBasicParsing | Out-Null
# Expect 200
Invoke-WebRequest -Uri "http://localhost:3000/api/users" -Method GET -Headers @{ 'x-bypass-arcjet'='1' } -WebSession $admin -UseBasicParsing
# Delete specific user id
Invoke-WebRequest -Uri "http://localhost:3000/api/users/10" -Method DELETE -Headers @{ 'x-bypass-arcjet'='1' } -WebSession $admin -UseBasicParsing
```

## Troubleshooting

- Restart the server after changing middleware/routes
- Ensure the `token` cookie is present
  - curl: `-c cookies.txt` (save) and `-b cookies.txt` (send)
  - PowerShell: reuse the same `-WebRequestSession`
- If tokens stop working, ensure `JWT_SECRET` hasn’t changed
- For 429 locally, add header `x-bypass-arcjet: 1`

## Improvements and next steps

- Security middleware order
  - `securityMiddleware` currently runs before auth; it reads `req.user?.role` which may be undefined, so all clients rate-limit as `guest`
  - Move `authenticateToken` earlier in the chain (or decode the cookie in security middleware) to apply role-based limits accurately
- Cookie utility bug
  - `src/utils/cookies.js` imports `express/lib/request` and its `get(res, name)` reads from `req.cookies` but receives `res` — change it to `get(req, name)` and call with the request
- Environment examples
  - Add `DATABASE_URL`, `JWT_SECRET`, and `ARCJET_KEY` to `.env.example` (documented above)
- Validation
  - `signupSchema.email` should use `z.email()`; consider stronger password policy
- Logging format
  - `logger.format.combine((timestamp(), errors(), json()))` uses the comma operator; only `json()` is applied. Use `combine(timestamp(), errors({stack:true}), json())`
- Data model
  - `updated_at` is not auto-updated on writes; update it in service layer or via DB trigger/defaults
  - Add DB indexes/constraints as needed
- CORS
  - Restrict origins in production to an allowlist
- Tokens
  - JWT expiry is 1d while cookie maxAge is 15m — decide on and align the session policy
  - Consider refresh tokens and rotation for long-lived sessions
- Error handling
  - Add centralized error handler middleware for consistent error responses
- Documentation
  - Add OpenAPI/Swagger (e.g., `swagger-ui-express`) and CI checks for lint/test
- Testing
  - Increase coverage for services/controllers and auth edge cases

## License

ISC

## Repository

https://github.com/Anantha1408/acquisitions
