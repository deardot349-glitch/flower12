import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Умови використання — FlowerGoUa',
  description: 'Умови та правила використання платформи FlowerGoUa для квіткових магазинів.',
}

export default function TermsPage() {
  return (
    <div>

      {/* ── Header ── */}
      <div className="mb-10 pb-8 border-b border-white/[0.06]">
        <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-3 py-1 text-xs font-medium text-purple-400 mb-4">
          📋 Правовий документ
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Умови використання</h1>
        <p className="text-gray-500 text-sm">Остання редакція: 1 квітня 2025 р.</p>
        <p className="mt-4 text-gray-400 text-sm leading-relaxed max-w-2xl">
          Будь ласка, уважно прочитайте ці умови перед використанням платформи FlowerGoUa.
          Реєструючись або користуючись нашими послугами, ви погоджуєтесь з цими умовами
          та укладаєте з нами юридично обов&apos;язковий договір.
        </p>
      </div>

      {/* ── 1 ── */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-pink-500 to-purple-600 rounded-full inline-block flex-shrink-0" />
          1. Визначення
        </h2>
        <div className="pl-3 space-y-2 text-sm text-gray-400 leading-relaxed">
          <div className="flex gap-3"><span className="text-gray-300 font-semibold w-28 flex-shrink-0">Платформа</span><span>Веб-сайт FlowerGoUa та всі пов&apos;язані послуги.</span></div>
          <div className="flex gap-3"><span className="text-gray-300 font-semibold w-28 flex-shrink-0">Оператор</span><span>FlowerGoUa — компанія, що надає послуги платформи.</span></div>
          <div className="flex gap-3"><span className="text-gray-300 font-semibold w-28 flex-shrink-0">Продавець</span><span>Фізична або юридична особа, що зареєструвала магазин на платформі.</span></div>
          <div className="flex gap-3"><span className="text-gray-300 font-semibold w-28 flex-shrink-0">Покупець</span><span>Фізична особа, що оформлює замовлення у магазині Продавця.</span></div>
          <div className="flex gap-3"><span className="text-gray-300 font-semibold w-28 flex-shrink-0">Контент</span><span>Будь-який текст, зображення, дані, завантажені на платформу.</span></div>
        </div>
      </div>

      {/* ── 2 ── */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-pink-500 to-purple-600 rounded-full inline-block flex-shrink-0" />
          2. Реєстрація та акаунт
        </h2>
        <div className="pl-3 space-y-3 text-sm text-gray-400 leading-relaxed">
          <p>Для використання платформи необхідно зареєструватися та надати достовірні дані. Один акаунт — один магазин. Вам має бути не менше 18 років або ви повинні мати дозвіл законного представника.</p>
          <p>Ви несете повну відповідальність за безпеку свого пароля та всі дії, що відбуваються в рамках вашого акаунту. При підозрі на несанкціонований доступ — негайно повідомте нас.</p>
          <p>Ми залишаємо за собою право відмовити в реєстрації або призупинити акаунт без пояснення причин у разі порушення цих умов.</p>
        </div>
      </div>

      {/* ── 3 ── */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-pink-500 to-purple-600 rounded-full inline-block flex-shrink-0" />
          3. Опис послуг та тарифи
        </h2>
        <div className="pl-3 space-y-3 text-sm text-gray-400 leading-relaxed">
          <p>FlowerGoUa надає інструменти для створення онлайн-магазину квітів: каталог продуктів, приймання замовлень, сповіщення та управління магазином. Деталі тарифних планів описані на сторінці <Link href="/#pricing" className="text-pink-400 hover:text-pink-300 underline">Ціни</Link>.</p>
          <p><span className="text-gray-300 font-medium">Безкоштовний план</span> надається безстроково з обмеженнями, зазначеними на сторінці тарифів. Ми залишаємо за собою право змінювати ліміти безкоштовного плану з попереднім повідомленням за 30 днів.</p>
          <p><span className="text-gray-300 font-medium">Платні плани</span> оплачуються щомісяця. Оплата здійснюється вручну після схвалення адміністратором. Ми не зберігаємо повні реквізити платіжних карток.</p>
        </div>
      </div>

      {/* ── 4 ── */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-pink-500 to-purple-600 rounded-full inline-block flex-shrink-0" />
          4. Правила використання
        </h2>
        <div className="pl-3 space-y-3 text-sm text-gray-400 leading-relaxed">
          <p>Використовуючи платформу, ви зобов&apos;язуєтесь <span className="text-gray-300 font-medium">не</span>:</p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>Публікувати недостовірну, оманливу або незаконну інформацію</li>
            <li>Порушувати права інтелектуальної власності третіх осіб</li>
            <li>Намагатися отримати несанкціонований доступ до систем платформи</li>
            <li>Використовувати платформу для розповсюдження спаму або шкідливого програмного забезпечення</li>
            <li>Продавати товари, заборонені законодавством України</li>
            <li>Реєструвати кілька акаунтів для обходу обмежень плану</li>
            <li>Видавати себе за іншу особу або організацію</li>
            <li>Збирати персональні дані користувачів платформи будь-яким автоматизованим способом</li>
          </ul>
        </div>
      </div>

      {/* ── 5 ── */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-pink-500 to-purple-600 rounded-full inline-block flex-shrink-0" />
          5. Контент та інтелектуальна власність
        </h2>
        <div className="pl-3 space-y-3 text-sm text-gray-400 leading-relaxed">
          <p>Ви зберігаєте всі права на контент, який завантажуєте на платформу. Завантажуючи контент, ви надаєте нам невиключну, безоплатну ліцензію на його використання виключно з метою надання послуг платформи.</p>
          <p>Ви гарантуєте, що маєте всі необхідні права на завантажений контент і що він не порушує права третіх осіб. Ви несете повну відповідальність за законність розміщеного контенту.</p>
          <p>Логотип, назва, дизайн та технології FlowerGoUa є нашою інтелектуальною власністю і не можуть використовуватися без письмового дозволу.</p>
        </div>
      </div>

      {/* ── 6 ── */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-pink-500 to-purple-600 rounded-full inline-block flex-shrink-0" />
          6. Відносини між Продавцем та Покупцем
        </h2>
        <div className="pl-3 space-y-3 text-sm text-gray-400 leading-relaxed">
          <p>FlowerGoUa є платформою, що з&apos;єднує продавців і покупців. Ми не є стороною договору купівлі-продажу між Продавцем та Покупцем і не несемо відповідальності за:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Якість, доставку або відповідність товарів опису</li>
            <li>Дії або бездіяльність Продавця</li>
            <li>Суперечки між Продавцем та Покупцем</li>
          </ul>
          <p>Продавці самостійно несуть відповідальність за дотримання законодавства про захист прав споживачів, включаючи Закон України &quot;Про захист прав споживачів&quot;.</p>
        </div>
      </div>

      {/* ── 7 ── */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-pink-500 to-purple-600 rounded-full inline-block flex-shrink-0" />
          7. Призупинення та видалення акаунту
        </h2>
        <div className="pl-3 space-y-3 text-sm text-gray-400 leading-relaxed">
          <p>Ви можете видалити свій акаунт у будь-який час через розділ Налаштування — Небезпечна зона. Видалення є незворотнім.</p>
          <p>Ми можемо призупинити або видалити ваш акаунт за порушення цих умов, шахрайство або за рішенням суду. У разі призупинення через підозру в порушенні ми повідомимо вас та надамо можливість надати пояснення протягом 7 днів.</p>
        </div>
      </div>

      {/* ── 8 ── */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-pink-500 to-purple-600 rounded-full inline-block flex-shrink-0" />
          8. Обмеження відповідальності
        </h2>
        <div className="pl-3 space-y-3 text-sm text-gray-400 leading-relaxed">
          <p>FlowerGoUa надає послуги &quot;як є&quot; без гарантій безперебійної роботи. Ми докладаємо всіх зусиль для забезпечення 99.9% часу роботи, але не несемо відповідальності за збитки, спричинені технічними збоями, форс-мажорними обставинами або діями третіх осіб.</p>
          <p>Наша сукупна відповідальність перед вами не може перевищувати суму, сплачену вами за послуги протягом останніх 3 місяців.</p>
        </div>
      </div>

      {/* ── 9 ── */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-pink-500 to-purple-600 rounded-full inline-block flex-shrink-0" />
          9. Зміни до умов
        </h2>
        <div className="pl-3 text-sm text-gray-400 leading-relaxed">
          <p>Ми можемо оновлювати ці умови. При суттєвих змінах ми повідомимо вас електронним листом не менше ніж за 14 днів до набрання змін чинності. Продовження користування платформою після цього строку означає прийняття нових умов.</p>
        </div>
      </div>

      {/* ── 10 ── */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-pink-500 to-purple-600 rounded-full inline-block flex-shrink-0" />
          10. Застосовне право
        </h2>
        <div className="pl-3 text-sm text-gray-400 leading-relaxed">
          <p>Ці умови регулюються законодавством України. Усі спори вирішуються в судах за місцем знаходження Оператора. Якщо будь-яке положення цих умов виявиться недійсним, це не впливає на дійсність решти положень.</p>
        </div>
      </div>

      {/* ── 11 ── */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-pink-500 to-purple-600 rounded-full inline-block flex-shrink-0" />
          11. Контакти
        </h2>
        <div className="pl-3 text-sm text-gray-400 leading-relaxed">
          <p className="mb-3">З питань щодо умов використання звертайтесь:</p>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-1">
            <p><span className="text-gray-500">Email:</span> <a href="mailto:legal@flowergoua.com" className="text-pink-400 hover:text-pink-300 underline">legal@flowergoua.com</a></p>
            <p><span className="text-gray-500">Платформа:</span> FlowerGoUa</p>
            <p><span className="text-gray-500">Час відповіді:</span> до 10 робочих днів</p>
          </div>
        </div>
      </div>

    </div>
  )
}
