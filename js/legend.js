// Fill in marker info

function addRow(to, name, badgeText, postal, color) {
  const li = document.createElement('li');
  {
    const badgeContainer = document.createElement('span');
    badgeContainer.className = 'badge-container';
    {
      const badge = document.createElement('span');
      badge.className = `badge ${color}`;
      badge.innerText = badgeText;
      badgeContainer.appendChild(badge);
    }
    li.appendChild(badgeContainer);
  }
  li.appendChild(document.createTextNode(` ${name}`));
  {
    const dots = document.createElement('span');
    dots.className = 'dotted';
    li.appendChild(dots);
  }
  li.appendChild(document.createTextNode(postal));
  to.appendChild(li);
}

const statsLegend = document.getElementById('stats_legend');
const hospsLegend = document.getElementById('hosps_legend');

markers.stations.forEach(station => {
  addRow(statsLegend, station[1], station[2], station[3], 'bg-danger');
});

markers.hospitals.forEach(hospital => {
  addRow(hospsLegend, hospital[1], hospital[2], hospital[3], 'bg-primary');
});
