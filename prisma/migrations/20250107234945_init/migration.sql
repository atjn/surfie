-- CreateEnum
CREATE TYPE "ScanResult" AS ENUM ('Waiting', 'Scanning', 'Success', 'FoundCanonical', 'WrongLanguage', 'Blocked', 'Error');

-- CreateTable
CREATE TABLE "Site" (
    "id" SERIAL NOT NULL,
    "url" VARCHAR(200) NOT NULL,
    "title" VARCHAR(60),
    "description" VARCHAR(160),
    "scanResult" "ScanResult" NOT NULL DEFAULT 'Waiting',
    "scanTime" TIMESTAMP(3),
    "error" VARCHAR(60),
    "canonicalId" INTEGER,
    "nextId" INTEGER,
    "previousId" INTEGER,
    "privPolId" INTEGER,
    "tosId" INTEGER,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_Link" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_Link_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Site_url_key" ON "Site"("url");

-- CreateIndex
CREATE INDEX "_Link_B_index" ON "_Link"("B");

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_canonicalId_fkey" FOREIGN KEY ("canonicalId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_nextId_fkey" FOREIGN KEY ("nextId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_previousId_fkey" FOREIGN KEY ("previousId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_privPolId_fkey" FOREIGN KEY ("privPolId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_tosId_fkey" FOREIGN KEY ("tosId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Link" ADD CONSTRAINT "_Link_A_fkey" FOREIGN KEY ("A") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Link" ADD CONSTRAINT "_Link_B_fkey" FOREIGN KEY ("B") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
