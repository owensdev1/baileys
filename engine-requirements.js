const major = parseInt(process.versions.node.split('.')[0], 10);

if (major < 20) {
  console.error(`
  ╔════════════════════════════════════════════╗
  ║ ❌ Node.js versi ${process.versions.node} terdeteksi       ║
  ║ ▶️ Dibutuhkan: Node.js 20 atau lebih        ║
  ║ 🛠️  Silakan upgrade, lalu jalankan ulang.     ║
  ╚════════════════════════════════════════════╝
`);
  process.exit(1);
}