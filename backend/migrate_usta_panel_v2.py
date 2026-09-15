"""
Usta paneli denetimi sonrası eklenen alanlar için migration:
  - yorumlar tablosuna 'cevap' / 'cevap_tarih' sütunları (usta yorum yanıtı)
mesajlar ve usta_belgeler tabloları YENİ tablolar olduğu için db.create_all()
tarafından otomatik oluşturulur, burada ele alınmaz.
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
backup_path = DB + '_usta_panel_v2_backup_' + timestamp
shutil.copy2(DB, backup_path)
print(f"Backup olusturuldu: {backup_path}")

conn = sqlite3.connect(DB)
cur = conn.cursor()

mevcut = [row[1] for row in cur.execute("PRAGMA table_info(yorumlar)").fetchall()]
print(f"Mevcut 'yorumlar' sutunlari: {mevcut}")

if 'cevap' not in mevcut:
    cur.execute("ALTER TABLE yorumlar ADD COLUMN cevap TEXT DEFAULT ''")
    print("  + yorumlar.cevap eklendi")
else:
    print("  = yorumlar.cevap zaten var")

if 'cevap_tarih' not in mevcut:
    cur.execute("ALTER TABLE yorumlar ADD COLUMN cevap_tarih DATETIME")
    print("  + yorumlar.cevap_tarih eklendi")
else:
    print("  = yorumlar.cevap_tarih zaten var")

conn.commit()
conn.close()
print("Migration tamamlandi.")
