export interface ExtractedMedicineInput {
  name: string;
  generic: string;
  category: string;
  isTablet: boolean;
  defaultDosage: string;
  symptoms: string;
  quantity: number;
  minThreshold: number;
}

export interface MedicineParseResult {
  items: ExtractedMedicineInput[];
  warnings: string[];
}

const VALID_CATEGORIES = new Set([
  'Tablet',
  'Capsule',
  'Syrup',
  'Injection',
  'Ointment',
  'Drops',
  'Inhaler',
  'Other',
]);

function inferCategory(rawCategory: string, name: string): { category: string; isTablet: boolean; defaultDosage: string } {
  const combined = `${rawCategory} ${name}`.toLowerCase();
  let category = 'Tablet';

  for (const valid of VALID_CATEGORIES) {
    if (rawCategory.trim().toLowerCase() === valid.toLowerCase()) {
      category = valid;
      break;
    }
  }

  if (!rawCategory.trim()) {
    if (/\b(cap|capsule|capsules)\b/.test(combined)) category = 'Capsule';
    else if (/\b(syrup|susp|suspension|liquid|solution|ml)\b/.test(combined)) category = 'Syrup';
    else if (/\b(inj|injection|vial|ampoule)\b/.test(combined)) category = 'Injection';
    else if (/\b(oint|ointment|cream|gel|lotion)\b/.test(combined)) category = 'Ointment';
    else if (/\b(drop|drops|eye drop|ear drop)\b/.test(combined)) category = 'Drops';
    else if (/\b(inhaler|rotacap|puff|spray|neb)\b/.test(combined)) category = 'Inhaler';
  }

  const isTablet = category === 'Tablet' || category === 'Capsule';
  const defaultDosage =
    category === 'Capsule'
      ? '1 capsule'
      : category === 'Syrup'
        ? '5 ml'
        : category === 'Drops'
          ? '2 drops'
          : category === 'Ointment'
            ? 'Apply thinly'
            : category === 'Inhaler'
              ? '2 puffs'
              : category === 'Injection'
                ? '1 vial'
                : '1 tablet';

  return { category, isTablet, defaultDosage };
}

function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function toSafeInt(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = Number(String(value ?? '').replace(/[^\d.-]/g, ''));
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function buildRow(raw: Record<string, unknown>): ExtractedMedicineInput | null {
  const normalized: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(raw)) {
    normalized[normalizeHeader(key)] = val;
  }

  const name = String(
    normalized.name ??
      normalized.medicinename ??
      normalized.medicine ??
      normalized.drugname ??
      normalized.drug ??
      normalized.item ??
      normalized.title ??
      ''
  ).trim();

  if (name.length < 2) return null;

  const generic = String(
    normalized.generic ??
      normalized.genericname ??
      normalized.salt ??
      normalized.composition ??
      ''
  ).trim();

  const rawCategory = String(
    normalized.category ?? normalized.type ?? normalized.form ?? normalized.dosageform ?? ''
  ).trim();

  const inferred = inferCategory(rawCategory, name);
  const rawDosage = String(normalized.defaultdosage ?? normalized.dosage ?? normalized.dose ?? '').trim();
  const symptoms = String(
    normalized.symptoms ?? normalized.indications ?? normalized.uses ?? normalized.indication ?? ''
  ).trim();

  const quantity = toSafeInt(
    normalized.quantity ?? normalized.qty ?? normalized.stock ?? normalized.count ?? normalized.units,
    100,
    0,
    100000
  );
  const minThreshold = toSafeInt(
    normalized.minthreshold ?? normalized.minalert ?? normalized.threshold ?? normalized.reorderlevel,
    20,
    1,
    10000
  );

  return {
    name: name.slice(0, 150),
    generic: generic.slice(0, 150),
    category: inferred.category,
    isTablet: typeof normalized.istablet === 'boolean' ? normalized.istablet : inferred.isTablet,
    defaultDosage: (rawDosage || inferred.defaultDosage).slice(0, 80),
    symptoms: symptoms.slice(0, 250),
    quantity,
    minThreshold,
  };
}

function deduplicateItems(items: ExtractedMedicineInput[], warnings: string[]): MedicineParseResult {
  const seen = new Set<string>();
  const unique: ExtractedMedicineInput[] = [];
  let dupCount = 0;

  for (const item of items) {
    const key = item.name.toLowerCase();
    if (seen.has(key)) {
      dupCount++;
      continue;
    }
    seen.add(key);
    unique.push(item);
  }

  if (dupCount > 0) {
    warnings.push(`Skipped ${dupCount} duplicate medicine ${dupCount === 1 ? 'entry' : 'entries'} within the file.`);
  }

  return { items: unique, warnings };
}

function parsePlainTextLine(line: string): ExtractedMedicineInput | null {
  const cleaned = line
    .replace(/^\s*(?:\d+[.)]\s*|[-*•]\s*)/, '')
    .trim();
  if (cleaned.length < 2) return null;

  let working = cleaned;
  let quantity = 100;

  // Match trailing quantity patterns like "Paracetamol 500mg - 150", "Paracetamol 500mg (80)", "Paracetamol 500mg x 60"
  const trailingQtyMatch = working.match(/(?:\s*[-–|:]\s*|\s+x\s*|\s*\()(\d{1,5})\s*(?:units?|tabs?|tablets?|caps?|capsules?|pcs?)?\)?\s*$/i);
  if (trailingQtyMatch) {
    quantity = toSafeInt(trailingQtyMatch[1], 100, 0, 100000);
    working = working.slice(0, trailingQtyMatch.index).trim();
  }

  if (working.length < 2) return null;
  const inferred = inferCategory('', working);

  return {
    name: working.slice(0, 150),
    generic: '',
    category: inferred.category,
    isTablet: inferred.isTablet,
    defaultDosage: inferred.defaultDosage,
    symptoms: '',
    quantity,
    minThreshold: 20,
  };
}

/**
 * Extracts medicine records from uploaded CSV, TSV, JSON, or plain-text files.
 */
export function parseMedicineFile(content: string, fileName: string): MedicineParseResult {
  const warnings: string[] = [];
  const trimmed = content.replace(/^\uFEFF/, '').trim();
  if (!trimmed) {
    return { items: [], warnings: ['The uploaded file is empty.'] };
  }

  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';

  // 1. JSON format
  if (ext === 'json' || trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      const rawList = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.medicines)
          ? parsed.medicines
          : Array.isArray(parsed?.items)
            ? parsed.items
            : Array.isArray(parsed?.data)
              ? parsed.data
              : null;

      if (!rawList) {
        return { items: [], warnings: ['JSON file must contain an array of medicine objects.'] };
      }

      const items: ExtractedMedicineInput[] = [];
      rawList.forEach((entry: unknown, idx: number) => {
        if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
          const row = buildRow(entry as Record<string, unknown>);
          if (row) items.push(row);
          else warnings.push(`Row ${idx + 1}: missing valid medicine name.`);
        } else if (typeof entry === 'string') {
          const row = parsePlainTextLine(entry);
          if (row) items.push(row);
        }
      });

      return deduplicateItems(items, warnings);
    } catch {
      if (ext === 'json') {
        return { items: [], warnings: ['Invalid JSON syntax in uploaded file.'] };
      }
    }
  }

  // 2. Delimited (CSV / TSV / pipe / semicolon) or line-by-line text
  const lines = trimmed
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { items: [], warnings: ['No readable rows found in the file.'] };
  }

  const firstLine = lines[0];
  const delimiter = ext === 'tsv' || firstLine.includes('\t')
    ? '\t'
    : firstLine.includes('|')
      ? '|'
      : firstLine.includes(';')
        ? ';'
        : firstLine.includes(',')
          ? ','
          : null;

  if (delimiter) {
    const firstCells = parseCsvLine(firstLine, delimiter).map(normalizeHeader);
    const hasHeader = firstCells.some((c) =>
      ['name', 'medicinename', 'medicine', 'drugname', 'drug', 'generic', 'category', 'quantity', 'qty', 'stock'].includes(c)
    );

    const items: ExtractedMedicineInput[] = [];
    const startIndex = hasHeader ? 1 : 0;
    const headers = hasHeader
      ? parseCsvLine(firstLine, delimiter)
      : ['name', 'generic', 'category', 'quantity', 'defaultDosage', 'symptoms'];

    for (let i = startIndex; i < lines.length; i++) {
      const cells = parseCsvLine(lines[i], delimiter);
      if (cells.every((c) => !c)) continue;

      const record: Record<string, unknown> = {};
      headers.forEach((h, idx) => {
        if (h && idx < cells.length) {
          record[h] = cells[idx];
        }
      });

      const row = buildRow(record);
      if (row) {
        items.push(row);
      } else {
        warnings.push(`Line ${i + 1}: skipped because medicine name is missing or too short.`);
      }
    }

    return deduplicateItems(items, warnings);
  }

  // 3. Unstructured plain-text medicine list
  const items: ExtractedMedicineInput[] = [];
  lines.forEach((line, idx) => {
    const row = parsePlainTextLine(line);
    if (row) items.push(row);
    else warnings.push(`Line ${idx + 1}: could not extract a medicine name.`);
  });

  return deduplicateItems(items, warnings);
}
