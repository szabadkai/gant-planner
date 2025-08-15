# Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Git Repository**: Ensure your code is pushed to GitHub/GitLab/Bitbucket
3. **Database**: Set up a cloud database (PlanetScale, Supabase, or similar)

## Database Setup

### Option 1: PlanetScale (Recommended)
1. Go to [planetscale.com](https://planetscale.com)
2. Create a new database
3. Get your connection string
4. Run migrations: `npx prisma migrate deploy`

### Option 2: Supabase
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Get your connection string
4. Run migrations: `npx prisma migrate deploy`

## Environment Variables

Set these in your Vercel project settings:

```bash
DATABASE_URL="your-database-connection-string"
JWT_SECRET="your-secure-random-string"
CORS_ORIGIN="https://your-domain.vercel.app"
```

## Deployment Steps

### 1. Connect Repository
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Select the repository

### 2. Configure Project
- **Framework Preset**: Other
- **Root Directory**: `./` (root of monorepo)
- **Build Command**: `npm run build`
- **Install Command**: `npm install`
- **Output Directory**: `apps/web/dist`

### 3. Environment Variables
Add the environment variables listed above in the Vercel dashboard.

### 4. Deploy
Click "Deploy" and wait for the build to complete.

## Post-Deployment

### 1. Run Database Migrations
```bash
# Connect to your Vercel function
vercel env pull
npx prisma migrate deploy
```

### 2. Test Your API
Visit `https://your-domain.vercel.app/api/health` to verify the API is working.

### 3. Update CORS
Update the `CORS_ORIGIN` environment variable with your actual domain.

## Troubleshooting

### Build Errors
- Ensure all dependencies are in the correct `package.json` files
- Check that TypeScript compilation succeeds locally
- Verify Prisma client generation works

### Database Connection Issues
- Verify your `DATABASE_URL` is correct
- Ensure your database allows external connections
- Check if you need to whitelist Vercel's IP addresses

### API Not Working
- Check Vercel function logs
- Verify the function timeout isn't too short
- Ensure your routes are configured correctly

## File Structure
```
├── vercel.json              # Main Vercel config
├── apps/
│   ├── web/                 # Frontend app
│   │   ├── package.json     # Web dependencies
│   │   └── src/            # Web source code
│   └── api/                # Backend API
│       ├── package.json    # API dependencies
│       ├── vercel.json     # API-specific config
│       └── src/           # API source code
└── package.json            # Root monorepo config
```

## Custom Domains

1. Go to your Vercel project settings
2. Navigate to "Domains"
3. Add your custom domain
4. Update DNS records as instructed
5. Update `CORS_ORIGIN` environment variable

## Monitoring

- **Vercel Analytics**: Built-in performance monitoring
- **Function Logs**: Check API performance and errors
- **Database Monitoring**: Use your database provider's tools
