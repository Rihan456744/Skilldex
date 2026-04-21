import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader, CreditCard, Clock, AlertTriangle, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Subscription {
  id: string;
  plan_name: string;
  plan_price: number;
  currency: string;
  billing_cycle: string;
  status: string;
  started_at: string;
  current_period_end: string;
  next_billed_at: string;
  paddle_subscription_id: string;
}

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  receipt_url?: string;
  receipt_number?: string;
}

export function BillingPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBillingData();
  }, [user?.id]);

  const loadBillingData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Get user's subscription
      const { data: subscriptionData, error: subError } = await supabase
        .from('billing_subscriptions')
        .select('*')
        .eq('billing_customer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (subError && subError.code !== 'PGRST116') {
        throw subError;
      }

      setSubscription(subscriptionData);

      // Get user's transactions
      const { data: transactionsData, error: txError } = await supabase
        .from('billing_transactions')
        .select('*')
        .eq('billing_customer_id', user.id)
        .order('created_at', { ascending: false });

      if (txError) throw txError;

      setTransactions(transactionsData || []);
    } catch (err) {
      console.error('Error loading billing data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    window.location.href = '/pricing';
  };

  const handleManageSubscription = async () => {
    try {
      // This would typically open Paddle's customer portal
      // You'd need to implement the backend API to get the customer portal URL
      const response = await fetch('/api/paddle/customer-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const { portalUrl } = await response.json();
        window.open(portalUrl, '_blank');
      }
    } catch (err) {
      console.error('Error opening customer portal:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'trialing':
        return 'bg-blue-100 text-blue-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      case 'past_due':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-slate-600 mt-1">Manage your subscription and billing information</p>
      </div>

      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Subscription
          </CardTitle>
          <CardDescription>Manage your active plan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscription ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Plan</p>
                  <p className="text-2xl font-bold capitalize">{subscription.plan_name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 font-medium">Status</p>
                  <div className="mt-1">
                    <Badge className={getStatusColor(subscription.status)}>
                      {subscription.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Billing Cycle</p>
                  <p className="capitalize">{subscription.billing_cycle}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 font-medium">Price</p>
                  <p className="text-lg font-semibold">
                    {subscription.currency} {subscription.plan_price}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-slate-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-600 font-medium">Next Billing Date</p>
                    <p>
                      {new Date(subscription.next_billed_at || subscription.current_period_end).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-600 font-medium">Started</p>
                  <p>{new Date(subscription.started_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="pt-4 space-y-2">
                <Button onClick={handleManageSubscription} className="w-full">
                  Manage Subscription
                </Button>
                <Button onClick={handleUpgrade} variant="outline" className="w-full">
                  Change Plan
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8 space-y-4">
              <p className="text-slate-600">No active subscription</p>
              <Button onClick={handleUpgrade}>Choose a Plan</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Billing History
          </CardTitle>
          <CardDescription>Your recent invoices and transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <div className="space-y-2">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {new Date(transaction.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {transaction.receipt_number ? `Receipt #${transaction.receipt_number}` : 'Transaction'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {transaction.currency} {transaction.amount}
                    </p>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {transaction.status}
                    </Badge>
                  </div>
                  {transaction.receipt_url && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(transaction.receipt_url, '_blank')}
                      className="ml-2"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-500 py-8">No transactions yet</p>
          )}
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-sm mb-1">How do I cancel my subscription?</h4>
            <p className="text-sm text-slate-600">
              Click "Manage Subscription" to access the Paddle customer portal where you can pause or cancel anytime.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-sm mb-1">How can I change my billing information?</h4>
            <p className="text-sm text-slate-600">
              Visit the Paddle customer portal to update your payment method and billing details.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-sm mb-1">Can I upgrade or downgrade my plan?</h4>
            <p className="text-sm text-slate-600">
              Yes! Click "Change Plan" to upgrade, downgrade, or switch billing cycles.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default BillingPage;
