# NEGARA SISTEM BOBROK — Script
Video pendek kartun 3D vertikal, 60 detik, 1080x1920, 30 fps, 1800 frame.
Skill: cartoon_3d_short (three.js + Remotion). Gaya: karakter 2D bean-head outline tinta di dunia 3D berwarna.
VO: Bahasa Indonesia, pria, cepat, jelas, bersemangat, berintonasi (avocado_v2:MAI_01, speed 120, sama seperti Bajak Jawa).
Gaya referensi: video bill "Selanjutnya, Kamu Mau Jadi Apa?" — satir sistem lewat adegan sehari-hari.

## Aturan (dari bill — jangan dilanggar)
- Negara fiktif tanpa nama ("Di negeri ini..."). TIDAK ada pejabat, politisi, atau negara nyata yang disebut namanya.
- Hanya pola sistemik, ditunjukkan lewat adegan sehari-hari. Penonton yang menyimpulkan sendiri.
- Tidak ada caption/teks di video.

## Premis (satir, bukan fakta sejarah)
Di sebuah negeri fiktif, sistemnya rusak tapi tetap berjalan: janji di atas panggung, proyek besar
yang mangkrak, anggaran yang bocor di jalan, antrean kantor yang tak pernah sampai. Semua orang
tahu, semua orang tetap antre.
Analogi sehari-hari: ember bocor — air dituang dari atas, yang sampai ke bawah tinggal tetes.
Bukan embernya yang kecil, lubangnya yang banyak.

## Naskah VO (Bahasa Indonesia, 10 baris)
BEAT — kalimat VO:

HOOK (0–5 dtk):
"Di negeri ini, semua orang tahu sistemnya rusak. Yang aneh, sistemnya tetap jalan."

SETTING (5–10 dtk):
"Negeri ini kaya, rapi di atas kertas, dan sibuk setiap hari."

AKSI 1 (10–15 dtk):
"Di atas panggung, seorang pejabat berjanji: tahun depan, semua beres! Orang bersorak."

AKSI 2 (15–21 dtk):
"Lalu dibangun proyek besar. Pita digunting, foto diambil, lalu proyek itu ditinggalkan setengah jadi."

AKSI 3 (21–27 dtk):
"Anggaran mengalir dari pipa besar. Tapi pipanya bocor, dan yang sampai ke ujung tinggal tetes."

AKSI 4 (27–33 dtk):
"Sementara itu di kantor, antrean mengular sampai ke jalan. Satu loket buka, stempelnya pelan."

SNAP (33–39 dtk):
"Lalu stempelnya kehabisan tinta. Formulirnya salah, dan besok semua harus antre dari nol lagi."

DEADPAN (39–44 dtk):
"Untungnya, antreannya tertib. Sayangnya, antrean itu tidak pernah sampai."

PENJELASAN (44–51 dtk):
"Karena sistem ini seperti ember bocor. Air dituang dari atas, yang sampai ke bawah tinggal tetes. Lubangnya yang banyak."

KONSEKUENSI + CALLBACK (51–60 dtk):
"Orang pun belajar mengurus semuanya sendiri. Dan di atas panggung, janji baru dibacakan. Tahun depan, semua beres. Lagi."

## VO placement (avocado_v2:MAI_01, speed 120, total 60.000 dtk — tanpa jeda antar kalimat, seperti Bajak Jawa)
L1 0.00 (5.376), L2 5.376 (4.272), L3 9.648 (5.088), L4 14.736 (6.480), L5 21.216 (5.520), L6 26.736 (6.072), L7 32.808 (6.240), L8 39.048 (4.656), L9 43.704 (7.248), L10 50.952 (9.048). File: voice/line1..10.mp3.

## Shot plan (12 shot, 1800 frame) — kontrak untuk story.ts / world.ts / cast.ts
Koordinat: tanah y=0. Alun-alun kota di pusat (0,0). Gedung pemerintah di utara z=-28 (menghadap +z).
Panggung di depan gedung (0,0,-18). Proyek mangkrak di barat x=-32, z=-10. Kantor antrean di timur x=+32, z=-6.
Ember analogi di taman selatan (x=+18, z=+22), golden.
- S1 (0–161): HOOK — wide alun-alun, kota + gedung pemerintah, orang berjalan. Flash putih 4 frame di f=130.
- S2 (161–289): SETTING — aerial kota, rumah-rumah, jalan, orang sibuk.
- S3 (289–442): Panggung — pejabat berpidato, kerumunan bersorak.
- S4 (442–636): Proyek besar — pita digunting, lalu bangunan setengah jadi (dua kunci kamera dalam satu shot).
- S5 (636–802): Anggaran bocor — pipa besar, koin emas menetes, ember-ember kecil di bawah.
- S6 (802–984): Kantor — antrean panjang mengular, satu loket, stempel pelan.
- S7 (984–1171): SNAP — stempel kehabisan tinta (SNAP 34.6 dtk = f 1038), formulir ditolak, antrean bubar. Kick di f=1038.
- S8 (1171–1311): Deadpan — warga duduk di trotoar, antrean kosong, ekspresi pasrah.
- S9 (1311–1411): GOLDEN — taman, ember bocor, air menetes.
- S10 (1411–1529): GOLDEN — orang menuang air ke ember bocor, yang sampai tinggal tetes; anak menunjuk lubang.
- S11 (1529–1700): GOLDEN — warga mengurus semuanya sendiri, berjalan pulang, memperbaiki pagar.
- S12 (1700–1800): GOLDEN — panggung lagi, janji baru dibacakan, kerumunan bersorak, matahari terbenam.

## Kontrak file (jangan diubah sepihak)
- story.ts mengekspor: FPS=30, TOTAL=1800, V3, SHOTS, shotAt, layersAt, camAt, dofAt, focusAt, keyEnd, kickAt, XFADE, FLASH_AT=130, FOREGROUND, SNAP=38.0 (detik story), GOV, STAGE_POS, PROJECT_POS, OFFICE_POS, BUCKET_POS, leak(tau), queueLen(tau), LIGHT="day"|"golden", Crowd.
- world.ts mengekspor: World (constructor kit), loadKit (KENNEY sama seperti template; kit boleh kosong), dan memakai stage() dari cast.ts.
- cast.ts mengekspor: stage(id, t, b, cam), Pool, Actor, Fx.
- NegaraBobrok.tsx: komponen komposisi NegaraBobrok (seperti BajakJawa.tsx, TOTAL 1800).
- build.ts / paint.ts / shade.ts / lights.ts / ink.ts / lensblur.ts / grade.ts / cardshade.ts / toon.ts: pakai dari template Bajak Jawa; toon.ts BOLEH ditambah outfit OFFICIAL / CLERK / WORKER (jangan ubah yang ada).
- Tidak ada caption/teks di video.
