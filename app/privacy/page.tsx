import React from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Політика конфіденційності — FlowerGoUa',
  description: 'Як FlowerGoUa збирає, використовує та захищає ваші персональні дані.',
}

export default function PrivacyPage() {
  return (
    <div>

      {/* ── Header ── */}
      <div className="mb-10 pb-8 border-b border-white/[0.06]">
        <div className="inline-flex items-center gap-2 bg-pink-500/10 border border-pink-500/20 rounded-full px-3 py-1 text-xs font-medium text-pink-400 mb-4">
          🔒 Правовий документ
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Політика конфіденційності</h1>
        <p className="text-gray-500 text-sm">Остання редакція: 1 квітня 2025 р.</p>
        <p className="mt-4 text-gray-400 text-sm leading-relaxed max-w-2xl">
          FlowerGoUa поважає вашу приватність. Цей документ пояснює які дані ми збираємо,
          навіщо вони нам потрібні, і як ми їх захищаємо відповідно до Закону України
          &quot;Про захист персональних даних&quot; та Регламенту ЄС GDPR.
        </p>
      </div>

      {/* ── 1 ── */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-pink-500 to-purple-600 rounded-full inline-block flex-shrink-0" />
          1. Хто ми
        </h2>
        <div className="pl-3 text-sm text-gray-400 leading-relaxed">
          <p>FlowerGoUa — платформа для квіткових магазинів України. Оператором персональних даних є FlowerGoUa. Контактний email для питань конфіденційності: <a href="mailto:privacy@flowergoua.com" className="text-pink-400 hover:text-pink-300 underline">privacy@flowergoua.com</a>.</p>
        </div>
      </div>

      {/* ── 2 ── */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-pink-500 to-purple-600 rounded-full inline-block flex-shrink-0" />
          2. Які дані ми збираємо
        </h2>
        <div className="pl-3 space-y-4 text-sm text-gray-400 leading-relaxed">
          <div>
            <p className="text-gray-300 font-semibold mb-2">2.1 Дані, які ви надаєте нам</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Адреса електронної пошти та пароль при реєстрації</li>
              <li>Назва магазину, адреса, номер телефону, посилання на соцмережі</li>
              <li>Фотографії продуктів і обкладинки магазину</li>
              <li>Платіжна інформація (лише останні 4 цифри картки та ім&apos;я власника — повні реквізити ніколи не зберігаються)</li>
              <li>Дані Telegram Chat ID для сповіщень</li>
            </ul>
          </div>
          <div>
            <p className="text-gray-300 font-semibold mb-2">2.2 Дані замовників (покупців)</p>
            <p>Коли клієнт оформлює замовлення у вашому магазині, ми збираємо ім&apos;я, номер телефону, email (необов&apos;язково) та адресу доставки. Ці дані передаються власнику магазину для виконання замовлення.</p>
          </div>
          <div>
            <p className="text-gray-300 font-semibold mb-2">2.3 Технічні дані</p>
            <p>Ми автоматично отримуємо IP-адресу, тип браузера, операційну систему та сторінки, які ви відвідуєте. Ці дані використовуються виключно для забезпечення безпеки та покращення роботи платформи.</p>
          </div>
        </div>
      </div>

      {/* ── 3 ── */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-pink-500 to-purple-600 rounded-full inline-block flex-shrink-0" />
          3. Навіщо ми використовуємо ваші дані
        </h2>
        <div className="pl-3 text-sm text-gray-400 leading-relaxed overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left py-2 pr-4 text-gray-500 font-semibold w-1/2">Мета</th>
                <th className="text-left py-2 text-gray-500 font-semibold">Правова підстава</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              <tr><td className="py-2.5 pr-4">Надання та підтримка послуг платформи</td><td className="py-2.5 text-gray-500 text-xs">Виконання договору</td></tr>
              <tr><td className="py-2.5 pr-4">Надсилання сповіщень про нові замовлення</td><td className="py-2.5 text-gray-500 text-xs">Виконання договору</td></tr>
              <tr><td className="py-2.5 pr-4">Обробка платежів за підписку</td><td className="py-2.5 text-gray-500 text-xs">Виконання договору</td></tr>
              <tr><td className="py-2.5 pr-4">Безпека акаунту та запобігання шахрайству</td><td className="py-2.5 text-gray-500 text-xs">Законний інтерес</td></tr>
              <tr><td className="py-2.5 pr-4">Надсилання важливих системних повідомлень</td><td className="py-2.5 text-gray-500 text-xs">Законний інтерес</td></tr>
              <tr><td className="py-2.5 pr-4">Покращення та аналіз платформи</td><td className="py-2.5 text-gray-500 text-xs">Законний інтерес</td></tr>
              <tr><td className="py-2.5 pr-4">Маркетингові повідомлення (тільки з вашої згоди)</td><td className="py-2.5 text-gray-500 text-xs">Згода</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 4 ── */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-pink-500 to-purple-600 rounded-full inline-block flex-shrink-0" />
          4. Передача даних третім особам
        </h2>
        <div className="pl-3 space-y-3 text-sm text-gray-400 leading-relaxed">
          <p>Ми не продаємо і не надаємо ваші персональні дані третім особам для маркетингових цілей.</p>
          <p>Ми можемо передавати дані таким категоріям одержувачів:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li><span className="text-gray-300">Хмарна інфраструктура</span> — Vercel (хостинг), Neon/PostgreSQL (база даних), Cloudinary (зображення)</li>
            <li><span className="text-gray-300">Telegram</span> — для доставки сповіщень про замовлення</li>
            <li><span className="text-gray-300">Державні органи</span> — виключно на підставі законних вимог</li>
          </ul>
          <p>Усі постачальники послуг обрані з дотриманням вимог до захисту даних та уклали з нами відповідні угоди про обробку персональних даних (DPA).</p>
        </div>
      </div>

      {/* ── 5 ── */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-pink-500 to-purple-600 rounded-full inline-block flex-shrink-0" />
          5. Зберігання та безпека даних
        </h2>
        <div className="pl-3 space-y-3 text-sm text-gray-400 leading-relaxed">
          <p>Ваші дані зберігаються на захищених серверах у межах ЄС та/або США з відповідними механізмами захисту (SCCs). Ми застосовуємо шифрування даних у спокої та при передачі (TLS/HTTPS), хешування паролів (bcrypt), суворий контроль доступу та регулярні аудити безпеки.</p>
          <p>Дані акаунту зберігаються до моменту видалення вашого акаунту. Після видалення ми знищуємо або анонімізуємо всі ваші персональні дані протягом 30 днів.</p>
        </div>
      </div>

      {/* ── 6 ── */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-pink-500 to-purple-600 rounded-full inline-block flex-shrink-0" />
          6. Ваші права
        </h2>
        <div className="pl-3 space-y-3 text-sm text-gray-400 leading-relaxed">
          <p>Відповідно до законодавства про захист даних ви маєте право:</p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li><span className="text-gray-300 font-medium">Доступу</span> — отримати копію своїх персональних даних</li>
            <li><span className="text-gray-300 font-medium">Виправлення</span> — виправити неточні або неповні дані</li>
            <li><span className="text-gray-300 font-medium">Видалення</span> — вимагати видалення ваших даних</li>
            <li><span className="text-gray-300 font-medium">Обмеження</span> — обмежити обробку ваших даних</li>
            <li><span className="text-gray-300 font-medium">Перенесення</span> — отримати дані у машиночитаному форматі</li>
            <li><span className="text-gray-300 font-medium">Заперечення</span> — заперечити проти обробки на підставі законного інтересу</li>
            <li><span className="text-gray-300 font-medium">Скарги</span> — подати скаргу до Уповноваженого з прав людини Верховної Ради України</li>
          </ul>
          <p>Щоб скористатися будь-яким із цих прав, напишіть нам на <a href="mailto:privacy@flowergoua.com" className="text-pink-400 hover:text-pink-300 underline">privacy@flowergoua.com</a>. Ми відповімо протягом 30 днів.</p>
        </div>
      </div>

      {/* ── 7 ── */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-pink-500 to-purple-600 rounded-full inline-block flex-shrink-0" />
          7. Файли cookie
        </h2>
        <div className="pl-3 text-sm text-gray-400 leading-relaxed">
          <p>FlowerGoUa використовує лише функціональні файли cookie, необхідні для роботи сесій та аутентифікації. Ми не використовуємо маркетингових або аналітичних cookie-файлів третіх осіб без вашої явної згоди.</p>
        </div>
      </div>

      {/* ── 8 ── */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-pink-500 to-purple-600 rounded-full inline-block flex-shrink-0" />
          8. Діти
        </h2>
        <div className="pl-3 text-sm text-gray-400 leading-relaxed">
          <p>Наші послуги не призначені для осіб молодше 16 років. Ми не збираємо свідомо персональні дані дітей. Якщо вам стало відомо, що дитина надала нам свої дані, будь ласка, зв&apos;яжіться з нами для їх видалення.</p>
        </div>
      </div>

      {/* ── 9 ── */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-pink-500 to-purple-600 rounded-full inline-block flex-shrink-0" />
          9. Зміни до цієї політики
        </h2>
        <div className="pl-3 text-sm text-gray-400 leading-relaxed">
          <p>Ми можемо оновлювати цю Політику конфіденційності. При суттєвих змінах ми повідомимо вас електронним листом або через повідомлення на платформі не менше ніж за 14 днів до набрання змін чинності.</p>
        </div>
      </div>

      {/* ── 10 ── */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-pink-500 to-purple-600 rounded-full inline-block flex-shrink-0" />
          10. Контакти
        </h2>
        <div className="pl-3 text-sm text-gray-400 leading-relaxed">
          <p className="mb-3">З питань конфіденційності звертайтесь до нас:</p>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-1">
            <p><span className="text-gray-500">Email:</span> <a href="mailto:privacy@flowergoua.com" className="text-pink-400 hover:text-pink-300 underline">privacy@flowergoua.com</a></p>
            <p><span className="text-gray-500">Платформа:</span> FlowerGoUa</p>
            <p><span className="text-gray-500">Час відповіді:</span> до 30 робочих днів</p>
          </div>
        </div>
      </div>

    </div>
  )
}
