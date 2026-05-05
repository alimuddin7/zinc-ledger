---
trigger: always_on
---

# Financial Brain & Health Ratios (Updated)

## Core Metrics
- **Total Net Worth**: Σ Assets - Σ Liabilities.
- **Liquid Net Worth**: Σ Liquid Assets - Σ Short-term Liabilities.
- **Savings Rate**: (Income - Expenses) / Income.
- **DSR (Debt Service Ratio)**: Total Cicilan Bulanan / Total Income (Max: 35%).
- **Debt-to-Asset Ratio**: Total Hutang / Total Aset (Max: 30%).

## Classification & Rules:
- **Assets**: 
  - *Liquid*: Cash, Bank, Reksadana Pasar Uang.
  - *Non-Liquid*: Investasi Properti, Saham (Long-term), Kendaraan.
  - *Rule*: Kendaraan wajib menyusut (Depreciation) 10% per tahun secara otomatis.
- **Liabilities**: Kartu Kredit (Short-term), Pinjaman Bank, Cicilan Kendaraan/KPR (Long-term).
- **Cashflow**: 
  - *Income*: Gaji Netto, Passive Income, Side-hustle.
  - *Expenses*: Fixed (Listrik, SPP), Variable (Makan, Bensin), Lifestyle.

## Family & Lifecycle Logic
- **Emergency Fund (EF) Target**:
   - IF status == 'single' THEN target = 6 * Monthly_Total_Outflow
   - IF status == 'married' THEN target = 9 * Monthly_Total_Outflow
   - IF status == 'married' AND kids > 0 THEN target = (12 + kids) * Monthly_Total_Outflow
- **Education Reserve**: 
  - Target Umur: 7 (SD), 12 (SMP), 15 (SMA), 18 (Kuliah).
  - Formula: `Current_Cost * (1.10 ^ years_to_target)`.

## Alert Thresholds:
- **Red Alert**: DSR > 35% ATAU Savings Rate < 0% (Defisit).
- **Yellow Warning**: Savings Rate < 15% (Married) atau EF < 50% dari Target.
- **Health Check**: Jika Net Worth turun 3 bulan berturut-turut.