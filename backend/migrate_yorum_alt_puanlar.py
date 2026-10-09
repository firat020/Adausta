"""
yorumlar tablosuna kategori bazlı opsiyonel alt puan sütunlarını ekler:
puan_is_kalitesi, puan_iletisim, puan_fiyat_performans (hepsi 1-5, nullable).
Faz 2 — Görev 10 (SoliHoli kıyaslaması: "İş kalitesi / İletişim / Fiyat-performans" alt puanları).
Mevcut 'puan' alanı (genel puan) DOKUNULMAZ — geriye dönük uyumluluk korunur.
db.create_all() var olan tabloya yeni sütun eklemediği için bu script gerekli.
Mevcut kayıtlara dokunmaz (yeni sütunlar NULL kalır), sadece eksik sütunları ekler. Tekrar çalıştırılabilir.
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
backup_path = DB + '_yorum_alt_puanlar_backup_' + timestamp
shutil.copy2(DB, backup_path)
print(f"Backup olusturuldu: {backup_path}")

conn = sqlite3.connect(DB)
cur = conn.cursor()

mevcut = [row[1] for row in cur.execute("PRAGMA table_info(yorumlar)").fetchall()]
print(f"Mevcut 'yorumlar' sutunlari: {mevcut}")

yeni_sutunlar = ['puan_is_kalitesi', 'puan_iletisim', 'puan_fiyat_performans']
for sutun in yeni_sutunlar:
    if sutun not in mevcut:
        cur.execute(f"ALTER TABLE yorumlar ADD COLUMN {sutun} INTEGER")
        print(f"  + yorumlar.{sutun} eklendi")
    else:
        print(f"  = yorumlar.{sutun} zaten var")

conn.commit()
conn.close()
print("Migration tamamlandi.")
