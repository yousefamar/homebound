var HB = {
	DEBUG: false,

	main: function () {

		var explosion = new Audio();
		explosion.src = 'res/audio/explosion.wav';

		var warp = new Audio();
		warp.src = 'res/audio/warp.wav';

		HB.audio = {
			explosion: explosion,
			warp: warp
		};

		var scene = new HB.SceneRandom();

		var codeButton = document.getElementById('codeButton');
		var playButton = document.getElementById('playButton');
		var editor = document.getElementById('editor');
		var editorOpenedOnce = false;

		codeButton.onclick = function () {
			editorOpenedOnce = true;
			if (editor.className === 'invisible')
				editor.className = 'visibile';
			else
				editor.className = 'invisible';
		};
	
		playButton.onclick = function () {
			if (!scene.ship.flying) {
				if(!editorOpenedOnce) {
					window.alert("Your ship needs instructions to run! Open the script editor to give them ({}).");
					return;
				}
				if(!scene.ship.program(editor.value)) return;
				playButton.innerHTML = '■';
				scene.ship.go();
			} else {
				scene.ship.stop();
				playButton.innerHTML = '▶';
			}
		};

		var canvas = document.getElementById('canvas');

		const TICK_INTERVAL_MS = 1000.0/100.0;

		var lastTick = Date.now();
		function tick () {
			// FIXME: Chrome throttles the interval down to 1s on inactive tabs.
			setTimeout(tick, TICK_INTERVAL_MS);
			
			var now = Date.now();
			scene.tick(now - lastTick);
			lastTick = now;
		}

		var ctx = canvas.getContext('2d');
		ctx.font = '20pt Tahoma';

		function render () {
			requestAnimFrame(render);

			ctx.fillStyle = 'black';
			ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

			scene.render(ctx);
		}

		setTimeout(tick, TICK_INTERVAL_MS);

		window.requestAnimFrame = window.requestAnimationFrame ||
				window.webkitRequestAnimationFrame ||
				window.mozRequestAnimationFrame ||
				function(callback){
					window.setTimeout(callback, 1000/60);
				};
		requestAnimFrame(render);
	}
};
