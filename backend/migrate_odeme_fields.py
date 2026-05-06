"""
Odeme tablosuna yeni sütunlar ekler:
  para_birimi, siparis_no, islem_id, kart_son4
Mevcut kayıtlara dokunmaz.
"""
import sqlite3, os

DB = os.path.join(os.path.dirname(__file__), 'instance', 'adausta.db')

COLUMNS = [
    ("para_birimi", "VARCHAR(10) DEFAULT 'TRY'"),
    ("siparis_no",  "VARCHAR(100)"),
    ("islem_id",    "VARCHAR(200)"),
    ("kart_son4",   "VARCHAR(4)"),
]

conn = sqlite3.connect(DB)
cur  = conn.cursor()

mevcut = [row[1] for row in cur.execute("PRAGMA table_info(odemeler)").fetchall()]

for col_name, col_def in COLUMNS:
    if col_name not in mevcut:
        cur.execute(f"ALTER TABLE odemeler ADD COLUMN {col_name} {col_def}")
        print(f"  + {col_name} eklendi")
    else:
        print(f"  = {col_name} zaten var")

conn.commit()
conn.close()
print("Migration tamamlandı.")
