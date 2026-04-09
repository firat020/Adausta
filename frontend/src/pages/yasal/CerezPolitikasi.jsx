import SEO from '../../components/SEO'

export default function CerezPolitikasi() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <SEO baslik="Çerez Politikası" url="/cerez-politikasi" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Çerez Politikası</h1>
      <p className="text-gray-500 text-sm mb-8">Son güncelleme: Nisan 2026 · Adissa Enterprises Ltd.</p>

      <div className="text-gray-700 space-y-6 text-sm leading-relaxed">

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">Çerez Nedir?</h2>
          <p>Çerezler, web sitelerinin tarayıcınıza yerleştirdiği küçük metin dosyalarıdır. Oturum bilgisi, dil tercihi gibi verileri hatırlamak için kullanılır.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">Kullandığımız Çerezler</h2>
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 font-semibold text-gray-700">Çerez</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-700">Amaç</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-700">Süre</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-100">
                <td className="px-3 py-2 font-mono text-xs">adausta_lang</td>
                <td className="px-3 py-2">Dil tercihi hatırlama</td>
                <td className="px-3 py-2">Kalıcı</td>
              </tr>
              <tr className="border-t border-gray-100">
                <td className="px-3 py-2 font-mono text-xs">session</td>
                <td className="px-3 py-2">Giriş oturumu yönetimi</td>
                <td className="px-3 py-2">Oturum</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">Çerezleri Yönetme</h2>
          <p>Tarayıcı ayarlarınızdan çerezleri devre dışı bırakabilirsiniz. Ancak bu durumda platformun bazı özellikleri düzgün çalışmayabilir.</p>
        </section>

      </div>
    </div>
  )
}
