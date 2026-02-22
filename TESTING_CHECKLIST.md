# ✅ Testing Checklist

## 🚀 Before Testing

### 1. Update Database
```bash
cd /Users/Mykola/Desktop/flower12
npx prisma db push
npx prisma generate
```

### 2. Start Dev Server
```bash
npm run dev
```

### 3. (Optional) Add Sample Data
```bash
npx prisma studio
```

Add:
- **StockFlower** entries (for custom bouquets)
- **WrappingOption** entries (for custom bouquets)
- Update **Shop** with contact info and delivery settings

---

## 📋 Feature Testing

### ✅ Custom Bouquet Builder

**URL:** `http://localhost:3000/[shop-slug]/custom-bouquet`

**Test Cases:**

1. **Size Selection**
   - [ ] Click Small - shows "5-15 stems"
   - [ ] Click Medium - shows "16-30 stems"
   - [ ] Click Large - shows "31-50 stems"
   - [ ] Selected size highlights in pink

2. **Flower Selection**
   - [ ] Click "Add" on a flower - adds to summary
   - [ ] Click "+" - increases quantity
   - [ ] Click "−" - decreases quantity
   - [ ] Quantity at 0 removes flower
   - [ ] Can't exceed stock count
   - [ ] Price updates in real-time
   - [ ] Total stems shows in summary

3. **Wrapping Selection**
   - [ ] Click wrapping option - toggles selection
   - [ ] Selected wrapping highlights
   - [ ] Price adds to total
   - [ ] Can deselect wrapping

4. **Special Instructions**
   - [ ] Can type in textarea
   - [ ] Text saves in form

5. **Summary Panel**
   - [ ] Shows selected size
   - [ ] Lists all flowers with quantities
   - [ ] Shows wrapping if selected
   - [ ] Displays correct total price
   - [ ] Stem count updates

6. **Validation**
   - [ ] "Proceed to Checkout" disabled if no flowers
   - [ ] Shows warning if below minimum stems
   - [ ] Can't submit with invalid data

7. **Checkout Flow**
   - [ ] Choose Pickup/Delivery works
   - [ ] Contact form validation works
   - [ ] Address required for delivery
   - [ ] Order summary shows all details
   - [ ] "Place Order" button submits
   - [ ] Success message appears
   - [ ] Redirects back to shop

---

### ✅ Shop Page - New Sections

**URL:** `http://localhost:3000/[shop-slug]`

1. **Header**
   - [ ] Cover image displays
   - [ ] Shop logo shows
   - [ ] Location opens Google Maps
   - [ ] Working hours visible
   - [ ] Cart icon shows count after ordering

2. **About Section**
   - [ ] Displays shop description
   - [ ] Icon and layout correct
   - [ ] Only shows if shop has "about" text

3. **Custom Bouquet Banner**
   - [ ] Gradient background visible
   - [ ] Animation on emoji (bounce)
   - [ ] Button links to /custom-bouquet
   - [ ] Hover effect on button

4. **Flower Cards - Enhanced**
   - [ ] Image displays or placeholder
   - [ ] Freshness badge shows:
     - "Fresh Today" for today's bouquets
     - "Made Yesterday" for yesterday
     - "X days ago" for older
   - [ ] "Made on: [DATE]" displays
   - [ ] Limited stock badge (if applicable)
   - [ ] Hover zoom on image
   - [ ] "Add to Cart" button works
   - [ ] Modal opens on click

5. **Delivery Section**
   - [ ] Same-day delivery card (if enabled)
   - [ ] Estimated time card shows
   - [ ] Delivery zones card displays
   - [ ] Only shows if delivery data exists

6. **Contact Section**
   - [ ] Address card shows location
   - [ ] "Get Directions" opens Google Maps
   - [ ] Working hours card displays
   - [ ] Quick contact buttons:
     - [ ] Call button (tel: link)
     - [ ] WhatsApp button (opens chat)
     - [ ] Telegram button (opens app)
     - [ ] Instagram button (opens profile)
   - [ ] Google Maps embed loads
   - [ ] Map is interactive

7. **Footer**
   - [ ] Shop name displays
   - [ ] Social icons work
   - [ ] Copyright year is current
   - [ ] Layout is centered

---

### ✅ Order Flow

1. **Regular Flower Order**
   - [ ] Click "Add to Cart" on flower
   - [ ] Modal opens with flower info
   - [ ] Step 1: Choose delivery/pickup
   - [ ] Step 2: Enter contact info
   - [ ] Step 3: Enter address (if delivery)
     - [ ] Estimated delivery time shows
   - [ ] Step 4: Review and submit
   - [ ] Success message appears
   - [ ] Cart count increases

2. **Delivery Estimation**
   - [ ] Before 2 PM: "Today, 2-4 hours"
   - [ ] After 2 PM: "Tomorrow, 10:00 AM - 2:00 PM"
   - [ ] Custom shop estimate if set
   - [ ] Shows in order summary

---

### ✅ Responsive Design

**Test on different screen sizes:**

1. **Mobile (< 768px)**
   - [ ] Single column layout
   - [ ] Touch-friendly buttons
   - [ ] Images scale properly
   - [ ] Text readable
   - [ ] Navigation works

2. **Tablet (768px - 1024px)**
   - [ ] 2-column flower grid
   - [ ] Cards scale nicely
   - [ ] Spacing appropriate

3. **Desktop (> 1024px)**
   - [ ] 3-column flower grid
   - [ ] Max width container
   - [ ] Hover effects work
   - [ ] Full-width sections

---

### ✅ Animations & Effects

1. **Fade-in Animations**
   - [ ] Sections fade in on load
   - [ ] Smooth, not jarring
   - [ ] Staggered delays

2. **Hover Effects**
   - [ ] Images scale on hover
   - [ ] Buttons transform
   - [ ] Cards lift (shadow increases)
   - [ ] Transitions smooth

3. **Loading States**
   - [ ] Spinner shows while loading
   - [ ] Disabled states visible
   - [ ] "Placing Order..." text appears

---

### ✅ Edge Cases

1. **No Data**
   - [ ] No flowers: Shows empty state
   - [ ] No stock flowers: Shows message
   - [ ] No wrapping: Shows message
   - [ ] No contact info: Section hidden

2. **Validation**
   - [ ] Required fields enforced
   - [ ] Phone format validated
   - [ ] Email format validated (optional field)
   - [ ] Minimum stems validated

3. **Errors**
   - [ ] Failed order shows error
   - [ ] Network error handled
   - [ ] Invalid data rejected

---

## 🎯 Manual Testing Script

### Test 1: Full Custom Bouquet Flow
```
1. Visit /[shop-slug]/custom-bouquet
2. Select "Medium" size
3. Add 10x Red Rose
4. Add 8x White Lily
5. Add 2x Pink Carnation
6. Select "Kraft Paper" wrapping
7. Type "Please make it colorful" in instructions
8. Click "Proceed to Checkout"
9. Choose "Delivery"
10. Enter contact info
11. Enter delivery address
12. Review estimated delivery time
13. Click "Place Order"
14. Verify success message
15. Check email (shop owner)
```

### Test 2: Pre-made Bouquet Order
```
1. Visit /[shop-slug]
2. Scroll to flower catalog
3. Check freshness badge
4. Check "Made on" date
5. Click "Add to Cart" on any bouquet
6. Choose "Pickup"
7. Enter contact info
8. Skip to step 3 (confirm pickup location)
9. Add special message
10. Click "Place Order"
11. Verify success
```

### Test 3: Contact Methods
```
1. Visit /[shop-slug]
2. Scroll to Contact section
3. Click "Get Directions" → Maps opens
4. Click Call button → Dialer opens
5. Click WhatsApp → WhatsApp opens
6. Click Telegram → App opens
7. Click Instagram → Profile opens
8. Verify embedded map loads
```

---

## 🐛 Common Issues & Fixes

### Database Not Updated
```bash
npx prisma db push --force-reset
npx prisma generate
```

### Prisma Client Not Generated
```bash
npx prisma generate
```

### TypeScript Errors
```bash
# Check for errors
npm run build

# If date-fns missing
npm install date-fns
```

### No Stock Flowers Showing
1. Open Prisma Studio: `npx prisma studio`
2. Go to StockFlower table
3. Add entries with:
   - name, color, pricePerStem, stockCount
   - shopId (your shop's ID)

### No Wrapping Options
1. Open Prisma Studio: `npx prisma studio`
2. Go to WrappingOption table
3. Add entries with:
   - name, price, available: true
   - shopId (your shop's ID)

---

## ✅ Success Criteria

Your implementation is successful if:

- [ ] **Custom bouquet page loads** without errors
- [ ] **Can create and order** a custom bouquet
- [ ] **Flower cards show** freshness badges
- [ ] **Delivery section** displays (if data exists)
- [ ] **Contact section** has working links
- [ ] **Google Maps** embeds correctly
- [ ] **All animations** are smooth
- [ ] **Mobile responsive** works perfectly
- [ ] **No console errors**
- [ ] **Orders save** to database

---

## 📊 Performance Checks

- [ ] Page loads in < 2 seconds
- [ ] Images lazy load
- [ ] No layout shift (CLS)
- [ ] Animations at 60fps
- [ ] No memory leaks

---

## 🎉 Final Verification

Run through this checklist:

1. [ ] Database schema updated
2. [ ] Dev server running
3. [ ] Custom bouquet builder works
4. [ ] Shop page shows all new sections
5. [ ] Freshness badges appear
6. [ ] Delivery estimation calculates
7. [ ] Contact buttons link correctly
8. [ ] Google Maps embeds
9. [ ] Responsive on mobile
10. [ ] Orders save successfully
11. [ ] Email notifications sent
12. [ ] No TypeScript errors
13. [ ] No console errors
14. [ ] Professional appearance
15. [ ] Smooth user experience

---

**If all checkboxes are ticked: 🎉 CONGRATULATIONS!**
**Your flower shop SaaS is production-ready!**

---

Last updated: 2024
Version: 2.0.0
