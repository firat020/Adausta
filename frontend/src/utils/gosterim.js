import axios from 'axios'
import API from '../config.js'

// Usta kartı listelerde gerçekten görününce "gösterim" olarak sayılır (usta panelindeki analitik hunisinin ilk adımı).
// - Aynı usta aynı tarayıcıda saatte en fazla 1 kez sayılır (localStorage ile)
// - İstekler 1,5 sn biriktirilip tek istekte gönderilir
const ANAHTAR = 'adausta_gosterim'
let kuyruk = new Set()
let zamanlayici = null

function bu_saat() { return new Date().toISOString().slice(0, 13) }   // 2026-10-09T14

function sayilmisMi(id) {
  try {
    const kayit = JSON.parse(localStorage.getItem(ANAHTAR) || '{}')
    return kayit[id] === bu_saat()
  } catch { return false }
}

function isaretle(idler) {
  try {
    const saat = bu_saat()
    const kayit = JSON.parse(localStorage.getItem(ANAHTAR) || '{}')
    // eski saatlerin kayıtlarını temizle (depolama şişmesin)
    for (const k of Object.keys(kayit)) if (kayit[k] !== saat) delete kayit[k]
    idler.forEach(id => { kayit[id] = saat })
    localStorage.setItem(ANAHTAR, JSON.stringify(kayit))
  } catch { /* localStorage kapalıysa tekrar sayılabilir; sorun değil */ }
}

export function gosterimEkle(ustaId) {
  if (!ustaId || sayilmisMi(ustaId)) return
  kuyruk.add(ustaId)
  if (zamanlayici) return
  zamanlayici = setTimeout(() => {
    const idler = [...kuyruk].slice(0, 40)
    kuyruk = new Set()
    zamanlayici = null
    if (!idler.length) return
    isaretle(idler)
    axios.post(`${API}/api/analitik/gosterim`, { usta_ids: idler }, { withCredentials: false }).catch(() => {})
  }, 1500)
}
