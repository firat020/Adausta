from flask import Blueprint, jsonify, request, session
from functools import wraps
import json, os

ayarlar_bp = Blueprint('ayarlar', __name__)

SETTINGS_FILE = os.path.join(os.path.dirname(__file__), '..', 'settings.json')


def get_settings():
    if os.path.exists(SETTINGS_FILE):
        with open(SETTINGS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {'bakim_modu': False}


def save_settings(data):
    with open(SETTINGS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def admin_gerekli(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if session.get('rol') != 'admin':
            return jsonify({'hata': 'Yetkisiz'}), 403
        return f(*args, **kwargs)
    return decorated


# Public — frontend bu endpoint'i kontrol eder
@ayarlar_bp.route('/bakim', methods=['GET'])
def bakim_kontrol():
    s = get_settings()
    return jsonify({'bakim_modu': s.get('bakim_modu', False)})


# Admin — bakım modunu aç/kapat
@ayarlar_bp.route('/admin/bakim', methods=['POST'])
@admin_gerekli
def bakim_toggle():
    s = get_settings()
    s['bakim_modu'] = not s.get('bakim_modu', False)
    save_settings(s)
    durum = 'açıldı' if s['bakim_modu'] else 'kapatıldı'
    return jsonify({'bakim_modu': s['bakim_modu'], 'mesaj': f'Bakım modu {durum}'})
