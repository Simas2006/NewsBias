function loadGraphics() {
  document.getElementById("link").href = "/web/article/index.html" + location.search;
  simpleAJAX("/api/info" + location.search,function(data) {
    data = JSON.parse(data);
    renderBarGraphic(document.getElementById("graphic"),data.votes.rating);
  });
  loadFooter();
  console.log(window.innerWidth,window.innerHeight);
}

function loadFooter() {
  var footer = document.getElementById("navbar-footer");
  var row = document.createElement("tr");
  var col = document.createElement("td");
  col.className = "navbar-item navbar-item-small aligncenter";
  col.onclick = _ => window.open(`/web/home/index.html`);
  var img = document.createElement("img");
  img.src = "/web/navbar/icon.png";
  img.width = "30";
  img.height = "30";
  col.appendChild(img);
  row.appendChild(col);
  var col = document.createElement("td");
  col.className = "navbar-item navbar-item-small aligncenter";
  col.onclick = _ => window.open(`https://github.com/Simas2006/NewsBias/blob/master/wiki/About.md`);
  var span = document.createElement("span");
  span.innerText = "About";
  col.appendChild(span);
  row.appendChild(col);
  var col = document.createElement("td");
  col.className = "navbar-item navbar-item-small aligncenter";
  col.onclick = _ => window.open(`https://github.com/Simas2006/NewsBias/blob/master/wiki/Copyright.md`);
  var span = document.createElement("span");
  span.innerText = "Copyright";
  col.appendChild(span);
  row.appendChild(col);
  footer.appendChild(row);
}

window.onload = loadGraphics;
