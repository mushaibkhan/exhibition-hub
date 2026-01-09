import { Navigate } from 'react-router-dom';
import { MockAppLayout } from '@/components/layout/MockAppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMockData } from '@/contexts/MockDataContext';
import { BarChart3, Users, Square, Receipt, CreditCard, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const { isAdmin, stalls, leads, transactions, payments } = useMockData();

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Calculate metrics
  const totalStalls = stalls.length;
  const soldStalls = stalls.filter(s => s.status === 'sold').length;
  const pendingStalls = stalls.filter(s => s.status === 'pending').length;
  const availableStalls = stalls.filter(s => s.status === 'available').length;
  const reservedStalls = stalls.filter(s => s.status === 'reserved').length;

  const totalRevenue = transactions.reduce((sum, t) => sum + t.total_amount, 0);
  const collectedRevenue = transactions.reduce((sum, t) => sum + t.amount_paid, 0);
  const pendingRevenue = totalRevenue - collectedRevenue;

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
              <CardTitle className="text-sm font-medium">Total Stalls</CardTitle>
              <Square className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStalls}</div>
              <p className="text-xs text-muted-foreground">
                Sold: {soldStalls} | Available: {availableStalls}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalLeads}</div>
              <p className="text-xs text-muted-foreground">
                Converted: {convertedLeads} ({conversionRate}%)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue Collected</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{collectedRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Pending: ₹{pendingRevenue.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transactions.length}</div>
              <p className="text-xs text-muted-foreground">
                Paid: {transactions.filter(t => t.payment_status === 'paid').length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stall Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Stall Status Breakdown
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
                <p className="text-sm">Reserved</p>
              </div>
              <div className="rounded-lg bg-stall-pending p-4 text-center">
                <div className="text-2xl font-bold">{pendingStalls}</div>
                <p className="text-sm">Pending</p>
              </div>
              <div className="rounded-lg bg-stall-sold p-4 text-center">
                <div className="text-2xl font-bold">{soldStalls}</div>
                <p className="text-sm">Sold</p>
              </div>
              <div className="rounded-lg bg-stall-blocked p-4 text-center">
                <div className="text-2xl font-bold">{stalls.filter(s => s.status === 'blocked').length}</div>
                <p className="text-sm">Blocked</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MockAppLayout>
  );
};

export default Dashboard;
