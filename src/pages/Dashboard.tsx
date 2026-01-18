import { Navigate } from 'react-router-dom';
import { MockAppLayout } from '@/components/layout/MockAppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMockData } from '@/contexts/SupabaseDataContext';
import { Users, Square, Receipt, CreditCard, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const { isAdmin, stalls, leads, transactions, payments, expenses } = useMockData();

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Stall counts derived from stall status (which is now auto-derived from transactions)
  const totalStalls = stalls?.length || 0;
  const soldStalls = stalls?.filter(s => s && s.status === 'sold').length || 0; // Fully paid
  const pendingStalls = stalls?.filter(s => s && s.status === 'pending').length || 0; // Partial payment
  const reservedStalls = stalls?.filter(s => s && s.status === 'reserved').length || 0; // In transaction, unpaid
  const availableStalls = stalls?.filter(s => s && s.status === 'available').length || 0;
  const blockedStalls = stalls?.filter(s => s && s.status === 'blocked').length || 0;

  // Revenue calculated purely from transactions
  const totalRevenue = transactions?.reduce((sum, t) => sum + (t?.total_amount || 0), 0) || 0;
  const collectedRevenue = transactions?.reduce((sum, t) => sum + (t?.amount_paid || 0), 0) || 0;
  const pendingRevenue = totalRevenue - collectedRevenue;

  // Expenses
  const totalExpenses = expenses?.reduce((sum, e) => sum + (e?.amount || 0), 0) || 0;
  const netRevenue = collectedRevenue - totalExpenses;

  // Transaction stats
  const paidTransactions = transactions?.filter(t => t && t.payment_status === 'paid').length || 0;
  const partialTransactions = transactions?.filter(t => t && t.payment_status === 'partial').length || 0;
  const unpaidTransactions = transactions?.filter(t => t && t.payment_status === 'unpaid').length || 0;

  // Lead stats
  const totalLeads = leads?.length || 0;
  const convertedLeads = leads?.filter(l => l && l.status === 'converted').length || 0;
  const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : '0';

  return (
    <MockAppLayout title="Dashboard" subtitle="Overview and analytics (Admin Only)">
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transactions?.length || 0}</div>
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
                From {transactions?.length || 0} transaction{(transactions?.length || 0) !== 1 ? 's' : ''}
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
            <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
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
            <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Total Payments</p>
                <p className="text-2xl font-bold">{payments?.length || 0}</p>
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

        {/* Revenue & Expenses Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Revenue & Expenses Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                <p className="text-sm text-muted-foreground">Revenue Collected</p>
                <p className="text-2xl font-bold text-green-600">₹{collectedRevenue.toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">₹{totalExpenses.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">{expenses?.length || 0} expense{(expenses?.length || 0) !== 1 ? 's' : ''}</p>
              </div>
              <div className={`p-4 rounded-lg ${netRevenue >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                <p className="text-sm text-muted-foreground">Net Revenue</p>
                <p className={`text-2xl font-bold ${netRevenue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{netRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {netRevenue >= 0 ? 'Profit' : 'Loss'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MockAppLayout>
  );
};

export default Dashboard;
