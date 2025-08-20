const express=require("express");
const authenticate = require("../middleware/authenticate.js");
const isAdmin = require("../middleware/isAdmin.js");
const router=express.Router();
const adminOrderController=require("../controllers/adminOrder.controller.js")

router.get("/",authenticate,isAdmin,adminOrderController.getAllOrders);
router.put("/:orderId/confirmed",authenticate,isAdmin,adminOrderController.confirmedOrder);
router.put("/:orderId/ship",authenticate,isAdmin,adminOrderController.shippOrder);
router.put("/:orderId/deliver",authenticate,isAdmin,adminOrderController.deliverOrder);
router.put("/:orderId/cancel",authenticate,isAdmin,adminOrderController.cancelledOrder);
router.delete("/:orderId/delete",authenticate,isAdmin,adminOrderController.deleteOrder);
router.put("/:orderId/mark-due-paid",authenticate,isAdmin,adminOrderController.markDuePaid);
router.post("/outlet",authenticate,isAdmin,adminOrderController.createOutletOrder);
router.post("/:orderId/send-sms",authenticate,isAdmin,adminOrderController.sendSMSToShippingAddress);

module.exports=router;