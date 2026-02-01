'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_KEY || ''
);

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  currency: string;
  active: boolean;
  description: string | null;
  metadata: any;
  created_at: string;
}

type ProductFormData = Omit<Product, 'id' | 'created_at'>;

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    sku: '',
    price: 0,
    currency: 'USD',
    active: true,
    description: '',
    metadata: {},
  });

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setError('');
      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setProducts(data || []);
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

      if (editingProduct) {
        // Update
        const { error: updateError } = await supabase
          .from('products')
          .update(formData)
          .eq('id', editingProduct.id);

        if (updateError) throw updateError;
      } else {
        // Create
        const { error: insertError } = await supabase
          .from('products')
          .insert(formData);

        if (insertError) throw insertError;
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
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      loadProducts();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function toggleActive(product: Product) {
    try {
      setError('');
      const { error: updateError } = await supabase
        .from('products')
        .update({ active: !product.active })
        .eq('id', product.id);

      if (updateError) throw updateError;
      loadProducts();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center text-white mb-8">
          <h1 className="text-4xl font-bold mb-2">🛠️ Product Management</h1>
          <p className="text-lg opacity-90">Manage your service products & pricing</p>
        </header>

        {/* Error */}
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4 max-w-4xl mx-auto">
            ⚠️ Error: {error}
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">
                    {editingProduct ? 'Edit Product' : 'New Product'}
                  </h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Product Name*</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="e.g., Premium Plan"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">SKU / Product Code*</label>
                    <input
                      type="text"
                      required
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="e.g., PLAN-PREMIUM-001"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Price*</label>
                      <input
                        type="number"
                        required
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Currency</label>
                      <select
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="USD">USD</option>
                        <option value="TWD">TWD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows={3}
                      placeholder="Service details, features, etc."
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="active"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="mr-2 w-4 h-4"
                    />
                    <label htmlFor="active" className="text-sm font-medium">
                      Active (visible to customers)
                    </label>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 font-medium"
                    >
                      {editingProduct ? 'Update Product' : 'Create Product'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Products Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">📦 Products</h2>
            <button
              onClick={handleNew}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-medium"
            >
              + New Product
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No products yet. Create your first one!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left p-4 font-semibold text-gray-600">Product</th>
                    <th className="text-left p-4 font-semibold text-gray-600">SKU</th>
                    <th className="text-left p-4 font-semibold text-gray-600">Price</th>
                    <th className="text-left p-4 font-semibold text-gray-600">Status</th>
                    <th className="text-left p-4 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="font-medium">{product.name}</div>
                        {product.description && (
                          <div className="text-sm text-gray-500">{product.description}</div>
                        )}
                      </td>
                      <td className="p-4 font-mono text-sm">{product.sku}</td>
                      <td className="p-4 font-semibold">
                        {product.currency} ${parseFloat(String(product.price)).toFixed(2)}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => toggleActive(product)}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            product.active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {product.active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Link to Dashboard */}
        <div className="text-center mt-8">
          <a
            href="/"
            className="text-white hover:text-purple-200 underline"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
