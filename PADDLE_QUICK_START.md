# Paddle Integration Quick Start Checklist

## Before You Start
- [ ] You have a Paddle account (sign up at paddle.com)
- [ ] Your Supabase project is set up
- [ ] You have Node.js/bun and npm installed

## Configuration (15 minutes)
- [ ] [ ] Create 3 products in Paddle Dashboard: Free, Pro, Enterprise
- [ ] [ ] Create prices for Pro (monthly/yearly) and Enterprise (monthly/yearly)
- [ ] [ ] Copy credentials from Paddle Settings → Credentials
- [ ] [ ] Copy webhook secret from Paddle Settings → Webhooks
- [ ] [ ] Create `.env.local` from `.env.example.paddle`
- [ ] [ ] Fill in all environment variables with your Paddle credentials

## Installation (5 minutes)
- [ ] [ ] Run `npm install @paddle/paddle-js` (or `bun add`)
- [ ] [ ] Verify new Paddle integration files are created:
  - `src/integrations/paddle/types.ts`
  - `src/integrations/paddle/client.ts`
  - `src/integrations/paddle/api.ts`
  - `src/integrations/paddle/index.ts`

## Database Setup (10 minutes)
- [ ] [ ] Go to Supabase SQL Editor
- [ ] [ ] Create new query
- [ ] [ ] Copy and run `supabase/migrations/20260415_paddle_billing_setup.sql`
- [ ] [ ] Verify these tables were created:
  - `billing_customers`
  - `billing_subscriptions`
  - `billing_transactions`
  - `billing_events`

## Webhook Setup (15 minutes)
- [ ] [ ] Install Supabase CLI: `npm install -g supabase`
- [ ] [ ] Create Edge Function: `supabase functions new paddle-webhooks`
- [ ] [ ] Copy code from `supabase/functions/paddle-webhooks/index.ts`
- [ ] [ ] Deploy function: `supabase functions deploy paddle-webhooks`
- [ ] [ ] Get your webhook URL from Supabase Functions
- [ ] [ ] Configure webhook in Paddle Dashboard:
  - Go to Settings → Webhooks → Add Webhook
  - Paste your webhook URL
  - Select all Paddle events to listen to
  - Copy signing secret to `PADDLE_WEBHOOK_SECRET`

## App Integration (20 minutes)
- [ ] [ ] Add routes to your router:
  - `/checkout` → Checkout page
  - `/payment-success` → PaymentSuccess page
  - `/billing` → Billing dashboard
- [ ] [ ] Initialize Paddle in App.tsx on load
- [ ] [ ] Update PricingPlans component to use `openCheckout()`
- [ ] [ ] Add Paddle script to HTML (if needed)

## Testing (15 minutes)
- [ ] [ ] Set `VITE_PADDLE_ENVIRONMENT=sandbox` for testing
- [ ] [ ] Use test credit card: `4111111111111111`
- [ ] [ ] Complete a test purchase
- [ ] [ ] Verify subscription appears in database
- [ ] [ ] Check webhook event in Supabase

## Create Backend APIs (30 minutes)
- [ ] [ ] Create `/api/create-subscription` endpoint
- [ ] [ ] Create `/api/paddle/customer-portal` endpoint
- [ ] [ ] Create `/api/verify-payment` endpoint
- [ ] [ ] Test each endpoint with Postman/Thunder Client

## Production Deployment (10 minutes)
- [ ] [ ] Switch to production environment in Paddle
- [ ] [ ] Update `.env` variables in production
- [ ] [ ] Set `VITE_PADDLE_ENVIRONMENT=production`
- [ ] [ ] Deploy webhook handler to production
- [ ] [ ] Deploy updated app code
- [ ] [ ] Verify webhook is set to production URL

## Verification
- [ ] [ ] Test full purchase flow in production
- [ ] [ ] Verify subscription created in database
- [ ] [ ] Check webhook delivered successfully
- [ ] [ ] Verify user can access billing dashboard
- [ ] [ ] Test subscription cancellation
- [ ] [ ] Test plan upgrade/downgrade

## Post-Launch
- [ ] [ ] Set up email notifications in Paddle
- [ ] [ ] Configure dunning management
- [ ] [ ] Set up analytics tracking
- [ ] [ ] Monitor webhook delivery in Paddle dashboard
- [ ] [ ] Set up alerts for failed payments

---

## Files Created/Modified

### New Files
- `src/integrations/paddle/types.ts` - TypeScript types
- `src/integrations/paddle/client.ts` - Paddle client SDK
- `src/integrations/paddle/api.ts` - Server API utilities
- `src/integrations/paddle/index.ts` - Exports
- `src/pages/Checkout.tsx` - Checkout page
- `src/pages/PaymentSuccess.tsx` - Success page
- `src/pages/Billing.tsx` - Billing dashboard
- `supabase/functions/paddle-webhooks/index.ts` - Webhook handler
- `supabase/migrations/20260415_paddle_billing_setup.sql` - Database tables
- `.env.example.paddle` - Environment variables template
- `PADDLE_SETUP.md` - Full setup guide

### Configuration
- `.env.local` (create from example)

## Estimated Time to Complete
- **Quick Setup**: 1-2 hours
- **Full Setup with Testing**: 3-4 hours
- **Production Deployment**: 1-2 hours

## Need Help?
1. Read `PADDLE_SETUP.md` for detailed guide
2. Check [Paddle Documentation](https://developer.paddle.com)
3. Check Paddle webhook logs in dashboard
4. Check Supabase function logs

## Important Notes
- Keep `PADDLE_API_KEY` and `PADDLE_WEBHOOK_SECRET` secure
- Use sandbox environment for testing first
- Test webhook delivery in Paddle dashboard
- Monitor Edge Function logs for errors
- Regular sync between Paddle and Supabase is important
