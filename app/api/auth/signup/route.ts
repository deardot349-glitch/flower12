import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { slugify, generateUniqueSlug } from '@/lib/utils'
import { PLANS, getPlanConfig } from '@/lib/plans'
import { sendWelcomeEmail } from '@/lib/email/service'
import { validatePassword, validateEmail, validateShopName } from '@/lib/validators'

function detectCardType(cardNumber: string): string {
  const first = cardNumber.replace(/\s/g, '')[0]
  if (first === '4') return 'Visa'
  if (first === '5') return 'Mastercard'
  if (first === '3') return 'Amex'
  return 'Card'
}

async function ensurePlans() {
  await Promise.all(
    PLANS.map((plan) =>
      prisma.plan.upsert({
        where: { slug: plan.slug },
        create: {
          name:                plan.name,
          slug:                plan.slug,
          description:         plan.tagline,
          price:               plan.price,
          durationDays:        plan.durationDays,
          maxBouquets:         plan.maxBouquets,
          allowProfileDetails: plan.allowProfileDetails,
          features:            JSON.stringify(plan.features),
        },
        update: {
          name:                plan.name,
          description:         plan.tagline,
          price:               plan.price,
          durationDays:        plan.durationDays,
          maxBouquets:         plan.maxBouquets,
          allowProfileDetails: plan.allowProfileDetails,
          features:            JSON.stringify(plan.features),
        },
      })
    )
  )
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      shopName, email, password, planSlug, location, about, workingHours,
      cardNumber, cardExpiry, cardCvc, cardHolderName,
    } = body

    if (!shopName || shopName.trim().length === 0) {
      return NextResponse.json({ error: 'Shop name is required' }, { status: 400 })
    }

    const emailValidation = validateEmail(email)
    if (!emailValidation.valid) {
      return NextResponse.json({ error: emailValidation.error }, { status: 400 })
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return NextResponse.json({ error: passwordValidation.error }, { status: 400 })
    }

    const shopNameValidation = validateShopName(shopName)
    if (!shopNameValidation.valid) {
      return NextResponse.json({ error: shopNameValidation.error }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })
    if (existingUser) {
      return NextResponse.json(
        { error: 'This email is already registered. Please use a different email or login.' },
        { status: 400 }
      )
    }

    const selectedPlanConfig = getPlanConfig(planSlug)

    if (selectedPlanConfig.price > 0) {
      if (!cardNumber || !cardExpiry || !cardCvc || !cardHolderName) {
        return NextResponse.json(
          { error: 'Card details are required for paid plans' },
          { status: 400 }
        )
      }
      const rawNumber = cardNumber.replace(/\s/g, '')
      if (rawNumber.length < 13 || rawNumber.length > 19) {
        return NextResponse.json({ error: 'Invalid card number' }, { status: 400 })
      }
    }

    const passwordHash = await bcrypt.hash(password, 10)

    await ensurePlans()

    const [freePlan, selectedPlan] = await Promise.all([
      prisma.plan.findUnique({ where: { slug: 'free' } }),
      prisma.plan.findUnique({ where: { slug: selectedPlanConfig.slug } }),
    ])

    if (!freePlan || !selectedPlan) {
      return NextResponse.json(
        { error: 'Failed to set up plans. Please try again.' },
        { status: 500 }
      )
    }

    const baseSlug = slugify(shopName)
    const slug     = await generateUniqueSlug(baseSlug)

    // All new shops start on the free (Старт) plan — 7-day trial
    const user = await prisma.user.create({
      data: {
        email:         email.toLowerCase().trim(),
        passwordHash,
        emailVerified: true,
        shop: {
          create: {
            name:         shopName.trim(),
            slug,
            planId:       freePlan.id,
            location:     location?.trim() || null,
            about:        about?.trim() || null,
            workingHours: workingHours?.trim() || null,
            suspended:    false,
          },
        },
      },
      include: { shop: true },
    })

    // Create the 7-day Старт subscription — shop goes offline when it expires
    if (user.shop) {
      const trialExpiry = new Date(Date.now() + freePlan.durationDays * 24 * 60 * 60 * 1000)
      await prisma.subscription.create({
        data: {
          shopId:     user.shop.id,
          planId:     freePlan.id,
          status:     'active',
          startDate:  new Date(),
          expiryDate: trialExpiry,
        },
      })
    }

    // If user signed up for a paid plan, also queue that payment for admin approval
    if (selectedPlanConfig.price > 0 && user.shop) {
      const rawNumber = cardNumber.replace(/\s/g, '')
      const last4     = rawNumber.slice(-4)
      const cardType  = detectCardType(rawNumber)

      const subscription = await prisma.subscription.create({
        data: {
          shopId: user.shop.id,
          planId: selectedPlan.id,
          status: 'pending',
        },
      })

      await prisma.payment.create({
        data: {
          subscriptionId: subscription.id,
          amount:         selectedPlanConfig.price,
          status:         'pending',
          cardHolderName: cardHolderName.trim(),
          cardLast4:      last4,
          cardType,
        },
      })
    }

    try {
      await sendWelcomeEmail(email, shopName, slug)
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
    }

    const isPaid = selectedPlanConfig.price > 0
    return NextResponse.json({
      success: true,
      message: isPaid
        ? 'Акаунт створено! У вас є 7 днів безкоштовно. Оплату буде перевірено протягом 24 год — після цього платний план активується.'
        : 'Акаунт створено! У вас 7 днів безкоштовно (план Старт). Увійдіть та налаштуйте магазин!',
      user: { id: user.id, email: user.email, shopSlug: user.shop?.slug },
    })
  } catch (error: any) {
    console.error('Signup error:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'This email or shop name is already taken. Please try a different one.' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    )
  }
}
