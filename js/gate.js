/* Phones do not run the web reader. Send them to the App Store gate. */
(function () {
  if (/get-app\.html(?:$|[?#])/.test(location.pathname + location.search)) return;
  if (/[?&]desk=1(?:&|$)/.test(location.search)) return;
  var phone = window.matchMedia("(max-width: 760px), (orientation: landscape) and (max-height: 520px)").matches
    || /iPhone|iPod|Android.+Mobile/i.test(navigator.userAgent);
  if (!phone) return;
  var dest = "get-app.html";
  var depth = (location.pathname.match(/\//g) || []).length;
  if (location.pathname.indexOf("/archive/") !== -1 || location.pathname.indexOf("/ios/") !== -1) {
    dest = "../get-app.html";
  }
  location.replace(dest);
})();
