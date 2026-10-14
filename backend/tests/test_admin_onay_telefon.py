"""Admin onayı: TELEFON_DOGRULAMA_ZORUNLU açıkken doğrulanmamış usta onaylanamaz.
Çalıştırma:  cd backend && python -m unittest tests.test_admin_onay_telefon -v
"""
import os
import sys
import unittest
from datetime import datetime
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask  # noqa: E402

from models import Kullanici, Usta, db  # noqa: E402
from routes.admin import _telefon_dogrulanmadi  # noqa: E402

TEL = '0533 123 45 67'


class AdminOnayTelefonTest(unittest.TestCase):
    def setUp(self):
        app = Flask(__name__)
        app.config.update(SQLALCHEMY_DATABASE_URI='sqlite:///:memory:', SECRET_KEY='t',
                          SQLALCHEMY_TRACK_MODIFICATIONS=False)
        db.init_app(app)
        self.ctx = app.app_context()
        self.ctx.push()
        db.create_all()
        self.k = Kullanici(email='u@test.com', rol='usta')
        self.k.sifre_set('sifre12345')
        db.session.add(self.k)
        db.session.flush()
        self.u = Usta(kullanici_id=self.k.id, ad='Test', telefon=TEL, kategori_id=1, sehir_id=1)
        db.session.add(self.u)
        db.session.commit()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def test_bayrak_kapaliyken_engel_yok(self):
        with mock.patch.dict(os.environ, {'TELEFON_DOGRULAMA_ZORUNLU': ''}):
            self.assertFalse(_telefon_dogrulanmadi(self.u))

    def test_bayrak_acik_dogrulanmamis_engellenir(self):
        with mock.patch.dict(os.environ, {'TELEFON_DOGRULAMA_ZORUNLU': 'true'}):
            self.assertTrue(_telefon_dogrulanmadi(self.u))

    def test_bayrak_acik_dogrulanmis_gecer(self):
        self.k.telefon_dogrulanan = '+905331234567'
        self.k.telefon_dogrulama_tarihi = datetime.utcnow()
        db.session.commit()
        with mock.patch.dict(os.environ, {'TELEFON_DOGRULAMA_ZORUNLU': 'true'}):
            self.assertFalse(_telefon_dogrulanmadi(self.u))

    def test_numara_degisirse_dogrulama_gecersiz(self):
        self.k.telefon_dogrulanan = '+905331234567'
        self.u.telefon = '0542 765 43 21'
        db.session.commit()
        with mock.patch.dict(os.environ, {'TELEFON_DOGRULAMA_ZORUNLU': 'true'}):
            self.assertTrue(_telefon_dogrulanmadi(self.u))

    def test_hesabi_olmayan_profil_etkilenmez(self):
        self.u.kullanici_id = None
        db.session.commit()
        with mock.patch.dict(os.environ, {'TELEFON_DOGRULAMA_ZORUNLU': 'true'}):
            self.assertFalse(_telefon_dogrulanmadi(self.u))


if __name__ == '__main__':
    unittest.main()
