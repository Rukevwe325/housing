import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateTripsTable1765317593136 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Create the 'trips' table
        await queryRunner.createTable(new Table({
            name: "trips",
            columns: [
                {
                    name: "id",
                    type: "int", // Keeping 'int' for the primary key of the Trip itself
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "increment",
                },
                {
                    // 🚨 FIX: Must be 'uuid' to link to the 'users' table id
                    name: "carrierId", 
                    type: "uuid", 
                    isNullable: false,
                },
                {
                    name: "from",
                    type: "varchar",
                    isNullable: false,
                },
                {
                    name: "to",
                    type: "varchar",
                    isNullable: false,
                },
                {
                    name: "departureDate",
                    type: "date",
                    isNullable: false,
                },
                {
                    name: "returnDate",
                    type: "date",
                    isNullable: true,
                },
                {
                    name: "availableLuggageSpace",
                    type: "decimal",
                    precision: 5,
                    scale: 2,
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
                    default: "'active'",
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
            "trips",
            new TableForeignKey({
                columnNames: ["carrierId"],
                referencedColumnNames: ["id"],
                referencedTableName: "users",
                onDelete: "CASCADE",
                name: "FK_trips_carrierId"
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 1. Drop the Foreign Key constraint
        await queryRunner.dropForeignKey("trips", "FK_trips_carrierId");
        
        // 2. Drop the 'trips' table
        await queryRunner.dropTable("trips");
    }
}