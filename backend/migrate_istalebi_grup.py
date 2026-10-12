"""
is_talepleri tablosuna 'grup_id' sütununu ekler.
Faz 3 Görev 13 — "Hizmet Talep Et" (toplu dağıtım) özelliği için gerekli:
aynı müşteri talebi birden çok ustaya giderse hepsi aynı grup_id'yi taşır.
db.create_all() var olan tabloya yeni sütun eklemediği için bu script gerekli.
Mevcut kayıtlara dokunmaz (hepsi grup_id=NULL kalır, geriye dönük uyumlu), sadece eksik sütunu ekler.
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
backup_path = DB + '_istalebi_grup_backup_' + timestamp
shutil.copy2(DB, backup_path)
print(f"Backup olusturuldu: {backup_path}")

conn = sqlite3.connect(DB)
cur = conn.cursor()

mevcut = [row[1] for row in cur.execute("PRAGMA table_info(is_talepleri)").fetchall()]
print(f"Mevcut 'is_talepleri' sutunlari: {mevcut}")

if 'grup_id' not in mevcut:
    cur.execute("ALTER TABLE is_talepleri ADD COLUMN grup_id VARCHAR(40)")
    cur.execute("CREATE INDEX IF NOT EXISTS ix_is_talepleri_grup_id ON is_talepleri (grup_id)")
    print("  + is_talepleri.grup_id eklendi (+ index)")
else:
    print("  = is_talepleri.grup_id zaten var")

conn.commit()
conn.close()
print("Migration tamamlandi.")
