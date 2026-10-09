"""Öne çıkarma ürünleri ve usta referans (davet) bonusu iş mantığı.

Ödeme altyapısına (CardPlus) dokunmaz; sadece ödeme başarılı olduktan sonra çağrılır.
"""
import hashlib
from datetime import datetime, timedelta
from flask import current_app
from models import db, Usta, Abonelik, Odeme, PromosyonSatis, Referans

# Fiyatlar USD (abonelik planlarıyla aynı mantık: tahsilatta günlük kurla TL'ye çevrilir)
PROMO_FIYATLARI = {
    'profil': {7: 5.0, 14: 9.0, 30: 15.0},    # arama sonuçlarında öncelikli sıralama
    'hizmet': {7: 4.0, 14: 7.0, 30: 12.0},    # seçilen hizmet kategorisinde öncelik (hizmet başına)
    'vitrin': {7: 12.0, 14: 20.0, 30: 30.0},  # ana sayfada "Öne Çıkan Ustalar"
}
PROMO_ACIKLAMA = {
    'profil': 'Profilini öne çıkar',
    'hizmet': 'Hizmetini öne çıkar',
    'vitrin': 'Ana sayfa vitrini',
}
REFERANS_BONUS_GUN = 15


# ── Referans kodu ─────────────────────────────────────────────────────────
def _imza(usta_id: int) -> str:
    gizli = str(current_app.config.get('SECRET_KEY', 'adausta'))
    return hashlib.sha256(f'ref:{usta_id}:{gizli}'.encode()).hexdigest()[:3].upper()


def referans_kodu(usta_id: int) -> str:
    """Ustaya özel, tahmin edilmesi zor kısa kod: ADA + base36(id) + 3 haneli imza."""
    n, taban, harfler = usta_id, 36, '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    govde = ''
    while n:
        n, r = divmod(n, taban)
        govde = harfler[r] + govde
    return f'ADA{govde or "0"}{_imza(usta_id)}'


def referans_kodu_coz(kod: str):
    """Geçerli koddan usta_id döner; geçersizse None."""
    kod = (kod or '').strip().upper()
    if not kod.startswith('ADA') or len(kod) < 7:
        return None
    govde, imza = kod[3:-3], kod[-3:]
    try:
        usta_id = int(govde, 36)
    except ValueError:
        return None
    return usta_id if usta_id > 0 and imza == _imza(usta_id) else None


def referans_kaydet(davet_edilen: Usta, kod: str):
    """Kayıt sırasında çağrılır. Geçersiz kod / kendini davet / mükerrer sessizce yok sayılır."""
    davet_eden_id = referans_kodu_coz(kod)
    if not davet_eden_id or davet_eden_id == davet_edilen.id:
        return None
    if not Usta.query.get(davet_eden_id):
        return None
    if Referans.query.filter_by(davet_edilen_id=davet_edilen.id).first():
        return None
    r = Referans(davet_eden_id=davet_eden_id, davet_edilen_id=davet_edilen.id)
    db.session.add(r)
    return r


def _ucretli_odeme_var(usta_id: int) -> bool:
    return db.session.query(Odeme.id).filter(
        Odeme.usta_id == usta_id, Odeme.durum == 'basarili',
        Odeme.payment_source == 'subscription',
    ).first() is not None


def _bonus_gun_ekle(usta: Usta, gun: int):
    """Aktif aboneliği gun kadar uzatır; abonelik bitmişse bugünden başlatır."""
    simdi = datetime.utcnow()
    ab = Abonelik.query.filter_by(usta_id=usta.id).order_by(Abonelik.id.desc()).first()
    if not ab:
        return
    temel = ab.bitis if (ab.bitis and ab.bitis > simdi and ab.durum == 'aktif') else simdi
    ab.bitis = temel + timedelta(days=gun)
    ab.yenileme_tarihi = ab.bitis
    ab.durum = 'aktif'
    usta.plan_bitis = ab.bitis
    ek = usta.ekstra()
    usta.ekstra_guncelle(bonus_gun_toplam=int(ek.get('bonus_gun_toplam', 0)) + gun)


def referans_odul_kontrol(usta: Usta):
    """Bir ustanın abonelik ödemesi başarılı olunca çağrılır. İki taraf da ücretli abone
    olmuşsa (kim önce olduğu fark etmez) ikisine REFERANS_BONUS_GUN gün verilir. Tek seferlik."""
    kayitlar = Referans.query.filter(
        Referans.durum == 'bekliyor',
        (Referans.davet_edilen_id == usta.id) | (Referans.davet_eden_id == usta.id),
    ).all()
    for r in kayitlar:
        if _ucretli_odeme_var(r.davet_eden_id) and _ucretli_odeme_var(r.davet_edilen_id):
            for u in (r.davet_eden, r.davet_edilen):
                if u:
                    _bonus_gun_ekle(u, REFERANS_BONUS_GUN)
            r.durum = 'hak_kazandi'
            r.bonus_gun = REFERANS_BONUS_GUN
            r.hak_tarihi = datetime.utcnow()


# ── Öne çıkarma ürünleri ─────────────────────────────────────────────────
def promosyon_gecerli_mi(usta: Usta, tur: str, sure_gun: int, kategori_id):
    """(ok, hata_mesajı) — satın alma isteğini doğrular."""
    if tur not in PROMO_FIYATLARI:
        return False, 'Geçersiz ürün'
    if sure_gun not in PROMO_FIYATLARI[tur]:
        return False, 'Geçersiz süre'
    if not usta.onaylanmis or not usta.aktif:
        return False, 'Profiliniz yayında olmadığı için öne çıkarma satın alınamaz'
    if tur == 'hizmet':
        izinli = {usta.kategori_id} | {k.id for k in usta.ek_kategoriler}
        if not kategori_id or kategori_id not in izinli:
            return False, 'Bu hizmet profilinizde yok'
    return True, None


def promosyon_aktif_et(satis: PromosyonSatis):
    """Ödeme başarılı olunca çağrılır. Süre, mevcut bitişin üstüne eklenir (çifte ödeme kaybolmaz)."""
    usta = Usta.query.get(satis.usta_id)
    if not usta or satis.durum == 'aktif':
        return
    simdi = datetime.utcnow()
    ek = usta.ekstra()
    if satis.tur == 'profil':
        anahtar, onceki = 'one_cikma_bitis', ek.get('one_cikma_bitis')
    elif satis.tur == 'vitrin':
        anahtar, onceki = 'vitrin_bitis', ek.get('vitrin_bitis')
    else:
        anahtar, onceki = None, (ek.get('hizmet_one_cikma') or {}).get(str(satis.kategori_id))
    temel = simdi
    if Usta._gelecekte(onceki):
        temel = datetime.fromisoformat(onceki)
    bitis = temel + timedelta(days=satis.sure_gun)
    if anahtar:
        usta.ekstra_guncelle(**{anahtar: bitis.isoformat()})
    else:
        hizmetler = dict(ek.get('hizmet_one_cikma') or {})
        hizmetler[str(satis.kategori_id)] = bitis.isoformat()
        usta.ekstra_guncelle(hizmet_one_cikma=hizmetler)
    satis.durum = 'aktif'
    satis.baslangic = simdi
    satis.bitis = bitis
