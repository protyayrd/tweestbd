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
      features: reqData.features || '',
      perfectFor: reqData.perfectFor || '',
      additionalInfo: reqData.additionalInfo || '',
      sku: reqData.sku || '',
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

// Find a product by slug
async function findProductBySlug(slug) {
  const product = await Product.findOne({ slug }).populate("category").exec();

  if (!product) {
    throw new Error("Product not found with slug " + slug);
  }
  return product;
}

// Get all products with filtering and pagination
async function getAllProducts(reqQuery) {
  try {
    // Ensure valid pagination parameters (1-based pageNumber)
    let pageSize = Math.max(1, parseInt(reqQuery.pageSize) || 10);
    let pageNumber = Math.max(1, parseInt(reqQuery.pageNumber) || 1);
    
    // Calculate skip value for 1-based page numbers
    let skip = (pageNumber - 1) * pageSize;
    
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

    if (typeof reqQuery.isNewArrival !== 'undefined') {
      const isNew = (reqQuery.isNewArrival === true) || (reqQuery.isNewArrival === 'true') || (reqQuery.isNewArrival === '1');
      query = query.where('isNewArrival').equals(isNew);
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
    
    // Adjust pageNumber if it exceeds totalPages (keep 1-based)
    if (totalPages === 0) {
      pageNumber = 1;
      skip = 0;
    } else if (pageNumber > totalPages) {
      pageNumber = totalPages;
      skip = (pageNumber - 1) * pageSize;
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
    categories,
    colors,
    sizes,
    minPrice,
    maxPrice,
    minDiscount,
    sort,
    stock,
    pageNumber,
    pageSize,
    isNewArrival,
    search
  } = reqData;

  pageSize = pageSize || 10;
  let query = Product.find();

  // Handle category filtering
  if (categories && categories.length > 0) {
    // If multiple categories are provided, use $in operator
    query = query.where("category").in(categories);
  } else if (category) {
    // If single category is provided, use equals
    query = query.where("category").equals(category);
  }

  if (isNewArrival !== undefined) {
    query = query.where("isNewArrival").equals(isNewArrival);
  }

  if (colors && colors.length > 0) {
    query = query.where("colors.name").in(colors);
  }

  if (sizes && sizes.length > 0) {
    query = query.where("colors.sizes.name").in(sizes);
  }

  if (minPrice && maxPrice) {
    query = query.where("discountedPrice").gte(minPrice).lte(maxPrice);
  }

  if (minDiscount) {
    query = query.where("discountPersent").gte(minDiscount);
  }

  if (stock !== undefined) {
    if (stock === 'in_stock') {
      query = query.where("colors.sizes.quantity").gt(0);
    } else if (stock === 'out_of_stock') {
      query = query.where("colors.sizes.quantity").equals(0);
    }
  }

  if (search) {
    query = query.where({
      $or: [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    });
  }

  // Apply sorting
  if (sort) {
    switch (sort) {
      case 'price_low':
        query = query.sort({ discountedPrice: 1 });
        break;
      case 'price_high':
        query = query.sort({ discountedPrice: -1 });
        break;
      case 'newest':
        query = query.sort({ createdAt: -1 });
        break;
      default:
        query = query.sort({ createdAt: -1 });
    }
  } else {
    query = query.sort({ createdAt: -1 });
  }

  // Get total count before pagination
  const totalProducts = await Product.countDocuments(query);

  // Apply pagination
  const skip = (pageNumber - 1) * pageSize;
  query = query
    .skip(skip)
    .limit(pageSize)
    .populate({
      path: 'category',
      select: 'name level parentCategory'
    });

  // Execute query
  const products = await query.exec();

  return {
    content: products,
    currentPage: pageNumber,
    totalPages: Math.ceil(totalProducts / pageSize),
    totalProducts
  };
}

// Update product ratings when reviews change
async function updateProductRating(productId, avgRating, numRatings) {
  try {
    const product = await Product.findById(productId);
    
    if (!product) {
      throw new Error(`Product not found with id ${productId}`);
    }
    
    // Update with the average rating value (a number, not an array)
    product.ratings = avgRating;
    product.numRatings = numRatings;
    
    // We don't need to modify the reviews array here, as it's managed separately
    
    await product.save();
    
    return product;
  } catch (error) {
    console.error("Error updating product ratings:", error);
    throw error;
  }
}

module.exports = {
  createProduct,
  deleteProduct,
  updateProduct,
  getAllProducts,
  findProductById,
  findProductBySlug,
  createMultipleProduct,
  findProducts,
  updateProductRating,
};
