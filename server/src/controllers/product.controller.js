// productController.js
const productService = require("../services/product.service.js")
const upload = require("../config/upload.js")
const multer = require('multer')

// Create a new product
async function createProduct(req, res) {
  console.log('=== Starting Product Creation ===');
  console.log('Headers:', req.headers);
  
  // Configure multer for multiple files
  const uploadFields = [];
  // Create upload fields for each possible color (up to 5 colors) with 4 images each
  for (let i = 0; i < 5; i++) {
    uploadFields.push({ name: `colorImages_${i}`, maxCount: 4 });
  }
  const uploadMultiple = upload.fields(uploadFields);

  uploadMultiple(req, res, async function(err) {
    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err);
      return res.status(400).json({ message: 'File upload error: ' + err.message });
    } else if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ message: err.message });
    }

    try {
      console.log("\n=== Product Creation Request ===");
      console.log("1. Raw Body:", req.body);
      console.log("2. Files:", req.files);

      // Parse JSON fields and process images first
      console.log('\n3. Parsing JSON fields and processing images:');
      const fieldsToParseAsJson = ['colors', 'sizeGuide'];
      fieldsToParseAsJson.forEach(field => {
        if (req.body[field]) {
          try {
            const parsed = JSON.parse(req.body[field]);
            if (field === 'colors') {
              // Process images for each color immediately after parsing
              req.body[field] = parsed.map((color, colorIndex) => {
                const colorImages = [];
                const colorFiles = req.files[`colorImages_${colorIndex}`] || [];
                
                colorFiles.forEach(file => {
                  const imagePath = `/uploads/products/${file.filename}`;
                  colorImages.push(imagePath);
                });

                return {
                  ...color,
                  images: colorImages,
                  sizes: color.sizes.map(size => ({
                    ...size,
                    quantity: Number(size.quantity)
                  }))
                };
              });
            } else {
              req.body[field] = parsed;
            }
            console.log(`✓ Parsed ${field}:`, JSON.stringify(req.body[field], null, 2));
          } catch (error) {
            console.error(`✗ Failed to parse ${field}:`, error.message);
            throw new Error(`Invalid JSON format for ${field}`);
          }
        } else {
          console.log(`- Skipping ${field}: not provided`);
        }
      });

      // Convert numeric strings to numbers
      console.log('\n4. Converting numeric fields:');
      const numericFields = {
        price: "Price",
        discountedPrice: "Discounted Price",
        discountPersent: "Discount Percentage"
      };

      Object.entries(numericFields).forEach(([field, label]) => {
        if (req.body[field]) {
          const oldValue = req.body[field];
          req.body[field] = Number(req.body[field]);
          console.log(`- ${field}: ${oldValue} -> ${req.body[field]}`);
        }
      });

      // Set default values for optional fields
      console.log('\n5. Setting default values:');
      const defaults = {
        discountedPrice: req.body.price,
        discountPersent: 0,
        isNewArrival: false
      };

      Object.entries(defaults).forEach(([field, defaultValue]) => {
        if (!req.body[field]) {
          req.body[field] = defaultValue;
          console.log(`- ${field}: ${defaultValue}`);
        }
      });

      // Calculate quantities
      console.log('\n6. Calculating quantities:');
      req.body.colors = req.body.colors.map(color => {
        const colorQuantity = color.sizes.reduce((sum, size) => sum + size.quantity, 0);
        console.log(`Total quantity for ${color.name}: ${colorQuantity}`);
        return {
          ...color,
          quantity: colorQuantity
        };
      });

      // Log all fields before validation
      console.log('\nAll fields before validation:');
      Object.entries(req.body).forEach(([key, value]) => {
        console.log(`${key}:`, typeof value === 'object' ? JSON.stringify(value, null, 2) : value);
      });

      // Validate required fields
      console.log('\n7. Validating required fields:');
      const requiredFields = {
        title: "Title",
        description: "Description",
        price: "Price",
        discountedPrice: "Discounted Price",
        discountPersent: "Discount Percentage",
        colors: "Colors",
        category: "Category"
      };

      // Validate each required field
      console.log('\nValidating each field:');
      const missingFields = [];
      const validFields = [];

      Object.entries(requiredFields).forEach(([field, label]) => {
        const value = req.body[field];
        let isValid = true;
        let validationMessage = '';

        // Check if field exists
        if (value === undefined || value === null || value === '') {
          isValid = false;
          validationMessage = 'Field is missing or empty';
        }
        // Special validation for colors
        else if (field === 'colors') {
          if (!Array.isArray(value)) {
            isValid = false;
            validationMessage = 'Colors must be an array';
          } else if (value.length === 0) {
            isValid = false;
            validationMessage = 'At least one color is required';
          } else {
            // Validate each color object
            for (let i = 0; i < value.length; i++) {
              const color = value[i];
              
              // Check if color has required properties
              if (!color.name) {
                isValid = false;
                validationMessage = `Color at index ${i} is missing name`;
                break;
              }

              if (!color.images || !Array.isArray(color.images)) {
                isValid = false;
                validationMessage = `Color "${color.name}" is missing images array`;
                break;
              }

              if (color.images.length === 0) {
                isValid = false;
                validationMessage = `No images uploaded for color "${color.name}"`;
                break;
              }

              // Check if color has sizes array
              if (!color.sizes || !Array.isArray(color.sizes) || color.sizes.length === 0) {
                isValid = false;
                validationMessage = `Color "${color.name}" must have at least one size`;
                break;
              }

              // Validate each size in the color
              for (let j = 0; j < color.sizes.length; j++) {
                const size = color.sizes[j];
                if (!size.name || typeof size.quantity !== 'number' || size.quantity < 0) {
                  isValid = false;
                  validationMessage = `Invalid size data for color "${color.name}" at size index ${j}`;
                  break;
                }
              }
            }
          }
        }

        console.log(`- ${label}: ${isValid ? '✓' : '✗'} ${validationMessage}`);
        if (typeof value === 'object') {
          console.log(`  Value: ${JSON.stringify(value, null, 2)}`);
        } else {
          console.log(`  Value: ${value}`);
        }

        if (!isValid) {
          missingFields.push(validationMessage || label);
        } else {
          validFields.push(label);
        }
      });

      // Log validation results
      console.log('\nValidation Results:');
      console.log('Valid Fields:', validFields.join(', '));
      console.log('Missing Fields:', missingFields.join(', '));

      if (missingFields.length > 0) {
        return res.status(400).json({
          error: 'Missing required fields',
          missingFields,
          message: `Please provide values for: ${missingFields.join(', ')}`
        });
      }

      // Calculate total quantity
      const totalQuantity = req.body.colors.reduce((sum, color) => {
        return sum + color.sizes.reduce((sizeSum, size) => sizeSum + size.quantity, 0);
      }, 0);

      // Prepare final product data
      const productData = {
        ...req.body,
        quantity: totalQuantity
      };

      console.log('\n8. Final Product Data:', JSON.stringify(productData, null, 2));

      const product = await productService.createProduct(productData);
      console.log('\n9. Product Created Successfully:', product._id);
      return res.status(201).json(product);
    } catch (err) {
      console.error("\n=== Error in createProduct controller ===");
      console.error("Error name:", err.name);
      console.error("Error message:", err.message);
      console.error("Error stack:", err.stack);
      
      if (err.name === 'ValidationError') {
        return res.status(400).json({ 
          error: 'Validation Error',
          details: err.message,
          message: "Please check all required fields and their formats."
        });
      }
      
      return res.status(500).json({ 
        error: 'Server Error',
        message: "Failed to create product. Please try again.",
        details: err.message
      });
    }
  });
}

// Delete a product by ID
async function deleteProduct(req, res) {
  try {
    const productId = req.params.id;
    const message = await productService.deleteProduct(productId);
    return res.json({ message });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// Update a product by ID
async function updateProduct(req, res) {
  try {
    const productId = req.params.id;
    const product = await productService.updateProduct(productId, req.body);
    return res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Get all products
// async function getAllProducts(req, res) {
//   try {
//     const products = await productService.getAllProducts();
//     res.json(products);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// }

// Find a product by ID
async function findProductById(req, res) {
  try {
    const productId = req.params.id;
    const product = await productService.findProductById(productId);
    return res.status(200).send(product);
  } catch (err) {
    return res.status(404).json({ message: err.message });
  }
}

// Find a product by slug
async function findProductBySlug(req, res) {
  try {
    const slug = req.params.slug;
    const product = await productService.findProductBySlug(slug);
    return res.status(200).send(product);
  } catch (err) {
    return res.status(404).json({ message: err.message });
  }
}

// Find products by category
async function findProductByCategory(req, res) {
  try {
    const category = req.params.category;
    const products = await productService.findProductByCategory(category);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Search products by query
async function searchProduct(req, res) {
  try {
    // Check if query is in params or query string
    const query = req.params.query || req.query.q;
    
    if (!query) {
      return res.status(400).json({ 
        error: 'Missing search query',
        message: 'Please provide a search query parameter'
      });
    }

    // Use findProducts service with search functionality
    const products = await productService.searchProduct(query);
    
    return res.status(200).json({ 
      success: true,
      products
    });
  } catch (err) {
    console.error('Error in product search:', err);
    return res.status(500).json({ 
      error: err.message,
      success: false
    });
  }
}

// Get all products with filtering and pagination
async function getAllProducts(req, res) {
  try {

    const products = await productService.getAllProducts(req.query);

    return res.status(200).send(products);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

const createMultipleProduct= async (req, res) => {
  try {
    await productService.createMultipleProduct(req.body)
    res
      .status(202)
      .json({ message: "Products Created Successfully", success: true });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

module.exports = {
  createProduct,
  deleteProduct,
  updateProduct,
  getAllProducts,
  findProductById,
  findProductBySlug,
  findProductByCategory,
  searchProduct,
  createMultipleProduct

};
