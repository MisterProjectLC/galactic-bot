const {Pool, Client} = require('pg');
const config = require('../data/config');

const pg_client = new Pool({
    user: config.user,
    host: config.host,
    database: config.database,
    password: config.password,
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
