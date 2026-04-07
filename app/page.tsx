import Link from 'next/link'
import { PLANS } from '@/lib/plans'
import { prisma } from '@/lib/prisma'

const testimonials = [
  {
    name: 'Оксана Литвин',
    shop: 'Квіткова Хата, Львів',
    initials: 'ОЛ',
    quote: 'За перший місяць отримала 40+ замовлень через сторінку. Раніше всі писали в директ, тепер все зручно в одному місці.',
  },
  {
    name: 'Марина Коваль',
    shop: 'Троянди & Ко, Київ',
    initials: 'МК',
    quote: 'Налаштувала магазин за вечір. Клієнти кажуть що сайт виглядає дуже красиво і зручно замовляти.',
  },
  {
    name: 'Наталія Сидоренко',
    shop: 'Букет Мрії, Харків',
    initials: 'НС',
    quote: 'Telegram-сповіщення — це просто кайф. Замовлення приходять одразу, підтверджую в один клік прямо з телефону.',
  },
  {
    name: 'Ірина Мельник',
    shop: 'Квіти від Ірини, Одеса',
    initials: 'ІМ',
    quote: 'Спочатку боялась що складно. Але все виявилось простіше ніж в Instagram. Рекомендую всім флористам!',
  },
]

function formatCount(n: number): string {
  if (n < 10) return String(n)
  if (n < 100) return `${Math.floor(n / 10) * 10}+`
  return `${Math.floor(n / 100) * 100}+`
}

export default async function Home() {
  const [shopCount, orderCount] = await Promise.all([
    prisma.shop.count({ where: { suspended: false } }),
    prisma.order.count(),
  ]).catch(() => [0, 0] as [number, number])

  const shopCountDisplay  = formatCount(shopCount)
  const orderCountDisplay = formatCount(orderCount)
  const heroShopLabel     = shopCount > 0 ? `${shopCountDisplay} флористів` : 'флористів'

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* ===== NAVBAR ===== */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-5 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-sm shadow-lg shadow-pink-500/20">
              🌸
            </div>
            <span className="text-base font-bold tracking-tight text-white">FlowerGoUa</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {[['#how-it-works','Як це працює'],['#features','Можливості'],['#trust','Відгуки'],['#pricing','Ціни']].map(([href, label]) => (
              <a key={href} href={href}
                className="px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/login"
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
              Увійти
            </Link>
            <Link href="/signup"
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 transition-all shadow-lg shadow-pink-500/25">
              Почати безкоштовно
            </Link>
          </div>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-[120px]" />
          <div className="absolute top-20 right-1/4 w-80 h-80 bg-purple-600/20 rounded-full blur-[100px]" />
        </div>
        <div className="absolute inset-0 opacity-[0.035]"
          style={{ backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`, backgroundSize: '28px 28px' }}
        />

        <div className="relative max-w-6xl mx-auto px-5 pt-24 pb-20 md:pt-32 md:pb-28">
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-xs font-medium text-gray-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              🇺🇦 Платформа для українських флористів
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-center leading-[1.08] tracking-tight mb-6 max-w-4xl mx-auto">
            Ваш квітковий магазин{' '}
            <span className="bg-gradient-to-r from-pink-400 via-pink-300 to-purple-400 bg-clip-text text-transparent">
              онлайн за 5 хвилин
            </span>
          </h1>

          <p className="text-center text-gray-400 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-10">
            Зручний міні-сайт для флориста. Каталог, замовлення, Telegram-сповіщення —
            без програмістів і складних налаштувань.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <Link href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-semibold text-sm transition-all shadow-xl shadow-pink-500/25">
              Створити магазин безкоштовно
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
            <a href="#how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold text-sm transition-all">
              Як це працює
            </a>
          </div>

          <div className="flex items-center justify-center gap-3">
            <div className="flex -space-x-2">
              {['ОЛ','МК','НС','ІМ'].map((init, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-gray-950 bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white">
                  {init}
                </div>
              ))}
            </div>
            <div className="text-sm text-gray-400">
              <span className="text-white font-semibold">{heroShopLabel}</span> вже продають через FlowerGoUa
            </div>
          </div>
        </div>

        {/* Product preview */}
        <div className="relative max-w-4xl mx-auto px-5 pb-24">
          <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/60 bg-gray-900">
            <div className="bg-gray-800/80 border-b border-white/5 px-4 py-3 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
              </div>
              <div className="flex-1 bg-gray-700/50 rounded-md px-3 py-1 text-xs text-gray-400 text-center">
                flowergoua.com/kvity-vid-mariyi
              </div>
            </div>
            <div className="p-6 bg-gradient-to-br from-pink-950/30 to-gray-900">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-0.5">Квіти від Марії 🌸</h3>
                  <p className="text-sm text-gray-400">Київ · Пн–Сб 9:00–19:00</p>
                </div>
                <span className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-medium">● Онлайн</span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { name: 'Троянди мікс', price: '₴450', color: 'from-pink-900/40 to-rose-900/40' },
                  { name: 'Весняний букет', price: '₴320', color: 'from-purple-900/40 to-pink-900/40', badge: 'Мало' },
                  { name: 'Піоновий', price: '₴680', color: 'from-rose-900/40 to-orange-900/40' },
                ].map((flower, i) => (
                  <div key={i} className={`bg-gradient-to-br ${flower.color} border border-white/5 rounded-xl p-3`}>
                    <div className="h-16 rounded-lg bg-white/5 mb-2 flex items-center justify-center text-2xl">🌸</div>
                    <p className="text-xs font-medium text-white truncate">{flower.name}</p>
                    <p className="text-xs text-pink-400 font-semibold">{flower.price}</p>
                    {flower.badge && <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-full">{flower.badge}</span>}
                  </div>
                ))}
              </div>
              <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-2 font-medium">Нові замовлення</p>
                {[
                  { name: 'Олена К.', item: 'Троянди мікс', time: '2 хв' },
                  { name: 'Дмитро В.', item: 'Весняний букет', time: '14 хв' },
                ].map((o, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 text-xs">
                    <span className="text-gray-300 font-medium">{o.name} — {o.item}</span>
                    <span className="text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">{o.time} тому</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-pink-600/10 blur-3xl rounded-full pointer-events-none" />
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="relative bg-gray-950 overflow-hidden">
        {/* Subtle top separator */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`, backgroundSize: '28px 28px' }}
        />
        <div className="absolute top-1/2 left-0 w-72 h-72 bg-pink-600/8 rounded-full blur-[80px] -translate-y-1/2 pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-5 py-20 md:py-28">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-pink-400 uppercase tracking-widest mb-3">Простий процес</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
              Від нуля до першого замовлення
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-base">
              Чотири кроки — і ваш магазин готовий приймати замовлення онлайн.
            </p>
          </div>

          {/* Steps — horizontal connected line on desktop */}
          <div className="relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-pink-500/0 via-pink-500/40 to-pink-500/0" />

            <div className="grid md:grid-cols-4 gap-8 md:gap-6">
              {[
                {
                  num: '01',
                  title: 'Оберіть план',
                  text: 'Безкоштовний план доступний назавжди. Оновлюйте коли зростете.',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                  ),
                },
                {
                  num: '02',
                  title: 'Створіть акаунт',
                  text: 'Реєстрація займає менше хвилини — тільки email і пароль.',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  ),
                },
                {
                  num: '03',
                  title: 'Налаштуйте магазин',
                  text: 'Додайте букети, фото, опис і контакти в простому дашборді.',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  ),
                },
                {
                  num: '04',
                  title: 'Поділіться посиланням',
                  text: 'Надішліть посилання в Instagram або WhatsApp — і починайте.',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                  ),
                },
              ].map((step, idx) => (
                <div key={step.num} className="flex flex-col items-center md:items-center text-center relative">
                  {/* Circle with icon */}
                  <div className="relative mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-600/20 border border-white/10 flex items-center justify-center text-pink-400 backdrop-blur-sm shadow-lg shadow-black/20">
                      {step.icon}
                    </div>
                    {/* Step number badge */}
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white shadow-md">
                      {idx + 1}
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-[200px]">{step.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA under steps */}
          <div className="text-center mt-14">
            <Link href="/signup"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-semibold text-sm transition-all shadow-xl shadow-pink-500/25">
              Спробувати безкоштовно
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="bg-white">
        <div className="max-w-6xl mx-auto px-5 py-20 md:py-28">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-pink-600 uppercase tracking-widest mb-3">Можливості</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
              Все що потрібно флористу
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Без зайвого. Тільки інструменти, які справді допомагають продавати.
            </p>
          </div>

          {/* Big feature cards — 2 wide + 4 small */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Large card 1 */}
            <div className="md:col-span-2 bg-gray-950 rounded-3xl p-8 flex flex-col justify-between min-h-[240px] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-pink-600/10 rounded-full blur-[60px] group-hover:bg-pink-600/15 transition-colors pointer-events-none" />
              <div>
                <div className="w-12 h-12 rounded-2xl bg-pink-500/20 border border-pink-500/20 flex items-center justify-center text-pink-400 mb-5">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Каталог букетів</h3>
                <p className="text-gray-400 text-sm leading-relaxed max-w-md">
                  Додавайте букети з фото, цінами та наявністю. Швидко оновлюйте перед святами — жодного програміста не потрібно.
                </p>
              </div>
              <div className="flex items-center gap-2 mt-6">
                <span className="text-xs text-pink-400 bg-pink-400/10 border border-pink-400/20 px-3 py-1 rounded-full">Фото</span>
                <span className="text-xs text-pink-400 bg-pink-400/10 border border-pink-400/20 px-3 py-1 rounded-full">Ціни</span>
                <span className="text-xs text-pink-400 bg-pink-400/10 border border-pink-400/20 px-3 py-1 rounded-full">Наявність</span>
              </div>
            </div>

            {/* Large card 2 */}
            <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-3xl p-8 flex flex-col justify-between min-h-[240px] relative overflow-hidden">
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-[40px] pointer-events-none" />
              <div>
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white mb-5">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Telegram-сповіщення</h3>
                <p className="text-white/80 text-sm leading-relaxed">
                  Замовлення приходять в Telegram з кнопками «Підтвердити» і «Скасувати» — без входу в дашборд.
                </p>
              </div>
              <div className="mt-6 bg-white/15 rounded-2xl px-4 py-3 text-sm text-white font-medium">
                ✅ Нове замовлення від Олени К.
              </div>
            </div>

            {/* 4 small cards */}
            {[
              {
                title: 'Зручні замовлення',
                text: 'Клієнти замовляють прямо зі сторінки. Ви отримуєте контакти і підтверджуєте в один клік.',
                icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>,
                accent: 'text-blue-600 bg-blue-50 border-blue-100',
              },
              {
                title: 'Ваш дизайн',
                text: 'Власні кольори, логотип, фото обкладинки. Магазин виглядає так, як ви хочете.',
                icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>,
                accent: 'text-purple-600 bg-purple-50 border-purple-100',
              },
              {
                title: 'Зони доставки',
                text: 'Налаштуйте міста і вартість доставки. Клієнти бачать ціну одразу при замовленні.',
                icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
                accent: 'text-emerald-600 bg-emerald-50 border-emerald-100',
              },
              {
                title: 'Аналітика',
                text: 'Статистика замовлень, доходу і популярних букетів. Знайте що продається найкраще.',
                icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
                accent: 'text-amber-600 bg-amber-50 border-amber-100',
              },
            ].map((f) => (
              <div key={f.title} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow group">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 ${f.accent}`}>
                  {f.icon}
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section id="trust" className="bg-gray-950 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-purple-600/8 rounded-full blur-[100px] -translate-y-1/2 pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`, backgroundSize: '28px 28px' }}
        />

        <div className="relative max-w-6xl mx-auto px-5 py-20 md:py-28">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-pink-400 uppercase tracking-widest mb-3">Відгуки</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
              Флористи нам довіряють
            </h2>
            <p className="text-gray-500">
              Реальні відгуки від власників квіткових магазинів по всій Україні
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
            {testimonials.map((t) => (
              <div key={t.name}
                className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 flex flex-col hover:bg-white/[0.06] hover:border-white/[0.12] transition-all">
                {/* Stars */}
                <div className="flex gap-1 mb-5">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed flex-1 mb-6">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-white/[0.06]">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.shop}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: shopCountDisplay  || '—', label: 'Активних магазинів' },
              { value: orderCountDisplay || '—', label: 'Замовлень оброблено' },
              { value: '5 хв',                   label: 'Середній час налаштування' },
              { value: '4.9 ★',                  label: 'Середня оцінка' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 text-center">
                <p className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent mb-1">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="bg-white">
        <div className="max-w-6xl mx-auto px-5 py-20 md:py-28">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-pink-600 uppercase tracking-widest mb-3">Тарифи</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
              Прозорі ціни, без сюрпризів
            </h2>
            <p className="text-gray-500">
              Починайте безкоштовно. Оновлюйте коли готові. Без контрактів.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {PLANS.map((plan) => (
              <div key={plan.slug}
                className={`relative flex flex-col rounded-2xl p-7 transition-all ${
                  plan.highlight
                    ? 'bg-gray-950 text-white shadow-2xl ring-2 ring-pink-500/50 scale-[1.02]'
                    : 'bg-white border border-gray-200 shadow-sm hover:shadow-md'
                }`}>
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[11px] font-bold px-4 py-1 rounded-full shadow-lg shadow-pink-500/30">
                    Найпопулярніший
                  </div>
                )}
                <div className="mb-6">
                  <h3 className={`text-base font-bold mb-1 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className={`text-3xl font-bold ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>{plan.priceLabel}</span>
                  </div>
                  <p className={`text-sm ${plan.highlight ? 'text-gray-400' : 'text-gray-500'}`}>{plan.tagline}</p>
                </div>
                <ul className="space-y-3 flex-1 mb-7">
                  {plan.features.map((f, i) => (
                    <li key={i} className={`flex items-start gap-2.5 text-sm ${plan.highlight ? 'text-gray-300' : 'text-gray-600'}`}>
                      <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.highlight ? 'text-pink-400' : 'text-pink-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={`/signup?plan=${plan.slug}`}
                  className={`block text-center py-3 rounded-xl text-sm font-semibold transition-all ${
                    plan.highlight
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-400 hover:to-purple-500 shadow-lg shadow-pink-500/25'
                      : 'border-2 border-gray-200 text-gray-700 hover:border-pink-300 hover:text-pink-600'
                  }`}>
                  Обрати {plan.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="bg-gray-950 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute inset-0 opacity-[0.035]"
          style={{ backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`, backgroundSize: '28px 28px' }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] pointer-events-none">
          <div className="absolute inset-0 bg-pink-600/15 rounded-full blur-[100px]" />
          <div className="absolute inset-8 bg-purple-600/15 rounded-full blur-[80px]" />
        </div>

        <div className="relative max-w-3xl mx-auto px-5 py-24 md:py-32 text-center">
          <p className="text-xs font-semibold text-pink-400 uppercase tracking-widest mb-5">Починайте сьогодні</p>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-5 leading-tight tracking-tight">
            Дайте вашому магазину{' '}
            <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              красиву онлайн-сторінку
            </span>
          </h2>
          <p className="text-gray-400 text-lg mb-10">
            Приєднуйтесь до флористів, що вже продають через FlowerGoUa. Безкоштовно назавжди.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-semibold transition-all shadow-2xl shadow-pink-500/25 text-sm">
              Створити магазин безкоштовно
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
            <Link href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold transition-all text-sm">
              Увійти в акаунт
            </Link>
          </div>
          <p className="mt-5 text-xs text-gray-600">Без кредитної картки. Без прихованих платежів.</p>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-gray-950 border-t border-white/[0.05]">
        <div className="max-w-6xl mx-auto px-5 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-sm">🌸</div>
            <span className="font-bold text-white text-sm">FlowerGoUa</span>
          </div>
          <p className="text-xs text-gray-600">© {new Date().getFullYear()} FlowerGoUa. Зроблено з ❤️ для українських флористів.</p>
          <div className="flex items-center gap-5 text-xs text-gray-600">
            <Link href="/login"            className="hover:text-white transition-colors">Увійти</Link>
            <Link href="/signup"           className="hover:text-white transition-colors">Реєстрація</Link>
            <a href="#pricing"              className="hover:text-white transition-colors">Ціни</a>
            <Link href="/privacy"          className="hover:text-white transition-colors">Конфіденційність</Link>
            <Link href="/terms"            className="hover:text-white transition-colors">Умови</Link>
            <Link href="/data-compliance"  className="hover:text-white transition-colors">Дані</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
