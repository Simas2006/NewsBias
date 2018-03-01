var fs = require("fs");
var express = require("express");
var app = express();
var PORT = process.argv[2] || 8000;
var WAIT_BETWEEN_VOTES = 15 * 60 * 1000;
var VOTE_MODIFIER = 0.25;
var recentVotes = {};
var articles,comments;

app.use(express.urlencoded({extended:true}));
app.use(express.json());

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
    expires: new Date().getTime() + WAIT_BETWEEN_VOTES
  });
  articles[qs[0]].votes[qs[1]][qs[2]]++;
  console.log(`VOTE ${ip} ${qs[0]} ${qs[1]} ${qs[2]}`);
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
    comments: comments[qs[0]],
    votes: {
      left: {
        sum: arrSum(articles[qs[0]].votes.slice(0,3)),
        rating: calculateVotes(articles[qs[0]].votes.slice(0,3),"left")
      },
      right: {
        sum: arrSum(articles[qs[0]].votes.slice(3)),
        rating: calculateVotes(articles[qs[0]].votes.slice(3),"right")
      },
      rating: calculateVotes(articles[qs[0]].votes,"all")
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

app.post("/api/comment",function(request,response) {
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
  comments[qs[0]].push({
    id: Math.floor(Math.random() * 10e6),
    name: qs[1],
    votes: 0,
    opinion: qs[3],
    comment: encodeURI(request.body.comment),
    replies: []
  });
  console.log(`COMMENT ${ip} ${qs[0]} ${qs[3]}`);
});

app.use("/web",express.static("web"));

function calculateVotes(votes,type) {
  var matrix = [
    [-1, 0, 1,-1, 1, 0,-1],
    [ 0,-1, 0, 0, 0,-1, 0],
    [ 1, 0,-1, 1,-1, 0, 1],
    [ 1, 0,-1, 1,-1, 0, 1],
    [ 0,-1, 0, 0, 0,-1, 0],
    [-1, 0, 1,-1, 1, 0,-1]
  ];
  var left = 0;
  var right = 0;
  var middle = 0;
  for ( var i = 0; i < votes.length; i++ ) {
    for ( var j = 0; j < votes[i].length; j++ ) {
      var val = votes[i][j] + votes[i][j] * matrix[i][j] * VOTE_MODIFIER;
      if ( j < 3 ) left += val * (j + 1);
      else if ( j > 3 ) right += val * (j - 3);
      else middle += val;
    }
  }
  var rating = right - left;
  if ( rating > 0 ) {
    if ( rating - middle < 0 ) rating = 0;
    else rating -= middle;
  } else if ( rating < 0 ) {
    if ( rating + middle > 0 ) rating = 0;
    else rating += middle;
  }
  return rating;
}

function arrSum(arr) {
  var sum = 0;
  for ( var i = 0; i < arr.length; i++ ) {
    if ( typeof arr[i] == "object" ) sum += arrSum(arr[i]);
    else sum += arr[i];
  }
  return sum;
}

app.listen(PORT,function() {
  fs.readFile(__dirname + "/articles.json",function(err,data) {
    if ( err ) throw err;
    articles = JSON.parse(data.toString());
    fs.readFile(__dirname + "/comments.json",function(err,data) {
      comments = JSON.parse(data.toString());
      setInterval(function() {
        fs.writeFile(__dirname + "/articles.json",JSON.stringify(articles),function(err) {
          if ( err ) throw err;
          fs.writeFile(__dirname + "/comments.json",JSON.stringify(comments),function(err) {
            if ( err ) throw err;
          });
        });
      },20000);
    });
  });
  console.log("Listening on port " + PORT);
});
