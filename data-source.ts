// data-source.ts - Place this in the root of your project

import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path'; 

// Load environment variables from .env
dotenv.config(); 

const AppDataSource = new DataSource({
    // Database Connection Details (Using safe defaults)
    type: (process.env.DB_TYPE || 'postgres') as any,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_DATABASE || 'homecoming',

    synchronize: false,
    logging: true,
    
    // 🎯 CRITICAL FIX: Add a second path pattern to capture all compiled entity files (.js)
    entities: [
        path.join('dist', '**', '*.entity.js'), // Captures files like user.entity.js
        path.join('dist', '**', 'item-request.js'), // 🎯 Specifically targets the item-request.js file
        // You might consider path.join('dist', '**', '*.js') to capture ALL entities,
        // but the specific targeting above is safer if you have other non-entity JS files.
    ], 
    
    // 🟢 Migrations: Path points to the compiled JS files in the migration directory.
    migrations: [path.join('dist', 'src', 'db', 'migrations', '*.js')], 
});

// Use the export default syntax for ES Modules
export default AppDataSource;