# Panduan Field Transaksi UMKM

## Overview
Dokumen ini menjelaskan field-field yang digunakan dalam sistem transaksi UMKM.

## Transaction Fields

### Header Information
- **transaction_id** - ID unik untuk transaksi (auto-increment)
- **transaction_number** - Nomor invoice/nota yang mudah dibaca
  - Format: `TRX-{umkm_id}-{YYYYMMDD}-{seq}`
  - Contoh: `TRX-1-20241207-0001`
- **transaction_date** - Tanggal & waktu transaksi
- **umkm_id** - UMKM mana yang melakukan transaksi

### Customer Information
- **customer_id** - ID pelanggan terdaftar (optional, untuk pelanggan langganan)
- **customer_name** - Nama customer (bisa dari database atau input manual untuk walk-in)

### Transaction Type & Method
- **transaction_type** - Jenis transaksi:
  - `sale` - Penjualan (default)
  - `purchase` - Pembelian bahan baku
  - `return` - Retur/pengembalian

- **payment_method** - Metode pembayaran:
  - `cash` - Tunai
  - `transfer` - Transfer bank
  - `e_wallet` - E-wallet (GoPay, OVO, Dana, dll)
  - `credit` - Kredit/tempo

### Financial Fields
- **total_amount** - Total sebelum diskon & pajak (sum of all items)
- **discount_amount** - Total diskon keseluruhan transaksi
- **tax_amount** - Pajak (PPN, dll)
- **final_amount** - Total akhir yang harus dibayar
  - Formula: `total_amount - discount_amount + tax_amount`

### Status & Notes
- **payment_status** - Status pembayaran:
  - `pending` - Belum dibayar
  - `paid` - Sudah lunas
  - `partial` - Dibayar sebagian
  - `cancelled` - Dibatalkan

- **notes** - Catatan tambahan (optional)
- **created_by** - User yang menginput transaksi

## Transaction Items Fields

Setiap transaksi bisa memiliki multiple items (detail barang yang dibeli).

- **product_id** - ID produk yang dibeli
- **product_name** - Nama produk (snapshot, jadi kalau produk di-rename tidak berubah)
- **quantity** - Jumlah barang
- **unit_price** - Harga satuan saat transaksi
- **discount** - Diskon per item (optional)
- **subtotal** - Total per item
  - Formula: `(unit_price * quantity) - discount`

## Example Flow

### 1. Customer beli 2 item:
```
Item 1: Nasi Goreng x2 @ Rp 25,000 = Rp 50,000
Item 2: Teh Manis x1 @ Rp 5,000 = Rp 5,000
----------------------------------------
Total: Rp 55,000
Diskon transaksi: -Rp 5,000
Pajak: Rp 0
========================================
Total Bayar: Rp 50,000
```

### 2. Data yang tersimpan:
**Transaction:**
- transaction_number: TRX-1-20241207-0001
- total_amount: 55000
- discount_amount: 5000
- tax_amount: 0
- final_amount: 50000
- payment_status: paid
- payment_method: cash

**Transaction Items:**
1. product_id: 1, product_name: "Nasi Goreng", qty: 2, price: 25000, subtotal: 50000
2. product_id: 2, product_name: "Teh Manis", qty: 1, price: 5000, subtotal: 5000

## Business Logic

### Auto Stock Management
- Ketika transaksi dibuat → stock produk berkurang
- Ketika transaksi dihapus → stock produk bertambah kembali
- Stock validation sebelum transaksi dibuat

### Auto Number Generation
- Nomor transaksi otomatis generate berdasarkan UMKM dan tanggal
- Sequential numbering per hari per UMKM

### Price Snapshot
- Harga produk di-snapshot saat transaksi
- Jika harga produk berubah, transaksi lama tetap menggunakan harga lama

## Customer vs Walk-in

### Registered Customer
- `customer_id` = ID dari database
- `customer_name` = Nama dari database
- Benefit: History tracking, loyalty program

### Walk-in Customer
- `customer_id` = null
- `customer_name` = Input manual
- Untuk pembeli yang tidak terdaftar
