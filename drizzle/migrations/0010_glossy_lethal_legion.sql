CREATE TABLE "invoice_reminders" (
	"id" text PRIMARY KEY NOT NULL,
	"invoice_id" text NOT NULL,
	"guardian_id" text NOT NULL,
	"channel" text NOT NULL,
	"status" text NOT NULL,
	"error_message" text,
	"school_id" text DEFAULT 'default' NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invoice_reminders" ADD CONSTRAINT "invoice_reminders_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_reminders" ADD CONSTRAINT "invoice_reminders_guardian_id_guardians_id_fk" FOREIGN KEY ("guardian_id") REFERENCES "public"."guardians"("id") ON DELETE no action ON UPDATE no action;