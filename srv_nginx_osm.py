"""nginx CSP duzeltmesi: usta sayfasindaki OpenStreetMap haritasi (iframe) icin frame-src'ye openstreetmap.org ekler.
Snippet'i yedekler; nginx -t basarisizsa eski snippet'i geri yukler."""

from ssh_baglan import baglan
c = baglan()
SNIP = '/etc/nginx/snippets/adausta-guvenlik.conf'


def run(cmd):
    print('\n$', cmd[:120])
    _, o, e = c.exec_command(cmd)
    out = o.read().decode(errors='replace') + e.read().decode(errors='replace')
    print(out[:2000])
    return out


sftp = c.open_sftp()
orijinal = sftp.file(SNIP).read().decode()
assert 'https://www.openstreetmap.org' not in orijinal, 'zaten uygulanmis'
yeni = orijinal.replace('frame-src https://accounts.google.com', 'frame-src https://accounts.google.com https://www.openstreetmap.org', 1)
assert yeni != orijinal, 'frame-src bulunamadi'
run(f'cp {SNIP} /root/adausta-guvenlik.conf.bak_$(date +%Y%m%d_%H%M%S) && echo yedek-ok')
sftp.file(SNIP, 'w').write(yeni)
out = run('nginx -t 2>&1')
if 'successful' in out:
    run('systemctl reload nginx && echo RELOAD-OK')
else:
    sftp.file(SNIP, 'w').write(orijinal)
    print('HATA: eski snippet geri yuklendi')
