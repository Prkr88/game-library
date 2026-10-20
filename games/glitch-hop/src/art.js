// PNG art loader. Files in assets/ (owner-supplied or pre-generated); every draw helper falls back to
// the shape-drawn visuals in main.js while an image is missing or not yet decoded.
(function () {
  var NAMES = ['tile-stone', 'tile-crumble', 'tile-phase-a', 'tile-phase-b', 'tile-belt-right', 'tile-ice',
    'wind-up', 'wind-down', 'spike', 'spring', 'coin', 'checkpoint', 'portal', 'saw',
    'player-idle-1', 'player-idle-2', 'player-run-1', 'player-run-2', 'player-run-3', 'player-run-4',
    'player-jump', 'player-fall', 'player-wall', 'player-death-1', 'player-death-2', 'player-death-3',
    'bg-far', 'bg-mid'];
  var img = {};
  NAMES.forEach(function (n) {
    var i = new Image();
    i.onload = function () { img[n] = i; };
    i.src = 'assets/' + n + '.png';
  });
  // Frame pick for the player from simulation state (pure, unit-testable).
  function playerFrame(s, clock) {
    if (s.dead) return null;
    if (!s.ground && s.wall !== 0 && s.vy > 0) return 'player-wall';
    if (!s.ground) return s.vy < 0 ? 'player-jump' : 'player-fall';
    if (Math.abs(s.vx) > 20) return 'player-run-' + (1 + Math.floor(clock * 12) % 4);
    return 'player-idle-' + (1 + Math.floor(clock * 2.5) % 2);
  }
  function deathFrame(elapsed) { return 'player-death-' + (1 + Math.min(2, Math.floor(elapsed / 0.15))); }
  window.GH_ART = { img: img, names: NAMES, playerFrame: playerFrame, deathFrame: deathFrame };
})();
