import dotenv from 'dotenv';
console.log('--- BACKEND index.ts (PRISMA) EXECUTING ---');
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({
  path: [
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '.env')
  ]
});

import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Import Prisma Client
import prisma from './src/lib/prisma.js';
import { Role, RegistrationStatus } from '@prisma/client';
import { authenticate, authorize, authorizeAdmin } from './src/middleware/auth.js';
import type { AuthRequest } from './src/middleware/auth.js';
import nodemailer from 'nodemailer';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-procure-key';

// Cloudinary Configuration
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
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 5001;
  const configuredOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    ...(process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(',').map(origin => origin.trim()).filter(Boolean)
      : [
          "https://msme-portal-pug-arch-frontend.vercel.app",
          "https://msme-portal-pug-arch-frontend-onet.vercel.app"
        ])
  ];

  app.use(cors({
    origin: (origin, callback) => {
      let hostname = '';
      try {
        hostname = origin ? new URL(origin).hostname : '';
      } catch {
        return callback(new Error(`CORS blocked for invalid origin: ${origin}`));
      }

      if (!origin || configuredOrigins.includes(origin) || /^msme-portal-pug-arch-frontend(-[a-z0-9-]+)?\.vercel\.app$/.test(hostname)) {
        return callback(null, true);
      }
      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true
  }));
  app.use(express.json());

  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  app.get("/", (req, res) => {
    res.json({
      message: "PugArch MSME Marketplace API (Prisma/PostgreSQL) is running",
      health: "/api/test"
    });
  });

  app.get("/api/test", (req, res) => res.json({ message: "API working" }));

  // --- Tender APIs ---
  app.get('/api/tenders', authenticate, authorize('buyer', 'admin'), async (req: AuthRequest, res) => {
    try {
      const tenders = await prisma.tender.findMany({
        where: { buyerId: Number(req.user?.id) },
        orderBy: { createdAt: 'desc' }
      });
      res.json(tenders);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post('/api/tenders', authenticate, authorize('buyer'), async (req: AuthRequest, res) => {
    try {
      if (req.user?.role !== 'buyer') {
        return res.status(403).json({ message: 'Only buyers can create tenders' });
      }

      const tenderId = `T-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      const tender = await prisma.tender.create({
        data: {
          ...req.body,
          buyerId: Number(req.user.id),
          tenderId,
          closesAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
        }
      });

      res.status(201).json(tender);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // --- Seed Data Logic ---
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log('Seeding sample data for Prisma...');
      const hashedPassword = await bcrypt.hash('password123', 10);

      // Admin
      await prisma.user.create({
        data: {
          name: 'Admin User',
          email: 'admin@pugarch.com',
          password: hashedPassword,
          role: 'admin',
          registrationStatus: 'completed',
          onboardingStatus: 'approved_for_procurement'
        }
      });

      // Sample Users
      const sampleUsers = [
        { name: 'Rajesh Kumar', email: 'rajesh@texcorp.com', role: 'seller' as const },
        { name: 'Suresh Raina', email: 'suresh@buildcon.com', role: 'buyer' as const },
      ];

      for (const u of sampleUsers) {
        const user = await prisma.user.create({
          data: {
            name: u.name,
            email: u.email,
            password: hashedPassword,
            role: u.role,
            registrationStatus: 'completed',
            onboardingStatus: 'approved_for_procurement'
          }
        });

        if (u.role === 'seller') {
          await prisma.sellerProfile.create({
            data: {
              userId: user.id,
              organizationType: 'Pvt Ltd',
              pan: 'ABCDE1234F',
              nameAsInPan: u.name,
              panVerified: true,
              businessName: 'TEXCORP',
              productCategories: ['Textiles'],
            }
          });
        } else {
          await prisma.buyerProfile.create({
            data: {
              userId: user.id,
              organizationName: 'BUILDCON',
              businessType: 'Partnership',
              industry: 'Construction',
              pan: 'BCDEF2345G',
              representativeName: u.name,
              mobile: '9123456789',
              state: 'Karnataka',
              city: 'Bangalore',
              pincode: '560001',
              registeredAddress: '45, Tech Center, MG Road',
              gst: '29BCDEF2345G1Z2',
            }
          });

          // Add a tender for the buyer
          await prisma.tender.create({
            data: {
              buyerId: user.id,
              tenderId: 'T-2026-0001',
              title: 'Office Furniture Supply',
              category: 'Furniture',
              budget: 500000,
              description: 'Need ergonomic chairs and desks.',
              status: 'active',
              closesAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
            }
          });
        }
      }
      console.log('Seeding completed.');
    }
  } catch (err) {
    console.error('Seeding error:', err);
  }

  // --- File Upload ---
  app.post('/api/upload', authenticate, upload.single('file'), async (req: any, res: any) => {
    try {
      if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      let dataURI = 'data:' + req.file.mimetype + ';base64,' + b64;
      const result = await cloudinary.uploader.upload(dataURI, {
        folder: 'msme_marketplace_docs',
        resource_type: 'auto'
      });
      res.json({ url: result.secure_url, publicId: result.public_id });
    } catch (err: any) {
      res.status(500).json({ message: 'Upload failed' });
    }
  });

  // --- Auth APIs ---
  app.post('/api/auth/send-email-otp', async (req, res) => {
    try {
      const email = String(req.body.email || '').trim().toLowerCase();
      if (!email) return res.status(400).json({ message: 'Email is required' });
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      await prisma.otp.deleteMany({ where: { email } });
      await prisma.otp.create({
        data: {
          email,
          otp,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000)
        }
      });

      const mailOptions = {
        from: `"PugArch Admin" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Verification Code',
        html: `<h2>Code: ${otp}</h2>`
      };

      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        await transporter.sendMail(mailOptions);
      } else {
        console.log('OTP:', otp);
      }
      res.json({ success: true });
    } catch (err: any) {
      console.error('[Email OTP] Failed:', err);
      res.status(500).json({
        message: process.env.NODE_ENV === 'production'
          ? 'Unable to send OTP right now. Please try again.'
          : err.message
      });
    }
  });

  app.post('/api/auth/verify-email-otp', async (req, res) => {
    try {
      const email = String(req.body.email || '').trim().toLowerCase();
      const otp = String(req.body.otp || '').trim();
      const otpRecord = await prisma.otp.findFirst({ where: { email, otp } });
      if (!otpRecord) return res.status(400).json({ message: 'Invalid OTP' });
      if (otpRecord.expiresAt < new Date()) {
        await prisma.otp.delete({ where: { id: otpRecord.id } });
        return res.status(400).json({ message: 'OTP expired. Please request a new code.' });
      }

      await prisma.otp.update({
        where: { id: otpRecord.id },
        data: { isVerified: true }
      });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const { password, role, registrationDetails, mobile, dob } = req.body;
      const email = String(req.body.email || '').trim().toLowerCase();
      const name = String(
        req.body.name ||
        registrationDetails?.accountName ||
        registrationDetails?.userId ||
        registrationDetails?.businessName ||
        email
      ).trim();
      const otpRecord = await prisma.otp.findFirst({ where: { email, isVerified: true } });
      if (!otpRecord) return res.status(400).json({ message: 'Verify email first' });
      if (otpRecord.expiresAt < new Date()) {
        await prisma.otp.delete({ where: { id: otpRecord.id } });
        return res.status(400).json({ message: 'OTP expired. Please request a new code.' });
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) return res.status(400).json({ message: 'Exists' });

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          name, email, password: hashedPassword,
          role: role as Role,
          mobile,
          dob: (dob && !isNaN(Date.parse(dob))) ? new Date(dob) : null,
          registrationStatus: RegistrationStatus.completed,
          registrationDetails: registrationDetails || {}
        }
      });

      if (otpRecord) await prisma.otp.delete({ where: { id: otpRecord.id } });

      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
      const { password: _, ...userSafe } = user;
      res.status(201).json({ token, user: { ...userSafe, _id: user.id } });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return res.status(400).json({ message: 'Not found' });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Invalid' });

      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
      const { password: _, ...userSafe } = user;
      res.json({ token, user: { ...userSafe, _id: user.id } });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get('/api/auth/me', authenticate, async (req: AuthRequest, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: Number(req.user?.id) },
        include: {
          sellerProfile: {
            include: {
              offices: true,
              bankAccounts: true
            }
          },
          buyerProfile: true
        }
      });
      if (!user) return res.status(404).json({ message: 'Not found' });

      const { password, ...userData } = user;
      res.json({
        user: { ...userData, _id: user.id },
        profile: user.role === 'seller' ? user.sellerProfile : user.buyerProfile
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // --- Profile APIs ---
  app.post('/api/seller/register', authenticate, authorize('seller'), async (req: AuthRequest, res) => {
    try {
      const userId = Number(req.user?.id);
      const { password, ...rawData } = req.body;

      if (password || rawData.mobile || rawData.dob) {
        const updateData: any = {};
        if (password) updateData.password = await bcrypt.hash(password, 10);
        if (rawData.mobile) updateData.mobile = rawData.mobile;
        if (rawData.dob && !isNaN(Date.parse(rawData.dob))) updateData.dob = new Date(rawData.dob);
        await prisma.user.update({ where: { id: userId }, data: updateData });
      }

      // Filter only allowed fields for SellerProfile (GeM Style)
      const profileData: any = {
        organizationType: rawData.organizationType,
        pan: rawData.pan,
        nameAsInPan: rawData.nameAsInPan,
        dateAsInPan: rawData.dateAsInPan ? new Date(rawData.dateAsInPan) : null,
        panVerified: rawData.panVerified ?? false,
        businessName: rawData.businessName,
        dateOfIncorporation: rawData.dateOfIncorporation ? new Date(rawData.dateOfIncorporation) : null,
        detailsUpdated: rawData.detailsUpdated ?? false,
        isStartup: rawData.isStartup ?? false,
        isUdyamCertified: rawData.isUdyamCertified ?? false,
        participateInBid: rawData.participateInBid ?? false,
        optForSahay: rawData.optForSahay ?? false,
        turnoverMax3Yrs: rawData.turnoverMax3Yrs,
        eInvoicingExcluded: rawData.eInvoicingExcluded ?? false,
        ownershipDeclarationAccepted: rawData.ownershipDeclarationAccepted ?? false,
        ownershipVerified: rawData.ownershipVerified ?? false,
        msmeCategory: rawData.msmeCategory,
        productCategories: rawData.productCategories,
        otherCategoryDetails: rawData.otherCategoryDetails,
        productList: rawData.productList,
        detailedProductName: rawData.detailedProductName,
        hsnCode: rawData.hsnCode,
        brand: rawData.brand,
        specifications: rawData.specifications,
        documents: rawData.documents,
        mobile: rawData.mobile,
        dob: (rawData.dob && !isNaN(Date.parse(rawData.dob))) ? new Date(rawData.dob) : null,
        roleInOrg: rawData.roleInOrg,
        termsAccepted: rawData.agreeTerms ?? false
      };

      const profile = await prisma.sellerProfile.upsert({
        where: { userId },
        update: profileData,
        create: { ...profileData, userId }
      });
      res.json({ success: true, profile });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Manage Seller Offices
  app.post('/api/seller/profile/offices', authenticate, authorize('seller'), async (req: AuthRequest, res) => {
    try {
      const userId = Number(req.user?.id);
      const profile = await prisma.sellerProfile.findUnique({ where: { userId } });
      if (!profile) return res.status(404).json({ message: 'Profile not found' });

      const office = await prisma.sellerOffice.create({
        data: { ...req.body, sellerProfileId: profile.id }
      });
      res.json({ success: true, office });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete('/api/seller/profile/offices/:id', authenticate, authorize('seller'), async (req: AuthRequest, res) => {
    try {
      const userId = Number(req.user?.id);
      const officeId = Number(req.params.id);
      const office = await prisma.sellerOffice.findUnique({
        where: { id: officeId },
        include: { sellerProfile: true }
      });
      if (!office || office.sellerProfile.userId !== userId) {
        return res.status(404).json({ message: 'Office not found' });
      }
      await prisma.sellerOffice.delete({ where: { id: officeId } });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Manage Seller Bank Accounts
  app.post('/api/seller/profile/bank', authenticate, authorize('seller'), async (req: AuthRequest, res) => {
    try {
      const userId = Number(req.user?.id);
      const profile = await prisma.sellerProfile.findUnique({ where: { userId } });
      if (!profile) return res.status(404).json({ message: 'Profile not found' });

      const bank = await prisma.sellerBankAccount.create({
        data: { ...req.body, sellerProfileId: profile.id }
      });
      res.json({ success: true, bank });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete('/api/seller/profile/bank/:id', authenticate, authorize('seller'), async (req: AuthRequest, res) => {
    try {
      const userId = Number(req.user?.id);
      const bankId = Number(req.params.id);
      const bank = await prisma.sellerBankAccount.findUnique({
        where: { id: bankId },
        include: { sellerProfile: true }
      });
      if (!bank || bank.sellerProfile.userId !== userId) {
        return res.status(404).json({ message: 'Bank account not found' });
      }
      await prisma.sellerBankAccount.delete({ where: { id: bankId } });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post('/api/buyer/register', authenticate, authorize('buyer'), async (req: AuthRequest, res) => {
    try {
      if (req.user?.role !== 'buyer') return res.status(403).json({ message: 'Forbidden' });
      const userId = Number(req.user.id);
      const { password, ...rawData } = req.body;
      const existingUser = await prisma.user.findUnique({ where: { id: userId } });
      if (!existingUser) return res.status(404).json({ message: 'User not found' });

      const mobile = rawData.mobile || existingUser.mobile;
      if (!mobile) {
        return res.status(400).json({ message: 'Mobile number is required to complete buyer onboarding' });
      }

      if (password || rawData.mobile) {
        const updateData: any = {};
        if (password) updateData.password = await bcrypt.hash(password, 10);
        if (rawData.mobile) updateData.mobile = mobile;
        await prisma.user.update({ where: { id: userId }, data: updateData });
      }

      // Filter only allowed fields for BuyerProfile
      const profileData: any = {
        organizationName: rawData.organizationName || existingUser.name,
        businessType: rawData.businessType || 'Private Limited Company',
        industry: rawData.industry,
        cin: rawData.cin,
        pan: rawData.pan,
        gst: rawData.gst,
        website: rawData.website,
        state: rawData.state,
        district: rawData.district,
        officeZoneName: rawData.officeZoneName,
        representativeName: rawData.representativeName,
        designation: rawData.designation,
        department: rawData.department,
        email: rawData.email,
        mobile,
        alternateMobile: rawData.alternateMobile,
        aadhaarNumber: rawData.aadhaarNumber,
        aadhaarVerified: rawData.aadhaarVerified ?? false,
        country: rawData.country,
        city: rawData.city,
        pincode: rawData.pincode,
        registeredAddress: rawData.registeredAddress,
        corporateAddress: rawData.corporateAddress,
        procurementCategories: Array.isArray(rawData.procurementCategories) ? rawData.procurementCategories : [],
        otherCategoryDetails: rawData.otherCategoryDetails,
        annualBudget: rawData.annualBudget,
        preferredMethods: Array.isArray(rawData.preferredMethods) ? rawData.preferredMethods : [],
        otherMethodDetails: rawData.otherMethodDetails,
        declarationAccepted: rawData.declaration ?? false,
        termsAccepted: rawData.agreeTerms ?? false,
        documents: rawData.documents
      };

      const sectionStatus = {
        org: 'pending',
        rep: 'pending',
        address: 'pending',
        procurement: 'pending',
        docs: 'pending'
      };

      const [profile] = await prisma.$transaction([
        prisma.buyerProfile.upsert({
          where: { userId },
          update: profileData,
          create: { ...profileData, userId }
        }),
        prisma.user.update({
          where: { id: userId },
          data: {
            registrationStatus: 'completed',
            onboardingStatus: 'under_compliance_review',
            sectionStatus
          }
        })
      ]);

      res.json({ success: true, profile });
    } catch (err: any) {
      console.error('[Buyer Register] Failed:', err);
      res.status(500).json({
        message: process.env.NODE_ENV === 'production'
          ? 'Unable to save buyer onboarding. Please try again.'
          : err.message
      });
    }
  });

  // --- Admin APIs ---
  app.get('/api/admin/onboarding', authenticate, authorizeAdmin, async (req, res) => {
    try {
      const sellers = await prisma.user.findMany({
        where: { role: 'seller' },
        include: { sellerProfile: true },
        orderBy: { createdAt: 'desc' }
      });
      const buyers = await prisma.user.findMany({
        where: { role: 'buyer' },
        include: { buyerProfile: true },
        orderBy: { createdAt: 'desc' }
      });

      // Exclude passwords and format for frontend
      const formatUser = (u: any) => {
        const { password, ...rest } = u;
        return {
          ...rest,
          _id: u.id,
          profile: u.sellerProfile || u.buyerProfile,
          status: u.onboardingStatus
        };
      };

      res.json({
        sellers: sellers.map(formatUser),
        buyers: buyers.map(formatUser)
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post('/api/admin/status', authenticate, authorizeAdmin, async (req, res) => {
    try {
      const { userId, status } = req.body;
      const updateData: any = { onboardingStatus: status };

      if (status === 'approved_for_procurement') {
        const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
        const buyerSections = { org: 'approved', rep: 'approved', address: 'approved', procurement: 'approved', docs: 'approved' };
        const sellerSections = { pan: 'approved', details: 'approved', additional: 'approved', offices: 'approved', bank: 'approved', einvoicing: 'approved', ownership: 'approved' };
        
        updateData.sectionStatus = user?.role === 'buyer' ? buyerSections : sellerSections;
      }

      await prisma.user.update({ where: { id: Number(userId) }, data: updateData });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get('/api/vendors', authenticate, authorize('buyer', 'admin'), async (req, res) => {
    try {
      const vendors = await prisma.user.findMany({
        where: { role: 'seller', onboardingStatus: 'approved_for_procurement' },
        include: { sellerProfile: true }
      });
      res.json(vendors.map(v => ({ ...v, _id: v.id })));
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get('/api/vendors/:id', authenticate, authorize('buyer', 'admin'), async (req, res) => {
    try {
      const vendor = await prisma.user.findUnique({
        where: { id: Number(req.params.id), role: 'seller' },
        include: {
          sellerProfile: {
            include: {
              offices: true,
              bankAccounts: true
            }
          }
        }
      });
      if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
      const { password, ...vendorSafe } = vendor;
      res.json({ ...vendorSafe, _id: vendor.id });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // --- Quote Request APIs ---
  app.post('/api/quotes', authenticate, authorize('buyer'), async (req: AuthRequest, res) => {
    try {
      const { sellerId, subject, message } = req.body;
      const buyerId = Number(req.user?.id);

      if (req.user?.role !== 'buyer') {
        return res.status(403).json({ message: 'Only buyers can request quotes' });
      }

      const quote = await prisma.quoteRequest.create({
        data: {
          buyerId,
          sellerId: Number(sellerId),
          subject,
          message,
          status: 'pending'
        }
      });

      res.status(201).json(quote);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get('/api/quotes', authenticate, authorize('buyer', 'seller', 'admin'), async (req: AuthRequest, res) => {
    try {
      const userId = Number(req.user?.id);
      const role = req.user?.role;

      let quotes;
      if (role === 'buyer') {
        quotes = await prisma.quoteRequest.findMany({
          where: { buyerId: userId },
          include: { seller: { include: { sellerProfile: true } } },
          orderBy: { createdAt: 'desc' }
        });
      } else if (role === 'seller') {
        quotes = await prisma.quoteRequest.findMany({
          where: { sellerId: userId },
          include: { buyer: { include: { buyerProfile: true } } },
          orderBy: { createdAt: 'desc' }
        });
      } else {
        return res.status(403).json({ message: 'Forbidden' });
      }

      res.json(quotes);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post('/api/admin/section-status', authenticate, authorizeAdmin, async (req, res) => {
    try {
      const { userId, section, status, rejectionReason } = req.body;

      console.log(`[Admin] Attempting update - User: ${userId}, Section: ${section}, Status: ${status}`);

      if (!userId || !section || !status) {
        console.error('!!! CRITICAL DATA MISSING FROM FRONTEND !!!', { userId, section, status });
        return res.status(400).json({ message: 'Missing required fields: userId, section, or status' });
      }

      const numericId = Number(userId);
      if (isNaN(numericId)) {
        console.error(`!!! INVALID USER ID RECEIVED !!!: ${userId}`);
        return res.status(400).json({ message: 'User ID must be a valid number' });
      }

      const user = await prisma.user.findUnique({ where: { id: numericId } });
      if (!user) {
        console.error(`!!! USER NOT FOUND IN DATABASE !!!: ${numericId}`);
        return res.status(404).json({ message: 'User not found' });
      }

      // Initialize status and reasons if they are null
      const currentStatus = (user.sectionStatus as Record<string, any>) || {};
      const currentReasons = (user.sectionRejectionReasons as Record<string, any>) || {};

      const sectionStatus = { ...currentStatus, [section]: status };
      const sectionRejectionReasons = { ...currentReasons };

      if (status === 'rejected' || status === 'resubmission_required') {
        sectionRejectionReasons[section] = rejectionReason || '';
      } else if (status === 'approved') {
        sectionRejectionReasons[section] = '';
      }

      // Calculate overall onboarding status based on all sections
      const sections = user.role === 'buyer' 
        ? ['org', 'rep', 'address', 'procurement', 'docs'] 
        : ['pan', 'details', 'additional', 'offices', 'bank', 'einvoicing', 'ownership'];
        
      const statuses = sections.map(s => sectionStatus[s] || 'pending');

      let onboardingStatus = 'under_compliance_review';
      if (statuses.every(s => s === 'approved')) onboardingStatus = 'approved_for_procurement';
      else if (statuses.some(s => s === 'rejected')) onboardingStatus = 'rejected';
      else if (statuses.some(s => s === 'resubmission_required')) onboardingStatus = 'resubmission_required';

      console.log(`[Admin] New calculated status: ${onboardingStatus}`);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          sectionStatus,
          sectionRejectionReasons,
          onboardingStatus: onboardingStatus as any
        }
      });

      res.json({ success: true, onboardingStatus: onboardingStatus });
    } catch (err: any) {
      console.error('--- SECTION STATUS ERROR ---');
      console.error('Message:', err.message);
      console.error('Stack:', err.stack);
      res.status(500).json({ message: err.message });
    }
  });

  // Admin: Send Feedback/Query to Stakeholder
  app.post('/api/admin/feedback', authenticate, authorizeAdmin, async (req, res) => {
    try {
      const { userId, feedback } = req.body;
      await prisma.user.update({
        where: { id: Number(userId) },
        data: { adminFeedback: feedback }
      });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get('/api/admin/stats', authenticate, authorizeAdmin, async (req, res) => {
    try {
      const [pending, sellers, buyers, total] = await Promise.all([
        prisma.user.count({ where: { onboardingStatus: 'pending', role: { in: ['seller', 'buyer'] } } }),
        prisma.user.count({ where: { onboardingStatus: 'approved_for_procurement', role: 'seller' } }),
        prisma.user.count({ where: { onboardingStatus: 'approved_for_procurement', role: 'buyer' } }),
        prisma.user.count({ where: { role: { in: ['seller', 'buyer'] } } })
      ]);
      res.json({ pendingApproval: pending, activeSellers: sellers, activeBuyers: buyers, totalNetwork: total });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.listen(PORT, () => console.log(`Server running on port ${PORT} (Prisma/PostgreSQL)`));
}

startServer().catch(err => {
  console.error("Critical error:", err);
  process.exit(1);
});
