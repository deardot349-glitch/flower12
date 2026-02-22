import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { slugify, generateUniqueSlug } from '@/lib/utils'
import { PLANS, getPlanConfig } from '@/lib/plans'
import { sendWelcomeEmail } from '@/lib/email/service'
import { validatePassword, validateEmail, validateShopName, sanitizeString } from '@/lib/validators'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { shopName, email, password, planSlug, location, about, workingHours } = body

    // Detailed validation
    if (!shopName || shopName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Shop name is required' },
        { status: 400 }
      )
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      )
    }

    // Validate password with strong requirements
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      )
    }

    // Validate email
    const emailValidation = validateEmail(email)
    if (!emailValidation.valid) {
      return NextResponse.json(
        { error: emailValidation.error },
        { status: 400 }
      )
    }

    // Validate shop name
    const shopNameValidation = validateShopName(shopName)
    if (!shopNameValidation.valid) {
      return NextResponse.json(
        { error: shopNameValidation.error },
        { status: 400 }
      )
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

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Ensure plans exist in the database (lazy seed)
    const existingPlans = await prisma.plan.findMany()
    if (existingPlans.length === 0) {
      console.log('Creating plans in database...')
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
      console.log('Plans created successfully')
    }

    const selectedPlanConfig = getPlanConfig(planSlug)
    const selectedPlan = await prisma.plan.findUnique({
      where: { slug: selectedPlanConfig.slug },
    })

    if (!selectedPlan) {
      console.error('Plan not found:', selectedPlanConfig.slug)
      return NextResponse.json(
        { error: 'Unable to assign subscription plan. Please try again.' },
        { status: 500 }
      )
    }

    // Generate unique slug for the shop
    const baseSlug = slugify(shopName)
    const slug = await generateUniqueSlug(baseSlug)

    console.log('Creating user and shop...')
    
    // Create user and shop in a transaction
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        shop: {
          create: {
            name: shopName.trim(),
            slug,
            planId: selectedPlan.id,
            // Only persist profile details if the chosen plan allows it
            location: selectedPlan.allowProfileDetails ? (location?.trim() || null) : null,
            about: selectedPlan.allowProfileDetails ? (about?.trim() || null) : null,
            workingHours: selectedPlan.allowProfileDetails ? (workingHours?.trim() || null) : null,
          }
        }
      },
      include: {
        shop: true
      }
    })

    console.log('User and shop created successfully:', user.id)

    // Send welcome email
    try {
      await sendWelcomeEmail(email, shopName, slug)
      console.log('Welcome email sent to:', email)
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
      // Don't fail the signup if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully! You can now login.',
      user: {
        id: user.id,
        email: user.email,
        shopSlug: user.shop?.slug
      }
    })
  } catch (error: any) {
    console.error('Signup error details:', error)
    
    // More specific error messages
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'This email or shop name is already taken. Please try a different one.' },
        { status: 400 }
      )
    }

    if (error.message.includes('database')) {
      return NextResponse.json(
        { error: 'Database connection error. Please try again later.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: `Failed to create account: ${error.message}` },
      { status: 500 }
    )
  }
}
