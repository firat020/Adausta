"""
abonelikler tablosuna 'duraklatildi_mi' ve 'duraklatma_tarihi' sütunlarını ekler.
Faz 1 — "Profili Duraklat" özelliği (SoliHoli kıyaslaması) için gerekli.
db.create_all() var olan tabloya yeni sütun eklemediği için bu script gerekli.
Mevcut kayıtlara dokunmaz, sadece eksik sütunları ekler.
"""
import sqlite3
import os
import shutil
from datetime import datetime

DB = os.path.join(os.path.dirname(__file__), 'instance', 'adausta.db')

if not os.path.exists(DB):
    print(f"HATA: {DB} bulunamadı. Yol kontrol edin.")
    exit(1)

timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
backup_path = DB + '_abonelik_duraklat_backup_' + timestamp
shutil.copy2(DB, backup_path)
print(f"Backup olusturuldu: {backup_path}")

conn = sqlite3.connect(DB)
cur = conn.cursor()

mevcut = [row[1] for row in cur.execute("PRAGMA table_info(abonelikler)").fetchall()]
print(f"Mevcut 'abonelikler' sutunlari: {mevcut}")

if 'duraklatildi_mi' not in mevcut:
    cur.execute("ALTER TABLE abonelikler ADD COLUMN duraklatildi_mi BOOLEAN DEFAULT 0")
    print("  + abonelikler.duraklatildi_mi eklendi")
else:
    print("  = abonelikler.duraklatildi_mi zaten var")

if 'duraklatma_tarihi' not in mevcut:
    cur.execute("ALTER TABLE abonelikler ADD COLUMN duraklatma_tarihi DATETIME")
    print("  + abonelikler.duraklatma_tarihi eklendi")
else:
    print("  = abonelikler.duraklatma_tarihi zaten var")

conn.commit()
conn.close()
print("Migration tamamlandi.")
