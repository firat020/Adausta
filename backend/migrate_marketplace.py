"""
AdaUsta Marketplace Migration
- 'urunler' tablosuna store_id ve urun_durum sütunları ekler
- 'magazalar' tablosunu oluşturur (yoksa)
- 'AdaUsta Resmî Mağaza' placeholder kaydı oluşturur
- Mevcut tüm ürünleri bu mağazaya bağlar
"""
import sqlite3
import os
import shutil
from datetime import datetime

DB = os.path.join(os.path.dirname(__file__), 'instance', 'adausta.db')

print("=== AdaUsta Marketplace Migration ===")

# --- 2. DB varlık kontrolü ---
if not os.path.exists(DB):
    print(f"HATA: {DB} bulunamadı. Yol kontrol edin.")
    exit(1)

# --- 3. Yedek oluştur ---
timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
backup_path = DB + '_marketplace_backup_' + timestamp
shutil.copy2(DB, backup_path)
print(f"Backup oluşturuldu: {backup_path}")

conn = sqlite3.connect(DB)
cur = conn.cursor()

try:
    # --- 5. 'urunler' tablosuna yeni sütunlar ekle ---
    mevcut_urunler = [row[1] for row in cur.execute("PRAGMA table_info(urunler)").fetchall()]
    print(f"Mevcut 'urunler' sütunları: {mevcut_urunler}")

    urunler_columns = [
        ("store_id",    "INTEGER"),
        ("urun_durum",  "VARCHAR(20) DEFAULT 'active'"),
    ]

    for col_name, col_def in urunler_columns:
        if col_name not in mevcut_urunler:
            cur.execute(f"ALTER TABLE urunler ADD COLUMN {col_name} {col_def}")
            print(f"  + urunler.{col_name} eklendi")
        else:
            print(f"  = urunler.{col_name} zaten var")

    # --- 6. 'magazalar' tablosunu oluştur (yoksa) ---
    cur.execute("""
        CREATE TABLE IF NOT EXISTS magazalar (
            id                  INTEGER PRIMARY KEY AUTOINCREMENT,
            magaza_adi          TEXT NOT NULL,
            slug                TEXT UNIQUE NOT NULL,
            ticari_unvan        TEXT DEFAULT '',
            vergi_no            TEXT DEFAULT '',
            iban                TEXT DEFAULT '',
            banka_hesap_sahibi  TEXT DEFAULT '',
            logo                TEXT DEFAULT '',
            kapak_gorsel        TEXT DEFAULT '',
            aciklama            TEXT DEFAULT '',
            aktif               INTEGER DEFAULT 1,
            askida              INTEGER DEFAULT 0,
            komisyon_orani      REAL DEFAULT 15.0,
            toplam_satis        REAL DEFAULT 0.0,
            puan                REAL DEFAULT 0.0,
            yorum_sayisi        INTEGER DEFAULT 0,
            olusturma           TEXT DEFAULT (datetime('now'))
        )
    """)
    print("  = 'magazalar' tablosu hazır (oluşturuldu veya zaten vardı)")

    # --- 7. 'AdaUsta Resmî Mağaza' kaydını ekle (yoksa) ---
    mevcut_magaza = cur.execute(
        "SELECT id FROM magazalar WHERE slug = 'adausta-resmi-magaza'"
    ).fetchone()

    if mevcut_magaza is None:
        cur.execute("""
            INSERT INTO magazalar
                (magaza_adi, slug, ticari_unvan, aciklama, aktif)
            VALUES
                ('AdaUsta Resmî Mağaza', 'adausta-resmi-magaza', 'AdaUsta',
                 'AdaUsta platformunun resmî mağazası', 1)
        """)
        adausta_store_id = cur.lastrowid
        print(f"  + 'AdaUsta Resmî Mağaza' eklendi (id={adausta_store_id})")
    else:
        adausta_store_id = mevcut_magaza[0]
        print(f"  = 'AdaUsta Resmî Mağaza' zaten var (id={adausta_store_id})")

    # --- 8. Mevcut ürünleri mağazaya bağla ---
    cur.execute(
        "UPDATE urunler SET store_id = ? WHERE store_id IS NULL",
        (adausta_store_id,)
    )
    guncellenen = cur.rowcount
    print(f"  + {guncellenen} ürün 'AdaUsta Resmî Mağaza'ya bağlandı (store_id={adausta_store_id})")

    conn.commit()

except Exception as e:
    conn.rollback()
    print(f"\nHATA oluştu, değişiklikler geri alındı: {e}")
    raise
finally:
    conn.close()

# --- 9. Tamamlandı ---
print("\nMigration başarıyla tamamlandı.")

# ROLLBACK (uncomment to revert):
# SQLite ALTER TABLE DROP COLUMN desteklemez.
# Geri almak için aşağıdaki adımları uygulayın:
#
# conn = sqlite3.connect(DB)
# cur = conn.cursor()
# DELETE FROM magazalar WHERE slug = 'adausta-resmi-magaza'
# UPDATE urunler SET store_id = NULL, urun_durum = 'active'
# conn.commit()
# conn.close()
#
# NOT: store_id ve urun_durum sütunları kalmaya devam eder (SQLite kısıtı),
# ancak veriler temizlenir. Tam geri alma için backup dosyasını kullanın:
# shutil.copy2(DB + '_marketplace_backup_<timestamp>', DB)
