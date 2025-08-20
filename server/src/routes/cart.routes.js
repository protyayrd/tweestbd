const express = require("express");
const authenticate = require("../middleware/authenticate.js");
const router = express.Router();
const cartController = require("../controllers/cart.controller.js");

// GET: /api/cart
router.get("/", authenticate, cartController.findUserCart);

// PUT: /api/cart/add
router.put("/add", authenticate, cartController.addItemToCart);

// DELETE: /api/cart/remove/:cartItemId
router.delete("/remove/:cartItemId", authenticate, cartController.removeCartItem);

// PUT: /api/cart/update/:cartItemId
router.put("/update/:cartItemId", authenticate, cartController.updateCartItem);

// GET: /api/cart/item/:cartItemId
router.get("/item/:cartItemId", authenticate, cartController.getCartItem);

// Promo code routes
router.post("/apply-promo", authenticate, cartController.applyPromoCode);
router.delete("/remove-promo", authenticate, cartController.removePromoCode);

// DELETE: /api/cart/clear
router.delete("/clear", authenticate, cartController.clearCart);

module.exports = router;