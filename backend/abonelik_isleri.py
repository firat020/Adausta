"""Abonelik süre sonu işleri (app.py'den bağımsız: test edilebilir)."""
from datetime import datetime

from models import db


def abonelik_kontrol():
    """Süresi dolmuş abonelikleri pasife al.
    Otomatik yenilemesi açık olanlar hariç — onları cardplus_otomatik_yenile.py (günlük
    çalışan ayrı cron) birkaç günlük dunning penceresiyle yönetir; burada erken 'askida'
    yapılırsa deneme/abonelik süresi biter bitmez otomatik tahsilat denenmeden plan düşer."""
    from models import Abonelik, Usta
    simdi = datetime.utcnow()
    bitis_gecmis = Abonelik.query.filter(
        Abonelik.durum == 'aktif',
        Abonelik.bitis != None,
        Abonelik.bitis < simdi,
        Abonelik.otomatik_yenileme == False,
        Abonelik.duraklatildi_mi != True,  # duraklatılmış abonelikte sayaç durur, otomatik pasife alınmaz
    ).all()
    kapananlar = []
    for a in bitis_gecmis:
        a.durum = 'askida'
        usta = Usta.query.get(a.usta_id)
        if usta:
            usta.plan = 'ucretsiz'
            if a.deneme_mi:
                kapananlar.append(usta)  # kartsız deneme bitti + ödeme yok: hesap kapandı (profil yayından kalkar)
    if bitis_gecmis:
        db.session.commit()
    for usta in kapananlar:
        hesap_kapandi_bildir(usta)


def hesap_kapandi_bildir(usta):
    """Deneme bitip hesap kapanınca ustaya BİR kez SMS + push gönderir."""
    from models import FCMToken, BildirimGecmisi
    if not usta.kullanici_id:
        return
    if BildirimGecmisi.query.filter_by(kullanici_id=usta.kullanici_id, tur='hesap_kapandi').first():
        return
    baslik = 'Hesabiniz Kapatildi'
    icerik = ('Ucretsiz deneme sureniz bitti ve odeme alinmadigi icin hesabiniz kapatildi, profiliniz yayindan kaldirildi. '
              'Kredi kartiyla odeme yaparak hesabinizi aninda yeniden acabilirsiniz.')
    gecmis = BildirimGecmisi(kullanici_id=usta.kullanici_id, baslik=baslik, icerik=icerik, tur='hesap_kapandi', gonderildi=False)
    db.session.add(gecmis)
    tokenlar = [t.token for t in FCMToken.query.filter_by(kullanici_id=usta.kullanici_id, aktif=True).all()]
    if tokenlar:
        from fcm import toplu_bildirim_gonder
        sonuc = toplu_bildirim_gonder(tokenlar, baslik, icerik, {'ekran': 'abonelik'})
        gecmis.gonderildi = sonuc['basarili'] > 0
    if usta.telefon:
        from sms import sms_gonder
        if sms_gonder(usta.telefon, f'Ada Usta - {baslik}: {icerik} adausta.com/usta/panel/abonelik'):
            gecmis.gonderildi = True
    db.session.commit()
