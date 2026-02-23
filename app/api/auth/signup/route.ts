import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { slugify, generateUniqueSlug } from '@/lib/utils'
import { PLANS, getPlanConfig } from '@/lib/plans'
import { sendWelcomeEmail } from '@/lib/email/service'
import { validatePassword, validateEmail, validateShopName } from '@/lib/validators'

async function ensurePlans() {
  const existingPlans = await prisma.plan.findMany()
  if (existingPlans.length === 0) {
    await Promise.all(
      PLANS.map((plan) =>
        prisma.plan.create({
          data: {
            name: plan.name,
            slug: plan.slug,
            description: plan.tagline,
            price: plan.price,
            durationDays: plan.durationDays,
            maxBouquets: plan.maxBouquets,
            allowProfileDetails: plan.allowProfileDetails,
            features: JSON.stringify(plan.features),
          },
        })
      )
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { shopName, email, password, planSlug, location, about, workingHours,
            cardNumber, cardExpiry, cardCvc, cardHolderName } = body

    // Validation
    if (!shopName || shopName.trim().length === 0) {
      return NextResponse.json({ error: 'Shop name is required' }, { status: 400 })
    }
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return NextResponse.json({ error: passwordValidation.error }, { status: 400 })
    }
    const emailValidation = validateEmail(email)
    if (!emailValidation.valid) {
      return NextResponse.json({ error: emailValidation.error }, { status: 400 })
    }
    const shopNameValidation = validateShopName(shopName)
    if (!shopNameValidation.valid) {
      return NextResponse.json({ error: shopNameValidation.error }, { status: 400 })
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    })
    if (existingUser) {
      return NextResponse.json(
        { error: 'This email is already registered. Please use a different email or login.' },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)

    // Ensure all plans exist in DB
    await ensurePlans()

    const selectedPlanConfig = getPlanConfig(planSlug)

    // Validate payment info for paid plans
    if (selectedPlanConfig.price > 0) {
      if (!cardNumber || !cardExpiry || !cardCvc || !cardHolderName) {
        return NextResponse.json(
          { error: 'Card details are required for paid plans' },
          { status: 400 }
        )
      }
    }

    // Fetch plans from DB
    const [selectedPlan, freePlan] = await Promise.all([
      prisma.plan.findUnique({ where: { slug: selectedPlanConfig.slug } }),
      prisma.plan.findUnique({ where: { slug: 'free' } }),
    ])

    if (!selectedPlan) {
      // Try to create it on the fly
      const planData = PLANS.find(p => p.slug === selectedPlanConfig.slug)
      if (!planData) {
        return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 })
      }
      await prisma.plan.create({
        data: {
          name: planData.name,
          slug: planData.slug,
          description: planData.tagline,
          price: planData.price,
          durationDays: planData.durationDays,
          maxBouquets: planData.maxBouquets,
          allowProfileDetails: planData.allowProfileDetails,
          features: JSON.stringify(planData.features),
        },
      })
    }

    // Re-fetch after possible creation
    const finalSelectedPlan = await prisma.plan.findUnique({ where: { slug: selectedPlanConfig.slug } })
    const finalFreePlan = freePlan || await prisma.plan.findUnique({ where: { slug: 'free' } })

    if (!finalSelectedPlan || !finalFreePlan) {
      return NextResponse.json({ error: 'Failed to set up plans. Please try again.' }, { status: 500 })
    }

    // New shops always start on the free plan; paid plan activates after payment approval
    const shopPlanId = finalFreePlan.id

    const baseSlug = slugify(shopName)
    const slug = await generateUniqueSlug(baseSlug)

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        shop: {
          create: {
            name: shopName.trim(),
            slug,
            planId: shopPlanId,
            location: finalSelectedPlan.allowProfileDetails ? (location?.trim() || null) : null,
            about: finalSelectedPlan.allowProfileDetails ? (about?.trim() || null) : null,
            workingHours: finalSelectedPlan.allowProfileDetails ? (workingHours?.trim() || null) : null,
          }
        }
      },
      include: { shop: true }
    })

    // If paid plan, create subscription + payment record
    if (selectedPlanConfig.price > 0 && user.shop) {
      const cardLast4 = cardNumber.replace(/\s/g, '').slice(-4)
      const firstDigit = cardNumber.replace(/\s/g, '')[0]
      const cardType = firstDigit === '4' ? 'Visa' :
                       firstDigit === '5' ? 'Mastercard' :
                       firstDigit === '3' ? 'Amex' : 'Card'

      const subscription = await prisma.subscription.create({
        data: {
          shopId: user.shop.id,
          planId: finalSelectedPlan.id,
          status: 'pending',
        }
      })

      await prisma.payment.create({
        data: {
          subscriptionId: subscription.id,
          amount: selectedPlanConfig.price,
          status: 'pending',
          cardHolderName: cardHolderName.trim(),
          cardLast4,
          cardType,
        }
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
        ? 'Account created! Your payment is pending verification. You\'ll get an email once approved.'
        : 'Account created successfully! You can now login.',
      user: { id: user.id, email: user.email, shopSlug: user.shop?.slug }
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
      { error: `Failed to create account: ${error.message}` },
      { status: 500 }
    )
  }
}
