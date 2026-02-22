import Link from 'next/link'
import { PLANS } from '@/lib/plans'

export default function Home() {
  const mostPopular = PLANS.find((p) => p.highlight) ?? PLANS[0]

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-white">
      {/* Hero */}
      <section className="border-b border-pink-100 bg-gradient-to-br from-pink-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <p className="inline-flex items-center rounded-full bg-pink-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-pink-700 mb-4">
                For small & independent flower shops
              </p>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                The simplest way to get your{' '}
                <span className="text-primary-600">flower shop online</span>.
              </h1>
              <p className="text-lg text-gray-600 mb-6">
                Bloom is a tiny, focused storefront builder for florists. Create a
                clean mini‑website for your bouquets, share one link, and start
                receiving orders in minutes—no developers, no templates to wrestle with.
              </p>
              <div className="flex flex-wrap gap-4 mb-3">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
                >
                  Get started in 5 minutes
                </Link>
                <Link
                  href="#pricing"
                  className="inline-flex items-center justify-center rounded-lg border border-pink-200 bg-white px-6 py-3 text-sm font-semibold text-pink-700 hover:bg-pink-50"
                >
                  View plans
                </Link>
              </div>
              <p className="text-xs text-gray-500">
                No credit card required. Designed for real, local flower shops—not tech companies.
              </p>
            </div>
            <div className="md:pl-8">
              <div className="rounded-3xl border border-pink-100 bg-white/70 p-5 shadow-sm backdrop-blur">
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  What you get:
                </p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Your own public shop page with a simple, honest design</li>
                  <li>• A bouquet catalog with prices and availability</li>
                  <li>• An inbox of new orders and custom requests</li>
                  <li>• A private dashboard just for your shop</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="mb-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              How it works
            </h2>
            <p className="text-gray-600">
              A guided, calm setup that takes you from “no website” to “shareable shop link”
              in a few simple steps.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-4">
            {[
              {
                step: '01',
                title: 'Pick a plan',
                text: 'Choose the plan that fits your size today. You can always upgrade later.',
              },
              {
                step: '02',
                title: 'Create your account',
                text: 'Use your shop email so customers can recognize you easily.',
              },
              {
                step: '03',
                title: 'Set up your shop',
                text: 'Name your shop, add a short “about” and opening hours, then add bouquets.',
              },
              {
                step: '04',
                title: 'Share your link',
                text: 'Share your shop page on Instagram, WhatsApp, or business cards and receive orders.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-2xl border border-gray-100 bg-gray-50 px-5 py-6 text-left"
              >
                <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-pink-100 text-xs font-semibold text-pink-700">
                  {item.step}
                </div>
                <h3 className="mb-1 text-sm font-semibold text-gray-900">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-b border-gray-100 bg-gradient-to-b from-white to-pink-50">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="mb-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Built around how real florists work
            </h2>
            <p className="text-gray-600">
              No complicated inventory systems. Just the pieces you actually need.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-pink-100">
              <div className="mb-3 text-2xl">🪻</div>
              <h3 className="mb-2 text-base font-semibold text-gray-900">
                Simple bouquet catalog
              </h3>
              <p className="text-sm text-gray-600">
                Add bouquets with photos, prices, and availability. Update them quickly
                before busy days like Valentine’s or Mother’s Day.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm border border-pink-100">
              <div className="mb-3 text-2xl">📬</div>
              <h3 className="mb-2 text-base font-semibold text-gray-900">
                Orders & custom requests
              </h3>
              <p className="text-sm text-gray-600">
                Customers can place orders or describe custom bouquets. You receive clear
                contact details so you can confirm payment and delivery your way.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm border border-pink-100">
              <div className="mb-3 text-2xl">🌍</div>
              <h3 className="mb-2 text-base font-semibold text-gray-900">
                Shop page that feels local
              </h3>
              <p className="text-sm text-gray-600">
                Your shop page highlights your story, location, and hours so customers
                know they’re buying from a real neighborhood florist.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="mb-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Simple plans that grow with your shop
            </h2>
            <p className="text-gray-600">
              Start free, upgrade when you’re ready. No contracts, no setup fees.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {PLANS.map((plan) => {
              const isPopular = plan.slug === mostPopular.slug
              return (
                <div
                  key={plan.slug}
                  className={`flex flex-col rounded-2xl border bg-white p-6 ${
                    isPopular
                      ? 'border-primary-500 shadow-md'
                      : 'border-gray-200 shadow-sm'
                  }`}
                >
                  {isPopular && (
                    <span className="mb-3 inline-flex w-fit rounded-full bg-pink-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-pink-700">
                      Most popular
                    </span>
                  )}
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    {plan.name}
                  </h3>
                  <p className="text-xl font-bold text-gray-900 mb-1">
                    {plan.priceLabel}
                  </p>
                  <p className="text-sm text-gray-600 mb-4">{plan.tagline}</p>

                  <ul className="mb-6 space-y-2 text-sm text-gray-700">
                    <li>• Up to {plan.maxBouquets} bouquets</li>
                    <li>
                      • {plan.allowProfileDetails ? 'Full shop profile' : 'Basic shop page only'}
                    </li>
                    <li>
                      • Dashboard access to manage bouquets and view orders
                    </li>
                  </ul>

                  <Link
                    href={`/signup?plan=${plan.slug}`}
                    className={`mt-auto inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold ${
                      isPopular
                        ? 'bg-primary-600 text-white hover:bg-primary-700'
                        : 'border border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Choose {plan.name}
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-r from-pink-50 to-purple-50">
        <div className="mx-auto max-w-4xl px-4 py-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            Ready to give your flower shop a simple, beautiful home online?
          </h2>
          <p className="text-gray-600 mb-6">
            Create a mini‑website for your bouquets, share one link, and let your flowers
            do the selling.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
          >
            Start your shop
          </Link>
        </div>
      </section>
    </main>
  )
}
