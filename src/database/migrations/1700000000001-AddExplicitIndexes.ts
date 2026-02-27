import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExplicitIndexes1700000000001 implements MigrationInterface {
  name = 'AddExplicitIndexes1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_products_categoryId" ON "products" ("categoryId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_orders_status" ON "orders" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_customers_phone" ON "customers" ("phone")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_customers_phone"`);
    await queryRunner.query(`DROP INDEX "IDX_orders_status"`);
    await queryRunner.query(`DROP INDEX "IDX_products_categoryId"`);
  }
}
