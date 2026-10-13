"""
Twilio Verify telefon doğrulaması için şema değişiklikleri (tekrar çalıştırılabilir, veriyi korur):
  - kullanicilar.telefon_dogrulanan (E.164), kullanicilar.telefon_dogrulama_tarihi
  - telefon_dogrulama_istekleri tablosu (gönderim/kontrol kaydı + sınırlar için)
Mevcut hiçbir kullanıcı doğrulanmış sayılmaz; kimsenin girişi/üyeliği etkilenmez.
Kullanım: python migrate_telefon_dogrulama.py
"""
import os
import sqlite3

DB = os.path.join(os.path.dirname(__file__), 'instance', 'adausta.db')

COLUMNS = [
    ("telefon_dogrulanan", "VARCHAR(20)"),
    ("telefon_dogrulama_tarihi", "DATETIME"),
]

TABLO_SQL = """
CREATE TABLE IF NOT EXISTS telefon_dogrulama_istekleri (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kullanici_id INTEGER NOT NULL REFERENCES kullanicilar(id),
    amac VARCHAR(30) NOT NULL,
    telefon_e164 VARCHAR(20) NOT NULL,
    kanal VARCHAR(10) NOT NULL,
    durum VARCHAR(15) NOT NULL DEFAULT 'bekliyor',
    ip VARCHAR(64) DEFAULT '',
    olusturma DATETIME,
    kontrol_sayisi INTEGER DEFAULT 0,
    tamamlanma DATETIME
)
"""
INDEXLER = [
    "CREATE INDEX IF NOT EXISTS ix_tdi_kullanici ON telefon_dogrulama_istekleri (kullanici_id)",
    "CREATE INDEX IF NOT EXISTS ix_tdi_telefon ON telefon_dogrulama_istekleri (telefon_e164)",
    "CREATE INDEX IF NOT EXISTS ix_tdi_ip ON telefon_dogrulama_istekleri (ip)",
    "CREATE INDEX IF NOT EXISTS ix_tdi_olusturma ON telefon_dogrulama_istekleri (olusturma)",
]

conn = sqlite3.connect(DB)
cur = conn.cursor()

if not cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='kullanicilar'").fetchone():
    print("kullanicilar tablosu yok — önce uygulama db.create_all() ile oluşturulmalı. Atlanıyor.")
    conn.close()
    raise SystemExit(0)

mevcut = [r[1] for r in cur.execute("PRAGMA table_info(kullanicilar)").fetchall()]
for ad, tanim in COLUMNS:
    if ad not in mevcut:
        cur.execute(f"ALTER TABLE kullanicilar ADD COLUMN {ad} {tanim}")
        print(f"  + kullanicilar.{ad} eklendi")
    else:
        print(f"  = kullanicilar.{ad} zaten var")

cur.execute(TABLO_SQL)
for sql in INDEXLER:
    cur.execute(sql)
print("  = telefon_dogrulama_istekleri hazır")

conn.commit()
conn.close()
print("Migration tamamlandı.")
