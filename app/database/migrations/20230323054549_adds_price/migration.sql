-- CreateTable
CREATE TABLE "prices" (
    "stripePriceId" TEXT NOT NULL,
    "stripeProductId" TEXT NOT NULL,
    "stripeInterval" TEXT NOT NULL,

    CONSTRAINT "prices_pkey" PRIMARY KEY ("stripePriceId")
);
