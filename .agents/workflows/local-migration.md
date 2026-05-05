---
description: 
---

# Workflow: Database Initialization

1. **Step 1**: Cek apakah file SQLite sudah ada.
2. **Step 2**: Jalankan `PRAGMA user_version` untuk cek versi skema.
3. **Step 3 (Migration)**: Jika versi baru, jalankan script `CREATE TABLE`:
   - `financial_components`: id, name, type, frequency, metadata.
   - `financial_records`: id, component_id, amount, start_date, end_date.
4. **Step 4**: Jika database baru, masukkan "Seed Data" dasar (misal: Cash, Gaji, Biaya Makan).