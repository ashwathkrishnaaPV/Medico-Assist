import React, { useState, useEffect } from 'react';
import { Pill, Edit3, Plus, Trash2, Share2 } from 'lucide-react';
import { healthStore } from '../../services/healthStore';
import { authService } from '../../services/authService';
import { Prescription, PrescriptionItem, StudentProfileData } from '../../types';
import { VersionDiffViewer } from '../common/VersionDiffViewer';
import { FollowUpDatePicker } from '../common/FollowUpDatePicker';
import { WhatsAppShareModal } from '../common/WhatsAppShareModal';
import { MEDICINE_CATALOG } from '../../data/medicineCatalog';

export const PrescriptionManager: React.FC = () => {
  const currentDoctor = authService.getCurrentUser();
  const doctorName = currentDoctor.name || 'Campus Physician';

  const [allProfiles, setAllProfiles] = useState<StudentProfileData[]>([]);
  const [studentId, setStudentId] = useState<string>('');
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState<boolean>(false);

  // Edit State for Version 2 creation
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [changeReason, setChangeReason] = useState('');
  const [editedItems, setEditedItems] = useState<PrescriptionItem[]>([]);
  const [editedFollowUpDate, setEditedFollowUpDate] = useState<string>('');
  const [showDiff, setShowDiff] = useState(false);

  useEffect(() => {
    const load = () => {
      const profiles = healthStore.getAllStudentProfiles();
      setAllProfiles(profiles);

      let targetId = studentId;
      if (profiles.length > 0 && !targetId) {
        targetId = profiles[0].studentId;
        setStudentId(targetId);
      }

      if (targetId) {
        const list = healthStore.getPrescriptionsForStudent(targetId);
        setPrescriptions(list);
        if (list.length > 0 && !selectedRx) {
          setSelectedRx(list[0]);
          setEditedItems(list[0].currentVersion.items);
          setEditedFollowUpDate(list[0].followUpDate || list[0].currentVersion.followUpDate || '');
        }
      } else {
        setPrescriptions([]);
      }
    };

    load();
    const unsub = healthStore.subscribe(load);
    return () => unsub();
  }, [studentId, selectedRx]);

  const handleCreateNewVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRx) return;

    setIsUpdating(true);
    setUpdateError(null);

    try {
      // updatePrescriptionVersion automatically deducts the calculated tablet stock on server
      const updated = await healthStore.updatePrescriptionVersion(currentRx.id, {
        doctorName: doctorName,
        items: editedItems,
        followUpDate: editedFollowUpDate || undefined,
        changeReason: changeReason || 'Adjusted dosage based on clinical progress.',
        notes: 'Updated prescription version issued.'
      });

      if (updated) {
        setSelectedRx(updated);
        setIsEditing(false);
      }
    } catch (err: unknown) {
      setUpdateError(err instanceof Error ? err.message : 'Failed to update prescription version.');
    } finally {
      setIsUpdating(false);
    }
  };

  const currentRx = selectedRx || prescriptions[0];
  const currentVer = currentRx?.currentVersion;
  const currentProfile = allProfiles.find(p => p.studentId === studentId) || (studentId ? healthStore.getStudentProfile(studentId) : undefined);

  return (
    <div className="space-y-6 theme-medical animate-fade-in pb-12">
      
      {/* Header Banner & Patient Selector */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Pill className="w-6 h-6 text-purple-600" />
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Prescription Version Manager</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              EHR Prescription Version Control · Modifying dosage creates Version 2 while preserving Version 1 in audit logs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-slate-400">Patient:</label>
            <select
              value={studentId}
              onChange={e => { setStudentId(e.target.value); setSelectedRx(null); }}
              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
            >
              {allProfiles.length === 0 ? (
                <option value="">No students in database</option>
              ) : (
                allProfiles.map(p => (
                  <option key={p.studentId} value={p.studentId}>
                    {p.studentId} — {p.name}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {!currentRx ? (
        <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
          <Pill className="w-12 h-12 mx-auto text-purple-400" />
          <h3 className="font-bold text-slate-700 dark:text-slate-200 text-base">No Prescriptions Found</h3>
          <p className="text-xs">No active or historical prescriptions found for student <strong>{studentId || 'selected'}</strong>.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Prescription Info & Version Ledger */}
          <div className="space-y-4 lg:col-span-1">
            <div className="card-clinical p-5 space-y-3">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Prescription Ledger</span>
              <div className="font-extrabold text-base text-slate-800 dark:text-slate-100">
                Rx #{currentRx.id} ({studentId})
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-900 text-xs text-purple-900 dark:text-purple-300">
                Current Status: <strong>{currentRx.status}</strong> · Active Version: <strong>v{currentVer.version}</strong>
              </div>
            </div>

            {/* Version History Stack */}
            <div className="card-clinical p-5 space-y-3">
              <h4 className="font-bold text-xs uppercase text-slate-400">Version History Stack</h4>
              <div className="space-y-2 text-xs">
                {currentRx.history.map(ver => (
                  <div key={ver.version} className={`p-3 rounded-xl border ${
                    ver.version === currentVer.version
                      ? 'bg-purple-600 text-white font-bold border-purple-600 shadow-md'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span>Version {ver.version}</span>
                      <span className="text-[10px] opacity-80">{ver.status}</span>
                    </div>
                    <div className="text-[10px] opacity-75 mt-0.5">{ver.createdAt}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Active Version / Edit Panel */}
          <div className="space-y-4 lg:col-span-2">
            {!isEditing ? (
              <div className="card-clinical p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                      Active Prescription — Version {currentVer.version}
                    </h3>
                    <p className="text-xs text-slate-400">Issued by {currentVer.createdByDoctor} on {currentVer.createdAt}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsWhatsAppOpen(true)}
                      className="px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
                      title="Share this prescription directly to student's WhatsApp"
                    >
                      <Share2 className="w-4 h-4" /> Share via WhatsApp
                    </button>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" /> Modify Dosage / Issue Version {currentVer.version + 1}
                    </button>
                  </div>
                </div>

                {currentVer.changeReason && (
                  <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-300">
                    <span className="font-bold">Version {currentVer.version} Modification Rationale:</span> {currentVer.changeReason}
                  </div>
                )}

                {/* Items List */}
                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase text-slate-400">Prescribed Items (v{currentVer.version})</h4>

                  {currentVer.items.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{item.medicineName}</span>
                          <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 font-bold text-[10px]">
                            {item.dosage}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold text-[10px]">
                            Qty: {item.quantity !== undefined ? item.quantity : healthStore.calculateTabletCount(item)}
                          </span>
                          <span className="text-purple-600 font-bold">{item.durationDays} Days</span>
                        </div>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 font-semibold">{item.frequency}</p>
                      <p className="text-slate-400 italic text-[11px]">{item.instructions}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* EDIT FORM */
              <form onSubmit={handleCreateNewVersion} className="card-clinical p-6 space-y-5 text-xs">
                <div className="font-bold text-base text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-3">
                  Create Prescription Version {currentVer.version + 1}
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">Reason for Modification</label>
                  <input
                    type="text"
                    required
                    value={changeReason}
                    onChange={e => setChangeReason(e.target.value)}
                    placeholder="Enter reason for modifying dosage or medications..."
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between font-bold">
                    <span>Prescribed Medications</span>
                    <button
                      type="button"
                      onClick={() => setEditedItems([...editedItems, { id: `${Date.now()}`, medicineName: '', dosage: '1 tablet', frequency: 'Twice daily', durationDays: 3, quantity: 6, instructions: '' }])}
                      className="text-purple-600 flex items-center gap-1 text-xs"
                    >
                      <Plus className="w-4 h-4" /> Add Item
                    </button>
                  </div>

                  {editedItems.length > 0 && (
                    <div className="hidden md:grid md:grid-cols-12 gap-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <span className="md:col-span-4">Medicine Name</span>
                      <span className="md:col-span-3">Dosage &amp; Frequency</span>
                      <span className="md:col-span-2 text-center">Days</span>
                      <span className="md:col-span-2 text-center text-purple-600 dark:text-purple-400">Qty (Stock)</span>
                      <span className="md:col-span-1 text-right">Action</span>
                    </div>
                  )}

                  {editedItems.map((item, idx) => (
                    <div key={item.id || idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                      <div className="md:col-span-4">
                        <label className="md:hidden block text-[10px] font-bold text-slate-400 mb-1">MEDICINE</label>
                        <input
                          type="text"
                          list="manager-catalog-medicines"
                          placeholder="Medicine Name"
                          value={item.medicineName}
                          onChange={e => {
                            const val = e.target.value;
                            const list = [...editedItems];
                            list[idx].medicineName = val;
                            const matched = MEDICINE_CATALOG.find(m => m.name.toLowerCase() === val.toLowerCase());
                            if (matched) {
                              if (list[idx].dosage === '1 tablet' || !list[idx].dosage) {
                                list[idx].dosage = matched.defaultDosage;
                              }
                              if (!list[idx].frequency || list[idx].frequency === 'Twice daily') {
                                list[idx].frequency = `${matched.defaultDosage} · ${matched.defaultFrequency}`;
                              }
                              if (!list[idx].instructions) {
                                list[idx].instructions = matched.defaultInstructions;
                              }
                              list[idx].durationDays = matched.defaultDurationDays || list[idx].durationDays;
                              list[idx].quantity = healthStore.calculateTabletCount(list[idx]);
                            }
                            setEditedItems(list);
                          }}
                          className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border font-semibold text-xs"
                        />
                        {item.medicineName && (() => {
                          const st = healthStore.getMedicineStock(item.medicineName);
                          if (!st) return null;
                          const deductQty = item.quantity !== undefined ? item.quantity : healthStore.calculateTabletCount(item);
                          const remaining = Math.max(0, st.quantity - deductQty);
                          return (
                            <div className="mt-0.5 flex items-center gap-1.5 text-[9px] font-bold flex-wrap">
                              {st.status === 'Full Stock' && (
                                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Full Stock ({st.quantity} in stock)
                                </span>
                              )}
                              {st.status === 'Less Stock' && (
                                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Less Stock ({st.quantity} in stock)
                                </span>
                              )}
                              {st.status === 'Restock' && (
                                <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1 animate-pulse">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Restock Required ({st.quantity} in stock)
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
                      <div className="md:col-span-3">
                        <label className="md:hidden block text-[10px] font-bold text-slate-400 mb-1">DOSAGE &amp; FREQUENCY</label>
                        <input
                          type="text"
                          placeholder="Dosage & Frequency"
                          value={item.frequency}
                          onChange={e => {
                            const list = [...editedItems];
                            list[idx].frequency = e.target.value;
                            list[idx].quantity = healthStore.calculateTabletCount(list[idx]);
                            setEditedItems(list);
                          }}
                          className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border font-semibold text-xs"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="md:hidden block text-[10px] font-bold text-slate-400 mb-1">DAYS</label>
                        <input
                          type="number"
                          min="1"
                          placeholder="Days"
                          value={item.durationDays || 3}
                          onKeyDown={e => { if (e.key === '-' || e.key === '+' || e.key === 'e') e.preventDefault(); }}
                          onChange={e => {
                            const parsed = parseInt(e.target.value, 10);
                            const val = isNaN(parsed) || parsed < 1 ? 1 : Math.abs(parsed);
                            const list = [...editedItems];
                            list[idx].durationDays = val;
                            list[idx].quantity = healthStore.calculateTabletCount(list[idx]);
                            setEditedItems(list);
                          }}
                          className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border font-bold text-center text-xs"
                          title="Duration in days (minimum 1)"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="md:hidden block text-[10px] font-bold text-purple-600 dark:text-purple-400 mb-1">QTY (DISPENSE)</label>
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={item.quantity !== undefined ? item.quantity : healthStore.calculateTabletCount(item)}
                          onKeyDown={e => { if (e.key === '-' || e.key === '+' || e.key === 'e') e.preventDefault(); }}
                          onChange={e => {
                            const parsed = parseInt(e.target.value, 10);
                            const val = isNaN(parsed) || parsed < 1 ? 1 : Math.abs(parsed);
                            const list = [...editedItems];
                            list[idx].quantity = val;
                            setEditedItems(list);
                          }}
                          className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border-2 border-purple-400 dark:border-purple-500 font-bold text-center text-purple-700 dark:text-purple-300 text-xs shadow-xs"
                          title="Quantity to dispense and deduct from admin inventory"
                        />
                      </div>
                      <div className="md:col-span-1 flex justify-end md:justify-center">
                        <button
                          type="button"
                          onClick={() => setEditedItems(editedItems.filter((_, i) => i !== idx))}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Follow-up Consultation Date Picker */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <FollowUpDatePicker
                    value={editedFollowUpDate}
                    onChange={setEditedFollowUpDate}
                    label="Follow-up Reconsultation Date (Optional)"
                    placeholder="dd-mm-yyyy"
                    accentColor="purple"
                  />
                </div>

                {updateError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-800">
                    {updateError}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    disabled={isUpdating}
                    className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all disabled:opacity-60"
                  >
                    {isUpdating ? 'Saving Version…' : `Issue Version ${currentVer.version + 1}`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Datalist for Medicine Auto-completion */}
      <datalist id="manager-catalog-medicines">
        {MEDICINE_CATALOG.map(m => (
          <option key={m.id} value={m.name}>
            {m.generic} ({m.category})
          </option>
        ))}
      </datalist>

      {/* Version Diff Viewer Modal */}
      {currentRx && currentRx.history.length > 1 && (
        <VersionDiffViewer
          isOpen={showDiff}
          onClose={() => setShowDiff(false)}
          prescription={currentRx}
          v1={currentRx.history[currentRx.history.length - 1]}
          v2={currentVer}
        />
      )}

      {/* WhatsApp Share Modal */}
      {currentRx && (
        <WhatsAppShareModal
          isOpen={isWhatsAppOpen}
          onClose={() => setIsWhatsAppOpen(false)}
          prescription={currentRx}
          profile={currentProfile}
        />
      )}

    </div>
  );
};
