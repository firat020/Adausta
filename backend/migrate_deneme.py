"""
Abonelikler tablosuna deneme_mi sütunu ekler (90 günlük ücretsiz deneme ile
başlayan abonelikleri işaretlemek için). Mevcut kayıtlara dokunmaz, hepsi
varsayılan olarak 0 (deneme değil) kalır.
usta_bildirimleri tablosu (Bildir özelliği) yeni bir tablo olduğu için ayrı
migrasyon gerekmez — uygulama açılışında db.create_all() ile kendiliğinden oluşur.
"""
import sqlite3, os

DB = os.path.join(os.path.dirname(__file__), 'instance', 'adausta.db')

COLUMNS = [
    ("deneme_mi", "BOOLEAN DEFAULT 0"),
]

conn = sqlite3.connect(DB)
cur = conn.cursor()

tablo_var = cur.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='abonelikler'"
).fetchone()
if not tablo_var:
    print("abonelikler tablosu yok — db.create_all() ile oluşturulana kadar bu migrasyon atlanıyor.")
    conn.close()
    raise SystemExit(0)

mevcut = [row[1] for row in cur.execute("PRAGMA table_info(abonelikler)").fetchall()]

for col_name, col_def in COLUMNS:
    if col_name not in mevcut:
        cur.execute(f"ALTER TABLE abonelikler ADD COLUMN {col_name} {col_def}")
        print(f"  + {col_name} eklendi")
    else:
        print(f"  = {col_name} zaten var")

conn.commit()
conn.close()
print("Migration tamamlandı.")
