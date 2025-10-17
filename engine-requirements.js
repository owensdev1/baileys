const major = parseInt(process.versions.node.split('.')[0], 10);

if (major < 20) {
  console.error(
    `\n❌ Paket ini memerlukan Node.js versi 20 atau lebih untuk berjalan dengan stabil.\n` +
    ` Anda menggunakan Node.js ${process.versions.node}.\n` +
    ` Silakan perbarui ke Node.js versi 20 atau lebih untuk melanjutkan.\n`
  );
  process.exit(1);
}
