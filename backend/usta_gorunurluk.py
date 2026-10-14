"""Herkese açık listelerden gizlenecek usta profilleri (tek tanım noktası).

Gizli sayılanlar:
- Profilini kendisi duraklatanlar (aktif abonelik + duraklatildi_mi)
- Kartsız deneme süresi dolup ödeme yapmayanlar (abonelik 'askida' + deneme_mi):
  hesap kapatılmış sayılır, ödeme gelince _aktiflestir_abonelik aboneliği tekrar 'aktif' yapar.
"""
from sqlalchemy import and_, or_

from models import Abonelik, db


def gizli_usta_idleri():
    """Alt sorgu: gizlenecek Usta.id değerleri (Usta.id.in_(...) ile kullanılır)."""
    ucretli_aktif = db.session.query(Abonelik.usta_id).filter(
        Abonelik.durum == 'aktif', Abonelik.duraklatildi_mi != True  # noqa: E712
    )
    return db.session.query(Abonelik.usta_id).filter(or_(
        and_(Abonelik.durum == 'aktif', Abonelik.duraklatildi_mi == True),  # noqa: E712
        and_(Abonelik.durum == 'askida', Abonelik.deneme_mi == True,  # noqa: E712
             ~Abonelik.usta_id.in_(ucretli_aktif)),
    ))


def usta_gizli_mi(usta_id) -> bool:
    return db.session.query(gizli_usta_idleri().filter(Abonelik.usta_id == usta_id).exists()).scalar()
