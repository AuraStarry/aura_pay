'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_KEY || ''
);

interface Order {
  id: string;
  customer_email: string;
  amount: number;
  status: string;
  payment_method: string | null;
  created_at: string;
}

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [orders, statusFilter, emailFilter]);

  async function loadOrders() {
    try {
      setError('');
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setOrders(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let filtered = orders;

    if (statusFilter) {
      filtered = filtered.filter(o => o.status === statusFilter);
    }

    if (emailFilter) {
      filtered = filtered.filter(o =>
        o.customer_email.toLowerCase().includes(emailFilter.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
  }

  const stats = {
    total: orders.length,
    completed: orders.filter(o => o.status === 'completed').length,
    pending: orders.filter(o => o.status === 'pending').length,
    revenue: orders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + parseFloat(String(o.amount || 0)), 0),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center text-white mb-8">
          <h1 className="text-4xl font-bold mb-2">💰 Aura Pay Dashboard</h1>
          <p className="text-lg opacity-90">Payment Records & Analytics</p>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Orders" value={stats.total} />
          <StatCard label="Completed" value={stats.completed} />
          <StatCard label="Revenue" value={`$${stats.revenue.toFixed(2)}`} />
          <StatCard label="Pending" value={stats.pending} />
        </div>

        {/* Orders Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">📋 Recent Orders</h2>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>

            <input
              type="text"
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
              placeholder="Search by email..."
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
              ⚠️ Error: {error}
            </div>
          )}

          {/* Orders Table */}
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No orders found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left p-4 font-semibold text-gray-600">Order ID</th>
                    <th className="text-left p-4 font-semibold text-gray-600">Customer</th>
                    <th className="text-left p-4 font-semibold text-gray-600">Amount</th>
                    <th className="text-left p-4 font-semibold text-gray-600">Status</th>
                    <th className="text-left p-4 font-semibold text-gray-600">Payment Method</th>
                    <th className="text-left p-4 font-semibold text-gray-600">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">{order.id.slice(0, 8)}...</td>
                      <td className="p-4">{order.customer_email}</td>
                      <td className="p-4">${parseFloat(String(order.amount)).toFixed(2)}</td>
                      <td className="p-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="p-4">{order.payment_method || '-'}</td>
                      <td className="p-4">
                        {new Date(order.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="text-gray-500 text-sm mb-1">{label}</div>
      <div className="text-3xl font-bold text-gray-800">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100'}`}>
      {status}
    </span>
  );
}
