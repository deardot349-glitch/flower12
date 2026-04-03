/**
 * Demo shop seeder — creates 3 beautiful showcase shops.
 * Run with:  npx tsx prisma/seed-demos.ts
 *
 * Safe to re-run — skips shops whose slug already exists.
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const weekdays = (open: string, close: string, closeSun = true) =>
  JSON.stringify({
    monday:    { open, close, closed: false },
    tuesday:   { open, close, closed: false },
    wednesday: { open, close, closed: false },
    thursday:  { open, close, closed: false },
    friday:    { open, close, closed: false },
    saturday:  { open: '10:00', close: '17:00', closed: false },
    sunday:    { open, close, closed: closeSun },
  })

const DEMOS = [
  {
    email:    'poetry@flowergoua.demo',
    password: 'Demo1234!',
    planSlug: 'premium',
    shop: {
      name:                '\u041a\u0432\u0456\u0442\u043a\u043e\u0432\u0430 \u041f\u043e\u0435\u0437\u0456\u044f',
      slug:                'kvitkov-poetry',
      about:               '\u041c\u0438 \u2014 \u043c\u0430\u0439\u0441\u0442\u0435\u0440\u043d\u044f \u0430\u0432\u0442\u043e\u0440\u0441\u044c\u043a\u0438\u0445 \u0431\u0443\u043a\u0435\u0442\u0456\u0432 \u0443 \u0441\u0435\u0440\u0446\u0456 \u041a\u0438\u0454\u0432\u0430. \u041a\u043e\u0436\u043d\u0430 \u043a\u043e\u043c\u043f\u043e\u0437\u0438\u0446\u0456\u044f \u2014 \u0446\u0435 \u043c\u0430\u043b\u0435\u043d\u044c\u043a\u0438\u0439 \u0432\u0438\u0442\u0432\u0456\u0440 \u043c\u0438\u0441\u0442\u0435\u0446\u0442\u0432\u0430, \u0441\u0442\u0432\u043e\u0440\u0435\u043d\u0438\u0439 \u0437 \u043b\u044e\u0431\u043e\u0432\'\u044e \u0442\u0430 \u0443\u0432\u0430\u0433\u043e\u044e \u0434\u043e \u0434\u0435\u0442\u0430\u043b\u0435\u0439.\n\n\u041f\u0440\u0430\u0446\u044e\u0454\u043c\u043e \u0437 \u043d\u0430\u0439\u0441\u0432\u0456\u0436\u0456\u0448\u0438\u043c\u0438 \u043a\u0432\u0456\u0442\u0430\u043c\u0438 \u0432\u0456\u0434 \u043f\u0435\u0440\u0435\u0432\u0456\u0440\u0435\u043d\u0438\u0445 \u043f\u043e\u0441\u0442\u0430\u0447\u0430\u043b\u044c\u043d\u0438\u043a\u0456\u0432. \u0414\u043e\u0441\u0442\u0430\u0432\u043b\u044f\u0454\u043c\u043e \u043f\u043e \u0432\u0441\u044c\u043e\u043c\u0443 \u041a\u0438\u0454\u0432\u0443 \u0449\u043e\u0434\u043d\u044f.',
      location:            '\u0432\u0443\u043b. \u0425\u0440\u0435\u0449\u0430\u0442\u0438\u043a, 15',
      city:                '\u041a\u0438\u0457\u0432',
      country:             '\u0423\u043a\u0440\u0430\u0457\u043d\u0430',
      phoneNumber:         '+380 44 123 45 67',
      whatsappNumber:      '380441234567',
      telegramHandle:      '@kvit_poetry',
      instagramHandle:     '@kvit.poetry',
      email:               'info@kvit-poetry.ua',
      primaryColor:        '#ec4899',
      accentColor:         '#a855f7',
      currency:            'UAH',
      workingHours:        weekdays('09:00', '20:00', false),
      sameDayDelivery:     true,
      deliveryCutoffTime:  '15:00',
      deliveryTimeEstimate:'2\u20133 \u0433\u043e\u0434\u0438\u043d\u0438',
      minimumOrderAmount:  500,
      showDeliveryEstimate:true,
      allowCustomBouquet:  true,
      layoutStyle:         'classic',
    },
    flowers: [
      { name: '\u0420\u043e\u0436\u0435\u0432\u0430 \u043c\u0440\u0456\u044f',       price: 850,  availability: 'in_stock', description: '\u041d\u0456\u0436\u043d\u0438\u0439 \u0431\u0443\u043a\u0435\u0442 \u0456\u0437 \u0440\u043e\u0436\u0435\u0432\u0438\u0445 \u043f\u0456\u043e\u043d\u043e\u043f\u043e\u0434\u0456\u0431\u043d\u0438\u0445 \u0442\u0440\u043e\u044f\u043d\u0434. \u0406\u0434\u0435\u0430\u043b\u044c\u043d\u043e \u0434\u043b\u044f \u0432\u0438\u0437\u043d\u0430\u043d\u043d\u044f \u0432 \u043a\u043e\u0445\u0430\u043d\u043d\u0456.' },
      { name: '\u0424\u0456\u043e\u043b\u0435\u0442\u043e\u0432\u0438\u0439 \u0437\u0430\u0445\u0456\u0434',  price: 1200, availability: 'in_stock', description: '\u0412\u0438\u0448\u0443\u043a\u0430\u043d\u0456 \u0444\u0456\u043e\u043b\u0435\u0442\u043e\u0432\u0456 \u043e\u0440\u0445\u0456\u0434\u0435\u0457 \u0437 \u0437\u0435\u043b\u0435\u043d\u044c\u044e \u0435\u0432\u043a\u0430\u043b\u0456\u043f\u0442\u0430. \u0415\u043b\u0435\u0433\u0430\u043d\u0442\u043d\u0456\u0441\u0442\u044c \u0443 \u043a\u043e\u0436\u043d\u0456\u0439 \u043f\u0435\u043b\u044e\u0441\u0442\u0446\u0456.' },
      { name: '\u0421\u043e\u043d\u044f\u0447\u043d\u0430 \u0422\u043e\u0441\u043a\u0430\u043d\u0430',    price: 750,  availability: 'in_stock', description: '\u042f\u0441\u043a\u0440\u0430\u0432\u0438\u0439 \u0431\u0443\u043a\u0435\u0442 \u0456\u0437 \u0441\u043e\u043d\u044f\u0448\u043d\u0438\u043a\u0456\u0432, \u0436\u043e\u0432\u0442\u0438\u0445 \u0442\u0440\u043e\u044f\u043d\u0434 \u0456 \u043f\u043e\u043b\u044c\u043e\u0432\u0438\u0445 \u043a\u0432\u0456\u0442\u0456\u0432.' },
      { name: '\u0411\u0456\u043b\u0438\u0439 \u0430\u043d\u0433\u0435\u043b',        price: 950,  availability: 'in_stock', description: '\u0427\u0438\u0441\u0442\u0456 \u0431\u0456\u043b\u0456 \u043b\u0456\u043b\u0456\u0457 \u0442\u0430 \u0435\u0443\u0441\u0442\u043e\u043c\u0430 \u2014 \u0441\u0438\u043c\u0432\u043e\u043b \u0447\u0438\u0441\u0442\u043e\u0442\u0438 \u0456 \u043d\u0456\u0436\u043d\u043e\u0441\u0442\u0456.' },
      { name: '\u041a\u043e\u0440\u0430\u043b \u043e\u0441\u0442\u0440\u0456\u0432',      price: 1100, availability: 'in_stock', description: '\u041a\u043e\u0440\u0430\u043b\u043e\u0432\u0456 \u0442\u0440\u043e\u044f\u043d\u0434\u0438 \u0442\u0430 orange spray \u2014 \u0442\u0435\u043f\u043b\u043e \u0456 \u0440\u0430\u0434\u0456\u0441\u0442\u044c \u0443 \u0431\u0443\u043a\u0435\u0442\u0456.' },
      { name: '\u041b\u0430\u0432\u0430\u043d\u0434\u043e\u0432\u0438\u0439 \u0441\u043e\u043d',    price: 680,  availability: 'in_stock', description: '\u0421\u043f\u0440\u0430\u0432\u0436\u043d\u044f \u043b\u0430\u0432\u0430\u043d\u0434\u0430 \u0437 \u041f\u0440\u043e\u0432\u0430\u043d\u0441\u0430 \u0456\u0437 \u0433\u0456\u043b\u043a\u0430\u043c\u0438 \u0441\u0443\u043d\u0438\u0447\u043d\u043e\u0433\u043e \u0434\u0435\u0440\u0435\u0432\u0430.' },
      { name: '\u041c\u0456\u0441\u0442\u0438\u0447\u043d\u0438\u0439 \u043b\u0456\u0441',      price: 1350, availability: 'in_stock', description: '\u0422\u0435\u043c\u043d\u043e-\u0431\u043e\u0440\u0434\u043e\u0432\u0456 \u0442\u0440\u043e\u044f\u043d\u0434\u0438, \u0447\u043e\u0440\u043d\u0430 \u043e\u043a\u0441\u0430\u043c\u0438\u0442 \u0442\u0430 \u0442\u0430\u0454\u043c\u043d\u0438\u0447\u043d\u0430 \u0437\u0435\u043b\u0435\u043d\u044c.' },
      { name: '\u0412\u0435\u0441\u043d\u044f\u043d\u0438\u0439 \u043f\u043e\u0446\u0456\u043b\u0443\u043d\u043e\u043a',  price: 590,  availability: 'limited',  description: '\u0422\u044e\u043b\u044c\u043f\u0430\u043d\u0438, \u043d\u0430\u0440\u0446\u0438\u0441\u0438 \u0442\u0430 \u0433\u0456\u0430\u0446\u0438\u043d\u0442\u0438 \u2014 \u043a\u0432\u0456\u043d\u0442\u0435\u0441\u0435\u043d\u0446\u0456\u044f \u0432\u0435\u0441\u043d\u0438.' },
    ],
    zones: [
      { name: '\u0426\u0435\u043d\u0442\u0440 (\u041f\u0435\u0447\u0435\u0440\u0441\u044c\u043a, \u0428\u0435\u0432\u0447\u0435\u043d\u043a\u0456\u0432\u0441\u044c\u043a\u0438\u0439)',   fee: 150, estimatedMinHours: 1, estimatedMaxHours: 2 },
      { name: '\u041b\u0456\u0432\u0438\u0439 \u0431\u0435\u0440\u0435\u0433 (\u0414\u0430\u0440\u043d\u0438\u0446\u044f, \u0414\u0435\u0441\u043d\u044f\u043d\u0441\u044c\u043a\u0438\u0439)', fee: 200, estimatedMinHours: 2, estimatedMaxHours: 3 },
      { name: '\u041f\u0440\u0430\u0432\u0438\u0439 \u0431\u0435\u0440\u0435\u0433 (\u041e\u0431\u043e\u043b\u043e\u043d\u044c, \u041f\u043e\u0434\u043e\u043b)',    fee: 175, estimatedMinHours: 2, estimatedMaxHours: 3 },
      { name: '\u041f\u0440\u0438\u043c\u0456\u0441\u044c\u043a\u0430 \u0437\u043e\u043d\u0430 (\u0434\u043e 30 \u043a\u043c)',          fee: 350, estimatedMinHours: 3, estimatedMaxHours: 5 },
    ],
  },

  {
    email:    'garden@flowergoua.demo',
    password: 'Demo1234!',
    planSlug: 'basic',
    shop: {
      name:                '\u0421\u0430\u0434 \u041d\u0430\u0442\u0445\u043d\u0435\u043d\u043d\u044f',
      slug:                'sad-nakhnennia',
      about:               '\u041a\u0432\u0456\u0442\u043a\u043e\u0432\u0430 \u0441\u0442\u0443\u0434\u0456\u044f \u0443 \u041b\u044c\u0432\u043e\u0432\u0456. \u0421\u043f\u0435\u0446\u0456\u0430\u043b\u0456\u0437\u0443\u0454\u043c\u043e\u0441\u044f \u043d\u0430 \u0432\u0435\u0441\u0456\u043b\u044c\u043d\u0456\u0439 \u0444\u043b\u043e\u0440\u0438\u0441\u0442\u0438\u0446\u0456, \u043a\u043e\u0440\u043f\u043e\u0440\u0430\u0442\u0438\u0432\u043d\u043e\u043c\u0443 \u0434\u0435\u043a\u043e\u0440\u0456 \u0442\u0430 \u043d\u0430\u0442\u0443\u0440\u0430\u043b\u044c\u043d\u0438\u0445 \u0431\u0443\u043a\u0435\u0442\u0430\u0445 \u0443 \u0441\u0442\u0438\u043b\u0456 botanical garden.\n\n\u041a\u043e\u0436\u0435\u043d \u0431\u0443\u043a\u0435\u0442 \u2014 \u0436\u0438\u0432\u0438\u0439 \u0442\u0430 \u0443\u043d\u0456\u043a\u0430\u043b\u044c\u043d\u0438\u0439, \u044f\u043a \u0456 \u0432\u0430\u0448 \u043c\u043e\u043c\u0435\u043d\u0442.',
      location:            '\u043f\u043b. \u0420\u0438\u043d\u043e\u043a, 8',
      city:                '\u041b\u044c\u0432\u0456\u0432',
      country:             '\u0423\u043a\u0440\u0430\u0457\u043d\u0430',
      phoneNumber:         '+380 32 987 65 43',
      whatsappNumber:      '380329876543',
      telegramHandle:      '@sad_nakhnennia',
      instagramHandle:     '@sad.nakhnennia',
      email:               'hello@sad-nakhnennia.ua',
      primaryColor:        '#22c55e',
      accentColor:         '#10b981',
      currency:            'UAH',
      workingHours:        weekdays('10:00', '19:00'),
      sameDayDelivery:     true,
      deliveryCutoffTime:  '14:00',
      deliveryTimeEstimate:'1\u20133 \u0433\u043e\u0434\u0438\u043d\u0438',
      minimumOrderAmount:  400,
      showDeliveryEstimate:true,
      allowCustomBouquet:  false,
      layoutStyle:         'modern',
    },
    flowers: [
      { name: '\u0411\u043e\u0442\u0430\u043d\u0456\u0447\u043d\u0438\u0439 \u0441\u0430\u0434',   price: 720,  availability: 'in_stock', description: '\u041f\u043e\u043b\u044c\u043e\u0432\u0438\u0439 \u0431\u0443\u043a\u0435\u0442 \u0443 \u0441\u0442\u0438\u043b\u0456 botanical: \u0440\u043e\u043c\u0430\u0448\u043a\u0438, \u0435\u0445\u0456\u043d\u0430\u0446\u0435\u044f, \u043a\u043e\u0432\u0438\u043b\u0430 \u0442\u0430 \u0441\u0443\u0445\u0430 \u043b\u0430\u0432\u0430\u043d\u0434\u0430.' },
      { name: '\u0421\u043c\u0430\u0440\u0430\u0433\u0434\u043e\u0432\u0430 \u043a\u0430\u0437\u043a\u0430', price: 890,  availability: 'in_stock', description: '\u0417\u0435\u043b\u0435\u043d\u0456 \u0445\u0440\u0438\u0437\u0430\u043d\u0442\u0435\u043c\u0438, \u0430\u043d\u0442\u0443\u0440\u0456\u0443\u043c \u0442\u0430 \u0442\u0440\u043e\u043f\u0456\u0447\u043d\u0435 \u043b\u0438\u0441\u0442\u044f \u2014 \u043d\u0435\u043e\u0447\u0456\u043a\u0443\u0432\u0430\u043d\u043e \u0441\u0432\u0456\u0436\u043e.' },
      { name: '\u041f\u0435\u0440\u0441\u0438\u043a\u043e\u0432\u0438\u0439 \u0437\u0430\u0445\u0456\u0434', price: 650,  availability: 'in_stock', description: '\u041f\u0435\u0440\u0441\u0438\u043a\u043e\u0432\u0456 \u0433\u0435\u0440\u0431\u0435\u0440\u0438 \u0442\u0430 \u043c\u0430\u0442\u0456\u043e\u043b\u0430 \u2014 \u043b\u0435\u0433\u043a\u0456\u0441\u0442\u044c \u0456 \u0440\u043e\u043c\u0430\u043d\u0442\u0438\u043a\u0430.' },
      { name: '\u0414\u0438\u043a\u0430 \u0442\u0440\u043e\u044f\u043d\u0434\u0430',     price: 980,  availability: 'in_stock', description: 'Garden roses \u0443 \u0441\u0442\u0438\u043b\u0456 \u00abjust picked from the garden\u00bb.' },
      { name: '\u041b\u0456\u0441\u043e\u0432\u0430 \u0444\u0435\u044f',       price: 550,  availability: 'in_stock', description: '\u041f\u0430\u043f\u043e\u0440\u043e\u0442\u044c, \u043c\u043e\u0445, \u0441\u0443\u0445\u043e\u0432\u0435\u0440\u0448\u043a\u0438 \u0442\u0430 \u043f\u043e\u043b\u044c\u043e\u0432\u0456 \u043a\u0432\u0456\u0442\u0438 \u2014 \u043c\u0430\u0433\u0456\u044f \u043f\u0440\u0438\u0440\u043e\u0434\u0438.' },
    ],
    zones: [
      { name: '\u0426\u0435\u043d\u0442\u0440\u0430\u043b\u044c\u043d\u0438\u0439 \u0440\u0430\u0439\u043e\u043d',    fee: 80,  estimatedMinHours: 1, estimatedMaxHours: 2 },
      { name: '\u0406\u043d\u0448\u0456 \u0440\u0430\u0439\u043e\u043d\u0438 \u041b\u044c\u0432\u043e\u0432\u0430',   fee: 120, estimatedMinHours: 2, estimatedMaxHours: 3 },
    ],
  },

  {
    email:    'boutique@flowergoua.demo',
    password: 'Demo1234!',
    planSlug: 'free',
    shop: {
      name:                '\u0411\u0443\u0442\u0438\u043a \u041a\u0432\u0456\u0442\u0456\u0432',
      slug:                'butyk-kvitiv',
      about:               '\u041c\u0430\u043b\u0435\u043d\u044c\u043a\u0438\u0439 \u0441\u0456\u043c\u0435\u0439\u043d\u0438\u0439 \u043a\u0432\u0456\u0442\u043a\u043e\u0432\u0438\u0439 \u043c\u0430\u0433\u0430\u0437\u0438\u043d \u0432 \u041e\u0434\u0435\u0441\u0456. \u0421\u0432\u0456\u0436\u0456 \u043a\u0432\u0456\u0442\u0438 \u0449\u043e\u0434\u043d\u044f, \u043d\u0430\u0439\u043a\u0440\u0430\u0449\u0456 \u0446\u0456\u043d\u0438 \u0443 \u043c\u0456\u0441\u0442\u0456.\n\u041d\u0430\u0448\u0430 \u043c\u0435\u0442\u0430 \u2014 \u0437\u0440\u043e\u0431\u0438\u0442\u0438 \u043a\u043e\u0436\u0435\u043d \u0432\u0430\u0448 \u0434\u0435\u043d\u044c \u044f\u0441\u043a\u0440\u0430\u0432\u0456\u0448\u0438\u043c.',
      location:            '\u0432\u0443\u043b. \u0414\u0435\u0440\u0438\u0431\u0430\u0441\u0456\u0432\u0441\u044c\u043a\u0430, 12',
      city:                '\u041e\u0434\u0435\u0441\u0430',
      country:             '\u0423\u043a\u0440\u0430\u0457\u043d\u0430',
      phoneNumber:         '+380 48 456 78 90',
      whatsappNumber:      '380484567890',
      telegramHandle:      '@butyk_kvitiv',
      instagramHandle:     '@butyk.kvitiv.odesa',
      email:               'butyk.kvitiv@gmail.com',
      primaryColor:        '#8b5cf6',
      accentColor:         '#ec4899',
      currency:            'UAH',
      workingHours:        weekdays('09:00', '21:00', false),
      sameDayDelivery:     true,
      deliveryCutoffTime:  '16:00',
      deliveryTimeEstimate:'2\u20134 \u0433\u043e\u0434\u0438\u043d\u0438',
      minimumOrderAmount:  300,
      showDeliveryEstimate:true,
      allowCustomBouquet:  false,
      layoutStyle:         'list',
    },
    flowers: [
      { name: '\u041a\u043b\u0430\u0441\u0438\u0447\u043d\u0430 \u0442\u0440\u043e\u044f\u043d\u0434\u0430', price: 450, availability: 'in_stock', description: '\u0412\u0456\u0447\u043d\u0430 \u043a\u043b\u0430\u0441\u0438\u043a\u0430 \u2014 25 \u0447\u0435\u0440\u0432\u043e\u043d\u0438\u0445 \u0442\u0440\u043e\u044f\u043d\u0434. \u0406\u0434\u0435\u0430\u043b\u044c\u043d\u043e \u0434\u043b\u044f \u0431\u0443\u0434\u044c-\u044f\u043a\u043e\u0433\u043e \u043f\u0440\u0438\u0432\u043e\u0434\u0443.' },
      { name: '\u0413\u0435\u0440\u0431\u0435\u0440\u0438 \u0432 \u043f\u043e\u0434\u0430\u0440\u0443\u043d\u043e\u043a', price: 320, availability: 'in_stock', description: '\u042f\u0441\u043a\u0440\u0430\u0432\u0438\u0439 \u043c\u0456\u043a\u0441 \u0437 \u0433\u0435\u0440\u0431\u0435\u0440 5 \u043a\u043e\u043b\u044c\u043e\u0440\u0456\u0432 \u2014 \u0441\u043e\u043d\u044f\u0447\u043d\u0438\u0439 \u043d\u0430\u0441\u0442\u0440\u0456\u0439 \u0433\u0430\u0440\u0430\u043d\u0442\u043e\u0432\u0430\u043d\u043e.' },
      { name: '\u0422\u044e\u043b\u044c\u043f\u0430\u043d\u0438 \u0432\u0435\u0441\u043d\u0438',    price: 380, availability: 'in_stock', description: '15 \u0441\u0432\u0456\u0436\u0438\u0445 \u0442\u044e\u043b\u044c\u043f\u0430\u043d\u0456\u0432 \u2014 \u043f\u0440\u043e\u0441\u0442\u043e\u0442\u0430 \u0456 \u043a\u0440\u0430\u0441\u0430 \u0432 \u043e\u0434\u043d\u043e\u043c\u0443 \u0431\u0443\u043a\u0435\u0442\u0456.' },
      { name: '\u0425\u0440\u0438\u0437\u0430\u043d\u0442\u0435\u043c\u0438',       price: 290, availability: 'in_stock', description: '\u041f\u0438\u0448\u043d\u0456 \u043a\u0443\u0449\u043e\u0432\u0456 \u0445\u0440\u0438\u0437\u0430\u043d\u0442\u0435\u043c\u0438 \u2014 \u0434\u043e\u0432\u0433\u043e \u0441\u0442\u043e\u044f\u0442\u044c \u0456 \u0437\u0430\u0432\u0436\u0434\u0438 \u0434\u043e\u0440\u0435\u0447\u043d\u0456.' },
      { name: '\u041c\u0456\u043a\u0441 \u00ab\u0421\u044e\u0440\u043f\u0440\u0438\u0437\u00bb',  price: 520, availability: 'limited',  description: '\u0410\u0432\u0442\u043e\u0440\u0441\u044c\u043a\u0438\u0439 \u043c\u0456\u043a\u0441 \u043a\u0432\u0456\u0442\u0456\u0432 \u2014 \u043a\u043e\u0436\u0435\u043d \u0440\u0430\u0437 \u0443\u043d\u0456\u043a\u0430\u043b\u044c\u043d\u0438\u0439. \u0414\u043e\u0432\u0456\u0440\u0442\u0435\u0441\u044c \u043d\u0430\u0448\u043e\u043c\u0443 \u0444\u043b\u043e\u0440\u0438\u0441\u0442\u0443.' },
    ],
    zones: [],
  },
]

async function main() {
  console.log('\ud83c\udf38 Seeding demo shops...\n')

  for (const demo of DEMOS) {
    const existing = await prisma.shop.findUnique({ where: { slug: demo.shop.slug } })
    if (existing) {
      console.log(`\u23ed\ufe0f  Skipping "${demo.shop.name}" \u2014 slug already exists`)
      continue
    }

    const plan = await prisma.plan.findUnique({ where: { slug: demo.planSlug } })
    if (!plan) {
      console.log(`\u274c  Plan "${demo.planSlug}" not found \u2014 run the app once first to seed plans, then re-run this script`)
      continue
    }

    const passwordHash = await bcrypt.hash(demo.password, 10)

    const user = await prisma.user.create({
      data: {
        email:         demo.email,
        passwordHash,
        emailVerified: true,
        shop: {
          create: {
            name:                demo.shop.name,
            slug:                demo.shop.slug,
            planId:              plan.id,
            about:               demo.shop.about,
            location:            demo.shop.location,
            city:                demo.shop.city,
            country:             demo.shop.country,
            phoneNumber:         demo.shop.phoneNumber,
            whatsappNumber:      demo.shop.whatsappNumber,
            telegramHandle:      demo.shop.telegramHandle,
            instagramHandle:     demo.shop.instagramHandle,
            email:               demo.shop.email,
            primaryColor:        demo.shop.primaryColor,
            accentColor:         demo.shop.accentColor,
            currency:            demo.shop.currency,
            workingHours:        demo.shop.workingHours,
            sameDayDelivery:     demo.shop.sameDayDelivery,
            deliveryCutoffTime:  demo.shop.deliveryCutoffTime,
            deliveryTimeEstimate:demo.shop.deliveryTimeEstimate,
            minimumOrderAmount:  demo.shop.minimumOrderAmount,
            showDeliveryEstimate:demo.shop.showDeliveryEstimate,
            allowCustomBouquet:  demo.shop.allowCustomBouquet,
            layoutStyle:         demo.shop.layoutStyle,
            showPhone:           true,
            showEmail:           true,
            showWhatsapp:        true,
            showTelegram:        true,
            showInstagram:       true,
            showLocation:        true,
          },
        },
      },
      include: { shop: true },
    })

    const shopId = user.shop!.id

    for (const f of demo.flowers) {
      await prisma.flower.create({ data: { shopId, ...f } })
    }

    for (let i = 0; i < demo.zones.length; i++) {
      const z = demo.zones[i] as any
      await prisma.deliveryZone.create({
        data: {
          shopId,
          name:              z.name,
          fee:               z.fee,
          estimatedMinHours: z.estimatedMinHours,
          estimatedMaxHours: z.estimatedMaxHours,
          sameDayAvailable:  true,
          minimumOrder:      0,
          active:            true,
          sortOrder:         i,
        },
      })
    }

    console.log(`\u2705  Created "${demo.shop.name}" (/${demo.shop.slug}) \u2014 ${demo.planSlug} plan`)
    console.log(`    Login: ${demo.email} / ${demo.password}\n`)
  }

  console.log('Done! \ud83c\udf89')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
