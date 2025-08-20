const otpStore = new Map();

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const isValidBangladeshiPhone = (phone) => {
  const bdPhoneRegex = /^(?:\+88|88)?(01[3-9]\d{8})$/;
  return bdPhoneRegex.test(phone);
};

const storeOTP = (phone, otp) => {
  otpStore.set(phone, {
    otp,
    createdAt: Date.now(),
    attempts: 0
  });
};

const verifyOTP = (phone, submittedOTP) => {
  const otpData = otpStore.get(phone);
  
  if (!otpData) {
    return { isValid: false, message: 'OTP not found. Please request a new OTP.' };
  }

  // Check if OTP is expired (5 minutes)
  if (Date.now() - otpData.createdAt > 5 * 60 * 1000) {
    otpStore.delete(phone);
    return { isValid: false, message: 'OTP has expired. Please request a new OTP.' };
  }

  // Check attempts
  if (otpData.attempts >= 3) {
    otpStore.delete(phone);
    return { isValid: false, message: 'Maximum attempts exceeded. Please request a new OTP.' };
  }

  // Increment attempts
  otpData.attempts += 1;
  otpStore.set(phone, otpData);

  // Verify OTP
  if (otpData.otp === submittedOTP) {
    otpStore.delete(phone);
    return { isValid: true, message: 'OTP verified successfully.' };
  }

  return { 
    isValid: false, 
    message: `Invalid OTP. ${3 - otpData.attempts} attempts remaining.` 
  };
};

const cleanupOTP = (phone) => {
  otpStore.delete(phone);
};

module.exports = {
  generateOTP,
  storeOTP,
  verifyOTP,
  cleanupOTP,
  isValidBangladeshiPhone
}; 