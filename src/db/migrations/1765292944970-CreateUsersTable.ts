import { MigrationInterface, QueryRunner, Table } from "typeorm";

// IMPORTANT: Replace the class name with the one generated in your file!
export class CreateUsersTable1765292944970 implements MigrationInterface {

    // ------------------------------------------------------------------
    // UP METHOD: Creates the 'users' table
    // ------------------------------------------------------------------
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Enable UUID extension (Required for PostgreSQL UUID primary keys)
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`); 

        // 2. Create the 'users' table with all columns
        await queryRunner.createTable(
            new Table({
                name: 'users',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        isGenerated: true,
                        default: 'uuid_generate_v4()', 
                    },
                    // Core User Data
                    { 
                        name: 'email', 
                        type: 'varchar', 
                        isUnique: true, 
                        isNullable: false 
                    },
                    { 
                        name: 'firstName', 
                        type: 'varchar', 
                        isNullable: false 
                    },
                    { 
                        name: 'lastName', 
                        type: 'varchar', 
                        isNullable: false 
                    },
                    
                    // Authentication Fields
                    { 
                        name: 'passwordHash', 
                        type: 'varchar', 
                        isNullable: true // Nullable for OAuth users
                    }, 
                    { 
                        name: 'googleId', 
                        type: 'varchar', 
                        isNullable: true // For Google login
                    },      
                    { 
                        name: 'authStrategy', 
                        type: 'varchar', 
                        default: "'local'" // 'local' or 'google'
                    },
                    
                    // Role/Permissions
                    { 
                        name: 'role', 
                        type: 'varchar', 
                        default: "'standard'" 
                    },
                    
                    // Timestamps (Good practice for tracking changes)
                    { 
                        name: 'createdAt', 
                        type: 'timestamp', 
                        default: 'now()' 
                    },
                    { 
                        name: 'updatedAt', 
                        type: 'timestamp', 
                        default: 'now()' 
                    },
                ],
            }),
            true, // IfNotExists = true
        );
    }

    // ------------------------------------------------------------------
    // DOWN METHOD: Drops the 'users' table (for rolling back)
    // ------------------------------------------------------------------
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('users');
    }

}