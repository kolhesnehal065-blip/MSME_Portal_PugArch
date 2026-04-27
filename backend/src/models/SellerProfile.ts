import mongoose from 'mongoose';

const sellerProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  
  // Step 1: Business Profile
  applicantName: { type: String, required: true },
  businessName: { type: String, required: true },
  businessType: { type: String, required: true },
  businessPanName: { type: String },
  pan: { type: String, required: true },
  aadhaarNumber: { type: String },
  legalEntityType: { type: String },
  dateOfIncorporation: { type: Date },
  turnover: { type: String },
  
  // Step 2: Contact Information
  email: { type: String },
  mobile: { type: String, required: true },
  country: { type: String, default: 'India' },
  state: { type: String, required: true },
  city: { type: String, required: true },
  pincode: { type: String, required: true },
  fullAddress: { type: String, required: true },
  
  // Step 3: Tax & Compliance
  gst: { type: String },
  udyam: { type: String },
  msmeCategory: { type: String },
  authorizedPersonPan: { type: String },
  bankAccount: { type: String },
  ifsc: { type: String },
  branchName: { type: String },
  
  // Step 4: Product / Service Details
  productCategories: [{ type: String }],
  otherCategoryDetails: { type: String },
  productList: { type: String },
  detailedProductName: { type: String },
  hsnCode: { type: String },
  brand: { type: String },
  specifications: { type: String },
  
  // Step 5: Documents (Storage URLs)
  documents: {
    panCard: { type: String },
    gstCert: { type: String },
    aadhaar: { type: String },
    addressProof: { type: String },
    udyamCert: { type: String },
    bankPassbook: { type: String },
    regProof: { type: String },
    statutoryCert: { type: String },
  },
  
  updatedAt: { type: Date, default: Date.now }
});

export const SellerProfile = mongoose.model('SellerProfile', sellerProfileSchema);
