var fs = require("fs");
var express = require("express");
var app = express();
var PORT = process.argv[2] || 8000;
var LIMIT = 15 * 60 * 1000;
var recentVotes = {};
var articles;

app.use("/api/vote",function(request,response) {
  var url = request.url.split("?")[0];
  var qs = request.url.split("?").slice(1).join("?").split(",");
  var ip = request.connection.remoteAddress || request.headers["x-forwarded-for"];
  if ( ! articles[qs[0]] ) {
    console.log(`REJECT notfound ${ip} ${qs[0]}`);
    response.writeHead(404);
    response.write("err_no_article");
    response.end();
    return;
  }
  if ( ! recentVotes[ip] ) recentVotes[ip] = [];
  var item = recentVotes[ip].filter(item => item.article == qs[0])[0];
  if ( item ) {
    if ( item.expires <= new Date().getTime() ) {
      recentVotes[ip].splice(recentVotes[ip].indexOf(item),1);
    } else {
      console.log(`REJECT expire ${ip} ${qs[0]}`);
      response.writeHead(400);
      response.write("err_no_expire");
      response.end();
      return;
    }
  }
  recentVotes[ip].push({
    article: qs[0],
    expires: new Date().getTime() + LIMIT
  });
  articles[qs[0]].votes[qs[1]][qs[2]]++;
  console.log(`VOTE ${ip} ${qs[0]} ${qs[1]}`);
  response.writeHead(200);
  response.write("ok");
  response.end();
});

app.use("/api/create",function(request,response) {
  request.url = decodeURI(request.url);
  var url = request.url.split("?")[0];
  var qs = request.url.split("?").slice(1).join("?").split(",");
  var ip = request.connection.remoteAddress || request.headers["x-forwarded-for"];
  articles[Math.floor(Math.random() * 10e5).toString()] = {
    url: qs[0],
    title: qs[1],
    votes: [
      [0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0]
    ]
  }
  console.log(`CREATE ${ip} ${qs[0]} ${qs[1]}`);
  response.writeHead(200);
  response.write("ok");
  response.end();
});

app.use("/api/info",function(request,response) {
  var url = request.url.split("?")[0];
  var qs = request.url.split("?").slice(1).join("?").split(",");
  var ip = request.connection.remoteAddress || request.headers["x-forwarded-for"];
  if ( ! articles[qs[0]] ) {
    response.writeHead(404);
    response.write("err_no_article");
    response.end();
    console.log(`REJECT notfound ${ip} ${qs[0]}`);
    return;
  }
  console.log(`INFO ${ip} ${qs[0]}`);
  response.writeHead(200);
  response.write(JSON.stringify({
    url: articles[qs[0]].url,
    title: articles[qs[0]].title,
    votes: {
      left: {
        sum: articles[qs[0]].votes.slice(0,3).reduce((totala,arr) => totala + arr.map(item => item.reduce((totalb,num) => totalb + num))),
        rating: calculateVotes(articles[qs[0]],"left")
      },
      right: {
        sum: articles[qs[0]].votes.slice(3).reduce((totala,arr) => totala + arr.map(item => item.reduce((totalb,num) => totalb + num))),
        rating: calculateVotes(articles[qs[0]],"right")
      },
      rating: calculateVotes(articles[qs[0]],"all")
    }
  }));
  response.end();
});

app.use("/api/list",function(request,response) {
  var url = request.url.split("?")[0];
  var qs = request.url.split("?").slice(1).join("?").split(",");
  var ip = request.connection.remoteAddress || request.headers["x-forwarded-for"];
  var items = {};
  var keys = Object.keys(articles);
  for ( var i = 0; i < keys.length; i++ ) {
    items[keys[i]] = articles[keys[i]].title;
  }
  console.log(`LIST ${ip}`);
  response.writeHead(200);
  response.write(JSON.stringify(items));
  response.end();
});

app.use("/web",express.static("web"));

function calculateVotes(votes) {
  return votes[0][0]; // temporary
}

app.listen(PORT,function() {
  fs.readFile(__dirname + "/articles.json",function(err,data) {
    if ( err ) throw err;
    articles = JSON.parse(data.toString());
    setInterval(function() {
      fs.writeFile(__dirname + "/articles.json",JSON.stringify(articles,null,2),function(err) {
        if ( err ) throw err;
      });
    },20000);
  });
  console.log("Listening on port " + PORT);
});
