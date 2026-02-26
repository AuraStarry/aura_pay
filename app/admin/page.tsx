'use client';

import { useEffect, useMemo, useState } from 'react';

interface Product {
  id: string;
  name: string;
  slug: string | null;
  sku: string | null;
  active: boolean;
  description: string | null;
  metadata: any;
  created_at: string;
}

interface ProductPrice {
  id: number;
  product_id: number;
  name: string;
  billing_type: 'one_time' | 'subscription';
  unit_amount: number;
  currency: string;
  interval: 'day' | 'week' | 'month' | 'year' | null;
  interval_count: number | null;
  active: boolean;
}

type ProductFormData = {
  name: string;
  slug: string;
  sku: string;
  active: boolean;
  description: string;
  metadata: any;
  default_price_name: string;
  default_unit_amount: number;
  default_currency: string;
  default_billing_type: 'one_time' | 'subscription';
  default_interval: 'month' | 'year';
  default_interval_count: number;
};

const TOKEN_KEY = 'aura_pay_admin_token';

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [prices, setPrices] = useState<ProductPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adminToken, setAdminToken] = useState('');
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    slug: '',
    sku: '',
    active: true,
    description: '',
    metadata: {},
    default_price_name: 'Standard',
    default_unit_amount: 0,
    default_currency: 'USD',
    default_billing_type: 'one_time',
    default_interval: 'month',
    default_interval_count: 1,
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
      setPrices([]);
      return;
    }
    loadAll();
  }, [authed]);

  async function apiFetch(path: string, init?: RequestInit) {
    const headers: HeadersInit = {
      'content-type': 'application/json',
      authorization: `Bearer ${adminToken}`,
      ...(init?.headers || {}),
    };

    return fetch(path, { ...init, headers });
  }

  async function loadAll() {
    try {
      setError('');
      const [productsRes, pricesRes] = await Promise.all([
        apiFetch('/api/products?all=true'),
        apiFetch('/api/product-prices?all=true'),
      ]);

      const productsBody = await productsRes.json();
      const pricesBody = await pricesRes.json();

      if (!productsRes.ok || !productsBody.ok) {
        throw new Error(productsBody?.error?.message || 'Failed to load products');
      }
      if (!pricesRes.ok || !pricesBody.ok) {
        throw new Error(pricesBody?.error?.message || 'Failed to load product prices');
      }

      setProducts(productsBody.data.products || []);
      setPrices(pricesBody.data.prices || []);
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
      slug: product.slug || '',
      sku: product.sku || '',
      active: product.active,
      description: product.description || '',
      metadata: product.metadata || {},
      default_price_name: 'Standard',
      default_unit_amount: 0,
      default_currency: 'USD',
      default_billing_type: 'one_time',
      default_interval: 'month',
      default_interval_count: 1,
    });
    setShowForm(true);
  }

  function handleNew() {
    setEditingProduct(null);
    setFormData({
      name: '',
      slug: '',
      sku: '',
      active: true,
      description: '',
      metadata: {},
      default_price_name: 'Standard',
      default_unit_amount: 0,
      default_currency: 'USD',
      default_billing_type: 'one_time',
      default_interval: 'month',
      default_interval_count: 1,
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setError('');

      const productPayload = {
        name: formData.name,
        slug: formData.slug || undefined,
        sku: formData.sku || undefined,
        active: formData.active,
        description: formData.description,
        metadata: formData.metadata,
      };

      const productRes = await apiFetch('/api/products', {
        method: editingProduct ? 'PATCH' : 'POST',
        body: JSON.stringify(editingProduct ? { id: editingProduct.id, ...productPayload } : productPayload),
      });
      const productBody = await productRes.json();

      if (!productRes.ok || !productBody.ok) {
        throw new Error(productBody?.error?.message || 'Failed to save product');
      }

      if (!editingProduct) {
        const productId = productBody.data.product.id;
        const pricePayload: Record<string, unknown> = {
          product_id: Number(productId),
          name: formData.default_price_name,
          billing_type: formData.default_billing_type,
          unit_amount: formData.default_unit_amount,
          currency: formData.default_currency,
        };

        if (formData.default_billing_type === 'subscription') {
          pricePayload.interval = formData.default_interval;
          pricePayload.interval_count = formData.default_interval_count;
        }

        const priceRes = await apiFetch('/api/product-prices', {
          method: 'POST',
          body: JSON.stringify(pricePayload),
        });
        const priceBody = await priceRes.json();

        if (!priceRes.ok || !priceBody.ok) {
          throw new Error(priceBody?.error?.message || 'Product created but failed to create default price');
        }
      }

      setShowForm(false);
      loadAll();
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

      loadAll();
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

      loadAll();
    } catch (err: any) {
      setError(err.message);
    }
  }

  function saveToken() {
    if (!adminToken.trim()) return;
    localStorage.setItem(TOKEN_KEY, adminToken.trim());
    setError('');
    loadAll();
  }

  function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
    setAdminToken('');
    setProducts([]);
    setPrices([]);
    setError('');
  }

  const pricesByProduct = prices.reduce<Record<number, ProductPrice[]>>((acc, p) => {
    acc[p.product_id] = acc[p.product_id] || [];
    acc[p.product_id].push(p);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-900 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center text-white mb-8">
          <h1 className="text-4xl font-bold mb-2">🛠️ Product Management</h1>
          <p className="text-lg opacity-90">Products + Prices (Paddle-ready)</p>
        </header>

        <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
          <div className="flex gap-2">
            <input type="password" value={adminToken} onChange={(e) => setAdminToken(e.target.value)} className="flex-1 px-4 py-2 border rounded-lg" placeholder="Paste admin/viewer token" />
            <button onClick={saveToken} className="bg-purple-600 text-white px-4 py-2 rounded-lg">Apply</button>
            <button onClick={clearToken} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">Clear</button>
          </div>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4 max-w-4xl mx-auto">⚠️ Error: {error}</div>}

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">{editingProduct ? 'Edit Product' : 'New Product + Default Price'}</h2>
                  <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="Product Name" />
                  <div className="grid grid-cols-2 gap-4">
                    <input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="slug (optional)" />
                    <input value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="SKU (optional)" />
                  </div>

                  {!editingProduct && (
                    <>
                      <div className="border-t pt-4">
                        <div className="font-semibold mb-2">Default Price</div>
                        <div className="grid grid-cols-2 gap-4">
                          <input required value={formData.default_price_name} onChange={(e) => setFormData({ ...formData, default_price_name: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="Price name" />
                          <select value={formData.default_billing_type} onChange={(e) => setFormData({ ...formData, default_billing_type: e.target.value as 'one_time' | 'subscription' })} className="w-full px-4 py-2 border rounded-lg">
                            <option value="one_time">One-time</option>
                            <option value="subscription">Subscription</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mt-3">
                          <input type="number" required step="0.01" min="0" value={formData.default_unit_amount} onChange={(e) => setFormData({ ...formData, default_unit_amount: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-2 border rounded-lg" />
                          <select value={formData.default_currency} onChange={(e) => setFormData({ ...formData, default_currency: e.target.value })} className="w-full px-4 py-2 border rounded-lg">
                            <option value="USD">USD</option><option value="TWD">TWD</option><option value="EUR">EUR</option><option value="GBP">GBP</option>
                          </select>
                          <select disabled={formData.default_billing_type === 'one_time'} value={formData.default_interval} onChange={(e) => setFormData({ ...formData, default_interval: e.target.value as 'month' | 'year' })} className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-100">
                            <option value="month">month</option>
                            <option value="year">year</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}

                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 border rounded-lg" rows={3} placeholder="Description" />
                  <label className="flex items-center gap-2"><input type="checkbox" checked={formData.active} onChange={(e) => setFormData({ ...formData, active: e.target.checked })} />Active</label>
                  <div className="flex gap-2 pt-2">
                    <button type="submit" className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg">{editingProduct ? 'Update Product' : 'Create Product + Price'}</button>
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
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : !authed ? (
            <div className="text-center py-8 text-gray-500">Enter token to access admin API.</div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No products yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="bg-gray-50 border-b"><th className="text-left p-4">Product</th><th className="text-left p-4">SKU</th><th className="text-left p-4">Prices</th><th className="text-left p-4">Status</th><th className="text-left p-4">Actions</th></tr></thead>
                <tbody>
                  {products.map((product) => {
                    const p = pricesByProduct[Number(product.id)] || [];
                    return (
                      <tr key={product.id} className="border-b hover:bg-gray-50">
                        <td className="p-4"><div className="font-medium">{product.name}</div>{product.slug && <div className="text-xs text-gray-500">/{product.slug}</div>}</td>
                        <td className="p-4 font-mono text-sm">{product.sku || '-'}</td>
                        <td className="p-4">
                          {p.length === 0 ? <span className="text-gray-400 text-sm">No prices</span> : p.map((x) => (
                            <div key={x.id} className="text-sm">{x.name}: {x.currency} {Number(x.unit_amount).toFixed(2)} {x.billing_type === 'subscription' ? `/${x.interval}` : ''}</div>
                          ))}
                        </td>
                        <td className="p-4"><button onClick={() => toggleActive(product)} className={`px-3 py-1 rounded-full text-xs font-medium ${product.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{product.active ? 'Active' : 'Inactive'}</button></td>
                        <td className="p-4"><div className="flex gap-2"><button onClick={() => handleEdit(product)} className="text-blue-600">Edit</button><button onClick={() => handleDelete(product.id)} className="text-red-600">Delete</button></div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
