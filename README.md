# 💎 Zinc Ledger

**Zinc Ledger** adalah aplikasi manajemen keuangan pribadi yang modern, aman, dan cerdas. Dibangun dengan fokus pada **Offline-First**, aplikasi ini memungkinkan Anda melacak Kekayaan Bersih (Net Worth), kesehatan arus kas, dan rasio finansial secara real-time tanpa bergantung pada server eksternal.

![Modern Adaptive UI](https://img.shields.io/badge/UI-Adaptive_Zinc-black?style=for-the-badge)
![Expo](https://img.shields.io/badge/Platform-Expo_SDK_51-blue?style=for-the-badge)
![SQLite](https://img.shields.io/badge/Database-SQLite-green?style=for-the-badge)

---

## 🚀 Fitur Utama (Terbaru)

### 📊 Dashboard "Weather App" Aesthetic
- **Immersive Hero Card**: Tampilan saldo utama dengan gradasi dinamis dan efek glassmorphism.
- **Adaptive Theming**: Mendukung Dark/Light mode secara otomatis mengikuti sistem OS.
- **Micro-Animations**: Transisi halus antar elemen untuk pengalaman pengguna yang premium.

### 🧪 Sandbox: Financial Simulator (New)
- **What-If Scenarios**: Simulasikan pembelian aset besar (Mobil, Properti) tanpa mengubah data asli.
- **Loan Projection**: Masukkan harga aset, tenor (bulan), dan bunga (% p.a) untuk melihat estimasi cicilan bulanan.
- **DSR Impact Analysis**: Lihat secara instan bagaimana hutang baru akan mempengaruhi Debt Service Ratio Anda sebelum Anda mengambil keputusan.

### 🛡️ Crisis Simulator (Stress Test)
- **Survival Countdown**: Hitung berapa hari Anda bisa bertahan hidup secara finansial jika pendapatan berhenti total hari ini.
- **Essential vs Lifestyle**: Membedakan pengeluaran wajib (Essential) dan keinginan untuk akurasi dana darurat yang lebih tinggi.
- **Fire-Sale Projection**: Simulasi likuidasi aset non-liquid (emas, kendaraan) dengan diskon 20% untuk melihat daya tahan krisis maksimal.

### 🧠 Intelligence & Insights
- **Lifestyle Inflation Detection**: Mendeteksi jika pertumbuhan pengeluaran Anda lebih cepat daripada pertumbuhan pendapatan.
- **Education Reserve**: Kalkulasi otomatis biaya pendidikan anak di masa depan dengan inflasi pendidikan 10% per tahun.
- **Predictive Alerts**: Peringatan dini jika rasio DSR, Savings Rate, atau Dana Darurat berada di zona merah.

---

## 🛠️ Tech Stack

- **Frontend**: React Native (Expo SDK 51), Expo Router.
- **Styling**: NativeWind (Tailwind CSS for React Native).
- **Persistence**: `expo-sqlite` dengan sistem migrasi otomatis (Schema V6).
- **State Management**: Zustand (UI state, Optimistic UI, & Simulation Sandbox).
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

## 📐 Aturan Finansial (Financial Brain Rules)

Aplikasi ini mengadopsi standar perencanaan keuangan ketat:
- **DSR Max**: 35% (Hutang bulanan / Total Pendapatan).
- **Savings Rate Min**: 15% (Married) | 10% (Single).
- **Aset Depresiasi**: Kendaraan menyusut 10% per tahun secara otomatis.
- **Dana Darurat (EF)**: 
  - Single: 6x Total Pengeluaran.
  - Married: 9x Total Pengeluaran.
  - Married + Kids: (12 + jumlah anak)x Total Pengeluaran.

---

## 🤝 Kontribusi
Aplikasi ini dikembangkan untuk penggunaan pribadi dan edukasi. Masukan dan kontribusi sangat dihargai melalui Pull Requests.

---

**Zinc Ledger** — *Kendalikan masa depan finansial Anda, satu transaksi pada satu waktu.*
