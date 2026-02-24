import Link from 'next/link'
import { PLANS } from '@/lib/plans'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-white">

      {/* ===== NAVBAR ===== */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-pink-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🌸</span>
            <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
              FlowerGoUa
            </span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#how-it-works" className="hover:text-pink-600 transition-colors">Як це працює</a>
            <a href="#features" className="hover:text-pink-600 transition-colors">Можливості</a>
            <a href="#pricing" className="hover:text-pink-600 transition-colors">Ціни</a>
          </div>

          {/* Auth buttons */}
          <div className="flex items-center gap-3">
            <Link href="/login"
              className="text-sm font-semibold text-gray-600 hover:text-pink-600 transition-colors px-3 py-2 rounded-lg hover:bg-pink-50">
              Увійти
            </Link>
            <Link href="/signup"
              className="text-sm font-semibold text-white bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-2 rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all shadow-md">
              Створити магазин
            </Link>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="border-b border-pink-100 bg-gradient-to-br from-pink-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <p className="inline-flex items-center rounded-full bg-pink-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-pink-700 mb-5">
                🇺🇦 Для українських квіткових магазинів
              </p>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-5 leading-tight">
                Найпростіший спосіб вивести ваш{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
                  квітковий магазин онлайн
                </span>
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                FlowerGoUa — це зручний конструктор міні-сайтів для флористів. Створіть сторінку вашого магазину, поділіться посиланням і починайте отримувати замовлення за кілька хвилин — без програмістів і складних налаштувань.
              </p>
              <div className="flex flex-wrap gap-4 mb-4">
                <Link href="/signup"
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg hover:from-pink-600 hover:to-purple-700 transition-all">
                  Почати за 5 хвилин →
                </Link>
                <a href="#pricing"
                  className="inline-flex items-center justify-center rounded-xl border-2 border-pink-200 bg-white px-7 py-3.5 text-sm font-bold text-pink-700 hover:bg-pink-50 transition-colors">
                  Переглянути плани
                </a>
              </div>
              <p className="text-xs text-gray-400">
                Без прихованих платежів. Безкоштовний план назавжди.
              </p>
            </div>

            {/* Feature preview card */}
            <div className="md:pl-8">
              <div className="rounded-3xl border border-pink-100 bg-white shadow-xl p-6 space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                  <span className="text-2xl">🌸</span>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Квіти від Марії</p>
                    <p className="text-xs text-gray-400">flowergoua.com/kvity-vid-mariyi</p>
                  </div>
                </div>
                {[
                  { icon: '💐', text: 'Каталог букетів з фото і цінами' },
                  { icon: '📲', text: 'Замовлення прямо на сторінці' },
                  { icon: '✈️', text: 'Сповіщення в Telegram' },
                  { icon: '📊', text: 'Дашборд для керування' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-gray-700">
                    <span className="text-lg">{item.icon}</span>
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-10 text-center">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">Як це працює</h2>
            <p className="text-gray-500">Від "немає сайту" до "є посилання для клієнтів" за кілька кроків</p>
          </div>
          <div className="grid gap-6 md:grid-cols-4">
            {[
              { step: '01', icon: '🗂️', title: 'Оберіть план', text: 'Виберіть план під ваш розмір. Завжди можна оновити пізніше.' },
              { step: '02', icon: '✍️', title: 'Створіть акаунт', text: 'Зареєструйтесь з email вашого магазину.' },
              { step: '03', icon: '🌺', title: 'Налаштуйте магазин', text: 'Назва, фото, опис, букети — все в зручному дашборді.' },
              { step: '04', icon: '📣', title: 'Поділіться посиланням', text: 'Надішліть посилання клієнтам в Instagram чи WhatsApp.' },
            ].map((item) => (
              <div key={item.step} className="rounded-2xl border border-gray-100 bg-gray-50 px-5 py-6">
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-8 w-8 flex items-center justify-center rounded-full bg-pink-100 text-xs font-bold text-pink-700">{item.step}</div>
                  <span className="text-xl">{item.icon}</span>
                </div>
                <h3 className="mb-1 text-sm font-bold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="border-b border-gray-100 bg-gradient-to-b from-white to-pink-50">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-10 text-center">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">Створено для реальних флористів</h2>
            <p className="text-gray-500">Без складних систем. Тільки те, що вам справді потрібно.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: '💐', title: 'Каталог букетів', text: 'Додавайте букети з фото, цінами та наявністю. Оновлюйте швидко перед святами.' },
              { icon: '📬', title: 'Замовлення і запити', text: 'Клієнти замовляють прямо зі сторінки. Ви отримуєте контакти і підтверджуєте зручним способом.' },
              { icon: '✈️', title: 'Telegram сповіщення', text: 'Отримуйте замовлення в Telegram з кнопками "Підтвердити" та "Скасувати" — без входу в дашборд.' },
              { icon: '🎨', title: 'Кастомний дизайн', text: 'Ваші кольори, логотип, фото обкладинки. Магазин виглядає саме так, як ви хочете.' },
              { icon: '🚚', title: 'Зони доставки', text: 'Налаштуйте зони і вартість доставки. Клієнти бачать ціну відразу при замовленні.' },
              { icon: '📊', title: 'Аналітика', text: 'Статистика замовлень, доходу і популярних букетів. Знайте що продається найкраще.' },
            ].map((f, i) => (
              <div key={i} className="rounded-2xl bg-white p-6 shadow-sm border border-pink-100">
                <div className="mb-3 text-3xl">{f.icon}</div>
                <h3 className="mb-2 font-bold text-gray-900">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-10 text-center">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">Прості плани що ростуть разом з вами</h2>
            <p className="text-gray-500">Починайте безкоштовно, оновлюйте коли готові. Без контрактів.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {PLANS.map((plan) => (
              <div key={plan.slug}
                className={`flex flex-col rounded-2xl border-2 bg-white p-6 ${
                  plan.highlight ? 'border-pink-500 shadow-xl relative' : 'border-gray-200 shadow-sm'
                }`}>
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                    Найпопулярніший
                  </div>
                )}
                <div className="text-3xl mb-3">{plan.slug === 'free' ? '🌱' : plan.slug === 'basic' ? '🌸' : '🌺'}</div>
                <h3 className="text-lg font-black text-gray-900 mb-1">{plan.name}</h3>
                <p className="text-2xl font-black text-gray-900 mb-1">{plan.priceLabel}</p>
                <p className="text-sm text-gray-500 mb-5">{plan.tagline}</p>
                <ul className="mb-6 space-y-2 flex-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-green-500 mt-0.5">✓</span>{f}
                    </li>
                  ))}
                </ul>
                <Link href={`/signup?plan=${plan.slug}`}
                  className={`text-center py-3 rounded-xl text-sm font-bold transition-all ${
                    plan.highlight
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 shadow-md'
                      : 'border-2 border-gray-200 text-gray-800 hover:border-pink-300 hover:text-pink-600'
                  }`}>
                  Обрати {plan.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="bg-gradient-to-r from-pink-500 to-purple-600">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-black text-white mb-3">
            Готові дати вашому магазину красиву онлайн-сторінку?
          </h2>
          <p className="text-pink-100 mb-8">
            Створіть сторінку для ваших букетів, поділіться посиланням і нехай квіти продають самі.
          </p>
          <Link href="/signup"
            className="inline-flex items-center justify-center rounded-xl bg-white text-pink-600 px-8 py-4 text-sm font-black shadow-xl hover:bg-pink-50 transition-colors">
            🌸 Створити магазин безкоштовно
          </Link>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌸</span>
            <span className="font-black text-white">FlowerGoUa</span>
          </div>
          <p className="text-xs">© 2025 FlowerGoUa. Зроблено з ❤️ для українських флористів.</p>
          <div className="flex gap-4 text-xs">
            <Link href="/login" className="hover:text-white transition-colors">Увійти</Link>
            <Link href="/signup" className="hover:text-white transition-colors">Реєстрація</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
