var searchData;

/*
  - Hot Topic (lots of votes)
  - Controversial (overall 0% biased, passionate)
  - Not Passionate (overall 0% biased, not passionate)
  - Decided (overall 100% biased, both sides)
  - One-Sided (overall 75% biased, one side only)
  - You Decide (new articles/no votes)
*/

function simpleAJAX(url,callback) {
  var req = new XMLHttpRequest();
  req.open("GET",url);
  req.onload = function() {
    callback(this.responseText);
  }
  req.send();
}

function renderAll() {
  var titles = ["Hot Topic","Controversial","Not Passionate","Decided","One-Sided","You Decide"];
  for ( var i = 0; i < 6; i++ ) {
    var element = document.getElementById("screen" + (i + 1));
    var heading = document.createElement("h3");
    heading.innerText = titles[i];
    element.appendChild(heading);
    element.appendChild(document.createElement("hr"));
    for ( var j = 0; j < searchData[i].length; j++ ) {
      var title = document.createElement("a");
      title.innerText = `${searchData[i][j].title} - ${Math.abs(searchData[i][j].rating)}% Biased`;
      title.href = "/web/article/index.html?" + searchData[i][j].id;
      var opinion = 1;
      if ( searchData[i][j].rating > 0 ) {
        title.className = "right";
        opinion = 2;
      } else if ( searchData[i][j].rating < 0 ) {
        title.className = "left";
        opinion = 0;
      } else {
        title.className = "center";
      }
      element.appendChild(title);
      element.appendChild(document.createElement("br"));
      var comment = document.createElement("textarea");
      var selected = searchData[i][j].comments.filter(item => item.votes > 0 && item.opinion == opinion).sort((a,b) => b.votes - a.votes);
      selected = selected[0] || null;
      if ( selected ) {
        selected = decodeURIComponent(selected.comment).split("\n").join(" ");
        comment.value = `Top supporting comment:\n${selected}`;
      } else {
        comment.value = "No supporting comment";
      }
      comment.rows = "4";
      comment.disabled = "disabled";
      element.appendChild(comment);
      element.appendChild(document.createElement("br"));
      element.appendChild(document.createElement("br"));
    }
  }
  var text = ["bronze","silver","ruby","gold","emerald","diamond"];
  var points = parseInt(localStorage.getItem("points")[0]);
  var awards = document.getElementById("awards");
  for ( var i = 0; i < points; i++ ) {
    var button = document.createElement("button");
    button.id = text[i] + "-award";
    button.className = "tiny";
    button.innerText = text[i].charAt(0).toUpperCase();
    awards.appendChild(button);
  }
}

function setOpinion(value) {
  localStorage.setItem("party",value);
  var items = ["left1","left2","left3","right3","right2","right1"];
  for ( var i = 0; i < items.length; i++ ) {
    document.getElementById(items[i]).className = "tiny";
  }
  document.getElementById(items[value]).className = "tiny selected";
}

function openRandomPage() {
  incrementAwardPoints(2);
  location.href = "/api/random";
}

window.onload = function() {
  if ( localStorage.getItem("party") ) setOpinion(parseInt(localStorage.getItem("party")));
  simpleAJAX("/api/search?retr",function(data) {
    searchData = JSON.parse(data);
    renderAll();
    renderNavbar();
  });
}
