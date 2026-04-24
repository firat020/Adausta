import API from '../config.js'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import * as Icons from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { KAT_EN, KAT_RU } from '../locales/katAdlari'
import axios from 'axios'

const GORSELLER = {
  'Elektrikçi':              'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&h=280&fit=crop&auto=format',
  'Güvenlik Kamera':         'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=500&h=280&fit=crop&auto=format',
  'Alarm Sistemi':           'https://images.unsplash.com/photo-1558002038-1055907df827?w=500&h=280&fit=crop&auto=format',
  'Uydu & Anten':            'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&h=280&fit=crop&auto=format',
  'Solar Panel':             'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=500&h=280&fit=crop&auto=format',
  'Akıllı Ev':               'https://images.unsplash.com/photo-1558002038-1055907df827?w=500&h=280&fit=crop&auto=format',
  'Jeneratör Servisi':       'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&h=280&fit=crop&auto=format',
  'Su Tesisatı':             'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=500&h=280&fit=crop&auto=format',
  'Kombi Servisi':           'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=500&h=280&fit=crop&auto=format',
  'Su Deposu & Pompa':       'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=500&h=280&fit=crop&auto=format',
  'Şofben & Termosifon':     'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=500&h=280&fit=crop&auto=format',
  'Doğalgaz Tesisatı':       'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=500&h=280&fit=crop&auto=format',
  'Gider Açma':              'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=500&h=280&fit=crop&auto=format',
  'Su Kaçağı Tespiti':       'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=500&h=280&fit=crop&auto=format',
  'Havuz Yapımı & Bakımı':   'https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=500&h=280&fit=crop&auto=format',
  'Sulama Sistemi':          'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500&h=280&fit=crop&auto=format',
  'Klima Servisi':           'https://images.unsplash.com/photo-1631634601969-6e4a66c1e7fa?w=500&h=280&fit=crop&auto=format',
  'Havalandırma':            'https://images.unsplash.com/photo-1631634601969-6e4a66c1e7fa?w=500&h=280&fit=crop&auto=format',
  'Isı Pompası':             'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=500&h=280&fit=crop&auto=format',
  'Boya Badana':             'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=500&h=280&fit=crop&auto=format',
  'Fayans & Seramik':        'https://images.unsplash.com/photo-1558618047-f4e80c0d63a4?w=500&h=280&fit=crop&auto=format',
  'Parke Döşeme':            'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=500&h=280&fit=crop&auto=format',
  'Alçıpan & Asma Tavan':    'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=500&h=280&fit=crop&auto=format',
  'Sıva Ustası':             'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=500&h=280&fit=crop&auto=format',
  'Mantolama':               'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500&h=280&fit=crop&auto=format',
  'Çatı Tamiri & Yapımı':    'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=500&h=280&fit=crop&auto=format',
  'Beton & Temel':           'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=500&h=280&fit=crop&auto=format',
  'Mermer & Granit':         'https://images.unsplash.com/photo-1558618047-f4e80c0d63a4?w=500&h=280&fit=crop&auto=format',
  'Mozaik Ustası':           'https://images.unsplash.com/photo-1558618047-f4e80c0d63a4?w=500&h=280&fit=crop&auto=format',
  'Anahtar Teslim Tadilat':  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=500&h=280&fit=crop&auto=format',
  'Prefabrik Ev':            'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=500&h=280&fit=crop&auto=format',
  'Demirci':                 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=500&h=280&fit=crop&auto=format',
  'Demir Doğrama':           'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=500&h=280&fit=crop&auto=format',
  'Çelik Kapı':              'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=500&h=280&fit=crop&auto=format',
  'Korkuluk & Balkon Demiri':'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=500&h=280&fit=crop&auto=format',
  'Kaynakçı':                'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=500&h=280&fit=crop&auto=format',
  'Ferforje':                'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=500&h=280&fit=crop&auto=format',
  'Sac & Çatı Sacı':         'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=500&h=280&fit=crop&auto=format',
  'Alüminyum Doğrama':       'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=500&h=280&fit=crop&auto=format',
  'PVC & Pimapen':           'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=500&h=280&fit=crop&auto=format',
  'Cam Balkon':              'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=500&h=280&fit=crop&auto=format',
  'Camcı':                   'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=500&h=280&fit=crop&auto=format',
  'Çilingir':                'https://images.unsplash.com/photo-1558618047-f4e80c0d63a4?w=500&h=280&fit=crop&auto=format',
  'Kepenk & Panjur':         'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=500&h=280&fit=crop&auto=format',
  'Garaj Kapısı':            'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=500&h=280&fit=crop&auto=format',
  'Mobilya Montaj':          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&h=280&fit=crop&auto=format',
  'Mobilya Tamiri':          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&h=280&fit=crop&auto=format',
  'Mutfak Dolabı':           'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&h=280&fit=crop&auto=format',
  'Duvar Kağıdı':            'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500&h=280&fit=crop&auto=format',
  'Halı Yıkama':             'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=280&fit=crop&auto=format',
  'Perde Montajı':           'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&h=280&fit=crop&auto=format',
  'Marangoz':                'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=500&h=280&fit=crop&auto=format',
  'Ev Temizliği':            'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&h=280&fit=crop&auto=format',
  'Ofis Temizliği':          'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&h=280&fit=crop&auto=format',
  'Böcek İlaçlama':          'https://images.unsplash.com/photo-1512241344745-e5928b28f0f0?w=500&h=280&fit=crop&auto=format',
  'Duşakabin Montajı':       'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=500&h=280&fit=crop&auto=format',
  'Mutfak Tadilat':          'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&h=280&fit=crop&auto=format',
  'Evden Eve Nakliyat':      'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=500&h=280&fit=crop&auto=format',
  'Ofis Taşıma':             'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=500&h=280&fit=crop&auto=format',
  'Parça Eşya Taşıma':       'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=500&h=280&fit=crop&auto=format',
  'Oto Çekici':              'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=500&h=280&fit=crop&auto=format',
  'Motokurye':               'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=280&fit=crop&auto=format',
  'Beyaz Eşya Servisi':      'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=500&h=280&fit=crop&auto=format',
  'TV & Elektronik Tamir':   'https://images.unsplash.com/photo-1558002038-1055907df827?w=500&h=280&fit=crop&auto=format',
  'Bilgisayar Tamiri':       'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&h=280&fit=crop&auto=format',
  'Telefon Tamiri':          'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&h=280&fit=crop&auto=format',
  'Bahçe Bakımı':            'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500&h=280&fit=crop&auto=format',
  'Ağaç Budama':             'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500&h=280&fit=crop&auto=format',
  'Dış Cephe Temizliği':     'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500&h=280&fit=crop&auto=format',
  'Oto Tamiri':              'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=500&h=280&fit=crop&auto=format',
  'Kaporta & Boya':          'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=500&h=280&fit=crop&auto=format',
  'Oto Elektrik':            'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=500&h=280&fit=crop&auto=format',
  'Lastik & Balans':         'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=280&fit=crop&auto=format',
  'Araç Seramik Kaplama':    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=500&h=280&fit=crop&auto=format',
  'Araç Yıkama':             'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=280&fit=crop&auto=format',
  'Fotoğrafçı':              'https://images.unsplash.com/photo-1452780212461-a4e73d5e4491?w=500&h=280&fit=crop&auto=format',
  'Düğün Organizasyonu':     'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=500&h=280&fit=crop&auto=format',
  'İç Mimar':                'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=500&h=280&fit=crop&auto=format',
  'Mimar':                   'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=500&h=280&fit=crop&auto=format',
  'Catering & Yemek':        'https://images.unsplash.com/photo-1555244162-803834f70033?w=500&h=280&fit=crop&auto=format',
  'Terzi & Dikiş':           'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=280&fit=crop&auto=format',
  'Veteriner (Evde)':        'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=500&h=280&fit=crop&auto=format',
  'Evcil Hayvan Bakımı':     'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=500&h=280&fit=crop&auto=format',
  'default':                 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=500&h=280&fit=crop&auto=format',
}

const IKONLAR = {
  'Elektrikçi':              { ikon: 'Zap',             renk: '#2563eb', bg: '#dbeafe' },
  'Güvenlik Kamera':         { ikon: 'ShieldCheck',     renk: '#7c3aed', bg: '#ede9fe' },
  'Alarm Sistemi':           { ikon: 'BellRing',        renk: '#dc2626', bg: '#fee2e2' },
  'Uydu & Anten':            { ikon: 'Radio',           renk: '#0891b2', bg: '#cffafe' },
  'Solar Panel':             { ikon: 'Sun',             renk: '#0284c7', bg: '#e0f2fe' },
  'Akıllı Ev':               { ikon: 'Home',            renk: '#1d4ed8', bg: '#dbeafe' },
  'Jeneratör Servisi':       { ikon: 'Battery',         renk: '#475569', bg: '#f1f5f9' },
  'Su Tesisatı':             { ikon: 'Droplets',        renk: '#0284c7', bg: '#e0f2fe' },
  'Kombi Servisi':           { ikon: 'Flame',           renk: '#1d4ed8', bg: '#dbeafe' },
  'Su Deposu & Pompa':       { ikon: 'Waves',           renk: '#0369a1', bg: '#e0f2fe' },
  'Şofben & Termosifon':     { ikon: 'Thermometer',     renk: '#0891b2', bg: '#cffafe' },
  'Doğalgaz Tesisatı':       { ikon: 'Flame',           renk: '#2563eb', bg: '#dbeafe' },
  'Gider Açma':              { ikon: 'MoveDown',        renk: '#0891b2', bg: '#cffafe' },
  'Su Kaçağı Tespiti':       { ikon: 'SearchCheck',     renk: '#0284c7', bg: '#e0f2fe' },
  'Havuz Yapımı & Bakımı':   { ikon: 'Waves',           renk: '#06b6d4', bg: '#cffafe' },
  'Sulama Sistemi':          { ikon: 'Sprout',          renk: '#0ea5e9', bg: '#e0f2fe' },
  'Klima Servisi':           { ikon: 'Wind',            renk: '#0ea5e9', bg: '#e0f2fe' },
  'Havalandırma':            { ikon: 'AirVent',         renk: '#475569', bg: '#f1f5f9' },
  'Isı Pompası':             { ikon: 'Thermometer',     renk: '#3b82f6', bg: '#dbeafe' },
  'Boya Badana':             { ikon: 'Paintbrush',      renk: '#2563eb', bg: '#dbeafe' },
  'Fayans & Seramik':        { ikon: 'Grid3x3',         renk: '#475569', bg: '#f1f5f9' },
  'Parke Döşeme':            { ikon: 'Rows3',           renk: '#475569', bg: '#f1f5f9' },
  'Alçıpan & Asma Tavan':    { ikon: 'Layers',          renk: '#475569', bg: '#f1f5f9' },
  'Sıva Ustası':             { ikon: 'Brush',           renk: '#64748b', bg: '#f1f5f9' },
  'Mantolama':               { ikon: 'Building2',       renk: '#1d4ed8', bg: '#dbeafe' },
  'Çatı Tamiri & Yapımı':    { ikon: 'Triangle',        renk: '#7c3aed', bg: '#ede9fe' },
  'Beton & Temel':           { ikon: 'HardHat',         renk: '#475569', bg: '#f1f5f9' },
  'Mermer & Granit':         { ikon: 'Gem',             renk: '#6366f1', bg: '#e0e7ff' },
  'Mozaik Ustası':           { ikon: 'PaintBucket',     renk: '#3b82f6', bg: '#dbeafe' },
  'Anahtar Teslim Tadilat':  { ikon: 'KeyRound',        renk: '#2563eb', bg: '#dbeafe' },
  'Prefabrik Ev':            { ikon: 'Home',            renk: '#1d4ed8', bg: '#dbeafe' },
  'Demirci':                 { ikon: 'Hammer',          renk: '#475569', bg: '#f1f5f9' },
  'Demir Doğrama':           { ikon: 'DoorOpen',        renk: '#475569', bg: '#f1f5f9' },
  'Çelik Kapı':              { ikon: 'DoorClosed',      renk: '#374151', bg: '#f3f4f6' },
  'Korkuluk & Balkon Demiri':{ ikon: 'Fence',           renk: '#475569', bg: '#f1f5f9' },
  'Kaynakçı':                { ikon: 'Wrench',          renk: '#1d4ed8', bg: '#dbeafe' },
  'Ferforje':                { ikon: 'Flower2',         renk: '#7c3aed', bg: '#ede9fe' },
  'Sac & Çatı Sacı':         { ikon: 'Triangle',        renk: '#475569', bg: '#f1f5f9' },
  'Alüminyum Doğrama':       { ikon: 'Frame',           renk: '#0284c7', bg: '#e0f2fe' },
  'PVC & Pimapen':           { ikon: 'AppWindow',       renk: '#0ea5e9', bg: '#e0f2fe' },
  'Cam Balkon':              { ikon: 'ScanLine',        renk: '#06b6d4', bg: '#cffafe' },
  'Camcı':                   { ikon: 'Scan',            renk: '#0891b2', bg: '#cffafe' },
  'Çilingir':                { ikon: 'KeyRound',        renk: '#2563eb', bg: '#dbeafe' },
  'Kepenk & Panjur':         { ikon: 'AlignJustify',    renk: '#475569', bg: '#f1f5f9' },
  'Garaj Kapısı':            { ikon: 'CarFront',        renk: '#475569', bg: '#f1f5f9' },
  'Mobilya Montaj':          { ikon: 'Armchair',        renk: '#475569', bg: '#f1f5f9' },
  'Mobilya Tamiri':          { ikon: 'Hammer',          renk: '#64748b', bg: '#f1f5f9' },
  'Mutfak Dolabı':           { ikon: 'UtensilsCrossed', renk: '#1d4ed8', bg: '#dbeafe' },
  'Duvar Kağıdı':            { ikon: 'Image',           renk: '#7c3aed', bg: '#ede9fe' },
  'Halı Yıkama':             { ikon: 'WashingMachine',  renk: '#0284c7', bg: '#e0f2fe' },
  'Perde Montajı':           { ikon: 'AlignCenter',     renk: '#475569', bg: '#f1f5f9' },
  'Marangoz':                { ikon: 'TreePine',        renk: '#475569', bg: '#f1f5f9' },
  'Ev Temizliği':            { ikon: 'Sparkles',        renk: '#0284c7', bg: '#e0f2fe' },
  'Ofis Temizliği':          { ikon: 'Building',        renk: '#475569', bg: '#f1f5f9' },
  'Böcek İlaçlama':          { ikon: 'Bug',             renk: '#0ea5e9', bg: '#e0f2fe' },
  'Duşakabin Montajı':       { ikon: 'ShowerHead',      renk: '#0ea5e9', bg: '#e0f2fe' },
  'Mutfak Tadilat':          { ikon: 'ChefHat',         renk: '#1d4ed8', bg: '#dbeafe' },
  'Evden Eve Nakliyat':      { ikon: 'Truck',           renk: '#2563eb', bg: '#dbeafe' },
  'Ofis Taşıma':             { ikon: 'Package',         renk: '#7c3aed', bg: '#ede9fe' },
  'Parça Eşya Taşıma':       { ikon: 'PackageOpen',     renk: '#475569', bg: '#f1f5f9' },
  'Oto Çekici':              { ikon: 'Truck',           renk: '#1d4ed8', bg: '#dbeafe' },
  'Motokurye':               { ikon: 'Bike',            renk: '#0284c7', bg: '#e0f2fe' },
  'Beyaz Eşya Servisi':      { ikon: 'Refrigerator',    renk: '#0284c7', bg: '#e0f2fe' },
  'TV & Elektronik Tamir':   { ikon: 'Tv',              renk: '#374151', bg: '#f3f4f6' },
  'Bilgisayar Tamiri':       { ikon: 'Laptop',          renk: '#2563eb', bg: '#dbeafe' },
  'Telefon Tamiri':          { ikon: 'Smartphone',      renk: '#0ea5e9', bg: '#e0f2fe' },
  'Bahçe Bakımı':            { ikon: 'Leaf',            renk: '#0284c7', bg: '#e0f2fe' },
  'Ağaç Budama':             { ikon: 'TreePine',        renk: '#1d4ed8', bg: '#dbeafe' },
  'Dış Cephe Temizliği':     { ikon: 'Building2',       renk: '#0284c7', bg: '#e0f2fe' },
  'Oto Tamiri':              { ikon: 'Car',             renk: '#374151', bg: '#f3f4f6' },
  'Kaporta & Boya':          { ikon: 'Paintbrush2',     renk: '#1d4ed8', bg: '#dbeafe' },
  'Oto Elektrik':            { ikon: 'Zap',             renk: '#2563eb', bg: '#dbeafe' },
  'Lastik & Balans':         { ikon: 'CircleDot',       renk: '#374151', bg: '#f3f4f6' },
  'Araç Seramik Kaplama':    { ikon: 'Gem',             renk: '#7c3aed', bg: '#ede9fe' },
  'Araç Yıkama':             { ikon: 'Droplets',        renk: '#0284c7', bg: '#e0f2fe' },
  'Fotoğrafçı':              { ikon: 'Camera',          renk: '#374151', bg: '#f3f4f6' },
  'Düğün Organizasyonu':     { ikon: 'Heart',           renk: '#6366f1', bg: '#e0e7ff' },
  'İç Mimar':                { ikon: 'Ruler',           renk: '#7c3aed', bg: '#ede9fe' },
  'Mimar':                   { ikon: 'Compass',         renk: '#0284c7', bg: '#e0f2fe' },
  'Catering & Yemek':        { ikon: 'UtensilsCrossed', renk: '#1d4ed8', bg: '#dbeafe' },
  'Terzi & Dikiş':           { ikon: 'Scissors',        renk: '#9333ea', bg: '#f3e8ff' },
  'Veteriner (Evde)':        { ikon: 'PawPrint',        renk: '#0ea5e9', bg: '#e0f2fe' },
  'Evcil Hayvan Bakımı':     { ikon: 'PawPrint',        renk: '#3b82f6', bg: '#dbeafe' },
  'default':                 { ikon: 'Wrench',          renk: '#2563eb', bg: '#dbeafe' },
}

function KategoriIkon({ ad, boyut = 18 }) {
  const e = IKONLAR[ad] || IKONLAR['default']
  const IconComp = Icons[e.ikon] || Icons['Wrench']
  return (
    <span className="inline-flex items-center justify-center rounded-lg flex-shrink-0"
      style={{ width: 30, height: 30, background: e.bg }}>
      <IconComp size={boyut} color={e.renk} strokeWidth={2} />
    </span>
  )
}

export default function KategoriKart({ kategori }) {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const gorsel = GORSELLER[kategori.ad] || GORSELLER['default']
  const katAd = i18n.language === 'en' ? (KAT_EN[kategori.ad] || kategori.ad)
              : i18n.language === 'ru' ? (KAT_RU[kategori.ad] || kategori.ad)
              : kategori.ad

  const tikla = () => {
    axios.post(`${API}/api/analitik/kategori-goruntule`, { kategori_id: kategori.id }, { withCredentials: false }).catch(() => {})
    navigate(`/ustalar?kategori_id=${kategori.id}&kategori_ad=${encodeURIComponent(kategori.ad)}`)
  }

  return (
    <div
      onClick={tikla}
      className="bg-white rounded-xl overflow-hidden cursor-pointer border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col"
    >
      {/* Fotoğraf */}
      <div className="relative overflow-hidden" style={{ height: 200 }}>
        <img
          src={gorsel}
          alt={kategori.ad}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          onError={e => { e.target.src = GORSELLER['default'] }}
          loading="lazy"
        />
        {/* Karartma gradyanı */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

        {/* Aktif usta rozeti */}
        {kategori.usta_sayisi > 0 && (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-emerald-500 text-white font-bold px-2.5 py-1 rounded-full shadow-sm"
            style={{ fontSize: 11 }}>
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" />
            {kategori.usta_sayisi} {t('common.ustaAktif')}
          </div>
        )}
      </div>

      {/* İçerik */}
      <div className="p-4 flex flex-col flex-1">
        {/* İkon + Ad */}
        <div className="flex items-center gap-2.5 mb-1.5">
          <KategoriIkon ad={kategori.ad} boyut={16} />
          <span className="font-bold text-gray-900 text-sm leading-snug">{katAd}</span>
        </div>

        {/* HEMEN TEKLİF AL */}
        <p className="text-blue-600 font-bold mb-2" style={{ fontSize: 10.5, letterSpacing: '0.04em' }}>
          {t('common.hemenTeklif')}
        </p>

        {/* Açıklama */}
        <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 flex-1">
          {kategori.aciklama}
        </p>

        {/* İncele → */}
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100">
          <span className="text-sm font-semibold text-gray-700">{t('common.incele')}</span>
          <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center">
            <ArrowRight size={13} className="text-white" />
          </div>
        </div>
      </div>
    </div>
  )
}
