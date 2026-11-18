# VoxCampus — Papan Aspirasi dan Pengaduan Pseudonim Berbasis Blockchain

Frontend DApp (HTML, CSS, JavaScript, ethers.js v6, Vite) untuk smart contract `VoxCampus.sol`
pada jaringan Sepolia (chain ID 11155111).

## Langkah menjalankan

1. Buka `VoxCampus.sol` di https://remix.ethereum.org, compile dengan Solidity 0.8.26.
2. Deploy dengan environment **Browser Extension / Injected Provider - MetaMask** pada jaringan Sepolia.
3. Salin **alamat kontrak** hasil deploy, tempel ke `CONTRACT_ADDRESS` di `config.js`.
4. Jalankan:

```bash
npm install
npm run dev
```

5. Buka alamat yang tampil di terminal (biasanya http://localhost:5173/). Jangan membuka `index.html` langsung (`file://`).

## Peran

| Peran | Akses |
|---|---|
| Pengunjung | Membaca papan tanpa wallet (lewat RPC publik) |
| Pelapor | `kirimLaporan(kategori, isi)` setelah menghubungkan MetaMask |
| Admin (deployer) | `ubahStatus(id, status, catatan)`; status hanya boleh maju |

> Catatan: aplikasi ini **pseudonim**, bukan anonim. Alamat wallet pelapor tercatat publik dan permanen.
> Gunakan wallet khusus dan jangan menulis data pribadi pada isi laporan. Jangan pernah membagikan private key / seed phrase.
