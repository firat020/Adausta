import { useNavigate } from 'react-router-dom'
import { ArrowRight, Users } from 'lucide-react'
import * as Icons from 'lucide-react'

// Her kategori için fotoğraf
const GORSELLER = {
  // Elektrik & Teknoloji
  'Elektrikçi':              'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=220&fit=crop&auto=format',
  'Güvenlik Kamera':         'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=400&h=220&fit=crop&auto=format',
  'Alarm Sistemi':           'https://images.unsplash.com/photo-1558002038-1055907df827?w=400&h=220&fit=crop&auto=format',
  'Uydu & Anten':            'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=220&fit=crop&auto=format',
  'Solar Panel':             'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&h=220&fit=crop&auto=format',
  'Akıllı Ev':               'https://images.unsplash.com/photo-1558002038-1055907df827?w=400&h=220&fit=crop&auto=format',
  'Jeneratör Servisi':       'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=220&fit=crop&auto=format',
  // Su & Isıtma
  'Su Tesisatı':             'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=220&fit=crop&auto=format',
  'Kombi Servisi':           'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&h=220&fit=crop&auto=format',
  'Su Deposu & Pompa':       'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=220&fit=crop&auto=format',
  'Şofben & Termosifon':     'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&h=220&fit=crop&auto=format',
  'Doğalgaz Tesisatı':       'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&h=220&fit=crop&auto=format',
  'Gider Açma':              'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=220&fit=crop&auto=format',
  'Su Kaçağı Tespiti':       'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=220&fit=crop&auto=format',
  'Havuz Yapımı & Bakımı':   'https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=400&h=220&fit=crop&auto=format',
  'Sulama Sistemi':          'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=220&fit=crop&auto=format',
  // Klima & Havalandırma
  'Klima Servisi':           'https://images.unsplash.com/photo-1631634601969-6e4a66c1e7fa?w=400&h=220&fit=crop&auto=format',
  'Havalandırma':            'https://images.unsplash.com/photo-1631634601969-6e4a66c1e7fa?w=400&h=220&fit=crop&auto=format',
  'Isı Pompası':             'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&h=220&fit=crop&auto=format',
  // İnşaat & Yapı
  'Boya Badana':             'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400&h=220&fit=crop&auto=format',
  'Fayans & Seramik':        'https://images.unsplash.com/photo-1558618047-f4e80c0d63a4?w=400&h=220&fit=crop&auto=format',
  'Parke Döşeme':            'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=400&h=220&fit=crop&auto=format',
  'Alçıpan & Asma Tavan':    'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&h=220&fit=crop&auto=format',
  'Sıva Ustası':             'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&h=220&fit=crop&auto=format',
  'Mantolama':               'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&h=220&fit=crop&auto=format',
  'Çatı Tamiri & Yapımı':    'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&h=220&fit=crop&auto=format',
  'Beton & Temel':           'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&h=220&fit=crop&auto=format',
  'Mermer & Granit':         'https://images.unsplash.com/photo-1558618047-f4e80c0d63a4?w=400&h=220&fit=crop&auto=format',
  'Mozaik Ustası':           'https://images.unsplash.com/photo-1558618047-f4e80c0d63a4?w=400&h=220&fit=crop&auto=format',
  'Anahtar Teslim Tadilat':  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&h=220&fit=crop&auto=format',
  'Prefabrik Ev':            'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=400&h=220&fit=crop&auto=format',
  // Demir & Metal
  'Demirci':                 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400&h=220&fit=crop&auto=format',
  'Demir Doğrama':           'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400&h=220&fit=crop&auto=format',
  'Çelik Kapı':              'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=400&h=220&fit=crop&auto=format',
  'Korkuluk & Balkon Demiri':'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400&h=220&fit=crop&auto=format',
  'Kaynakçı':                'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400&h=220&fit=crop&auto=format',
  'Ferforje':                'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400&h=220&fit=crop&auto=format',
  'Sac & Çatı Sacı':         'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&h=220&fit=crop&auto=format',
  // Doğrama & Cam
  'Alüminyum Doğrama':       'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=400&h=220&fit=crop&auto=format',
  'PVC & Pimapen':           'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=400&h=220&fit=crop&auto=format',
  'Cam Balkon':              'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=400&h=220&fit=crop&auto=format',
  'Camcı':                   'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=400&h=220&fit=crop&auto=format',
  'Çilingir':                'https://images.unsplash.com/photo-1558618047-f4e80c0d63a4?w=400&h=220&fit=crop&auto=format',
  'Kepenk & Panjur':         'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=400&h=220&fit=crop&auto=format',
  'Garaj Kapısı':            'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=400&h=220&fit=crop&auto=format',
  // Mobilya & İç Mekan
  'Mobilya Montaj':          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=220&fit=crop&auto=format',
  'Mobilya Tamiri':          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=220&fit=crop&auto=format',
  'Mutfak Dolabı':           'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=220&fit=crop&auto=format',
  'Duvar Kağıdı':            'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&h=220&fit=crop&auto=format',
  'Halı Yıkama':             'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=220&fit=crop&auto=format',
  'Perde Montajı':           'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=220&fit=crop&auto=format',
  'Marangoz':                'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400&h=220&fit=crop&auto=format',
  // Ev Hizmetleri
  'Ev Temizliği':            'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=220&fit=crop&auto=format',
  'Ofis Temizliği':          'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=220&fit=crop&auto=format',
  'Böcek İlaçlama':          'https://images.unsplash.com/photo-1512241344745-e5928b28f0f0?w=400&h=220&fit=crop&auto=format',
  'Duşakabin Montajı':       'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&h=220&fit=crop&auto=format',
  'Mutfak Tadilat':          'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=220&fit=crop&auto=format',
  // Nakliyat
  'Evden Eve Nakliyat':      'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=220&fit=crop&auto=format',
  'Ofis Taşıma':             'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=220&fit=crop&auto=format',
  'Parça Eşya Taşıma':       'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=220&fit=crop&auto=format',
  'Oto Çekici':              'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&h=220&fit=crop&auto=format',
  'Motokurye':               'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=220&fit=crop&auto=format',
  // Beyaz Eşya & Elektronik
  'Beyaz Eşya Servisi':      'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=400&h=220&fit=crop&auto=format',
  'TV & Elektronik Tamir':   'https://images.unsplash.com/photo-1558002038-1055907df827?w=400&h=220&fit=crop&auto=format',
  'Bilgisayar Tamiri':       'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=220&fit=crop&auto=format',
  'Telefon Tamiri':          'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=220&fit=crop&auto=format',
  // Bahçe & Dış Alan
  'Bahçe Bakımı':            'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=220&fit=crop&auto=format',
  'Ağaç Budama':             'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=220&fit=crop&auto=format',
  'Dış Cephe Temizliği':     'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&h=220&fit=crop&auto=format',
  // Araç & Oto
  'Oto Tamiri':              'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=220&fit=crop&auto=format',
  'Kaporta & Boya':          'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=220&fit=crop&auto=format',
  'Oto Elektrik':            'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=220&fit=crop&auto=format',
  'Lastik & Balans':         'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=220&fit=crop&auto=format',
  'Araç Seramik Kaplama':    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=220&fit=crop&auto=format',
  'Araç Yıkama':             'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=220&fit=crop&auto=format',
  // Profesyonel
  'Fotoğrafçı':              'https://images.unsplash.com/photo-1452780212461-a4e73d5e4491?w=400&h=220&fit=crop&auto=format',
  'Düğün Organizasyonu':     'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=220&fit=crop&auto=format',
  'İç Mimar':                'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=400&h=220&fit=crop&auto=format',
  'Mimar':                   'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=400&h=220&fit=crop&auto=format',
  'Catering & Yemek':        'https://images.unsplash.com/photo-1555244162-803834f70033?w=400&h=220&fit=crop&auto=format',
  'Terzi & Dikiş':           'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=220&fit=crop&auto=format',
  'Veteriner (Evde)':        'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=220&fit=crop&auto=format',
  'Evcil Hayvan Bakımı':     'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=220&fit=crop&auto=format',
  'default':                 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&h=220&fit=crop&auto=format',
}

// Lucide ikon + renk eşleşmesi
const IKONLAR = {
  'Elektrikçi':             { ikon: 'Zap',            renk: '#2563eb' },
  'Güvenlik Kamera':        { ikon: 'ShieldCheck',     renk: '#7c3aed' },
  'Alarm Sistemi':          { ikon: 'BellRing',        renk: '#dc2626' },
  'Uydu & Anten':           { ikon: 'Radio',           renk: '#0891b2' },
  'Solar Panel':            { ikon: 'Sun',             renk: '#d97706' },
  'Akıllı Ev':              { ikon: 'Home',            renk: '#059669' },
  'Jeneratör Servisi':      { ikon: 'Battery',         renk: '#64748b' },
  'Su Tesisatı':            { ikon: 'Droplets',        renk: '#0284c7' },
  'Kombi Servisi':          { ikon: 'Flame',           renk: '#ea580c' },
  'Su Deposu & Pompa':      { ikon: 'Container',       renk: '#0369a1' },
  'Şofben & Termosifon':    { ikon: 'Thermometer',     renk: '#dc2626' },
  'Doğalgaz Tesisatı':      { ikon: 'Flame',           renk: '#2563eb' },
  'Gider Açma':             { ikon: 'MoveDown',        renk: '#0891b2' },
  'Su Kaçağı Tespiti':      { ikon: 'SearchCheck',     renk: '#0284c7' },
  'Havuz Yapımı & Bakımı':  { ikon: 'Waves',           renk: '#06b6d4' },
  'Sulama Sistemi':         { ikon: 'Sprout',          renk: '#16a34a' },
  'Klima Servisi':          { ikon: 'Wind',            renk: '#0ea5e9' },
  'Havalandırma':           { ikon: 'AirVent',         renk: '#64748b' },
  'Isı Pompası':            { ikon: 'Thermometer',     renk: '#9333ea' },
  'Boya Badana':            { ikon: 'Paintbrush',      renk: '#ea580c' },
  'Fayans & Seramik':       { ikon: 'Grid3x3',         renk: '#64748b' },
  'Parke Döşeme':           { ikon: 'Rows3',           renk: '#92400e' },
  'Alçıpan & Asma Tavan':   { ikon: 'Layers',          renk: '#475569' },
  'Sıva Ustası':            { ikon: 'Brush',           renk: '#78716c' },
  'Mantolama':              { ikon: 'Building2',       renk: '#059669' },
  'Çatı Tamiri & Yapımı':   { ikon: 'Triangle',        renk: '#7c3aed' },
  'Beton & Temel':          { ikon: 'HardHat',         renk: '#d97706' },
  'Mermer & Granit':        { ikon: 'Gem',             renk: '#a855f7' },
  'Mozaik Ustası':          { ikon: 'PaintBucket',     renk: '#ec4899' },
  'Anahtar Teslim Tadilat': { ikon: 'KeyRound',        renk: '#2563eb' },
  'Prefabrik Ev':           { ikon: 'Home',            renk: '#16a34a' },
  'Demirci':                { ikon: 'Hammer',          renk: '#475569' },
  'Demir Doğrama':          { ikon: 'DoorOpen',        renk: '#64748b' },
  'Çelik Kapı':             { ikon: 'DoorClosed',      renk: '#374151' },
  'Korkuluk & Balkon Demiri':{ ikon: 'Fence',          renk: '#64748b' },
  'Kaynakçı':               { ikon: 'Wrench',          renk: '#dc2626' },
  'Ferforje':               { ikon: 'Flower2',         renk: '#9333ea' },
  'Sac & Çatı Sacı':        { ikon: 'Triangle',        renk: '#475569' },
  'Alüminyum Doğrama':      { ikon: 'Frame',           renk: '#0284c7' },
  'PVC & Pimapen':          { ikon: 'AppWindow',       renk: '#0ea5e9' },
  'Cam Balkon':             { ikon: 'ScanLine',        renk: '#06b6d4' },
  'Camcı':                  { ikon: 'Scan',            renk: '#0891b2' },
  'Çilingir':               { ikon: 'KeyRound',        renk: '#d97706' },
  'Kepenk & Panjur':        { ikon: 'AlignJustify',    renk: '#64748b' },
  'Garaj Kapısı':           { ikon: 'CarFront',        renk: '#475569' },
  'Mobilya Montaj':         { ikon: 'Armchair',        renk: '#92400e' },
  'Mobilya Tamiri':         { ikon: 'Hammer',          renk: '#78716c' },
  'Mutfak Dolabı':          { ikon: 'UtensilsCrossed', renk: '#ea580c' },
  'Duvar Kağıdı':           { ikon: 'Image',           renk: '#7c3aed' },
  'Halı Yıkama':            { ikon: 'WashingMachine',  renk: '#0284c7' },
  'Perde Montajı':          { ikon: 'AlignCenter',     renk: '#64748b' },
  'Marangoz':               { ikon: 'TreePine',        renk: '#92400e' },
  'Ev Temizliği':           { ikon: 'Sparkles',        renk: '#0284c7' },
  'Ofis Temizliği':         { ikon: 'Building',        renk: '#475569' },
  'Böcek İlaçlama':         { ikon: 'Bug',             renk: '#16a34a' },
  'Duşakabin Montajı':      { ikon: 'ShowerHead',      renk: '#0ea5e9' },
  'Mutfak Tadilat':         { ikon: 'ChefHat',         renk: '#ea580c' },
  'Evden Eve Nakliyat':     { ikon: 'Truck',           renk: '#2563eb' },
  'Ofis Taşıma':            { ikon: 'Package',         renk: '#7c3aed' },
  'Parça Eşya Taşıma':      { ikon: 'PackageOpen',     renk: '#64748b' },
  'Oto Çekici':             { ikon: 'Truck',           renk: '#dc2626' },
  'Motokurye':              { ikon: 'Bike',            renk: '#ea580c' },
  'Beyaz Eşya Servisi':     { ikon: 'Refrigerator',    renk: '#0284c7' },
  'TV & Elektronik Tamir':  { ikon: 'Tv',              renk: '#374151' },
  'Bilgisayar Tamiri':      { ikon: 'Laptop',          renk: '#2563eb' },
  'Telefon Tamiri':         { ikon: 'Smartphone',      renk: '#16a34a' },
  'Bahçe Bakımı':           { ikon: 'Leaf',            renk: '#16a34a' },
  'Ağaç Budama':            { ikon: 'TreePine',        renk: '#15803d' },
  'Dış Cephe Temizliği':    { ikon: 'Building2',       renk: '#0284c7' },
  'Oto Tamiri':             { ikon: 'Car',             renk: '#374151' },
  'Kaporta & Boya':         { ikon: 'Paintbrush2',     renk: '#dc2626' },
  'Oto Elektrik':           { ikon: 'Zap',             renk: '#d97706' },
  'Lastik & Balans':        { ikon: 'CircleDot',       renk: '#374151' },
  'Araç Seramik Kaplama':   { ikon: 'Gem',             renk: '#7c3aed' },
  'Araç Yıkama':            { ikon: 'Droplets',        renk: '#0284c7' },
  'Fotoğrafçı':             { ikon: 'Camera',          renk: '#374151' },
  'Düğün Organizasyonu':    { ikon: 'Heart',           renk: '#ec4899' },
  'İç Mimar':               { ikon: 'Ruler',           renk: '#7c3aed' },
  'Mimar':                  { ikon: 'Compass',         renk: '#0284c7' },
  'Catering & Yemek':       { ikon: 'UtensilsCrossed', renk: '#ea580c' },
  'Terzi & Dikiş':          { ikon: 'Scissors',        renk: '#9333ea' },
  'Veteriner (Evde)':       { ikon: 'PawPrint',        renk: '#16a34a' },
  'Evcil Hayvan Bakımı':    { ikon: 'PawPrint',        renk: '#f59e0b' },
  'default':                { ikon: 'Wrench',          renk: '#64748b' },
}

function KategoriIkon({ ad, boyut = 20 }) {
  const eslesen = IKONLAR[ad] || IKONLAR['default']
  const IconComp = Icons[eslesen.ikon] || Icons['Wrench']
  return <IconComp size={boyut} color={eslesen.renk} strokeWidth={2} />
}

export default function KategoriKart({ kategori }) {
  const navigate = useNavigate()
  const gorsel = GORSELLER[kategori.ad] || GORSELLER['default']

  return (
    <div
      onClick={() => navigate(`/ustalar?kategori_id=${kategori.id}&kategori_ad=${encodeURIComponent(kategori.ad)}`)}
      className="bg-white rounded-xl overflow-hidden cursor-pointer border border-gray-100 shadow-sm hover:shadow-lg transition-shadow duration-200 flex flex-col"
    >
      {/* --- Fotoğraf Alanı --- */}
      <div className="relative overflow-hidden" style={{ height: '180px' }}>
        <img
          src={gorsel}
          alt={kategori.ad}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          onError={(e) => { e.target.src = GORSELLER['default'] }}
          loading="lazy"
        />

        {/* Yeşil rozet */}
        {kategori.usta_sayisi > 0 && (
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-emerald-500 text-white font-bold px-2.5 py-1 rounded-full"
            style={{ fontSize: '11px' }}>
            <Users size={10} />
            {kategori.usta_sayisi} USTA AKTİF
          </div>
        )}
      </div>

      {/* --- Beyaz İçerik Alanı --- */}
      <div className="p-4 flex flex-col flex-1">
        {/* İkon + Kategori Adı */}
        <div className="flex items-center gap-2 mb-1">
          <KategoriIkon ad={kategori.ad} boyut={18} />
          <span className="font-bold text-gray-900 text-sm leading-tight">{kategori.ad}</span>
        </div>

        {/* HEMEN TEKLİF AL */}
        <p className="text-red-500 font-bold mb-2" style={{ fontSize: '11px', letterSpacing: '0.02em' }}>
          HEMEN TEKLİF AL
        </p>

        {/* Açıklama */}
        <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 flex-1">
          {kategori.aciklama}
        </p>

        {/* İncele → */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
          <span className="text-sm font-medium text-gray-700">İncele</span>
          <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center">
            <ArrowRight size={13} className="text-gray-600" />
          </div>
        </div>
      </div>
    </div>
  )
}
