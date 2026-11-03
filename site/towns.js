/* A hand-made list of Irish towns with approximate coordinates (degrees, north and east positive).
   No third-party source: these are plain geographical facts, rounded to two decimals. */
(function (root) {
  var TOWNS = [
    { id: 'limerick', name: 'Limerick', lat: 52.66, lon: -8.63 },
    { id: 'dublin', name: 'Dublin', lat: 53.35, lon: -6.26 },
    { id: 'cork', name: 'Cork', lat: 51.90, lon: -8.47 },
    { id: 'galway', name: 'Galway', lat: 53.27, lon: -9.05 },
    { id: 'waterford', name: 'Waterford', lat: 52.26, lon: -7.11 },
    { id: 'belfast', name: 'Belfast', lat: 54.60, lon: -5.93 },
    { id: 'derry', name: 'Derry', lat: 54.99, lon: -7.32 },
    { id: 'letterkenny', name: 'Letterkenny', lat: 54.95, lon: -7.73 },
    { id: 'sligo', name: 'Sligo', lat: 54.27, lon: -8.47 },
    { id: 'castlebar', name: 'Castlebar', lat: 53.85, lon: -9.30 },
    { id: 'ennis', name: 'Ennis', lat: 52.84, lon: -8.99 },
    { id: 'tralee', name: 'Tralee', lat: 52.27, lon: -9.70 },
    { id: 'killarney', name: 'Killarney', lat: 52.06, lon: -9.50 },
    { id: 'athlone', name: 'Athlone', lat: 53.42, lon: -7.94 },
    { id: 'mullingar', name: 'Mullingar', lat: 53.53, lon: -7.34 },
    { id: 'dundalk', name: 'Dundalk', lat: 54.00, lon: -6.40 },
    { id: 'kilkenny', name: 'Kilkenny', lat: 52.65, lon: -7.25 },
    { id: 'wexford', name: 'Wexford', lat: 52.34, lon: -6.46 },
    { id: 'clonmel', name: 'Clonmel', lat: 52.36, lon: -7.70 },
    { id: 'cavan', name: 'Cavan', lat: 53.99, lon: -7.36 },
    { id: 'monaghan', name: 'Monaghan', lat: 54.25, lon: -6.97 },
    { id: 'roscommon', name: 'Roscommon', lat: 53.63, lon: -8.19 },
    { id: 'portlaoise', name: 'Portlaoise', lat: 53.03, lon: -7.30 },
    { id: 'carlow', name: 'Carlow', lat: 52.84, lon: -6.93 },
    { id: 'navan', name: 'Navan', lat: 53.65, lon: -6.68 },
    { id: 'wicklow', name: 'Wicklow', lat: 52.98, lon: -6.04 },
    { id: 'longford', name: 'Longford', lat: 53.73, lon: -7.80 }
  ];
  if (typeof module !== 'undefined' && module.exports) module.exports = TOWNS;
  else root.TOWNS = TOWNS;
})(typeof window !== 'undefined' ? window : this);
