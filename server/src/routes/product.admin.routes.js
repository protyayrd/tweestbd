const express=require("express");
const router=express.Router();
const productController=require("../controllers/product.controller.js");
const authenticate = require("../middleware/authenticate.js");
const isAdmin = require("../middleware/isAdmin.js");

router.post('/', authenticate, isAdmin, productController.createProduct);
router.post('/creates', authenticate, isAdmin, productController.createMultipleProduct);
router.delete('/:id', authenticate, isAdmin, productController.deleteProduct);
router.put('/:id', authenticate, isAdmin, productController.updateProduct);

module.exports=router;