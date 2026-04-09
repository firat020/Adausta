export default function AdaUstaLogo({ boyut = 36, className = '' }) {
  return (
    <svg
      width={boyut}
      height={boyut}
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="au-grad" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0c1e4a" />
          <stop offset="1" stopColor="#1e40af" />
        </linearGradient>
      </defs>

      {/* Arka plan */}
      <rect width="44" height="44" rx="11" fill="url(#au-grad)" />

      {/* Anahtar (wrench) ikonu — lucide stili, ölçeklenmiş */}
      <g
        transform="translate(7, 5) scale(1.2)"
        stroke="white"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-4.69 4.69a2.12 2.12 0 0 1-3-3l4.69-4.69a6 6 0 0 1 7.94-7.94z" />
      </g>

      {/* Ada dalgası — sarı vurgu */}
      <path
        d="M6 39 Q14 34 22 38 Q30 42 38 37"
        stroke="#facc15"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}
