"""Ortak SSH baglantisi: once ~/.ssh/adausta_ed25519 anahtari, yoksa ADAUSTA_SSH_PASSWORD ortam degiskeni.
Sifre kod icinde TUTULMAZ."""
import os
import paramiko

HOST = '31.210.53.135'
USER = 'root'
KEY = os.path.join(os.path.expanduser('~'), '.ssh', 'adausta_ed25519')


def baglan(host=HOST, user=USER, port=22, timeout=30):
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    kw = dict(username=user, port=port, timeout=timeout, look_for_keys=False, allow_agent=False)
    if os.path.exists(KEY):
        kw['key_filename'] = KEY
    elif os.environ.get('ADAUSTA_SSH_PASSWORD'):
        kw['password'] = os.environ['ADAUSTA_SSH_PASSWORD']
    else:
        raise RuntimeError(f'SSH anahtari bulunamadi ({KEY}) ve ADAUSTA_SSH_PASSWORD tanimli degil')
    c.connect(host, **kw)
    return c
