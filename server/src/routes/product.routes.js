const express=require("express");
const router=express.Router();
const productController=require("../controllers/product.controller.js");

router.get('/', productController.getAllProducts);
router.get('/id/:id', productController.findProductById);
router.get('/slug/:slug', productController.findProductBySlug);
router.get('/search', productController.searchProduct);


module.exports = router;