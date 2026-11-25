const fs = require('fs');
const path = require('path');

const tsFile = path.join(__dirname, '../../src/data/medicineCatalog.ts');
const raw = fs.readFileSync(tsFile, 'utf8');

// Match the array content
const startIdx = raw.indexOf('export const MEDICINE_CATALOG: MedicineItem[] = [');
if (startIdx !== -1) {
  const arrayCode = raw.substring(startIdx + 'export const MEDICINE_CATALOG: MedicineItem[] = '.length);
  // Find matching closing bracket
  let depth = 0;
  let endIdx = 0;
  for (let i = 0; i < arrayCode.length; i++) {
    if (arrayCode[i] === '[') depth++;
    else if (arrayCode[i] === ']') {
      depth--;
      if (depth === 0) {
        endIdx = i + 1;
        break;
      }
    }
  }

  const jsArrayCode = arrayCode.substring(0, endIdx);
  const fn = new Function('return ' + jsArrayCode);
  const catalog = fn();

  const outPath = path.join(__dirname, '../data/medicine_catalog.json');
  fs.writeFileSync(outPath, JSON.stringify(catalog, null, 2));
  console.log(`✅ Successfully exported ${catalog.length} medicines to ${outPath}`);
} else {
  console.error('Could not find MEDICINE_CATALOG array in file');
}

