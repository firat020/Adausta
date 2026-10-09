"""
iletisim_log tablosuna nullable 'dil' sütunu ekler (String(5)).
Faz 4 — Görev 17 (SoliHoli kıyaslaması: "Dile göre talep" kırılımı).
Ziyaretçinin iletişime geçtiği anda arayüz dilini (tr/en/ru/de/fa/ur) kaydetmek için.
Mevcut kayıtlara dokunmaz (yeni sütun NULL kalır), sadece eksik sütunu ekler. Tekrar çalıştırılabilir.
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
backup_path = DB + '_iletisim_dil_backup_' + timestamp
shutil.copy2(DB, backup_path)
print(f"Backup olusturuldu: {backup_path}")

conn = sqlite3.connect(DB)
cur = conn.cursor()

mevcut = [row[1] for row in cur.execute("PRAGMA table_info(iletisim_log)").fetchall()]
print(f"Mevcut 'iletisim_log' sutunlari: {mevcut}")

if 'dil' not in mevcut:
    cur.execute("ALTER TABLE iletisim_log ADD COLUMN dil VARCHAR(5)")
    print("  + iletisim_log.dil eklendi")
else:
    print("  = iletisim_log.dil zaten var")

conn.commit()
conn.close()
print("Migration tamamlandi.")
