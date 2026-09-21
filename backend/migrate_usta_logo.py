"""
ustalar tablosuna 'logo' sütunu ekler.
db.create_all() var olan tabloya yeni sütun eklemediği için bu script gerekli.
Mevcut kayıtlara dokunmaz, sadece eksik sütunu ekler.
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
backup_path = DB + '_usta_logo_backup_' + timestamp
shutil.copy2(DB, backup_path)
print(f"Backup olusturuldu: {backup_path}")

conn = sqlite3.connect(DB)
cur = conn.cursor()

mevcut = [row[1] for row in cur.execute("PRAGMA table_info(ustalar)").fetchall()]
print(f"Mevcut 'ustalar' sutunlari: {mevcut}")

if 'logo' not in mevcut:
    cur.execute("ALTER TABLE ustalar ADD COLUMN logo VARCHAR(256) DEFAULT ''")
    print("  + ustalar.logo eklendi")
else:
    print("  = ustalar.logo zaten var")

conn.commit()
conn.close()
print("Migration tamamlandi.")
