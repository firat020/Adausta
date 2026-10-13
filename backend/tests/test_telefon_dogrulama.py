"""Twilio Verify telefon doğrulaması testleri. Twilio'ya GERÇEK istek atılmaz (hepsi mock).
Çalıştırma:  cd backend && python -m unittest tests.test_telefon_dogrulama -v
"""
import io
import json
import logging
import os
import sys
import unittest
import urllib.error
from datetime import datetime, timedelta
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask  # noqa: E402

import twilio_verify  # noqa: E402
from models import Kullanici, TelefonDogrulamaIstegi, db  # noqa: E402
from phone_utils import TelefonHatasi, e164_yap, numara_eslesiyor  # noqa: E402
from routes.telefon_dogrulama import telefon_dogrulama_bp  # noqa: E402

SAHTE_ENV = {
    'TWILIO_ACCOUNT_SID': 'ACtest0000000000000000000000000000',
    'TWILIO_AUTH_TOKEN': 'sahte-token-degeri',
    'TWILIO_VERIFY_SERVICE_SID': 'VAtest0000000000000000000000000000',
}
TEL_A = '0533 123 45 67'   # kullanıcı A profil telefonu
TEL_B = '0542 765 43 21'
E_A = '+905331234567'
URL = '/api/telefon-dogrulama'


def uygulama_olustur():
    app = Flask(__name__)
    app.config.update(SQLALCHEMY_DATABASE_URI='sqlite:///:memory:', SECRET_KEY='test', TESTING=True,
                      SQLALCHEMY_TRACK_MODIFICATIONS=False)
    db.init_app(app)
    app.register_blueprint(telefon_dogrulama_bp, url_prefix=URL)
    with app.app_context():
        db.create_all()
    return app


class TabanTest(unittest.TestCase):
    def setUp(self):
        self.app = uygulama_olustur()
        self.ctx = self.app.app_context()
        self.ctx.push()
        self.env = mock.patch.dict(os.environ, SAHTE_ENV)
        self.env.start()
        self.gonder_mock = mock.patch('twilio_verify.kod_gonder', return_value='pending').start()
        self.kontrol_mock = mock.patch('twilio_verify.kod_kontrol', return_value='approved').start()
        self.a = self._kullanici('a@test.com', TEL_A)
        self.b = self._kullanici('b@test.com', TEL_B)
        self.ca = self._istemci(self.a.id)
        self.cb = self._istemci(self.b.id)

    def tearDown(self):
        mock.patch.stopall()
        self.env.stop()
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def _kullanici(self, email, tel):
        k = Kullanici(email=email, sifre_hash='x', rol='musteri', telefon=tel)
        db.session.add(k)
        db.session.commit()
        return k

    def _istemci(self, kid):
        c = self.app.test_client()
        with c.session_transaction() as s:
            s['kullanici_id'] = kid
            s['rol'] = 'musteri'
        return c

    def post(self, c, yol, **veri):
        return c.post(f'{URL}/{yol}', json=veri)

    def gecmise_al(self, saniye):
        """Tüm kayıtları saniye kadar geçmişe taşır (bekleme/süre testleri için)."""
        for r in TelefonDogrulamaIstegi.query.all():
            r.olusturma = r.olusturma - timedelta(seconds=saniye)
        db.session.commit()

    def yenile(self, k):
        db.session.expire_all()
        return Kullanici.query.get(k.id)


class GonderimTest(TabanTest):
    def test_sms_gonderimi(self):
        r = self.post(self.ca, 'gonder', telefon=TEL_A, ulke='KKTC', kanal='sms')
        self.assertEqual(r.status_code, 200, r.get_json())
        self.gonder_mock.assert_called_once_with(E_A, 'sms', 'tr')
        self.assertEqual(r.get_json()['bekleme_sn'], 60)
        self.assertNotIn('5331234567', json.dumps(r.get_json()))  # tam numara yanıtta yok

    def test_whatsapp_gonderimi(self):
        r = self.post(self.ca, 'gonder', telefon=TEL_A, ulke='TR', kanal='whatsapp')
        self.assertEqual(r.status_code, 200)
        self.gonder_mock.assert_called_once_with(E_A, 'whatsapp', 'tr')

    def test_varsayilan_kanal_sms(self):
        self.post(self.ca, 'gonder', telefon=TEL_A, ulke='TR')
        self.gonder_mock.assert_called_once_with(E_A, 'sms', 'tr')

    def test_giris_gerekli(self):
        r = self.app.test_client().post(f'{URL}/gonder', json={'telefon': TEL_A, 'ulke': 'TR'})
        self.assertEqual(r.status_code, 401)

    def test_gecersiz_kanal_ve_amac(self):
        self.assertEqual(self.post(self.ca, 'gonder', telefon=TEL_A, ulke='TR', kanal='call').status_code, 400)
        self.assertEqual(self.post(self.ca, 'gonder', telefon=TEL_A, ulke='TR', amac='x').status_code, 400)

    def test_ayarlar_ulkeler_ve_kanallar(self):
        d = self.app.test_client().get(f'{URL}/ayarlar').get_json()
        self.assertTrue(d['yapilandirildi'])
        self.assertEqual(d['kanallar'], ['sms', 'whatsapp'])
        self.assertEqual(d['varsayilan_kanal'], 'sms')
        self.assertIn('KKTC', [u['kod'] for u in d['ulkeler']])


class KodDogrulamaTest(TabanTest):
    def _gonder(self, c=None):
        r = self.post(c or self.ca, 'gonder', telefon=TEL_A, ulke='KKTC', kanal='sms')
        self.assertEqual(r.status_code, 200, r.get_json())

    def test_dogru_kod(self):
        self._gonder()
        r = self.post(self.ca, 'dogrula', kod='123456')
        self.assertEqual(r.status_code, 200, r.get_json())
        self.kontrol_mock.assert_called_once_with(E_A, '123456')
        a = self.yenile(self.a)
        self.assertEqual(a.telefon_dogrulanan, E_A)
        self.assertIsNotNone(a.telefon_dogrulama_tarihi)
        self.assertTrue(a.to_dict()['telefon_dogrulandi'])

    def test_yanlis_kod(self):
        self.kontrol_mock.return_value = 'pending'
        self._gonder()
        r = self.post(self.ca, 'dogrula', kod='000000')
        self.assertEqual(r.status_code, 400)
        self.assertEqual(r.get_json()['kod'], 'kod_hatali')
        self.assertEqual(r.get_json()['kalan_hak'], 4)
        self.assertFalse(self.yenile(self.a).telefon_dogrulandi_mi())

    def test_kod_deneme_siniri(self):
        self.kontrol_mock.return_value = 'pending'
        self._gonder()
        for _ in range(5):
            self.assertEqual(self.post(self.ca, 'dogrula', kod='000000').status_code, 400)
        r = self.post(self.ca, 'dogrula', kod='123456')   # 6. deneme doğru kod olsa bile reddedilir
        self.assertEqual(r.status_code, 429)
        self.assertEqual(self.kontrol_mock.call_count, 5)
        self.assertFalse(self.yenile(self.a).telefon_dogrulandi_mi())

    def test_suresi_dolmus_kod_yerel(self):
        self._gonder()
        self.gecmise_al(11 * 60)
        r = self.post(self.ca, 'dogrula', kod='123456')
        self.assertEqual(r.status_code, 400)
        self.assertEqual(r.get_json()['kod'], 'suresi_doldu')
        self.kontrol_mock.assert_not_called()

    def test_suresi_dolmus_kod_twilio_404(self):
        self.kontrol_mock.side_effect = twilio_verify.VerifyHatasi(http=404, kod=20404)
        self._gonder()
        r = self.post(self.ca, 'dogrula', kod='123456')
        self.assertEqual(r.status_code, 400)
        self.assertEqual(r.get_json()['kod'], 'suresi_doldu')
        self.assertFalse(self.yenile(self.a).telefon_dogrulandi_mi())

    def test_istemci_dogrulandi_iddiasi_yok_sayilir(self):
        r = self.post(self.ca, 'dogrula', kod='123456', dogrulandi=True, telefon=TEL_A)
        self.assertEqual(r.status_code, 400)
        self.assertFalse(self.yenile(self.a).telefon_dogrulandi_mi())

    def test_kod_bicimi(self):
        self._gonder()
        for kotu in ('abcdef', '12', '', '12 34 56', '1' * 11):
            self.assertEqual(self.post(self.ca, 'dogrula', kod=kotu).status_code, 400, kotu)
        self.kontrol_mock.assert_not_called()


class SahiplikTest(TabanTest):
    def test_baska_kullanici_baskasinin_istegini_kullanamaz(self):
        self.post(self.ca, 'gonder', telefon=TEL_A, ulke='KKTC')
        r = self.post(self.cb, 'dogrula', kod='123456')   # B'nin kendi isteği yok
        self.assertEqual(r.status_code, 400)
        self.assertEqual(r.get_json()['kod'], 'istek_yok')
        self.kontrol_mock.assert_not_called()
        self.assertFalse(self.yenile(self.b).telefon_dogrulandi_mi())

    def test_baska_numara_icin_dogrulama_baslatilamaz(self):
        r = self.post(self.ca, 'gonder', telefon=TEL_B, ulke='KKTC')   # A, B'nin numarasını deniyor
        self.assertEqual(r.status_code, 400)
        self.assertEqual(r.get_json()['kod'], 'numara_eslesmiyor')
        self.gonder_mock.assert_not_called()

    def test_telefon_degisince_eski_dogrulama_gecersiz(self):
        self.post(self.ca, 'gonder', telefon=TEL_A, ulke='KKTC')
        self.post(self.ca, 'dogrula', kod='123456')
        self.assertTrue(self.yenile(self.a).telefon_dogrulandi_mi())
        a = self.yenile(self.a)
        a.telefon = TEL_B           # numara değişti
        db.session.commit()
        a = self.yenile(self.a)
        self.assertFalse(a.telefon_dogrulandi_mi())
        self.assertFalse(a.to_dict()['telefon_dogrulandi'])
        self.assertIsNone(a.to_dict()['telefon_dogrulama_tarihi'])

    def test_gonderim_ile_dogrulama_arasinda_numara_degisirse_onaylanmaz(self):
        self.post(self.ca, 'gonder', telefon=TEL_A, ulke='KKTC')
        a = self.yenile(self.a)
        a.telefon = TEL_B
        db.session.commit()
        r = self.post(self.ca, 'dogrula', kod='123456')
        self.assertEqual(r.status_code, 409)
        self.assertFalse(self.yenile(self.a).telefon_dogrulandi_mi())

    def test_tamamlanmis_dogrulama_tekrar_kullanilamaz(self):
        self.post(self.ca, 'gonder', telefon=TEL_A, ulke='KKTC')
        self.assertEqual(self.post(self.ca, 'dogrula', kod='123456').status_code, 200)
        r = self.post(self.ca, 'dogrula', kod='123456')
        self.assertEqual(r.status_code, 400)
        self.assertEqual(self.kontrol_mock.call_count, 1)

    def test_dogrulanmis_numara_icin_tekrar_gonderilmez(self):
        self.post(self.ca, 'gonder', telefon=TEL_A, ulke='KKTC')
        self.post(self.ca, 'dogrula', kod='123456')
        self.gonder_mock.reset_mock()
        r = self.post(self.ca, 'gonder', telefon=TEL_A, ulke='KKTC')
        self.assertTrue(r.get_json().get('zaten_dogrulandi'))
        self.gonder_mock.assert_not_called()

    def test_yeni_istek_eskisini_gecersiz_kilar(self):
        self.post(self.ca, 'gonder', telefon=TEL_A, ulke='KKTC', kanal='sms')
        self.gecmise_al(61)
        self.post(self.ca, 'gonder', telefon=TEL_A, ulke='KKTC', kanal='whatsapp')
        durumlar = [r.durum for r in TelefonDogrulamaIstegi.query.order_by(TelefonDogrulamaIstegi.id)]
        self.assertEqual(durumlar, ['iptal', 'bekliyor'])

    def test_profilde_telefon_olmayan_musteri_numarayi_dogrulayinca_profile_yazilir(self):
        k = self._kullanici('c@test.com', '')
        c = self._istemci(k.id)
        self.post(c, 'gonder', telefon='0533 999 88 77', ulke='TR')
        self.assertEqual(self.post(c, 'dogrula', kod='123456').status_code, 200)
        k = self.yenile(k)
        self.assertEqual(k.telefon, '+905339998877')
        self.assertTrue(k.telefon_dogrulandi_mi())


class SinirTest(TabanTest):
    def test_bekleme_suresi(self):
        self.assertEqual(self.post(self.ca, 'gonder', telefon=TEL_A, ulke='KKTC').status_code, 200)
        r = self.post(self.ca, 'gonder', telefon=TEL_A, ulke='KKTC')
        self.assertEqual(r.status_code, 429)
        self.assertGreater(r.get_json()['bekleme_sn'], 0)
        self.assertIn('Retry-After', r.headers)
        self.assertEqual(self.gonder_mock.call_count, 1)

    def test_kanal_degistirerek_bekleme_asilamaz(self):
        self.post(self.ca, 'gonder', telefon=TEL_A, ulke='KKTC', kanal='sms')
        r = self.post(self.ca, 'gonder', telefon=TEL_A, ulke='KKTC', kanal='whatsapp')
        self.assertEqual(r.status_code, 429)
        self.assertEqual(self.gonder_mock.call_count, 1)

    def test_bekleme_sonrasi_tekrar_gonderilir(self):
        self.post(self.ca, 'gonder', telefon=TEL_A, ulke='KKTC')
        self.gecmise_al(61)
        self.assertEqual(self.post(self.ca, 'gonder', telefon=TEL_A, ulke='KKTC', kanal='whatsapp').status_code, 200)

    def test_telefon_saatlik_siniri_kanallar_ortak(self):
        for kanal in ['sms', 'whatsapp', 'sms', 'whatsapp', 'sms']:
            self.gecmise_al(61)
            self.assertEqual(self.post(self.ca, 'gonder', telefon=TEL_A, ulke='KKTC', kanal=kanal).status_code, 200)
        self.gecmise_al(61)
        r = self.post(self.ca, 'gonder', telefon=TEL_A, ulke='KKTC', kanal='whatsapp')   # 6. istek
        self.assertEqual(r.status_code, 429)
        self.assertEqual(self.gonder_mock.call_count, 5)

    def test_ip_siniri(self):
        for i in range(10):
            db.session.add(TelefonDogrulamaIstegi(
                kullanici_id=self.b.id, amac='profil', telefon_e164=f'+90533000{i:04d}',
                kanal='sms', durum='iptal', ip='1.2.3.4', olusturma=datetime.utcnow() - timedelta(minutes=5)))
        db.session.commit()
        r = self.ca.post(f'{URL}/gonder', json={'telefon': TEL_A, 'ulke': 'KKTC'},
                         environ_overrides={'REMOTE_ADDR': '1.2.3.4'})
        self.assertEqual(r.status_code, 429)
        self.gonder_mock.assert_not_called()

    def test_ip_siniri_baska_ip_etkilenmez(self):
        r = self.ca.post(f'{URL}/gonder', json={'telefon': TEL_A, 'ulke': 'KKTC'},
                         environ_overrides={'REMOTE_ADDR': '9.9.9.9'})
        self.assertEqual(r.status_code, 200)

    def test_proxy_arkasinda_gercek_ip_kullanilir(self):
        for i in range(10):
            db.session.add(TelefonDogrulamaIstegi(
                kullanici_id=self.b.id, amac='profil', telefon_e164=f'+90533000{i:04d}',
                kanal='sms', durum='iptal', ip='5.6.7.8', olusturma=datetime.utcnow() - timedelta(minutes=5)))
        db.session.commit()
        r = self.ca.post(f'{URL}/gonder', json={'telefon': TEL_A, 'ulke': 'KKTC'},
                         headers={'X-Forwarded-For': '5.6.7.8'}, environ_overrides={'REMOTE_ADDR': '127.0.0.1'})
        self.assertEqual(r.status_code, 429)

    def test_disaridan_gelen_xff_sahte_ip_icin_kullanilmaz(self):
        # doğrudan internetten gelen istek (loopback değil): X-Forwarded-For yok sayılır
        r = self.ca.post(f'{URL}/gonder', json={'telefon': TEL_A, 'ulke': 'KKTC'},
                         headers={'X-Forwarded-For': '5.6.7.8'}, environ_overrides={'REMOTE_ADDR': '203.0.113.9'})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(TelefonDogrulamaIstegi.query.first().ip, '203.0.113.9')

    def test_kullanici_saatlik_siniri(self):
        for i in range(8):
            db.session.add(TelefonDogrulamaIstegi(
                kullanici_id=self.a.id, amac='profil', telefon_e164=f'+90533111{i:04d}',
                kanal='sms', durum='hata', ip=f'8.8.8.{i}', olusturma=datetime.utcnow() - timedelta(minutes=30)))
        db.session.commit()
        self.assertEqual(self.post(self.ca, 'gonder', telefon=TEL_A, ulke='KKTC').status_code, 429)

    def test_sinirlar_veritabanindan_hesaplanir_yeni_istemci_de_etkilenir(self):
        self.post(self.ca, 'gonder', telefon=TEL_A, ulke='KKTC')
        c2 = self._istemci(self.a.id)   # yeni oturum/istemci: sınır bellekte değil DB'de
        self.assertEqual(self.post(c2, 'gonder', telefon=TEL_A, ulke='KKTC').status_code, 429)


class HataTest(TabanTest):
    def test_twilio_gonderim_hatasi_basari_sayilmaz(self):
        self.gonder_mock.side_effect = twilio_verify.VerifyHatasi(http=500, kod=None)
        r = self.post(self.ca, 'gonder', telefon=TEL_A, ulke='KKTC', kanal='sms')
        self.assertEqual(r.status_code, 502)
        self.assertEqual(r.get_json()['diger_kanal'], 'whatsapp')   # kullanıcı diğer kanalı kendisi seçer
        self.assertEqual(self.gonder_mock.call_count, 1)             # otomatik ikinci kanal denenmez
        self.assertEqual(TelefonDogrulamaIstegi.query.first().durum, 'hata')

    def test_hata_sonrasi_bekleme_beklenmeden_diger_kanal(self):
        self.gonder_mock.side_effect = [twilio_verify.VerifyHatasi(http=500), 'pending']
        self.post(self.ca, 'gonder', telefon=TEL_A, ulke='KKTC', kanal='sms')
        r = self.post(self.ca, 'gonder', telefon=TEL_A, ulke='KKTC', kanal='whatsapp')
        self.assertEqual(r.status_code, 200)

    def test_twilio_sms_alamayan_numara_whatsapp_onerilir(self):
        self.gonder_mock.side_effect = twilio_verify.VerifyHatasi(http=400, kod=60205)
        r = self.post(self.ca, 'gonder', telefon=TEL_A, ulke='KKTC', kanal='sms')
        self.assertEqual(r.get_json()['diger_kanal'], 'whatsapp')

    def test_twilio_hiz_siniri_429(self):
        self.gonder_mock.side_effect = twilio_verify.VerifyHatasi(http=429, kod=60203)
        self.assertEqual(self.post(self.ca, 'gonder', telefon=TEL_A, ulke='KKTC').status_code, 429)

    def test_twilio_kontrol_hatasi_dogrulamayi_onaylamaz(self):
        self.post(self.ca, 'gonder', telefon=TEL_A, ulke='KKTC')
        self.kontrol_mock.side_effect = twilio_verify.VerifyHatasi(http=500)
        r = self.post(self.ca, 'dogrula', kod='123456')
        self.assertEqual(r.status_code, 502)
        self.assertFalse(self.yenile(self.a).telefon_dogrulandi_mi())

    def test_approved_disindaki_durumlar_onaylamaz(self):
        for durum in ('pending', 'canceled', 'expired', 'max_attempts_reached', 'failed', 'deleted', 'bilinmeyen', ''):
            with self.subTest(durum=durum):
                TelefonDogrulamaIstegi.query.delete()
                db.session.commit()
                self.kontrol_mock.return_value = durum
                self.post(self.ca, 'gonder', telefon=TEL_A, ulke='KKTC')
                r = self.post(self.ca, 'dogrula', kod='123456')
                self.assertEqual(r.status_code, 400)
                self.assertFalse(self.yenile(self.a).telefon_dogrulandi_mi())

    def test_eksik_yapilandirma(self):
        for k in SAHTE_ENV:
            os.environ.pop(k, None)
        self.assertEqual(sorted(twilio_verify.eksik_degiskenler()), sorted(SAHTE_ENV))
        r = self.post(self.ca, 'gonder', telefon=TEL_A, ulke='KKTC')
        self.assertEqual(r.status_code, 503)
        self.assertEqual(r.get_json()['kod'], 'yapilandirilmadi')
        self.assertEqual(self.post(self.ca, 'dogrula', kod='123456').status_code, 503)
        self.assertFalse(self.app.test_client().get(f'{URL}/ayarlar').get_json()['yapilandirildi'])
        self.gonder_mock.assert_not_called()

    def test_eksik_tek_degisken_adi_bildirilir(self):
        os.environ.pop('TWILIO_VERIFY_SERVICE_SID', None)
        self.assertEqual(twilio_verify.eksik_degiskenler(), ['TWILIO_VERIFY_SERVICE_SID'])
        with self.assertRaises(twilio_verify.VerifyYapilandirmaHatasi) as ctx:
            twilio_verify._istek('Verifications', {})
        self.assertEqual(ctx.exception.eksik, ['TWILIO_VERIFY_SERVICE_SID'])
        self.assertNotIn(SAHTE_ENV['TWILIO_AUTH_TOKEN'], str(ctx.exception))


class TwilioIstemciTest(unittest.TestCase):
    """twilio_verify HTTP katmanı (urlopen mock): doğru URL/alanlar, From yok, token sızmaz."""

    def setUp(self):
        mock.patch.dict(os.environ, SAHTE_ENV).start()
        mock.patch('twilio_verify.urllib.request.urlopen').start()

    def tearDown(self):
        mock.patch.stopall()

    def _yanit(self, govde):
        cm = mock.MagicMock()
        cm.__enter__.return_value.read.return_value = json.dumps(govde).encode()
        twilio_verify.urllib.request.urlopen.return_value = cm

    def test_sms_istegi_alanlari(self):
        self._yanit({'status': 'pending'})
        self.assertEqual(twilio_verify.kod_gonder('+905331234567', 'sms', 'tr'), 'pending')
        req = twilio_verify.urllib.request.urlopen.call_args[0][0]
        self.assertEqual(req.full_url, 'https://verify.twilio.com/v2/Services/VAtest0000000000000000000000000000/Verifications')
        govde = req.data.decode()
        self.assertIn('Channel=sms', govde)
        self.assertIn('Locale=tr', govde)
        self.assertIn('To=%2B905331234567', govde)
        self.assertNotIn('From', govde)   # satın alınmış numara zorunlu değil

    def test_whatsapp_istegi_kanali(self):
        self._yanit({'status': 'pending'})
        twilio_verify.kod_gonder('+905331234567', 'whatsapp')
        self.assertIn('Channel=whatsapp', twilio_verify.urllib.request.urlopen.call_args[0][0].data.decode())

    def test_gecersiz_kanal(self):
        with self.assertRaises(ValueError):
            twilio_verify.kod_gonder('+905331234567', 'call')

    def test_kontrol_istegi(self):
        self._yanit({'status': 'approved', 'valid': True})
        self.assertEqual(twilio_verify.kod_kontrol('+905331234567', '123456'), 'approved')
        req = twilio_verify.urllib.request.urlopen.call_args[0][0]
        self.assertTrue(req.full_url.endswith('/VerificationCheck'))
        self.assertIn('Code=123456', req.data.decode())

    def test_http_hatasinda_telefon_ve_token_sizmaz(self):
        govde = io.BytesIO(json.dumps({'code': 60200, 'message': 'Invalid +905331234567'}).encode())
        twilio_verify.urllib.request.urlopen.side_effect = urllib.error.HTTPError('u', 400, 'bad', {}, govde)
        with self.assertRaises(twilio_verify.VerifyHatasi) as ctx:
            twilio_verify.kod_gonder('+905331234567', 'sms')
        self.assertEqual((ctx.exception.http, ctx.exception.kod), (400, 60200))
        self.assertNotIn('5331234567', str(ctx.exception))
        self.assertNotIn(SAHTE_ENV['TWILIO_AUTH_TOKEN'], str(ctx.exception))

    def test_ag_hatasi(self):
        twilio_verify.urllib.request.urlopen.side_effect = urllib.error.URLError('down')
        with self.assertRaises(twilio_verify.VerifyHatasi) as ctx:
            twilio_verify.kod_kontrol('+905331234567', '123456')
        self.assertEqual(ctx.exception.http, 0)


class LogGizliligiTest(TabanTest):
    def test_loglarda_numara_kod_token_yok(self):
        self.gonder_mock.side_effect = twilio_verify.VerifyHatasi(http=500, kod=123)
        with self.assertLogs(level=logging.WARNING) as kayit:
            self.post(self.ca, 'gonder', telefon=TEL_A, ulke='KKTC')
        metin = '\n'.join(kayit.output)
        self.assertNotIn('5331234567', metin)
        self.assertNotIn(SAHTE_ENV['TWILIO_AUTH_TOKEN'], metin)


class TelefonBicimiTest(unittest.TestCase):
    def test_tr_kktc(self):
        for ham in ('0533 123 45 67', '533 123 45 67', '+90 533 123 45 67', '00905331234567', '905331234567', '(0533) 123-45-67'):
            self.assertEqual(e164_yap(ham, 'KKTC'), '+905331234567', ham)
            self.assertEqual(e164_yap(ham, 'TR'), '+905331234567', ham)

    def test_yabanci_numaraya_90_eklenmez(self):
        self.assertEqual(e164_yap('+49 151 23456789'), '+4915123456789')
        self.assertEqual(e164_yap('0151 23456789', 'DE'), '+4915123456789')
        self.assertEqual(e164_yap('+44 7700 900123', 'KKTC'), '+447700900123')   # + açıkça yazıldıysa seçili ülke ezilmez
        self.assertFalse(e164_yap('07700 900123', 'GB').startswith('+90'))

    def test_ulke_yoksa_yerel_numara_reddedilir(self):
        with self.assertRaises(TelefonHatasi):
            e164_yap('0533 123 45 67')
        with self.assertRaises(TelefonHatasi):
            e164_yap('533 123 45 67', 'XX')

    def test_gecersiz(self):
        for kotu in ('', '123', 'abc', '0392 228 00 00', '+90 12345', '+0123456789'):
            with self.assertRaises(TelefonHatasi, msg=kotu):
                e164_yap(kotu, 'TR')

    def test_eslesme(self):
        self.assertTrue(numara_eslesiyor('0533 123 45 67', '+905331234567'))
        self.assertTrue(numara_eslesiyor('+90 533 123 45 67', '+905331234567'))
        self.assertTrue(numara_eslesiyor('905331234567', '+905331234567'))
        self.assertFalse(numara_eslesiyor('0542 765 43 21', '+905331234567'))
        self.assertFalse(numara_eslesiyor('', '+905331234567'))
        self.assertTrue(numara_eslesiyor('0151 23456789', '+4915123456789'))


if __name__ == '__main__':
    unittest.main()
