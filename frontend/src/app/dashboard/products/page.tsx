'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Boxes, 
  AlertTriangle, 
  RefreshCw,
  X,
  Warehouse,
  Sparkles
} from 'lucide-react';

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  warehouse: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  
  // Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({
    id: '', sku: '', name: '', category: 'Industrial Chemicals', 
    price: 0, stock: 0, warehouse: 'Jeedimetla IDC'
  });

  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.getProducts({
        search,
        category: categoryFilter,
        warehouse: warehouseFilter
      });
      setProducts(res.products || []);
    } catch (err: any) {
      showToast(`Error loading products: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, categoryFilter, warehouseFilter]);

  const handleOpenCreate = () => {
    setIsEdit(false);
    setFormData({
      id: `PROD-${Math.floor(10 + Math.random() * 90)}`,
      sku: '', name: '', category: 'Industrial Chemicals', 
      price: 1500, stock: 50, warehouse: 'Jeedimetla IDC'
    });
    setFormOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setIsEdit(true);
    setFormData({
      id: p.id,
      sku: p.sku,
      name: p.name,
      category: p.category,
      price: Number(p.price),
      stock: Number(p.stock),
      warehouse: p.warehouse
    });
    setFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await api.updateProduct(formData.id, formData);
        showToast('Product specifications updated.');
      } else {
        await api.createProduct(formData);
        showToast('New SKU entry created successfully.');
      }
      setFormOpen(false);
      fetchProducts();
    } catch (err: any) {
      showToast(`Save failed: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product SKU from the B2B catalog?')) return;
    try {
      await api.deleteProduct(id);
      showToast('Product catalog item purged.');
      fetchProducts();
    } catch (err: any) {
      showToast(`Purge failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 glass-panel border-l-4 border-l-blue-600 bg-white dark:bg-slate-900 px-5 py-3.5 shadow-2xl flex items-center gap-3 text-xs font-semibold animate-bounce">
          <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />
          <span>{toast}</span>
        </div>
      )}

      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-black">B2B Product Inventory</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage warehouse products, categories, pricing, and safety stock levels</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create SKU
        </button>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by product name or SKU code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-200/20 dark:bg-slate-900/30 border border-slate-200/30 dark:border-slate-800/30 rounded-xl text-xs focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-200/20 dark:bg-slate-900/30 border border-slate-200/30 dark:border-slate-800/30 rounded-xl text-xs outline-none"
          >
            <option value="">All Categories</option>
            <option value="Industrial Chemicals">Industrial Chemicals</option>
            <option value="Sanitation Tooling">Sanitation Tooling</option>
            <option value="Washroom Essentials">Washroom Essentials</option>
            <option value="Hospitality Mops">Hospitality Mops</option>
          </select>

          <select
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
            className="px-3 py-2 bg-slate-200/20 dark:bg-slate-900/30 border border-slate-200/30 dark:border-slate-800/30 rounded-xl text-xs outline-none"
          >
            <option value="">All Warehouses</option>
            <option value="Jeedimetla IDC">Jeedimetla IDC</option>
            <option value="Gachibowli WH">Gachibowli WH</option>
          </select>
        </div>

      </div>

      {/* Grid List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => {
            const isLowStock = Number(p.stock) < 15;
            
            return (
              <div key={p.id} className={`glass-card p-5 space-y-4 relative ${isLowStock ? 'border-rose-500/20' : ''}`}>
                
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400">{p.category}</span>
                    <h3 className="font-bold text-sm truncate mt-0.5">{p.name}</h3>
                    <span className="block text-[10px] text-blue-600 dark:text-blue-400 font-bold">SKU: {p.sku}</span>
                  </div>
                  
                  {isLowStock && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 text-[9px] font-bold border border-rose-500/20 animate-pulse">
                      <AlertTriangle className="w-3 h-3" />
                      Low Stock
                    </span>
                  )}
                </div>

                <hr className="border-slate-200/20 dark:border-slate-800/20" />

                {/* Details */}
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <div className="space-y-1">
                    <span className="block text-[8px] uppercase tracking-wider text-slate-400">Warehouse Location</span>
                    <span className="flex items-center gap-1.5 dark:text-slate-200">
                      <Warehouse className="w-3.5 h-3.5" />
                      {p.warehouse}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="block text-[8px] uppercase tracking-wider text-slate-400">Available Stock</span>
                    <span className={`font-bold dark:text-slate-200 ${isLowStock ? 'text-rose-500' : ''}`}>
                      {p.stock} Units
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-200/20 dark:border-slate-800/20 mt-2">
                  <span className="text-sm font-black text-blue-600 dark:text-blue-400">Rs. {Number(p.price).toLocaleString()}</span>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleOpenEdit(p)}
                      className="p-2 rounded-xl bg-slate-200/30 dark:bg-slate-900/30 border border-slate-200/30 dark:border-slate-800/30 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all text-slate-500"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(p.id)}
                      className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}

          {products.length === 0 && (
            <div className="col-span-3 text-center py-20 glass-panel text-slate-500 font-bold">
              No warehouse products match these filters.
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md glass-panel p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            <button 
              onClick={() => setFormOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/40"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-display font-black mb-6">
              {isEdit ? 'Modify Product Specifications' : 'Add Product to Catalog'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Product ID</label>
                <input
                  type="text"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  disabled={isEdit}
                  placeholder="PROD-01"
                  required
                  className="w-full glass-input p-3 rounded-xl disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">SKU Code</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="MC-FD-20L"
                  required
                  className="w-full glass-input p-3 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Product Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Maxx-Clean Floor Detergent 20L"
                  required
                  className="w-full glass-input p-3 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full glass-input p-3 rounded-xl focus:bg-[#FFF] dark:focus:bg-[#0f172a]"
                  >
                    <option value="Industrial Chemicals">Industrial Chemicals</option>
                    <option value="Sanitation Tooling">Sanitation Tooling</option>
                    <option value="Washroom Essentials">Washroom Essentials</option>
                    <option value="Hospitality Mops">Hospitality Mops</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Warehouse Location</label>
                  <select
                    value={formData.warehouse}
                    onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                    className="w-full glass-input p-3 rounded-xl focus:bg-[#FFF] dark:focus:bg-[#0f172a]"
                  >
                    <option value="Jeedimetla IDC">Jeedimetla IDC</option>
                    <option value="Gachibowli WH">Gachibowli WH</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Price (INR)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    placeholder="2450"
                    required
                    min={0}
                    className="w-full glass-input p-3 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Initial Stock Level</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    placeholder="100"
                    required
                    min={0}
                    className="w-full glass-input p-3 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 font-bold"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/10"
                >
                  Save Item
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
