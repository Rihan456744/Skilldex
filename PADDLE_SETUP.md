# Paddle Payment Integration Setup Guide

## Overview
This guide walks you through setting up Paddle payment processing for your Skill Dexterity platform.

## Prerequisites
- Paddle account (create at https://paddle.com)
- Node.js and npm/bun installed
- Supabase project set up

## Step 1: Create a Paddle Account

1. Go to [Paddle.com](https://paddle.com) and sign up
2. Verify your email and complete business information
3. Go to **Settings → Account Details** and enable "Live Mode"
4. Accept Paddle Service Agreement

## Step 2: Get Your API Credentials

1. Go to **Settings → Credentials**
2. Copy your **Client Token** (for frontend) → `VITE_PADDLE_CLIENT_TOKEN`
3. Copy your **API Key** (for backend) → `PADDLE_API_KEY`
4. Go to **Settings → Webhooks**
5. Copy your **Signing Secret** → `PADDLE_WEBHOOK_SECRET`

## Step 3: Create Products and Prices

### Create Free Product (Optional)
1. Go to **Products → New Product**
2. Name: "Free Plan"
3. Create a Price:
   - Amount: 0
   - No recurring billing
4. Copy Product ID → `VITE_PADDLE_PRODUCT_FREE`

### Create Pro Product
1. Go to **Products → New Product**
2. Name: "Pro Plan"
3. Description: "Professional recruiting features"
4. Create Prices:
   - **Monthly**: ₹499/month
     - Billing Cycle: Monthly
     - Copy Price ID → `VITE_PADDLE_PRICE_PRO_MONTHLY`
   - **Yearly**: ₹4,990/year
     - Billing Cycle: Yearly
     - Copy Price ID → `VITE_PADDLE_PRICE_PRO_YEARLY`

### Create Enterprise Product
1. Go to **Products → New Product**
2. Name: "Enterprise Plan"
3. Description: "Enterprise recruiting solution"
4. Create Prices:
   - **Monthly**: ₹1,999/month
     - Billing Cycle: Monthly
     - Copy Price ID → `VITE_PADDLE_PRICE_ENTERPRISE_MONTHLY`
   - **Yearly**: ₹19,990/year
     - Billing Cycle: Yearly
     - Copy Price ID → `VITE_PADDLE_PRICE_ENTERPRISE_YEARLY`

## Step 4: Configure Environment Variables

1. Copy `.env.example.paddle` to `.env.local`:
   ```bash
   cp .env.example.paddle .env.local
   ```

2. Fill in all the values:
   ```env
   VITE_PADDLE_CLIENT_TOKEN=your_client_token
   PADDLE_API_KEY=your_api_key
   PADDLE_WEBHOOK_SECRET=your_webhook_secret
   
   VITE_PADDLE_PRODUCT_FREE=prod_xxx
   VITE_PADDLE_PRODUCT_PRO=prod_yyy
   VITE_PADDLE_PRODUCT_ENTERPRISE=prod_zzz
   
   VITE_PADDLE_PRICE_PRO_MONTHLY=pri_xxx
   VITE_PADDLE_PRICE_PRO_YEARLY=pri_yyy
   VITE_PADDLE_PRICE_ENTERPRISE_MONTHLY=pri_zzz
   VITE_PADDLE_PRICE_ENTERPRISE_YEARLY=pri_aaa
   
   VITE_PADDLE_ENVIRONMENT=production
   ```

## Step 5: Install Paddle SDK

```bash
npm install @paddle/paddle-js
# or
bun add @paddle/paddle-js
```

## Step 6: Set Up Supabase Database

### Migrate Database Schema
1. Go to your Supabase project
2. Open SQL Editor
3. Create new query and paste the contents of `supabase/migrations/20260415_paddle_billing_setup.sql`
4. Run the migration

This creates:
- `billing_customers` - Syncs Paddle customers with your users
- `billing_subscriptions` - Tracks user subscriptions
- `billing_transactions` - Records billing history
- `billing_events` - Audit trail of Paddle events

## Step 7: Set Up Webhook Handler

### Deploy Supabase Edge Function

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Initialize Supabase locally:
   ```bash
   supabase init
   ```

3. Create webhook function:
   ```bash
   supabase functions new paddle-webhooks
   ```

4. Copy the code from `supabase/functions/paddle-webhooks/index.ts` into the new function

5. Deploy:
   ```bash
   supabase functions deploy paddle-webhooks
   ```

### Configure Paddle Webhooks

1. Go to Paddle Dashboard → **Settings → Webhooks**
2. Click **Add Webhook Endpoint**
3. Enter your webhook URL:
   ```
   https://[your-project-id].supabase.co/functions/v1/paddle-webhooks
   ```
4. Add an Authorization Header (optional but recommended):
   - Header Name: `Authorization`
   - Header Value: Your Supabase service role key (from Settings → API)
5. Select these events:
   - `subscription.created`
   - `subscription.updated`
   - `subscription.activated`
   - `subscription.paused`
   - `subscription.resumed`
   - `subscription.past_due`
   - `subscription.canceled`
   - `transaction.created`
   - `transaction.updated`
   - `transaction.completed`
   - `transaction.payment_failed`
6. Save

## Step 8: Update Your App Routes

Add these routes to your `App.tsx` or router:

```typescript
import Checkout from '@/pages/Checkout';
import PaymentSuccess from '@/pages/PaymentSuccess';
import Billing from '@/pages/Billing';

// In your route configuration:
{
  path: '/checkout',
  element: <Checkout />
},
{
  path: '/payment-success',
  element: <PaymentSuccess />
},
{
  path: '/billing',
  element: <Billing />
}
```

## Step 9: Initialize Paddle on App Load

Update your main `App.tsx`:

```typescript
import { useEffect } from 'react';
import { initializePaddle } from '@/integrations/paddle';

function App() {
  useEffect(() => {
    // Initialize Paddle on app load
    initializePaddle().catch(err => {
      console.error('Failed to initialize Paddle:', err);
    });
  }, []);

  return (
    // Your app content
  );
}
```

## Step 10: Update Pricing Component

Update `src/components/PricingPlans.tsx` to use Paddle:

```typescript
import { openCheckout } from '@/integrations/paddle';

function PricingPlans() {
  const handleUpgrade = async (priceId, planName) => {
    try {
      await openCheckout({
        priceId: priceId,
        customData: { plan_name: planName }
      });
    } catch (error) {
      console.error('Checkout error:', error);
    }
  };

  return (
    // Your pricing UI
  );
}
```

## Step 11: Create Backend API Endpoints

Create these endpoints to handle payment operations:

### `POST /api/create-subscription`
```typescript
// Create a new subscription for a user
const response = await fetch('/api/create-subscription', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: user.id,
    priceId: 'pri_xxx',
    email: user.email
  })
});
```

### `POST /api/paddle/customer-portal`
```typescript
// Open Paddle customer portal for subscription management
const response = await fetch('/api/paddle/customer-portal', {
  method: 'POST'
});
const { portalUrl } = await response.json();
window.open(portalUrl, '_blank');
```

### `POST /api/verify-payment`
```typescript
// Verify payment completion
const response = await fetch('/api/verify-payment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ transactionId })
});
```

## Step 12: Testing in Sandbox Mode

For testing before going live:

1. Update `.env.local`:
   ```env
   VITE_PADDLE_ENVIRONMENT=sandbox
   VITE_PADDLE_CLIENT_TOKEN=your_sandbox_token
   ```

2. Use Paddle's test credit cards:
   - Card number: `4111111111111111`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any valid format

3. Test different scenarios:
   - Successful payment
   - Failed payment
   - Subscription activation
   - Plan changes

## Step 13: Deploy to Production

1. Update environment variables in production
2. Switch `VITE_PADDLE_ENVIRONMENT` to `production`
3. Deploy your backend API endpoints
4. Ensure webhook handler is deployed

## File Structure

```
src/
├── integrations/
│   └── paddle/
│       ├── types.ts          # TypeScript types
│       ├── client.ts         # Client-side SDK
│       ├── api.ts            # Server-side API
│       └── index.ts          # Exports
├── pages/
│   ├── Checkout.tsx          # Checkout page
│   ├── PaymentSuccess.tsx    # Success page
│   └── Billing.tsx           # Billing dashboard
└── components/
    └── PricingPlans.tsx      # Updated pricing
supabase/
├── migrations/
│   └── 20260415_paddle_billing_setup.sql
└── functions/
    └── paddle-webhooks/
        └── index.ts
```

## Troubleshooting

### "Paddle is not initialized" error
- Ensure `initializePaddle()` is called before using Paddle features
- Check that `VITE_PADDLE_CLIENT_TOKEN` is set correctly

### Webhooks not receiving events
- Verify webhook URL is publicly accessible
- Check Paddle Dashboard → Webhooks → Event Log
- Ensure webhook secret is correct

### Subscription not appearing in database
- Check if webhook was received in Paddle dashboard
- Verify RLS policies allow data insertion
- Check Supabase logs for Edge Function errors

### Payment not completing
- Use test cards in sandbox mode
- Check browser console for errors
- Verify product/price IDs are correct

## Next Steps

1. **Customize Checkout**: Customize Paddle checkout styling
2. **Email Notifications**: Set up transactional emails
3. **Dunning Management**: Configure retry logic for failed payments
4. **Seat Management**: Implement per-seat billing if needed
5. **Usage Metering**: Set up usage-based billing features

## Resources

- [Paddle Documentation](https://developer.paddle.com)
- [Paddle API Reference](https://developer.paddle.com/api-reference)
- [Paddle Product Guides](https://developer.paddle.com/guides)
- [Paddle Support](https://support.paddle.com)

## Support

For issues or questions:
1. Check Paddle documentation
2. Review browser console for errors
3. Check Supabase logs
4. Contact Paddle support at support@paddle.com
