import { describe, it, expect } from 'vitest';
import { parseMedicineFile } from '../utils/medicineFileParser';

describe('parseMedicineFile', () => {
  it('extracts medicines from a CSV file with headers', () => {
    const csv = [
      'Name,Generic,Category,Default Dosage,Quantity,Min Threshold,Symptoms',
      'Azithromycin 500mg,Azithromycin,Tablet,1 tablet,120,20,"Throat infection, fever"',
      'Amoxicillin 250mg,Amoxicillin,Capsule,1 capsule,80,15,Bacterial infection',
    ].join('\n');

    const result = parseMedicineFile(csv, 'medicines.csv');
    expect(result.warnings).toHaveLength(0);
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toMatchObject({
      name: 'Azithromycin 500mg',
      generic: 'Azithromycin',
      category: 'Tablet',
      isTablet: true,
      quantity: 120,
      minThreshold: 20,
      symptoms: 'Throat infection, fever',
    });
    expect(result.items[1]).toMatchObject({
      name: 'Amoxicillin 250mg',
      category: 'Capsule',
      quantity: 80,
    });
  });

  it('extracts medicines from a JSON array and deduplicates within file', () => {
    const json = JSON.stringify([
      { medicineName: 'Cough Syrup 100ml', category: 'Syrup', qty: 45, indications: 'Dry cough' },
      { medicineName: 'Cough Syrup 100ml', category: 'Syrup', qty: 45 },
      { name: 'Insulin Vial', category: 'Injection', stock: 15 },
    ]);

    const result = parseMedicineFile(json, 'formulary.json');
    expect(result.items).toHaveLength(2);
    expect(result.items[0].isTablet).toBe(false);
    expect(result.items[0].quantity).toBe(45);
    expect(result.items[1].category).toBe('Injection');
    expect(result.warnings[0]).toContain('duplicate');
  });

  it('extracts medicines from a plain-text list with trailing quantities', () => {
    const txt = [
      '1. Paracetamol 650mg - 200',
      '- Cetirizine 10mg (90 tablets)',
      '* Betadine Ointment',
    ].join('\n');

    const result = parseMedicineFile(txt, 'ward_list.txt');
    expect(result.items).toHaveLength(3);
    expect(result.items[0]).toMatchObject({ name: 'Paracetamol 650mg', quantity: 200, category: 'Tablet' });
    expect(result.items[1]).toMatchObject({ name: 'Cetirizine 10mg', quantity: 90, category: 'Tablet' });
    expect(result.items[2]).toMatchObject({ name: 'Betadine Ointment', quantity: 100, category: 'Ointment' });
  });
});
