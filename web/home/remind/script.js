var data = [];

function renderAll() {
  var table = document.getElementById("results");
  for ( var i = 0; i < data.length; i++ ) {
    var row = document.createElement("tr");
    var graphic = document.createElement("td");
    graphic.className = "remind-small";
    renderBarGraphic(graphic,data[i].votes.rating);
    row.appendChild(graphic);
    var col = document.createElement("td");
    var title = document.createElement("a");
    title.innerText = `${data[i].title} - ${Math.abs(data[i].votes.rating)}% Biased`;
    var opinion = 1;
    if ( data[i].votes.rating < 0 ) {
      title.className = "left";
      opinion = 0;
    } else if ( data[i].votes.rating > 0 ) {
      title.className = "right";
      opinion = 2;
    } else {
      title.className = "center";
    }
    title.href = `/web/article/index.html?${data[i].id}`
    col.appendChild(title);
    var comment = document.createElement("textarea");
    var selected = data[i].comments.filter(item => item.votes > 0 && item.opinion == opinion).sort((a,b) => b.votes - a.votes);
    selected = selected[0] || null;
    if ( selected ) {
      selected = decodeURIComponent(selected.comment).split("\n").join(" ");
      comment.value = `Top supporting comment:\n${selected}`;
    } else {
      comment.value = "No supporting comment";
    }
    comment.rows = "4";
    comment.disabled = "disabled";
    col.appendChild(comment);
    col.appendChild(document.createElement("hr"));
    col.className = "remind-large";
    row.appendChild(col);
    table.appendChild(row);
  }
}

window.onload = function() {
  function getItems(callback,index) {
    if ( ! index ) index = 0;
    simpleAJAX(`/api/info?${list[index][0]}`,function(item) {
      data.push(JSON.parse(item));
      if ( index + 1 >= Math.min(list.length,10) ) {
        callback();
      } else {
        getItems(callback,index + 1);
      }
    });
  }
  var list = localStorage.getItem("reminders").split(",").map(item => item.split(":"));
  list = list.filter(item => parseInt(item[1]) < new Date().getTime());
  var points = localStorage.getItem("points").split(":").map(item => parseInt(item));
  if ( points[2] ) {
    var awards = ["bronze","silver","ruby","gold","emerald","diamond"];
    var div = document.getElementById("new-award");
    var p = document.createElement("p");
    p.innerText = "You got a new award! ";
    div.appendChild(p);
    var award = document.createElement("button");
    award.id = awards[points[0]] + "-award";
    award.className = "tiny";
    award.innerText = awards[points[0]].charAt(0).toUpperCase();
    award.onclick = function() {
      points[0]++;
      points[2] = 0;
      localStorage.setItem("points",points.join(":"));
      location.href = "/web/home/index.html";
    }
    div.appendChild(award);
  }
  if ( list.length > 0 ) {
    getItems(function() {
      renderNavbar(renderAll);
    });
  } else if ( ! points[2] ) {
    renderNavbar(Function.prototype);
    document.getElementById("error").innerText = "You have no triggered reminders right now.";
  }
}
