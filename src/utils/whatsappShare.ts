import { Prescription, StudentProfileData } from '../types';

export function formatPrescriptionWhatsAppMessage(
  prescription: Prescription,
  profile?: StudentProfileData
): string {
  const version = prescription.currentVersion || prescription.history?.[0] || {
    version: 1,
    items: [],
    createdAt: new Date().toLocaleDateString()
  };

  const studentName = profile?.name || prescription.studentId;
  const studentRoll = profile?.studentId || prescription.studentId;
  const doctorName = prescription.doctorName || version.createdByDoctor || 'Dr. Nivetha M.B.B.S';
  const date = version.createdAt || prescription.createdAt || new Date().toLocaleDateString();

  let text = `🏥 *SRI ESHWAR COLLEGE OF ENGINEERING*\n`;
  text += `🏛️ *Campus Health Medical Centre — Official Prescription*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `📋 *Rx ID:* #${prescription.id} (Version ${version.version})\n`;
  text += `📅 *Date:* ${date}\n`;
  text += `🩺 *Prescribing Doctor:* ${doctorName}\n`;
  text += `🎓 *Student:* ${studentName} (${studentRoll})\n`;
  if (prescription.diagnosis) {
    text += `🩺 *Diagnosis / Chief Complaint:* ${prescription.diagnosis}\n`;
  }
  text += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  text += `💊 *PRESCRIBED MEDICATIONS:*\n`;

  if (version.items && version.items.length > 0) {
    version.items.forEach((item, index) => {
      text += `\n*${index + 1}. ${item.medicineName}*\n`;
      text += `   • *Dosage:* ${item.dosage || '1 tablet'}\n`;
      text += `   • *Frequency:* ${item.frequency || 'As directed'}\n`;
      text += `   • *Duration:* ${item.durationDays || 3} Days\n`;
      if (item.quantity) {
        text += `   • *Dispensed Quantity:* ${item.quantity} units\n`;
      }
      if (item.instructions) {
        text += `   • *Instructions:* ${item.instructions}\n`;
      }
    });
  } else {
    text += `\n(No medications listed)\n`;
  }

  if (version.notes) {
    text += `\n📝 *Doctor's Clinical Notes & Advice:*\n${version.notes}\n`;
  }

  if (version.followUpDate) {
    text += `\n🗓️ *Scheduled Follow-Up:* ${version.followUpDate}\n`;
  }

  text += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `📞 *Medical Centre Contact:* +91-44-2257-0000\n`;
  text += `📍 *Location:* Campus Medical Centre, Ground Floor, Health Wing\n`;
  text += `⚠️ _Note: This digital prescription is issued by SECE Campus Medical Centre. Please consume medicines strictly as prescribed by the campus physician._`;

  return text;
}

export function buildWhatsAppUrl(phone: string | undefined, message: string): string {
  let cleanPhone = (phone || '').replace(/\D/g, '');
  if (cleanPhone.length === 10) {
    cleanPhone = '91' + cleanPhone;
  }
  const encoded = encodeURIComponent(message);
  return cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
}

export function openWhatsAppPrescription(
  phone: string | undefined,
  message: string
): void {
  const url = buildWhatsAppUrl(phone, message);
  window.open(url, '_blank', 'noopener,noreferrer');
}

