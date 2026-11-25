function computeStockStatus(quantity) {
  const q = Number(quantity) || 0;
  if (q >= 50) return 'Full Stock';
  if (q >= 10) return 'Less Stock';
  return 'Restock';
}

function calculateDeductQuantity(item) {
  if (item.quantity && Number(item.quantity) > 0) return Number(item.quantity);
  const days = Math.max(1, parseInt(item.durationDays, 10) || 3);
  const freq = (item.frequency || '').toLowerCase().trim();

  let freqPerDay = 2;
  if (freq.includes('four') || freq.includes('qid') || freq.includes('4 times') || freq.includes('4x') || freq.includes('4/day') || freq.includes('qds')) {
    freqPerDay = 4;
  } else if (freq.includes('thrice') || freq.includes('three') || freq.includes('1-1-1') || freq.includes('tid') || freq.includes('3 times') || freq.includes('3x') || freq.includes('3/day') || freq.includes('tds')) {
    freqPerDay = 3;
  } else if (freq.includes('twice') || freq.includes('two') || freq.includes('1-0-1') || freq.includes('0-1-1') || freq.includes('1-1-0') || freq.includes('bid') || freq.includes('bd') || freq.includes('2 times') || freq.includes('2x') || freq.includes('2/day') || freq.includes('morning and night') || freq.includes('morning & night') || freq.includes('morning and evening')) {
    freqPerDay = 2;
  } else if (freq.includes('once') || freq.includes('one') || freq.includes('1-0-0') || freq.includes('0-0-1') || freq.includes('0-1-0') || freq.includes('od') || freq.includes('daily') || freq.includes('1 time') || freq.includes('1x') || freq.includes('1/day') || freq.includes('bedtime') || freq.includes('night') || freq.includes('morning') || freq.includes('hs')) {
    freqPerDay = 1;
  }

  const dosage = (item.dosage || '').toLowerCase();
  let doseMultiplier = 1;
  const numMatch = dosage.match(/(\d+)\s*(tab|cap|pill|tablet|capsule)/);
  if (numMatch) {
    doseMultiplier = Math.max(1, parseInt(numMatch[1], 10));
  } else if (dosage.includes('2 tab') || dosage.includes('2 cap') || dosage.includes('2 tablet')) {
    doseMultiplier = 2;
  } else if (dosage.includes('3 tab') || dosage.includes('3 cap') || dosage.includes('3 tablet')) {
    doseMultiplier = 3;
  }

  return Math.max(1, days * freqPerDay * doseMultiplier);
}

function matchMedicine(allMeds, searchName) {
  const clean = (searchName || '').toLowerCase().trim();
  if (!clean) return null;

  let match = allMeds.find(
    (m) =>
      m.name.toLowerCase() === clean ||
      (m.generic && m.generic.toLowerCase() === clean)
  );
  if (match) return match;

  const strippedSearch = clean.replace(/^(t\.|tab\.|cap\.|inj\.|syp\.|tablet\s+|capsule\s+)/i, '').trim();
  match = allMeds.find((m) => {
    const normName = m.name.toLowerCase().replace(/^(t\.|tab\.|cap\.|inj\.|syp\.|tablet\s+|capsule\s+)/i, '').trim();
    return normName === strippedSearch || normName.startsWith(strippedSearch) || strippedSearch.startsWith(normName);
  });
  if (match) return match;

  match = allMeds.find(
    (m) =>
      m.name.toLowerCase().includes(clean) ||
      clean.includes(m.name.toLowerCase()) ||
      (m.generic && (m.generic.toLowerCase().includes(clean) || clean.includes(m.generic.toLowerCase())))
  );
  if (match) return match;

  const words = clean.replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter((w) => w.length > 2);
  if (words.length > 0) {
    match = allMeds.find((m) => {
      const medName = m.name.toLowerCase();
      const medGen = (m.generic || '').toLowerCase();
      return words.some((w) => medName.includes(w) || medGen.includes(w));
    });
    if (match) return match;
  }

  return null;
}

module.exports = {
  computeStockStatus,
  calculateDeductQuantity,
  matchMedicine
};
