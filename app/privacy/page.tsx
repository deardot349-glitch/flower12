import React from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Політика конфіденційності — FlowerGoUa',
  description: 'Як FlowerGoUa збирає, використовує та захищає ваші персональні дані.',
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

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <p className="text-gray-300 font-semibold mb-1">{title}</p>
      <div className="text-gray-400 space-y-2">{children}</div>
    </div>
  )
}

export default function PrivacyPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-10 pb-8 border-b border-white/[0.06]">
        <div className="inline-flex items-center gap-2 bg-pink-500/10 border border-pink-500/20 rounded-full px-3 py-1 text-xs font-medium text-pink-400 mb-4">
          🔒 Правовий документ
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Політика конфіденційності</h1>
        <p className="text-gray-500 text-sm">Остання редакція: 1 квітня 2025 р.</p>
        <p className="mt-4 text-gray-400 text-sm leading-relaxed max-w-2xl">
          FlowerGoUa поважає вашу приватність. Цей документ пояснює які дані ми збираємо,
          навіщо вони нам потрібні, і як ми їх захищаємо відповідно до Закону України
          «Про захист персональних даних» та Регламенту ЄС GDPR.
        </p>
      </div>

      <Section title="1. Хто ми">
        <p>
          FlowerGoUa — платформа для квіткових магазинів України. Оператором персональних даних є
          FlowerGoUa (далі — «Платформа», «ми», «нас»). Контактний email для питань
          конфіденційності: <a href="mailto:privacy@flowergoua.com" className="text-pink-400 hover:text-pink-300 underline">privacy@flowergoua.com</a>.
        </p>
      </Section>

      <Section title="2. Які дані ми збираємо">
        <Sub title="2.1 Дані, які ви надаєте нам">
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Адреса електронної пошти та пароль при реєстрації</li>
            <li>Назва магазину, адреса, номер телефону, посилання на соцмережі</li>
            <li>Фотографії продуктів і обкладинки магазину</li>
            <li>Платіжна інформація (лише останні 4 цифри картки та ім'я власника — повні реквізити ніколи не зберігаються)</li>
            <li>Дані Telegram Chat ID для сповіщень</li>
          </ul>
        </Sub>
        <Sub title="2.2 Дані замовників (покупців)">
          <p>
            Коли клієнт оформлює замовлення у вашому магазині на платформі, ми збираємо ім'я,
            номер телефону, email (необов'язково) та адресу доставки. Ці дані передаються
            власнику магазину для виконання замовлення.
          </p>
        </Sub>
        <Sub title="2.3 Технічні дані">
          <p>
            Ми автоматично отримуємо IP-адресу, тип браузера, операційну систему та сторінки,
            які ви відвідуєте. Ці дані використовуються виключно для забезпечення
            безпеки та покращення роботи платформи.
          </p>
        </Sub>
      </Section>

      <Section title="3. Навіщо ми використовуємо ваші дані">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left py-2 pr-4 text-gray-500 font-semibold w-1/2">Мета</th>
                <th className="text-left py-2 text-gray-500 font-semibold">Правова підстава</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {[
                ['Надання та підтримка послуг платформи', 'Виконання договору'],
                ['Надсилання сповіщень про нові замовлення', 'Виконання договору'],
                ['Обробка платежів за підписку', 'Виконання договору'],
                ['Безпека акаунту та запобігання шахрайству', 'Законний інтерес'],
                ['Надсилання важливих системних повідомлень', 'Законний інтерес'],
                ['Покращення та аналіз платформи', 'Законний інтерес'],
                ['Маркетингові повідомлення (тільки з вашої згоди)', 'Згода'],
              ].map(([purpose, basis]) => (
                <tr key={purpose}>
                  <td className="py-2.5 pr-4 text-gray-400">{purpose}</td>
                  <td className="py-2.5 text-gray-500 text-xs">{basis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="4. Передача даних третім особам">
        <p>Ми не продаємо і не надаємо ваші персональні дані третім особам для маркетингових цілей.</p>
        <p>Ми можемо передавати дані таким категоріям одержувачів:</p>
        <ul className="list-disc list-inside space-y-1 pl-2 mt-2">
          <li><span className="text-gray-300">Хмарна інфраструктура</span> — Vercel (хостинг), Neon/PostgreSQL (база даних), Cloudinary (зображення)</li>
          <li><span className="text-gray-300">Telegram</span> — для доставки сповіщень про замовлення</li>
          <li><span className="text-gray-300">Державні органи</span> — виключно на підставі законних вимог</li>
        </ul>
        <p className="mt-3">
          Усі постачальники послуг обрані з дотриманням вимог до захисту даних та уклали з нами
          відповідні угоди про обробку персональних даних (DPA).
        </p>
      </Section>

      <Section title="5. Зберігання та безпека даних">
        <p>
          Ваші дані зберігаються на захищених серверах у межах ЄС та/або США з відповідними
          механізмами захисту (SCCs). Ми застосовуємо шифрування даних у спокої та при передачі
          (TLS/HTTPS), хешування паролів (bcrypt), суворий контроль доступу та регулярні аудити безпеки.
        </p>
        <p>
          Дані акаунту зберігаються до моменту видалення вашого акаунту. Після видалення ми
          знищуємо або анонімізуємо всі ваші персональні дані протягом 30 днів.
        </p>
      </Section>

      <Section title="6. Ваші права">
        <p>Відповідно до законодавства про захист даних ви маєте право:</p>
        <ul className="list-disc list-inside space-y-1.5 pl-2 mt-2">
          <li><span className="text-gray-300 font-medium">Доступу</span> — отримати копію своїх персональних даних</li>
          <li><span className="text-gray-300 font-medium">Виправлення</span> — виправити неточні або неповні дані</li>
          <li><span className="text-gray-300 font-medium">Видалення</span> — вимагати видалення ваших даних («право на забуття»)</li>
          <li><span className="text-gray-300 font-medium">Обмеження</span> — обмежити обробку ваших даних</li>
          <li><span className="text-gray-300 font-medium">Перенесення</span> — отримати дані у машиночитаному форматі</li>
          <li><span className="text-gray-300 font-medium">Заперечення</span> — заперечити проти обробки на підставі законного інтересу</li>
          <li><span className="text-gray-300 font-medium">Скарги</span> — подати скаргу до Уповноваженого з прав людини Верховної Ради України або наглядового органу GDPR</li>
        </ul>
        <p className="mt-3">
          Щоб скористатися будь-яким із цих прав, напишіть нам на{' '}
          <a href="mailto:privacy@flowergoua.com" className="text-pink-400 hover:text-pink-300 underline">privacy@flowergoua.com</a>.
          Ми відповімо протягом 30 днів.
        </p>
      </Section>

      <Section title="7. Файли cookie">
        <p>
          FlowerGoUa використовує лише функціональні файли cookie, необхідні для роботи
          сесій та аутентифікації. Ми не використовуємо маркетингових або аналітичних
          cookie-файлів третіх осіб без вашої явної згоди.
        </p>
      </Section>

      <Section title="8. Діти">
        <p>
          Наші послуги не призначені для осіб молодше 16 років. Ми не збираємо свідомо
          персональні дані дітей. Якщо вам стало відомо, що дитина надала нам свої дані,
          будь ласка, зв'яжіться з нами для їх видалення.
        </p>
      </Section>

      <Section title="9. Зміни до цієї політики">
        <p>
          Ми можемо оновлювати цю Політику конфіденційності. При суттєвих змінах ми повідомимо
          вас електронним листом або через повідомлення на платформі не менше ніж за 14 днів
          до набрання змін чинності.
        </p>
      </Section>

      <Section title="10. Контакти">
        <p>
          З питань конфіденційності звертайтесь до нас:
        </p>
        <div className="mt-3 bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-sm space-y-1">
          <p><span className="text-gray-500">Email:</span> <a href="mailto:privacy@flowergoua.com" className="text-pink-400 hover:text-pink-300 underline">privacy@flowergoua.com</a></p>
          <p><span className="text-gray-500">Платформа:</span> FlowerGoUa</p>
          <p><span className="text-gray-500">Час відповіді:</span> до 30 робочих днів</p>
        </div>
      </Section>
    </div>
  )
}
