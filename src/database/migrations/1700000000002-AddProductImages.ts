import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductImages1700000000002 implements MigrationInterface {
  name = 'AddProductImages1700000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "product_images" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "productId" uuid NOT NULL,
        "url" character varying NOT NULL,
        "order" integer NOT NULL DEFAULT 0,
        "alt" character varying,
        CONSTRAINT "PK_product_images" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "product_images"
        ADD CONSTRAINT "FK_product_images_productId"
        FOREIGN KEY ("productId") REFERENCES "products"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_product_images_productId" ON "product_images" ("productId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "IDX_product_images_productId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_images" DROP CONSTRAINT "FK_product_images_productId"`,
    );
    await queryRunner.query(`DROP TABLE "product_images"`);
  }
}
