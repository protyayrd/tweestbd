const express=require("express");
const authenticate = require("../middleware/authenticate.js");
const router=express.Router();
const orderController=require("../controllers/order.controller.js")

router.post("/",authenticate,orderController.createOrder);
router.get("/user",authenticate,orderController.orderHistory);
router.get("/:id", orderController.findGuestOrderById);

// Guest order routes (no authentication required)
router.post("/guest", orderController.createGuestOrder);
router.get("/guest/track/:id", orderController.findGuestOrderById);
router.get("/guest/track", orderController.findGuestOrderByPhone);
router.post("/:id/send-sms", orderController.sendSMSToOrderShippingAddress);

module.exports=router;