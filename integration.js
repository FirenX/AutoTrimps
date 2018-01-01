function runGameLoop(makeUp, now) {
	try {
		gameLoop(makeUp, now);
	} catch (e) {
		unlockTooltip(); // Override any other tooltips
		tooltip('hide');
		tooltip('Error', null, 'update', e.stack);
		throw(e);
	}
  mainLoop();
}
