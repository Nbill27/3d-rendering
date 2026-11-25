# Andhika Itera - BUILD.md

Video TikTok vertikal 60 detik, kisah nyata dan viral: Andhika Rahman Setiawan Fajri,
wisudawan Teknik Kimia Itera Lampung yang kuliah naik sepeda merah. Gaya cartoon 3D
bean-head yang sama seperti Bajak Jawa dan Negara Sistem Bobrok. Nada hangat dan
inspiratif, bukan satir.

BAHASA (pivot 2026-11-25): video ini berbahasa Inggris, untuk di-upload ke YouTube
Shorts demi monetisasi (audiens US, RPM lebih tinggi). Naskah VO Inggris ada di
`SCRIPT.md` (versi utama); naskah Indonesia disimpan sebagai referensi. Visual dan
frame check tidak berubah karena tidak ada teks di dalam video. Negara Sistem
Bobrok tetap Bahasa Indonesia dan tidak dibuat ulang dalam Bahasa Inggris.

- Proyek: `~/workspace/motion-studio/projects/andhika-itera/`
- Komposisi: `AndhikaItera` di `studio/src/videos/andhikaitera/`
- Format: 1080x1920, 30fps, 1800 frame, 60 detik
- VO (belum dibuat, tunggu persetujuan frame check): English, male, speed 120,
  10 klip, penempatan diukur seperti Negara Sistem Bobrok. Suara: lihat rekomendasi
  di bawah (bukan lagi avocado_v2:MAI_01).

## Fakta terverifikasi (cek 2026-11-25)

- Andhika Rahman Setiawan Fajri, asal Kabupaten Agam, Sumatera Barat.
- Lulusan Teknik Kimia Institut Teknologi Sumatera (Itera), Lampung, angkatan 2019.
- Wisuda Minggu 22 November 2026 (kabar18.com; `date -d 2026-11-22` = Minggu).
- Sepeda merah satu-satunya alat transport selama kuliah: ke kampus, ke kos teman
  untuk mengerjakan skripsi. Tidak punya motor.
- Hampir keluar dari Itera tahun lalu karena keterbatasan ekonomi. Kutipan langsung
  (mediabyte.id, 22 Nov 2026): "Tahun lalu saya ingin keluar dari Itera karena sudah
  capek banget. Tapi saya tetap terus maju sampai selesai."
- Seorang dosen menyemangatinya dan meminjamkan motor (detikSumbagsel via Merdeka).
- Orang tuanya tidak bisa hadir di wisuda karena harus menjaga adiknya yang masih
  sekolah di kampung.
- Video viral 19 detik (direkam dari mobil, dilaporkan Liputan6 24 Nov 2026):
  Andhika bertoga menuntun sepeda merahnya di jalan sepulang wisuda, terlalu lelah
  dan kurang sehat untuk mengayuhnya.
- Sepulang wisuda ia mampir ke warung sayur langganannya (sekitar tiga tahun lalu
  pemiliknya pernah baik padanya), memakai toga untuk menunjukkan ia sudah lulus.
- Sekarang ia mengajar di sekolah, mata pelajaran Biologi dan TIK, dua bulan terakhir.
- Reaksi publik sangat mendukung dan mengharukan.

Sumber:
- https://mediabyte.id/225900/berita-pilihan/mengayuh-menuju-sarjana-perjuangan-andhika-rahman-setiawan-wisudawan-itera-yang-setia-dengan-sepeda/
- https://www.instagram.com/reel/DgIb646M9Xt/ (Liputan6)
- https://kabar18.com/andhika-menuntun-sepeda-merah-seusai-wisuda-itera-di-lampung
- https://suaragarut.id/wisudawan-itera-sepeda-merah
- https://www.facebook.com/reel/1689630666221696/ (Merdeka)

Catatan: satu ringkasan Merdeka membawa tanggal otomatis yang tidak konsisten
(29 Nov 2025); tanggal wisuda yang dipakai adalah 22 Nov 2026 dari kabar18.

## Naskah

Lihat `SCRIPT.md`: naskah VO English 10 ketukan, ~164 kata, estimasi ~60 detik
pada 2,7 kata/detik, diukur ulang saat VO dibuat. Naskah Bahasa Indonesia (10
ketukan, ~161 kata) tetap disimpan di file yang sama sebagai referensi.

## Rekomendasi suara VO English (cek 2026-11-25, klip belum dibuat)

VO dibuat dengan `/opt/hatch/bin/tts speak --language en` (bahasa default CLI
adalah `en`). Katalog suara: `/opt/muse/assets/voice-selector/voice_source.json`
(1219 suara).

Temuan penting: `avocado_v2:MAI_01` ("Aria"), suara di dua video sebelumnya,
ternyata suara FEMALE American dengan bahasa katalog `eng`, bukan suara pria
dan bukan suara khusus Indonesia. Ia dipakai untuk Bahasa Indonesia dengan
`--language id`. Jadi MAI_01 BISA membacakan English dengan natural (English
adalah bahasa asalnya), tapi tidak cocok dengan spesifikasi bill "VO pria".

Rekomendasi: pakai `avocado_v2:casper` ("Confident Trumpet"), male, American,
tone storyteller, deskripsi katalog: "passionate, enthusiastic, storyteller
tone", speed 120. Paling cocok untuk narasi kisah inspiratif yang hangat dan
bersemangat. Cadangan: `avocado_v2:ronan` (male, American, casual, confident
storyteller) atau `avocado_v2:MAI_03` ("Helio", male, American, friendly,
gentle, production voice, tapi diukur lebih datar dari MAI_01 pada uji banding
Indonesia dulu: pitch std dev 4,80 vs 10,26 semitone). Saat VO dibuat, dengarkan
dulu satu klip uji Casper; kalau terdengar tidak cocok, pindah ke Ronan atau
Helio. Nama Indonesia (Andhika, Itera, Lampung) akan dibaca TTS dengan
pelafalan Inggris yang mendekati aslinya.

## Komposisi

Disalin dari NegaraBobrok, lalu ditulis ulang untuk cerita ini:

- `story.ts`: 10 shot (hook jalan toga, kampus, dua shot mengayuh, kos, rumah orang
  tua golden, momen viral, warung, sekolah golden, penutup sunset), kamera tracking
  di sisi jalan, crossfade di pergantian tempat, flash putih 4 frame setelah hook.
- `toon.ts`: outfit baru STUDENT (kemeja biru), GRADUATE (toga hitam + selempang
  emas), LECTURER (rambut abu-abu + kumis), TEACHER (kemeja hijau); topi mortarboard
  (papan persegi + rumbai emas); `fxBike` (sepeda merah 2D di kartu 600x400, roda
  berputar, bisa di-flip); mode baru `bodySide` "ride" (duduk di sadel, kaki
  mengayuh melingkar di pedal, lengan ke stang).
- `cast.ts`: Andhika di jalan (jalan kaki + sepeda, atau mengayuh), wisudawan di
  tangga kampus, Andhika duduk lesu di kos + dosen, orang tua melambai di rumah
  bukit, warga menonton di trotoar, ibu warung, Andhika guru + murid, warga jauh.
- `world.ts`: aula kampus Itera di utara, jalan batu ke selatan, kos di timur,
  warung sayur di ujung selatan jalan, sekolah di barat daya, rumah orang tua di
  bukit barat laut. Properti NegaraBobrok (panggung, proyek mangkrak, pipa bocor,
  kantor, ember) dihapus.
- `AndhikaItera.tsx`: komponen diganti nama dari NegaraBobrok; terdaftar di
  `src/Composition.tsx` sebagai `AndhikaItera`, 1800 frame, 1080x1920.
- `npx tsc --noEmit`: bersih, tanpa error.

## Frame check (2026-11-25)

Stills dirender lokal satu per satu, concurrency 1, masing-masing ~20-30 detik:

- `check/still_60.png` (detik 2, hook): Andhika bertoga menuntun sepeda merah.
  Bagus, tidak ada perbaikan.
- `check/still_360.png` (detik 12, mengayuh): awalnya Andhika tampak berjalan di
  samping sepeda (kaki march). Diperbaiki dengan mode "ride" baru di `bodySide`:
  sekarang ia duduk di sadel, kaki mengayuh, tangan ke stang.
- `check/still_690.png` (detik 23, kos): awalnya dosen terpotong di tepi kanan.
  Diperbaiki: dosen digeser ke (28,0,10), kamera S5 digeser ke titik lihat
  (28.5, 1.4, 9.5). Sekarang Andhika duduk lesu + dosen tersenyum masuk frame.
- `check/still_1050.png` (detik 35, viral): awalnya seorang warga raksasa blur
  menutupi sepertiga frame (berdiri di antara kamera dan Andhika). Diperbaiki:
  warga dipindah ke trotoar barat (x=-4.5). Sekarang Andhika bertoga menuntun
  sepeda dengan ekspresi lelah, latar rumah blur.
- `check/still_1590.png` (detik 53, sunset): awalnya Andhika tampil front view
  berdiri (kamera S10 terlalu diagonal, c=0.71). Diperbaiki: kamera S10 dibuat
  lebih menyamping (c<0.57) sehingga pose mengayuh dipakai. Sekarang ia
  mengayuh di golden hour.

Semua 5 still lolos cek visual. Menunggu persetujuan bill.

## Rencana setelah persetujuan (jangan dikerjakan dulu)

1. VO: 10 klip English, suara `avocado_v2:casper` speed 120 (lihat rekomendasi
   di atas), ukur penempatan per ketukan, campur jadi `audio/mix.wav` 60 detik,
   verifikasi terdengar di semua jendela 10 detik.
2. Full render: GitHub Actions, repo yang sama dengan Negara Sistem Bobrok
   (https://github.com/Nbill27/negara-sistem-bobrok-render), workflow
   `.github/workflows/render-andhika.yml`, 10 job paralel, 180 frame per job
   (job 0 = 0-179 ... job 9 = 1620-1799), artifact `chunk-N`. Staging sudah siap
   di `~/workspace/motion-studio/gh-staging/negara-sistem-bobrok-render/`
   (file sumber + workflow). Upload dan trigger lewat browser oleh parent agent.
   Jangan render lokal di VM.
3. Unduh 10 artifact, gabung jadi 1800 frame / 60 detik, mux dengan
   `audio/mix.wav`, verifikasi ffprobe (60 detik, 1080x1920, H.264 + AAC, audio
   di semua jendela 10 detik), ambil still akhir, serahkan ke bill.

## Batasan yang diketahui

- Sepeda adalah kartu 2D di samping Andhika (bukan model 3D); roda berputar dan
  kakinya mengayuh, jadi dalam gerakan terbaca sebagai mengayuh. Di still diam,
  tangan tidak selalu persis menyentuh grip stang (jarak beberapa cm di layar).
- Warung memakai prop stall Kenney generik (GLB tidak ada di repo, fallback
  bawaan kit seperti di Negara Sistem Bobrok).
- Warga di shot viral (detik 35) berada di tepi kiri luar frame pada still
  1050; mereka masuk frame di frame lain dalam shot yang sama.
