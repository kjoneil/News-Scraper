var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var request = require('request');
var cheerio = require('cheerio');

//  Middleware 
app.use(logger('dev'));
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(express.static('public')); 

// mongoose.connect('mongodb://localhost/mongoosescraper');
// var db = mongoose.connection;

// db.on("error", function(error) {
//   console.log("Mongoose Error: ", error);
// });

// //   db through mongoose, log a success message
// db.once("open", function() {
//   console.log("Mongoose connection successful.");
// });

var MONGODB_URI = process.env.MONGODB_URI ||'mongodb://localhost/mongoHeadlines'
mongoose.connect(MONGODB_URI);
// requiring to models
var Note = require('./models/Note.js');
var Article = require('./models/Article.js');

// Routes 
app.get('/', function(req, res) {
  res.send(index.html); // sending the html file rather than rendering a handlebars file
});

app.get('/scrape', function(req, res) {
request("https://www.nytimes.com/section/science", function(error, response, html) {
  var $ = cheerio.load(html);
  $('article h2').each(function(i, element) {
   
    var query = ("https://www.nytimes.com/" + $(this).children('a').attr('href'));
    var result = {};

      result.title = $(this).children('a').text();
      result.link = query;

      var entry = new Article (result);

      entry.save(function(err, doc) {
        if (err) {
          console.log(err);
        } else {
          console.log(doc);
        }
      });


  });
});
res.send("Scrape Complete");
});


app.get('/articles', function(req, res){
Article.find({}, function(err, doc){
  if (err){
    console.log(err);
  } else {
    res.json(doc);
  }
});
});


app.get('/articles/:id', function(req, res){
Article.findOne({'_id': req.params.id})
.populate('note')
.exec(function(err, doc){
  if (err){
    console.log(err);
  } else {
    res.json(doc);
  }
});
});


app.post('/articles/:id', function(req, res){
var newNote = new Note(req.body);

newNote.save(function(err, doc){
  if(err){
    console.log(err);
  } else {
    Article.findOneAndUpdate({'_id': req.params.id}, {'note':doc._id})
    .exec(function(err, doc){
      if (err){
        console.log(err);
      } else {
        res.send(doc);
      }
    });

  }
});
});
app.listen(process.env.PORT||3001, function() {
console.log('App running on port 3001!');
});