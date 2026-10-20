(function () {
  if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('./sw.js').catch(function () {});
  });
}());
