# Combo Offers System Setup Guide

## Overview
The combo offer system allows you to set category-based pricing for customers who buy multiple products from the same category. For example:
- Single Semidrop shoulder tshirt: ৳790
- Buy 2 Semidrop shoulder tshirts: ৳1390 total (৳695 each)
- Buy 3 or more: (৳1390/2) × quantity = ৳695 × quantity

## Implementation Details

### 1. Database Schema
- **ComboOffer Model**: Stores combo pricing rules per category
- **Cart Model**: Updated to include combo discount fields
- **Cart Calculation**: Automatically applies combo pricing when conditions are met

### 2. Backend Components Created
- `server/src/models/comboOffer.model.js` - Data model for combo offers
- `server/src/services/comboOffer.service.js` - Business logic for combo calculations
- `server/src/controllers/comboOffer.controller.js` - API endpoints
- `server/src/routes/comboOffer.routes.js` - Route definitions
- Updated `server/src/services/cart.service.js` - Integrated combo pricing

### 3. Frontend Components Created
- `client/src/Admin/componets/ComboOffers/ComboOffersTable.jsx` - Admin table view
- `client/src/Admin/componets/ComboOffers/ComboOfferForm.jsx` - Create/edit form

## Setup Instructions

### 1. Create a Combo Offer (Admin Panel)

1. Navigate to Admin Panel → Combo Offers
2. Click "Create New Combo Offer"
3. Fill in the form:
   - **Offer Name**: "Buy 2 Get Combo Price - Semidrop Shoulder"
   - **Category**: Select "Semidrop Shoulder" category
   - **Minimum Quantity**: 2
   - **Combo Price**: 1390
   - **Description**: "Get special pricing when you buy 2 or more"
   - **Status**: Active

### 2. How It Works

When customers add products to cart:

#### Single Product (Quantity: 1)
- Price: ৳790 (regular price)
- No combo discount applied

#### Two Products (Quantity: 2)
- Regular total: ৳790 × 2 = ৳1580
- Combo total: ৳1390
- Savings: ৳190
- Price per unit: ৳695

#### Three Products (Quantity: 3)
- Regular total: ৳790 × 3 = ৳2370
- Combo total: ৳695 × 3 = ৳2085
- Savings: ৳285
- Price per unit: ৳695

## API Endpoints

### Admin Endpoints (Authenticated)
```
POST   /api/combo-offers           - Create new combo offer
GET    /api/combo-offers           - Get all combo offers
GET    /api/combo-offers/:id       - Get specific combo offer
PUT    /api/combo-offers/:id       - Update combo offer
DELETE /api/combo-offers/:id       - Delete combo offer
PATCH  /api/combo-offers/:id/toggle-status - Toggle active status
```

### Public Endpoints
```
GET /api/combo-offers/category/:categoryId - Get combo offer for category
GET /api/combo-offers/pricing?categoryId=...&quantity=... - Calculate combo pricing
```

## Testing the Implementation

### 1. Create Test Combo Offer
```bash
curl -X POST http://localhost:5000/api/combo-offers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "Semidrop Shoulder Combo",
    "category": "CATEGORY_ID_HERE",
    "minimumQuantity": 2,
    "comboPrice": 1390,
    "description": "Buy 2 or more Semidrop shoulder tshirts",
    "isActive": true
  }'
```

### 2. Test Cart Calculation
Add products to cart and verify pricing:
- Add 1 item: Should show regular price
- Add 2nd item of same category: Should apply combo pricing
- Add 3rd item: Should maintain per-unit combo price

### 3. Admin Panel Testing
1. Navigate to `/admin/combo-offers`
2. Create, edit, and manage combo offers
3. Toggle status and verify changes reflect in cart

## Calculation Logic

The combo offer calculation follows this logic:

1. **Group cart items by category**
2. **Check if combo offer exists for category**
3. **Verify minimum quantity is met**
4. **Calculate per-unit combo price**: `comboPrice / minimumQuantity`
5. **Apply to all items in that category**: `perUnitPrice × totalQuantity`

### Example Calculation
For Semidrop Shoulder category:
- Combo Price: ৳1390 for 2 items
- Per-unit combo price: ৳1390 ÷ 2 = ৳695
- For 3 items: ৳695 × 3 = ৳2085
- For 4 items: ৳695 × 4 = ৳2780

## Cart Display
The cart will show:
- Original price per item
- Combo price per item (if applicable)
- Total savings from combo offer
- Applied combo offer name

## Future Enhancements
1. **Multiple combo tiers** (e.g., buy 2 get price A, buy 5 get price B)
2. **Time-based combo offers** (weekend specials)
3. **Cross-category combos** (buy from category A + B)
4. **Customer-specific combo rates** (VIP pricing)

## Database Migration
If you need to add combo offers to existing data:

```javascript
// Add this to your migration scripts
const ComboOffer = require('./models/comboOffer.model');

// Example: Create combo offer for existing category
await ComboOffer.create({
  name: "Semidrop Shoulder Combo",
  category: "YOUR_CATEGORY_ID",
  minimumQuantity: 2,
  comboPrice: 1390,
  isActive: true,
  createdBy: "ADMIN_USER_ID"
});
```

## Notes
- Combo offers are automatically applied when conditions are met
- Only one combo offer per category is supported
- Combo pricing takes precedence over individual product discounts for the combo calculation
- Promo codes are applied after combo pricing is calculated 