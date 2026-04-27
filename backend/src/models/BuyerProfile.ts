import mongoose from 'mongoose';

const buyerProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  
  // Section 1: Organization Details
  organizationName: { type: String, required: true },
  businessType: { type: String, required: true },
  industry: { type: String, required: true },
  cin: { type: String },
  pan: { type: String, required: true },
  gst: { type: String },
  website: { type: String },
  
  // Section 2: Authorized Representative
  representativeName: { type: String, required: true },
  designation: { type: String },
  department: { type: String },
  email: { type: String },
  mobile: { type: String, required: true },
  alternateMobile: { type: String },
  
  // Section 3: Organization Address
  country: { type: String, default: 'India' },
  state: { type: String, required: true },
  city: { type: String, required: true },
  pincode: { type: String, required: true },
  registeredAddress: { type: String, required: true },
  corporateAddress: { type: String },
  
  // Section 4: Procurement Profile
  procurementCategories: [{ type: String }],
  otherCategoryDetails: { type: String },
  annualBudget: { type: String },
  preferredMethods: [{ type: String }],
  
  // Section 5: Documents
  documents: {
    panCard: { type: String },
    gstCert: { type: String },
    authLetter: { type: String },
    regCert: { type: String },
    addressProof: { type: String },
  },
  
  updatedAt: { type: Date, default: Date.now }
});

export const BuyerProfile = mongoose.model('BuyerProfile', buyerProfileSchema);
