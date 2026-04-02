import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { slugify, generateUniqueSlug } from '@/lib/utils'
import { PLANS, getPlanConfig } from '@/lib/plans'
import { sendWelcomeEmail, sendVerificationEmail } from '@/lib/email/service'
import { validatePassword, validateEmail, validateShopName } from '@/lib/validators'

// ─── Detect card type from first digit ─────────────────────────────────────
function detectCardType(cardNumber: string): string {
  const first = cardNumber.replace(/\s/g, '')[0]
  if (first === '4') return 'Visa'
  if (first === '5') return 'Mastercard'
  if (first === '3') return 'Amex'
  return 'Card'
}

async function ensurePlans() {
  const existingPlans = await prisma.plan.findMany()
  if (existingPlans.length === 0) {
    await Promise.all(
      PLANS.map((plan) =>
        prisma.plan.create({
          data: {
            name:               plan.name,
            slug:               plan.slug,
            description:        plan.tagline,
            price:              plan.price,
            durationDays:       plan.durationDays,
            maxBouquets:        plan.maxBouquets,
            allowProfileDetails: plan.allowProfileDetails,
            features:           JSON.stringify(plan.features),
          },
        })
      )
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      shopName, email, password, planSlug, location, about, workingHours,
      // Card fields — used only to extract last4 + type, NEVER persisted in full
      cardNumber, cardExpiry, cardCvc, cardHolderName,
    } = body

    // ── Validation ────────────────────────────────────────────────────────────
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

    // Duplicate email check
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

    // Card fields required for paid plans
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

    // Fetch plans
    const [selectedPlan, freePlan] = await Promise.all([
      prisma.plan.findUnique({ where: { slug: selectedPlanConfig.slug } }),
      prisma.plan.findUnique({ where: { slug: 'free' } }),
    ])

    if (!selectedPlan || !freePlan) {
      return NextResponse.json(
        { error: 'Failed to set up plans. Please try again.' },
        { status: 500 }
      )
    }

    // New shops always start on free; paid plan activates after manual approval
    const baseSlug = slugify(shopName)
    const slug     = await generateUniqueSlug(baseSlug)

    const user = await prisma.user.create({
      data: {
        email:        email.toLowerCase().trim(),
        passwordHash,
        shop: {
          create: {
            name:     shopName.trim(),
            slug,
            planId:   freePlan.id, // always start on free
            location: location?.trim() || null,
            about:    about?.trim() || null,
            workingHours: workingHours?.trim() || null,
          },
        },
      },
      include: { shop: true },
    })

    // If paid plan selected, create subscription + MINIMAL payment record
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
          // cardNumber, cardExpiry, cardCvc are intentionally NOT stored
        },
      })
    }

    // Generate email verification token
    const crypto = await import('crypto')
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await prisma.user.update({
      where: { id: user.id },
      data: { verificationToken, verificationTokenExpiry },
    })

    try {
      await sendWelcomeEmail(email, shopName, slug)
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
    }

    try {
      await sendVerificationEmail(email, shopName, verificationToken)
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
    }

    const isPaid = selectedPlanConfig.price > 0
    return NextResponse.json({
      success: true,
      message: isPaid
        ? 'Акаунт створено! Перевірте email (лист надійшов) та підтвердіть адресу ел. пошти. Оплату буде перевірено протягом 24 год.'
        : 'Акаунт створено! Перевірте email — лист з посиланням надійшов.',
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
    // Generic message — never expose raw error internals to the client
    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    )
  }
}
