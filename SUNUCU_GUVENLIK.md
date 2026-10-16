# Sunucu güvenliği (31.210.53.135 — Adausta + mirteknikservis.com) — 2026-10-15/16

SSH: yalnızca anahtar (`~/.ssh/adausta_ed25519`), şifre girişi KAPALI. Python scriptleri `ssh_baglan.py` kullanır.
Sunucuda: `/etc/ssh/sshd_config.d/00-adausta-guvenlik.conf`, `/etc/nginx/snippets/adausta-guvenlik.conf`,
`/etc/fail2ban/jail.d/adausta-sshd.local`, ufw (22/80/443). Eski DB yedekleri: `/root/adausta_db_yedekleri/`.

Uygulama tarafı: `backend/guvenlik.py` (XSS temizliği, LIKE kaçışı, URL doğrulama), `ProxyFix` + herkese açık uçlara hız sınırı,
kimlik belgeleri `backend/private_belgeler/` (herkese açık /uploads dışında, `/api/usta/belge-dosya/<id>`).

Scriptler (tek seferlik, sırayla): `srv_ssh_anahtar.py` → `srv_ssh_sertlestir.py` → `srv_nginx.py` / `srv_nginx_osm.py` →
`srv_adim1_yedek.py` → `srv_adim2_fail2ban.py` → `srv_adim3_ufw.py` → `srv_adim4_guncelleme.py`.

Bekleyen: çekirdek güncellemesi için reboot (6.8.0-100 → 6.8.0-147), root şifresinin değiştirilmesi (sağlayıcı kurtarma konsolu
doğrulandıktan sonra), eski çekirdeklerin `apt autoremove` ile temizlenmesi.
