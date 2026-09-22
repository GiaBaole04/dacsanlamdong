import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: '123456zZ',
  database: 'dacsanlamdong',
});