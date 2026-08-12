"""
CardPlus Merchant Safe (otomatik yenileme) için yeni sütunlar ekler:
  ustalar.cardplus_safekey
  abonelikler.otomatik_yenileme, basarisiz_deneme_sayisi, son_deneme_tarihi
  odemeler.safekey_talep_edildi, otomatik_tahsilat
Mevcut kayıtlara dokunmaz.
"""
import sqlite3, os, sys
try:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
except AttributeError:
    pass

DB = os.path.join(os.path.dirname(__file__), 'instance', 'adausta.db')

TABLES = {
    'ustalar': [
        ("cardplus_safekey", "VARCHAR(64)"),
    ],
    'abonelikler': [
        ("otomatik_yenileme", "BOOLEAN DEFAULT 0"),
        ("basarisiz_deneme_sayisi", "INTEGER DEFAULT 0"),
        ("son_deneme_tarihi", "DATETIME"),
    ],
    'odemeler': [
        ("safekey_talep_edildi", "BOOLEAN DEFAULT 0"),
        ("otomatik_tahsilat", "BOOLEAN DEFAULT 0"),
    ],
}

conn = sqlite3.connect(DB)
cur  = conn.cursor()

for table, columns in TABLES.items():
    mevcut = [row[1] for row in cur.execute(f"PRAGMA table_info({table})").fetchall()]
    for col_name, col_def in columns:
        if col_name not in mevcut:
            cur.execute(f"ALTER TABLE {table} ADD COLUMN {col_name} {col_def}")
            print(f"  + {table}.{col_name} eklendi")
        else:
            print(f"  = {table}.{col_name} zaten var")

conn.commit()
conn.close()
print("Migration tamamlandı.")
