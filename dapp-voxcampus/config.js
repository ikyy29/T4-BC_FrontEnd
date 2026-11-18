// Ganti dengan alamat hasil deploy VoxCampus di Sepolia (bukan alamat wallet,
// bukan alamat dari Remix VM). Contoh bentuk: "0x" + 40 digit heksadesimal.
export const CONTRACT_ADDRESS = "0x1d305eFc3791cFe5BCd4fD2A222bC63bB67e3fDb";

export const SEPOLIA_CHAIN_ID = 11155111n;

// RPC publik hanya untuk MEMBACA papan tanpa wallet (pengunjung).
export const RPC_URL_PUBLIK = "https://ethereum-sepolia-rpc.publicnode.com";

// Dipakai untuk membentuk tautan SETELAH transaksi benar-benar memiliki hash.
export const EXPLORER_TX = "https://sepolia.etherscan.io/tx/";
