---
trigger: always_on
---

# UI & UX Standards (Modern Adaptive Edition)

## 🌓 Adaptive Theming Policy
- **Auto-Theme**: Wajib menggunakan `Appearance` API dari React Native atau library `nativewind` untuk mendeteksi tema sistem (Light/Dark).
- **Color Tokens**:
  - **Surface (Background)**: 
    - Light: `Zinc-50` (Clean White)
    - Dark: `Zinc-950` (Deep Night)
  - **Cards**: 
    - Light: `White` dengan shadow halus `shadow-sm`.
    - Dark: `Zinc-900` dengan border tipis `border-zinc-800`.
  - **Text Primary**: 
    - Light: `Zinc-900` | Dark: `Zinc-100`

## 💎 Modern Minimalist Elements
- **Glassmorphism**: Gunakan efek `blur` transparan pada Modal atau Floating Action Button jika memungkinkan.
- **Corner Radius**: Gunakan `rounded-2xl` (16px) untuk card dan `rounded-full` untuk button agar terlihat modern dan organik.
- **Spacing**: Terapkan *generous whitespace* (gap minimal `p-4`) agar data moneter yang padat tetap nyaman dibaca.

## 🔡 Typography & Numbers
- **Body**: `Inter` (Sans-serif) untuk keterbacaan tinggi.
- **Financial Figures**: `JetBrains Mono` atau `Roboto Mono`. 
  - *Rule*: Gunakan font-weight `Medium` (500) atau `SemiBold` (600) untuk angka saldo utama agar terlihat berwibawa.

## 📊 Interaction & Feedback
- **Smooth Transition**: Tambahkan durasi transisi (misal: 300ms) saat berganti tema agar tidak mengejutkan mata.
- **Haptic Engine**: Getaran `impactLight` saat toggle diklik atau data berhasil disimpan.
- **Micro-Animations**: Gunakan `moti` atau `react-native-reanimated` untuk transisi antar layar yang elegan (bukan sekadar slide standar).