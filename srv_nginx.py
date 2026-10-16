from ssh_baglan import baglan
c = baglan()


def run(cmd):
    print('\n$', cmd[:120])
    _, o, e = c.exec_command(cmd)
    out = o.read().decode(errors='replace') + e.read().decode(errors='replace')
    print(out[:2000])
    return out


snippet = '''add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(self), microphone=(), camera=()" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://googleads.g.doubleclick.net https://www.googleadservices.com https://accounts.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https://open.er-api.com https://ipwho.is https://accounts.google.com https://oauth2.googleapis.com https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com https://*.doubleclick.net https://www.google.com https://www.googleadservices.com; frame-src https://accounts.google.com https://www.googletagmanager.com https://td.doubleclick.net; object-src 'none'; base-uri 'self'; frame-ancestors 'self'" always;
'''
sftp = c.open_sftp()
conf = sftp.file('/etc/nginx/sites-enabled/adausta').read().decode()
assert 'adausta-guvenlik' not in conf, 'zaten uygulanmis'
orijinal = conf
run("cp /etc/nginx/sites-enabled/adausta /root/adausta_nginx.bak_guvenlik_$(date +%Y%m%d_%H%M%S) && echo yedek-ok")
sftp.file('/etc/nginx/snippets/adausta-guvenlik.conf', 'w').write(snippet)
inc = 'include /etc/nginx/snippets/adausta-guvenlik.conf;'

# /api/: Flask basliklari gizlenir, nginx'inkiler gecerli olur (cift baslik olmasin)
yeni = conf.replace(
    "        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n    }\n\n    location ^~ /uploads/",
    "        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n        proxy_set_header X-Forwarded-Proto $scheme;\n"
    "        proxy_hide_header Strict-Transport-Security;\n        proxy_hide_header X-Frame-Options;\n"
    "        proxy_hide_header X-Content-Type-Options;\n        proxy_hide_header Referrer-Policy;\n"
    "        proxy_hide_header Permissions-Policy;\n        proxy_hide_header Content-Security-Policy;\n    }\n\n    location ^~ /uploads/", 1)
yeni = yeni.replace("    index index.html;\n", "    index index.html;\n\n    " + inc + "\n", 1)
yeni = yeni.replace('add_header Pragma "no-cache";\n', 'add_header Pragma "no-cache";\n        ' + inc + '\n', 1)
yeni = yeni.replace('add_header Cache-Control "no-cache";\n', 'add_header Cache-Control "no-cache";\n        ' + inc + '\n', 1)
assert yeni.count(inc) == 3 and 'proxy_hide_header' in yeni, 'degisiklik uygulanamadi'
sftp.file('/etc/nginx/sites-enabled/adausta', 'w').write(yeni)
out = run('nginx -t 2>&1')
if 'successful' in out:
    run('systemctl reload nginx && echo RELOAD-OK')
else:
    sftp.file('/etc/nginx/sites-enabled/adausta', 'w').write(orijinal)
    print('HATA: eski ayar geri yuklendi')
