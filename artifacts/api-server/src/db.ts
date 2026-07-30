import pg from "pg";

// NUMERIC/DECIMAL type (OID 1700) is returned as string by pg — convert to number
pg.types.setTypeParser(1700, (val: string) => parseFloat(val));

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export default pool;
