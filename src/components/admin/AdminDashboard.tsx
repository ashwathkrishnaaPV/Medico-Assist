import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Users, Stethoscope, FileCheck, BarChart3, AlertTriangle, Pill 
} from 'lucide-react';
import { healthStore } from '../../services/healthStore';
import { authService } from '../../services/authService';
import { AuditLogEntry, MedicineStockItem } from '../../types';

interface AdminDashboardProps {
  onNavigate: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [studentCount, setStudentCount] = useState<number>(0);
  const [doctorCount, setDoctorCount] = useState<number>(1);
  const [doctorName, setDoctorName] = useState<string>('Dr. Nivetha M.B.B.S');
  const [stockStats, setStockStats] = useState({ total: 0, full: 0, less: 0, restock: 0 });
  const [inventoryItems, setInventoryItems] = useState<MedicineStockItem[]>([]);
  const [stockFilter, setStockFilter] = useState<'ALL' | 'Restock' | 'Less Stock' | 'Full Stock'>('ALL');
  const [stockSearch, setStockSearch] = useState<string>('');
  const [deptStats, setDeptStats] = useState<{ name: string; count: number; pct: number }[]>([]);

  useEffect(() => {
    const load = () => {
      setLogs(healthStore.getAuditLogs());
      const allProfiles = healthStore.getAllStudentProfiles();
      setStudentCount(allProfiles.length);

      // Pharmacy stock counts
      const inv = healthStore.getMedicineInventory();
      let full = 0, less = 0, restock = 0;
      inv.forEach(it => {
        if (it.quantity >= 50) full++;
        else if (it.quantity >= 10) less++;
        else restock++;
      });
      setStockStats({ total: inv.length, full, less, restock });
      setInventoryItems(inv);

      // Department distribution from registered students
      if (allProfiles.length > 0) {
        const counts: Record<string, number> = {};
        allProfiles.forEach(p => {
          const d = p.department || 'General';
          counts[d] = (counts[d] || 0) + 1;
        });
        const stats = Object.entries(counts).map(([name, count]) => ({
          name,
          count,
          pct: Math.round((count / allProfiles.length) * 100)
        }));
        setDeptStats(stats);
      } else {
        setDeptStats([]);
      }
    };

    load();
    authService.getUsers().then((users: any) => {
      const doctors = (users as any[] || []).filter(u => u.role === 'MEDICAL_STAFF');
      setDoctorCount(doctors.length > 0 ? doctors.length : 1);
      if (doctors.length > 0 && doctors[0].name) {
        setDoctorName(doctors[0].name);
      }
    });

    const unsub = healthStore.subscribe(load);
    return () => unsub();
  }, []);

  const displayedStock = inventoryItems.filter(it => {
    const matchesFilter = stockFilter === 'ALL' || it.status === stockFilter;
    const matchesSearch = !stockSearch || 
      it.name.toLowerCase().includes(stockSearch.toLowerCase()) || 
      (it.generic && it.generic.toLowerCase().includes(stockSearch.toLowerCase())) ||
      (it.category && it.category.toLowerCase().includes(stockSearch.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 theme-admin animate-fade-in pb-12 text-slate-800 dark:text-slate-100">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Executive Admin Dashboard</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Aggregated campus-wide operational metrics, medical doctor administration (Dr. Nivetha M.B.B.S), pharmacy stock inventory, and HIPAA audit trails.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
            SYSTEM STATUS: ONLINE
          </span>
        </div>
      </div>

      {/* Stock Alert Banner if restock required */}
      {stockStats.restock > 0 && (
        <div 
          onClick={() => onNavigate('admin-inventory')}
          className="flex items-center justify-between p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-2xl cursor-pointer hover:bg-rose-100/70 dark:hover:bg-rose-900/40 transition shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-100 dark:bg-rose-900/80 rounded-xl text-rose-600 dark:text-rose-300">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-rose-900 dark:text-rose-200">
                Pharmacy Stock Alert: {stockStats.restock} Formulary Medicine(s) Require Restocking
              </h4>
              <p className="text-[11px] text-rose-700 dark:text-rose-400 mt-0.5">
                Available inventory is under 10 units. Click to open Pharmacy Inventory and replenish stock.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-rose-700 dark:text-rose-300 underline shrink-0">
            Open Stock Inventory &rarr;
          </span>
        </div>
      )}

      {/* Aggregated Operational Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        
        {/* Total Enrolled Students */}
        <div 
          onClick={() => onNavigate('admin-students')}
          className="card-enterprise p-4 space-y-1 cursor-pointer hover:border-indigo-400 transition"
          title="Click to manage students"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="font-bold uppercase text-[10px]">Total Enrolled Students</span>
            <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{studentCount}</div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Registered in database</span>
        </div>

        {/* Active Medical Doctor */}
        <div 
          onClick={() => onNavigate('admin-staff')}
          className="card-enterprise p-4 space-y-1 cursor-pointer hover:border-sky-400 transition"
          title="Click to view Medical Doctor details"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="font-bold uppercase text-[10px]">Active Doctor</span>
            <Stethoscope className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{doctorCount}</div>
          <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold truncate block">{doctorName}</span>
        </div>

        {/* Pharmacy & Stock Inventory KPI */}
        <div 
          onClick={() => onNavigate('admin-inventory')}
          className="card-enterprise p-4 space-y-1 cursor-pointer hover:border-sky-400 dark:hover:border-sky-600 transition"
          title="Click to view full Pharmacy Inventory"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="font-bold uppercase text-[10px]">Pharmacy Stock</span>
            <Pill className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{stockStats.total} <span className="text-xs font-normal text-slate-500">meds</span></div>
          <div className="flex items-center gap-1 text-[9px] font-bold">
            <span className="text-emerald-600 dark:text-emerald-400">{stockStats.full} Full</span>
            <span>&middot;</span>
            <span className="text-amber-600 dark:text-amber-400">{stockStats.less} Low</span>
            <span>&middot;</span>
            <span className="text-rose-600 dark:text-rose-400">{stockStats.restock} Alert</span>
          </div>
        </div>

        {/* Audit Logs */}
        <div 
          onClick={() => onNavigate('admin-audit-logs')}
          className="card-enterprise p-4 space-y-1 cursor-pointer hover:border-blue-400 transition"
          title="Click to view full audit trail"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="font-bold uppercase text-[10px]">Audit Logs Recorded</span>
            <FileCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{logs.length}</div>
          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">HIPAA Logged</span>
        </div>

      </div>

      {/* Department Analytics Charts & Audit Logs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Department Enrollment Distribution */}
        <div className="card-enterprise p-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Department Student Enrollment Distribution
          </h3>

          <div className="space-y-3 text-xs">
            {deptStats.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <p className="font-semibold text-xs">No department enrollment data available.</p>
              </div>
            ) : (
              deptStats.map(ds => (
                <div key={ds.name}>
                  <div className="flex justify-between text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    <span>{ds.name}</span>
                    <span>{ds.pct}% ({ds.count} student{ds.count !== 1 ? 's' : ''})</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: `${ds.pct}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Audit Trail Preview */}
        <div className="card-enterprise p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Recent Compliance Audit Logs
            </h3>
            <button onClick={() => onNavigate('admin-audit-logs')} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
              View All Logs →
            </button>
          </div>

          <div className="space-y-2 text-xs">
            {logs.slice(0, 4).map(log => (
              <div key={log.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-slate-200">{log.action}</span>
                  <span className="text-[10px] text-slate-400">{log.timestamp}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-[11px]">{log.details}</p>
                <div className="flex items-center justify-between text-[9px] text-slate-500 pt-0.5 font-mono">
                  <span>User: {log.userName} ({log.userRole})</span>
                  <span>IP: {log.ipAddress}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Pharmacy & Medicine Stock Inventory List in Admin Panel */}
      <div className="card-enterprise p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-800">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Campus Pharmacy &amp; Formulary Medicine Stock
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official stock levels, unit quantities, and real-time replenishment status tracked by administration.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('admin-inventory')}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer shadow-sm"
          >
            <span>Open Full Inventory Manager &rarr;</span>
          </button>
        </div>

        {/* Filter Pills and Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setStockFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                stockFilter === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              All Medicines ({stockStats.total})
            </button>
            <button
              onClick={() => setStockFilter('Restock')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                stockFilter === 'Restock'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 hover:bg-rose-100'
              }`}
            >
              Restock Needed ({stockStats.restock})
            </button>
            <button
              onClick={() => setStockFilter('Less Stock')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                stockFilter === 'Less Stock'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900 hover:bg-amber-100'
              }`}
            >
              Low Stock ({stockStats.less})
            </button>
            <button
              onClick={() => setStockFilter('Full Stock')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                stockFilter === 'Full Stock'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 hover:bg-emerald-100'
              }`}
            >
              Full Stock ({stockStats.full})
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search medicine name or generic..."
              value={stockSearch}
              onChange={e => setStockSearch(e.target.value)}
              className="w-full sm:w-64 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Stock List Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3">Medicine &amp; Strength</th>
                <th className="px-4 py-3">Generic Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-center">Available Units</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {displayedStock.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No medicines matching current filter.
                  </td>
                </tr>
              ) : (
                displayedStock.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      {item.name}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                      {item.generic || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-bold font-mono text-sm text-slate-900 dark:text-white">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1 ${
                        item.status === 'Full Stock'
                          ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : item.status === 'Less Stock'
                          ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          : 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 animate-pulse'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          item.status === 'Full Stock' ? 'bg-emerald-500' : item.status === 'Less Stock' ? 'bg-amber-500' : 'bg-rose-500'
                        }`} />
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onNavigate('admin-inventory')}
                        className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900 text-sky-700 dark:text-sky-300 font-bold text-[11px] transition cursor-pointer"
                      >
                        Adjust &rarr;
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
