"""ADIM 1: Eski veritabani yedeklerini instance/ disina tasir (SILMEZ), izinleri sikilastirir.
adausta.db'ye dokunulmaz (yalnizca chmod 600). Sunucuyu yeniden baslatmaz."""
import sys
from srv_ortak import baglan, run, dogrula

c = baglan()
print('Oncesi:', run(c, 'ls /var/www/adausta/backend/instance | wc -l'), 'dosya, adausta.db:', run(c, 'stat -c "%s bayt %a" /var/www/adausta/backend/instance/adausta.db'))
print(run(c, '''set -e
cd /var/www/adausta/backend/instance
mkdir -p /root/adausta_db_yedekleri && chmod 700 /root/adausta_db_yedekleri
for f in adausta.db.* adausta.db_*; do
  case "$f" in *-wal|*-shm|*-journal) echo "ATLANDI (aktif DB yardimci dosyasi): $f"; continue;; esac
  if [ -e "$f" ]; then mv -n "$f" /root/adausta_db_yedekleri/; fi
done
# Uygulama kullanicisi (systemd User=) neyse onun sahipligi/izni korunur
APPUSER=$(systemctl show adausta -p User --value); APPUSER=${APPUSER:-root}
chown "$APPUSER" adausta.db 2>/dev/null; chmod 600 adausta.db
for w in adausta.db-wal adausta.db-shm; do if [ -e "$w" ]; then chown "$APPUSER" "$w"; chmod 600 "$w"; fi; done
chown "$APPUSER" . && chmod 700 .
echo "uygulama kullanicisi: $APPUSER"
echo "instance icinde kalan:"; ls -l /var/www/adausta/backend/instance
echo "tasinan yedek sayisi: $(ls /root/adausta_db_yedekleri | wc -l)"'''))
ok_db = run(c, 'python3 -c "import sqlite3;c=sqlite3.connect(\'file:/var/www/adausta/backend/instance/adausta.db?mode=ro\',uri=True);print(c.execute(\'select count(*) from ustalar\').fetchone()[0])"')
print('DB okunabiliyor, usta sayisi:', ok_db)
ok = dogrula('adim1')
print('ADIM1-TAMAM' if ok else 'ADIM1-DOGRULAMA-BASARISIZ')
c.close()
sys.exit(0 if ok else 1)
