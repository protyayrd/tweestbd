const express=require("express");

const router=express.Router();
const userController=require("../controllers/user.controller.js")
const authenticate = require("../middleware/authenticate.js");
const isAdmin = require("../middleware/isAdmin.js");

router.get("/",userController.getAllUsers)
router.get("/profile", userController.getUserProfile)
router.get("/validate-token", userController.validateToken)
router.get("/verify-admin", authenticate, isAdmin, userController.verifyAdminAccess)
router.get("/admin/customers", authenticate, isAdmin, userController.getAllCustomers)

// New routes for user profile management
router.put("/profile", authenticate, userController.updateUserProfile)
router.post("/change-password", authenticate, userController.changePassword)

// Admin routes for customer management
router.post("/admin/customers", authenticate, isAdmin, userController.createCustomer)
router.get("/admin/customers/:id", authenticate, isAdmin, userController.getUserById)
router.put("/admin/customers/:id", authenticate, isAdmin, userController.updateUserProfile)
router.delete("/admin/customers/:id", authenticate, isAdmin, userController.deleteUser)
router.post("/admin/customers/:id/reset-password", authenticate, isAdmin, userController.adminResetUserPassword)

module.exports=router;