/* Sunrise and sunset worked out on the page (NOAA-style formulae), no network.
   Works in the browser (window.Solar) and in Node (module.exports). */
(function (root) {
  var RAD = Math.PI / 180;

  function dayOfYearUTC(y, m, d) {
    return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 0)) / 86400000);
  }

  // Returns { sunrise, sunset } as minutes after 00:00 UTC, plus dayLength in minutes.
  // lat north positive, lon east positive (Limerick is about -8.63).
  function sunTimes(y, m, d, lat, lon) {
    var n = dayOfYearUTC(y, m, d);
    var g = (2 * Math.PI / 365) * (n - 1 + (12 - 12) / 24);
    var eqTime = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g)
      - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
    var decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g)
      - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g)
      - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
    var cosH = Math.cos(90.833 * RAD) / (Math.cos(lat * RAD) * Math.cos(decl))
      - Math.tan(lat * RAD) * Math.tan(decl);
    if (cosH > 1) return { sunrise: null, sunset: null, dayLength: 0 };
    if (cosH < -1) return { sunrise: null, sunset: null, dayLength: 1440 };
    var ha = Math.acos(cosH) / RAD;
    var sunrise = 720 - 4 * (lon + ha) - eqTime;
    var sunset = 720 - 4 * (lon - ha) - eqTime;
    return { sunrise: sunrise, sunset: sunset, dayLength: sunset - sunrise };
  }

  // Difference in seconds between today's and yesterday's day length.
  function dayLengthChangeSeconds(y, m, d, lat, lon) {
    var today = sunTimes(y, m, d, lat, lon).dayLength;
    var prev = new Date(Date.UTC(y, m - 1, d - 1));
    var yest = sunTimes(prev.getUTCFullYear(), prev.getUTCMonth() + 1, prev.getUTCDate(), lat, lon).dayLength;
    return Math.round((today - yest) * 60);
  }

  var api = { sunTimes: sunTimes, dayLengthChangeSeconds: dayLengthChangeSeconds, dayOfYearUTC: dayOfYearUTC };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Solar = api;
})(typeof window !== 'undefined' ? window : this);
