-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "gameDayId" TEXT NOT NULL,
    "fromUser" TEXT NOT NULL,
    "toUser" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_gameDayId_fkey" FOREIGN KEY ("gameDayId") REFERENCES "GameDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;
