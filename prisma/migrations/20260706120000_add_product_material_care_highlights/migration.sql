-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "material" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "careInstructions" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "highlights" TEXT NOT NULL DEFAULT '';
