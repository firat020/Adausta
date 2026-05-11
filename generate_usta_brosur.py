"""Ada Usta — Ustalar için tanitim brosuru PDF generator."""
import os
import sqlite3
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle,
    PageBreak, KeepTogether, HRFlowable
)

# ─── Font (Turkce karakter destegi) ────────────────────────────
FONT_REG = "C:/Windows/Fonts/arial.ttf"
FONT_BOLD = "C:/Windows/Fonts/arialbd.ttf"
pdfmetrics.registerFont(TTFont("Arial", FONT_REG))
pdfmetrics.registerFont(TTFont("Arial-Bold", FONT_BOLD))

LOGO = "C:/Adausta/frontend/public/ada-usta-logo.png"
DB = "C:/Adausta/backend/instance/adausta.db"
OUT = "C:/Users/PC/Desktop/AdaUsta_Usta_Brosur.pdf"

# ─── Renkler ───────────────────────────────────────────────────
MAVI = colors.HexColor("#1e3a8a")
MAVI_AC = colors.HexColor("#3b82f6")
TURUNCU = colors.HexColor("#ea580c")
YESIL = colors.HexColor("#16a34a")
GRI = colors.HexColor("#6b7280")
GRI_AC = colors.HexColor("#f3f4f6")

# ─── Stiller ───────────────────────────────────────────────────
styles = getSampleStyleSheet()
BASLIK = ParagraphStyle("baslik", parent=styles["Heading1"],
    fontName="Arial-Bold", fontSize=24, textColor=MAVI,
    alignment=TA_CENTER, spaceAfter=8)
ALT_BASLIK = ParagraphStyle("altbaslik", parent=styles["Heading2"],
    fontName="Arial-Bold", fontSize=15, textColor=MAVI,
    spaceBefore=12, spaceAfter=6,
    borderPadding=4, leftIndent=0)
BOLUM = ParagraphStyle("bolum", parent=styles["Heading3"],
    fontName="Arial-Bold", fontSize=12, textColor=TURUNCU,
    spaceBefore=8, spaceAfter=4)
METIN = ParagraphStyle("metin", parent=styles["Normal"],
    fontName="Arial", fontSize=10.5, textColor=colors.black,
    leading=15, alignment=TA_JUSTIFY, spaceAfter=6)
KUCUK = ParagraphStyle("kucuk", parent=styles["Normal"],
    fontName="Arial", fontSize=9, textColor=GRI, alignment=TA_CENTER)
VURGU = ParagraphStyle("vurgu", parent=styles["Normal"],
    fontName="Arial-Bold", fontSize=11, textColor=MAVI,
    leading=15, alignment=TA_CENTER)
FIYAT_BUYUK = ParagraphStyle("fiyat", parent=styles["Normal"],
    fontName="Arial-Bold", fontSize=28, textColor=MAVI,
    alignment=TA_CENTER, leading=32)
PLAN_BASLIK = ParagraphStyle("planb", parent=styles["Normal"],
    fontName="Arial-Bold", fontSize=14, textColor=colors.white,
    alignment=TA_CENTER)

# ─── DB'den kategorileri cek ───────────────────────────────────
def kategorileri_cek():
    con = sqlite3.connect(DB)
    cur = con.cursor()
    rows = cur.execute(
        "SELECT grup, ad FROM kategoriler WHERE aktif=1 ORDER BY grup, sira, ad"
    ).fetchall()
    con.close()
    gruplar = {}
    for grup, ad in rows:
        gruplar.setdefault(grup, []).append(ad)
    return gruplar

# ─── PDF olustur ───────────────────────────────────────────────
doc = SimpleDocTemplate(OUT, pagesize=A4,
    leftMargin=2*cm, rightMargin=2*cm,
    topMargin=1.5*cm, bottomMargin=1.5*cm,
    title="Ada Usta — Ustalar icin Bilgilendirme", author="Adissa Enterprises Ltd.")

story = []

# ═══ SAYFA 1: KAPAK ════════════════════════════════════════════
if os.path.exists(LOGO):
    img = Image(LOGO, width=8*cm, height=8*cm, kind="proportional")
    img.hAlign = "CENTER"
    story.append(Spacer(1, 1.5*cm))
    story.append(img)

story.append(Spacer(1, 0.5*cm))
story.append(Paragraph("ADA USTA", BASLIK))
story.append(Paragraph("KKTC Usta Bulma Platformu", VURGU))
story.append(Spacer(1, 0.3*cm))
story.append(HRFlowable(width="50%", thickness=2, color=TURUNCU, hAlign="CENTER"))
story.append(Spacer(1, 0.5*cm))
story.append(Paragraph("USTALAR ICIN BILGILENDIRME REHBERI", ParagraphStyle(
    "kapak2", fontName="Arial-Bold", fontSize=14, textColor=GRI,
    alignment=TA_CENTER)))
story.append(Spacer(1, 0.3*cm))
story.append(Paragraph(
    "Musteriye ulasmak, isini buyutmek ve KKTC'nin en kapsamli usta agina dahil olmak icin gereken her sey.",
    ParagraphStyle("aciklama", fontName="Arial", fontSize=11, textColor=colors.black,
        alignment=TA_CENTER, leading=16)))

story.append(Spacer(1, 2*cm))
story.append(Paragraph("Adissa Enterprises Ltd.", KUCUK))
story.append(Paragraph("www.adausta.com  ·  adausta@gmail.com  ·  +90 548 851 07 00", KUCUK))
story.append(PageBreak())

# ═══ SAYFA 2: ADA USTA NEDIR? ══════════════════════════════════
story.append(Paragraph("Ada Usta Nedir?", ALT_BASLIK))
story.append(HRFlowable(width="100%", thickness=1, color=MAVI_AC, spaceAfter=8))

story.append(Paragraph(
    "<b>Ada Usta</b>, Kuzey Kibris Turk Cumhuriyeti'nde ihtiyac sahibi musteriler ile "
    "alanlarinda uzman ustalari bulusturan dijital platformdur. Lefkosa, Girne, Gazimagusa, "
    "Guzelyurt ve Iskele dahil tum KKTC genelinde hizmet vermektedir.",
    METIN))

story.append(Paragraph(
    "Musteriler aradiklari hizmeti kategori, sehir veya konum bazinda bulur; ustalar ise "
    "ucretsiz veya ucretli planlarla profillerini olusturup is talebi alir. Platform, geleneksel "
    "agizdan agiza referans sistemini dijital ortama tasiyarak ustalara guvenilir bir musteri "
    "akisi saglar.",
    METIN))

story.append(Paragraph("Neden Ada Usta?", BOLUM))
avantajlar = [
    ["✓", "Yeni musterilere KKTC'nin her bolgesinden ulasin"],
    ["✓", "Profil sayfasi ile referanslarinizi sergileyin (foto, deneyim, yorumlar)"],
    ["✓", "Telefonsuz teklif sistemi — musteri direkt size yazsin"],
    ["✓", "GPS ile size en yakin musterilere ilk siz cikin"],
    ["✓", "WhatsApp ve dogrudan arama entegrasyonu"],
    ["✓", "Yorum & puanlama ile guvenilirlik insa edin"],
    ["✓", "Tek bir paneldan tum is taleplerinizi yonetin"],
    ["✓", "Aboneligi diledigniz zaman iptal edin, baglayici sozlesme yok"],
]
av_tablo = Table(avantajlar, colWidths=[0.8*cm, 15.2*cm])
av_tablo.setStyle(TableStyle([
    ("FONTNAME", (0,0), (-1,-1), "Arial"),
    ("FONTNAME", (0,0), (0,-1), "Arial-Bold"),
    ("FONTSIZE", (0,0), (-1,-1), 10.5),
    ("TEXTCOLOR", (0,0), (0,-1), YESIL),
    ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("TOPPADDING", (0,0), (-1,-1), 4),
    ("BOTTOMPADDING", (0,0), (-1,-1), 4),
]))
story.append(av_tablo)

story.append(Paragraph("Nasil Calisir?", BOLUM))
adimlar = [
    ["1", "<b>Kayit Ol:</b> Ad, telefon, kategori ve sehir bilgilerinizi girin."],
    ["2", "<b>Plan Sec:</b> Aylik veya yillik plan ile profilinizi aktif edin."],
    ["3", "<b>Profil Olustur:</b> Aciklama, fotograf, deneyim yili ekleyin."],
    ["4", "<b>Talep Al:</b> Musteriler size dogrudan teklif gonderir."],
    ["5", "<b>Is Yap:</b> Telefon/WhatsApp ile iletisime gecin, isi tamamlayin."],
    ["6", "<b>Yorum Topla:</b> Musteriler size puan verir, profiliniz buyur."],
]
ad_tablo = Table(adimlar, colWidths=[1*cm, 15*cm])
ad_tablo.setStyle(TableStyle([
    ("FONTNAME", (0,0), (-1,-1), "Arial"),
    ("FONTNAME", (0,0), (0,-1), "Arial-Bold"),
    ("FONTSIZE", (0,0), (0,-1), 14),
    ("FONTSIZE", (1,0), (1,-1), 10.5),
    ("TEXTCOLOR", (0,0), (0,-1), TURUNCU),
    ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("TOPPADDING", (0,0), (-1,-1), 5),
    ("BOTTOMPADDING", (0,0), (-1,-1), 5),
    ("LEFTPADDING", (0,0), (0,-1), 8),
]))
story.append(ad_tablo)
story.append(PageBreak())

# ═══ SAYFA 3: PLAN & FIYATLANDIRMA ═════════════════════════════
story.append(Paragraph("Plan ve Fiyatlandirma", ALT_BASLIK))
story.append(HRFlowable(width="100%", thickness=1, color=MAVI_AC, spaceAfter=8))

story.append(Paragraph(
    "Ada Usta'da iki abonelik plani sunulmaktadir. Tum fiyatlar USD ($) cinsindendir; "
    "odeme aninda gunluk Merkez Bankasi kuru ile TL'ye cevrilir.",
    METIN))

# Iki plan yan yana
aylik_icerik = [
    [Paragraph("AYLIK PLAN", PLAN_BASLIK)],
    [Paragraph("<b>$9.99</b>", FIYAT_BUYUK)],
    [Paragraph("/ ay", KUCUK)],
    [Spacer(1, 0.3*cm)],
    [Paragraph("Esnek aylik uyelik<br/>Istediginiz zaman iptal edin", ParagraphStyle(
        "p1", fontName="Arial", fontSize=10, alignment=TA_CENTER, textColor=GRI))],
    [Spacer(1, 0.3*cm)],
    [Paragraph("<b>✓</b> Profil sayfasi", ParagraphStyle(
        "po", fontName="Arial", fontSize=10, alignment=TA_LEFT, leftIndent=10))],
    [Paragraph("<b>✓</b> Musteri talepleri al", ParagraphStyle(
        "po", fontName="Arial", fontSize=10, alignment=TA_LEFT, leftIndent=10))],
    [Paragraph("<b>✓</b> Kategori listesi", ParagraphStyle(
        "po", fontName="Arial", fontSize=10, alignment=TA_LEFT, leftIndent=10))],
    [Paragraph("<b>✓</b> E-posta destegi", ParagraphStyle(
        "po", fontName="Arial", fontSize=10, alignment=TA_LEFT, leftIndent=10))],
]

yillik_icerik = [
    [Paragraph("YILLIK PLAN  ★ EN POPULER", PLAN_BASLIK)],
    [Paragraph("<b>$99</b>", FIYAT_BUYUK)],
    [Paragraph("/ yil  (ayda $7.61)", KUCUK)],
    [Spacer(1, 0.3*cm)],
    [Paragraph("13 ay kapsar — <b>1 AY HEDIYE</b><br/>Yillik $30 tasarruf", ParagraphStyle(
        "p2", fontName="Arial", fontSize=10, alignment=TA_CENTER, textColor=TURUNCU))],
    [Spacer(1, 0.3*cm)],
    [Paragraph("<b>✓</b> Profil sayfasi", ParagraphStyle(
        "po", fontName="Arial", fontSize=10, alignment=TA_LEFT, leftIndent=10))],
    [Paragraph("<b>✓</b> Musteri talepleri al", ParagraphStyle(
        "po", fontName="Arial", fontSize=10, alignment=TA_LEFT, leftIndent=10))],
    [Paragraph("<b>✓</b> Kategori listesi", ParagraphStyle(
        "po", fontName="Arial", fontSize=10, alignment=TA_LEFT, leftIndent=10))],
    [Paragraph("<b>✓</b> <b>Onecikan listeleme</b>", ParagraphStyle(
        "po", fontName="Arial-Bold", fontSize=10, alignment=TA_LEFT, leftIndent=10, textColor=TURUNCU))],
    [Paragraph("<b>✓</b> <b>7/24 oncelikli destek</b>", ParagraphStyle(
        "po", fontName="Arial-Bold", fontSize=10, alignment=TA_LEFT, leftIndent=10, textColor=TURUNCU))],
]

aylik_t = Table(aylik_icerik, colWidths=[7.5*cm])
aylik_t.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (0,0), MAVI),
    ("BOX", (0,0), (-1,-1), 1.5, MAVI),
    ("TOPPADDING", (0,0), (0,0), 10),
    ("BOTTOMPADDING", (0,0), (0,0), 10),
    ("LEFTPADDING", (0,1), (-1,-1), 12),
    ("RIGHTPADDING", (0,1), (-1,-1), 12),
]))
yillik_t = Table(yillik_icerik, colWidths=[7.5*cm])
yillik_t.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (0,0), TURUNCU),
    ("BOX", (0,0), (-1,-1), 2, TURUNCU),
    ("TOPPADDING", (0,0), (0,0), 10),
    ("BOTTOMPADDING", (0,0), (0,0), 10),
    ("LEFTPADDING", (0,1), (-1,-1), 12),
    ("RIGHTPADDING", (0,1), (-1,-1), 12),
]))

planlar_yanyana = Table([[aylik_t, yillik_t]], colWidths=[8*cm, 8*cm])
planlar_yanyana.setStyle(TableStyle([
    ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("LEFTPADDING", (0,0), (-1,-1), 0),
    ("RIGHTPADDING", (0,0), (-1,-1), 0),
]))
story.append(planlar_yanyana)

story.append(Spacer(1, 0.5*cm))
story.append(Paragraph("Odeme & Iade Kosullari", BOLUM))
story.append(Paragraph(
    "<b>Odeme yontemleri:</b> Tum banka kartlari ve kredi kartlari kabul edilir. Odemeler "
    "PCI-DSS sertifikali guvenli odeme altyapisi uzerinden alinir; kart bilgileriniz Ada Usta "
    "sunucularinda saklanmaz.",
    METIN))
story.append(Paragraph(
    "<b>Iade:</b> Odeme tarihinden itibaren 14 gun icinde iade talep edebilirsiniz; profiliniz "
    "hic yayina alinmadiysa tutar tam olarak iade edilir. Profil yayinlandiysa kullanilan gun "
    "sayisi orantili dusulur. Iadeler 5-10 is gunu icinde odemenin yapildigi karta yansir.",
    METIN))
story.append(Paragraph(
    "<b>Iptal:</b> Aylik plan istediginiz zaman iptal edilebilir; mevcut donem sonuna kadar "
    "hizmet devam eder. Yillik planda kalan donem icin orantili iade uygulanir.",
    METIN))
story.append(PageBreak())

# ═══ SAYFA 4-5: KATEGORILER ════════════════════════════════════
story.append(Paragraph("Hizmet Kategorileri", ALT_BASLIK))
story.append(HRFlowable(width="100%", thickness=1, color=MAVI_AC, spaceAfter=8))
story.append(Paragraph(
    "Ada Usta'da <b>13 ana grupta toplam 83 hizmet kategorisi</b> bulunmaktadir. "
    "Kendi uzmanlik alaninizi sectiginiz an, o kategoride is arayan tum musteriler size ulasabilir.",
    METIN))

gruplar = kategorileri_cek()
for grup, kategoriler in gruplar.items():
    kat_listesi = "  ·  ".join(kategoriler)
    blok = KeepTogether([
        Paragraph(f"<b>{grup}</b>  <font color='#6b7280' size='9'>({len(kategoriler)} kategori)</font>",
                  ParagraphStyle("g", fontName="Arial-Bold", fontSize=11,
                      textColor=TURUNCU, spaceBefore=6, spaceAfter=3)),
        Paragraph(kat_listesi, ParagraphStyle("kl", fontName="Arial", fontSize=9.5,
            textColor=colors.black, leading=14, leftIndent=8, spaceAfter=4)),
    ])
    story.append(blok)

story.append(PageBreak())

# ═══ SAYFA 6: HIZMET BOLGELERI & USTA PANELI ═══════════════════
story.append(Paragraph("Hizmet Bolgeleri", ALT_BASLIK))
story.append(HRFlowable(width="100%", thickness=1, color=MAVI_AC, spaceAfter=8))
story.append(Paragraph(
    "Ada Usta KKTC'nin tum sehirlerinde aktiftir. Profilinizi olustururken sehir ve ilce "
    "secimi yaparak, sadece kendi bolgenizdeki musterilere goruneceginizi belirleyebilirsiniz.",
    METIN))

bolge_tablo = Table([
    ["Sehir", "Hizmet Durumu"],
    ["Lefkosa", "✓ Aktif — Tum ilceler"],
    ["Girne", "✓ Aktif — Tum ilceler"],
    ["Gazimagusa", "✓ Aktif — Tum ilceler"],
    ["Guzelyurt", "✓ Aktif — Tum ilceler"],
    ["Iskele", "✓ Aktif — Tum ilceler"],
], colWidths=[6*cm, 10*cm])
bolge_tablo.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), MAVI),
    ("TEXTCOLOR", (0,0), (-1,0), colors.white),
    ("FONTNAME", (0,0), (-1,0), "Arial-Bold"),
    ("FONTNAME", (0,1), (-1,-1), "Arial"),
    ("FONTSIZE", (0,0), (-1,-1), 10.5),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, GRI_AC]),
    ("GRID", (0,0), (-1,-1), 0.5, colors.lightgrey),
    ("LEFTPADDING", (0,0), (-1,-1), 10),
    ("TOPPADDING", (0,0), (-1,-1), 6),
    ("BOTTOMPADDING", (0,0), (-1,-1), 6),
    ("TEXTCOLOR", (1,1), (1,-1), YESIL),
]))
story.append(bolge_tablo)

story.append(Paragraph("Usta Paneli — Neler Yapabilirsiniz?", BOLUM))
panel_ozellikleri = [
    ["⚙", "<b>Profil Yonetimi:</b> Aciklama, foto, kategori, sehir, deneyim duzenleme"],
    ["📨", "<b>Is Taleplerini Goruntule:</b> Musteriden gelen tum teklifleri tek ekranda gor"],
    ["✓", "<b>Talep Kabul / Red:</b> Uygun olduklarinizi kabul edin, digerlerini reddedin"],
    ["📊", "<b>Istatistikler:</b> Kac kez goruntulendiniz, kac arama aldiniz, kac WhatsApp tiklamasi"],
    ["💬", "<b>Yorumlar:</b> Musterilerin verdigi puan ve yorumlari gorun"],
    ["📍", "<b>Musaitlik Durumu:</b> Yogunsaniz musaitliginizi 'kapali' yapip kucumeyin"],
    ["💳", "<b>Abonelik:</b> Plan yenileme, fatura gecmisi, kart bilgileri"],
]
panel_t = Table(panel_ozellikleri, colWidths=[1*cm, 15*cm])
panel_t.setStyle(TableStyle([
    ("FONTNAME", (0,0), (-1,-1), "Arial"),
    ("FONTSIZE", (0,0), (0,-1), 13),
    ("FONTSIZE", (1,0), (1,-1), 10),
    ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("TOPPADDING", (0,0), (-1,-1), 5),
    ("BOTTOMPADDING", (0,0), (-1,-1), 5),
]))
story.append(panel_t)
story.append(PageBreak())

# ═══ SAYFA 7: SSS ══════════════════════════════════════════════
story.append(Paragraph("Sikca Sorulan Sorular", ALT_BASLIK))
story.append(HRFlowable(width="100%", thickness=1, color=MAVI_AC, spaceAfter=8))

sss = [
    ("Kayit ucretli mi?",
     "Hayir, kayit tamamen ucretsizdir. Profiliniz yayina alinabilmesi icin bir plan secmeniz gerekir; "
     "aylik $9.99 veya yillik $99."),
    ("Sozlesme suresi var mi?",
     "Hayir. Aylik planda her ay sonunda iptal edebilirsiniz. Yillik planda da 14 gun icinde tam iade, "
     "sonrasinda kalan ay icin orantili iade hakkiniz vardir."),
    ("Birden fazla kategoride kayit olabilir miyim?",
     "Su an ana profilinizde bir kategori secersiniz. Birden fazla uzmanliginiz varsa aciklama "
     "kisminda belirtebilirsiniz; ek kategori paketleri yakinda eklenecek."),
    ("Musteri benimle nasil iletisime gecer?",
     "Musteri profilinizdeki <b>Hemen Teklif Al</b> butonu ile size mesaj birakir. Ayrica telefon "
     "ve WhatsApp butonlarinizla dogrudan da arayabilir."),
    ("Yorumlari ben silebilir miyim?",
     "Hayir, sansure izin vermeyiz. Ancak yapay/hakaret iceren yorumlari adausta@gmail.com'a "
     "bildirirseniz inceleyip kaldiririz."),
    ("Profilim ne kadar surede yayina girer?",
     "Odeme tamamlandiktan sonra 24 saat icinde admin onayi ile yayina alinir."),
    ("Vergi/fatura aliyor muyum?",
     "Evet. Odeme sonrasi e-fatura kayitli email adresinize gonderilir."),
    ("Kac usta var Ada Usta'da?",
     "Su an 30'dan fazla onayli usta ve 30'a yakin sirket aktif olarak hizmet vermektedir; "
     "platform her gun buyumektedir."),
]
for soru, cevap in sss:
    blok = KeepTogether([
        Paragraph(f"<b>S: {soru}</b>", ParagraphStyle("s", fontName="Arial-Bold",
            fontSize=10.5, textColor=MAVI, spaceBefore=8, spaceAfter=2)),
        Paragraph(f"C: {cevap}", ParagraphStyle("c", fontName="Arial",
            fontSize=10, textColor=colors.black, leading=14, leftIndent=12, spaceAfter=4)),
    ])
    story.append(blok)

story.append(PageBreak())

# ═══ SAYFA 8: ILETISIM & YASAL ═════════════════════════════════
if os.path.exists(LOGO):
    img2 = Image(LOGO, width=4*cm, height=4*cm, kind="proportional")
    img2.hAlign = "CENTER"
    story.append(img2)
    story.append(Spacer(1, 0.3*cm))

story.append(Paragraph("Bize Ulasin", ALT_BASLIK))
story.append(HRFlowable(width="100%", thickness=1, color=MAVI_AC, spaceAfter=8))

iletisim = [
    ["E-posta", "adausta@gmail.com"],
    ["Telefon / WhatsApp", "+90 548 851 07 00"],
    ["Web", "www.adausta.com"],
    ["Adres", "Adissa Enterprises Ltd. — Kuzey Kibris Turk Cumhuriyeti"],
    ["Calisma Saatleri", "Pazartesi – Cuma  09:00 – 18:00"],
    ["Hafta Sonu", "E-posta yanitlari gecikmeli (24-48 saat icinde)"],
]
il_t = Table(iletisim, colWidths=[5*cm, 11*cm])
il_t.setStyle(TableStyle([
    ("FONTNAME", (0,0), (0,-1), "Arial-Bold"),
    ("FONTNAME", (1,0), (1,-1), "Arial"),
    ("FONTSIZE", (0,0), (-1,-1), 10.5),
    ("TEXTCOLOR", (0,0), (0,-1), MAVI),
    ("ROWBACKGROUNDS", (0,0), (-1,-1), [colors.white, GRI_AC]),
    ("TOPPADDING", (0,0), (-1,-1), 7),
    ("BOTTOMPADDING", (0,0), (-1,-1), 7),
    ("LEFTPADDING", (0,0), (-1,-1), 10),
    ("BOX", (0,0), (-1,-1), 0.5, colors.lightgrey),
    ("LINEBELOW", (0,0), (-1,-2), 0.3, colors.lightgrey),
]))
story.append(il_t)

story.append(Spacer(1, 0.6*cm))
story.append(Paragraph("Kayit Olmak Icin", BOLUM))
story.append(Paragraph(
    "Sahsen <b>www.adausta.com/usta-kayit</b> adresinden 3 dakikada kaydinizi tamamlayabilirsiniz. "
    "Soru veya destek icin yukaridaki e-posta/telefon kanallarindan bize ulasabilirsiniz.",
    METIN))

story.append(Spacer(1, 0.6*cm))
story.append(Paragraph("Yasal Bilgiler", BOLUM))
story.append(Paragraph(
    "Ada Usta, <b>Adissa Enterprises Ltd.</b> tarafindan isletilen, KKTC mevzuatina tabi bir "
    "platformdur. Kullanim sartlari, gizlilik politikasi, mesafeli satis sozlesmesi ve iade "
    "politikasi tam metinleri www.adausta.com/yasal sayfasinda yer almaktadir.",
    METIN))

story.append(Spacer(1, 1*cm))
story.append(HRFlowable(width="60%", thickness=1.5, color=TURUNCU, hAlign="CENTER"))
story.append(Spacer(1, 0.3*cm))
story.append(Paragraph("Hosgeldiniz — Ailemize Katildiginiz Icin Tesekkurler!", VURGU))
story.append(Spacer(1, 0.5*cm))
story.append(Paragraph(
    "© 2026 Adissa Enterprises Ltd. — Tum haklari saklidir.",
    KUCUK))

# ─── Build ─────────────────────────────────────────────────────
doc.build(story)
print(f"PDF olusturuldu: {OUT}")
print(f"Boyut: {os.path.getsize(OUT)/1024:.1f} KB")
