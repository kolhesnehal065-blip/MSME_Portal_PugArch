import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({
  path: [
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '.env')
  ]
});

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Import Models
import { User } from './src/models/User.js';
import { SellerProfile } from './src/models/SellerProfile.js';
import { BuyerProfile } from './src/models/BuyerProfile.js';
import { Otp } from './src/models/Otp.js';
import { authenticate, authorizeAdmin } from './src/middleware/auth.js';
import type { AuthRequest } from './src/middleware/auth.js';
import nodemailer from 'nodemailer';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-procure-key';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pugarch';

// Cloudinary Configuration - loads CLOUDINARY_URL automatically
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// Multer Storage Configuration
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Nodemailer Transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // false for port 587 (STARTTLS), true for port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false // allows self-signed certs in dev
  }
});

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 5001;

  app.use(cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:5174",
      process.env.FRONTEND_URL || "https://msme-portal-pug-arch-frontend.vercel.app"
    ],
    credentials: true
  }));
  app.use(express.json());

  app.get("/", (req, res) => {
    res.json({
      message: "PugArch MSME Marketplace API is running",
      health: "/api/test"
    });
  });

  // Test Route for verifying connection
  app.get("/api/test", (req, res) => res.json({ message: "API working" }));

  // Connect to MongoDB
  mongoose.connect(MONGODB_URI, {
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 10000,
  })
    .then(async () => {
      console.log('Connected to MongoDB');
      // Seed sample data if empty
      try {
        const userCount = await User.countDocuments();
        if (userCount === 1) { // Only the admin who just registered exists
          console.log('Seeding sample data...');
          const sampleUsers = [
            { name: 'Rajesh Kumar', email: 'rajesh@texcorp.com', password: 'password123', role: 'seller', status: 'approved' },
            { name: 'Anita Desai', email: 'anita@fashionhub.in', password: 'password123', role: 'seller', status: 'pending' },
            { name: 'Vikram Singh', email: 'vikram@steelworks.com', password: 'password123', role: 'seller', status: 'pending' },
            { name: 'Suresh Raina', email: 'suresh@buildcon.com', password: 'password123', role: 'buyer', status: 'approved' },
            { name: 'Priya Sharma', email: 'priya@retailnexus.com', password: 'password123', role: 'buyer', status: 'pending' },
          ];
          
          for (const u of sampleUsers) {
            const newUser = new User(u);
            await newUser.save();
            
            if (u.role === 'seller') {
              await SellerProfile.create({
                userId: newUser._id,
                applicantName: u.name,
                businessName: u.email.split('@')[1].split('.')[0].toUpperCase() + ' Corp',
                businessType: 'Pvt Ltd',
                pan: 'ABCDE1234F',
                mobile: '9876543210',
                state: 'Maharashtra',
                city: 'Mumbai',
                pincode: '400001',
                fullAddress: '123, Business Park, Andheri East',
                gst: '27ABCDE1234F1Z5',
                productCategories: ['Textiles', 'Raw Materials'],
                bankAccount: '123456789012',
                ifsc: 'HDFC0001234'
              });
            } else {
              await BuyerProfile.create({
                userId: newUser._id,
                organizationName: u.email.split('@')[1].split('.')[0].toUpperCase() + ' Solutions',
                businessType: 'Partnership',
                industry: 'Construction',
                pan: 'BCDEF2345G',
                representativeName: u.name,
                mobile: '9123456788',
                state: 'Karnataka',
                city: 'Bangalore',
                pincode: '560001',
                registeredAddress: '45, Tech Center, MG Road',
                gst: '29BCDEF2345G1Z2',
                annualBudget: '₹50,00,000 - ₹1,00,00,000',
                procurementCategories: ['Plumbing', 'Electrical']
              });
            }
          }
          console.log('Seeding completed.');
        }
      } catch (seedErr) {
        console.error('Seeding error:', seedErr);
      }
    })
    .catch(err => {
      console.error('MongoDB connection error. Make sure MONGODB_URI is valid in .env:', err);
    });

  // --- API Routes ---
  
  // --- File Upload ---
  app.post('/api/upload', authenticate, upload.single('file'), async (req: any, res: any) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Convert buffer to base64
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      let dataURI = 'data:' + req.file.mimetype + ';base64,' + b64;

      const result = await cloudinary.uploader.upload(dataURI, {
        folder: 'msme_marketplace_docs',
        resource_type: 'auto'
      });

      res.json({
        url: result.secure_url,
        publicId: result.public_id
      });
    } catch (err: any) {
      console.error('Cloudinary upload error:', err);
      res.status(500).json({ message: 'Failed to upload to Cloudinary' });
    }
  });

  // Auth: Send Email OTP
  app.post('/api/auth/send-email-otp', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: 'Email is required' });

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Save to DB (overwrite previous OTPs for this email)
      await Otp.deleteMany({ email });
      const newOtp = new Otp({ email, otp });
      await newOtp.save();

      // Send Email
      const mailOptions = {
        from: `"PugArch Admin" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Your Email Verification Code - PugArch MSME Marketplace',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #2563eb; text-align: center;">PugArch Verification</h2>
            <p>Hello,</p>
            <p>Thank you for choosing PugArch MSME Marketplace. Use the following OTP to verify your email address. This code is valid for 5 minutes.</p>
            <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1f2937; border-radius: 8px; margin: 20px 0;">
              ${otp}
            </div>
            <p style="font-size: 12px; color: #6b7280; text-align: center;">If you did not request this code, please ignore this email.</p>
          </div>
        `,
      };

      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('SMTP credentials missing. Logging OTP to console:', otp);
      } else {
        await transporter.sendMail(mailOptions);
        console.log(`OTP ${otp} sent to ${email}`);
      }
      
      res.json({ success: true, message: 'OTP sent successfully' });
    } catch (err: any) {
      console.error('Error sending OTP:', err);
      res.status(500).json({ message: `Failed to send OTP: ${err.message || 'Check SMTP settings'}` });
    }
  });

  // Auth: Verify Email OTP
  app.post('/api/auth/verify-email-otp', async (req, res) => {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

      const otpRecord = await Otp.findOne({ email, otp });
      if (!otpRecord) {
        return res.status(400).json({ message: 'Invalid or expired OTP' });
      }

      otpRecord.isVerified = true;
      await otpRecord.save();

      res.json({ success: true, message: 'Email verified successfully' });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Auth: Register (Basic)
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { name, email, password, role, registrationDetails } = req.body;

      // Check if email is verified
      const otpRecord = await Otp.findOne({ email, isVerified: true });
      if (!otpRecord && role !== 'admin') {
        return res.status(400).json({ message: 'Please verify your email first' });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ message: 'Email already exists' });

      const user = new User({ 
        name, 
        email, 
        password, 
        role, 
        registrationStatus: role === 'admin' ? 'completed' : 'completed',
        registrationDetails 
      });
      await user.save();

      // Clean up verified OTP
      if (otpRecord) await Otp.deleteOne({ _id: otpRecord._id });

      const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
      res.status(201).json({ 
        token, 
        user: { 
          id: user._id, 
          name: user.name, 
          role: user.role, 
          registrationStatus: user.registrationStatus,
          onboardingStatus: user.onboardingStatus 
        } 
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Auth: Login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ message: 'User not found' });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

      const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ 
        token, 
        user: { 
          id: user._id, 
          name: user.name, 
          role: user.role, 
          registrationStatus: user.registrationStatus,
          onboardingStatus: user.onboardingStatus 
        } 
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Get current session profile
  app.get('/api/auth/me', authenticate, async (req: AuthRequest, res) => {
    try {
      const user = await User.findById(req.user?.id).select('-password');
      if (!user) return res.status(404).json({ message: 'User not found' });
      
      let profile = null;
      if (user.role === 'seller') {
        profile = await SellerProfile.findOne({ userId: user._id });
      } else if (user.role === 'buyer') {
        profile = await BuyerProfile.findOne({ userId: user._id });
      }

      res.json({ 
        user: { 
          ...user.toObject(), 
          status: user.onboardingStatus, // Backward compatibility if needed
          onboardingStatus: user.onboardingStatus,
          registrationStatus: user.registrationStatus 
        }, 
        profile 
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Seller: Register / Update Profile
  app.post('/api/seller/register', authenticate, async (req: AuthRequest, res) => {
    try {
      if (req.user?.role !== 'seller') return res.status(403).json({ message: 'Only sellers can register profiles here' });
      
      const userId = req.user.id;
      const { password, ...profileData } = req.body;
      
      if (password) {
        const user = await User.findById(userId);
        if (user) {
          user.password = password;
          await user.save();
        }
      }

      const submissionData = { ...profileData, userId };
      
      let profile = await SellerProfile.findOneAndUpdate(
        { userId },
        submissionData,
        { upsert: true, returnDocument: 'after' }
      );
      
      res.json({ success: true, profile });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Buyer: Register / Update Profile
  app.post('/api/buyer/register', authenticate, async (req: AuthRequest, res) => {
    try {
      if (req.user?.role !== 'buyer') return res.status(403).json({ message: 'Only buyers can register profiles here' });
      
      const userId = req.user.id;
      const { password, ...profileData } = req.body;

      if (password) {
        const user = await User.findById(userId);
        if (user) {
          user.password = password;
          await user.save();
        }
      }
      
      const submissionData = { ...profileData, userId };
      
      let profile = await BuyerProfile.findOneAndUpdate(
        { userId },
        submissionData,
        { upsert: true, returnDocument: 'after' }
      );

      res.json({ success: true, profile });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Seller: Final Submit for Admin Approval
  app.post('/api/admin/onboarding/submit', authenticate, async (req: AuthRequest, res) => {
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

  // Admin: Get all onboarding registrations
  app.get('/api/admin/onboarding', authenticate, authorizeAdmin, async (req, res) => {
    try {
      const sellers = await User.aggregate([
        { $match: { role: 'seller' } },
        {
          $lookup: {
            from: 'sellerprofiles',
            localField: '_id',
            foreignField: 'userId',
            as: 'profile'
          }
        },
        { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } }
      ]);

      const buyers = await User.aggregate([
        { $match: { role: 'buyer' } },
        {
          $lookup: {
            from: 'buyerprofiles',
            localField: '_id',
            foreignField: 'userId',
            as: 'profile'
          }
        },
        { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } }
      ]);

      res.json({ 
        sellers: sellers.map(s => ({ ...s, status: s.onboardingStatus })), 
        buyers: buyers.map(b => ({ ...b, status: b.onboardingStatus })) 
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Admin: Update User Status (Approve/Reject)
  app.post('/api/admin/status', authenticate, authorizeAdmin, async (req, res) => {
    try {
      const { userId, status } = req.body;
      const validStatuses = ['pending', 'pending_validation', 'under_compliance_review', 'resubmission_required', 'approved_for_procurement', 'rejected'];
      
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      const updateData: any = { onboardingStatus: status };
      if (status === 'approved_for_procurement') {
        updateData.sectionStatus = {
          basic: 'approved',
          business: 'approved',
          compliance: 'approved',
          bank: 'approved',
          documents: 'approved'
        };
      } else if (status === 'rejected') {
        updateData.sectionStatus = {
          basic: 'rejected',
          business: 'rejected',
          compliance: 'rejected',
          bank: 'rejected',
          documents: 'rejected'
        };
      }

      await User.findByIdAndUpdate(userId, updateData);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Admin: Update Section Status
  app.post('/api/admin/section-status', authenticate, authorizeAdmin, async (req, res) => {
    try {
      const { userId, section, status, rejectionReason } = req.body;
      const validSections = ['basic', 'business', 'compliance', 'bank', 'documents'];
      const validStatuses = ['pending', 'approved', 'rejected', 'resubmission_required'];

      if (!validSections.includes(section) || !validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid section or status' });
      }

      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: 'User not found' });

      const sectionStatus = { ...user.sectionStatus, [section]: status };
      
      // Update rejection reason if status is rejected
      const sectionRejectionReasons = { ...user.sectionRejectionReasons };
      if (status === 'rejected' || status === 'resubmission_required') {
        sectionRejectionReasons[section] = rejectionReason || '';
      } else if (status === 'approved') {
        sectionRejectionReasons[section] = '';
      }

      // Calculate overall status
      let newOnboardingStatus = 'under_compliance_review';
      const statuses = Object.values(sectionStatus);
      
      if (statuses.every(s => s === 'approved')) {
        newOnboardingStatus = 'approved_for_procurement';
      } else if (statuses.some(s => s === 'rejected')) {
        newOnboardingStatus = 'rejected';
      } else if (statuses.some(s => s === 'resubmission_required')) {
        newOnboardingStatus = 'resubmission_required';
      } else if (statuses.every(s => s === 'pending')) {
        newOnboardingStatus = 'pending';
      }

      await User.findByIdAndUpdate(userId, { 
        sectionStatus, 
        sectionRejectionReasons,
        onboardingStatus: newOnboardingStatus 
      });
      
      res.json({ success: true, onboardingStatus: newOnboardingStatus });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Admin: Send Feedback/Query to Stakeholder
  app.post('/api/admin/feedback', authenticate, authorizeAdmin, async (req, res) => {
    try {
      const { userId, feedback } = req.body;
      await User.findByIdAndUpdate(userId, { adminFeedback: feedback });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Admin: Get Dashboard Stats
  app.get('/api/admin/stats', authenticate, authorizeAdmin, async (req, res) => {
    try {
      const pendingCount = await User.countDocuments({ onboardingStatus: 'pending', role: { $in: ['seller', 'buyer'] } });
      const activeSellers = await User.countDocuments({ onboardingStatus: 'approved_for_procurement', role: 'seller' });
      const activeBuyers = await User.countDocuments({ onboardingStatus: 'approved_for_procurement', role: 'buyer' });
      const totalNetwork = await User.countDocuments({ role: { $in: ['seller', 'buyer'] } });

      res.json({
        pendingApproval: pendingCount,
        activeSellers,
        activeBuyers,
        totalNetwork
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // --- Buyer Dashboard APIs ---
  app.get('/api/buyer/overview', authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'buyer') return res.status(403).json({ message: 'Access Denied' });
    
    // Returning standardized structured mock data until real schema bindings are requested
    res.json({
      totalRequirements: 12,
      activeBids: 34,
      totalSavings: 18.4,
      pendingPayments: 2130000,
      monthlySpend: [42, 65, 51, 78, 63, 88],
      pipeline: {
        draft: 12,
        published: 6,
        awarded: 4
      }
    });
  });

  return new Promise<void>((resolve, reject) => {
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      resolve();
    });

    server.on('error', (err) => {
      console.error('Server error:', err);
      reject(err);
    });
  });
}

startServer().catch(err => {
  console.error("Critical error during server startup:", err);
  process.exit(1);
});
