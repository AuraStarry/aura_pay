'use client';

import { useEffect, useMemo, useState } from 'react';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  currency: string;
  billing_mode: 'one_time' | 'subscription';
  active: boolean;
  description: string | null;
  metadata: any;
  created_at: string;
}

type ProductFormData = Omit<Product, 'id' | 'created_at'>;

const TOKEN_KEY = 'aura_pay_admin_token';

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adminToken, setAdminToken] = useState('');
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    sku: '',
    price: 0,
    currency: 'USD',
    billing_mode: 'one_time',
    active: true,
    description: '',
    metadata: {},
  });

  const authed = useMemo(() => adminToken.trim().length > 0, [adminToken]);

  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY) || '';
    if (saved) setAdminToken(saved);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authed) {
      setProducts([]);
      return;
    }
    loadProducts();
  }, [authed]);

  async function apiFetch(path: string, init?: RequestInit) {
    const headers: HeadersInit = {
      'content-type': 'application/json',
      authorization: `Bearer ${adminToken}`,
      ...(init?.headers || {}),
    };

    return fetch(path, { ...init, headers });
  }

  async function loadProducts() {
    try {
      setError('');
      const res = await apiFetch('/api/products?all=true');
      const body = await res.json();

      if (!res.ok || !body.ok) {
        throw new Error(body?.error?.message || 'Failed to load products');
      }

      setProducts(body.data.products || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(product: Product) {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      price: product.price,
      currency: product.currency,
      billing_mode: product.billing_mode || 'one_time',
      active: product.active,
      description: product.description || '',
      metadata: product.metadata || {},
    });
    setShowForm(true);
  }

  function handleNew() {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: '',
      price: 0,
      currency: 'USD',
      billing_mode: 'one_time',
      active: true,
      description: '',
      metadata: {},
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setError('');

      const res = await apiFetch('/api/products', {
        method: editingProduct ? 'PATCH' : 'POST',
        body: JSON.stringify(editingProduct ? { id: editingProduct.id, ...formData } : formData),
      });
      const body = await res.json();

      if (!res.ok || !body.ok) {
        throw new Error(body?.error?.message || 'Failed to save product');
      }

      setShowForm(false);
      loadProducts();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('確定要刪除此產品？')) return;

    try {
      setError('');
      const res = await apiFetch('/api/products', {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      });
      const body = await res.json();

      if (!res.ok || !body.ok) {
        throw new Error(body?.error?.message || 'Failed to delete product');
      }

      loadProducts();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function toggleActive(product: Product) {
    try {
      setError('');
      const res = await apiFetch('/api/products', {
        method: 'PATCH',
        body: JSON.stringify({ id: product.id, active: !product.active }),
      });
      const body = await res.json();

      if (!res.ok || !body.ok) {
        throw new Error(body?.error?.message || 'Failed to update product status');
      }

      loadProducts();
    } catch (err: any) {
      setError(err.message);
    }
  }

  function saveToken() {
    if (!adminToken.trim()) return;
    localStorage.setItem(TOKEN_KEY, adminToken.trim());
    setError('');
    loadProducts();
  }

  function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
    setAdminToken('');
    setProducts([]);
    setError('');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-900 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center text-white mb-8">
          <h1 className="text-4xl font-bold mb-2">🛠️ Product Management</h1>
          <p className="text-lg opacity-90">Admin token required (viewer/admin role)</p>
        </header>

        <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
          <div className="flex gap-2">
            <input
              type="password"
              value={adminToken}
              onChange={(e) => setAdminToken(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg"
              placeholder="Paste admin/viewer token"
            />
            <button onClick={saveToken} className="bg-purple-600 text-white px-4 py-2 rounded-lg">Apply</button>
            <button onClick={clearToken} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">Clear</button>
          </div>
          <p className="text-xs text-gray-500 mt-2">viewer token can read; admin token can create/update/delete.</p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4 max-w-4xl mx-auto">
            ⚠️ Error: {error}
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">{editingProduct ? 'Edit Product' : 'New Product'}</h2>
                  <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="Product Name" />
                  <input required value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="SKU" />
                  <div className="grid grid-cols-3 gap-4">
                    <input type="number" required step="0.01" min="0" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-2 border rounded-lg" />
                    <select value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} className="w-full px-4 py-2 border rounded-lg">
                      <option value="USD">USD</option><option value="TWD">TWD</option><option value="EUR">EUR</option><option value="GBP">GBP</option>
                    </select>
                    <select value={formData.billing_mode} onChange={(e) => setFormData({ ...formData, billing_mode: e.target.value as 'one_time' | 'subscription' })} className="w-full px-4 py-2 border rounded-lg">
                      <option value="one_time">One-time</option>
                      <option value="subscription">Subscription</option>
                    </select>
                  </div>
                  <textarea value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 border rounded-lg" rows={3} placeholder="Description" />
                  <label className="flex items-center gap-2"><input type="checkbox" checked={formData.active} onChange={(e) => setFormData({ ...formData, active: e.target.checked })} />Active</label>
                  <div className="flex gap-2 pt-2">
                    <button type="submit" className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg">{editingProduct ? 'Update' : 'Create'}</button>
                    <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg">Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">📦 Products</h2>
            <button onClick={handleNew} disabled={!authed} className="bg-purple-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg">+ New Product</button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading products...</div>
          ) : !authed ? (
            <div className="text-center py-8 text-gray-500">Enter token to access admin API.</div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No products yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="bg-gray-50 border-b"><th className="text-left p-4">Product</th><th className="text-left p-4">SKU</th><th className="text-left p-4">Price</th><th className="text-left p-4">Billing</th><th className="text-left p-4">Status</th><th className="text-left p-4">Actions</th></tr></thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-gray-50">
                      <td className="p-4"><div className="font-medium">{product.name}</div>{product.description && <div className="text-sm text-gray-500">{product.description}</div>}</td>
                      <td className="p-4 font-mono text-sm">{product.sku}</td>
                      <td className="p-4 font-semibold">{product.currency} ${parseFloat(String(product.price)).toFixed(2)}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.billing_mode === 'subscription' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-700'}`}>
                          {product.billing_mode === 'subscription' ? 'Subscription' : 'One-time'}
                        </span>
                      </td>
                      <td className="p-4"><button onClick={() => toggleActive(product)} className={`px-3 py-1 rounded-full text-xs font-medium ${product.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{product.active ? 'Active' : 'Inactive'}</button></td>
                      <td className="p-4"><div className="flex gap-2"><button onClick={() => handleEdit(product)} className="text-blue-600">Edit</button><button onClick={() => handleDelete(product.id)} className="text-red-600">Delete</button></div></td>
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
