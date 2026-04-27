import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['seller', 'buyer', 'admin'], required: true },
  registrationStatus: { type: String, enum: ['incomplete', 'completed'], default: 'incomplete' },
  onboardingStatus: { 
    type: String, 
    enum: [
      'pending', 
      'pending_validation', 
      'under_compliance_review', 
      'resubmission_required', 
      'approved_for_procurement', 
      'rejected'
    ], 
    default: 'pending' 
  },
  sectionStatus: {
    basic: { type: String, default: 'pending' },
    business: { type: String, default: 'pending' },
    compliance: { type: String, default: 'pending' },
    bank: { type: String, default: 'pending' },
    documents: { type: String, default: 'pending' },
  },
  sectionRejectionReasons: {
    basic: { type: String, default: '' },
    business: { type: String, default: '' },
    compliance: { type: String, default: '' },
    bank: { type: String, default: '' },
    documents: { type: String, default: '' },
  },
  registrationDetails: {
    businessType: String,
    verificationMethod: String, // 'aadhaar' | 'pan'
    isEmailVerified: { type: Boolean, default: false },
  },
  adminFeedback: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function(this: any) {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

export const User = mongoose.model('User', userSchema);
