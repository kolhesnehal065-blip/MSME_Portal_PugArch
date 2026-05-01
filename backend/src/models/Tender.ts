import mongoose from 'mongoose';

const tenderSchema = new mongoose.Schema({
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tenderId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  budget: { type: Number, required: true },
  description: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['draft', 'active', 'closed'], 
    default: 'draft' 
  },
  bidsCount: { type: Number, default: 0 },
  closesAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

export const Tender = mongoose.model('Tender', tenderSchema);
