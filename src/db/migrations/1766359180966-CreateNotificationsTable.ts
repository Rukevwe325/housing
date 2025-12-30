import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateNotificationsTable1766359180966 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Create the custom Enum type for notifications
        await queryRunner.query(`
            CREATE TYPE "notifications_type_enum" AS ENUM(
                'match_update', 
                'new_trip_match', 
                'system'
            )
        `);

        // 2. Create the Notifications table
        // Changed "userId" from character varying to uuid to match users.id
        await queryRunner.query(`
            CREATE TABLE "notifications" (
                "id" SERIAL PRIMARY KEY,
                "userId" uuid NOT NULL,
                "title" character varying NOT NULL,
                "message" text NOT NULL,
                "type" "notifications_type_enum" NOT NULL DEFAULT 'system',
                "isRead" boolean NOT NULL DEFAULT false,
                "relatedId" character varying,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);

        // 3. Add Foreign Key to Users table
        await queryRunner.query(`
            ALTER TABLE "notifications" 
            ADD CONSTRAINT "FK_notifications_user" 
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop everything in reverse order
        // Use IF EXISTS to prevent errors during rollback
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "FK_notifications_user"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "notifications_type_enum"`);
    }
}