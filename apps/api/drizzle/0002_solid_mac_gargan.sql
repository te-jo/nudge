ALTER TABLE "tags" ADD COLUMN "spot" text;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_spot_unique" UNIQUE("spot");