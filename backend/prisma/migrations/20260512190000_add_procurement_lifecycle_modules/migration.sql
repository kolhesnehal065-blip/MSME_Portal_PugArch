-- Procurement lifecycle modules: catalogue, taxonomy, requirements, contracts, orders, logistics, inspection, invoices, evaluation, auctions

CREATE TABLE "RbacRole" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentRoleId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RbacRole_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RbacPermission" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "group" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RbacPermission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RbacRolePermission" (
    "roleId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,
    CONSTRAINT "RbacRolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

CREATE UNIQUE INDEX "RbacRole_name_key" ON "RbacRole"("name");
CREATE UNIQUE INDEX "RbacPermission_code_key" ON "RbacPermission"("code");

ALTER TABLE "User" ADD COLUMN "rbacRoleId" INTEGER;
ALTER TABLE "RbacRole" ADD CONSTRAINT "RbacRole_parentRoleId_fkey" FOREIGN KEY ("parentRoleId") REFERENCES "RbacRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RbacRolePermission" ADD CONSTRAINT "RbacRolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "RbacRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RbacRolePermission" ADD CONSTRAINT "RbacRolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "RbacPermission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_rbacRoleId_fkey" FOREIGN KEY ("rbacRoleId") REFERENCES "RbacRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill legacy tables/columns that exist in the Prisma schema but were missing from older migration history.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "mobile" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "dob" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isDualRole" BOOLEAN NOT NULL DEFAULT false;
CREATE UNIQUE INDEX IF NOT EXISTS "User_userId_key" ON "User"("userId");

ALTER TABLE "BuyerProfile" ADD COLUMN IF NOT EXISTS "district" TEXT;
ALTER TABLE "BuyerProfile" ADD COLUMN IF NOT EXISTS "officeZoneName" TEXT;
ALTER TABLE "BuyerProfile" ADD COLUMN IF NOT EXISTS "aadhaarNumber" TEXT;
ALTER TABLE "BuyerProfile" ADD COLUMN IF NOT EXISTS "aadhaarVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "BuyerProfile" ADD COLUMN IF NOT EXISTS "otherMethodDetails" TEXT;
ALTER TABLE "BuyerProfile" ADD COLUMN IF NOT EXISTS "declarationAccepted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "BuyerProfile" ADD COLUMN IF NOT EXISTS "termsAccepted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "BuyerProfile" ALTER COLUMN "industry" DROP NOT NULL;
ALTER TABLE "BuyerProfile" ALTER COLUMN "pan" DROP NOT NULL;
ALTER TABLE "BuyerProfile" ALTER COLUMN "state" DROP NOT NULL;
ALTER TABLE "BuyerProfile" ALTER COLUMN "city" DROP NOT NULL;
ALTER TABLE "BuyerProfile" ALTER COLUMN "pincode" DROP NOT NULL;
ALTER TABLE "BuyerProfile" ALTER COLUMN "registeredAddress" DROP NOT NULL;

ALTER TABLE "SellerProfile" ADD COLUMN IF NOT EXISTS "organizationType" TEXT;
ALTER TABLE "SellerProfile" ADD COLUMN IF NOT EXISTS "nameAsInPan" TEXT;
ALTER TABLE "SellerProfile" ADD COLUMN IF NOT EXISTS "dateAsInPan" TIMESTAMP(3);
ALTER TABLE "SellerProfile" ADD COLUMN IF NOT EXISTS "panVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SellerProfile" ADD COLUMN IF NOT EXISTS "detailsUpdated" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SellerProfile" ADD COLUMN IF NOT EXISTS "isStartup" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SellerProfile" ADD COLUMN IF NOT EXISTS "isUdyamCertified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SellerProfile" ADD COLUMN IF NOT EXISTS "participateInBid" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SellerProfile" ADD COLUMN IF NOT EXISTS "optForSahay" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SellerProfile" ADD COLUMN IF NOT EXISTS "turnoverMax3Yrs" TEXT;
ALTER TABLE "SellerProfile" ADD COLUMN IF NOT EXISTS "eInvoicingExcluded" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SellerProfile" ADD COLUMN IF NOT EXISTS "ownershipDeclarationAccepted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SellerProfile" ADD COLUMN IF NOT EXISTS "ownershipVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SellerProfile" ADD COLUMN IF NOT EXISTS "mobile" TEXT;
ALTER TABLE "SellerProfile" ADD COLUMN IF NOT EXISTS "dob" TIMESTAMP(3);
ALTER TABLE "SellerProfile" ADD COLUMN IF NOT EXISTS "roleInOrg" TEXT;
ALTER TABLE "SellerProfile" ADD COLUMN IF NOT EXISTS "catalogType" TEXT;
ALTER TABLE "SellerProfile" ADD COLUMN IF NOT EXISTS "aadhaarVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SellerProfile" ADD COLUMN IF NOT EXISTS "termsAccepted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SellerProfile" ALTER COLUMN "pan" DROP NOT NULL;
ALTER TABLE "SellerProfile" ALTER COLUMN "businessName" DROP NOT NULL;

ALTER TABLE "Tender" ADD COLUMN IF NOT EXISTS "documentUrl" TEXT;

CREATE TABLE IF NOT EXISTS "Bid" (
    "id" SERIAL NOT NULL,
    "tenderId" INTEGER NOT NULL,
    "sellerId" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL,
    "deliveryDays" INTEGER NOT NULL,
    "warranty" TEXT,
    "validTill" TIMESTAMP(3),
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Bid_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "bidCompoundId" ON "Bid"("tenderId", "sellerId");
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "Tender"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "QuoteRequest" (
    "id" SERIAL NOT NULL,
    "buyerId" INTEGER NOT NULL,
    "sellerId" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "documentUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "QuoteRequest_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "QuoteRequest" ADD CONSTRAINT "QuoteRequest_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "QuoteRequest" ADD CONSTRAINT "QuoteRequest_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "Approval" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'approved',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Approval_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "Auction" (
    "id" SERIAL NOT NULL,
    "tenderId" INTEGER NOT NULL,
    "startPrice" DOUBLE PRECISION NOT NULL,
    "currentBid" DOUBLE PRECISION,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Auction_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Auction_tenderId_key" ON "Auction"("tenderId");
ALTER TABLE "Auction" ADD CONSTRAINT "Auction_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "Tender"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" INTEGER,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "Notification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProcurementCategory" (
    "id" SERIAL NOT NULL,
    "parentId" INTEGER,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "industry" TEXT,
    "hsnSac" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProcurementCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductCatalogueItem" (
    "id" SERIAL NOT NULL,
    "sellerId" INTEGER NOT NULL,
    "categoryId" INTEGER,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "hsnCode" TEXT,
    "brand" TEXT,
    "description" TEXT,
    "technicalSpecs" JSONB,
    "unitOfMeasure" TEXT NOT NULL DEFAULT 'Unit',
    "basePrice" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "certifications" JSONB,
    "complianceDocs" JSONB,
    "standardTemplate" JSONB,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProductCatalogueItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ServiceCatalogueItem" (
    "id" SERIAL NOT NULL,
    "sellerId" INTEGER NOT NULL,
    "categoryId" INTEGER,
    "name" TEXT NOT NULL,
    "sacCode" TEXT,
    "description" TEXT,
    "scopeDefinition" JSONB,
    "pricingModel" TEXT NOT NULL DEFAULT 'fixed',
    "basePrice" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "serviceLevel" TEXT,
    "complianceDocs" JSONB,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ServiceCatalogueItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PurchaseRequest" (
    "id" SERIAL NOT NULL,
    "requestNo" TEXT NOT NULL,
    "buyerId" INTEGER NOT NULL,
    "tenderId" INTEGER,
    "categoryId" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "procurementMethod" TEXT NOT NULL DEFAULT 'tender',
    "estimatedValue" DOUBLE PRECISION,
    "boqDocumentUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "requiredBy" TIMESTAMP(3),
    "department" TEXT,
    "deliveryLocation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PurchaseRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BOQItem" (
    "id" SERIAL NOT NULL,
    "purchaseRequestId" INTEGER NOT NULL,
    "lineNo" INTEGER NOT NULL,
    "itemName" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'Unit',
    "estimatedRate" DOUBLE PRECISION,
    "specifications" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BOQItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Contract" (
    "id" SERIAL NOT NULL,
    "contractNo" TEXT NOT NULL,
    "buyerId" INTEGER NOT NULL,
    "sellerId" INTEGER,
    "tenderId" INTEGER,
    "title" TEXT NOT NULL,
    "contractType" TEXT NOT NULL DEFAULT 'standard',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "totalValue" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "documentUrl" TEXT,
    "terms" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ContractItem" (
    "id" SERIAL NOT NULL,
    "contractId" INTEGER NOT NULL,
    "itemName" TEXT NOT NULL,
    "description" TEXT,
    "rate" DOUBLE PRECISION,
    "unit" TEXT NOT NULL DEFAULT 'Unit',
    "ceilingQty" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ContractItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PurchaseOrder" (
    "id" SERIAL NOT NULL,
    "poNumber" TEXT NOT NULL,
    "buyerId" INTEGER NOT NULL,
    "sellerId" INTEGER,
    "purchaseRequestId" INTEGER,
    "contractId" INTEGER,
    "title" TEXT NOT NULL,
    "totalValue" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "expectedDelivery" TIMESTAMP(3),
    "deliveryAddress" TEXT,
    "amendmentHistory" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PurchaseOrderItem" (
    "id" SERIAL NOT NULL,
    "purchaseOrderId" INTEGER NOT NULL,
    "itemName" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'Unit',
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "taxRate" DOUBLE PRECISION,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "technicalSpecs" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Shipment" (
    "id" SERIAL NOT NULL,
    "purchaseOrderId" INTEGER NOT NULL,
    "trackingNo" TEXT NOT NULL,
    "carrier" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "scheduledDate" TIMESTAMP(3),
    "dispatchedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "currentLocation" TEXT,
    "deliveryProofUrl" TEXT,
    "timeline" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InspectionReport" (
    "id" SERIAL NOT NULL,
    "purchaseOrderId" INTEGER NOT NULL,
    "reportNo" TEXT NOT NULL,
    "inspectedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "acceptedQty" DOUBLE PRECISION,
    "rejectedQty" DOUBLE PRECISION,
    "remarks" TEXT,
    "reportUrl" TEXT,
    "checklist" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InspectionReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Invoice" (
    "id" SERIAL NOT NULL,
    "invoiceNo" TEXT NOT NULL,
    "purchaseOrderId" INTEGER,
    "buyerId" INTEGER NOT NULL,
    "sellerId" INTEGER,
    "amount" DOUBLE PRECISION NOT NULL,
    "taxAmount" DOUBLE PRECISION,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'uploaded',
    "invoiceUrl" TEXT,
    "verificationNotes" TEXT,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReverseAuctionBid" (
    "id" SERIAL NOT NULL,
    "auctionId" INTEGER NOT NULL,
    "sellerId" INTEGER NOT NULL,
    "bidAmount" DOUBLE PRECISION NOT NULL,
    "rank" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReverseAuctionBid_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EvaluationCriteria" (
    "id" SERIAL NOT NULL,
    "tenderId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "isMandatory" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EvaluationCriteria_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TechnicalEvaluation" (
    "id" SERIAL NOT NULL,
    "tenderId" INTEGER NOT NULL,
    "bidId" INTEGER,
    "evaluatorId" INTEGER,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "remarks" TEXT,
    "documentsVerified" BOOLEAN NOT NULL DEFAULT false,
    "criteriaScores" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TechnicalEvaluation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FinancialEvaluation" (
    "id" SERIAL NOT NULL,
    "tenderId" INTEGER NOT NULL,
    "bidId" INTEGER,
    "evaluatorId" INTEGER,
    "quotedPrice" DOUBLE PRECISION NOT NULL,
    "benchmarkPrice" DOUBLE PRECISION,
    "variancePercent" DOUBLE PRECISION,
    "anomalyFlag" BOOLEAN NOT NULL DEFAULT false,
    "rank" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FinancialEvaluation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ComparativeStatement" (
    "id" SERIAL NOT NULL,
    "tenderId" INTEGER NOT NULL,
    "statementNo" TEXT NOT NULL,
    "summary" JSONB NOT NULL,
    "recommendedBidId" INTEGER,
    "documentUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'generated',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ComparativeStatement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProcurementCategory_code_key" ON "ProcurementCategory"("code");
CREATE UNIQUE INDEX "PurchaseRequest_requestNo_key" ON "PurchaseRequest"("requestNo");
CREATE UNIQUE INDEX "Contract_contractNo_key" ON "Contract"("contractNo");
CREATE UNIQUE INDEX "PurchaseOrder_poNumber_key" ON "PurchaseOrder"("poNumber");
CREATE UNIQUE INDEX "Shipment_trackingNo_key" ON "Shipment"("trackingNo");
CREATE UNIQUE INDEX "InspectionReport_reportNo_key" ON "InspectionReport"("reportNo");
CREATE UNIQUE INDEX "Invoice_invoiceNo_key" ON "Invoice"("invoiceNo");
CREATE UNIQUE INDEX "ComparativeStatement_statementNo_key" ON "ComparativeStatement"("statementNo");

ALTER TABLE "ProcurementCategory" ADD CONSTRAINT "ProcurementCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ProcurementCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductCatalogueItem" ADD CONSTRAINT "ProductCatalogueItem_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductCatalogueItem" ADD CONSTRAINT "ProductCatalogueItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProcurementCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ServiceCatalogueItem" ADD CONSTRAINT "ServiceCatalogueItem_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceCatalogueItem" ADD CONSTRAINT "ServiceCatalogueItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProcurementCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "Tender"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProcurementCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BOQItem" ADD CONSTRAINT "BOQItem_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "Tender"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ContractItem" ADD CONSTRAINT "ContractItem_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InspectionReport" ADD CONSTRAINT "InspectionReport_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ReverseAuctionBid" ADD CONSTRAINT "ReverseAuctionBid_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReverseAuctionBid" ADD CONSTRAINT "ReverseAuctionBid_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EvaluationCriteria" ADD CONSTRAINT "EvaluationCriteria_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "Tender"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TechnicalEvaluation" ADD CONSTRAINT "TechnicalEvaluation_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "Tender"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TechnicalEvaluation" ADD CONSTRAINT "TechnicalEvaluation_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FinancialEvaluation" ADD CONSTRAINT "FinancialEvaluation_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "Tender"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FinancialEvaluation" ADD CONSTRAINT "FinancialEvaluation_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ComparativeStatement" ADD CONSTRAINT "ComparativeStatement_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "Tender"("id") ON DELETE CASCADE ON UPDATE CASCADE;
