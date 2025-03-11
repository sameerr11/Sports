# Deploying Your Sports Management System on Vercel

This guide will walk you through the steps to deploy your Sports Management System on Vercel.

## Prerequisites

- A [Vercel account](https://vercel.com/signup)
- A [MongoDB Atlas account](https://www.mongodb.com/cloud/atlas) (or any MongoDB hosting)
- Git installed on your local machine
- Your Sports Management System codebase on GitHub

## Deployment Steps

### 1. Prepare your MongoDB Database

1. Create a MongoDB Atlas cluster (or use any MongoDB hosting)
2. Set up a database user with appropriate permissions
3. Whitelist all IP addresses (0.0.0.0/0) for Vercel to connect to your database
4. Get your MongoDB connection string

### 2. Prepare your Environment Variables

You'll need to set the following environment variables in Vercel:

- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: A secure random string for JWT token generation
- `REACT_APP_API_URL`: Set to `/api` for the production environment

### 3. Deploy using the Vercel CLI

1. Install the Vercel CLI:
   ```
   npm install -g vercel
   ```

2. Login to Vercel:
   ```
   vercel login
   ```

3. Deploy the project:
   ```
   vercel
   ```

4. Follow the prompts to link your project to a Vercel project.

5. Set your environment variables when prompted, or configure them in the Vercel dashboard.

### 4. Deploy using the Vercel Dashboard

Alternatively, you can deploy directly from the Vercel dashboard:

1. Go to [https://vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Configure the project:
   - Build Command: `npm run install-all && npm run build`
   - Output Directory: `client/build`
4. Add your environment variables
5. Deploy the project

### 5. Configure the Production Build

1. Set the production environment variables in the Vercel dashboard.
2. Ensure the `REACT_APP_API_URL` is set to `/api` (not to localhost).

### 6. Verify the Deployment

1. Once deployed, Vercel will provide you with a URL to your application.
2. Test all the functionalities to ensure everything works correctly.

## Troubleshooting

- **API calls not working**: Ensure `REACT_APP_API_URL` is set to `/api` and the Vercel rewrites are configured correctly.
- **Database connection issues**: Verify your MongoDB connection string and ensure your IP whitelist includes 0.0.0.0/0.
- **Build failures**: Check the Vercel deployment logs for errors.

## Advanced Configuration

For more advanced configuration options, refer to the [Vercel documentation](https://vercel.com/docs). 