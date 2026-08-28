"""
CardPlus Merchant Safe — otomatik abonelik yenileme (günlük cron/scheduled task).

Süresi dolan/dolmak üzere olan, otomatik_yenileme=True olan abonelikleri bulur,
saklı SafeKey ile 3D Secure'suz sunucu-sunucu tahsilat dener (Payten doküman
madde 5: Type=Auth, Number=SafeKey). Başarılıysa aboneliği uzatır, başarısız
olursa birkaç gün arayla tekrar dener (dunning), üçüncü başarısızlıkta abonelik
ücretsiz plana düşer ve otomatik yenileme kapanır.

Çalıştır: python cardplus_otomatik_yenile.py
Önerilen: sunucuda günlük çalışan bir cron/systemd timer (ör. her gün 06:00 UTC).

!!! HENÜZ CANLIDA TEST EDİLMEDİ !!!
Durum (12.08.2026):
  1. CARDPLUS_API_USERNAME / CARDPLUS_API_PASSWORD artık .env'de tanımlı (panelde yeni
     oluşturulan "EUPHRATES" API kullanıcısı — eskisi silinmişti/hiç yoktu, yeniden
     oluşturuldu: api_user + Safekey Ön Provizyon + Order Check,PostAuth,Refund rolleriyle).
  2. CARDPLUS_API_URL_TEST / CARDPLUS_API_URL_PROD artık .env'de tanımlı — Payten'den
     teyit edildi (OP-425363, 11.08.2026): .../fim/api.
  3. SafeKey ile Type=Auth isteğinin gerçek response formatı (ProcReturnCode/Response alan
     adları) doküman örneğine göre yazıldı, TEST ortamında gerçek bir SafeKey ile hiç
     denenmedi — bu hâlâ doğrulanmadı.
Bu scripti cron'a bağlamadan önce TEST ortamında, gerçek bir kayıtlı SafeKey ile elle
bir kere denenip response formatı doğrulanmalı.
"""
import os
import uuid
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta

import requests as _requests

from app import app, db
from models import Usta, Abonelik, Odeme
from routes.odeme_cardplus import (
    CARDPLUS_MODE, CLIENT_ID, API_URL, API_USERNAME, API_PASSWORD,
    CURRENCY_CODES,
)
from routes.odeme import _usd_try_kur

MAKS_DENEME = 3          # toplam kaç kez denenecek (ilk deneme + 2 tekrar)
TEKRAR_ARALIGI_GUN = 2   # başarısız denemeler arası kaç gün beklenecek


def _xml_kacir(v: str) -> str:
    return (str(v)
            .replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;'))


def _safekey_ile_tahsilat(safekey: str, tutar: float) -> dict:
    """Server-to-server CC5Request (Type=Auth, Number=SafeKey) gönderir.
    Dönüş: {'basarili': bool, 'trans_id': str, 'hata': str}"""
    xml_body = f"""<?xml version="1.0" encoding="UTF-8"?>
<CC5Request>
<Name>{_xml_kacir(API_USERNAME)}</Name>
<Password>{_xml_kacir(API_PASSWORD)}</Password>
<ClientId>{_xml_kacir(CLIENT_ID)}</ClientId>
<Type>Auth</Type>
<Number>{_xml_kacir(safekey)}</Number>
<Total>{tutar:.2f}</Total>
<Currency>{CURRENCY_CODES['TRY']}</Currency>
</CC5Request>"""

    resp = _requests.post(
        API_URL, data=xml_body.encode('utf-8'),
        headers={'Content-Type': 'text/xml; charset=utf-8'}, timeout=30,
    )
    root = ET.fromstring(resp.text)

    def _bul(tag):
        el = root.find(tag)
        return el.text if el is not None and el.text else ''

    proc_code = _bul('ProcReturnCode')
    response  = _bul('Response')
    basarili  = proc_code == '00' and response == 'Approved'
    return {
        'basarili': basarili,
        'trans_id': _bul('TransId') or _bul('HostRefNum'),
        'hata': _bul('ErrMsg') if not basarili else '',
    }


def _bildirim_gonder(usta: Usta, baslik: str, icerik: str):
    """FCM push + BildirimGecmisi log. Başarısız olursa ana akışı bozmasın."""
    try:
        from models import FCMToken, BildirimGecmisi
        import fcm
        gonderildi = False
        if usta.kullanici_id:
            for t in FCMToken.query.filter_by(kullanici_id=usta.kullanici_id, aktif=True).all():
                if fcm.bildirim_gonder(t.token, baslik, icerik):
                    gonderildi = True
        db.session.add(BildirimGecmisi(
            kullanici_id=usta.kullanici_id, baslik=baslik, icerik=icerik,
            tur='uyelik_uyari', gonderildi=gonderildi,
        ))
    except Exception as e:
        print(f'  [uyari] bildirim gonderilemedi (usta {usta.id}): {e}')


def _yenile(ab: Abonelik):
    usta = ab.usta
    if not usta or not usta.cardplus_safekey:
        print(f'  [atlandi] abonelik {ab.id}: usta veya safekey yok')
        return

    plan = ab.plan
    tutar_usd = plan.fiyat if plan else 0
    kur = _usd_try_kur()
    tutar = round(tutar_usd * kur, 2)

    print(f'  usta {usta.id} ({usta.ad} {usta.soyad}) — {tutar} TRY deneniyor (deneme #{ab.basarisiz_deneme_sayisi + 1})...')

    try:
        sonuc = _safekey_ile_tahsilat(usta.cardplus_safekey, tutar)
    except Exception as e:
        sonuc = {'basarili': False, 'trans_id': '', 'hata': f'İstek hatası: {e}'}

    order_id = 'CPR' + uuid.uuid4().hex[:16].upper()
    odeme = Odeme(
        usta_id=usta.id,
        abonelik_id=ab.id,
        tutar=float(tutar),
        para_birimi='TRY',
        siparis_no=order_id,
        aciklama=f'CardPlus otomatik yenileme — ${tutar_usd} x {kur} TRY kuru',
        otomatik_tahsilat=True,
    )

    ab.son_deneme_tarihi = datetime.utcnow()

    if sonuc['basarili']:
        odeme.durum = 'basarili'
        odeme.provider_transaction_id = sonuc['trans_id']
        odeme.paid_at = datetime.utcnow()
        db.session.add(odeme)

        ek_gun = plan.sure_gun() if plan else 30
        yeni_bitis = max(ab.bitis or datetime.utcnow(), datetime.utcnow()) + timedelta(days=ek_gun)
        ab.bitis = yeni_bitis
        ab.yenileme_tarihi = yeni_bitis
        ab.basarisiz_deneme_sayisi = 0
        usta.plan_bitis = yeni_bitis

        print(f'    basarili, yeni bitis: {yeni_bitis:%Y-%m-%d}')
        _bildirim_gonder(usta, 'Aboneliğiniz yenilendi',
                          f'{plan.ad if plan else "Aboneliğiniz"} otomatik olarak yenilendi, teşekkür ederiz.')
    else:
        odeme.durum = 'basarisiz'
        odeme.error_message = sonuc['hata']
        db.session.add(odeme)

        ab.basarisiz_deneme_sayisi += 1
        print(f'    basarisiz: {sonuc["hata"]} (deneme {ab.basarisiz_deneme_sayisi}/{MAKS_DENEME})')

        if ab.basarisiz_deneme_sayisi >= MAKS_DENEME:
            ab.durum = 'askida'
            ab.otomatik_yenileme = False
            usta.plan = 'ucretsiz'
            print(f'    otomatik yenileme kapatildi, usta ucretsiz plana dustu')
            _bildirim_gonder(usta, 'Otomatik ödeme başarısız',
                              'Kayıtlı kartınızdan tahsilat yapılamadı, aboneliğiniz ücretsiz plana düştü. '
                              'Lütfen panelinizden kartınızı güncelleyip yeniden abone olun.')
        else:
            _bildirim_gonder(usta, 'Otomatik ödeme başarısız',
                              f'Kayıtlı kartınızdan tahsilat yapılamadı, {TEKRAR_ARALIGI_GUN} gün içinde tekrar denenecek.')


def calistir():
    if not API_USERNAME or not API_PASSWORD:
        print('CARDPLUS_API_USERNAME / CARDPLUS_API_PASSWORD .env\'de tanımlı değil — script durduruldu.')
        print('(Payten panelinde oluşturulan "API Kullanıcısı" şifresi gerekiyor, bkz. dosya başındaki not.)')
        return
    if not API_URL:
        print('CARDPLUS_API_URL_TEST/PROD .env\'de tanımlı değil — script durduruldu.')
        return

    simdi = datetime.utcnow()
    print(f'CardPlus otomatik yenileme — mod: {CARDPLUS_MODE}, zaman: {simdi.isoformat()}')

    yeni_donem = Abonelik.query.filter(
        Abonelik.durum == 'aktif',
        Abonelik.otomatik_yenileme.is_(True),
        Abonelik.basarisiz_deneme_sayisi == 0,
        Abonelik.bitis <= simdi,
    ).all()

    tekrar_denemesi = Abonelik.query.filter(
        Abonelik.durum == 'aktif',
        Abonelik.otomatik_yenileme.is_(True),
        Abonelik.basarisiz_deneme_sayisi > 0,
        Abonelik.basarisiz_deneme_sayisi < MAKS_DENEME,
        Abonelik.son_deneme_tarihi <= simdi - timedelta(days=TEKRAR_ARALIGI_GUN),
    ).all()

    adaylar = yeni_donem + tekrar_denemesi
    print(f'{len(adaylar)} abonelik islenecek ({len(yeni_donem)} yeni donem, {len(tekrar_denemesi)} tekrar deneme)')

    for ab in adaylar:
        _yenile(ab)
        db.session.commit()

    print('Tamamlandı.')


if __name__ == '__main__':
    with app.app_context():
        calistir()
