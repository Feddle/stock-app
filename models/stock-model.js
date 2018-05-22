const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const stockSchema = new Schema({
    code: {type: String, unique: true},
    description: String,
    data: [[Number]]
});

const Stock = mongoose.model("stock-app-stocks", stockSchema);


module.exports = Stock;
