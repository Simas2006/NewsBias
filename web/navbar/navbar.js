function renderNavbar() {
  var navbar = document.getElementById("navbar");
  var row = document.createElement("tr");
  var col1 = document.createElement("td");
  col1.className = "navbar-item navbar-item-small aligncenter";
  col1.onclick = _ => location.href = "/web/home/index.html";
  var span = document.createElement("span");
  span.innerText = "NewsBias";
  col1.appendChild(span);
  row.appendChild(col1);
  var col2 = document.createElement("td");
  col2.className = "navbar-item navbar-item-large aligncenter";
  var input = document.createElement("input");
  input.id = "navbar-search";
  input.placeholder = "Search for something... 🔎";
  input.onkeyup = function(event) {
    if ( event.key == "Enter" ) {
      location.href = "/web/search/index.html?" + this.value;
    }
  }
  col2.appendChild(input);
  row.appendChild(col2);
  var col3 = document.createElement("td");
  col3.className = "navbar-item navbar-item-small aligncenter";
  col3.onclick = _ => location.href = "/web/home/remind/index.html";
  var span = document.createElement("span");
  span.innerHTML = "&#x1f514;";
  col3.appendChild(span);
  row.appendChild(col3);
  var col4 = document.createElement("td");
  col4.className = "navbar-item navbar-item-small aligncenter";
  col4.onclick = _ => location.href = "/web/create/index.html";
  var span = document.createElement("span");
  span.innerHTML = "+";
  col4.appendChild(span);
  row.appendChild(col4);
  navbar.appendChild(row);
  if ( ! localStorage.getItem("reminders") ) localStorage.setItem("reminders","");
  var reminders = localStorage.getItem("reminders").split(",").map(item => item.split(":"));
  reminders = reminders.filter(item => parseInt(item[1]) < new Date().getTime());
  if ( reminders.length > 0 ) {
    var badge = document.createElement("p");
    badge.className = "navbar-badge";
    document.body.appendChild(badge);
    var position = col3.getBoundingClientRect();
    var bodyPosition = document.body.getBoundingClientRect();
    badge.style.left = (position.left - bodyPosition.left + position.width * 0.55) + "px";
    badge.style.top = (position.top - bodyPosition.top - position.height * 0.05) + "px";
    badge.innerText = reminders.length;
    badge.style.display = "block";
  }
}

function renderBarGraphic(element,rating) {
  function animateFrame() {
    ctx.fillStyle = "white";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.lineWidth = 15;
    ctx.strokeStyle = "blue";
    ctx.beginPath();
    ctx.arc(canvas.width / 2,canvas.height / 2,canvas.width / 2 - 10,1.0 * Math.PI,1.2 * Math.PI,false);
    ctx.stroke();
    ctx.strokeStyle = "#9999ff";
    ctx.beginPath();
    ctx.arc(canvas.width / 2,canvas.height / 2,canvas.width / 2 - 10,1.2 * Math.PI,1.4 * Math.PI,false);
    ctx.stroke();
    ctx.strokeStyle = "#999999";
    ctx.beginPath();
    ctx.arc(canvas.width / 2,canvas.height / 2,canvas.width / 2 - 10,1.4 * Math.PI,1.6 * Math.PI,false);
    ctx.stroke();
    ctx.strokeStyle = "#ff9999";
    ctx.beginPath();
    ctx.arc(canvas.width / 2,canvas.height / 2,canvas.width / 2 - 10,1.6 * Math.PI,1.8 * Math.PI,false);
    ctx.stroke();
    ctx.strokeStyle = "red";
    ctx.beginPath();
    ctx.arc(canvas.width / 2,canvas.height / 2,canvas.width / 2 - 10,1.8 * Math.PI,2.0 * Math.PI,false);
    ctx.stroke();
    ctx.strokeStyle = "black";
    var activeCount = Math.min(frameCount,Math.floor(Math.abs(rating)));
    var angle = (activeCount * Math.sign(rating) + 100) / 200 + 1;
    var xval = Math.cos(angle * Math.PI) * (canvas.width / 2 - 3) + (canvas.width / 2);
    var yval = Math.sin(angle * Math.PI) * (canvas.width / 2 - 3) + (canvas.height / 2);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2,canvas.height / 2);
    ctx.lineTo(xval,yval);
    ctx.stroke();
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(canvas.width / 2,canvas.height / 2,15,0,2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = ["blue","black","red"][Math.sign(rating) + 1];
    ctx.textAlign = "center";
    ctx.font = "80px Arial";
    ctx.fillText(activeCount + "%",canvas.width / 2,canvas.height * 0.75);
    frameCount++;
    if ( frameCount > 100 ) clearInterval(graphicInterval);
  }
  while ( element.firstChild ) {
    element.removeChild(element.firstChild);
  }
  var canvas = document.createElement("canvas");
  canvas.height = canvas.width;
  element.appendChild(canvas);
  var ctx = canvas.getContext("2d");
  var frameCount = 0;
  var graphicInterval = setInterval(animateFrame,25);
 }
