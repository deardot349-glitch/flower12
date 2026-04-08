import React from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Дані та відповідність — FlowerGoUa',
  description: 'Інформація про обробку даних, GDPR, безпеку і відповідність стандартам на платформі FlowerGoUa.',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span className="w-1 h-5 bg-gradient-to-b from-pink-500 to-purple-600 rounded-full inline-block flex-shrink-0" />
        {title}
      </h2>
      <div className="space-y-3 text-sm text-gray-400 leading-relaxed pl-3">{children}</div>
    </section>
  )
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  const colors: Record<string, string> = {
    green:  'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    blue:   'bg-blue-500/10 border-blue-500/20 text-blue-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    amber:  'bg-amber-500/10 border-amber-500/20 text-amber-400',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors[color]}`}>
      {children}
    </span>
  )
}

function InfoCard({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
      <div className="flex items-center gap-2.5 mb-3">
        <span className="text-xl">{icon}</span>
        <h3 className="text-sm font-bold text-white">{title}</h3>
      </div>
      <div className="text-sm text-gray-400 leading-relaxed space-y-1.5">{children}</div>
    </div>
  )
}

export default function DataCompliancePage() {
  return (
    <div>
      {/* Header */}
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

      {/* Compliance badges */}
      <div className="flex flex-wrap gap-2 mb-10">
        <Badge color="green">✓ GDPR сумісність</Badge>
        <Badge color="blue">✓ Закон України «Про захист персональних даних»</Badge>
        <Badge color="purple">✓ HTTPS / TLS 1.3</Badge>
        <Badge color="amber">✓ bcrypt шифрування паролів</Badge>
        <Badge color="green">✓ Нульове зберігання повних реквізитів карток</Badge>
      </div>

      <Section title="1. Законодавча база">
        <p>FlowerGoUa обробляє персональні дані відповідно до:</p>
        <ul className="list-disc list-inside space-y-1.5 pl-2 mt-2">
          <li>Закону України № 2297-VI «Про захист персональних даних» від 01.06.2010</li>
          <li>Загального регламенту ЄС про захист даних (GDPR) — для суб'єктів даних, що перебувають в ЄС</li>
          <li>Закону України «Про інформацію» № 2657-XII від 02.10.1992</li>
          <li>Закону України «Про електронну комерцію» № 675-VIII від 03.09.2015</li>
        </ul>
      </Section>

      <Section title="2. Архітектура обробки даних">
        <div className="grid sm:grid-cols-2 gap-4 not-prose">
          <InfoCard icon="🗄️" title="База даних">
            <p>PostgreSQL (Neon), розгорнута в регіоні AWS us-east-1.</p>
            <p>Шифрування даних у стані спокою (AES-256).</p>
            <p>Автоматичні бекапи щодня з 30-денним зберіганням.</p>
          </InfoCard>
          <InfoCard icon="☁️" title="Хостинг">
            <p>Vercel Edge Network — CDN з точками присутності по всьому світу.</p>
            <p>Автоматичний HTTPS з TLS 1.3 для всіх з'єднань.</p>
            <p>ISO 27001 сертифікована інфраструктура.</p>
          </InfoCard>
          <InfoCard icon="🖼️" title="Зображення">
            <p>Cloudinary — хмарне сховище медіафайлів.</p>
            <p>Зображення зберігаються в зашифрованих сховищах.</p>
            <p>Видалення з CDN при видаленні магазину.</p>
          </InfoCard>
          <InfoCard icon="📩" title="Email">
            <p>Транзакційні листи через захищений SMTP.</p>
            <p>Маркетингові листи — тільки з явної згоди.</p>
            <p>Відписка доступна в кожному листі.</p>
          </InfoCard>
        </div>
      </Section>

      <Section title="3. Заходи технічної безпеки">
        <div className="space-y-3 not-prose">
          {[
            {
              title: 'Шифрування паролів',
              desc: 'Усі паролі хешуються за допомогою bcrypt з коефіцієнтом складності 12. Відкритий пароль ніколи не зберігається.',
              icon: '🔑',
            },
            {
              title: 'HTTPS всюди',
              desc: 'Весь трафік між браузером і сервером шифрується через TLS 1.3. HTTP-з\'єднання автоматично перенаправляються на HTTPS.',
              icon: '🔒',
            },
            {
              title: 'Аутентифікація сесій',
              desc: 'Сесії реалізовані через JWT-токени з обмеженим терміном дії. Використовується NextAuth.js з безпечними параметрами налаштування.',
              icon: '🎫',
            },
            {
              title: 'Rate limiting',
              desc: 'Усі публічні API-ендпоінти захищені обмеженням кількості запитів для запобігання брутфорс-атакам та DDoS.',
              icon: '🛡️',
            },
            {
              title: 'Обробка платежів',
              desc: 'Ми ніколи не зберігаємо повні номери карток, CVV або PIN-коди. Зберігаються лише: ім\'я власника, тип картки та останні 4 цифри — виключно для ідентифікації платежу.',
              icon: '💳',
            },
            {
              title: 'Верифікація email',
              desc: 'Нові акаунти проходять верифікацію email-адреси перед активацією для запобігання реєстрації з фіктивними адресами.',
              icon: '✉️',
            },
            {
              title: 'Захищений адмін-панель',
              desc: 'Адміністративний доступ захищений окремим секретним ключем, незалежним від системи аутентифікації користувачів.',
              icon: '👮',
            },
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
      </Section>

      <Section title="4. Категорії даних та терміни зберігання">
        <div className="overflow-x-auto not-prose">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left py-2 pr-4 text-gray-500 font-semibold">Категорія даних</th>
                <th className="text-left py-2 pr-4 text-gray-500 font-semibold">Термін зберігання</th>
                <th className="text-left py-2 text-gray-500 font-semibold">Підстава</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {[
                ['Email та пароль акаунту', 'До видалення акаунту', 'Договір'],
                ['Дані магазину (назва, адреса, контакти)', 'До видалення акаунту', 'Договір'],
                ['Фотографії продуктів', 'До видалення або архівування', 'Договір'],
                ['Дані замовлень', 'До 5 років після завершення', 'Закон (бухоблік)'],
                ['Платіжні записи (часткові)', 'До 5 років', 'Закон (бухоблік)'],
                ['Технічні логи (IP, дії)', 'До 90 днів', 'Законний інтерес'],
                ['Дані верифікації email', 'До підтвердження або 7 днів', 'Договір'],
                ['Telegram Chat ID', 'До відключення або видалення акаунту', 'Договір'],
              ].map(([category, retention, basis]) => (
                <tr key={category}>
                  <td className="py-2.5 pr-4 text-gray-400">{category}</td>
                  <td className="py-2.5 pr-4 text-gray-500">{retention}</td>
                  <td className="py-2.5 text-gray-600 text-xs">{basis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4">
          Після закінчення строку зберігання дані видаляються або незворотно анонімізуються
          протягом 30 днів. Видалення акаунту ініціює процес видалення всіх пов'язаних
          персональних даних, крім тих, що мають бути збережені за законом.
        </p>
      </Section>

      <Section title="5. Треті сторони та субобробники">
        <p>
          FlowerGoUa використовує наступних субобробників персональних даних. Усі вони
          відповідають вимогам GDPR та уклали з нами DPA (Data Processing Agreement):
        </p>
        <div className="mt-4 grid sm:grid-cols-3 gap-3 not-prose">
          {[
            { name: 'Vercel',     role: 'Хостинг та CDN',         location: 'США/ЄС',  cert: 'SOC 2 Type II' },
            { name: 'Neon',       role: 'PostgreSQL база даних',   location: 'США',     cert: 'SOC 2' },
            { name: 'Cloudinary', role: 'Зберігання зображень',    location: 'США',     cert: 'ISO 27001' },
            { name: 'Telegram',   role: 'Сповіщення',              location: 'ЄС',      cert: 'GDPR' },
            { name: 'SMTP',       role: 'Транзакційні email',      location: 'ЄС',      cert: 'ISO 27001' },
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
        <p className="mt-4">
          Дані не передаються в країни поза ЄС/США без відповідних механізмів захисту
          (стандартні договірні положення ЄС — SCCs або рішення про адекватність).
        </p>
      </Section>

      <Section title="6. Права суб'єктів даних та процедура запитів">
        <p>
          Як власник магазину або покупець, ви можете подати запит щодо своїх персональних даних.
          Ми обробляємо запити відповідно до таких строків:
        </p>
        <div className="mt-4 space-y-2 not-prose">
          {[
            ['Доступ до даних',     '30 днів',      'Надаємо повний звіт у форматі JSON або CSV'],
            ['Виправлення даних',   '14 днів',      'Виправляємо неточні дані та підтверджуємо'],
            ['Видалення даних',     '30 днів',      'Видаляємо всі персональні дані крім юридично необхідних'],
            ['Перенесення даних',   '30 днів',      'Надаємо дані у машиночитаному форматі (JSON)'],
            ['Заперечення обробки', '14 днів',      'Розглядаємо та підтверджуємо рішення'],
          ].map(([right, deadline, action]) => (
            <div key={right} className="flex gap-3 items-start bg-white/[0.02] border border-white/[0.05] rounded-lg p-3">
              <div className="flex-1">
                <p className="text-gray-300 font-semibold text-xs">{right}</p>
                <p className="text-gray-600 text-xs mt-0.5">{action}</p>
              </div>
              <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-1 rounded-full flex-shrink-0">
                ≤ {deadline}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-4">
          Для подачі запиту надішліть лист на{' '}
          <a href="mailto:privacy@flowergoua.com" className="text-pink-400 hover:text-pink-300 underline">privacy@flowergoua.com</a>{' '}
          з темою «Запит суб'єкта даних» та вкажіть тип запиту та email вашого акаунту.
          Для підтвердження особи ми можемо попросити додаткові відомості.
        </p>
      </Section>

      <Section title="7. Повідомлення про порушення безпеки даних">
        <p>
          У разі виявлення порушення безпеки даних, яке може становити ризик для прав і свобод
          суб'єктів даних, ми:
        </p>
        <ul className="list-disc list-inside space-y-1.5 pl-2 mt-2">
          <li>Повідомимо відповідний наглядовий орган протягом <span className="text-gray-300 font-medium">72 годин</span> після виявлення</li>
          <li>Повідомимо постраждалих суб'єктів даних без зайвих зволікань</li>
          <li>Задокументуємо всі порушення та вжиті заходи реагування</li>
          <li>Вживемо негайних заходів для усунення вразливості</li>
        </ul>
        <p className="mt-3">
          Якщо ви виявили вразливість безпеки, повідомте нас на{' '}
          <a href="mailto:security@flowergoua.com" className="text-pink-400 hover:text-pink-300 underline">security@flowergoua.com</a>.
          Ми гарантуємо відповідь протягом 24 годин.
        </p>
      </Section>

      <Section title="8. Відповідальне розкриття (Responsible Disclosure)">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 not-prose">
          <p className="text-gray-300 font-semibold mb-2">Ми цінуємо дослідників безпеки</p>
          <p className="text-gray-500 text-xs leading-relaxed mb-3">
            Якщо ви знайшли вразливість у наших системах, будь ласка, повідомте нас
            приватно перед публічним розкриттям. Ми зобов'язуємося:
          </p>
          <ul className="text-gray-500 text-xs space-y-1.5 list-disc list-inside">
            <li>Підтвердити отримання звіту протягом 24 годин</li>
            <li>Виправити критичні вразливості протягом 14 днів</li>
            <li>Не вживати правових заходів проти добросовісних дослідників</li>
            <li>Публічно вдячно визнати вклад (за вашим бажанням)</li>
          </ul>
          <div className="mt-3 pt-3 border-t border-white/[0.06]">
            <a href="mailto:security@flowergoua.com"
              className="text-xs text-pink-400 hover:text-pink-300 underline font-medium">
              security@flowergoua.com
            </a>
          </div>
        </div>
      </Section>

      <Section title="9. Контакти з питань відповідності">
        <div className="grid sm:grid-cols-2 gap-4 not-prose">
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-sm space-y-1.5">
            <p className="text-gray-300 font-semibold mb-2">Конфіденційність та дані</p>
            <p><span className="text-gray-600">Email:</span>{' '}
              <a href="mailto:privacy@flowergoua.com" className="text-pink-400 hover:text-pink-300 underline">privacy@flowergoua.com</a>
            </p>
            <p className="text-gray-600 text-xs">Запити суб'єктів даних, GDPR, скарги</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-sm space-y-1.5">
            <p className="text-gray-300 font-semibold mb-2">Безпека</p>
            <p><span className="text-gray-600">Email:</span>{' '}
              <a href="mailto:security@flowergoua.com" className="text-pink-400 hover:text-pink-300 underline">security@flowergoua.com</a>
            </p>
            <p className="text-gray-600 text-xs">Вразливості, інциденти безпеки</p>
          </div>
        </div>
      </Section>
    </div>
  )
}
