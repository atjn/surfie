-- AlterTable
ALTER TABLE "Site" ADD COLUMN     "scanPriority" INTEGER;

-- CreateTable
CREATE TABLE "Host" (
    "id" SERIAL NOT NULL,
    "host" VARCHAR(200) NOT NULL,
    "robots" VARCHAR(512000) NOT NULL,

    CONSTRAINT "Host_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Host_host_key" ON "Host"("host");
