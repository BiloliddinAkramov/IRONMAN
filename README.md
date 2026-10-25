# IRONMAN — Shaxsiy Intizom, SAT, Fitness va Moliyaviy Nazorat Platformasi

**IRONMAN** — bu foydalanuvchining o‘z oldiga qo‘ygan 3 oylik qat’iy maqsadlarini (SAT va ingliz tili, jismoniy mashg‘ulotlar, uyqu va kundalik xarajatlar) intizom bilan boshqarish, kunlik muddatlarni (deadline) qat’iy nazorat qilish va avtomatik ko‘chirish (carry-forward) tizimiga ega to‘liq shaxsiy dastur.

---

## 1. Asosiy Imkoniyatlar va Modullar

1. **3 Oylik Qat’iy Chaqiriq Dvigateli (Engine):**
   - Tanlangan boshlanish sanasidan boshlab aynan 3 kalendar oy davom etadi.
   - Oylarning uzunligi, kabisa yillari va oy oxiri sanalari (masalan, 31-yanvar -> 30-aprel) aniq hisoblanadi.
   - Barcha chegaralar **Asia/Tashkent (UTC+5)** vaqti bilan belgilanadi.
   - Kun raqami, o‘tgan va qolgan kunlar uzluksiz saqlanadi.

2. **Kunlik Vazifalar va Qulflash Qoidalari (Task Locking & Carry-Forward):**
   - Har bir vazifa uchun Tashkent vaqti bilan soat 23:59:59 gacha bajarish oynasi beriladi.
   - Ertasi kuni bajarilmagan barcha vazifalar avtomatik tarzda `LOCKED` (qulflangan) holatiga o‘tadi va tarixda saqlanadi.
   - Soxta yoki kechikib bajarilgan amallar taqiqlanadi (server-side RPC va mijoz tekshiruvi orqali).
   - Bajarilmagan vazifalar yangi kunga avtomatik ko‘chiriladi va «O‘tgan kundan ko‘chirildi» belgisi bilan ko‘rsatiladi.
   - Bir xil vazifani takroriy (dublikat) ko‘chirilishi oldi olingan.

3. **Bosh Sahifa (Dashboard):**
   - Bugungi kunga fokus qaratilgan ko‘rinish.
   - O‘zbekcha sana formati, chaqiriq kuni, bugungi vazifalar bajarilish foizi.
   - SAT va English, Fitness, umumiy vazifalar bo‘limlari.
   - Bo‘sh kunlar uchun xolis bildirishnoma («Bugungi rejang hali kiritilmagan»).

4. **SAT & English Moduli:**
   - **10 ta Mock Test Trekeri (Mock 01 - Mock 10)**: rejalashtirilgan sana, umumiy ball (400-1600), Reading & Writing (200-800), Math (200-800) va sarflangan vaqt.
   - «X / 10 mock bajarildi» hisoblagichi.
   - SAT va English mavzulari jadvali.

5. **Fitness Moduli:**
   - Dushanbadan Yakshanbagacha hafta kunlari tanlagichi.
   - Takrorlanuvchi haftalik mashqlar shabloni.
   - Mashqlarni boshqa kunga nusxalash imkoniyati.
   - Dam olish kunlari (rest days) qo‘llab-quvvatlanadi.
   - Mashg‘ulot daqiqalari va haftalik foizlar.

6. **Uyqu Trekeri (Sleep Tracker):**
   - Yotish va uyg‘onish vaqtlari.
   - Yarim tundan o‘tuvchi uyqu davomiyligini avtomatik hisoblash (masalan, 23:00 dan 07:00 gacha = 8 soat).
   - Belgilangan maqsad (default: 8 soat) bilan taqqoslash va grafik.

7. **Mahalliy Musiqa Pleyeri (Music & Background Audio):**
   - **Fitness Playlist** va **SAT Study Playlist** (alohida saqlanadi).
   - Qurilmadan to‘g‘ridan-to‘g‘ri audio fayllarni tanlash (serverga yuklanmaydi, maxfiylik ta’minlanadi).
   - Trek tartibini o‘zgartirish, seek, shuffle, repeat.
   - **Android APK**: Foreground Service va MediaSession orqali ekran qulflanganda ham uzluksiz ijro.
   - **Veb**: brauzer MediaSession integratsiyasi.

8. **Kunlik Xarajatlar (Expenses):**
   - Summa (so‘m / UZS), toifalar (Oziq-ovqat, Transport, Ta’lim, Fitness, Shaxsiy, Boshqa).
   - Filtrlar (Bugun, 7 kun, 30 kun, 3 oylik chaqiriq).
   - Toifalar bo‘yicha taqsimot va jami xarajatlar.

9. **Analitika (Analytics):**
   - Recharts asosida to‘liq responsiv grafiklar.
   - Vaqt filtrlari asosida qayta hisoblanuvchi barcha ko‘rsatkichlar.
   - Mock testlar ball dinamikasi, uyqu barqarorligi va xarajatlar doiraviy diagrammasi.

10. **Sozlamalar va Ma’lumotlar Eksporti:**
    - Barcha ma’lumotlarni JSON formatida to‘liq yuklab olish.
    - Shaxsiy eslatma vaqtlari va bildirishnomalar.
    - Supabase ulanishini boshqarish.

---

## 2. Loyiha Tuzilmasi

```
ironman/
├── src/
│   ├── app/
│   │   ├── App.tsx          # Asosiy ildiz komponent
│   │   ├── router.tsx       # Sahifalar marshruti va navigatsiya qo‘riqchilari
│   │   └── providers.tsx    # Barcha kontekst provayderlari
│   ├── components/
│   │   ├── layout/          # Desktop sidebar va mobil pastki navigatsiya
│   │   ├── ui/              # Button, Modal, ConfirmDialog, StatCard, EmptyState
│   │   └── tasks/           # TaskCard, AddTaskModal
│   ├── features/
│   │   ├── auth/            # AuthContext (Supabase Auth & mahalliy rejim)
│   │   ├── challenges/      # ChallengeContext (3 oylik chaqiriq hisobi)
│   │   ├── tasks/           # TaskContext (deadline, qulflash, carry-forward)
│   │   ├── audio/           # AudioContext (pleylistlar va ijro)
│   │   ├── study/           # useMocks (10 ta mock trekeri)
│   │   ├── fitness/         # useFitness (haftalik shablon va mashqlar)
│   │   ├── sleep/           # useSleep (yarim tun uyqu hisobi)
│   │   └── expenses/        # useExpenses (xarajatlar va hisobotlar)
│   ├── lib/
│   │   ├── dates.ts         # Asia/Tashkent vaqti va sana utilitalari
│   │   ├── supabase.ts      # Supabase klienti va konfiguratsiyasi
│   │   ├── validation.ts    # SAT ballari va formalar validatsiyasi
│   │   ├── audio/           # NativeAudioManager & MediaSession
│   │   └── notifications/   # Capacitor LocalNotifications servisi
│   ├── tests/               # Vitest biznes mantiq testlari
│   └── types/               # TypeScript tip va interfeyslari
├── supabase/
│   └── migrations/          # PostgreSQL RLS va RPC migratsiya fayllari
├── capacitor.config.ts      # Capacitor Android konfiguratsiyasi
├── .env.example             # Muhit o‘zgaruvchilari namunasi
└── package.json
```

---

## 3. Muhit O‘zgaruvchilari (.env)

Loyiha ildizida `.env` faylini yarating:

```bash
# Supabase loyihangiz ma'lumotlari (Supabase Dashboard -> Settings -> API)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

*Eslatma: Agar Supabase kalitlari kiritilmasa ham, ilova to‘liq xususiyatli mahalliy (localStorage) rejimida uzluksiz ishlaydi va Sozlamalar sahifasida istalgan vaqt kalitlarni kiritib ulash mumkin.*

---

## 4. Supabase Bazasini O‘rnatish va Migratsiyalar

1. [Supabase](https://supabase.com) platformasida yangi loyiha oching.
2. Chap menyudan **SQL Editor** bo‘limiga kiring.
3. `supabase/migrations/20261025000000_ironman_schema.sql` fayli ichidagi barcha SQL kodni nusxalang va SQL Editor oynasida **Run** tugmasini bosing.
4. Bu quyidagilarni avtomatik yaratadi:
   - `profiles`, `challenges`, `tasks`, `fitness_templates`, `mock_tests`, `sleep_records`, `expenses`, `playlists`, `playlist_tracks` jadvallari;
   - Har bir jadval uchun **Row Level Security (RLS)** qoidalari (`auth.uid() = user_id`);
   - Indekslar va cheklovlar (constraints);
   - `complete_task` va `carry_forward_incomplete_tasks` PostgreSQL RPC funksiyalari.

---

## 5. Ishga Tushirish va Testlar

```bash
# Bog'liqliklarni o'rnatish
npm install

# Testlarni ishga tushirish (Vitest)
npm run test

# Type checking / Lint
npm run lint

# Dasturchi serverini ishga tushirish (Port 3000)
npm run dev

# Ishlab chiqarish (Production build)
npm run build
```

---

## 6. Android APK Yaratish (Capacitor)

Ilovani Android APK sifatida yig‘ish uchun:

```bash
# 1. Frontend loyihani dist papkasiga yig'ish
npm run build

# 2. Capacitor Android loyihasini qo'shish (birinchi marta)
npx cap add android

# 3. Web resurslarni Android loyihasi bilan sinxronlash
npx cap sync

# 4. Android Studio orqali ochish va APK yig'ish
npx cap open android
```

Android Studio ochilgach:
- **Build -> Build Bundle(s) / APK(s) -> Build APK(s)** menyusi orqali tayyor APK faylini oling.
- `android/app/src/main/AndroidManifest.xml` faylida bildirishnomalar (`POST_NOTIFICATIONS`) va fon audiosi (`FOREGROUND_SERVICE_MEDIA_PLAYBACK`) ruxsatlari sozlangan.
