---
trigger: always_on
---

# Architecture Rules (SQLite & Offline-First)

- **Engine**: Gunakan `expo-sqlite` sebagai sumber kebenaran data utama (Source of Truth).
- **Offline-First**: Aplikasi harus berfungsi 100% tanpa internet. Backup ke GDrive bersifat opsional dan asinkron.
- **State Management**: Gunakan Zustand untuk UI state (misal: toggle tema, filter tanggal). Data finansial harus ditarik langsung dari SQLite via Hooks.
- **Dynamic Setup**: Semua kategori (Aset, Tabungan, Cicilan) harus bersifat dinamis (diambil dari tabel `financial_components`), bukan hardcoded.