import paramiko
from scp import SCPClient
import os
import sys

HOST = '31.210.53.135'
PORT = 22
USER = 'root'
PASSWORD = 'iU7FTMHC'

def make_client():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=30)
    return client

def run_cmd(client, cmd):
    stdin, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    exit_code = stdout.channel.recv_exit_status()
    return exit_code, out, err

# ── STEP 1: Backend deploy ────────────────────────────────────────────────────
print("=" * 60)
print("STEP 1: Backend deploy")
print("=" * 60)

backend_ok = False
try:
    client = make_client()
    print("Connected to server.")

    # Ensure target dirs exist
    code, out, err = run_cmd(client, 'mkdir -p /var/www/adausta/backend/routes')
    if code != 0 and err:
        print(f"  mkdir warning: {err}")

    with SCPClient(client.get_transport()) as scp:
        print("  Uploading models.py ...")
        scp.put(r'C:\Adausta\backend\models.py',
                '/var/www/adausta/backend/models.py')
        print("  Uploading magaza.py ...")
        scp.put(r'C:\Adausta\backend\routes\magaza.py',
                '/var/www/adausta/backend/routes/magaza.py')

    print("  Files uploaded. Restarting adausta service ...")
    code, out, err = run_cmd(client, 'systemctl restart adausta && echo OK')
    if code == 0 and 'OK' in out:
        print("  adausta service restarted: OK")
        backend_ok = True
    else:
        print(f"  ERROR restarting service (exit {code}): {err or out}")

    client.close()
except Exception as e:
    print(f"  BACKEND DEPLOY FAILED: {e}")

# ── STEP 2: Frontend deploy ───────────────────────────────────────────────────
print()
print("=" * 60)
print("STEP 2: Frontend deploy")
print("=" * 60)

frontend_ok = False
try:
    client = make_client()
    print("Connected to server.")

    # Clear old dist and recreate dir
    code, out, err = run_cmd(
        client,
        'rm -rf /var/www/adausta/frontend/dist && mkdir -p /var/www/adausta/frontend/dist'
    )
    if code != 0:
        raise RuntimeError(f"Failed to clear dist: {err}")
    print("  Old dist removed.")

    # Upload new dist
    with SCPClient(client.get_transport()) as scp:
        print("  Uploading frontend/dist (recursive) ...")
        scp.put(r'C:\Adausta\frontend\dist',
                '/var/www/adausta/frontend/',
                recursive=True)
    print("  Files uploaded.")

    # Reload nginx
    code, out, err = run_cmd(client, 'systemctl reload nginx && echo OK')
    if code == 0 and 'OK' in out:
        print("  nginx reloaded: OK")
        frontend_ok = True
    else:
        print(f"  ERROR reloading nginx (exit {code}): {err or out}")

    client.close()
except Exception as e:
    print(f"  FRONTEND DEPLOY FAILED: {e}")

# ── Summary ───────────────────────────────────────────────────────────────────
print()
print("=" * 60)
print("DEPLOY SUMMARY")
print("=" * 60)
print(f"  Backend  : {'SUCCESS' if backend_ok  else 'FAILED'}")
print(f"  Frontend : {'SUCCESS' if frontend_ok else 'FAILED'}")

if not backend_ok or not frontend_ok:
    sys.exit(1)
