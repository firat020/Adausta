import { useEffect, useRef, useState } from 'react'
import axios from 'axios'

import API from '../config.js'
// API

export default function CokYakinda() {
  const canvasRef = useRef(null)
  const [email, setEmail] = useState('')
  const [gonderildi, setGonderildi] = useState(false)

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

    for (let i = 0; i < 70; i++) pts.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.6 + 0.3,
      s: Math.random() * 0.35 + 0.08,
      o: Math.random() * 0.45 + 0.05,
      d: (Math.random() - 0.5) * 0.18,
      g: Math.random() < 0.15,
    })

    function draw() {
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#040d1c'
      ctx.fillRect(0, 0, W, H)
      pts.forEach(p => {
        p.y -= p.s; p.x += p.d
        if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W }
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = p.g ? `rgba(74,222,128,${p.o})` : `rgba(148,175,220,${p.o})`
        ctx.fill()
      })
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId) }
  }, [])

  const abone = async (e) => {
    e.preventDefault()
    try {
      await axios.post(`${API}/api/ayarlar/abone`, { email })
      setGonderildi(true)
    } catch {
      setGonderildi(true)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { overflow: hidden; }

        .cy-scene { position: fixed; inset: 0; z-index: 0; }
        .cy-scene canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
        .cy-glow {
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 60% 55% at 50% 40%, rgba(14,40,90,0.5) 0%, transparent 65%),
            radial-gradient(ellipse 35% 30% at 80% 80%, rgba(22,163,74,0.07) 0%, transparent 55%);
        }

        .cy-page {
          position: relative; z-index: 1;
          height: 100vh;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 24px;
          font-family: 'Outfit', sans-serif;
          color: #e8f0ff;
          text-align: center;
        }

        .cy-logo { animation: cyRise .7s .05s both; margin-bottom: 28px; }
        .cy-logo img { width: 80px; height: 80px; object-fit: contain; filter: drop-shadow(0 0 24px rgba(74,222,128,0.3)); }

        .cy-tag {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(22,163,74,0.09);
          border: 1px solid rgba(74,222,128,0.25);
          border-radius: 100px;
          padding: 7px 18px;
          font-size: 11.5px; font-weight: 500;
          color: rgba(134,239,172,0.9);
          letter-spacing: 0.1em; text-transform: uppercase;
          margin-bottom: 28px;
          animation: cyRise .7s .12s both;
        }
        .cy-tag-dot { width: 7px; height: 7px; border-radius: 50%; background: #4ade80; box-shadow: 0 0 8px #4ade80; flex-shrink: 0; animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(.85)} }

        .cy-title {
          font-size: clamp(38px, 6vw, 72px);
          font-weight: 900;
          line-height: 1.05;
          letter-spacing: -2px;
          margin-bottom: 20px;
          animation: cyRise .7s .2s both;
        }
        .cy-title em {
          font-style: normal;
          background: linear-gradient(90deg, #4ade80, #86efac, #4ade80);
          background-size: 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }
        @keyframes shimmer { from{background-position:0%} to{background-position:200%} }

        .cy-sub {
          font-size: clamp(16px, 2.5vw, 22px);
          font-weight: 300;
          color: rgba(203,213,225,0.55);
          max-width: 560px;
          line-height: 1.65;
          margin-bottom: 14px;
          animation: cyRise .7s .28s both;
        }

        .cy-desc {
          font-size: 14px;
          font-weight: 400;
          color: rgba(203,213,225,0.35);
          max-width: 460px;
          line-height: 1.7;
          margin-bottom: 44px;
          animation: cyRise .7s .34s both;
        }

        .cy-form {
          display: flex; gap: 10px;
          width: 100%; max-width: 420px;
          animation: cyRise .7s .42s both;
        }
        .cy-input {
          flex: 1;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          padding: 14px 18px;
          color: #e8f0ff;
          font-family: 'Outfit', sans-serif;
          font-size: 14px;
          outline: none;
          transition: border-color .2s, box-shadow .2s;
        }
        .cy-input::placeholder { color: rgba(203,213,225,0.2); }
        .cy-input:focus { border-color: rgba(74,222,128,0.4); box-shadow: 0 0 0 3px rgba(74,222,128,0.08); }

        .cy-btn {
          padding: 14px 22px;
          background: linear-gradient(135deg, #16a34a, #15803d);
          border: none; border-radius: 14px;
          color: #fff;
          font-family: 'Outfit', sans-serif;
          font-size: 14px; font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: transform .15s, box-shadow .2s;
          box-shadow: 0 6px 20px rgba(22,163,74,0.3);
        }
        .cy-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(22,163,74,0.4); }
        .cy-btn:active { transform: translateY(0); }

        .cy-success {
          display: flex; align-items: center; gap: 8px;
          padding: 14px 22px;
          background: rgba(22,163,74,0.1);
          border: 1px solid rgba(74,222,128,0.25);
          border-radius: 14px;
          font-size: 14px;
          color: rgba(134,239,172,0.9);
          animation: cyRise .4s both;
        }

        .cy-divider {
          display: flex; align-items: center; gap: 16px;
          width: 100%; max-width: 420px;
          margin: 20px 0;
          animation: cyRise .7s .48s both;
        }
        .cy-divider-line { flex: 1; height: 1px; background: rgba(255,255,255,0.06); }
        .cy-divider span { font-size: 11px; color: rgba(203,213,225,0.2); letter-spacing: .08em; }

        .cy-badges {
          display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;
          animation: cyRise .7s .52s both;
        }
        .cy-badge {
          display: flex; align-items: center; gap: 6px;
          font-size: 11.5px; font-weight: 500;
          color: rgba(203,213,225,0.4);
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px;
          padding: 6px 12px;
        }
        .cy-badge-dot { width: 5px; height: 5px; border-radius: 50%; background: #4ade80; }

        .cy-footer {
          position: fixed; bottom: 20px;
          font-size: 11px; font-weight: 300;
          color: rgba(203,213,225,0.15);
          letter-spacing: .07em;
          font-family: 'Outfit', sans-serif;
          animation: cyRise .8s .7s both;
        }

        @keyframes cyRise { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }

        @media (max-width: 600px) {
          body { overflow-y: auto; }
          .cy-page { height: auto; min-height: 100vh; padding: 40px 20px; }
          .cy-form { flex-direction: column; }
          .cy-btn { width: 100%; }
        }
      `}</style>

      <div className="cy-scene">
        <canvas ref={canvasRef} />
        <div className="cy-glow" />
      </div>

      <div className="cy-page">
        <div className="cy-logo">
          <img src="/favicon.svg" alt="Ada Usta" />
        </div>

        <div className="cy-tag">
          <div className="cy-tag-dot" />
          Yakında Yayında
        </div>

        <h1 className="cy-title">
          Çok Yakında<br />
          <em>Ada Usta</em>
        </h1>

        <p className="cy-sub">
          Adanın ustaları müşterilerine ulaşıyor.
        </p>

        <p className="cy-desc">
          KKTC'nin en güvenilir usta ve hizmet platformu çok yakında hizmetinizdedir.
          Elektrikçi, tesisatçı, boyacı, klima servisi ve daha fazlası — hepsi bir tık uzakta.
        </p>

        {!gonderildi ? (
          <form className="cy-form" onSubmit={abone}>
            <input
              type="email"
              className="cy-input"
              placeholder="E-posta adresinizi girin"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <button type="submit" className="cy-btn">Haberdar Et</button>
          </form>
        ) : (
          <div className="cy-success">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Haberdar edileceksiniz!
          </div>
        )}

        <div className="cy-divider">
          <div className="cy-divider-line" />
          <span>ADA USTA · KKTC</span>
          <div className="cy-divider-line" />
        </div>

        <div className="cy-badges">
          <div className="cy-badge"><div className="cy-badge-dot" /> Lefkoşa</div>
          <div className="cy-badge"><div className="cy-badge-dot" /> Girne</div>
          <div className="cy-badge"><div className="cy-badge-dot" /> Gazimağusa</div>
          <div className="cy-badge"><div className="cy-badge-dot" /> Güzelyurt</div>
          <div className="cy-badge"><div className="cy-badge-dot" /> İskele</div>
        </div>
      </div>

      <div className="cy-footer">adausta.com · Yakında</div>
    </>
  )
}
