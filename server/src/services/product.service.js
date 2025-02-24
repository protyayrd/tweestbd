const Category = require("../models/category.model");
const Product = require("../models/product.model");

// Create a new product
async function createProduct(reqData) {
  try {
    console.log("=== Creating Product in Service ===");
    console.log("Request Data:", JSON.stringify(reqData, null, 2));
    
    // Validate basic required fields
    const requiredFields = ['title', 'description', 'price', 'category', 'colors'];
    const missingFields = requiredFields.filter(field => !reqData[field]);
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate category exists
    const categoryExists = await Category.findById(reqData.category);
    if (!categoryExists) {
      throw new Error("Invalid category ID. Category not found.");
    }

    // Validate colors array
    if (!Array.isArray(reqData.colors)) {
      throw new Error("Colors must be an array");
    }

    // Map and validate each color entry with its sizes
    const colors = reqData.colors.map(c => {
      if (!c.name || !Array.isArray(c.sizes)) {
        throw new Error("Each color must have a name and sizes array");
      }

      // Validate sizes for each color
      const sizes = c.sizes.map(s => {
        if (!s.name || s.quantity === undefined) {
          throw new Error("Each size must have a name and quantity");
        }
        return {
          name: s.name,
          quantity: Number(s.quantity)
        };
      }).filter(s => s.quantity > 0);

      if (sizes.length === 0) {
        throw new Error(`Color ${c.name} must have at least one size with quantity > 0`);
      }

      // Calculate total quantity for this color
      const colorQuantity = sizes.reduce((total, size) => total + size.quantity, 0);

      return {
        name: c.name,
        images: c.images || [],
        sizes: sizes,
        quantity: colorQuantity
      };
    });

    // Calculate total quantity across all colors
    const totalQuantity = colors.reduce((total, color) => total + color.quantity, 0);

    const product = new Product({
      title: reqData.title,
      description: reqData.description,
      discountedPrice: Number(reqData.discountedPrice),
      discountPersent: Number(reqData.discountPersent),
      colors: colors,
      price: Number(reqData.price),
      quantity: totalQuantity,
      category: categoryExists._id,
      isNewArrival: reqData.isNewArrival,
      sizeGuide: reqData.sizeGuide || null
    });

    console.log("Product to save:", JSON.stringify(product.toObject(), null, 2));
    
    const savedProduct = await product.save();
    console.log("Product saved successfully:", savedProduct._id);
    return savedProduct;
  } catch (error) {
    console.error("=== Error in createProduct service ===");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    if (error.errors) {
      console.error("Validation errors:", JSON.stringify(error.errors, null, 2));
    }
    throw error; // Re-throw to be handled by controller
  }
}

// Delete a product by ID
async function deleteProduct(productId) {
  const product = await findProductById(productId);

  if (!product) {
    throw new Error("product not found with id - : ", productId);
  }

  await Product.findByIdAndDelete(productId);

  return "Product deleted Successfully";
}

// Update a product by ID
async function updateProduct(productId, reqData) {
  const updatedProduct = await Product.findByIdAndUpdate(productId, reqData);
  return updatedProduct;
}

// Find a product by ID
async function findProductById(id) {
  const product = await Product.findById(id).populate("category").exec();

  if (!product) {
    throw new Error("Product not found with id " + id);
  }
  return product;
}

// Get all products with filtering and pagination
async function getAllProducts(reqQuery) {
  try {
    // Ensure valid pagination parameters
    let pageSize = Math.max(1, parseInt(reqQuery.pageSize) || 10);
    let pageNumber = Math.max(0, parseInt(reqQuery.pageNumber) || 1);
    
    // Calculate skip value, ensuring it's non-negative
    let skip = Math.max(0, pageNumber * pageSize);
    
    console.log('Pagination params:', { pageSize, pageNumber, skip });

    // Build query based on filters
    let query = Product.find();

    if (reqQuery.category) {
      query = query.where("category").equals(reqQuery.category);
    }

    if (reqQuery.color) {
      query = query.where("colors.name").equals(reqQuery.color);
    }

    if (reqQuery.sizes) {
      query = query.where("sizes").in(reqQuery.sizes);
    }

    if (reqQuery.minPrice && reqQuery.maxPrice) {
      query = query.where("discountedPrice").gte(reqQuery.minPrice).lte(reqQuery.maxPrice);
    }

    if (reqQuery.minDiscount) {
      query = query.where("discountPercent").gte(reqQuery.minDiscount);
    }

    if (reqQuery.stock !== undefined) {
      query = query.where("quantity").gt(0);
    }

    // Get total count before applying pagination
    const totalProducts = await Product.countDocuments(query);
    
    // Calculate total pages
    const totalPages = Math.ceil(totalProducts / pageSize);
    
    // Adjust pageNumber if it exceeds totalPages
    if (totalPages > 0 && pageNumber >= totalPages) {
      pageNumber = totalPages - 1;
      skip = pageNumber * pageSize;
    }

    // Apply sorting
    if (reqQuery.sort) {
      const sortDirection = reqQuery.sort === "price_high" ? -1 : 1;
      query = query.sort({ discountedPrice: sortDirection });
    }

    // Apply pagination
    query = query.skip(skip).limit(pageSize);

    // Execute query
    const products = await query.exec();

    console.log('Query results:', { 
      totalProducts, 
      totalPages, 
      currentPage: pageNumber,
      productsReturned: products.length 
    });

    return {
      content: products,
      currentPage: pageNumber,
      totalPages,
      totalProducts
    };

  } catch (error) {
    console.error('Error in getAllProducts:', error);
    throw new Error(error.message);
  }
}

async function createMultipleProduct(products) {
  for (let product of products) {
    await createProduct(product);
  }
}

async function findProducts(reqData) {
  let {
    category,
    colors,
    sizes,
    minPrice,
    maxPrice,
    minDiscount,
    sort,
    stock,
    pageNumber,
    pageSize,
    isNewArrival
  } = reqData;

  pageSize = pageSize || 10;

  let query = Product.find();

  if (category) {
    query = query.where("category").equals(category);
  }

  if (isNewArrival !== undefined) {
    query = query.where("isNewArrival").equals(isNewArrival);
  }

  if (colors && colors.length > 0) {
    query = query.where("colors.name").in(colors);
  }

  if (sizes && sizes.length > 0) {
    query = query.where("sizes.name").in(sizes);
  }

  if (minPrice && maxPrice) {
    query = query.where("discountedPrice").gte(minPrice).lte(maxPrice);
  }

  if (minDiscount) {
    query = query.where("discountPersent").gte(minDiscount);
  }

  if (stock) {
    if (stock === "in_stock") {
      query = query.where("quantity").gt(0);
    } else if (stock === "out_of_stock") {
      query = query.where("quantity").lt(1);
    }
  }

  if (sort) {
    const sortDirection = sort.split("_")[1];
    const sortField = sort.split("_")[0];
    
    if (sortDirection === "desc") {
      query = query.sort({ [sortField]: -1 });
    } else if (sortDirection === "asc") {
      query = query.sort({ [sortField]: 1 });
    }
  }

  const totalProducts = await Product.countDocuments(query);
  const skip = (pageNumber - 1) * pageSize;

  const products = await query.skip(skip).limit(pageSize).exec();

  return {
    content: products,
    currentPage: pageNumber,
    totalPages: Math.ceil(totalProducts / pageSize),
    totalElements: totalProducts,
  };
}

module.exports = {
  createProduct,
  deleteProduct,
  updateProduct,
  getAllProducts,
  findProductById,
  createMultipleProduct,
  findProducts,
};
