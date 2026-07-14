from flask import Blueprint, request, jsonify, session
from models import (db, SellerReview, MagazaSiparis, MagazaSiparisKalemi,
                    MarketplaceStore, Urun, StoreMember, Kullanici)
from datetime import datetime
import sqlalchemy as sa

satici_yorum_bp = Blueprint('satici_yorum', __name__)


# ── helpers ─────────────────────────────────────────────────────────────────

def satici_store_id():
    kid = session.get('kullanici_id')
    if not kid:
        return None
    m = StoreMember.query.filter_by(kullanici_id=kid, aktif=True).first()
    return m.store_id if m else None


def _update_store_rating(store_id):
    """Recalculate and persist avg puan + yorum_sayisi for a store."""
    rows = db.session.execute(
        sa.select(sa.func.avg(SellerReview.puan), sa.func.count(SellerReview.id))
        .where(
            SellerReview.store_id == store_id,
            SellerReview.moderasyon == 'approved',
        )
    ).one()
    avg_puan, count = rows
    store = MarketplaceStore.query.get(store_id)
    if store:
        store.puan = round(float(avg_puan), 2) if avg_puan else 0.0
        store.yorum_sayisi = count or 0


# ── 1. POST /urun/<uid> ──────────────────────────────────────────────────────

@satici_yorum_bp.route('/urun/<int:uid>', methods=['POST'])
def urun_yorum_ekle(uid):
    kid = session.get('kullanici_id')
    if not kid:
        return jsonify({'hata': 'Giriş yapmalısınız'}), 401

    kullanici = Kullanici.query.get(kid)
    if not kullanici:
        return jsonify({'hata': 'Kullanıcı bulunamadı'}), 404

    data = request.get_json(silent=True) or {}
    puan = data.get('puan')
    yorum = data.get('yorum', '')
    siparis_no = data.get('siparis_no')

    if not siparis_no:
        return jsonify({'hata': 'siparis_no zorunludur'}), 400

    if not isinstance(puan, int) or puan < 1 or puan > 5:
        return jsonify({'hata': 'puan 1-5 arasında olmalıdır'}), 400

    # Verify purchase: order belongs to this user and contains the product
    siparis = MagazaSiparis.query.filter_by(
        siparis_no=siparis_no,
        odeme_durumu='odendi',
    ).filter(
        sa.or_(
            MagazaSiparis.misafir_email == kullanici.email,
            MagazaSiparis.kullanici_id == kid,
        )
    ).first()

    if not siparis:
        return jsonify({'hata': 'Doğrulanmış sipariş bulunamadı'}), 403

    kalemi = MagazaSiparisKalemi.query.filter_by(
        siparis_id=siparis.id,
        urun_id=uid,
    ).first()
    if not kalemi:
        return jsonify({'hata': 'Bu siparişte ilgili ürün bulunamadı'}), 403

    # No duplicate review for same siparis + urun
    existing = SellerReview.query.filter_by(
        siparis_id=siparis.id,
        urun_id=uid,
    ).first()
    if existing:
        return jsonify({'hata': 'Bu sipariş için ürün yorumu zaten yapılmış'}), 409

    urun = Urun.query.get(uid)
    if not urun:
        return jsonify({'hata': 'Ürün bulunamadı'}), 404

    store_id = urun.store_id
    if not store_id:
        return jsonify({'hata': 'Ürünün mağazası bulunamadı'}), 400

    review = SellerReview(
        siparis_id=siparis.id,
        store_id=store_id,
        urun_id=uid,
        musteri_ad=f'{kullanici.ad} {kullanici.soyad}'.strip() or kullanici.email,
        puan=puan,
        yorum=yorum,
        dogrulandi=True,
        moderasyon='approved',
    )
    db.session.add(review)
    db.session.flush()  # get review.id before commit
    _update_store_rating(store_id)
    db.session.commit()

    return jsonify(review.to_dict()), 201


# ── 2. POST /satici/<store_id> ───────────────────────────────────────────────

@satici_yorum_bp.route('/satici/<int:store_id>', methods=['POST'])
def satici_yorum_ekle(store_id):
    kid = session.get('kullanici_id')
    if not kid:
        return jsonify({'hata': 'Giriş yapmalısınız'}), 401

    kullanici = Kullanici.query.get(kid)
    if not kullanici:
        return jsonify({'hata': 'Kullanıcı bulunamadı'}), 404

    data = request.get_json(silent=True) or {}
    puan = data.get('puan')
    yorum = data.get('yorum', '')
    siparis_no = data.get('siparis_no')

    if not siparis_no:
        return jsonify({'hata': 'siparis_no zorunludur'}), 400

    if not isinstance(puan, int) or puan < 1 or puan > 5:
        return jsonify({'hata': 'puan 1-5 arasında olmalıdır'}), 400

    # Verify purchase from this store
    siparis = MagazaSiparis.query.filter_by(
        siparis_no=siparis_no,
        odeme_durumu='odendi',
    ).filter(
        sa.or_(
            MagazaSiparis.misafir_email == kullanici.email,
            MagazaSiparis.kullanici_id == kid,
        )
    ).first()

    if not siparis:
        return jsonify({'hata': 'Doğrulanmış sipariş bulunamadı'}), 403

    # At least one item in the order must belong to this store
    store_item = (
        db.session.query(MagazaSiparisKalemi)
        .join(Urun, MagazaSiparisKalemi.urun_id == Urun.id)
        .filter(
            MagazaSiparisKalemi.siparis_id == siparis.id,
            Urun.store_id == store_id,
        )
        .first()
    )
    if not store_item:
        return jsonify({'hata': 'Bu mağazadan satın alım doğrulanamadı'}), 403

    # No duplicate store-level review for same siparis
    existing = SellerReview.query.filter_by(
        siparis_id=siparis.id,
        store_id=store_id,
        urun_id=None,
    ).first()
    if existing:
        return jsonify({'hata': 'Bu sipariş için mağaza yorumu zaten yapılmış'}), 409

    store = MarketplaceStore.query.get(store_id)
    if not store:
        return jsonify({'hata': 'Mağaza bulunamadı'}), 404

    review = SellerReview(
        siparis_id=siparis.id,
        store_id=store_id,
        urun_id=None,
        musteri_ad=f'{kullanici.ad} {kullanici.soyad}'.strip() or kullanici.email,
        puan=puan,
        yorum=yorum,
        dogrulandi=True,
        moderasyon='approved',
    )
    db.session.add(review)
    db.session.flush()
    _update_store_rating(store_id)
    db.session.commit()

    return jsonify(review.to_dict()), 201


# ── 3. GET /urun/<uid>/yorumlar ──────────────────────────────────────────────

@satici_yorum_bp.route('/urun/<int:uid>/yorumlar', methods=['GET'])
def urun_yorumlari(uid):
    sayfa = max(1, request.args.get('sayfa', 1, type=int))
    limit = 10
    offset = (sayfa - 1) * limit

    q = SellerReview.query.filter_by(
        urun_id=uid,
        moderasyon='approved',
    )
    toplam = q.count()
    yorumlar = q.order_by(SellerReview.olusturma.desc()).offset(offset).limit(limit).all()

    avg_row = db.session.execute(
        sa.select(sa.func.avg(SellerReview.puan))
        .where(
            SellerReview.urun_id == uid,
            SellerReview.moderasyon == 'approved',
        )
    ).scalar()

    return jsonify({
        'yorumlar': [y.to_dict() for y in yorumlar],
        'ortalama_puan': round(float(avg_row), 2) if avg_row else 0.0,
        'toplam': toplam,
        'sayfa': sayfa,
    })


# ── 4. GET /satici/<store_id>/yorumlar ───────────────────────────────────────

@satici_yorum_bp.route('/satici/<int:store_id>/yorumlar', methods=['GET'])
def satici_yorumlari(store_id):
    sayfa = max(1, request.args.get('sayfa', 1, type=int))
    limit = 10
    offset = (sayfa - 1) * limit

    q = SellerReview.query.filter_by(
        store_id=store_id,
        urun_id=None,
        moderasyon='approved',
    )
    toplam = q.count()
    yorumlar = q.order_by(SellerReview.olusturma.desc()).offset(offset).limit(limit).all()

    avg_row = db.session.execute(
        sa.select(sa.func.avg(SellerReview.puan))
        .where(
            SellerReview.store_id == store_id,
            SellerReview.urun_id == None,
            SellerReview.moderasyon == 'approved',
        )
    ).scalar()

    return jsonify({
        'yorumlar': [y.to_dict() for y in yorumlar],
        'ortalama_puan': round(float(avg_row), 2) if avg_row else 0.0,
        'toplam': toplam,
        'sayfa': sayfa,
    })


# ── 5. POST /<yid>/satici-cevap ──────────────────────────────────────────────

@satici_yorum_bp.route('/<int:yid>/satici-cevap', methods=['POST'])
def satici_cevap_ekle(yid):
    sid = satici_store_id()
    if not sid:
        return jsonify({'hata': 'Satıcı girişi gereklidir'}), 401

    review = SellerReview.query.get(yid)
    if not review:
        return jsonify({'hata': 'Yorum bulunamadı'}), 404

    if review.store_id != sid:
        return jsonify({'hata': 'Bu yoruma cevap verme yetkiniz yok'}), 403

    data = request.get_json(silent=True) or {}
    cevap = data.get('satici_cevabi', '').strip()
    if len(cevap) < 5:
        return jsonify({'hata': 'Cevap en az 5 karakter olmalıdır'}), 400

    review.satici_cevabi = cevap
    db.session.commit()

    return jsonify(review.to_dict())


# ── 6. POST /admin/<yid>/moderasyon ─────────────────────────────────────────

@satici_yorum_bp.route('/admin/<int:yid>/moderasyon', methods=['POST'])
def admin_moderasyon(yid):
    kid = session.get('kullanici_id')
    if not kid:
        return jsonify({'hata': 'Giriş yapmalısınız'}), 401

    kullanici = Kullanici.query.get(kid)
    if not kullanici or kullanici.rol != 'admin':
        return jsonify({'hata': 'Admin yetkisi gereklidir'}), 403

    review = SellerReview.query.get(yid)
    if not review:
        return jsonify({'hata': 'Yorum bulunamadı'}), 404

    data = request.get_json(silent=True) or {}
    moderasyon = data.get('moderasyon')
    if moderasyon not in ('approved', 'rejected'):
        return jsonify({'hata': "moderasyon 'approved' veya 'rejected' olmalıdır"}), 400

    review.moderasyon = moderasyon
    _update_store_rating(review.store_id)
    db.session.commit()

    return jsonify({'ok': True})
