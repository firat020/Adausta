import sqlite3, os, sys

DB = '/var/www/adausta/backend/instance/adausta.db'

if not os.path.exists(DB):
    print('DB not found:', DB)
    sys.exit(1)

conn = sqlite3.connect(DB)
cur = conn.cursor()

# magazalar tablosundaki eksik kolonlar
cols = [r[1] for r in cur.execute('PRAGMA table_info(magazalar)').fetchall()]
print('magazalar cols:', cols)

need = [
    ('basvuru_id', 'INTEGER'),
    ('kullanici_id', 'INTEGER'),
]

for col, typ in need:
    if col not in cols:
        cur.execute(f'ALTER TABLE magazalar ADD COLUMN {col} {typ}')
        print(f'+ {col} eklendi')
    else:
        print(f'  {col} zaten var')

# satici_basvurular tablosunu kontrol et (db.create_all ile olusmus olmali)
tables = [r[0] for r in cur.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
print('Tablolar:', tables)

missing_tables = [t for t in [
    'satici_basvurular', 'satici_belgeler', 'magazalar', 'magaza_uyeler',
    'satici_bakiyeleri', 'satici_audit_log', 'satici_siparisler',
    'komisyonlar', 'iade_talepleri', 'satici_yorumlar',
    'satici_abonelik_planlari', 'satici_abonelikleri'
] if t not in tables]

if missing_tables:
    print('EKSIK tablolar (db.create_all gerekli):', missing_tables)
else:
    print('Tum marketplace tablolar mevcut')

conn.commit()
conn.close()
print('DONE')
