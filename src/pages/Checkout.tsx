import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface CheckoutSession {
  productId?: string;
  priceId?: string;
  planName: string;
  amount: number;
  currency: string;
  billingCycle: string;
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutSession, setCheckoutSession] = useState<CheckoutSession | null>(null);

  useEffect(() => {
    // Parse checkout parameters from URL
    const productId = searchParams.get('product_id');
    const priceId = searchParams.get('price_id');
    const planName = searchParams.get('plan') || 'pro';
    const amount = parseFloat(searchParams.get('amount') || '499');
    const currency = searchParams.get('currency') || 'INR';
    const billingCycle = searchParams.get('billing_cycle') || 'monthly';

    if (!productId && !priceId) {
      setError('Invalid checkout session');
      setLoading(false);
      return;
    }

    setCheckoutSession({
      productId,
      priceId,
      planName,
      amount,
      currency,
      billingCycle,
    });

    setLoading(false);
  }, [searchParams]);

  const handleCheckout = async () => {
    if (!checkoutSession) return;

    try {
      setLoading(true);
      
      // Import Paddle dynamically
      const { initializePaddle, openCheckout } = await import('@/integrations/paddle');
      
      // Initialize Paddle
      await initializePaddle();

      // Open checkout
      await openCheckout({
        priceId: checkoutSession.priceId,
        productId: checkoutSession.productId,
        customData: {
          plan_name: checkoutSession.planName,
        },
        successUrl: `${window.location.origin}/billing/success`,
      });
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'Failed to open checkout');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert className="max-w-md bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading || !checkoutSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Review Your Plan</CardTitle>
          <CardDescription>Complete your purchase to get started</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Plan Details */}
          <div className="space-y-4 bg-slate-50 p-4 rounded-lg">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-slate-600">Plan</span>
              <span className="text-sm font-semibold capitalize">{checkoutSession.planName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-slate-600">Billing Cycle</span>
              <span className="text-sm font-semibold capitalize">{checkoutSession.billingCycle}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="text-sm font-medium text-slate-600">Amount</span>
              <span className="text-lg font-bold">
                {checkoutSession.currency} {checkoutSession.amount}
              </span>
            </div>
          </div>

          {/* Checkout Button */}
          <Button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full h-11 text-base"
            size="lg"
          >
            {loading ? (
              <>
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Proceed to Payment'
            )}
          </Button>

          {/* Continue Shopping */}
          <Button
            onClick={() => navigate('/pricing')}
            variant="outline"
            className="w-full"
          >
            Back to Pricing
          </Button>

          {/* Security Info */}
          <div className="text-xs text-slate-500 text-center space-y-1">
            <p className="flex items-center justify-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Secure payment powered by Paddle
            </p>
            <p>Your payment information is encrypted and secure</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CheckoutPage;
