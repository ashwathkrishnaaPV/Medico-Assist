import React, { useState, useEffect } from 'react';
import { Pill, History, Edit3, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { healthStore } from '../../services/healthStore';
import { authService } from '../../services/authService';
import { Prescription, PrescriptionItem, StudentProfileData } from '../../types';
import { VersionDiffViewer } from '../common/VersionDiffViewer';

export const PrescriptionManager: React.FC = () => {
  const currentDoctor = authService.getCurrentUser();
  const doctorName = currentDoctor.name || 'Campus Physician';

  const [allProfiles, setAllProfiles] = useState<StudentProfileData[]>([]);
  const [studentId, setStudentId] = useState<string>('');
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);

  // Edit State for Version 2 creation
  const [isEditing, setIsEditing] = useState(false);
  const [changeReason, setChangeReason] = useState('');
  const [editedItems, setEditedItems] = useState<PrescriptionItem[]>([]);
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
        }
      } else {
        setPrescriptions([]);
      }
    };

    load();
    const unsub = healthStore.subscribe(load);
    return () => unsub();
  }, [studentId, selectedRx]);

  const handleCreateNewVersion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRx) return;

    const updated = healthStore.updatePrescriptionVersion(currentRx.id, {
      doctorName: doctorName,
      items: editedItems,
      changeReason: changeReason || 'Adjusted dosage based on clinical progress.',
      notes: 'Updated prescription version issued.'
    });

    if (updated) {
      setSelectedRx(updated);
      setIsEditing(false);
    }
  };

  const currentRx = selectedRx || prescriptions[0];
  const currentVer = currentRx?.currentVersion;

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

                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 flex items-center gap-1.5"
                  >
                    <Edit3 className="w-4 h-4" /> Modify Dosage / Issue Version {currentVer.version + 1}
                  </button>
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
                        <span>{item.medicineName}</span>
                        <span className="text-purple-600">{item.durationDays} Days</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 font-semibold">{item.dosage} · {item.frequency}</p>
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

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">Clinical Change Reason (Mandatory Rationale)</label>
                  <textarea
                    rows={2}
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
                      onClick={() => setEditedItems([...editedItems, { id: `${Date.now()}`, medicineName: '', dosage: '1 tablet', frequency: 'Twice daily', durationDays: 5, instructions: '' }])}
                      className="text-purple-600 flex items-center gap-1 text-xs"
                    >
                      <Plus className="w-4 h-4" /> Add Item
                    </button>
                  </div>

                  {editedItems.map((item, idx) => (
                    <div key={item.id || idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Medicine Name"
                        value={item.medicineName}
                        onChange={e => {
                          const list = [...editedItems];
                          list[idx].medicineName = e.target.value;
                          setEditedItems(list);
                        }}
                        className="p-2 rounded-lg bg-white dark:bg-slate-900 border font-semibold col-span-2"
                      />
                      <input
                        type="text"
                        placeholder="Dosage & Frequency"
                        value={item.frequency}
                        onChange={e => {
                          const list = [...editedItems];
                          list[idx].frequency = e.target.value;
                          setEditedItems(list);
                        }}
                        className="p-2 rounded-lg bg-white dark:bg-slate-900 border font-semibold"
                      />
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          placeholder="Days"
                          value={item.durationDays || 5}
                          onKeyDown={e => { if (e.key === '-' || e.key === '+' || e.key === 'e') e.preventDefault(); }}
                          onChange={e => {
                            const parsed = parseInt(e.target.value, 10);
                            const val = isNaN(parsed) || parsed < 1 ? 1 : Math.abs(parsed);
                            const list = [...editedItems];
                            list[idx].durationDays = val;
                            setEditedItems(list);
                          }}
                          className="w-16 p-2 rounded-lg bg-white dark:bg-slate-900 border font-bold text-center"
                          title="Duration in days (minimum 1)"
                        />
                        <span className="text-[10px] text-slate-400">days</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditedItems(editedItems.filter((_, i) => i !== idx))}
                        className="text-rose-500 hover:text-rose-700 text-right pr-2"
                      >
                        <Trash2 className="w-4 h-4 ml-auto" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold"
                  >
                    Issue Version {currentVer.version + 1}
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>
      )}

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

    </div>
  );
};
