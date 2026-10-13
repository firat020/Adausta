"""Açılışta eksik sütunları ekler (SQLite, tekrar çalıştırılabilir, veriyi silmez).
db.create_all() mevcut tabloya sütun eklemez; deploy sırasında migration unutulursa
kullanıcı sorguları patlamasın diye migrate_telefon_dogrulama.py ile aynı işi yapar."""
from sqlalchemy import text

KULLANICI_SUTUNLARI = [
    ('telefon_dogrulanan', 'VARCHAR(20)'),
    ('telefon_dogrulama_tarihi', 'DATETIME'),
]


def telefon_dogrulama_semasini_guncelle(db):
    if db.engine.dialect.name != 'sqlite':
        return
    with db.engine.begin() as conn:
        mevcut = {r[1] for r in conn.execute(text('PRAGMA table_info(kullanicilar)'))}
        if not mevcut:
            return  # tablo henüz yok; create_all oluşturur
        for ad, tanim in KULLANICI_SUTUNLARI:
            if ad not in mevcut:
                conn.execute(text(f'ALTER TABLE kullanicilar ADD COLUMN {ad} {tanim}'))
