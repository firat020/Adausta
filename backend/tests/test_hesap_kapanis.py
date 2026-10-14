"""90 gün deneme sonrası hesap kapanışı: profil gizlenir, ödeme gelince açılır, mesaj bir kez gider.
Çalıştırma:  cd backend && python -m unittest tests.test_hesap_kapanis -v
"""
import os
import sys
import unittest
from datetime import datetime, timedelta
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask  # noqa: E402

import abonelik_isleri  # noqa: E402
from models import Abonelik, BildirimGecmisi, Kullanici, Plan, Usta, db  # noqa: E402
from usta_gorunurluk import gizli_usta_idleri, usta_gizli_mi  # noqa: E402


class HesapKapanisTest(unittest.TestCase):
    def setUp(self):
        app = Flask(__name__)
        app.config.update(SQLALCHEMY_DATABASE_URI='sqlite:///:memory:', SECRET_KEY='t',
                          SQLALCHEMY_TRACK_MODIFICATIONS=False)
        db.init_app(app)
        self.ctx = app.app_context()
        self.ctx.push()
        db.create_all()
        self.plan = Plan(ad='Aylik', fiyat=9.99, sure_tip='aylik', aktif=True)
        db.session.add(self.plan)
        db.session.commit()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def usta(self, ad, hesapli=True):
        kid = None
        if hesapli:
            k = Kullanici(email=f'{ad}@t.com', rol='usta')
            k.sifre_set('sifre12345')
            db.session.add(k)
            db.session.flush()
            kid = k.id
        u = Usta(kullanici_id=kid, ad=ad, telefon='0533 123 45 67', kategori_id=1, sehir_id=1,
                 onaylanmis=True, aktif=True, plan='aylik')
        db.session.add(u)
        db.session.flush()
        return u

    def abonelik(self, u, **kw):
        a = Abonelik(usta_id=u.id, plan_id=self.plan.id, **kw)
        db.session.add(a)
        db.session.commit()
        return a

    def test_suresi_dolan_deneme_gizlenir_aktif_deneme_gorunur(self):
        bitmis = self.usta('bitmis')
        self.abonelik(bitmis, durum='askida', deneme_mi=True, bitis=datetime.utcnow() - timedelta(days=1))
        suren = self.usta('suren')
        self.abonelik(suren, durum='aktif', deneme_mi=True, bitis=datetime.utcnow() + timedelta(days=30))
        seed = self.usta('seed', hesapli=False)  # aboneliği hiç olmayan eski/seed profil
        db.session.commit()
        self.assertTrue(usta_gizli_mi(bitmis.id))
        self.assertFalse(usta_gizli_mi(suren.id))
        self.assertFalse(usta_gizli_mi(seed.id))

    def test_duraklatilan_gizli_kalir(self):
        u = self.usta('dur')
        self.abonelik(u, durum='aktif', duraklatildi_mi=True)
        self.assertTrue(usta_gizli_mi(u.id))

    def test_odeme_sonrasi_tekrar_gorunur(self):
        u = self.usta('odeyen')
        a = self.abonelik(u, durum='askida', deneme_mi=True, bitis=datetime.utcnow() - timedelta(days=2))
        self.assertTrue(usta_gizli_mi(u.id))
        # _aktiflestir_abonelik ile aynı dönüşüm
        a.durum, a.deneme_mi, a.bitis = 'aktif', False, datetime.utcnow() + timedelta(days=30)
        db.session.commit()
        self.assertFalse(usta_gizli_mi(u.id))
        self.assertNotIn(u.id, [r[0] for r in gizli_usta_idleri().all()])

    def test_abonelik_kontrol_kapatir_ve_bir_kez_mesaj_gonderir(self):
        u = self.usta('kapanan')
        self.abonelik(u, durum='aktif', deneme_mi=True, otomatik_yenileme=False,
                      bitis=datetime.utcnow() - timedelta(hours=1))
        with mock.patch('sms.sms_gonder', return_value=True) as sms:
            abonelik_isleri.abonelik_kontrol()
            abonelik_isleri.abonelik_kontrol()  # ikinci çalışmada tekrar mesaj gitmemeli
        db.session.expire_all()
        self.assertEqual(Usta.query.get(u.id).plan, 'ucretsiz')
        self.assertEqual(Abonelik.query.filter_by(usta_id=u.id).first().durum, 'askida')
        self.assertTrue(usta_gizli_mi(u.id))
        self.assertEqual(sms.call_count, 1)
        self.assertIn('kapatildi', sms.call_args[0][1])
        self.assertEqual(BildirimGecmisi.query.filter_by(kullanici_id=u.kullanici_id, tur='hesap_kapandi').count(), 1)

    def test_suresi_dolmayan_etkilenmez(self):
        u = self.usta('devam')
        self.abonelik(u, durum='aktif', deneme_mi=True, bitis=datetime.utcnow() + timedelta(days=5))
        with mock.patch('sms.sms_gonder', return_value=True) as sms:
            abonelik_isleri.abonelik_kontrol()
        self.assertEqual(sms.call_count, 0)
        self.assertFalse(usta_gizli_mi(u.id))

    def test_otomatik_yenilemeli_usta_kapatilmaz(self):
        u = self.usta('kartli')
        self.abonelik(u, durum='aktif', deneme_mi=True, otomatik_yenileme=True,
                      bitis=datetime.utcnow() - timedelta(hours=1))
        with mock.patch('sms.sms_gonder', return_value=True) as sms:
            abonelik_isleri.abonelik_kontrol()
        self.assertEqual(sms.call_count, 0)
        self.assertFalse(usta_gizli_mi(u.id))


if __name__ == '__main__':
    unittest.main()
