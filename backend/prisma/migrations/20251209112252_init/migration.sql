/*
  Warnings:

  - You are about to drop the `Test` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_UserTests` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_UserTests" DROP CONSTRAINT "_UserTests_A_fkey";

-- DropForeignKey
ALTER TABLE "_UserTests" DROP CONSTRAINT "_UserTests_B_fkey";

-- DropTable
DROP TABLE "Test";

-- DropTable
DROP TABLE "_UserTests";
