# Negara Sistem Bobrok — Build Notes

Video cartoon 3D short vertikal tentang sistem yang bobrok (satir), 60 detik.
Status: STILLS LOLOS, RENDER CHUNK BERJALAN (detached loop, dimulai 25 Nov 2026 ~00.40 WIB).

## Fakta

- Judul: Negara Sistem Bobrok
- Durasi: 60 detik (60.000 dtk), 1800 frame
- Resolusi: 1080x1920 (vertikal 9:16), 30 fps
- File final (nanti): `~/workspace/motion-studio/projects/negara-sistem-bobrok/negara-sistem-bobrok-final.mp4`
- Video tanpa audio (nanti): `negara-sistem-bobrok-video-only.mp4`
- Audio mix: `audio/mix.wav` (17.280.044 byte, 60.000 dtk)

## Sumber

- Proyek: `~/workspace/motion-studio/projects/negara-sistem-bobrok/`
- Komposisi Remotion: `NegaraBobrok` (studio di `~/workspace/motion-studio/studio/`, `src/videos/negarabobrok/`)
- Naskah dan penempatan VO: `SCRIPT.md`
- Audio: `audio/mix.wav` (gabungan `stem_voice.wav`, `stem_music.wav`, `stem_sfx.wav`)
- Skill render: `cartoon_3d_short` (pipeline sama seperti Bajak Jawa)

## Aturan cerita (dari bill)

- Negara fiktif tanpa nama ("Di negeri ini..."). TIDAK ada pejabat, politisi, atau negara nyata yang disebut.
- Hanya pola sistemik lewat adegan sehari-hari: janji di panggung, proyek mangkrak, anggaran bocor, antrean kantor, ember bocor sebagai analogi.

## Voice over

- Suara: avocado_v2:MAI_01, speed 120, Bahasa Indonesia, pria, cepat, jelas, bersemangat, berintonasi.
- Total VO 60.000 detik tanpa jeda antar kalimat (end-to-start, seperti Bajak Jawa).
- Penempatan: L1 0.00 (5.376), L2 5.376 (4.272), L3 9.648 (5.088), L4 14.736 (6.480), L5 21.216 (5.520), L6 26.736 (6.072), L7 32.808 (6.240), L8 39.048 (4.656), L9 43.704 (7.248), L10 50.952 (9.048). File: `voice/line1..10.mp3`.
- Catatan: naskah pertama total 75.4 dtk, dipangkas dua kali sampai tepat 60.000 dtk.

## Audio

- `audio/make_sound.py` (dari kit DSP Bajak Jawa: `dsp.py`, `sfx_gen.py`, `instruments.py`).
- SFX: tepuk tangan + sorakan di janji panggung (10.2 dtk dan 56.8 dtk), gunting pita (15.6), koin berdenting di ember (22-26.2), stempel pelan tiap 1.2 dtk (27.2-32.8), snare roll ke SNAP (32.9-34.6), SNAP stempel kering + kertas melayang + gerutuan (34.6), langkah pergi (35.6-37.6), tetes ember bocor (44.5-49.5), palu memperbaiki pagar (52-53.2).
- Musik: tema kota (pluck + pad Am-F-C-G, 100 bpm) 0-21.2, tensi pedal Am 21.2-34.6, DEAD STOP 34.6-39.05, pad lembut 39.05-43.7, music-box ember bocor 43.7-51, tema kota kembali + akor akhir + glock 58.5.
- Mix: voice -15.4 LUFS, music -25.0 LUFS, sfx -35.0 LUFS; master -15.1 LUFS, true peak -1.5 dBTP.
- Volumedetect per 10 dtk: 0-10: -18.6 dB, 10-20: -16.7, 20-30: -17.3, 30-40: -18.4, 40-50: -16.4, 50-60: -20.2 (semua terdengar).

## Frame check (stills di `check/`)

- Stills per shot: `still_60` (S1), `still_200` (S2), `still_350` (S3), `still_500` (S4), `still_700` (S5), `still_880` (S6), `still_1050` (S7), `still_1220` (S8), `still_1360` (S9), `still_1470` (S10), `still_1600` (S11), `still_1750` (S12).
- Masalah yang ditemukan dan diperbaiki sebelum render:
  1. Pohon raksasa di depan kamera S1 (pohon di (14,18)/(22,26)) — pohon dekat plaza dipindah jauh.
  2. Pipa anggaran + ember bocor menabrak panggung (pipa di z=-19 tepat di atas panggung) — pipa + ember dipindah ke barat gedung (x -20..-10, z=-24), kerumunan + koin ikut pindah.
  3. Podium panggung terlalu besar dan gelap — diperkecil, ganti kayu.
  4. Kerumunan panggung terlalu dekat dengan kamera S3 — kamera S3b ditarik mundur, kerumunan digeser ke z=-13.5.
  5. Kamera S2 terlalu tegak dari atas — diturunkan jadi aerial miring.
  6. Petugas loket berdiri DI DALAM gedung (z=-2.2, di belakang muka pintu) sehingga tak terlihat — dipindah ke z=-1.0, di depan pintu.
  7. Pohon acak menutupi seluruh frame S6 dan sepertiga frame S7 — koridor kamera kantor (x 18-44, z -16..20) dan proyek dikosongkan dari pohon.
  8. Ember analogi terlalu besar (diameter 3.2 m, seperti menara air) — diperkecil jadi diameter 2.2 m, tinggi 1.4 m; kamera S10 ditarik mundur.
  9. Antrean berdiri di rumput hijau terang — ditambah perkerasan batu di depan kantor (x 20-40, z -12..16); papan nama kantor diganti merah supaya terbaca.
- Setelah perbaikan, semua 12 still dicek visual dan lolos: alun-alun + gedung pemerintah, panggung + pejabat bertopi tinggi, proyek beton + crane, pipa + koin emas + ember, antrean + petugas loket, SNAP stempel + formulir melayang, warga duduk pasrah, ember bocor golden, warga pulang + pagar diperbaiki, panggung sunset.

## Render

- Script: `render-chunks.sh` (loop detached, setsid nohup), log `render-chunks.log`
- 18 chunk x 100 frame (1800 frame total), `nb_c0.mp4` s.d. `nb_c17.mp4` di `chunks/`, lalu concat dan mux audio otomatis oleh script.
- Perintah per chunk: `npx remotion render NegaraBobrok chunks/nb_c<i>.mp4 --frames=<start>-<end> --concurrency=2 --timeout=120000`
- Loop dimulai 25 Nov 2026 ~00.40 WIB. Chunk 0 sedang render (11/100 frame, estimasi ~14 menit per chunk saat dicek 00.42 WIB).
- Cek progres: `tail -5 ~/workspace/motion-studio/projects/negara-sistem-bobrok/render-chunks.log` dan `ls ~/workspace/motion-studio/projects/negara-sistem-bobrok/chunks/`
- Jika loop mati (mis. VM restart): jalankan lagi `setsid nohup bash render-chunks.sh > /dev/null 2>&1 < /dev/null &` dari folder proyek — chunk yang sudah jadi dilewati otomatis.

## Status

Stills lolos, audio mix selesai dan terverifikasi, render chunk berjalan. File final belum ada.

## Diagnosis chunk 2 (2026-11-25 ~12:40 WIB) — penyebab ketemu, sudah diperbaiki

Bukti dari `render-chunks.log`:
- Frame 244 gagal 2x dengan `TimeoutError: waiting for the page to render the React component at frame 244 failed: timeout 123000ms exceeded` (01:30 dan 01:33 UTC). Timeout datang dari `--timeout=120000` di script lama, saat DUA tab Chrome (concurrency=2) berebut 1,5 CPU bersama dengan RAM host yang tinggal ~500 MB.
- Frame 244 sendiri TIDAK rusak: still tunggal frame 244 di-render dalam 28 detik di concurrency=1, hasilnya bersih (gedung pemerintah + panggung + karakter bean-head), disimpan di `check/f244-verified.png`. Timeout-nya transient (kontensi host), bukan frame yang broken.
- Percobaan berikutnya (01:55, 02:26, 02:56, 03:30 UTC) mati diam-diam di frame 5-7/100 TANPA error di log — proses dibunuh dari luar (VM restart: systemd start 02:21 / 03:10 / 05:15 UTC). Tiap mati, satu chunk 100-frame yang sedang jalan hilang semua.
- Juga dicatat: `public/bridge/kenney/*.glb` 404 semua di log (folder itu tidak ada di studio), tapi `world.ts` sudah `.catch(() => null)` jadi kit tetap ke-load dan bukan penyebab macet.

Perbaikan (script baru `render-chunks.sh`, script lama disimpan di `render-chunks-100f.sh.bak`):
- `--concurrency=1` (satu tab Chrome, setengah memori, tanpa rebutan CPU; frame 244 terbukti 28 detik di mode ini; pace awal 5/50 frame ~9,7 detik/frame, lebih cepat dari ~19 detik/frame di concurrency=2).
- `--timeout=300000` (frame lambat diberi 5 menit, bukan 2 menit).
- Segmen 50 frame untuk frame 200-1799 (`nb_c2a/nb_c2b` ... `nb_c17a/nb_c17b`); chunk 0-1 (100 frame, sudah jadi) tetap dipakai dan di-skip. Paling banyak ~15 menit kerja hilang per VM restart. File final tetap persis 1800 frame / 60 detik, concat sesuai urutan segmen.
- Loop di-restart 25 Nov 2026 ~12:42 WIB (PID loop 5178), terverifikasi hidup, skip chunk 0-1, sedang render `nb_c2a` (200-249, termasuk frame 244).
- Estimasi (diperbarui setelah nb_c2a selesai): nb_c2a makan ~7 menit; 31 segmen tersisa x ~7-11 menit = sekitar 4-6 jam dari restart (selesai kira-kira 16:30-18:30 WIB), kalau tidak ada VM restart yang mengganggu; tiap restart hanya mengulang segmen yang sedang jalan. Watcher cron `negara-bobrok-chunk-watch` dibuat ulang (cek tiap 30 menit).
