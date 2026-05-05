# 💎 Zinc Ledger

**Zinc Ledger** adalah aplikasi manajemen keuangan pribadi yang modern, aman, dan cerdas. Dibangun dengan fokus pada **Offline-First**, aplikasi ini memungkinkan Anda melacak Kekayaan Bersih (Net Worth), kesehatan arus kas, dan rasio finansial secara real-time tanpa bergantung pada server ekspor.

![Modern Adaptive UI](https://img.shields.io/badge/UI-Adaptive_Zinc-black?style=for-the-badge)
![Expo](https://img.shields.io/badge/Platform-Expo_SDK_51-blue?style=for-the-badge)
![SQLite](https://img.shields.io/badge/Database-SQLite-green?style=for-the-badge)

---

## 🚀 Fitur Utama

### 📊 Dashboard Cerdas
- **Net Worth Monitoring**: Lacak aset liquid (cash, bank) dan non-liquid (properti, kendaraan).
- **Temporal Appreciation/Depreciation**: Aset Anda "hidup". Emas dan rumah akan naik nilainya secara otomatis, sementara kendaraan akan menyusut secara otomatis berdasarkan target tahunan.
- **Dynamic DSR (Debt Service Ratio)**: Monitor apakah beban hutang Anda sudah melampaui batas aman (35%) secara real-time.

### 🧠 Financial Brain & Health Check
- **Emergency Fund Target**: Kalkulasi otomatis target dana darurat berdasarkan status (Single/Married) dan jumlah anak.
- **Savings Rate Tracker**: Pastikan pengeluaran Anda tidak lebih besar dari pendapatan.
- **Predictive Alerts**: Peringatan dini jika cicilan di masa depan akan membuat keuangan Anda tidak sehat.
- **Saran Actionable**: Setiap peringatan dilengkapi dengan saran praktis untuk memperbaiki kondisi finansial Anda.

### 🛡️ Data & Privasi
- **100% Local**: Data Anda disimpan di database SQLite lokal perangkat Anda. Tidak ada data yang dikirim ke server pihak ketiga.
- **Temporal Integrity**: Menggunakan pola *Close-and-Insert*. Sejarah perubahan saldo Anda tersimpan dengan rapi tanpa menghapus data lama.

---

## 🛠️ Tech Stack

- **Frontend**: React Native, Expo Router.
- **Styling**: NativeWind (Tailwind CSS for React Native).
- **Persistence**: `expo-sqlite` dengan sistem migrasi otomatis.
- **State Management**: Zustand (untuk UI state & optimistic updates).
- **Icons**: Lucide React Native.

---

## 🏁 Memulai

### Prasyarat
- Node.js (v18 atau terbaru)
- Expo Go di perangkat mobile atau Android/iOS Simulator

### Instalasi

1. Clone repositori ini:
   ```bash
   git clone <repository-url>
   cd MyFinancialApp
   ```

2. Instal dependensi:
   ```bash
   npm install
   ```

3. Jalankan aplikasi:
   ```bash
   npx expo start
   ```

---

## 📐 Aturan Finansial (Financial Rules)

Aplikasi ini mengikuti standar perencanaan keuangan modern:
- **DSR Max**: 35% dari pendapatan bulanan.
- **Savings Rate Min**: 10-15% (bergantung status).
- **Dana Darurat**: 
  - Single: 6x pengeluaran.
  - Married: 9x pengeluaran.
  - Married + Kids: (12 + jumlah anak)x pengeluaran.

---

## 🤝 Kontribusi
Aplikasi ini dikembangkan untuk penggunaan pribadi dan edukasi. Masukan dan kontribusi sangat dihargai melalui Pull Requests.

---

**Zinc Ledger** — *Kendalikan masa depan finansial Anda, satu transaksi pada satu waktu.*
