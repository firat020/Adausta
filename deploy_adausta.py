import paramiko
from scp import SCPClient
import os

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('31.210.53.135', port=22, username='root', password='iU7FTMHC')

stdin, stdout, stderr = client.exec_command('rm -rf /var/www/adausta/frontend/dist && mkdir -p /var/www/adausta/frontend/dist')
stdout.read()
print("Eski dist silindi")

with SCPClient(client.get_transport()) as scp:
    scp.put('frontend/dist', '/var/www/adausta/frontend/', recursive=True)
print("Dosyalar yüklendi")

stdin, stdout, stderr = client.exec_command('systemctl reload nginx && echo OK')
print(stdout.read().decode())
client.close()
print("Deploy tamamlandi!")
