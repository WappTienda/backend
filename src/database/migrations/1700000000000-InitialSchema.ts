import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('admin')`,
    );
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "name" character varying,
        "role" "public"."users_role_enum" NOT NULL DEFAULT 'admin',
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "slug" character varying NOT NULL,
        "description" character varying,
        "order" integer NOT NULL DEFAULT 0,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_categories_name" UNIQUE ("name"),
        CONSTRAINT "UQ_categories_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_categories" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "sku" character varying NOT NULL,
        "name" character varying NOT NULL,
        "description" text,
        "price" numeric(10,2) NOT NULL,
        "salePrice" numeric(10,2),
        "imageUrl" character varying,
        "categoryId" uuid,
        "stockQuantity" integer NOT NULL DEFAULT 0,
        "trackInventory" boolean NOT NULL DEFAULT false,
        "isVisible" boolean NOT NULL DEFAULT true,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        CONSTRAINT "UQ_products_sku" UNIQUE ("sku"),
        CONSTRAINT "PK_products" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "products"
        ADD CONSTRAINT "FK_products_categoryId"
        FOREIGN KEY ("categoryId") REFERENCES "categories"("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE "customers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "phone" character varying NOT NULL,
        "address" character varying,
        "notes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_customers" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE TYPE "public"."orders_status_enum" AS ENUM('pending', 'contacted', 'confirmed', 'delivered', 'cancelled')`,
    );
    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "publicId" character varying NOT NULL,
        "customerId" uuid,
        "status" "public"."orders_status_enum" NOT NULL DEFAULT 'pending',
        "totalAmount" numeric(10,2) NOT NULL DEFAULT 0,
        "customerNote" text,
        "adminNote" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_orders_publicId" UNIQUE ("publicId"),
        CONSTRAINT "PK_orders" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "orders"
        ADD CONSTRAINT "FK_orders_customerId"
        FOREIGN KEY ("customerId") REFERENCES "customers"("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE "order_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "orderId" uuid NOT NULL,
        "productId" uuid,
        "productName" character varying NOT NULL,
        "productSku" character varying NOT NULL,
        "quantity" integer NOT NULL,
        "unitPrice" numeric(10,2) NOT NULL,
        "subtotal" numeric(10,2) NOT NULL,
        CONSTRAINT "PK_order_items" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "order_items"
        ADD CONSTRAINT "FK_order_items_orderId"
        FOREIGN KEY ("orderId") REFERENCES "orders"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "order_items"
        ADD CONSTRAINT "FK_order_items_productId"
        FOREIGN KEY ("productId") REFERENCES "products"("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE "settings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "key" character varying NOT NULL,
        "value" text,
        "description" character varying,
        "isPublic" boolean NOT NULL DEFAULT false,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_settings_key" UNIQUE ("key"),
        CONSTRAINT "PK_settings" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP CONSTRAINT "FK_order_items_productId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP CONSTRAINT "FK_order_items_orderId"`,
    );
    await queryRunner.query(`DROP TABLE "order_items"`);
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_orders_customerId"`,
    );
    await queryRunner.query(`DROP TABLE "orders"`);
    await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_products_categoryId"`,
    );
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP TABLE "customers"`);
    await queryRunner.query(`DROP TABLE "categories"`);
    await queryRunner.query(`DROP TABLE "settings"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}
