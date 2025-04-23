# FileShare - Secure File Sharing Application

A modular web-based file sharing application that allows users to upload and share files using AWS S3. The app supports secure uploads, time-limited sharing, and flexible pricing through Razorpay and Stripe.

## Features

### Core Features
- **File Upload & Sharing**
  - Support for any file type
  - Default max file size: 2GB
  - Files expire automatically after 4 hours
  - Shareable download link generated post-upload
  - Files stored on AWS S3 using pre-signed URLs

### Extended Upload Options with Payments
- Upgrade to extend file size limits and validity
- Payment integration with Razorpay (INR) and Stripe (international payments)
- Modular pricing system with customizable tiers

### Security & UX
- Secure, time-bound signed URLs for uploads and downloads
- Real-time upload progress tracking
- Expiration countdown for files
- Optional email input for sending download links

## Tech Stack

- **Frontend:** React.js with styled-components
- **Backend:** Node.js with Express.js
- **Storage:** AWS S3
- **Database:** MongoDB
- **Payment Gateways:** Razorpay and Stripe

## Prerequisites

- Node.js and npm
- MongoDB
- AWS account with S3 bucket
- Razorpay and/or Stripe account for payments

## Environment Setup

1. Create a `.env` file in the server directory based on `.env.example`
2. Fill in your AWS credentials, S3 bucket details, and payment gateway keys

### Required Environment Variables:

```
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/fileSharingApp

# AWS Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=your_aws_region
S3_BUCKET_NAME=your_s3_bucket_name

# Payment Gateway Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# File Configuration
DEFAULT_FILE_SIZE_LIMIT=2
DEFAULT_FILE_VALIDITY_HOURS=4
```

3. For the React client, create a `.env` file with:
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_STRIPE_PUBLIC_KEY=your_stripe_publishable_key
```

## Installation & Setup

### Manual Setup

#### Server
```bash
cd server
npm install
npm run seed  # Initialize pricing tiers in database
npm run dev   # Start development server
```

#### Client
```bash
cd client
npm install
npm start
```

### Using Docker

The entire application can be run using Docker Compose:

```bash
# Make sure to create a .env file at the project root with all required variables
docker-compose up -d
```

This will start:
- MongoDB container
- Backend API server
- Frontend client with Nginx

## Pricing Tiers

The application comes with pre-configured pricing tiers:

1. **Free Tier**
   - 2GB file size limit
   - 4-hour validity
   - Price: Free

2. **Standard Tier**
   - 5GB file size limit
   - 24-hour validity
   - Price: ₹40

3. **Premium Tier**
   - 10GB file size limit
   - 72-hour validity
   - Price: ₹80

Pricing tiers can be modified through the database or by updating the seed script.

## API Endpoints

### File API

- `POST /api/files/getUploadUrl` - Get pre-signed upload URL
- `POST /api/files/confirmUpload/:fileId` - Confirm upload completion
- `GET /api/files/:fileId` - Get file details
- `PATCH /api/files/:fileId` - Update file properties

### Payment API

- `GET /api/payments/pricing-tiers` - Get available pricing tiers
- `POST /api/payments/razorpay/init` - Initialize Razorpay payment
- `POST /api/payments/razorpay/verify` - Verify Razorpay payment
- `POST /api/payments/stripe/init` - Initialize Stripe payment
- `POST /api/payments/stripe/webhook` - Handle Stripe webhooks
- `GET /api/payments/:paymentId/status` - Check payment status

## Deployment

The application can be deployed to any cloud provider that supports Docker containers, such as:
- AWS ECS/EKS
- Google Cloud Run
- Azure Container Instances
- Digital Ocean App Platform

## Adding New Pricing Tiers

To add new pricing tiers:

1. Modify the `pricingTiers` array in `/server/scripts/seed.js`
2. Run the seed script: `npm run seed` (or directly with `node scripts/seed.js`)

## License

MIT