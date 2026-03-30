'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { TrendingUp, DollarSign, Users, Package } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface CreatorStats {
  totalRevenue: number;
  revenueThisMonth: number;
  appsPublished: number;
  totalInstalls: number;
  transactions: Transaction[];
  apps: CreatorApp[];
}

interface Transaction {
  id: string;
  app_id: string;
  app_name: string;
  amount: number;
  creator_share: number;
  platform_share: number;
  created_at: string;
}

interface CreatorApp {
  id: string;
  name: string;
  price: number;
  install_count: number;
  rating: number;
  revenue_share: number;
  totalRevenue: number;
}

export default function CreatorDashboard() {
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month');

  // Mock creator ID (in production, get from auth)
  const creatorId = 'cleancopy_official';

  useEffect(() => {
    fetchCreatorStats();
  }, [timeRange]);

  const fetchCreatorStats = async () => {
    setLoading(true);

    try {
      // Fetch creator's apps
      const { data: apps, error: appsError } = await supabase
        .from('mini_apps')
        .select('id, name, price, install_count, rating, revenue_share')
        .eq('creator_id', creatorId);

      if (appsError) throw appsError;

      // Fetch transactions
      const { data: transactionsData, error: txError } = await supabase
        .from('transactions')
        .select(`
          id,
          app_id,
          amount,
          creator_share,
          platform_share,
          created_at,
          mini_apps (name)
        `)
        .in('app_id', apps?.map(a => a.id) || [])
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (txError) throw txError;

      // Calculate stats
      const transactions = transactionsData?.map((tx: any) => ({
        id: tx.id,
        app_id: tx.app_id,
        app_name: tx.mini_apps?.name || 'Unknown App',
        amount: tx.amount,
        creator_share: tx.creator_share,
        platform_share: tx.platform_share,
        created_at: tx.created_at,
      })) || [];

      // Calculate total revenue
      const totalRevenue = transactions.reduce((sum, tx) => sum + parseFloat(String(tx.creator_share)), 0);

      // Calculate revenue this month
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const revenueThisMonth = transactions
        .filter(tx => new Date(tx.created_at) >= firstDayOfMonth)
        .reduce((sum, tx) => sum + parseFloat(String(tx.creator_share)), 0);

      // Calculate per-app revenue
      const appRevenue = new Map<string, number>();
      transactions.forEach(tx => {
        const current = appRevenue.get(tx.app_id) || 0;
        appRevenue.set(tx.app_id, current + parseFloat(String(tx.creator_share)));
      });

      const creatorApps: CreatorApp[] = (apps || []).map(app => ({
        id: app.id,
        name: app.name,
        price: app.price,
        install_count: app.install_count,
        rating: app.rating,
        revenue_share: app.revenue_share,
        totalRevenue: appRevenue.get(app.id) || 0,
      }));

      setStats({
        totalRevenue,
        revenueThisMonth,
        appsPublished: apps?.length || 0,
        totalInstalls: apps?.reduce((sum, app) => sum + app.install_count, 0) || 0,
        transactions: transactions.slice(0, 10), // Last 10 transactions
        apps: creatorApps,
      });

    } catch (error) {
      console.error('Error fetching creator stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-gray-400">Loading creator dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Creator Dashboard</h1>
        <p className="text-gray-400">Track your app revenue and performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Revenue This Month */}
        <div className="bg-gradient-to-br from-green-900 to-green-950 border border-green-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 text-green-400" />
            <span className="text-xs text-green-400 font-semibold">THIS MONTH</span>
          </div>
          <div className="text-3xl font-bold mb-1">
            {formatCurrency(stats?.revenueThisMonth || 0)}
          </div>
          <div className="text-sm text-green-300">
            Your share (80%)
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-blue-400" />
            <span className="text-xs text-gray-500 font-semibold">ALL TIME</span>
          </div>
          <div className="text-3xl font-bold mb-1">
            {formatCurrency(stats?.totalRevenue || 0)}
          </div>
          <div className="text-sm text-gray-400">
            Total earned
          </div>
        </div>

        {/* Apps Published */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <Package className="w-8 h-8 text-purple-400" />
            <span className="text-xs text-gray-500 font-semibold">APPS</span>
          </div>
          <div className="text-3xl font-bold mb-1">
            {stats?.appsPublished || 0}
          </div>
          <div className="text-sm text-gray-400">
            Published apps
          </div>
        </div>

        {/* Total Installs */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-8 h-8 text-yellow-400" />
            <span className="text-xs text-gray-500 font-semibold">INSTALLS</span>
          </div>
          <div className="text-3xl font-bold mb-1">
            {stats?.totalInstalls.toLocaleString() || 0}
          </div>
          <div className="text-sm text-gray-400">
            Total users
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Apps Performance */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-4">Your Apps</h2>
          <div className="space-y-4">
            {stats?.apps.map(app => (
              <div key={app.id} className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg">{app.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span>{formatCurrency(app.price)}/mo</span>
                      <span>•</span>
                      <span>⭐ {app.rating}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-bold">
                      {formatCurrency(app.totalRevenue)}
                    </div>
                    <div className="text-xs text-gray-500">earned</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="text-gray-400">
                    {app.install_count.toLocaleString()} installs
                  </div>
                  <div className="text-gray-500">
                    {(app.revenue_share * 100).toFixed(0)}% revenue share
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-4">Recent Transactions</h2>
          <div className="space-y-3">
            {stats?.transactions && stats.transactions.length > 0 ? (
              stats.transactions.map(tx => (
                <div key={tx.id} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="font-semibold">{tx.app_name}</div>
                      <div className="text-xs text-gray-500">
                        {formatDate(tx.created_at)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-bold">
                        +{formatCurrency(parseFloat(String(tx.creator_share)))}
                      </div>
                      <div className="text-xs text-gray-500">
                        of {formatCurrency(parseFloat(String(tx.amount)))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="flex-1 bg-gray-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-green-500 h-full"
                        style={{ width: '80%' }}
                      />
                    </div>
                    <span>80/20 split</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No transactions yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payout Schedule */}
      <div className="mt-6 bg-gradient-to-r from-blue-900 to-purple-900 border border-blue-700 rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-2">💰 Payout Schedule</h2>
        <p className="text-gray-300 mb-4">
          Payouts are processed on the 1st of each month for the previous month's earnings.
          Minimum payout threshold: <span className="font-bold text-white">$50</span>
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-black/30 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Next Payout</div>
            <div className="text-xl font-bold">
              {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
          <div className="bg-black/30 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Pending Amount</div>
            <div className="text-xl font-bold text-green-400">
              {formatCurrency(stats?.revenueThisMonth || 0)}
            </div>
          </div>
          <div className="bg-black/30 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Payment Method</div>
            <div className="text-xl font-bold">Stripe</div>
          </div>
        </div>
      </div>
    </div>
  );
}
