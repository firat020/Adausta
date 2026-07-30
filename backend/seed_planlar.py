"""
Usta abonelik planlarını (Aylık / Yıllık) planlar tablosuna ekler.
Tablo boşsa çalışır, mevcut kayıtlara dokunmaz.
Fiyatlar USD'dir — tahsilat sırasında günlük kura göre TRY'ye çevrilir.
"""
import sqlite3, os, sys
try:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
except AttributeError:
    pass

DB = os.path.join(os.path.dirname(__file__), 'instance', 'adausta.db')

PLANLAR = [
    ('Aylık Plan', 9.99, 'aylik', 0),
    ('Yıllık Plan', 99.0, 'yillik', 1),
]

conn = sqlite3.connect(DB)
cur = conn.cursor()

mevcut = cur.execute("SELECT COUNT(*) FROM planlar").fetchone()[0]
if mevcut > 0:
    print(f"planlar tablosunda zaten {mevcut} kayıt var, dokunulmadı.")
else:
    for ad, fiyat, sure_tip, one_cikma in PLANLAR:
        cur.execute(
            "INSERT INTO planlar (ad, fiyat, sure_tip, ilan_siniri, one_cikma, aktif) VALUES (?, ?, ?, ?, ?, 1)",
            (ad, fiyat, sure_tip, 0, one_cikma),
        )
        print(f"  + {ad} (${fiyat} / {sure_tip}) eklendi")
    conn.commit()

conn.close()
print("Seed tamamlandı.")
