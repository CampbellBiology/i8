const mariadb = require("mysql");

const i8_database = mariadb.createConnection({
  host: "http://183.101.208.3:14530",
  port: 3306,
  user: "root",
  password: "mimi1221",
  database: "i8_database",
});

module.exports = i8_database;
