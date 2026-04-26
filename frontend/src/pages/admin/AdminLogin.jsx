import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

import API from '../../config.js'
// API

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [sifre, setSifre] = useState('')
  const [showSifre, setShowSifre] = useState(false)
  const [hata, setHata] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)
  const navigate = useNavigate()
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let W, H, animId
    const pts = []

    function resize() {
      W = canvas.width = window.innerWidth
      H = canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Gümüş + yeşil tonlarında parçacıklar (logo renkleri)
    for (let i = 0; i < 85; i++) pts.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.4 + 0.2,
      s: Math.random() * 0.3 + 0.07,
      o: Math.random() * 0.4 + 0.06,
      d: (Math.random() - 0.5) * 0.22,
      // bazı parçacıklar yeşil, çoğu gümüş-mavi
      g: Math.random() < 0.12,
    })

    function draw() {
      ctx.clearRect(0, 0, W, H)
      // Arka plan: logonun koyu lacivert tonu
      ctx.fillStyle = '#040d1c'
      ctx.fillRect(0, 0, W, H)
      pts.forEach(p => {
        p.y -= p.s; p.x += p.d
        if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W }
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        // yeşil (logo checkmark rengi) veya gümüş-mavi
        ctx.fillStyle = p.g
          ? `rgba(74,222,128,${p.o})`
          : `rgba(148,175,220,${p.o})`
        ctx.fill()
      })
      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animId)
    }
  }, [])

  const giris = async (e) => {
    e.preventDefault()
    setHata('')
    setYukleniyor(true)
    try {
      const res = await axios.post(`${API}/api/auth/giris`, { email, sifre }, { withCredentials: true })
      if (res.data.kullanici?.rol === 'admin') {
        navigate('/admin/dashboard')
      } else {
        setHata('Bu hesabın admin yetkisi yok.')
      }
    } catch (err) {
      setHata(err.response?.data?.hata || 'Giriş başarısız')
    }
    setYukleniyor(false)
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .au-scene { position: fixed; inset: 0; z-index: 0; }
        .au-scene canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
        .au-glow {
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 55% 50% at 18% 28%, rgba(14,40,90,0.55) 0%, transparent 60%),
            radial-gradient(ellipse 40% 35% at 82% 72%, rgba(22,163,74,0.08) 0%, transparent 55%);
        }

        .au-page {
          position: relative; z-index: 1;
          height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          font-family: 'Outfit', sans-serif;
          color: #e8f0ff;
        }

        /* ═══ SOL ═══ */
        .au-left {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 60px 64px;
          position: relative;
        }
        .au-left::after {
          content: '';
          position: absolute;
          right: 0; top: 10%; bottom: 10%;
          width: 1px;
          background: linear-gradient(180deg,
            transparent,
            rgba(74,222,128,0.18) 25%,
            rgba(30,58,95,0.4) 60%,
            transparent
          );
        }

        .au-logo-area {
          margin-bottom: 48px;
          animation: auRise .6s .05s both;
        }
        .au-logo-area img {
          width: 140px;
          height: 140px;
          object-fit: contain;
          border-radius: 22px;
          /* hafif glow: logonun lacivert tonuna uygun */
          filter: drop-shadow(0 0 18px rgba(30,58,95,0.6));
        }

        .au-tag {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(22,163,74,0.09);
          border: 1px solid rgba(74,222,128,0.22);
          border-radius: 100px;
          padding: 6px 14px;
          font-size: 11.5px; font-weight: 500;
          color: rgba(134,239,172,0.85);
          letter-spacing: 0.08em; text-transform: uppercase;
          margin-bottom: 22px;
          animation: auRise .6s .12s both;
          width: fit-content;
        }
        .au-tag-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #4ade80;
          box-shadow: 0 0 7px #4ade80;
          flex-shrink: 0;
        }

        .au-title {
          font-size: clamp(28px, 2.8vw, 44px);
          font-weight: 800;
          line-height: 1.12;
          letter-spacing: -1px;
          margin-bottom: 18px;
          animation: auRise .6s .18s both;
        }
        .au-title em {
          font-style: normal;
          background: linear-gradient(90deg, #4ade80, #86efac);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .au-desc {
          font-size: 15px; font-weight: 300;
          color: rgba(203,213,225,0.4);
          line-height: 1.75;
          max-width: 340px;
          animation: auRise .6s .24s both;
        }

        .au-badges {
          display: flex; gap: 10px;
          margin-top: 40px;
          animation: auRise .6s .30s both;
          flex-wrap: wrap;
        }
        .au-badge {
          display: flex; align-items: center; gap: 6px;
          font-size: 11px; font-weight: 500;
          color: rgba(203,213,225,0.45);
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 8px;
          padding: 5px 10px;
        }
        .au-badge-dot { width: 5px; height: 5px; border-radius: 50%; background: #4ade80; }

        .au-ver {
          margin-top: 48px;
          font-size: 10.5px;
          color: rgba(203,213,225,0.14);
          letter-spacing: 0.08em;
          animation: auRise .6s .36s both;
        }

        /* ═══ SAĞ ═══ */
        .au-right {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          position: relative;
        }
        .au-right-glow {
          position: absolute; inset: 0; z-index: 0;
          background:
            radial-gradient(ellipse 55% 45% at 65% 25%, rgba(14,40,90,0.22) 0%, transparent 60%),
            radial-gradient(ellipse 45% 35% at 35% 78%, rgba(22,163,74,0.05) 0%, transparent 55%);
        }

        .au-card {
          position: relative; z-index: 1;
          width: 100%; max-width: 424px;
          background: rgba(5,12,26,0.93);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          border: 1px solid rgba(30,58,95,0.35);
          border-radius: 28px;
          padding: 48px 44px;
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.025),
            0 40px 100px rgba(0,0,0,0.75),
            0 0 70px rgba(14,40,90,0.15);
          animation: auCardIn .75s cubic-bezier(0.16,1,0.3,1) both;
        }
        /* Üst glow çizgisi: yeşil → lacivert */
        .au-card::before {
          content: '';
          position: absolute;
          top: -1px; left: 15%; right: 15%;
          height: 2px;
          background: linear-gradient(90deg, transparent, #4ade80 30%, #1e3a5f 70%, transparent);
          border-radius: 0 0 4px 4px;
          opacity: .7;
        }
        /* Köşe süsü */
        .au-card::after {
          content: '';
          position: absolute;
          top: 22px; right: 22px;
          width: 34px; height: 34px;
          border-top: 1px solid rgba(74,222,128,0.22);
          border-right: 1px solid rgba(74,222,128,0.22);
          border-radius: 0 8px 0 0;
        }

        .au-eyebrow {
          font-size: 11px; font-weight: 500;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: rgba(134,239,172,0.5);
          margin-bottom: 8px;
          animation: auRise .5s .22s both;
        }
        .au-card-title {
          font-size: 30px; font-weight: 700;
          letter-spacing: -0.5px;
          margin-bottom: 6px;
          animation: auRise .5s .27s both;
        }
        .au-card-sub {
          font-size: 14px; font-weight: 300;
          color: rgba(203,213,225,0.38);
          margin-bottom: 36px;
          animation: auRise .5s .32s both;
        }

        .au-field { margin-bottom: 18px; }
        .au-field:nth-child(1) { animation: auRise .5s .36s both; }
        .au-field:nth-child(2) { animation: auRise .5s .41s both; }

        .au-label {
          display: block;
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: rgba(203,213,225,0.45);
          margin-bottom: 8px;
        }

        .au-input-wrap { position: relative; }
        .au-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 15px 18px;
          color: #e8f0ff;
          font-family: 'Outfit', sans-serif;
          font-size: 15px;
          outline: none;
          transition: border-color .2s, background .2s, box-shadow .2s;
          -webkit-appearance: none;
        }
        .au-input::placeholder { color: rgba(203,213,225,0.16); }
        .au-input:focus {
          border-color: rgba(74,222,128,0.35);
          background: rgba(255,255,255,0.07);
          box-shadow: 0 0 0 3px rgba(74,222,128,0.07);
        }
        .au-input-pw { padding-right: 50px; }
        .au-input-err {
          border-color: #f87171 !important;
          box-shadow: 0 0 0 3px rgba(248,113,113,0.08) !important;
        }

        .au-eye-btn {
          position: absolute; right: 14px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: rgba(203,213,225,0.22);
          display: flex; align-items: center; padding: 4px;
          transition: color .2s;
        }
        .au-eye-btn:hover { color: rgba(203,213,225,0.65); }

        .au-error-box {
          display: flex; align-items: flex-start; gap: 8px;
          background: rgba(239,68,68,0.07);
          border: 1px solid rgba(239,68,68,0.22);
          border-radius: 12px;
          padding: 12px 14px;
          margin-bottom: 4px;
          animation: auRise .3s both;
        }
        .au-error-box span {
          color: #fca5a5;
          font-size: 13px;
          line-height: 1.4;
          font-family: 'Outfit', sans-serif;
        }

        .au-btn-wrap { margin-top: 26px; animation: auRise .5s .46s both; }
        .au-btn {
          width: 100%; padding: 16px;
          /* logonun lacivert → biraz daha koyu gradient */
          background: linear-gradient(135deg, #1e3a5f 0%, #0f2040 100%);
          border: 1px solid rgba(74,222,128,0.2);
          border-radius: 14px;
          color: #fff;
          font-family: 'Outfit', sans-serif;
          font-size: 15.5px; font-weight: 600;
          letter-spacing: 0.02em;
          cursor: pointer;
          position: relative; overflow: hidden;
          transition: transform .15s, box-shadow .2s, opacity .2s;
          box-shadow:
            0 8px 28px rgba(14,40,90,0.55),
            0 1px 0 rgba(255,255,255,0.08) inset;
        }
        .au-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 14px 38px rgba(14,40,90,0.7), 0 0 20px rgba(74,222,128,0.1);
        }
        .au-btn:active:not(:disabled) { transform: translateY(0); }
        .au-btn:disabled { opacity: .4; cursor: not-allowed; }
        /* Shimmer */
        .au-btn::after {
          content: ''; position: absolute; top: 0; left: -80%;
          width: 50%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.13), transparent);
          transform: skewX(-20deg);
        }
        .au-btn:hover:not(:disabled)::after { animation: auShimmer .5s ease forwards; }
        @keyframes auShimmer { from{left:-80%} to{left:140%} }

        .au-spinner { animation: auSpin .7s linear infinite; }
        @keyframes auSpin { to { transform: rotate(360deg); } }

        .au-footer {
          position: fixed; bottom: 20px; right: 26px;
          font-size: 11px; font-weight: 300;
          color: rgba(203,213,225,0.18);
          letter-spacing: 0.07em;
          font-family: 'Outfit', sans-serif;
          z-index: 10;
          animation: auRise .7s .65s both;
        }

        @keyframes auRise {
          from { opacity:0; transform:translateY(14px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes auCardIn {
          from { opacity:0; transform:translateY(26px) scale(0.97); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }

        /* ══ MOBİL ══ */
        @media (max-width: 768px) {
          html, body { overflow-y: auto; height: auto; }
          .au-page { grid-template-columns: 1fr; height: auto; min-height: 100vh; }
          .au-left { display: none; }
          .au-right { padding: 20px 16px 40px; align-items: flex-start; padding-top: 52px; }
          .au-card { padding: 32px 24px 28px; border-radius: 22px; max-width: 100%; }
          .au-mobile-logo { display: flex !important; }
          .au-card-title { font-size: 24px; }
          .au-card-sub { font-size: 13px; margin-bottom: 28px; }
          .au-input { font-size: 16px; padding: 14px 16px; }
          .au-input-pw { padding-right: 48px; }
          .au-btn { font-size: 15px; padding: 15px; }
        }
        @media (max-width: 400px) {
          .au-right { padding: 16px 12px 36px; padding-top: 40px; }
          .au-card { padding: 28px 18px 24px; border-radius: 18px; }
        }
        .au-mobile-logo { display: none; }
      `}</style>

      {/* Arka plan canvas */}
      <div className="au-scene">
        <canvas ref={canvasRef} />
        <div className="au-glow" />
      </div>

      <div className="au-page">

        {/* SOL PANEL */}
        <div className="au-left">
          <div className="au-logo-area">
            <img src="/ada-usta-logo-transparent.webp" alt="Ada Usta" style={{ width: 'auto', height: 64, objectFit: 'contain' }} />
          </div>

          <div className="au-tag">
            <div className="au-tag-dot" />
            Yönetim Paneli
          </div>

          <h1 className="au-title">
            KKTC'nin Güvenilir<br />
            <em>Usta Platformu</em>
          </h1>

          <p className="au-desc">
            Ada Usta yönetim paneli ile usta başvurularını, yorumları ve kategorileri tek ekrandan kolayca yönetin.
          </p>

          <div className="au-badges">
            <div className="au-badge"><div className="au-badge-dot" /> Hızlı</div>
            <div className="au-badge"><div className="au-badge-dot" /> Güvenli</div>
            <div className="au-badge"><div className="au-badge-dot" /> KKTC</div>
          </div>

          <div className="au-ver">ADA USTA · YÖNETİM PANELİ · YETKİSİZ ERİŞİM YASAKTIR</div>
        </div>

        {/* SAĞ PANEL */}
        <div className="au-right">
          <div className="au-right-glow" />

          <div className="au-card">
            {/* Mobilde logo */}
            <div className="au-mobile-logo" style={{ justifyContent: 'center', marginBottom: 28 }}>
              <img src="/ada-usta-logo-transparent.webp" alt="Ada Usta" style={{ width: 'auto', height: 56, objectFit: 'contain' }} />
            </div>

            <div className="au-eyebrow">Hoş Geldiniz</div>
            <div className="au-card-title">Giriş Yap</div>
            <div className="au-card-sub">Admin hesabınıza erişmek için bilgilerinizi girin</div>

            <form onSubmit={giris}>
              <div className="au-field">
                <label className="au-label">E-posta</label>
                <div className="au-input-wrap">
                  <input
                    type="email"
                    placeholder="admin@adausta.com"
                    className={`au-input${hata ? ' au-input-err' : ''}`}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    autoFocus
                    required
                  />
                </div>
              </div>

              <div className="au-field">
                <label className="au-label">Şifre</label>
                <div className="au-input-wrap">
                  <input
                    type={showSifre ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={`au-input au-input-pw${hata ? ' au-input-err' : ''}`}
                    value={sifre}
                    onChange={e => setSifre(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button type="button" className="au-eye-btn" onClick={() => setShowSifre(!showSifre)}>
                    {showSifre
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>

              {hata && (
                <div className="au-error-box">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fca5a5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span>{hata}</span>
                </div>
              )}

              <div className="au-btn-wrap">
                <button
                  type="submit"
                  className="au-btn"
                  disabled={yukleniyor || !email || !sifre}
                >
                  {yukleniyor
                    ? <svg className="au-spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                      </svg>
                    : 'Giriş Yap'
                  }
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>

      <div className="au-footer">Ada Usta Admin · KKTC</div>
    </>
  )
}
