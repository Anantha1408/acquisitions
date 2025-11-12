# Acquisitions App - Docker Setup Guide

This guide explains how to run the Acquisitions application using Docker with Neon Database for both development and production environments.

## Overview

The application uses different database configurations for development and production:
- **Development**: Uses Neon Local proxy for local development with ephemeral branches
- **Production**: Connects directly to Neon Cloud database

## Prerequisites

1. **Docker & Docker Compose** installed on your machine
2. **Neon Database account** with a project set up
3. **API credentials** from your Neon project dashboard

## Environment Setup

### 1. Get Your Neon Credentials

Visit your [Neon Console](https://console.neon.com) and collect:
- `NEON_API_KEY`: From Account Settings > API Keys
- `NEON_PROJECT_ID`: From your project dashboard URL
- `PARENT_BRANCH_ID`: Usually `main` or your default branch ID

### 2. Configure Environment Files

Update the environment files with your actual credentials:

#### For Development (`.env.development`):
```bash
# Update these values with your actual Neon credentials
NEON_API_KEY=your_actual_neon_api_key
NEON_PROJECT_ID=your_actual_neon_project_id
PARENT_BRANCH_ID=your_parent_branch_id
ARCJET_KEY=your_arcjet_key
```

#### For Production (`.env.production`):
```bash
# Update with your production Neon Cloud URL
DATABASE_URL=postgresql://user:pass@ep-xxxxx.region.aws.neon.tech/dbname?sslmode=require
ARCJET_KEY=your_arcjet_key
```

## Development Environment

### Starting the Development Environment

1. **Load development environment variables**:
   ```bash
   # Copy your development environment
   cp .env.development .env
   ```

2. **Start the development stack**:
   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```

3. **Access the application**:
   - Application: http://localhost:3000
   - Health check: http://localhost:3000/health
   - API: http://localhost:3000/api

### What Happens in Development

- **Neon Local** container starts and creates an ephemeral database branch
- Your app connects to `postgresql://postgres:postgres@neon-local:5432/postgres`
- Hot reloading is enabled (code changes trigger automatic restarts)
- Debug logging is enabled
- Database branch is automatically deleted when containers stop

### Development Commands

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up --build

# Start in detached mode
docker-compose -f docker-compose.dev.yml up -d --build

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop development environment
docker-compose -f docker-compose.dev.yml down

# Stop and remove volumes (clean slate)
docker-compose -f docker-compose.dev.yml down -v
```

### Database Operations in Development

```bash
# Access the database directly through Neon Local
docker exec -it neon-local psql -h localhost -U postgres -d postgres

# Run database migrations
docker-compose -f docker-compose.dev.yml exec app npm run db:migrate

# Generate new migrations
docker-compose -f docker-compose.dev.yml exec app npm run db:generate

# Access Drizzle Studio (if needed)
docker-compose -f docker-compose.dev.yml exec app npm run db:studio
```

## Production Environment

### Starting the Production Environment

1. **Load production environment variables**:
   ```bash
   # Set your production DATABASE_URL
   export DATABASE_URL="your_production_neon_cloud_url"
   export ARCJET_KEY="your_arcjet_key"
   ```

2. **Start the production stack**:
   ```bash
   docker-compose -f docker-compose.prod.yml up --build -d
   ```

3. **Verify deployment**:
   ```bash
   # Check container health
   docker-compose -f docker-compose.prod.yml ps
   
   # View application logs
   docker-compose -f docker-compose.prod.yml logs app
   ```

### Production Commands

```bash
# Start production environment
docker-compose -f docker-compose.prod.yml up --build -d

# Scale the application (if needed)
docker-compose -f docker-compose.prod.yml up --scale app=3 -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f app

# Stop production environment
docker-compose -f docker-compose.prod.yml down

# Update application (rebuild and restart)
docker-compose -f docker-compose.prod.yml up --build -d --force-recreate
```

## File Structure

```
acquisitions/
├── Dockerfile                 # Multi-stage build (dev + prod)
├── docker-compose.dev.yml    # Development with Neon Local
├── docker-compose.prod.yml   # Production with Neon Cloud
├── .env.development          # Dev environment variables
├── .env.production           # Prod environment variables
├── .dockerignore             # Optimize Docker builds
└── src/
    ├── config/
    │   └── database.js       # Database connection setup
    └── ...
```

## Environment Variables Explained

| Variable | Development | Production | Description |
|----------|-------------|------------|-------------|
| `NODE_ENV` | `development` | `production` | Application environment |
| `DATABASE_URL` | Neon Local proxy | Neon Cloud URL | Database connection string |
| `LOG_LEVEL` | `debug` | `info` | Logging verbosity |
| `NEON_API_KEY` | Required | Not used | For Neon Local authentication |
| `NEON_PROJECT_ID` | Required | Not used | Your Neon project identifier |
| `PARENT_BRANCH_ID` | Required | Not used | Source branch for ephemeral branches |

## Troubleshooting

### Development Issues

1. **Neon Local won't start**:
   ```bash
   # Check if credentials are correct
   docker-compose -f docker-compose.dev.yml logs neon-local
   
   # Restart with fresh containers
   docker-compose -f docker-compose.dev.yml down -v
   docker-compose -f docker-compose.dev.yml up --build
   ```

2. **App can't connect to database**:
   ```bash
   # Verify Neon Local is healthy
   docker-compose -f docker-compose.dev.yml ps
   
   # Check database connectivity
   docker-compose -f docker-compose.dev.yml exec app node -e "console.log(process.env.DATABASE_URL)"
   ```

3. **Hot reloading not working**:
   - Ensure volume mounts are correct in `docker-compose.dev.yml`
   - Check if `npm run dev` uses `--watch` flag

### Production Issues

1. **Database connection fails**:
   ```bash
   # Verify DATABASE_URL is correctly set
   docker-compose -f docker-compose.prod.yml exec app printenv DATABASE_URL
   
   # Test connection manually
   docker-compose -f docker-compose.prod.yml exec app node -e "require('./src/config/database.js')"
   ```

2. **Application won't start**:
   ```bash
   # Check application logs
   docker-compose -f docker-compose.prod.yml logs app
   
   # Verify health check
   curl http://localhost:3000/health
   ```

## Security Notes

- Never commit `.env` files with real credentials to version control
- Use Docker secrets or environment variable injection in production deployments
- The production container runs as a non-root user for security
- SSL/TLS is enforced for production Neon Cloud connections

## Next Steps

- Set up CI/CD pipelines to automate deployments
- Configure monitoring and logging aggregation
- Implement database backup strategies for production
- Consider using Docker Swarm or Kubernetes for orchestration

For more information about Neon Local, visit: https://neon.com/docs/local/neon-local