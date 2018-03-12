var searchData;

function simpleAJAX(url,callback) {
  var req = new XMLHttpRequest();
  req.open("GET",url);
  req.onload = function() {
    callback(this.responseText);
  }
  req.send();
}

function renderAll() {
  document.getElementById("title").innerText = `${searchData.length} result${searchData.length != 1 ? "s": ""} for "${decodeURIComponent(location.search.slice(1))}"`;
  var table = document.getElementById("results");
  for ( var i = 0; i < searchData.length; i++ ) {
    var row = document.createElement("tr");
    var graphic = document.createElement("td");
    // draw graphic
    row.appendChild(graphic);
    var col = document.createElement("td");
    var title = document.createElement("a");
    title.innerText = `${searchData[i].title} - ${Math.abs(searchData[i].rating)}% Biased`;
    var opinion = 1;
    if ( searchData[i].rating < 0 ) {
      title.className = "left";
      opinion = 0;
    } else if ( searchData[i].rating > 0 ) {
      title.className = "right";
      opinion = 2;
    } else {
      title.className = "center";
    }
    title.href = `/web/article/index.html?${searchData[i].id}`
    col.appendChild(title);
    var comment = document.createElement("textarea");
    var selected = searchData[i].comments.filter(item => item.votes > 0 && item.opinion == opinion).sort((a,b) => b.votes - a.votes);
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
    col.className = "wide";
    row.appendChild(col);
    table.appendChild(row);
  }
}

window.onload = function() {
  simpleAJAX(`/api/search${location.search}`,function(data) {
    searchData = JSON.parse(data);
    renderAll();
    renderNavbar();
    document.getElementById("navbar-search").value = decodeURIComponent(location.search.slice(1));
  });
}
