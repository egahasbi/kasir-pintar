# Kasir Pintar AI - Intelligent POS & UMKM Analytics Platform

Platform Point-of-Sale (POS) dan ERP UMKM berbasis cloud. Dilengkapi pemindai barcode kamera, sinkronisasi stok riil-waktu via Supabase, cetak struk PDF otomatis, kontrol akses peran (RBAC), dan asisten analitik bisnis berbasis OpenAI API.

---

## 1. Arsitektur Sistem

Sistem menggunakan arsitektur client-server decoupled dalam satu repositori terpadu.

```
+-----------------------------------------------------------------------+
|                             CLIENT TIER                               |
|       React 18 + TypeScript + Tailwind CSS + Lucide Icons + Vite      |
+-------------------+-------------------------------+-------------------+
                    |                               |
       Direct Data Operations              AI & Backend Processing
       (Auth, Live Inventory, Cart)       (REST Endpoints, OpenAI API)
                    |                               |
                    v                               v
+-------------------------------+   +-----------------------------------+
|         SUPABASE CLOUD        |   |            NODE SERVER            |
| - Supabase Auth (JWT RBAC)    |   | - Express.js REST API             |
| - PostgreSQL Engine           |   | - TypeScript + TSX Watch          |
| - Realtime WebSockets         |   | - OpenAI GPT SDK Integration      |
| - Row Level Security (RLS)    |   | - Supabase Admin Client           |
+---------------+---------------+   +-----------------+-----------------+
                ^                                     |
                |                                     |
                +-------------------------------------+
                     Service Role Data Aggregation
```

### Komponen Inti
1. **Frontend Client (`src/`)**: Single Page Application (SPA) reaktif. Mengelola `AuthContext` (status login, peran pengguna) dan `CartContext` (manajemen keranjang belanja, kalkulasi PPN, diskon, diskon kupon). Dilengkapi `BarcodeScanner` berbasis kamera HTML5 dan `ReceiptModal` untuk unduh struk via jsPDF.
2. **Backend Engine (`server/`)**: Express API server. Mengamankan API Key OpenAI dan Service Role Supabase. Menyediakan endpoint analitik inventaris cerdas, rekomendasi restock, dan prediksi tren laba.
3. **Database & Realtime (`supabase/`)**: PostgreSQL relasional dengan Row Level Security aktif. Sinkronisasi tabel produk ke antarmuka kasir via listener WebSocket `supabase-js`.

---

## 2. Entity-Relationship Diagram (ERD)

```
       +--------------------+
       |       PROFILES     |
       +--------------------+
       | id (PK, UUID)      |<---+
       | full_name (TEXT)   |    |
       | role (role_enum)   |    |
       | created_at (TIMEST)|    |
       +---------+----------+    |
                 | 1             |
                 |               |
                 | N             |
       +---------v----------+    | 1
       |    TRANSACTIONS    |    |
       +--------------------+    |
       | id (PK, UUID)      |    |
       | invoice_no (TEXT)  |    |
       | cashier_id (FK)----+----+
       | total_amount (NUM) |
       | payment_type (ENUM)|
       | status (ENUM)      |
       | created_at (TIMEST)|
       +---------+----------+
                 | 1
                 |
                 | N
       +---------v----------+          +--------------------+
       | TRANSACTION_ITEMS  |          |      PRODUCTS      |
       +--------------------+          +--------------------+
       | id (PK, UUID)      |          | id (PK, UUID)      |<---+
       | transaction_id (FK)|          | barcode (TEXT, UNQ)|    |
       | product_id (FK)----+--------->| name (TEXT)        |    |
       | quantity (INT)     | N      1 | category (TEXT)    |    |
       | unit_price (NUM)   |          | cost_price (NUM)   |    |
       | subtotal (NUM)     |          | selling_price (NUM)|    |
       +--------------------+          | stock (INT)        |    |
                                       | min_stock (INT)    |    |
                                       | is_active (BOOL)   |    |
                                       | created_at (TIMEST)|    |
                                       +---------+----------+    |
                                                 | 1             |
                                                 |               |
                                                 | N             |
                                       +---------v----------+    |
                                       |    STOCK_LOGS      |    |
                                       +--------------------+    |
                                       | id (PK, UUID)      |    |
                                       | product_id (FK)----+----+
                                       | change_qty (INT)   |
                                       | reason (TEXT)      |
                                       | created_at (TIMEST)|
                                       +--------------------+
```

---

## 3. Prasyarat Sistem

- **Node.js**: `v20.x` LTS atau lebih tinggi
- **npm**: `v10.x` atau lebih tinggi
- **Supabase Account**: Project aktif dengan database PostgreSQL
- **OpenAI API Key**: Akun aktif dengan kuota API

---

## 4. Panduan Setup Lokal

### Langkah 1: Klon Repositori
```bash
git clone https://github.com/your-username/kasir-pintar-ai.git
cd kasir-pintar-ai
```

### Langkah 2: Instalasi Dependency
Instal seluruh paket dependensi root, client, dan server:
```bash
npm install
```

### Langkah 3: Konfigurasi Environment Variable
Buat file konfigurasi `.env` pada root direktori:

```bash
cp .env.example .env
```

Isi variabel konfigurasi berikut:

```env
# SERVER CONFIGURATION
PORT=5000
NODE_ENV=development

# CLIENT ENVIRONMENT (Vite expose)
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_URL=http://localhost:5000/api

# BACKEND ENVIRONMENT (Privileged)
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> **Keamanan**: `SUPABASE_SERVICE_ROLE_KEY` dan `OPENAI_API_KEY` tidak boleh memiliki prefix `VITE_`. Kedua key hanya diproses dalam server Express.

### Langkah 4: Setup Database Supabase
1. Buka dashboard project Supabase.
2. Masuk menu **SQL Editor**.
3. Buka file `supabase/migrations/20250101000000_init_schema.sql` dari repositori.
4. Salin seluruh konten query, tempel ke SQL Editor Supabase, lalu jalankan (**Run**).
5. Schema, tabel (`profiles`, `products`, `transactions`, `transaction_items`, `stock_logs`), enum, RLS policy, dan trigger database siap digunakan.

### Langkah 5: Jalankan Server Development
Eksekusi frontend dan backend secara simultan:
```bash
npm run dev
```

Output log terminal:
- Server Express: `http://localhost:5000`
- Client Vite SPA: `http://localhost:5173`

---

## 5. Script NPM

| Command | Fungsi |
|---|---|
| `npm run dev` | Jalankan client Vite dan backend TSX Watch serentak via `concurrently` |
| `npm run dev:server` | Jalankan server Node/Express development watch mode |
| `npm run dev:client` | Jalankan server Vite development frontend |
| `npm run build` | Kompilasi bundle production untuk client (`vite build`) dan server (`esbuild`) |
| `npm run build:client`| Kompilasi TypeScript dan bundle production frontend ke `dist/` |
| `npm run build:server`| Bundle Express API ke format single executable `dist/server/index.js` via esbuild |
| `npm run start` | Jalankan server node production dari hasil build |
| `npm run preview` | Preview build production frontend lokal |
| `npm run lint` | Jalankan audit linter ESLint |

---

## 6. Panduan Deployment

### Opsi A: Fullstack Monolith di Single VPS / PaaS (Render, Railway, Fly.io)

1. **Build Container / Command Build**:
   ```bash
   npm install && npm run build
   ```
2. **Start Command**:
   ```bash
   npm run start
   ```
3. **Konfigurasi Static Serving**:
   Pastikan backend Express menyajikan direktori `dist/client` jika frontend di-bundle dalam satu server web.
4. Masukkan seluruh environment variable pada menu dashboard platform cloud.

### Opsi B: Decoupled Deployment (Vercel Frontend + Render/Railway Backend)

#### Frontend (Vercel):
1. Import repositori git ke dashboard Vercel.
2. Framework preset: **Vite**.
3. Build command: `npm run build:client`.
4. Output directory: `dist`.
5. Environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_URL` (arahkan ke URL backend production Anda, contoh: `https://api-kasir.up.railway.app/api`)

#### Backend (Railway / Render):
1. Import repositori ke Railway atau Render.
2. Root directory: repositori project.
3. Build command: `npm run build:server`.
4. Start command: `node dist/server/index.js`.
5. Environment variables:
   - `PORT=5000`
   - `NODE_ENV=production`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`
6. Pasang CORS whitelist pada Express jika domain frontend berbeda.

---

## 7. Fitur Utama

- **Realtime POS Interface**: Kasir interaktif dengan pencarian instan, filter kategori, dan shortcut barcode scan via kamera perangkat.
- **Auto Stock Deduction**: Transaksi sukses otomatis mengurangi kolom `stock` produk melalui database transaction atomik.
- **PDF Receipt Generator**: Cetak dan unduh struk thermal standar POS langsung dari browser.
- **AI Analytics Drawer**: Analisis pergerakan inventaris, deteksi produk slow-moving/fast-moving, dan rekomendasi margin keuntungan otomatis via model OpenAI.
- **Role-Based Access Control**: Pembagian hak akses terisolasi antara `admin` (kontrol penuh inventaris & analitik) dan `cashier` (akses proses transaksi kasir).