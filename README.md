# traffic

## Menjalankan web

Gunakan Node.js 20.6 atau lebih baru. Pastikan dependensi sudah terpasang (`npm install`) dan file `.env` berisi konfigurasi koneksi database (`DATABASE_URL` atau `PGHOST`, `PGUSER`, `PGPASSWORD`, dan `PGDATABASE`), lalu jalankan:

```sh
node --env-file=.env server.js
```

Buka <http://localhost:3000>. Port dapat diubah dengan mengatur `PORT` di `.env`.

## Input suara

Setelah tombol mikrofon dinyalakan, percakapan langsung aktif tanpa wake word. Setiap ucapan ditranskripsikan dan dinilai AI apakah ditujukan ke Capri; ucapan latar tidak memotong jawaban atau mendapat respons. Wake word hanya diperlukan untuk mengaktifkan kembali mode percakapan setelah dimatikan dengan perintah suara. Mode standby masih mempertahankan akses mikrofon agar dapat mendengar wake word; klik tombol mikrofon untuk menghentikan akses mikrofon sepenuhnya.

Web Speech Recognition browser menyediakan teks yang ditampilkan dan dikirim ke asisten agar isi pesan tidak berubah diam-diam saat dikirim. Whisper dipakai hanya sebagai cadangan jika rekaman tidak memiliki teks hasil browser. Model dari `AI_PROVIDER` tetap menilai apakah ucapan ditujukan ke Capri. Pengenalan dan analisis terjadi per giliran, bukan streaming live; penilaian memakai panggilan AI tambahan dan dapat menambah pemakaian API. Untuk menghemat token, penilaian suara hanya menerima percakapan terakhir; jawaban utama membatasi riwayat dan memilih fakta dashboard sesuai pertanyaan. Batas maksimum jawaban AI adalah 450 token (atau nilai `AI_MAX_TOKENS` yang lebih rendah), sehingga jawaban lebih ringkas.

Transkripsi dapat memakai Groq: atur `WHISPER_PROVIDER=groq` dan `GROQ_API_KEY` di environment server, lalu restart. Model default `whisper-large-v3-turbo`; bisa diganti dengan `WHISPER_MODEL`. Jika `AI_BASE_URL` memakai Groq, `AI_API_KEY` dapat dipakai sebagai fallback, tetapi `GROQ_API_KEY` lebih jelas. Alternatifnya, `WHISPER_PROVIDER=openai` memakai `WHISPER_API_KEY` terpisah. Ketersediaan dan kuota gratis Groq mengikuti batas akun dan kebijakan Groq saat ini.