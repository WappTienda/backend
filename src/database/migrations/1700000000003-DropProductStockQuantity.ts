import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropProductStockQuantity1700000000003 implements MigrationInterface {
  name = 'DropProductStockQuantity1700000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN IF EXISTS "stockQuantity"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN "stockQuantity" integer NOT NULL DEFAULT 0`,
    );

    // Restore stockQuantity from inventory records for tracked products
    await queryRunner.query(`
      UPDATE "products" p
      SET "stockQuantity" = inv."stockQuantity"
      FROM "inventory" inv
      WHERE inv."productId" = p.id
        AND p."trackInventory" = true
    `);
  }
}
