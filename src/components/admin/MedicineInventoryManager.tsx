import React, { useState, useEffect, useMemo } from 'react';
import { 
  Pill, Search, AlertCircle, CheckCircle2, AlertTriangle, 
  Plus, Minus, PackageCheck, Layers, Check
} from 'lucide-react';
import { healthStore } from '../../services/healthStore';
import { MedicineStockItem, StockStatus } from '../../types';

interface MedicineInventoryManagerProps {
  onNavigate?: (tab: string) => void;
}

export const MedicineInventoryManager: React.FC<MedicineInventoryManagerProps> = () => {
  const [items, setItems] = useState<MedicineStockItem[]>(() => healthStore.getMedicineInventory());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingQuantities, setEditingQuantities] = useState<Record<string, number>>(() => {
    const initialMap: Record<string, number> = {};
    healthStore.getMedicineInventory().forEach(it => {
      initialMap[it.id] = it.quantity;
    });
    return initialMap;
  });
  const [savedRowId, setSavedRowId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [customLoadAmount, setCustomLoadAmount] = useState<number>(100);
  const [showBulkModal, setShowBulkModal] = useState(false);

  useEffect(() => {
    const refreshInventory = () => {
      const list = healthStore.getMedicineInventory();
      setItems(list);
      const initialMap: Record<string, number> = {};
      list.forEach(it => {
        initialMap[it.id] = it.quantity;
      });
      setEditingQuantities(initialMap);
    };

    const unsub = healthStore.subscribe(refreshInventory);
    return () => unsub();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // KPIs
  const stats = useMemo(() => {
    const total = items.length;
    let fullStock = 0;
    let lessStock = 0;
    let restock = 0;
    let totalUnits = 0;

    items.forEach(it => {
      totalUnits += it.quantity;
      if (it.quantity >= 50) {
        fullStock++;
      } else if (it.quantity >= 10) {
        lessStock++;
      } else {
        restock++;
      }
    });

    return { total, fullStock, lessStock, restock, totalUnits };
  }, [items]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach(it => {
      if (it.category) set.add(it.category);
    });
    return Array.from(set).sort();
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter(it => {
      const matchesSearch = 
        it.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (it.generic && it.generic.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat = selectedCategory === 'ALL' || it.category === selectedCategory;
      
      let itemStatus: StockStatus = 'Restock';
      if (it.quantity >= 50) itemStatus = 'Full Stock';
      else if (it.quantity >= 10) itemStatus = 'Less Stock';

      const matchesStatus = selectedStatus === 'ALL' || itemStatus === selectedStatus;

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [items, searchQuery, selectedCategory, selectedStatus]);

  // Handle single quantity adjustment
  const handleQuantityChange = (id: string, value: number) => {
    setEditingQuantities(prev => ({
      ...prev,
      [id]: Math.max(0, value)
    }));
  };

  const handleStepper = (id: string, delta: number) => {
    setEditingQuantities(prev => {
      const current = prev[id] !== undefined ? prev[id] : 0;
      const next = Math.max(0, current + delta);
      saveQuantity(id, next);
      return { ...prev, [id]: next };
    });
  };

  const saveQuantity = async (id: string, forcedVal?: number) => {
    const val = forcedVal !== undefined ? forcedVal : editingQuantities[id];
    if (val === undefined || isNaN(val)) return;

    setIsUpdating(true);
    try {
      await healthStore.updateMedicineStock(id, val);
      setSavedRowId(id);
      setTimeout(() => setSavedRowId(null), 2000);
      showToast(`Updated stock to ${val} units.`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Bulk Load Operations
  const handleBulkSetAll = async (amount: number) => {
    setIsUpdating(true);
    try {
      await healthStore.bulkLoadStock('set_all', amount);
      showToast(`Loaded ${amount} units for all formulary medicines.`);
      setShowBulkModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRestockLow = async (minQty: number = 50) => {
    setIsUpdating(true);
    try {
      await healthStore.bulkLoadStock('restock_low', minQty);
      showToast(`Restocked all low and depleted medicines to ${minQty} units.`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6 theme-admin animate-fade-in pb-16 text-slate-800 dark:text-slate-100">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl animate-bounce border border-emerald-400">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-50 dark:bg-sky-950/60 rounded-xl text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-800">
              <Pill className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Pharmacy & Medicine Stock Inventory
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage stock levels for {stats.total} registered clinic formulary medicines. Status updates dynamically reflect in clinician prescription views.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleRestockLow(50)}
            disabled={isUpdating}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Automatically replenishes any medicine with less than 10 units to 50 units"
          >
            <AlertTriangle className="w-4 h-4" />
            Restock Low (&lt;10) to 50
          </button>

          <button
            onClick={() => setShowBulkModal(true)}
            disabled={isUpdating}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <PackageCheck className="w-4 h-4" />
            Bulk Stock Load
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Medicines */}
        <div 
          onClick={() => { setSelectedStatus('ALL'); setSelectedCategory('ALL'); }}
          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
            selectedStatus === 'ALL' 
              ? 'bg-sky-50/70 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 ring-2 ring-sky-500/20' 
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Listed</span>
            <span className="p-2 rounded-lg bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-400">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">{stats.total}</span>
            <span className="text-xs font-semibold text-slate-500">medicines</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Total {stats.totalUnits.toLocaleString()} units stored across formulary
          </p>
        </div>

        {/* Full Stock */}
        <div 
          onClick={() => setSelectedStatus(selectedStatus === 'Full Stock' ? 'ALL' : 'Full Stock')}
          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
            selectedStatus === 'Full Stock' 
              ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 ring-2 ring-emerald-500/20' 
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Full Stock</span>
            <span className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{stats.fullStock}</span>
            <span className="text-xs font-semibold text-emerald-600/80">&ge; 50 units</span>
          </div>
          <p className="text-[11px] text-emerald-700/70 dark:text-emerald-400/70 mt-1">
            Sufficient formulary inventory for regular dispensing
          </p>
        </div>

        {/* Less Stock */}
        <div 
          onClick={() => setSelectedStatus(selectedStatus === 'Less Stock' ? 'ALL' : 'Less Stock')}
          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
            selectedStatus === 'Less Stock' 
              ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 ring-2 ring-amber-500/20' 
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Less Stock</span>
            <span className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-600 dark:text-amber-400">{stats.lessStock}</span>
            <span className="text-xs font-semibold text-amber-600/80">10 – 49 units</span>
          </div>
          <p className="text-[11px] text-amber-700/70 dark:text-amber-400/70 mt-1">
            Approaching reorder threshold; replenishment recommended
          </p>
        </div>

        {/* Restock Required */}
        <div 
          onClick={() => setSelectedStatus(selectedStatus === 'Restock' ? 'ALL' : 'Restock')}
          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
            selectedStatus === 'Restock' 
              ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 ring-2 ring-rose-500/20' 
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">Restock Required</span>
            <span className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-600 dark:text-rose-400">{stats.restock}</span>
            <span className="text-xs font-semibold text-rose-600/80">&lt; 10 units</span>
          </div>
          <p className="text-[11px] text-rose-700/70 dark:text-rose-400/70 mt-1">
            Critical low/depleted stock; clinician warning active
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search medicine by name or generic formula..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* Stock Status Pills */}
        <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
          <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Status:</span>
          {['ALL', 'Full Stock', 'Less Stock', 'Restock'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedStatus === st
                  ? st === 'Full Stock'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : st === 'Less Stock'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : st === 'Restock'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All' : st}
            </button>
          ))}
        </div>

        {/* Category Dropdown */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-sky-500"
          >
            <option value="ALL">All Categories ({categories.length})</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4 w-16 text-center">ID</th>
                <th className="p-4">Medicine & Generic Details</th>
                <th className="p-4">Category</th>
                <th className="p-4 text-center">Stock Status</th>
                <th className="p-4 text-center w-72">Available Quantity</th>
                <th className="p-4 text-right pr-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="font-semibold text-sm">No formulary medicines match the filter.</p>
                    <p className="text-xs mt-1">Try changing your search term or category filters.</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const currentEditVal = editingQuantities[item.id] !== undefined ? editingQuantities[item.id] : item.quantity;
                  
                  // Dynamic status based on currently typed/edited quantity
                  let dynamicStatus: StockStatus = 'Restock';
                  if (currentEditVal >= 50) dynamicStatus = 'Full Stock';
                  else if (currentEditVal >= 10) dynamicStatus = 'Less Stock';

                  const isSaved = savedRowId === item.id;

                  return (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                        dynamicStatus === 'Restock' ? 'bg-rose-50/20 dark:bg-rose-950/10' : ''
                      }`}
                    >
                      {/* ID */}
                      <td className="p-4 text-center font-mono text-slate-400 font-medium">
                        #{item.catalogId || item.id.replace('med_', '')}
                      </td>

                      {/* Name & Generic */}
                      <td className="p-4">
                        <div className="font-bold text-slate-900 dark:text-white text-sm">
                          {item.name}
                        </div>
                        {item.generic && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                            {item.generic}
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {item.category || (item.isTablet ? 'Tablet' : 'Item')}
                        </span>
                      </td>

                      {/* Stock Status Badge */}
                      <td className="p-4 text-center">
                        {dynamicStatus === 'Full Stock' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-sm">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            Full Stock
                          </span>
                        )}
                        {dynamicStatus === 'Less Stock' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shadow-sm">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            Less Stock
                          </span>
                        )}
                        {dynamicStatus === 'Restock' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shadow-sm animate-pulse">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                            Restock Required
                          </span>
                        )}
                      </td>

                      {/* Available Quantity Stepper / Editor */}
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* -10 button */}
                          <button
                            onClick={() => handleStepper(item.id, -10)}
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[11px] transition cursor-pointer"
                            title="Decrease by 10"
                          >
                            -10
                          </button>
                          {/* -1 button */}
                          <button
                            onClick={() => handleStepper(item.id, -1)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                            title="Decrease by 1"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          {/* Editable Number Input */}
                          <input
                            type="number"
                            min="0"
                            max="9999"
                            value={currentEditVal}
                            onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value, 10) || 0)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                saveQuantity(item.id);
                              }
                            }}
                            className={`w-20 text-center font-bold text-sm py-1.5 px-2 rounded-xl border font-mono transition-all ${
                              dynamicStatus === 'Restock'
                                ? 'border-rose-400 text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300'
                                : dynamicStatus === 'Less Stock'
                                ? 'border-amber-400 text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300'
                                : 'border-slate-300 text-slate-900 bg-white dark:bg-slate-800 dark:text-white dark:border-slate-700'
                            } focus:outline-none focus:ring-2 focus:ring-sky-500`}
                          />

                          {/* +1 button */}
                          <button
                            onClick={() => handleStepper(item.id, 1)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                            title="Increase by 1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          {/* +10 button */}
                          <button
                            onClick={() => handleStepper(item.id, 10)}
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[11px] transition cursor-pointer"
                            title="Increase by 10"
                          >
                            +10
                          </button>
                          {/* +50 button */}
                          <button
                            onClick={() => handleStepper(item.id, 50)}
                            className="px-2 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900/80 text-sky-700 dark:text-sky-300 font-bold text-[11px] border border-sky-200 dark:border-sky-800 transition cursor-pointer"
                            title="Load 50 Units"
                          >
                            +50
                          </button>
                        </div>
                      </td>

                      {/* Action / Save */}
                      <td className="p-4 text-right pr-6">
                        <button
                          onClick={() => saveQuantity(item.id)}
                          disabled={isUpdating}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition inline-flex items-center gap-1.5 cursor-pointer ${
                            isSaved
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 hover:bg-sky-600 hover:text-white dark:bg-slate-800 dark:hover:bg-sky-600 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {isSaved ? (
                            <>
                              <Check className="w-3.5 h-3.5" /> Saved
                            </>
                          ) : (
                            'Set Stock'
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Load Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-sky-50 dark:bg-sky-950/60 rounded-xl text-sky-600 dark:text-sky-400">
                <PackageCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Bulk Stock Replenishment</h3>
                <p className="text-xs text-slate-500">Quickly load inventory units across clinic formulary medicines.</p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Stock Amount (Units per item)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={customLoadAmount}
                    onChange={(e) => setCustomLoadAmount(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 font-bold font-mono"
                  />
                  <div className="flex gap-1">
                    {[50, 100, 200].map(amt => (
                      <button
                        key={amt}
                        onClick={() => setCustomLoadAmount(amt)}
                        className="px-2.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 cursor-pointer"
                      >
                        {amt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-2">
                <div className="font-semibold text-slate-800 dark:text-slate-200">Stock Status Rules:</div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span><strong>Full Stock:</strong> 50 units or more</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span><strong>Less Stock:</strong> 10 to 49 units</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span><strong>Restock Required:</strong> Less than 10 units (or 0)</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => handleBulkSetAll(customLoadAmount)}
                  disabled={isUpdating}
                  className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
                >
                  Set All to {customLoadAmount}
                </button>
                <button
                  onClick={() => handleRestockLow(customLoadAmount)}
                  disabled={isUpdating}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
                >
                  Restock Low to {customLoadAmount}
                </button>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex justify-end">
              <button
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

