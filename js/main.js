// Only show welcome screen on first launch
if(localStorage.getItem('visited') !== '1') {
  new bootstrap.Modal(document.getElementById('welcome')).show();
}
localStorage.setItem("visited", 1);

// initialize map
const map = L.map("map", {
  zoomControl: false,
  attributionControl: false,
  minZoom: 2,
  maxZoom: 6,
  maxBounds: [[0,0],[-192, 128]],
  crs: L.CRS.Simple
}).setView([-96, 64], 2);
L.control.zoom({position: "topleft"}).addTo(map);

var currentMarker = null;
const markerToast = new bootstrap.Toast(document.getElementById('markerToast'));

function buildIcon(iconClass, badge) {
  const layerSpan = document.createElement('span');
  layerSpan.className = 'fa-layers fa-fw';
  {
    const iconI = document.createElement('i');
    iconI.className = `fas ${iconClass[0]}`;
    layerSpan.appendChild(iconI);
  }
  {
    const badgeSpan = document.createElement('span');
    badgeSpan.className = 'fa-layers-text fa-inverse';
    badgeSpan.innerText = badge;
    badgeSpan.dataset.faTransform = iconClass[1];
    layerSpan.appendChild(badgeSpan);
  }
  return L.divIcon({
    html: layerSpan,
    className: 'fd-icon fa-3x',
    iconSize: [64, 64],
    iconAnchor: [32, 32],
  })
}

function fMarker(latlong, name, iconClass, postal, internalCat, internalID) {
  const m = L.marker(latlong, {
    icon: buildIcon(iconClass, internalID),
    title: name,
    state: true,
    postal,
    internalCat,
    internalID
  });
  m.addEventListener('click', () => {
    zoomToMarker(`${internalCat}-${internalID}`);
    updateHash();
  });
  return m;
}

// Load world tile map, as well as markers.
const layers = {
  world: L.tileLayer("tiles/{z}/{x}/{y}.png", {
    minZoom: 2,
    maxZoom: 6,
    tms: true,
    zIndex: 0,
    state: true,
  }).addTo(map),
  stats: L.layerGroup(
    markers.stations.map((m, i) => fMarker(m[0], m[1], ['fa-fire-extinguisher text-danger', 'shrink-8 down-3 left-1'], m[3], 'stats', m[2]))
  ).addTo(map),
  hosps: L.layerGroup(
    markers.hospitals.map((m, i) => fMarker(m[0], m[1], ['fa-hospital text-primary', 'shrink-8'], m[3], 'hosps', m[2]))
  ).addTo(map),
};

// Add stations and hospitals to menu as well
function buildListMenu(list, root, catName) {
  list.forEach((m, i) => {
    const liEl = document.createElement("li");
    {
      const aEl = document.createElement("a");
      aEl.className = "dropdown-item";
      aEl.dataset.marker = `${catName}-${m[2]}`;
      aEl.appendChild(document.createTextNode(m[1] + " "));
      {
        const badgeEl = document.createElement("span");
        badgeEl.className = "badge bg-secondary";
        badgeEl.innerText = m[3];
        aEl.appendChild(badgeEl);
      }
      liEl.appendChild(aEl);
    }
    root.appendChild(liEl);
  });
}
buildListMenu(markers.stations, document.getElementById('stats-list'), 'stats');
buildListMenu(markers.hospitals, document.getElementById('hosps-list'), 'hosps');

// For debugging
map.addEventListener('click', event => {
  console.log([event.latlng.lat, event.latlng.lng]);
});

function setLayer(name, state) {
  if(layers[name] == null || layers[name].state == state)
    return false;

  if(state)
    layers[name].addTo(map);
  else
    layers[name].remove();

  layers[name].options.state = state;

  return true;
}

function getLayer(name) {
  return layers[name].options.state;
}

function updateHash() {
  // generate hash
  var hash = "#l";
  var allLayers = true;
  for(var key in layers) {
    if(getLayer(key)) {
      hash += "-" + key;
    } else {
      allLayers = false;
    }
  }
  if(allLayers)
    hash = "";

  if(currentMarker) {
    hash += hash.length > 0 ? "+" : "#";

    hash += `m-${currentMarker.options.internalCat}-${currentMarker.options.internalID}`;
  }

  // push url state
  if(hash != window.location.hash) {
    window.history.pushState(hash, hash, window.location.pathname + hash);
  }
}

// fn to handle layer toggling
function updateMap(layer, btn, state) {
  if(!setLayer(layer, state))
    return;

  // update menu icons
  if(!btn) {
    btn = document.querySelector("[data-layer="+layer+"]");
  }
  if(btn) {
    const iconClasses = btn.querySelector(".fas,[data-prefix=fas]").classList;
    if(state) {
      iconClasses.remove("fa-eye-slash");
      iconClasses.add("fa-eye");
    } else {
      iconClasses.remove("fa-eye");
      iconClasses.add("fa-eye-slash");
    }
  }
}

// Zoom over to a marker: used in
function zoomToMarker(markerHash, btn) {

  // clear old checkbox
  if(currentMarker) {
    const oldBtn = document.querySelector(`[data-marker=${currentMarker.options.internalCat}-${currentMarker.options.internalID}]`);
    if(oldBtn) {
      const iconClasses = oldBtn.classList;
      iconClasses.remove("active");
    }
  }

  // Actually move camera
  {
    const markerInfo = markerHash.split("-");

    try {
      const marker = layers[markerInfo[0]].getLayers().find(m => m.options.internalID == markerInfo[1]);
      if(marker) {
        currentMarker = marker;
        map.setView(marker.getLatLng(), 6);

        // Toast while we have the real marker info
        document.getElementById('markerToastContent').innerText = `${marker.options.title} @ Postal ${marker.options.postal}`;
        markerToast.show();
      }
    } catch(exc) {
    }
  }

  // update menu icons
  if(!btn) {
    btn = document.querySelector("[data-marker="+markerHash+"]");
  }
  if(btn) {
    const iconClasses = btn.classList;
    iconClasses.add("active");
  }
}

////////////////////
// set functionality on maps
document.querySelectorAll("#layer-list>li>a").forEach(a => a.addEventListener("click", function() {
  // toggle the layer
  updateMap(this.dataset.layer, this, !getLayer(this.dataset.layer));
  updateHash();
}));
document.querySelectorAll("#stats-list>li>a,#hosps-list>li>a").forEach(a => a.addEventListener("click", function() {
  // select the marker
  zoomToMarker(this.dataset.marker, this);
  updateHash();
}));

///////////////
// filter as requested
function setFilter(hash, cxt) {
  const hashes = (hash != null && hash.length >= 1) ? hash.substr(1).split('+') : [];

  function grabHashPart(tag) {
    return hashes.find(h => h.length >= tag.length && h.substr(0, tag.length) == tag)?.substr(tag.length);
  }

  const layerHash = grabHashPart('l');
  const markerHash = grabHashPart('m-');

  if(layerHash) {
    const hashSet = layerHash.split("-");

    for(key in layers) {
      updateMap(key, null, hashSet.some(a => a == key));
    }
  } else {
    for(key in layers) {
      updateMap(key, null, true);
    }
  }

  if(markerHash) {
    zoomToMarker(markerHash);
  }
}
// load from url initially
setFilter(window.location.hash, 1);
// and also from pops
window.addEventListener('popstate', event => setFilter(event.state, 2));
