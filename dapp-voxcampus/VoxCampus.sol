// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/// @title VoxCampus - Papan Aspirasi dan Pengaduan Pseudonim Berbasis Blockchain
/// @notice Mahasiswa mengirim laporan tanpa nama/NIM (hanya alamat wallet).
///         Isi laporan tidak dapat diubah atau dihapus siapa pun, termasuk admin.
///         Admin hanya dapat memajukan status tindak lanjut dan menulis catatan.
contract VoxCampus {
    // ---------- State ----------
    address public admin;

    enum Status { Pending, Diproses, Selesai }
    enum Kategori { Fasilitas, Pungli, Akademik, Lainnya }

    struct Laporan {
        address pelapor;
        Kategori kategori;
        string isi;
        uint256 waktu;
        Status status;
        string catatanAdmin;
    }

    Laporan[] public laporan;
    mapping(address => uint256[]) private idLaporanPelapor;

    uint256 public constant MAKS_ISI = 280;      // byte
    uint256 public constant MAKS_CATATAN = 200;  // byte

    // ---------- Event ----------
    event LaporanMasuk(uint256 indexed id, address indexed pelapor, Kategori kategori);
    event StatusDiubah(uint256 indexed id, Status statusBaru, string catatan);

    // ---------- Modifier ----------
    modifier hanyaAdmin() {
        require(msg.sender == admin, "Bukan admin");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    // ---------- Fungsi tulis ----------
    function kirimLaporan(Kategori kategori, string calldata isi) external {
        uint256 panjang = bytes(isi).length;
        require(panjang > 0, "Isi laporan kosong");
        require(panjang <= MAKS_ISI, "Isi laporan terlalu panjang");

        laporan.push(Laporan(msg.sender, kategori, isi, block.timestamp, Status.Pending, ""));
        uint256 id = laporan.length - 1;
        idLaporanPelapor[msg.sender].push(id);

        emit LaporanMasuk(id, msg.sender, kategori);
    }

    function ubahStatus(uint256 id, Status statusBaru, string calldata catatan) external hanyaAdmin {
        require(id < laporan.length, "Laporan tidak ada");
        require(uint8(statusBaru) > uint8(laporan[id].status), "Status hanya boleh maju");
        require(bytes(catatan).length <= MAKS_CATATAN, "Catatan terlalu panjang");

        laporan[id].status = statusBaru;
        laporan[id].catatanAdmin = catatan;

        emit StatusDiubah(id, statusBaru, catatan);
    }

    // ---------- Fungsi baca ----------
    function jumlahLaporan() external view returns (uint256) {
        return laporan.length;
    }

    function laporanSaya() external view returns (uint256[] memory) {
        return idLaporanPelapor[msg.sender];
    }
}
