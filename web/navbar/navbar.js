function renderNavbar() {
  var navbar = document.getElementById("navbar");
  var row = document.createElement("tr");
  var col1 = document.createElement("td");
  col1.className = "navbar-item navbar-item-small aligncenter";
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
  var span = document.createElement("span");
  span.innerHTML = "&#x1f514;";
  col3.appendChild(span);
  row.appendChild(col3);
  var col4 = document.createElement("td");
  col4.className = "navbar-item navbar-item-small aligncenter";
  var span = document.createElement("span");
  span.innerHTML = "+";
  col4.appendChild(span);
  row.appendChild(col4);
  navbar.appendChild(row);
}
