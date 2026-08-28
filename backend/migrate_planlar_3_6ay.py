"""
planlar tablosuna 3 Aylık ve 6 Aylık planları ekler (varsa dokunmaz, idempotent).
sure_tip='3ay' / '6ay' — bitiş tarihi hesaplaması models.py::Plan.sure_gun() üzerinden
merkezi olarak yönetiliyor (90 / 180 gün).
Fiyatlar USD'dir — tahsilat sırasında günlük kura göre TRY'ye çevrilir.
"""
import sqlite3, os, shutil, sys
from datetime import datetime
try:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
except AttributeError:
    pass

DB = os.path.join(os.path.dirname(__file__), 'instance', 'adausta.db')

if not os.path.exists(DB):
    print(f"HATA: {DB} bulunamadı. Yol kontrol edin.")
    sys.exit(1)

timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
backup_path = DB + '_planlar36ay_backup_' + timestamp
shutil.copy2(DB, backup_path)
print(f"Backup oluşturuldu: {backup_path}")

# Aylık plandaki ilan_siniri değeri yeni planlarda da aynen kullanılır (tutarlılık için).
YENI_PLANLAR = [
    ('3 Aylık Plan', 26.99, '3ay', 0),   # (ad, fiyat, sure_tip, one_cikma)
    ('6 Aylık Plan', 47.99, '6ay', 1),
]

conn = sqlite3.connect(DB)
cur = conn.cursor()

aylik = cur.execute("SELECT ilan_siniri FROM planlar WHERE sure_tip = 'aylik' LIMIT 1").fetchone()
ilan_siniri = aylik[0] if aylik else 0

for ad, fiyat, sure_tip, one_cikma in YENI_PLANLAR:
    mevcut = cur.execute("SELECT COUNT(*) FROM planlar WHERE sure_tip = ?", (sure_tip,)).fetchone()[0]
    if mevcut > 0:
        print(f"  = {sure_tip} planı zaten var, atlandı.")
        continue
    cur.execute(
        "INSERT INTO planlar (ad, fiyat, sure_tip, ilan_siniri, one_cikma, aktif) VALUES (?, ?, ?, ?, ?, 1)",
        (ad, fiyat, sure_tip, ilan_siniri, one_cikma),
    )
    print(f"  + {ad} (${fiyat} / {sure_tip}) eklendi")

conn.commit()
conn.close()
print("Migration tamamlandı.")
