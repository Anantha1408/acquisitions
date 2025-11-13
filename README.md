# Acquisitions API — Auth Middleware Usage

This project includes JWT-based authentication and role-based access control for user endpoints.

## Overview
- Sign up (`POST /api/auth/sign-up`) and sign in (`POST /api/auth/sign-in`) issue a JWT stored as an HTTP-only cookie named `token`.
- Middleware:
  - `authenticateToken`: requires a valid JWT cookie and attaches `req.user` with `{ id, email, role }`.
  - `requireRole('admin')`: allows access only to users with the `admin` role.
- Security middleware (Arcjet) is enabled. For local testing you can bypass it with header `x-bypass-arcjet: 1`.

## Protected routes
- `GET /api/users` — Admin only (requires `authenticateToken` + `requireRole('admin')`).
- `GET /api/users/:id` — Any authenticated user.
- `PUT /api/users/:id` — Any authenticated user; controller restricts updates (self or admin).
- `DELETE /api/users/:id` — Admin only (requires `authenticateToken` + `requireRole('admin')`).

## Quick start
1. Install dependencies and start the server.
2. The API listens on `http://localhost:3000` (see `src/server.js`).

## Example usage (curl)

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

## Example usage (PowerShell)

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

## Notes
- The JWT secret is configured in `src/utils/jwt.js` via `JWT_SECRET` env var. Use a strong secret in production.
- Cookies are HTTP-only and secure in production; for local testing, they’re set without the `secure` flag.
- The Arcjet security middleware enforces bot/shield/rate limits. Use `x-bypass-arcjet: 1` only for local testing.

## Common error responses
- 401 unauthorized
  - Missing token cookie, invalid/expired token, or not signed in.
- 403 forbidden
  - Authenticated but lacks required role. Examples: non-admin calling `GET /api/users` or `DELETE /api/users/:id`.
- 400 validation failed
  - Request body/params do not pass Zod validation.
- 429 too many requests
  - Rate limit hit by Arcjet. For local testing, add header `x-bypass-arcjet: 1` to bypass security middleware.

## Troubleshooting
- After changing middleware/routes, restart the server so changes take effect.
- Ensure the `token` cookie is present:
  - curl: use `-c cookies.txt` (save) and `-b cookies.txt` (send) flags.
  - PowerShell: reuse the same `-WebRequestSession`.
- If tokens suddenly stop working, confirm `JWT_SECRET` hasn’t changed; existing cookies become invalid if it does.
- Token seen as missing in dev:
  - Make sure requests are sent to the same host/port that set the cookie (e.g., `http://localhost:3000`).
  - Cookies are set `secure` only in production; on HTTP in dev they will be sent.
- Getting 429 during local tests:
  - Add `x-bypass-arcjet: 1` header to your requests, or wait for the window to reset.
- PowerShell tip: `Invoke-WebRequest` throws on non-2xx; wrap calls in `try { ... } catch { $_.Exception.Response.StatusCode.value__ }` to read the status code.
