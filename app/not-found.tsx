import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-7xl mb-5">🌸</div>
        <h1 className="text-6xl font-black text-gray-900 mb-3">404</h1>
        <p className="text-xl text-gray-600 mb-8">Сторінку не знайдено</p>
        <Link
          href="/"
          className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-3.5 rounded-2xl font-bold hover:from-pink-600 hover:to-purple-700 transition-all shadow-md"
        >
          ← На головну
        </Link>
      </div>
    </div>
  )
}
