import { ethers } from "ethers";
import { CONTRACT_ADDRESS, SEPOLIA_CHAIN_ID, RPC_URL_PUBLIK, EXPLORER_TX } from "./config.js";

// ABI minimum yang cocok dengan VoxCampus.sol (enum Solidity = uint8 pada ABI).
const ABI = [
  "function admin() view returns (address)",
  "function jumlahLaporan() view returns (uint256)",
  "function laporan(uint256) view returns (address pelapor, uint8 kategori, string isi, uint256 waktu, uint8 status, string catatanAdmin)",
  "function laporanSaya() view returns (uint256[])",
  "function kirimLaporan(uint8 kategori, string isi)",
  "function ubahStatus(uint256 id, uint8 statusBaru, string catatan)"
];

const KATEGORI = ["Fasilitas", "Pungli", "Akademik", "Lainnya"];
const STATUS = ["Pending", "Diproses", "Selesai"];
const STATUS_CLASS = ["pending", "proses", "selesai"];
const MAKS_ISI = 280;
const MAKS_CATATAN = 200;

const $ = (id) => document.getElementById(id);
const inform = (msg) => { $("status").textContent = msg; };
const byteLen = (teks) => new TextEncoder().encode(teks).length;

let provider;          // BrowserProvider (MetaMask) - dipakai setelah terhubung
let signer;
let contract;          // Contract + signer  -> baca dan tulis
let readContract;      // Contract + RPC publik -> baca saja (pengunjung tanpa wallet)
let akun = "";
let adminAddr = "";
let semuaLaporan = [];
let idSaya = [];

function periksaAlamat() {
  if (!ethers.isAddress(CONTRACT_ADDRESS)) {
    throw new Error("Isi CONTRACT_ADDRESS yang valid pada config.js (hasil deploy ke Sepolia).");
  }
}

async function periksaJaringan() {
  const jaringan = await provider.getNetwork();
  $("network").textContent = `${jaringan.name} (chainId ${jaringan.chainId})`;
  if (jaringan.chainId !== SEPOLIA_CHAIN_ID) {
    throw new Error("MetaMask bukan pada Sepolia (chainId 11155111). Pindahkan jaringan lalu hubungkan ulang.");
  }
}

function pesanError(err) {
  if (err.code === "ACTION_REJECTED") return "user rejected action (transaksi dibatalkan di MetaMask)";
  // Ambil alasan revert dari kontrak (mis. "Bukan admin") bila ethers tidak men-decode-nya.
  const rpcMsg = err.info?.error?.message || "";
  const revert = rpcMsg.match(/revert(?:ed)?:? (.+)$/i);
  return err.reason || (revert && revert[1]) || err.shortMessage || err.message;
}

function tautanTx(hash) {
  const p = $("status");
  p.textContent = "";
  p.append(`Transaksi berhasil! Hash: ${hash} `);
  const a = document.createElement("a");
  a.href = EXPLORER_TX + hash;
  a.target = "_blank";
  a.rel = "noopener";
  a.textContent = "(lihat di Etherscan)";
  p.append(a);
}

async function hubungkan() {
  try {
    if (!window.ethereum) throw new Error("MetaMask tidak ditemukan. Pasang ekstensi MetaMask di browser.");
    periksaAlamat();
    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    await periksaJaringan();
    signer = await provider.getSigner();
    contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    akun = await signer.getAddress();
    $("account").textContent = akun;
    inform("Dompet terhubung. Memuat data smart contract...");
    await muatData();
  } catch (err) { inform(`Gagal menghubungkan: ${pesanError(err)}`); }
}

async function muatData() {
  try {
    periksaAlamat();
    if (!contract && !readContract) {
      readContract = new ethers.Contract(CONTRACT_ADDRESS, ABI, new ethers.JsonRpcProvider(RPC_URL_PUBLIK));
    }
    if (contract) await periksaJaringan();
    const c = contract || readContract;

    const [adm, jumlah] = await Promise.all([c.admin(), c.jumlahLaporan()]);
    adminAddr = adm;
    const n = Number(jumlah);
    const hasil = await Promise.all(Array.from({ length: n }, (_, i) => c.laporan(i)));
    semuaLaporan = hasil.map((r, i) => ({
      id: i, pelapor: r.pelapor, kategori: Number(r.kategori), isi: r.isi,
      waktu: Number(r.waktu), status: Number(r.status), catatan: r.catatanAdmin
    }));
    idSaya = contract ? (await contract.laporanSaya()).map(Number) : [];

    $("adminAddr").textContent = adminAddr;
    $("totalLaporan").textContent = n;
    $("totalPending").textContent = semuaLaporan.filter((l) => l.status === 0).length;
    $("totalProses").textContent = semuaLaporan.filter((l) => l.status === 1).length;
    $("totalSelesai").textContent = semuaLaporan.filter((l) => l.status === 2).length;

    const isAdmin = akun && akun.toLowerCase() === adminAddr.toLowerCase();
    $("peran").textContent = !akun ? "Pengunjung (baca saja)" : isAdmin ? "Admin (Rektorat)" : "Mahasiswa / Pelapor";
    $("panelAdmin").hidden = !isAdmin;

    renderPapan();
    inform(contract ? "Data berhasil dibaca dari Sepolia." : "Data publik dibaca dari Sepolia. Hubungkan MetaMask untuk mengirim laporan.");
  } catch (err) { inform(`Gagal membaca: ${pesanError(err)}`); }
}

function renderPapan() {
  const fk = $("filterKategori").value;
  const fs = $("filterStatus").value;
  const saya = $("filterSaya").checked;
  const papan = $("papan");
  papan.textContent = "";

  const tampil = semuaLaporan
    .filter((l) => (fk === "" || l.kategori === Number(fk)) && (fs === "" || l.status === Number(fs)))
    .filter((l) => !saya || idSaya.includes(l.id))
    .reverse();

  if (tampil.length === 0) {
    const p = document.createElement("p");
    p.className = "note";
    p.textContent = "Tidak ada laporan yang cocok.";
    papan.append(p);
    return;
  }

  const isAdmin = akun && akun.toLowerCase() === adminAddr.toLowerCase();
  for (const l of tampil) {
    const kartu = document.createElement("article");
    kartu.className = `kartu ${STATUS_CLASS[l.status]}`;

    const atas = document.createElement("div");
    atas.className = "kartu-atas";
    const judul = document.createElement("strong");
    judul.textContent = `#${l.id} • ${KATEGORI[l.kategori]}`;
    const badge = document.createElement("span");
    badge.className = `badge ${STATUS_CLASS[l.status]}`;
    badge.textContent = STATUS[l.status];
    atas.append(judul, badge);

    // textContent (bukan innerHTML) agar isi laporan dari publik tidak dapat menyisipkan HTML/skrip.
    const isi = document.createElement("p");
    isi.className = "isi";
    isi.textContent = l.isi;

    const meta = document.createElement("p");
    meta.className = "meta";
    meta.textContent = `Pelapor: ${l.pelapor.slice(0, 8)}…${l.pelapor.slice(-6)} • ${new Date(l.waktu * 1000).toLocaleString("id-ID")}`;

    kartu.append(atas, isi, meta);

    if (l.catatan) {
      const cat = document.createElement("p");
      cat.className = "catatan";
      cat.textContent = `Catatan admin: ${l.catatan}`;
      kartu.append(cat);
    }
    if (isAdmin && l.status < 2) {
      const btn = document.createElement("button");
      btn.className = "kecil secondary";
      btn.textContent = "Kelola";
      btn.addEventListener("click", () => { $("adminId").value = l.id; $("panelAdmin").scrollIntoView({ behavior: "smooth" }); });
      kartu.append(btn);
    }
    papan.append(kartu);
  }
}

async function kirimLaporan(event) {
  event.preventDefault();
  const btn = $("sendBtn");
  try {
    if (!contract) throw new Error("Hubungkan MetaMask terlebih dahulu.");
    const isi = $("isi").value.trim();
    if (byteLen(isi) < 1 || byteLen(isi) > MAKS_ISI) throw new Error(`Isi laporan wajib 1 sampai ${MAKS_ISI} byte.`);
    await periksaJaringan();
    btn.disabled = true;
    inform("Konfirmasi transaksi melalui MetaMask...");
    const tx = await contract.kirimLaporan(BigInt($("kategori").value), isi);
    inform(`Transaksi dikirim: ${tx.hash}. Menunggu konfirmasi blok...`);
    const receipt = await tx.wait();
    if (receipt.status !== 1) throw new Error("Transaksi tidak berhasil.");
    $("isi").value = "";
    perbaruiCounter();
    await muatData();
    tautanTx(tx.hash);
  } catch (err) { inform(`Transaksi gagal: ${pesanError(err)}`); }
  finally { btn.disabled = false; }
}

async function ubahStatus(event) {
  event.preventDefault();
  const btn = $("adminBtn");
  try {
    if (!contract) throw new Error("Hubungkan MetaMask terlebih dahulu.");
    const id = Number($("adminId").value);
    const catatan = $("adminCatatan").value.trim();
    if (!Number.isSafeInteger(id) || id < 0) throw new Error("ID laporan harus bilangan bulat >= 0.");
    if (byteLen(catatan) > MAKS_CATATAN) throw new Error(`Catatan maksimal ${MAKS_CATATAN} byte.`);
    await periksaJaringan();
    btn.disabled = true;
    inform("Konfirmasi transaksi melalui MetaMask...");
    const tx = await contract.ubahStatus(BigInt(id), BigInt($("adminStatus").value), catatan);
    inform(`Transaksi dikirim: ${tx.hash}. Menunggu konfirmasi blok...`);
    const receipt = await tx.wait();
    if (receipt.status !== 1) throw new Error("Transaksi tidak berhasil.");
    $("adminCatatan").value = "";
    await muatData();
    tautanTx(tx.hash);
  } catch (err) { inform(`Transaksi gagal: ${pesanError(err)}`); }
  finally { btn.disabled = false; }
}

function perbaruiCounter() {
  const n = byteLen($("isi").value);
  $("counter").textContent = `${n} / ${MAKS_ISI} byte`;
  $("counter").classList.toggle("over", n > MAKS_ISI);
}

$("connectBtn").addEventListener("click", hubungkan);
$("refreshBtn").addEventListener("click", muatData);
$("formLaporan").addEventListener("submit", kirimLaporan);
$("formAdmin").addEventListener("submit", ubahStatus);
$("isi").addEventListener("input", perbaruiCounter);
["filterKategori", "filterStatus", "filterSaya"].forEach((id) => $(id).addEventListener("change", renderPapan));

if (window.ethereum?.on) {
  window.ethereum.on("accountsChanged", () => {
    contract = null;
    akun = "";
    $("account").textContent = "Akun berubah — hubungkan ulang";
    $("panelAdmin").hidden = true;
    inform("Akun berubah. Hubungkan kembali MetaMask.");
  });
  window.ethereum.on("chainChanged", () => {
    contract = null;
    akun = "";
    $("network").textContent = "Jaringan berubah — hubungkan ulang";
    $("panelAdmin").hidden = true;
    inform("Jaringan berubah. Hubungkan kembali MetaMask.");
  });
}

// Pengunjung tanpa wallet tetap dapat membaca papan publik.
if (ethers.isAddress(CONTRACT_ADDRESS)) muatData();
