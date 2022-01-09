const {Pool, Client} = require('pg');

const pg_client = new Pool({
    user: 'eboecrpdooyjxt',
    host: 'ec2-3-209-234-80.compute-1.amazonaws.com',
    database: 'd5qpsaj2npb22k',
    password: '6e4d4d29dc363de94bbd702d5f78e9744018746305f8304b26bc731c3e3f8dfb',
    port: 5432,
    ssl: { rejectUnauthorized: false },
    idleTimeoutMillis: 40000,
    connectionTimeoutMillis: 6000,
});

async function connectDB() {
    await pg_client.connect();
    console.log("DB connected");
}

async function makeQuery(query, values = []) {
    console.assert(Array.isArray(values), "Query values must be an array");

    return await pg_client.query(query, values);
}

module.exports.connectDB = connectDB;
module.exports.makeQuery = makeQuery;
