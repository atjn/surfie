-- CreateTable
CREATE TABLE "Term" (
    "id" SERIAL NOT NULL,
    "term" TEXT NOT NULL,

    CONSTRAINT "Term_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_Term" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_Term_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Term_term_key" ON "Term"("term");

-- CreateIndex
CREATE INDEX "_Term_B_index" ON "_Term"("B");

-- AddForeignKey
ALTER TABLE "_Term" ADD CONSTRAINT "_Term_A_fkey" FOREIGN KEY ("A") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Term" ADD CONSTRAINT "_Term_B_fkey" FOREIGN KEY ("B") REFERENCES "Term"("id") ON DELETE CASCADE ON UPDATE CASCADE;
