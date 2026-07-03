import { useNavigate } from 'react-router-dom'

export default function Hosgeldin() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 px-6 py-12">
      {/* Logo + başlık */}
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <img
          src="/ada-usta-logo-transparent.png"
          alt="Adausta"
          className="w-32 h-32 object-contain mb-6 drop-shadow-xl"
        />
        <h1 className="text-white text-3xl font-bold mb-2">Adausta'ya Hoşgeldiniz</h1>
        <p className="text-blue-200 text-base max-w-xs">
          KKTC'nin en büyük usta ve hizmet platformu
        </p>
      </div>

      {/* Butonlar */}
      <div className="w-full max-w-sm flex flex-col gap-3 pb-4">
        <button
          onClick={() => navigate('/usta/giris')}
          className="w-full py-4 bg-white text-blue-800 font-bold text-lg rounded-2xl shadow-lg active:scale-95 transition-transform"
        >
          Usta Girisi
        </button>

        <button
          onClick={() => navigate('/giris')}
          className="w-full py-4 bg-blue-500 text-white font-bold text-lg rounded-2xl shadow-lg border border-blue-400 active:scale-95 transition-transform"
        >
          Musteri Girisi
        </button>

        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px bg-blue-500" />
          <span className="text-blue-300 text-sm">veya</span>
          <div className="flex-1 h-px bg-blue-500" />
        </div>

        <button
          onClick={() => navigate('/usta-kayit')}
          className="w-full py-3 bg-transparent text-white font-semibold text-base rounded-2xl border border-white/40 active:scale-95 transition-transform"
        >
          Usta Olarak Kaydol
        </button>

        <button
          onClick={() => navigate('/')}
          className="w-full py-3 text-blue-300 text-sm text-center"
        >
          Giris yapmadan devam et
        </button>
      </div>
    </div>
  )
}
