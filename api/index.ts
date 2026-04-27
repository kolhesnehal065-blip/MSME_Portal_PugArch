import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

// Import Models
import { User } from '../backend/src/models/User.ts';
import { SellerProfile } from '../backend/src/models/SellerProfile.ts';
import { BuyerProfile } from '../backend/src/models/BuyerProfile.ts';
import { Otp } from '../backend/src/models/Otp.ts';
import { authenticate, authorizeAdmin } from '../backend/src/middleware/auth.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-procure-key';
const MONGODB_URI = process.env.MONGODB_URI || '';

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer Storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Nodemailer Transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const app = express();

app.use(cors());
app.use(express.json());

// --- MongoDB Connection (cached for serverless) ---
let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(MONGODB_URI);
  isConnected = true;
}

// Middleware to ensure DB is connected on each request
app.use(async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// --- File Upload ---
app.post('/api/upload', authenticate, upload.single('file'), async (req: any, res: any) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = 'data:' + req.file.mimetype + ';base64,' + b64;
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'msme_marketplace_docs',
      resource_type: 'auto'
    });
    res.json({ url: result.secure_url, publicId: result.public_id });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to upload to Cloudinary' });
  }
});

// --- Auth: Send Email OTP ---
app.post('/api/auth/send-email-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.deleteMany({ email });
    await new Otp({ email, otp }).save();
    const mailOptions = {
      from: `"PugArch Admin" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Your Email Verification Code - PugArch MSME Marketplace',
      html: `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #eee;border-radius:10px"><h2 style="color:#2563eb;text-align:center">PugArch Verification</h2><p>Your OTP code (valid 5 mins):</p><div style="background:#f3f4f6;padding:20px;text-align:center;font-size:32px;font-weight:bold;letter-spacing:5px;color:#1f2937;border-radius:8px;margin:20px 0">${otp}</div></div>`
    };
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await transporter.sendMail(mailOptions);
    }
    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to send OTP' });
  }
});

// --- Auth: Verify Email OTP ---
app.post('/api/auth/verify-email-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required' });
    const record = await Otp.findOne({ email, otp });
    if (!record) return res.status(400).json({ message: 'Invalid or expired OTP' });
    record.isVerified = true;
    await record.save();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// --- Auth: Register ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, registrationDetails } = req.body;
    const otpRecord = await Otp.findOne({ email, isVerified: true });
    if (!otpRecord && role !== 'admin') return res.status(400).json({ message: 'Please verify your email first' });
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already exists' });
    const user = new User({ name, email, password, role, registrationStatus: 'completed', registrationDetails });
    await user.save();
    if (otpRecord) await Otp.deleteOne({ _id: otpRecord._id });
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user._id, name: user.name, role: user.role, registrationStatus: user.registrationStatus, onboardingStatus: user.onboardingStatus } });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// --- Auth: Login ---
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, role: user.role, registrationStatus: user.registrationStatus, onboardingStatus: user.onboardingStatus } });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// --- Auth: Me ---
app.get('/api/auth/me', authenticate, async (req: any, res) => {
  try {
    const user = await User.findById(req.user?.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    let profile = null;
    if (user.role === 'seller') profile = await SellerProfile.findOne({ userId: user._id });
    else if (user.role === 'buyer') profile = await BuyerProfile.findOne({ userId: user._id });
    res.json({ user: { ...user.toObject(), status: user.onboardingStatus, onboardingStatus: user.onboardingStatus, registrationStatus: user.registrationStatus }, profile });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// --- Seller: Register / Update Profile ---
app.post('/api/seller/register', authenticate, async (req: any, res) => {
  try {
    if (req.user?.role !== 'seller') return res.status(403).json({ message: 'Only sellers allowed' });
    const { password, ...profileData } = req.body;
    if (password) {
      const user = await User.findById(req.user.id);
      if (user) { user.password = password; await user.save(); }
    }
    const profile = await SellerProfile.findOneAndUpdate({ userId: req.user.id }, { ...profileData, userId: req.user.id }, { upsert: true, new: true });
    res.json({ success: true, profile });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// --- Buyer: Register / Update Profile ---
app.post('/api/buyer/register', authenticate, async (req: any, res) => {
  try {
    if (req.user?.role !== 'buyer') return res.status(403).json({ message: 'Only buyers allowed' });
    const { password, ...profileData } = req.body;
    if (password) {
      const user = await User.findById(req.user.id);
      if (user) { user.password = password; await user.save(); }
    }
    const profile = await BuyerProfile.findOneAndUpdate({ userId: req.user.id }, { ...profileData, userId: req.user.id }, { upsert: true, new: true });
    res.json({ success: true, profile });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// --- Admin: Submit for Approval ---
app.post('/api/admin/onboarding/submit', authenticate, async (req: any, res) => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.onboardingStatus = 'pending_validation';
    await user.save();
    res.json({ success: true, onboardingStatus: user.onboardingStatus });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// --- Admin: Get All Onboarding ---
app.get('/api/admin/onboarding', authenticate, authorizeAdmin, async (_req, res) => {
  try {
    const sellers = await User.aggregate([{ $match: { role: 'seller' } }, { $lookup: { from: 'sellerprofiles', localField: '_id', foreignField: 'userId', as: 'profile' } }, { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } }]);
    const buyers = await User.aggregate([{ $match: { role: 'buyer' } }, { $lookup: { from: 'buyerprofiles', localField: '_id', foreignField: 'userId', as: 'profile' } }, { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } }]);
    res.json({ sellers: sellers.map(s => ({ ...s, status: s.onboardingStatus })), buyers: buyers.map(b => ({ ...b, status: b.onboardingStatus })) });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// --- Admin: Update User Status ---
app.post('/api/admin/status', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { userId, status } = req.body;
    const validStatuses = ['pending', 'pending_validation', 'under_compliance_review', 'resubmission_required', 'approved_for_procurement', 'rejected'];
    if (!validStatuses.includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const updateData: any = { onboardingStatus: status };
    if (status === 'approved_for_procurement') updateData.sectionStatus = { basic: 'approved', business: 'approved', compliance: 'approved', bank: 'approved', documents: 'approved' };
    else if (status === 'rejected') updateData.sectionStatus = { basic: 'rejected', business: 'rejected', compliance: 'rejected', bank: 'rejected', documents: 'rejected' };
    await User.findByIdAndUpdate(userId, updateData);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// --- Admin: Update Section Status ---
app.post('/api/admin/section-status', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { userId, section, status, rejectionReason } = req.body;
    const validSections = ['basic', 'business', 'compliance', 'bank', 'documents'];
    const validStatuses = ['pending', 'approved', 'rejected', 'resubmission_required'];
    if (!validSections.includes(section) || !validStatuses.includes(status)) return res.status(400).json({ message: 'Invalid section or status' });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const sectionStatus = { ...user.sectionStatus, [section]: status };
    const sectionRejectionReasons = { ...user.sectionRejectionReasons };
    if (status === 'rejected' || status === 'resubmission_required') sectionRejectionReasons[section] = rejectionReason || '';
    else if (status === 'approved') sectionRejectionReasons[section] = '';
    let newOnboardingStatus = 'under_compliance_review';
    const statuses = Object.values(sectionStatus);
    if (statuses.every(s => s === 'approved')) newOnboardingStatus = 'approved_for_procurement';
    else if (statuses.some(s => s === 'rejected')) newOnboardingStatus = 'rejected';
    else if (statuses.some(s => s === 'resubmission_required')) newOnboardingStatus = 'resubmission_required';
    else if (statuses.every(s => s === 'pending')) newOnboardingStatus = 'pending';
    await User.findByIdAndUpdate(userId, { sectionStatus, sectionRejectionReasons, onboardingStatus: newOnboardingStatus });
    res.json({ success: true, onboardingStatus: newOnboardingStatus });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// --- Admin: Send Feedback ---
app.post('/api/admin/feedback', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { userId, feedback } = req.body;
    await User.findByIdAndUpdate(userId, { adminFeedback: feedback });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// --- Admin: Stats ---
app.get('/api/admin/stats', authenticate, authorizeAdmin, async (_req, res) => {
  try {
    const pendingCount = await User.countDocuments({ onboardingStatus: 'pending', role: { $in: ['seller', 'buyer'] } });
    const activeSellers = await User.countDocuments({ onboardingStatus: 'approved_for_procurement', role: 'seller' });
    const activeBuyers = await User.countDocuments({ onboardingStatus: 'approved_for_procurement', role: 'buyer' });
    const totalNetwork = await User.countDocuments({ role: { $in: ['seller', 'buyer'] } });
    res.json({ pendingApproval: pendingCount, activeSellers, activeBuyers, totalNetwork });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// --- Buyer Overview ---
app.get('/api/buyer/overview', authenticate, async (req: any, res) => {
  if (req.user?.role !== 'buyer') return res.status(403).json({ message: 'Access Denied' });
  res.json({ totalRequirements: 12, activeBids: 34, totalSavings: 18.4, pendingPayments: 2130000, monthlySpend: [42, 65, 51, 78, 63, 88], pipeline: { draft: 12, published: 6, awarded: 4 } });
});

export default app;
