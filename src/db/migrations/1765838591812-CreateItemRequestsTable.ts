// src/db/migrations/[timestamp]-CreateItemRequestsTable.ts

import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

// Replace [timestamp] with the actual generated timestamp
export class CreateItemRequestsTable1765838591812 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Create the 'item_requests' table
        await queryRunner.createTable(new Table({
            name: "item_requests",
            columns: [
                {
                    name: "id",
                    type: "int", // Primary Key for the request itself
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "increment",
                },
                {
                    // Foreign Key to the 'users' table (The Requester)
                    name: "requesterId", 
                    type: "uuid", 
                    isNullable: false,
                },
                {
                    name: "itemName",
                    type: "varchar",
                    isNullable: false,
                },
                {
                    name: "quantity",
                    type: "int",
                    isNullable: false,
                },
                {
                    name: "weightKg",
                    type: "decimal",
                    precision: 5, // Maximum of 999.99 kg
                    scale: 2,
                    isNullable: false,
                },
                {
                    name: "destination",
                    type: "varchar",
                    isNullable: false,
                },
                {
                    name: "desiredDeliveryDate",
                    type: "date",
                    isNullable: false,
                },
                {
                    name: "notes",
                    type: "text",
                    isNullable: true,
                },
                {
                    name: "status",
                    type: "varchar",
                    default: "'open'", // Initial status is 'open'
                },
                {
                    name: "createdAt",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP",
                },
            ]
        }));

        // 2. Define the Foreign Key relationship to the 'users' table
        await queryRunner.createForeignKey(
            "item_requests",
            new TableForeignKey({
                columnNames: ["requesterId"],
                referencedColumnNames: ["id"],
                referencedTableName: "users",
                onDelete: "CASCADE",
                name: "FK_item_requests_requesterId"
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 1. Drop the Foreign Key constraint
        await queryRunner.dropForeignKey("item_requests", "FK_item_requests_requesterId");
        
        // 2. Drop the 'item_requests' table
        await queryRunner.dropTable("item_requests");
    }
}