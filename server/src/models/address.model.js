const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  streetAddress: {
    type: String,
    required: true,
  },
  division: {
    type: String,
    required: true,
  },
  district: {
    type: String,
    required: true,
  },
  upazilla: {
    type: String,
    required: true,
  },
  zipCode: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
  },
  mobile: {
    type: String,
    required: true,
  },
});

const Address = mongoose.model('addresses', addressSchema);

module.exports = Address;
