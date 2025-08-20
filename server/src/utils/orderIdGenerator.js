const Counter = require('../models/counter.model');

/**
 * Generates a formatted order ID with the pattern: YY(year)MM(month)XXXXXX(six-digit sequence number)
 * The sequence number resets at the beginning of each month
 * Format example: 25050000001 (First order of May 2025)
 * 
 * @returns {Promise<string>} The formatted order ID
 */
async function generateOrderId() {
  try {
    const now = new Date();
    const year = now.getFullYear() % 100; // Get last 2 digits of year
    const month = now.getMonth() + 1; // JS months are 0-indexed
    
    // Format: "orderCounter-YYMM"
    const counterName = `orderCounter-${year}${month.toString().padStart(2, '0')}`;
    
    // Find or create counter for current year and month
    let counter = await Counter.findOne({ 
      name: counterName
    });
    
    if (!counter) {
      // Create a new counter for this year and month
      counter = new Counter({
        name: counterName,
        value: 0,
        year: year,
        month: month
      });
    }
    
    // Increment counter
    counter.value += 1;
    await counter.save();
    
    // Format the counter value to ensure it's 6 digits with leading zeros
    const sequenceNumber = counter.value.toString().padStart(6, '0');
    
    // Format: YY(year)MM(month)XXXXXX(six-digit sequence)
    return `${year}${month.toString().padStart(2, '0')}${sequenceNumber}`;
  } catch (error) {
    console.error('Error generating order ID:', error);
    throw error;
  }
}

module.exports = { generateOrderId }; 