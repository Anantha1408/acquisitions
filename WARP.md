# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Core Development

- `npm run dev` - Start development server with auto-reload using Node.js `--watch` flag
- `npm run lint` - Run ESLint to check code quality
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting without making changes

### Database Operations

- `npm run db:generate` - Generate Drizzle database schema files
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Drizzle Studio for database management

## Project Architecture

### Tech Stack

- **Runtime**: Node.js with ES modules (`"type": "module"`)
- **Framework**: Express.js server
- **Database**: PostgreSQL via Neon serverless with Drizzle ORM
- **Authentication**: JWT with bcrypt password hashing
- **Validation**: Zod schemas
- **Logging**: Winston with file and console transports
- **Development**: ESLint + Prettier for code quality

### Module System

The project uses Node.js subpath imports for clean internal imports:

- `#config/*` → `./src/config/*`
- `#controllers/*` → `./src/controllers/*`
- `#models/*` → `./src/models/*`
- `#routes/*` → `./src/routes/*`
- `#services/*` → `./src/services/*`
- `#utils/*` → `./src/utils/*`
- `#validations/*` → `./src/validations/*`

### Application Structure

The app follows a layered architecture pattern:

**Entry Point**: `src/index.js` loads environment variables and starts the server

**Application Layer**: `src/app.js` configures Express middleware stack:

- Security: Helmet, CORS
- Parsing: JSON, URL-encoded, cookies
- Logging: Morgan with Winston integration
- Routes: Authentication endpoints under `/api/auth`

**Service Layer**: Business logic is separated into services (e.g., `auth.service.js`)

- Password hashing and user creation logic
- Database operations abstraction

**Data Layer**:

- Database connection via Neon serverless in `config/database.js`
- Drizzle ORM models in `models/` directory
- Schema definitions with PostgreSQL types

**Validation Layer**: Zod schemas in `validations/` provide request validation

**Utilities**:

- JWT token management with sign/verify methods
- Cookie utilities with security defaults
- Error formatting for validation responses
- Winston logger configuration

### Authentication Flow

Currently implements user registration:

1. Request validation using Zod schemas
2. Password hashing with bcrypt (10 rounds)
3. User creation with duplicate email checking
4. JWT token generation and cookie setting
5. Structured response with user data (password excluded)

### Database Schema

Users table with standard fields:

- `id` (serial primary key)
- `name`, `email` (varchar with constraints)
- `password` (hashed)
- `role` (enum: 'user', 'admin')
- Timestamps for created/updated

### Code Style

- ESLint enforces 2-space indentation, single quotes, semicolons
- Arrow functions preferred over function declarations
- No unused variables (except underscore-prefixed)
- Modern ES6+ patterns (const/let, object shorthand)
