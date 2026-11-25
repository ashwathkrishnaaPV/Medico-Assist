import React, { useState } from 'react';
import { X, Send, Copy, Check, Phone, User, Users, ExternalLink } from 'lucide-react';
import { Prescription, StudentProfileData } from '../../types';
import { formatPrescriptionWhatsAppMessage, openWhatsAppPrescription } from '../../utils/whatsappShare';

interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  prescription: Prescription;
  profile?: StudentProfileData;
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  isOpen,
  onClose,
  prescription,
  profile
}) => {
  const studentPhone = profile?.phone || '';
  const parentPhone = profile?.emergencyContact?.phone || '';

  const [selectedTarget, setSelectedTarget] = useState<'STUDENT' | 'PARENT' | 'CUSTOM'>(() => {
    if (studentPhone) return 'STUDENT';
    if (parentPhone) return 'PARENT';
    return 'CUSTOM';
  });

  const [customPhone, setCustomPhone] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentPhone =
    selectedTarget === 'STUDENT'
      ? studentPhone
      : selectedTarget === 'PARENT'
      ? parentPhone
      : customPhone;

  const formattedMessage = formatPrescriptionWhatsAppMessage(prescription, profile);

  const handleSend = () => {
    openWhatsAppPrescription(currentPhone, formattedMessage);
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto text-slate-800 dark:text-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 p-5 sm:p-6 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner shrink-0">
              <span className="text-2xl">💬</span>
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/25 text-[10px] font-bold uppercase tracking-wider">
                Direct WhatsApp Dispatch
              </div>
              <h2 className="text-lg sm:text-xl font-black mt-0.5">Share Prescription</h2>
              <p className="text-xs text-white/90 font-medium">
                {profile?.name || prescription.studentId} · Rx #{prescription.id}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          
          {/* Recipient Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Select Recipient Contact
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {studentPhone && (
                <button
                  type="button"
                  onClick={() => setSelectedTarget('STUDENT')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedTarget === 'STUDENT'
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-950 dark:text-emerald-200 font-bold shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-[11px] uppercase">Student Phone</span>
                  </div>
                  <div className="font-mono text-sm font-bold text-slate-800 dark:text-slate-100">
                    +91 {studentPhone}
                  </div>
                </button>
              )}

              {parentPhone && (
                <button
                  type="button"
                  onClick={() => setSelectedTarget('PARENT')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedTarget === 'PARENT'
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-950 dark:text-emerald-200 font-bold shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-3.5 h-3.5 text-teal-600" />
                    <span className="text-[11px] uppercase">Parent / Contact</span>
                  </div>
                  <div className="font-mono text-sm font-bold text-slate-800 dark:text-slate-100">
                    +91 {parentPhone}
                  </div>
                </button>
              )}
            </div>

            {/* Custom Phone option if needed */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setSelectedTarget('CUSTOM')}
                className={`text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  selectedTarget === 'CUSTOM' ? 'text-emerald-600 font-bold' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <span>Need to send to a different number?</span>
              </button>

              {selectedTarget === 'CUSTOM' && (
                <div className="mt-2 relative animate-fade-in">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="tel"
                    placeholder="Enter 10-digit mobile number"
                    value={customPhone}
                    onChange={e => setCustomPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-emerald-400 text-sm font-bold focus:outline-none"
                    autoFocus
                  />
                </div>
              )}
            </div>
          </div>

          {/* Message Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                WhatsApp Message Preview
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-mono text-xs whitespace-pre-wrap max-h-52 overflow-y-auto text-slate-700 dark:text-slate-300 leading-relaxed shadow-inner">
              {formattedMessage}
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-5 sm:p-6 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Target: <strong>{currentPhone ? `+91 ${currentPhone}` : 'WhatsApp Prompt'}</strong></span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 sm:w-auto px-4 py-2.5 rounded-full border border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              Cancel
            </button>
            
            <button
              type="button"
              onClick={handleSend}
              className="w-1/2 sm:w-auto px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Redirect to WhatsApp</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

