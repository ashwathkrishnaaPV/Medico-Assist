import React from 'react';
import { Trash2 } from 'lucide-react';
import { PrescriptionItem } from '../../../types';
import { healthStore } from '../../../services/healthStore';
import { MEDICINE_CATALOG } from '../../../data/medicineCatalog';

interface PrescriptionItemBuilderProps {
  items: PrescriptionItem[];
  onChange: (items: PrescriptionItem[]) => void;
  onRemove: (id: string) => void;
}

export const PrescriptionItemBuilder: React.FC<PrescriptionItemBuilderProps> = ({
  items,
  onChange,
  onRemove
}) => {
  return (
    <>
      <div className="space-y-3">
        {items.length > 0 && (
          <div className="hidden lg:grid lg:grid-cols-12 gap-3 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span className="lg:col-span-4">Medicine Name &amp; Strength</span>
            <span className="lg:col-span-2">Dosage</span>
            <span className="lg:col-span-3">Frequency &amp; Timing</span>
            <span className="lg:col-span-1 text-center">Days</span>
            <span className="lg:col-span-1 text-center text-purple-600 dark:text-purple-400">Qty (Stock)</span>
            <span className="lg:col-span-1 text-right">Action</span>
          </div>
        )}
        {items.map((item, idx) => (
          <div
            key={item.id}
            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-3 text-xs items-center"
          >
            <div className="lg:col-span-4">
              <label className="lg:hidden block text-[10px] font-bold text-slate-400 mb-1">MEDICINE NAME</label>
              <input
                type="text"
                list="formulary-catalog-list"
                placeholder="Medicine Name & Strength"
                value={item.medicineName}
                onChange={(e) => {
                  const val = e.target.value;
                  const newArr = [...items];
                  newArr[idx] = { ...newArr[idx], medicineName: val };
                  const matched = MEDICINE_CATALOG.find((m) => m.name.toLowerCase() === val.toLowerCase());
                  if (matched) {
                    if (newArr[idx].dosage === '1 tablet' || !newArr[idx].dosage) {
                      newArr[idx].dosage = matched.defaultDosage;
                    }
                    if (newArr[idx].frequency === 'Twice daily' || !newArr[idx].frequency) {
                      newArr[idx].frequency = matched.defaultFrequency;
                    }
                    if (!newArr[idx].instructions) {
                      newArr[idx].instructions = matched.defaultInstructions;
                    }
                    newArr[idx].durationDays = matched.defaultDurationDays || newArr[idx].durationDays;
                    newArr[idx].quantity = healthStore.calculateTabletCount({
                      dosage: newArr[idx].dosage,
                      frequency: newArr[idx].frequency,
                      durationDays: newArr[idx].durationDays
                    });
                  }
                  onChange(newArr);
                }}
                className="w-full p-2 rounded-lg bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 font-bold text-slate-900 dark:text-white"
              />
              {item.medicineName && (() => {
                const st = healthStore.getMedicineStock(item.medicineName);
                if (!st) return null;
                const deductQty = healthStore.calculateTabletCount(item);
                const remaining = Math.max(0, st.quantity - deductQty);
                return (
                  <div className="mt-1 flex items-center gap-1.5 text-[10px] font-bold flex-wrap">
                    {st.status === 'Full Stock' && (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Full Stock ({st.quantity} in stock)
                      </span>
                    )}
                    {st.status === 'Less Stock' && (
                      <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" /> Less Stock ({st.quantity} in stock)
                      </span>
                    )}
                    {st.status === 'Restock' && (
                      <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" /> Restock Required ({st.quantity} in stock)
                      </span>
                    )}
                    <span className="text-slate-400">&middot;</span>
                    <span className="text-sky-600 dark:text-sky-400 font-semibold">
                      Dispensing: -{deductQty} ({remaining} remaining in admin stock)
                    </span>
                  </div>
                );
              })()}
            </div>

            <div className="lg:col-span-2">
              <label className="lg:hidden block text-[10px] font-bold text-slate-400 mb-1">DOSAGE</label>
              <input
                type="text"
                placeholder="Dosage (e.g. 1 capsule)"
                value={item.dosage}
                onChange={(e) => {
                  const val = e.target.value;
                  const newArr = [...items];
                  newArr[idx] = {
                    ...newArr[idx],
                    dosage: val,
                    quantity: healthStore.calculateTabletCount({
                      dosage: val,
                      frequency: newArr[idx].frequency,
                      durationDays: newArr[idx].durationDays
                    })
                  };
                  onChange(newArr);
                }}
                className="w-full p-2 rounded-lg bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 font-semibold text-slate-900 dark:text-white"
              />
            </div>

            <div className="lg:col-span-3">
              <label className="lg:hidden block text-[10px] font-bold text-slate-400 mb-1">FREQUENCY</label>
              <input
                type="text"
                placeholder="Frequency"
                value={item.frequency}
                onChange={(e) => {
                  const val = e.target.value;
                  const newArr = [...items];
                  newArr[idx] = {
                    ...newArr[idx],
                    frequency: val,
                    quantity: healthStore.calculateTabletCount({
                      dosage: newArr[idx].dosage,
                      frequency: val,
                      durationDays: newArr[idx].durationDays
                    })
                  };
                  onChange(newArr);
                }}
                className="w-full p-2 rounded-lg bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 font-semibold text-slate-900 dark:text-white"
              />
            </div>

            <div className="lg:col-span-1">
              <label className="lg:hidden block text-[10px] font-bold text-slate-400 mb-1">DAYS</label>
              <input
                type="number"
                min="1"
                placeholder="Days"
                value={item.durationDays}
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === '+' || e.key === 'e') e.preventDefault();
                }}
                onChange={(e) => {
                  const parsed = parseInt(e.target.value, 10);
                  const val = Number.isNaN(parsed) || parsed < 1 ? 1 : Math.abs(parsed);
                  const newArr = [...items];
                  newArr[idx] = {
                    ...newArr[idx],
                    durationDays: val,
                    quantity: healthStore.calculateTabletCount({
                      dosage: newArr[idx].dosage,
                      frequency: newArr[idx].frequency,
                      durationDays: val
                    })
                  };
                  onChange(newArr);
                }}
                className="w-full p-2 rounded-lg bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 font-bold text-center text-slate-900 dark:text-white"
                title="Duration in days (must be at least 1)"
              />
            </div>

            <div className="lg:col-span-1">
              <label className="lg:hidden block text-[10px] font-bold text-purple-600 dark:text-purple-400 mb-1">QTY (DISPENSE)</label>
              <input
                type="number"
                min="1"
                placeholder="Qty"
                value={item.quantity !== undefined ? item.quantity : healthStore.calculateTabletCount(item)}
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === '+' || e.key === 'e') e.preventDefault();
                }}
                onChange={(e) => {
                  const parsed = parseInt(e.target.value, 10);
                  const val = Number.isNaN(parsed) || parsed < 1 ? 1 : Math.abs(parsed);
                  const newArr = [...items];
                  newArr[idx] = { ...newArr[idx], quantity: val };
                  onChange(newArr);
                }}
                className="w-full p-2 rounded-lg bg-white dark:bg-slate-600 border-2 border-purple-400 dark:border-purple-500 font-bold text-center text-purple-700 dark:text-purple-300 shadow-xs"
                title="Total quantity to dispense and deduct from admin inventory"
              />
            </div>

            <div className="lg:col-span-1 flex justify-end lg:justify-center">
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                title="Remove medication"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <datalist id="formulary-catalog-list">
        {MEDICINE_CATALOG.map((m) => (
          <option key={m.id} value={m.name}>
            {m.generic} ({m.category})
          </option>
        ))}
      </datalist>
    </>
  );
};
