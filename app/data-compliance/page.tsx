import React from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Дані та відповідність — FlowerGoUa',
  description: 'Інформація про обробку даних, GDPR, безпеку і відповідність стандартам на платформі FlowerGoUa.',
}

export default function DataCompliancePage() {
  return (
    <div>

      {/* ── Header ── */}
      <div className="mb-10 pb-8 border-b border-white/[0.06]">
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 text-xs font-medium text-emerald-400 mb-4">
          🛡️ Безпека та відповідність
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Дані та відповідність</h1>
        <p className="text-gray-500 text-sm">Остання редакція: 1 квітня 2025 р.</p>
        <p className="mt-4 text-gray-400 text-sm leading-relaxed max-w-2xl">
          Ця сторінка пояснює технічні та організаційні заходи, які FlowerGoUa вживає
          для захисту даних, забезпечення відповідності законодавству та безпечної
          обробки інформації всіх учасників платформи.
        </p>
      </div>

      {/* ── Badges ── */}
      <div className="flex flex-wrap gap-2 mb-10">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-emerald-500/10 border-emerald-500/20 text-emerald-400">✓ GDPR сумісність</span>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-blue-500/10 border-blue-500/20 text-blue-400">✓ Закон України про захист персональних даних</span>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-purple-500/10 border-purple-500/20 text-purple-400">✓ HTTPS / TLS 1.3</span>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-amber-500/10 border-amber-500/20 text-amber-400">✓ bcrypt шифрування паролів</span>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-emerald-500/10 border-emerald-500/20 text-emerald-400">✓ Нульове зберігання повних реквізитів карток</span>
      </div>

      {/* ── 1 ── */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-pink-500 to-purple-600 rounded-full inline-block flex-shrink-0" />
          1. Законодавча база
        </h2>
        <div className="pl-3 space-y-3 text-sm text-gray-400 leading-relaxed">
          <p>FlowerGoUa обробляє персональні дані відповідно до:</p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>Закону України №2297-VI &quot;Про захист персональних даних&quot; від 01.06.2010</li>
            <li>Загального регламенту ЄС про захист даних (GDPR) — для суб&apos;єктів даних, що перебувають в ЄС</li>
            <li>Закону України &quot;Про інформацію&quot; №2657-XII від 02.10.1992</li>
            <li>Закону України &quot;Про електронну комерцію&quot; №675-VIII від 03.09.2015</li>
          </ul>
        </div>
      </div>

      {/* ── 2 ── */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-pink-500 to-purple-600 rounded-full inline-block flex-shrink-0" />
          2. Архітектура обробки даних
        </h2>
        <div className="pl-3 grid sm:grid-cols-2 gap-4 text-sm">
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center gap-2.5 mb-3"><span className="text-xl">🗄️</span><span className="text-sm font-bold text-white">База даних</span></div>
            <div className="text-gray-400 space-y-1.5 text-xs"><p>PostgreSQL (Neon), регіон AWS us-east-1.</p><p>Шифрування даних у стані спокою (AES-256).</p><p>Автоматичні бекапи щодня з 30-денним зберіганням.</p></div>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center gap-2.5 mb-3"><span className="text-xl">☁️</span><span className="text-sm font-bold text-white">Хостинг</span></div>
            <div className="text-gray-400 space-y-1.5 text-xs"><p>Vercel Edge Network — CDN по всьому світу.</p><p>Автоматичний HTTPS з TLS 1.3.</p><p>ISO 27001 сертифікована інфраструктура.</p></div>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center gap-2.5 mb-3"><span className="text-xl">🖼️</span><span className="text-sm font-bold text-white">Зображення</span></div>
            <div className="text-gray-400 space-y-1.5 text-xs"><p>Cloudinary — хмарне сховище медіафайлів.</p><p>Зображення зберігаються в зашифрованих сховищах.</p><p>Видалення з CDN при видаленні магазину.</p></div>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center gap-2.5 mb-3"><span className="text-xl">📩</span><span className="text-sm font-bold text-white">Email</span></div>
            <div className="text-gray-400 space-y-1.5 text-xs"><p>Транзакційні листи через захищений SMTP.</p><p>Маркетингові листи — тільки з явної згоди.</p><p>Відписка доступна в кожному листі.</p></div>
          </div>
        </div>
      </div>

      {/* ── 3 ── */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-pink-500 to-purple-600 rounded-full inline-block flex-shrink-0" />
          3. Заходи технічної безпеки
        </h2>
        <div className="pl-3 space-y-3">
          {[
            { icon: '🔑', title: 'Шифрування паролів', desc: 'Усі паролі хешуються за допомогою bcrypt з коефіцієнтом складності 12. Відкритий пароль ніколи не зберігається.' },
            { icon: '🔒', title: 'HTTPS всюди', desc: 'Весь трафік між браузером і сервером шифрується через TLS 1.3. HTTP-з\'єднання автоматично перенаправляються на HTTPS.' },
            { icon: '🎫', title: 'Аутентифікація сесій', desc: 'Сесії реалізовані через JWT-токени з обмеженим терміном дії. Використовується NextAuth.js з безпечними параметрами.' },
            { icon: '🛡️', title: 'Rate limiting', desc: 'Усі публічні API-ендпоінти захищені обмеженням кількості запитів для запобігання брутфорс-атакам та DDoS.' },
            { icon: '💳', title: 'Обробка платежів', desc: 'Ми ніколи не зберігаємо повні номери карток, CVV або PIN-коди. Зберігаються лише: ім\'я власника, тип картки та останні 4 цифри.' },
            { icon: '✉️', title: 'Верифікація email', desc: 'Нові акаунти проходять верифікацію email-адреси перед активацією.' },
            { icon: '👮', title: 'Захищена адмін-панель', desc: 'Адміністративний доступ захищений окремим секретним ключем, незалежним від системи аутентифікації користувачів.' },
          ].map(item => (
            <div key={item.title} className="flex gap-4 bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
              <span className="text-2xl flex-shrink-0">{item.icon}</span>
              <div>
                <p className="text-gray-200 font-semibold text-sm mb-1">{item.title}</p>
                <p className="text-gray-500 text-xs leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4 ── */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-pink-500 to-purple-600 rounded-full inline-block flex-shrink-0" />
          4. Категорії даних та терміни зберігання
        </h2>
        <div className="pl-3 text-sm text-gray-400 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left py-2 pr-4 text-gray-500 font-semibold">Категорія даних</th>
                <th className="text-left py-2 pr-4 text-gray-500 font-semibold">Термін</th>
                <th className="text-left py-2 text-gray-500 font-semibold">Підстава</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              <tr><td className="py-2.5 pr-4">Email та пароль акаунту</td><td className="py-2.5 pr-4 text-gray-500">До видалення акаунту</td><td className="py-2.5 text-gray-600 text-xs">Договір</td></tr>
              <tr><td className="py-2.5 pr-4">Дані магазину</td><td className="py-2.5 pr-4 text-gray-500">До видалення акаунту</td><td className="py-2.5 text-gray-600 text-xs">Договір</td></tr>
              <tr><td className="py-2.5 pr-4">Фотографії продуктів</td><td className="py-2.5 pr-4 text-gray-500">До видалення або архівування</td><td className="py-2.5 text-gray-600 text-xs">Договір</td></tr>
              <tr><td className="py-2.5 pr-4">Дані замовлень</td><td className="py-2.5 pr-4 text-gray-500">До 5 років</td><td className="py-2.5 text-gray-600 text-xs">Закон (бухоблік)</td></tr>
              <tr><td className="py-2.5 pr-4">Платіжні записи (часткові)</td><td className="py-2.5 pr-4 text-gray-500">До 5 років</td><td className="py-2.5 text-gray-600 text-xs">Закон (бухоблік)</td></tr>
              <tr><td className="py-2.5 pr-4">Технічні логи</td><td className="py-2.5 pr-4 text-gray-500">До 90 днів</td><td className="py-2.5 text-gray-600 text-xs">Законний інтерес</td></tr>
              <tr><td className="py-2.5 pr-4">Telegram Chat ID</td><td className="py-2.5 pr-4 text-gray-500">До відключення</td><td className="py-2.5 text-gray-600 text-xs">Договір</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 5 ── */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-pink-500 to-purple-600 rounded-full inline-block flex-shrink-0" />
          5. Треті сторони та субобробники
        </h2>
        <div className="pl-3 space-y-3 text-sm text-gray-400">
          <p>Усі субобробники відповідають вимогам GDPR та уклали з нами DPA:</p>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { name: 'Vercel',     role: 'Хостинг та CDN',       location: 'США/ЄС', cert: 'SOC 2 Type II' },
              { name: 'Neon',       role: 'PostgreSQL база даних', location: 'США',    cert: 'SOC 2' },
              { name: 'Cloudinary', role: 'Зберігання зображень',  location: 'США',    cert: 'ISO 27001' },
              { name: 'Telegram',   role: 'Сповіщення',            location: 'ЄС',     cert: 'GDPR' },
              { name: 'SMTP',       role: 'Email сповіщення',      location: 'ЄС',     cert: 'ISO 27001' },
            ].map(sp => (
              <div key={sp.name} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                <p className="text-gray-200 font-bold text-sm mb-1">{sp.name}</p>
                <p className="text-gray-500 text-xs mb-2">{sp.role}</p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] bg-white/[0.04] text-gray-500 px-2 py-0.5 rounded-full">{sp.location}</span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full">{sp.cert}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 6 ── */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-pink-500 to-purple-600 rounded-full inline-block flex-shrink-0" />
          6. Права суб&apos;єктів даних та процедура запитів
        </h2>
        <div className="pl-3 space-y-3 text-sm text-gray-400 leading-relaxed">
          <p>Ми обробляємо запити щодо персональних даних у такі строки:</p>
          <div className="space-y-2">
            {[
              ['Доступ до даних',     '30 днів',  'Надаємо повний звіт у форматі JSON або CSV'],
              ['Виправлення даних',   '14 днів',  'Виправляємо неточні дані та підтверджуємо'],
              ['Видалення даних',     '30 днів',  'Видаляємо всі персональні дані крім юридично необхідних'],
              ['Перенесення даних',   '30 днів',  'Надаємо дані у машиночитаному форматі (JSON)'],
              ['Заперечення обробки', '14 днів',  'Розглядаємо та підтверджуємо рішення'],
            ].map(([right, deadline, action]) => (
              <div key={right} className="flex gap-3 items-start bg-white/[0.02] border border-white/[0.05] rounded-lg p-3">
                <div className="flex-1">
                  <p className="text-gray-300 font-semibold text-xs">{right}</p>
                  <p className="text-gray-600 text-xs mt-0.5">{action}</p>
                </div>
                <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-1 rounded-full flex-shrink-0">do {deadline}</span>
              </div>
            ))}
          </div>
          <p>Для подачі запиту надішліть лист на <a href="mailto:privacy@flowergoua.com" className="text-pink-400 hover:text-pink-300 underline">privacy@flowergoua.com</a> з темою &quot;Запит суб&apos;єкта даних&quot;.</p>
        </div>
      </div>

      {/* ── 7 ── */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-pink-500 to-purple-600 rounded-full inline-block flex-shrink-0" />
          7. Повідомлення про порушення безпеки даних
        </h2>
        <div className="pl-3 space-y-3 text-sm text-gray-400 leading-relaxed">
          <p>У разі виявлення порушення безпеки даних ми:</p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>Повідомимо відповідний наглядовий орган протягом <span className="text-gray-300 font-medium">72 годин</span> після виявлення</li>
            <li>Повідомимо постраждалих суб&apos;єктів даних без зайвих зволікань</li>
            <li>Задокументуємо всі порушення та вжиті заходи реагування</li>
            <li>Вживемо негайних заходів для усунення вразливості</li>
          </ul>
          <p>Якщо ви виявили вразливість безпеки, повідомте нас на <a href="mailto:security@flowergoua.com" className="text-pink-400 hover:text-pink-300 underline">security@flowergoua.com</a>. Ми гарантуємо відповідь протягом 24 годин.</p>
        </div>
      </div>

      {/* ── 8 ── */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-pink-500 to-purple-600 rounded-full inline-block flex-shrink-0" />
          8. Контакти з питань відповідності
        </h2>
        <div className="pl-3 grid sm:grid-cols-2 gap-4 text-sm">
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-1.5">
            <p className="text-gray-300 font-semibold mb-2">Конфіденційність та дані</p>
            <p><span className="text-gray-600">Email:</span> <a href="mailto:privacy@flowergoua.com" className="text-pink-400 hover:text-pink-300 underline">privacy@flowergoua.com</a></p>
            <p className="text-gray-600 text-xs">Запити суб&apos;єктів даних, GDPR, скарги</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-1.5">
            <p className="text-gray-300 font-semibold mb-2">Безпека</p>
            <p><span className="text-gray-600">Email:</span> <a href="mailto:security@flowergoua.com" className="text-pink-400 hover:text-pink-300 underline">security@flowergoua.com</a></p>
            <p className="text-gray-600 text-xs">Вразливості, інциденти безпеки</p>
          </div>
        </div>
      </div>

    </div>
  )
}
