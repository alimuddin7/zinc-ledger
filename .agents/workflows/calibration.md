---
description: 
---

# Workflow: Balance Calibration

1. **Trigger**: User menginput angka saldo baru untuk sebuah komponen.
2. **Action (Transaction)**:
   - Cari record di `financial_records` yang `end_date IS NULL` untuk komponen tersebut.
   - Update `end_date` record tersebut menjadi timestamp saat ini.
   - Insert baris baru ke `financial_records` dengan `amount` baru dan `start_date` saat ini.
3. **Refresh**: Pemicu re-fetch pada Dashboard Hook untuk memperbarui Net Worth secara real-time.