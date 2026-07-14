"""
Phase 4 Migration - CardPlus + Mağaza Sipariş altyapısı
Odeme tablosuna yeni sütunlar ekler.
Yeni tablolar db.create_all() ile oluşur, bu script sadece
mevcut 'odemeler' tablosunu günceller.
"""
import sqlite3, os

# Flask instance folder ile aynı DB yolu
DB = os.path.join(os.path.dirname(__file__), 'instance', 'adausta.db')

if not os.path.exists(DB):
    print(f"HATA: {DB} bulunamadı. Yol kontrol edin.")
    exit(1)

NEW_COLUMNS = [
    ("payment_source",          "VARCHAR(30) DEFAULT 'subscription'"),
    ("reference_type",          "VARCHAR(30) DEFAULT ''"),
    ("reference_id",            "INTEGER"),
    ("provider_transaction_id", "VARCHAR(200)"),
    ("error_code",              "VARCHAR(50) DEFAULT ''"),
    ("error_message",           "TEXT DEFAULT ''"),
    ("paid_at",                 "DATETIME"),
    ("refunded_at",             "DATETIME"),
    ("idempotency_key",         "VARCHAR(100)"),
]

conn = sqlite3.connect(DB)
cur  = conn.cursor()

mevcut = [row[1] for row in cur.execute("PRAGMA table_info(odemeler)").fetchall()]
print(f"Mevcut sütunlar: {mevcut}")

for col_name, col_def in NEW_COLUMNS:
    if col_name not in mevcut:
        cur.execute(f"ALTER TABLE odemeler ADD COLUMN {col_name} {col_def}")
        print(f"  + {col_name} eklendi")
    else:
        print(f"  = {col_name} zaten var")

conn.commit()
conn.close()
print("Migration tamamlandı.")
