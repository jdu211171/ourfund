ALTER TABLE "User" ADD COLUMN "budgetMode" TEXT NOT NULL DEFAULT 'personal';
ALTER TABLE "User" ADD COLUMN "reportPeriod" TEXT NOT NULL DEFAULT 'Month';
ALTER TABLE "User" ADD COLUMN "notificationPrefs" JSONB NOT NULL DEFAULT '{"Category at 80%":true,"Category over budget":true,"Large transaction":false,"New member expense":true,"Transfer requests":true,"Goal contributions":false,"Daily digest":true,"Weekly report":true,"Bill reminders":true}'::jsonb;
ALTER TABLE "User" ADD COLUMN "historyFilters" JSONB NOT NULL DEFAULT '{"kind":"All","member":"Anyone","categories":[],"sort":"Newest","minUsd":0,"maxUsd":5000}'::jsonb;
