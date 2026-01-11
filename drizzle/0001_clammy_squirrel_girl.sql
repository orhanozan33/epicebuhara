CREATE TABLE "companySettings" (
	"id" serial PRIMARY KEY NOT NULL,
	"companyName" varchar(255),
	"address" text,
	"phone" varchar(20),
	"postalCode" varchar(20),
	"taxNumber" varchar(100),
	"tpsNumber" varchar(100),
	"tvqNumber" varchar(100),
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
