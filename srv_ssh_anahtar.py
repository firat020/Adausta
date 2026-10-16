"""SSH anahtar girisini hazirlar (sshd ayarlarina DOKUNMAZ, sifre girisi acik kalir).
1) Genel anahtari /root/.ssh/authorized_keys dosyasina ekler (zaten varsa eklemez)
2) Ayri bir baglantida SADECE anahtarla giris yapip dogrular."""
import os
import re
import paramiko

KEY = os.path.join(os.path.expanduser('~'), '.ssh', 'adausta_ed25519')
HOST, USER = '31.210.53.135', 'root'
pub = open(KEY + '.pub', encoding='utf-8').read().strip()
pw = os.environ['ADAUSTA_SSH_PASSWORD']  # yalnizca ilk kurulum icin; sonra anahtar kullanilir

c = paramiko.SSHClient(); c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=pw, timeout=30, look_for_keys=False, allow_agent=False)


def run(cli, cmd):
    _, o, e = cli.exec_command(cmd)
    return (o.read().decode(errors='replace') + e.read().decode(errors='replace')).strip()


print(run(c, 'mkdir -p /root/.ssh && chmod 700 /root/.ssh && touch /root/.ssh/authorized_keys && chmod 600 /root/.ssh/authorized_keys && wc -l < /root/.ssh/authorized_keys'))
anahtar_govdesi = pub.split()[1]
if anahtar_govdesi in run(c, 'cat /root/.ssh/authorized_keys'):
    print('Anahtar zaten ekli.')
else:
    run(c, f"echo '{pub}' >> /root/.ssh/authorized_keys")
    print('Anahtar eklendi.')

# Ayri baglanti: sifre YOK, yalnizca anahtar
k = paramiko.SSHClient(); k.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    k.connect(HOST, username=USER, key_filename=KEY, timeout=30, look_for_keys=False, allow_agent=False)
    print('ANAHTAR-GIRISI-OK:', run(k, 'whoami && hostname'))
except Exception as ex:
    print('ANAHTAR-GIRISI-BASARISIZ:', ex)
finally:
    k.close(); c.close()
