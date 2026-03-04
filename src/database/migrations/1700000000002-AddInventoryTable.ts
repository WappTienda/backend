import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInventoryTable1700000000002 implements MigrationInterface {
  name = 'AddInventoryTable1700000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "inventory" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "productId" uuid NOT NULL,
        "stockQuantity" integer NOT NULL DEFAULT 0,
        "reservedQuantity" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_inventory_productId" UNIQUE ("productId"),
        CONSTRAINT "PK_inventory" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "inventory"
        ADD CONSTRAINT "FK_inventory_productId"
        FOREIGN KEY ("productId") REFERENCES "products"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_inventory_productId" ON "inventory" ("productId")`,
    );

    // Seed inventory records for all products with trackInventory = true
    await queryRunner.query(`
      INSERT INTO "inventory" ("productId", "stockQuantity", "reservedQuantity")
      SELECT "id", "stockQuantity", 0
      FROM "products"
      WHERE "trackInventory" = true
      ON CONFLICT ("productId") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_inventory_productId"`);
    await queryRunner.query(
      `ALTER TABLE "inventory" DROP CONSTRAINT "FK_inventory_productId"`,
    );
    await queryRunner.query(`DROP TABLE "inventory"`);
  }
}
