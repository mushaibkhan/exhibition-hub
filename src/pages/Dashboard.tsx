import { Navigate } from 'react-router-dom';
import { MockAppLayout } from '@/components/layout/MockAppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMockData } from '@/contexts/MockDataContext';
import { Users, Square, Receipt, CreditCard, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const { isAdmin, stalls, leads, transactions, payments } = useMockData();

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Stall counts derived from stall status (which is now auto-derived from transactions)
  const totalStalls = stalls.length;
  const soldStalls = stalls.filter(s => s.status === 'sold').length; // Fully paid
  const pendingStalls = stalls.filter(s => s.status === 'pending').length; // Partial payment
  const reservedStalls = stalls.filter(s => s.status === 'reserved').length; // In transaction, unpaid
  const availableStalls = stalls.filter(s => s.status === 'available').length;
  const blockedStalls = stalls.filter(s => s.status === 'blocked').length;

  // Revenue calculated purely from transactions
  const totalRevenue = transactions.reduce((sum, t) => sum + t.total_amount, 0);
  const collectedRevenue = transactions.reduce((sum, t) => sum + t.amount_paid, 0);
  const pendingRevenue = totalRevenue - collectedRevenue;

  // Transaction stats
  const paidTransactions = transactions.filter(t => t.payment_status === 'paid').length;
  const partialTransactions = transactions.filter(t => t.payment_status === 'partial').length;
  const unpaidTransactions = transactions.filter(t => t.payment_status === 'unpaid').length;

  // Lead stats
  const totalLeads = leads.length;
  const convertedLeads = leads.filter(l => l.status === 'converted').length;
  const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : 0;

  return (
    <MockAppLayout title="Dashboard" subtitle="Overview and analytics (Admin Only)">
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transactions.length}</div>
              <p className="text-xs text-muted-foreground">
                Paid: {paidTransactions} | Partial: {partialTransactions} | Unpaid: {unpaidTransactions}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue Collected</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">₹{collectedRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Pending: ₹{pendingRevenue.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                From {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalLeads}</div>
              <p className="text-xs text-muted-foreground">
                Converted: {convertedLeads} ({conversionRate}%)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stall Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Square className="h-5 w-5" />
              Stall Status (Derived from Payments)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              <div className="rounded-lg bg-stall-available p-4 text-center">
                <div className="text-2xl font-bold">{availableStalls}</div>
                <p className="text-sm">Available</p>
              </div>
              <div className="rounded-lg bg-stall-reserved p-4 text-center">
                <div className="text-2xl font-bold">{reservedStalls}</div>
                <p className="text-sm">Reserved (Unpaid)</p>
              </div>
              <div className="rounded-lg bg-stall-pending p-4 text-center">
                <div className="text-2xl font-bold">{pendingStalls}</div>
                <p className="text-sm">Partial Payment</p>
              </div>
              <div className="rounded-lg bg-stall-sold p-4 text-center">
                <div className="text-2xl font-bold">{soldStalls}</div>
                <p className="text-sm">Fully Paid</p>
              </div>
              <div className="rounded-lg bg-stall-blocked p-4 text-center">
                <div className="text-2xl font-bold">{blockedStalls}</div>
                <p className="text-sm">Blocked</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">
              Stall colors update automatically based on transaction payment status
            </p>
          </CardContent>
        </Card>

        {/* Payment Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Total Payments</p>
                <p className="text-2xl font-bold">{payments.length}</p>
              </div>
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                <p className="text-sm text-muted-foreground">Amount Collected</p>
                <p className="text-2xl font-bold text-green-600">₹{collectedRevenue.toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                <p className="text-sm text-muted-foreground">Amount Pending</p>
                <p className="text-2xl font-bold text-orange-600">₹{pendingRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MockAppLayout>
  );
};

export default Dashboard;
