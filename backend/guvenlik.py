"""Merkezi girdi güvenliği: XSS temizliği + LIKE (arama) kaçışı + URL doğrulama.

SQL enjeksiyonuna karşı asıl koruma SQLAlchemy'nin parametreli sorgularıdır; bu modül
arama kutusundaki % ve _ joker karakterlerinin kaçırılmasını ve metin alanlarındaki
<script>, olay yakalayıcı (onerror=...), javascript: gibi içeriğin kaydedilmeden
önce temizlenmesini sağlar.
"""
import html
import re
from urllib.parse import urlparse

# Bu anahtarlara dokunulmaz (şifre/token gibi ham değer olmalı; ödeme sağlayıcı alanları)
_ATLA_ANAHTAR = {
    'sifre', 'password', 'yeni_sifre', 'eski_sifre', 'sifre_tekrar', 'token', 'credential',
    'id_token', 'kod', 'otp', 'hash', 'fcm_token', 'form_html',
}

_BLOK_ETIKET = re.compile(
    r'<\s*(script|style|iframe|object|embed|svg|math|template)\b[^>]*>.*?<\s*/\s*\1\s*>',
    re.IGNORECASE | re.DOTALL,
)
_ETIKET = re.compile(r'</?[a-zA-Z!][^>]*>?', re.DOTALL)
_ACIK_ETIKET = re.compile(r'<\s*/?\s*(script|style|iframe|object|embed|svg|math|template)\b[^>]*', re.IGNORECASE)
_TEHLIKELI_SEMA = re.compile(r'(?i)(?:java|vb)\s*script\s*:|data\s*:\s*text/html')
_OLAY = re.compile(r'(?i)\bon[a-z]{3,20}\s*=')
_KONTROL = re.compile(r'[\x00-\x08\x0b\x0c\x0e-\x1f]')


def temizle_metin(s):
    """Bir metinden HTML/script içeriğini temizler. Düz metin (&, ', ") bozulmaz."""
    if not isinstance(s, str) or not s:
        return s
    s = _KONTROL.sub('', s)
    for _ in range(3):  # iç içe/çift kodlanmış etiketler için birkaç tur
        onceki = s
        s = html.unescape(s) if '&' in s and re.search(r'&#?\w+;', s) else s
        s = _BLOK_ETIKET.sub('', s)
        s = _ACIK_ETIKET.sub('', s)
        s = _ETIKET.sub('', s)
        if s == onceki:
            break
    s = _TEHLIKELI_SEMA.sub('', s)
    s = _OLAY.sub('', s)
    return s.replace('<', '').replace('>', '') if re.search(r'<[a-zA-Z/!]', s) else s


def temizle_veri(v, anahtar=None):
    """JSON/form verisini özyinelemeli temizler."""
    if anahtar and str(anahtar).lower() in _ATLA_ANAHTAR:
        return v
    if isinstance(v, str):
        return temizle_metin(v)
    if isinstance(v, list):
        return [temizle_veri(x) for x in v]
    if isinstance(v, dict):
        return {k: temizle_veri(x, k) for k, x in v.items()}
    return v


def guvenli_url(url):
    """Yalnızca http/https adreslerine izin verir; aksi halde boş döner."""
    if not isinstance(url, str):
        return ''
    url = url.strip()
    if not url:
        return ''
    if '://' not in url and re.match(r'^[a-zA-Z][a-zA-Z0-9+.\-]*:', url) and not re.match(r'^[\w.\-]+:\d+', url):
        return ''  # javascript:, data:, vbscript: vb.
    p = urlparse(url if '://' in url else 'https://' + url)
    if p.scheme not in ('http', 'https') or not p.netloc:
        return ''
    if re.search(r'[\s<>"\'`]', url):
        return ''
    return url if '://' in url else 'https://' + url


def like_kacis(s):
    """LIKE için \\, % ve _ karakterlerini kaçırır (escape='\\\\' ile birlikte kullanılır)."""
    return str(s).replace('\\', '\\\\').replace('%', '\\%').replace('_', '\\_')


def icerir(sutun, aranan):
    """sutun.ilike('%aranan%') — joker karakterleri kaçırılmış güvenli karşılığı."""
    return sutun.ilike(f'%{like_kacis(aranan)}%', escape='\\')


def baslar(sutun, aranan):
    return sutun.ilike(f'{like_kacis(aranan)}%', escape='\\')


def arama_temizle(s, azami=100):
    """Arama kutusu girdisi: temizle, kontrol karakterlerini at, uzunluğu sınırla."""
    return temizle_metin((s or '')).strip()[:azami]


def kur(app):
    """Flask uygulamasına gelen JSON/form girdisini temizleyen before_request ekler."""
    from flask import request

    _URL_ANAHTAR = {'website', 'web_sitesi', 'link_url', 'resim_url'}

    def _url_duzelt(v):
        if isinstance(v, dict):
            return {k: (guvenli_url(x) if str(k) in _URL_ANAHTAR and isinstance(x, str) else _url_duzelt(x))
                    for k, x in v.items()}
        if isinstance(v, list):
            return [_url_duzelt(x) for x in v]
        return v

    @app.before_request
    def _sorgu_temizle():
        # Arama/filtre parametreleri (?arama=<script>... ) — GET dahil tüm istekler
        if not request.args:
            return
        from werkzeug.datastructures import ImmutableMultiDict
        temiz = []
        for k, v in request.args.items(multi=True):
            if k.lower() not in _ATLA_ANAHTAR:
                v = temizle_metin(v)[:200]
            if k in ('limit', 'sayfa_boyutu'):
                try:
                    v = str(max(1, min(int(v), 100)))
                except ValueError:
                    pass
            temiz.append((k, v))
        request.__dict__['args'] = ImmutableMultiDict(temiz)

    @app.before_request
    def _girdi_temizle():
        if request.method not in ('POST', 'PUT', 'PATCH', 'DELETE'):
            return
        # Ödeme sağlayıcısı geri çağrıları imzalıdır, değiştirilmemeli
        if request.path.startswith('/api/odeme/cardplus/') and request.mimetype == 'application/x-www-form-urlencoded':
            return
        if request.mimetype == 'application/json':
            veri = request.get_json(silent=True)
            if veri is not None:
                veri = temizle_veri(_url_duzelt(veri))
                request._cached_json = (veri, veri)
        elif request.mimetype in ('application/x-www-form-urlencoded', 'multipart/form-data'):
            from werkzeug.datastructures import ImmutableMultiDict
            temiz = [(k, temizle_veri(v, k) if k.lower() not in _URL_ANAHTAR else guvenli_url(v))
                     for k, v in request.form.items(multi=True)]
            request.__dict__['form'] = ImmutableMultiDict(temiz)
