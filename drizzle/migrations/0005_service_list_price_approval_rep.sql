ALTER TYPE "approval_role" ADD VALUE IF NOT EXISTS 'sales_rep';
--> statement-breakpoint
ALTER TABLE "service_catalog" ADD COLUMN IF NOT EXISTS "list_price" numeric(12, 2) DEFAULT '0' NOT NULL;
