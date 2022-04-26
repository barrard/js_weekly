require("dotenv").config();

console.log("DB");
const mongoose = require("mongoose");
const db_name = process.env.DB_NAME || "js_weekly";
const db_host = process.env.DB_HOST || "localhost"; //192.168.0.243
console.log({ db_name });
// mongoose.set('debug', true);

mongoose
    .connect(`mongodb://${db_host}/${db_name}`, {
        useNewUrlParser: true,
        // useCreateIndex: true,
        // useFindAndModify: false,
        useUnifiedTopology: true,
    })
    .then((connection) => {
        console.log(`Connected to MongoDB @ ${db_host}`);
    })
    .catch((error) => {
        console.log(error.message);
    });

module.exports = mongoose;
