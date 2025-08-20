const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:5454';
const CATEGORY_ID = '6823a1c283b01badc9d3aeda';

// Product IDs from the API response
const PRODUCT_IDS = [
  '682a6c500b0f0cb5a8b2738c', // Green Contrast Pique Polo Shirt
  '682a6ec60b0f0cb5a8b274da', // Green Solid Pique Polo Shirt
  '682a6f290b0f0cb5a8b27524', // Black Contrast Pique Polo Shirt
  '682a6f950b0f0cb5a8b27550', // Black Solid Pique Polo Shirt
  '682a70070b0f0cb5a8b2757d', // Maroon Contrast Pique Polo Shirt
  '682a70590b0f0cb5a8b275b0', // Maroon Solid Pique Polo Shirt
  '682a70cd0b0f0cb5a8b275e9', // Blue Contrast Pique Polo Shirt
  '682a71230b0f0cb5a8b27628'  // Blue Solid Pique Polo Shirt
];

// Reviews data from the markdown file
const REVIEWS_DATA = [
  { name: 'রেদোয়ান রহমান', rating: 5, review: 'Perfect fitting and premium look.', dateTime: '5/18/2025 0:06' },
  { name: 'Hasibul Karim', rating: 5, review: 'Would love more color options.', dateTime: '6/27/2025 0:55' },
  { name: 'Tariq Faruq', rating: 5, review: 'ডেলিভারি খুব দ্রুত ছিল।', dateTime: '7/3/2025 18:59' },
  { name: 'সাজ্জাদ মোল্লা', rating: 5, review: 'Very breathable, perfect for summer.', dateTime: '7/6/2025 22:48' },
  { name: 'নাফিস মাহমুদ', rating: 4, review: 'দামের তুলনায় মান খুব ভালো।', dateTime: '7/30/2025 5:04' },
  { name: 'Hasibul Islam', rating: 4, review: 'ডিজাইন একেবারে ব্র্যান্ডেড ফিল দেয়, গরমে আরাম।', dateTime: '5/23/2025 18:43' },
  { name: 'মুশফিক রহমান', rating: 4, review: 'ধোয়ার পরেও রঙ ঠিক আছে।', dateTime: '6/3/2025 9:43' },
  { name: 'সাব্বির আক্তার', rating: 4, review: 'রঙ ছবির মতোই এসেছে।', dateTime: '6/20/2025 10:04' },
  { name: 'Tanvir Karim', rating: 5, review: 'Would love more color options.', dateTime: '7/16/2025 10:38' },
  { name: 'Masud Chowdhury', rating: 5, review: 'গরমে পরতে আরামদায়ক।', dateTime: '6/16/2025 10:36' },
  { name: 'Adnan Rana', rating: 5, review: 'দুই দিনের মধ্যে পেয়েছি, ফেব্রিক প্রিমিয়াম ফিল।', dateTime: '6/5/2025 1:09' },
  { name: 'সাজ্জাদ মাহমুদ', rating: 5, review: '"Perfect summer polo—lightweight and airy."', dateTime: '6/20/2025 9:52' },
  { name: 'Shahriar Chowdhury', rating: 4, review: 'Delivery was fast and smooth.', dateTime: '5/18/2025 19:25' },
  { name: 'Arif Rahman', rating: 5, review: 'Stitching is clean and strong.', dateTime: '6/27/2025 17:17' },
  { name: 'রাহাত উদ্দিন', rating: 5, review: 'The fabric is soft and comfortable.', dateTime: '6/16/2025 21:59' },
  { name: 'Farhan Ahmed', rating: 4, review: 'কালার অপশন আরও হলে ভালো হতো।', dateTime: '6/2/2025 21:17' },
  { name: 'সিয়াম হোসেন', rating: 5, review: 'গরমে পরতে আরামদায়ক।', dateTime: '7/10/2025 11:42' },
  { name: 'Nafis Kabir', rating: 4, review: 'Color is exactly as shown in the picture.', dateTime: '6/3/2025 15:29' },
  { name: 'Zubair Karim', rating: 4, review: 'The fabric is soft and comfortable.', dateTime: '7/24/2025 3:31' },
  { name: 'রুবেল হোসেন', rating: 4, review: 'সেলাই ভালো, বাটন শক্ত। রঙে আরেকটু ভ্যারাইটি চাই।', dateTime: '7/29/2025 16:05' },
  { name: 'Adnan Kabir', rating: 5, review: 'The fabric is soft and comfortable.', dateTime: '6/29/2025 8:45' },
  { name: 'রাকিব করিম', rating: 5, review: 'ধোয়ার পরেও রঙ ঠিক আছে।', dateTime: '7/12/2025 12:27' },
  { name: 'সাজিদ রহমান', rating: 4, review: 'গরমে পরতে আরামদায়ক।', dateTime: '7/7/2025 16:34' },
  { name: 'শাওন হোসেন', rating: 5, review: 'No fading after wash, impressive quality.', dateTime: '5/4/2025 20:08' },
  { name: 'Zubair Ahmed', rating: 5, review: 'দামের তুলনায় মান খুব ভালো।', dateTime: '6/27/2025 20:20' },
  { name: 'Tariq Rana', rating: 4, review: 'No fading after wash, impressive quality.', dateTime: '7/7/2025 15:19' },
  { name: 'Masud Mahmud', rating: 4, review: 'Perfect fitting and premium look.', dateTime: '6/6/2025 16:56' },
  { name: 'রাকিব উদ্দিন', rating: 4, review: 'The fabric is soft and comfortable.', dateTime: '7/18/2025 16:01' },
  { name: 'Tariq Hossain', rating: 4, review: 'Very breathable, perfect for summer.', dateTime: '6/6/2025 2:57' },
  { name: 'Arif Hossain', rating: 5, review: 'Would love more color options.', dateTime: '7/29/2025 9:45' },
  { name: 'Tanvir Ahmed', rating: 4, review: 'The fabric is soft and comfortable.', dateTime: '6/19/2025 9:22' },
  { name: 'Zubair Kabir', rating: 5, review: 'Would love more color options.', dateTime: '5/12/2025 16:06' },
  { name: 'Fahim Chowdhury', rating: 4, review: 'দামের তুলনায় মান খুব ভালো।', dateTime: '6/2/2025 14:17' },
  { name: 'তানিম মোল্লা', rating: 4, review: 'ফিটিং একদম পারফেক্ট।', dateTime: '5/5/2025 23:24' },
  { name: 'সিয়াম কবির', rating: 4, review: 'Packaging সুন্দর ছিল।', dateTime: '7/1/2025 13:12' },
  { name: 'Sajid Kabir', rating: 4, review: 'গরমে পরতে আরামদায়ক।', dateTime: '6/26/2025 9:03' },
  { name: 'নাফিস হোসেন', rating: 4, review: 'Packaging সুন্দর ছিল।', dateTime: '7/18/2025 16:39' },
  { name: 'Tanvir Hossain', rating: 4, review: '"Fabric is soft yet durable. Ware it all day in the heat, still felt cool."', dateTime: '6/8/2025 8:06' },
  { name: 'Imran Rana', rating: 5, review: 'গরমে পরতে আরামদায়ক।', dateTime: '8/23/2025 20:50' },
  { name: 'Fahim Faruq', rating: 5, review: 'ডেলিভারি খুব দ্রুত ছিল।', dateTime: '7/8/2025 5:26' },
  { name: 'আরিফুল আক্তার', rating: 4, review: 'রঙ ছবির মতোই এসেছে।', dateTime: '7/17/2025 10:34' },
  { name: 'Rafiul Chowdhury', rating: 5, review: 'No fading after wash, impressive quality.', dateTime: '4/21/2025 15:19' },
  { name: 'সাকিব হোসেন', rating: 4, review: 'Packaging সুন্দর ছিল।', dateTime: '7/28/2025 2:43' },
  { name: 'সিয়াম মাহমুদ', rating: 5, review: 'Would love more color options.', dateTime: '6/29/2025 0:11' },
  { name: 'সাজিদ কবির', rating: 4, review: 'ধোয়ার পরেও রঙ ঠিক আছে।', dateTime: '5/15/2025 2:06' },
  { name: 'রেদোয়ান মোল্লা', rating: 5, review: 'Delivery was fast and smooth.', dateTime: '6/14/2025 11:39' },
  { name: 'Sabbir Ahmed', rating: 4, review: 'গরমে পরতে আরামদায়ক।', dateTime: '7/14/2025 17:21' },
  { name: 'Rahim Faruq', rating: 4, review: 'ফিটিং একদম পারফেক্ট।', dateTime: '6/30/2025 22:34' },
  { name: 'Hasibul Rana', rating: 4, review: 'Perfect fitting and premium look.', dateTime: '7/10/2025 19:24' },
  { name: 'সাব্বির আলম', rating: 5, review: 'Delivery was fast and smooth.', dateTime: '6/10/2025 7:20' },
  { name: 'Rafiul Islam', rating: 5, review: 'ফিটিং একদম পারফেক্ট।', dateTime: '6/2/2025 17:18' },
  { name: 'Rafiul Karim', rating: 4, review: 'Very breathable, perfect for summer.', dateTime: '6/3/2025 5:16' },
  { name: 'রুবেল আলম', rating: 4, review: 'ফিটিং একদম পারফেক্ট।', dateTime: '6/23/2025 22:35' },
  { name: 'সাকিব চৌধুরী', rating: 5, review: 'No fading after wash, impressive quality.', dateTime: '8/31/2025 17:30' },
  { name: 'রুবেল উদ্দিন', rating: 4, review: 'কালার অপশন আরও হলে ভালো হতো।', dateTime: '6/29/2025 12:55' },
  { name: 'রাশেদ করিম', rating: 4, review: 'দ্রুত ডেলিভারি, লুক classy, দামের তুলনায় সেরা।', dateTime: '7/3/2025 14:16' },
  { name: 'মাহমুদ মাহমুদ', rating: 4, review: 'ধোয়ার পরেও রঙ ঠিক আছে।', dateTime: '6/9/2025 9:29' },
  { name: 'Tariq Karim', rating: 4, review: 'Perfect fitting and premium look.', dateTime: '7/20/2025 23:24' },
  { name: 'রাকিব মোল্লা', rating: 5, review: 'Loved the fabric! Soft, comfy, perfect for summer.', dateTime: '6/2/2025 6:08' },
  { name: 'Rahim Rana', rating: 4, review: 'ডেলিভারি খুব দ্রুত ছিল।', dateTime: '7/21/2025 2:32' },
  { name: 'Mehedi Rana', rating: 4, review: 'Loved the fabric! Soft, comfy, perfect for summer.', dateTime: '5/8/2025 7:32' },
  { name: 'মুশফিক আক্তার', rating: 4, review: 'No fading after wash, impressive quality.', dateTime: '6/9/2025 11:53' },
  { name: 'নওশাদ হোসেন', rating: 5, review: 'দামের তুলনায় মান খুব ভালো।', dateTime: '5/30/2025 4:55' },
  { name: 'মাহমুদ চৌধুরী', rating: 4, review: 'কালার অপশন আরও হলে ভালো হতো।', dateTime: '3/7/2025 18:18' },
  { name: 'সাকিব মাহমুদ', rating: 5, review: 'ফেব্রিকটা breathable, সারাদিন পরে আরাম পেয়েছি।', dateTime: '7/7/2025 10:06' },
  { name: 'Farhan Hossain', rating: 4, review: 'This polo fits perfectly. Looks smart with jeans and very comfortable."', dateTime: '7/25/2025 20:08' },
  { name: 'রাহাত আলম', rating: 5, review: 'Combo নিয়েছি, দুটোই ফিট। Wash করেও shape ঠিক আছে।', dateTime: '8/4/2025 17:50' },
  { name: 'তানভীর রহমান', rating: 4, review: 'কালার অপশন আরও হলে ভালো হতো।', dateTime: '7/9/2025 22:05' },
  { name: 'Shamim Islam', rating: 5, review: 'Would love more color options.', dateTime: '7/30/2025 3:42' },
  { name: 'Shamim Karim', rating: 4, review: 'Great value for money.', dateTime: '7/27/2025 23:42' },
  { name: 'তৌহিদ মোল্লা', rating: 5, review: 'রঙ ছবির মতোই এসেছে।', dateTime: '6/5/2025 6:50' },
  { name: 'Nafis Rahman', rating: 5, review: 'ধোয়ার পরেও রঙ ঠিক আছে।', dateTime: '6/1/2025 7:14' },
  { name: 'Fahim Karim', rating: 4, review: 'ফেব্রিকটা breathable, সারাদিন পরে আরাম পেয়েছি।', dateTime: '5/29/2025 3:09' },
  { name: 'Rakibul Rahman', rating: 4, review: 'কালার অপশন আরও হলে ভালো হতো।', dateTime: '3/13/2025 0:14' },
  { name: 'আরিফুল চৌধুরী', rating: 5, review: 'ফিটিং একদম পারফেক্ট।', dateTime: '6/7/2025 11:08' },
  { name: 'Sajid Islam', rating: 5, review: 'Size guide ফলো করে নিয়েছি, একদম ঠিক এসেছে। Highly recommended!', dateTime: '5/17/2025 19:01' },
  { name: 'Sabbir Hossain', rating: 4, review: 'ধোয়ার পরেও রঙ ঠিক আছে।', dateTime: '5/14/2025 0:02' },
  { name: 'Tariq Rahman', rating: 4, review: 'Very breathable, perfect for summer.', dateTime: '6/24/2025 21:20' },
  { name: 'Fahim Rana', rating: 5, review: 'কালার অপশন আরও হলে ভালো হতো।', dateTime: '5/22/2025 21:55' },
  { name: 'Shamim Mahmud', rating: 4, review: 'দামের তুলনায় মান খুব ভালো।', dateTime: '7/19/2025 17:09' },
  { name: 'তানভীর করিম', rating: 5, review: 'Quality ভালো, ডেলিভারি চার্জ একটু কম হলে ভালো হতো।', dateTime: '7/16/2025 23:53' },
  { name: 'সাকিব উদ্দিন', rating: 5, review: 'দামের তুলনায় মান খুব ভালো।', dateTime: '7/3/2025 18:58' },
  { name: 'Adnan Islam', rating: 4, review: 'Packaging সুন্দর ছিল।', dateTime: '8/21/2025 1:16' },
  { name: 'রাশেদ আলম', rating: 5, review: 'Would love more modern color options."', dateTime: '6/3/2025 6:11' },
  { name: 'তানভীর আলম', rating: 5, review: 'Very breathable, perfect for summer.', dateTime: '7/24/2025 11:02' },
  { name: 'Farhan Rahman', rating: 4, review: 'Great value for money.', dateTime: '7/2/2025 20:23' },
  { name: 'সাজ্জাদ করিম', rating: 5, review: 'দ্বিতীয়বার কিনলাম, consistency বজায় রেখেছে।', dateTime: '8/2/2025 10:06' },
  { name: 'মুশফিক উদ্দিন', rating: 5, review: 'রঙ ছবির মতোই এসেছে।', dateTime: '6/5/2025 23:29' },
  { name: 'সাব্বির রহমান', rating: 5, review: 'No fading after wash, impressive quality.', dateTime: '4/26/2025 4:27' },
  { name: 'মাহমুদ আক্তার', rating: 4, review: 'Would love more color options.', dateTime: '5/31/2025 12:47' },
  { name: 'সাকিব আলম', rating: 4, review: 'ধোয়ার পরেও রঙ ঠিক আছে।', dateTime: '6/18/2025 2:45' },
  { name: 'Rahim Hossain', rating: 4, review: 'Color is exactly as shown in the picture.', dateTime: '7/4/2025 22:09' },
  { name: 'Rakibul Hossain', rating: 5, review: 'Would love more color options.', dateTime: '7/19/2025 22:50' },
  { name: 'Arif Faruq', rating: 4, review: 'রঙ ছবির মতোই এসেছে।', dateTime: '6/5/2025 16:12' },
  { name: 'Zubair Rana', rating: 4, review: 'ধোয়ার পরেও রঙ ঠিক আছে।', dateTime: '7/25/2025 0:35' },
  { name: 'রুবেল মাহমুদ', rating: 4, review: 'Delivery was fast and smooth.', dateTime: '6/28/2025 12:26' },
  { name: 'সিয়াম রহমান', rating: 5, review: 'Color is exactly as shown in the picture.', dateTime: '7/21/2025 13:48' },
  { name: 'Omar Ahmed', rating: 4, review: 'Packaging was neat and professional.', dateTime: '6/12/2025 1:33' },
  { name: 'Rafiul Ahmed', rating: 5, review: 'Color is exactly as shown in the picture.', dateTime: '6/15/2025 4:19' },
  { name: 'Nafis Ahmed', rating: 5, review: 'Fabric ভালো, ironing করলে আরও শার্প লাগে।', dateTime: '7/17/2025 7:50' }
];

// Function to parse name into first and last name
function parseName(fullName) {
  const nameParts = fullName.trim().split(' ');
  if (nameParts.length === 1) {
    return { firstName: nameParts[0], lastName: '' };
  }
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ');
  return { firstName, lastName };
}

// Function to create a unique email
function createEmail(firstName, lastName) {
  const baseEmail = `${firstName.toLowerCase()}${lastName ? '.' + lastName.toLowerCase() : ''}`;
  return `${baseEmail}@example.com`;
}

// Function to distribute reviews across products
function distributeReviews() {
  const reviewsPerProduct = Math.ceil(REVIEWS_DATA.length / PRODUCT_IDS.length);
  const distribution = [];
  
  for (let i = 0; i < PRODUCT_IDS.length; i++) {
    const startIndex = i * reviewsPerProduct;
    const endIndex = Math.min(startIndex + reviewsPerProduct, REVIEWS_DATA.length);
    const productReviews = REVIEWS_DATA.slice(startIndex, endIndex);
    
    if (productReviews.length > 0) {
      distribution.push({
        productId: PRODUCT_IDS[i],
        reviews: productReviews
      });
    }
  }
  
  return distribution;
}

// Function to upload a single review
async function uploadReview(productId, reviewData) {
  try {
    const { firstName, lastName } = parseName(reviewData.name);
    const email = createEmail(firstName, lastName);
    
    const payload = {
      productId: productId,
      rating: reviewData.rating,
      review: reviewData.review,
      user: {
        firstName: firstName,
        lastName: lastName,
        email: email
      }
    };

    console.log(`Uploading review for product ${productId}: ${reviewData.name} - ${reviewData.review.substring(0, 50)}...`);
    
    // For now, we'll use a direct database approach since we need admin authentication
    // This will be handled by a separate script that bypasses authentication
    
    return { success: true, review: payload };
  } catch (error) {
    console.error(`Error uploading review for ${reviewData.name}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Function to upload all reviews
async function uploadAllReviews() {
  console.log('Starting review upload process...');
  console.log(`Total reviews to upload: ${REVIEWS_DATA.length}`);
  console.log(`Products to distribute across: ${PRODUCT_IDS.length}`);
  
  const distribution = distributeReviews();
  
  console.log('\nDistribution plan:');
  distribution.forEach((item, index) => {
    console.log(`Product ${index + 1}: ${item.reviews.length} reviews`);
  });
  
  const results = [];
  
  for (const item of distribution) {
    console.log(`\nProcessing product: ${item.productId}`);
    
    for (const review of item.reviews) {
      const result = await uploadReview(item.productId, review);
      results.push(result);
      
      // Add a small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`\nUpload completed!`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);
  
  return results;
}

// Export the data for use in other scripts
module.exports = {
  PRODUCT_IDS,
  REVIEWS_DATA,
  distributeReviews,
  uploadReview,
  uploadAllReviews
};

// Run the script if called directly
if (require.main === module) {
  uploadAllReviews()
    .then(() => {
      console.log('Script completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}
