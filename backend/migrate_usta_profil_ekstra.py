"""
ustalar tablosuna 'profil_ekstra' (JSON metin) sütunu ekler.
Kapak görseli, diller, çalışma saatleri, ödeme yöntemleri, web sitesi bu sütunda tutulur.
db.create_all() var olan tabloya yeni sütun eklemediği için bu script gerekli.
Mevcut kayıtlara dokunmaz; önce yedek alır, sadece eksik sütunu ekler. Tekrar çalıştırılabilir.
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
backup_path = DB + '_profil_ekstra_backup_' + timestamp
shutil.copy2(DB, backup_path)
print(f"Backup olusturuldu: {backup_path}")

conn = sqlite3.connect(DB)
cur = conn.cursor()
mevcut = [row[1] for row in cur.execute("PRAGMA table_info(ustalar)").fetchall()]

if 'profil_ekstra' not in mevcut:
    cur.execute("ALTER TABLE ustalar ADD COLUMN profil_ekstra TEXT DEFAULT ''")
    print("  + ustalar.profil_ekstra eklendi")
else:
    print("  = ustalar.profil_ekstra zaten var")

conn.commit()
conn.close()
print("Migration tamamlandi.")
