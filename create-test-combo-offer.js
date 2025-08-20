const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/tweest', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define the combo offer schema (same as in the model)
const comboOfferSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'categories',
    required: true
  },
  minimumQuantity: {
    type: Number,
    required: true,
    min: 2
  },
  comboPrice: {
    type: Number,
    required: true,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const ComboOffer = mongoose.model('comboOffers', comboOfferSchema);

async function createTestComboOffer() {
  try {
    console.log('🔍 Creating test combo offer...');
    
    // Men category ID
    const menCategoryId = '6823843083b01badc9d3ad0f';
    
    // Check if combo offer already exists for Men category
    const existingOffer = await ComboOffer.findOne({ category: menCategoryId });
    if (existingOffer) {
      console.log('✅ Combo offer already exists for Men category:', existingOffer);
      return existingOffer;
    }
    
    // Create new combo offer
    const comboOffer = new ComboOffer({
      name: 'Men\'s Clothing Combo Deal',
      description: 'Buy 2 or more men\'s items and save!',
      category: menCategoryId,
      minimumQuantity: 2,
      comboPrice: 1500, // 1500 BDT for 2 items (750 BDT each)
      isActive: true,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    });
    
    const savedOffer = await comboOffer.save();
    console.log('✅ Test combo offer created successfully:', savedOffer);
    return savedOffer;
    
  } catch (error) {
    console.error('❌ Error creating test combo offer:', error);
    throw error;
  }
}

// Run the script
createTestComboOffer()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }); 