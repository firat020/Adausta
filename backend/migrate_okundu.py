"""
is_talepleri tablosuna 'okundu' sütunu ekler.
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
backup_path = DB + '_okundu_backup_' + timestamp
shutil.copy2(DB, backup_path)
print(f"Backup olusturuldu: {backup_path}")

conn = sqlite3.connect(DB)
cur = conn.cursor()

mevcut = [row[1] for row in cur.execute("PRAGMA table_info(is_talepleri)").fetchall()]
print(f"Mevcut 'is_talepleri' sutunlari: {mevcut}")

if 'okundu' not in mevcut:
    cur.execute("ALTER TABLE is_talepleri ADD COLUMN okundu BOOLEAN DEFAULT 0")
    print("  + is_talepleri.okundu eklendi")
else:
    print("  = is_talepleri.okundu zaten var")

conn.commit()
conn.close()
print("Migration tamamlandi.")
