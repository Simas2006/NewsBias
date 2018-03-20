var searchData;

function renderAll() {
  var qs = location.search.slice(1).split(",");
  document.getElementById("title").innerText = `${searchData.length} result${searchData.length != 1 ? "s": ""} for "${decodeURIComponent(qs.slice(0,-1).join(","))}"`;
  document.getElementById("type").value = qs[qs.length - 1];
  var table = document.getElementById("results");
  for ( var i = 0; i < searchData.length; i++ ) {
    var row = document.createElement("tr");
    var graphic = document.createElement("td");
    renderBarGraphic(graphic,searchData[i].rating);
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

function changeType(type) {
  var qs = location.search.split(",");
  qs[qs.length - 1] = type;
  location.search = qs.join(",");
}

window.onload = function() {
  simpleAJAX(`/api/search${location.search}`,function(data) {
    searchData = JSON.parse(data);
    renderAll();
    renderNavbar();
    incrementAwardPoints(0.1);
    document.getElementById("navbar-search").value = decodeURIComponent(location.search.slice(1).split(",").slice(0,-1).join(","));
  });
}
