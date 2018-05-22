
const express = require("express");
const helmet = require("helmet");
const mongoose = require("mongoose");
const axios = require("axios");
const nunjucks = require("nunjucks");

const Stock = require("./models/stock-model");

const app = express();
const listener = app.listen(process.env.PORT, () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
});
const io = require('socket.io')(listener);

const url = "mongodb://"+process.env.DB_USER+":"+process.env.DB_PASS+"@"+process.env.DB_HOST+":"+process.env.DB_PORT+"/"+process.env.DB_NAME;


app.use(helmet());
app.use(express.static("public"))


nunjucks.configure('views', {
    autoescape: true,
    express: app
});


mongoose.connect(url, () => {
    console.log('connected to mongodb');
});



io.on("connection", (socket) => {  
  let d = new Date();
  d -= 31556952000;
  let t = new Date(d);
  let start_date = t.toISOString().substr(0, 10);
  socket.on("add stock", (code) => {    
    axios.get("https://www.quandl.com/api/v3/datasets/WIKI/"+code+".json?api_key=" + process.env.QUANDL_API_KEY + "&start_date=" + start_date + "&order=asc&column_index=" + "1")  
    .then((response) => {  
      let modData = response.data.dataset.data.map((arr) => {
        let temp = arr;
        temp[0] = Date.parse(temp[0]);
        return temp;
      });
      let obj = {code: response.data.dataset.dataset_code, description: response.data.dataset.name, data: modData}; 
      let newStock = new Stock(obj);
      newStock.save();
      io.emit("add stock", obj);
    })
    .catch((err) => {
      socket.emit("add stock", null);
    });
  });
  
  socket.on("remove stock", (code) => {
    Stock.deleteOne({code: code}, (err) => {
      if (err) console.log(err);
    });
    io.emit("remove stock", code);
  });
});


//route for homepage
app.get("/", (req, res, next) => {
  Stock.find({}).then((stocks) => {    
    res.render("index.html", {stocks: stocks});    
  });  
});



//default route
app.get("*", (req, res) => {
  res.status(404).end("Page not found");
});



app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send(err);
});






