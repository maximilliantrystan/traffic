# Menjalankan UrbanFlow lewat Python

Folder ini menambahkan entry point Python tanpa mengubah file aplikasi yang ada.
`run.py` hanya meluncurkan `server.js`; backend tetap berjalan di Node.js.

## Persyaratan

- Python 3
- Node.js tersedia di `PATH`
- Dependensi Node terpasang di root proyek (`npm install`)
- Variabel konfigurasi server (misalnya `DATABASE_URL` atau `PGHOST`, dan
  kunci API) disetel pada environment tempat proses dijalankan

Python runner ini tidak membaca file `.env` dan tidak memasang dependensi.

## Menjalankan

Dari root proyek:

```bash
python3 python-run/run.py
```

Atau jadikan folder ini sebagai direktori kerja:

```bash
python3 run.py
```

Jika platform hosting hanya menyediakan Python dan tidak menyediakan Node.js,
runner ini tidak dapat menjalankan aplikasi. Hosting tetap harus mengizinkan
proses Node.js, port HTTP, dan WebSocket yang digunakan server.
