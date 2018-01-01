oldDate = Date;
Date = function () {
  var currDate = new oldDate();
  return new oldDate(currDate.getTime() * 10);
}

function gameTimeout() {
	if (game.options.menu.pauseGame.enabled) return;
	var now = new Date().getTime();
	//4432
	if ((now - game.global.start - game.global.time) > 3600000){
		checkOfflineProgress();
		game.global.start = now;
		game.global.time = 0;
		game.global.lastOnline = now;
		setTimeout(gameTimeout, (1000 / game.settings.speed));
		return;
	}
	game.global.lastOnline = now;
    var tick = 1000 / game.settings.speed;
    game.global.time += tick;
    var dif = (now - game.global.start) - game.global.time;
    while (dif >= tick) {
        runGameLoop(true, now);
        dif -= tick;
        game.global.time += tick;
		ctrlPressed = false;
    }
    runGameLoop(null, now);
    updateLabels();
    setTimeout(gameTimeout, 1 + (tick - dif) / 10);
}
