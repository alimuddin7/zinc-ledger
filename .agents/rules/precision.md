---
trigger: always_on
---

# Data Precision & Normalization

- **Normalization Table (Target: Monthly)**:
  - Daily: `amount * 30.44`
  - Weekly: `amount * 4.33`
  - Bi-Monthly: `amount / 2`
  - Yearly: `amount / 12`
- **Temporal Logic**: Dilarang menggunakan `UPDATE` pada kolom `amount`. 
  - Tutup record lama dengan `end_date = now()`.
  - Buat record baru dengan `start_date = now()`.
- **Rounding**: Gunakan 2 desimal untuk tampilan (toFixed(2)), tapi gunakan integer atau numeric presisi tinggi untuk kalkulasi internal.