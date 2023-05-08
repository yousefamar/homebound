HB.EntityManager = function (scene) {
	this.scene = scene;

	this.tickQueue = new List();
	this.renderQueue = new List();
};

HB.EntityManager.prototype.add = function (entity) {
	('tick' in entity) && this.tickQueue.add(entity);
	('render' in entity) && this.renderQueue.add(entity);
};

HB.EntityManager.prototype.tick = function (delta) {
	for (var i = 0, size = this.tickQueue.size; i < size; i++) {
		var entity = this.tickQueue.poll();
		entity.tick(delta) && this.tickQueue.add(entity);
	}
};

HB.EntityManager.prototype.render = function (ctx) {
	for (var i = 0, size = this.renderQueue.size; i < size; i++) {
		var entity = this.renderQueue.poll();
		entity.render(ctx) && this.renderQueue.add(entity);
	}
};


HB.Entity = function (scene, x, y, r, w, h) {
	this.scene = scene;
	this.x = x;
	this.y = y;
	this.r = r || 0;
	this.w = w || 8;
	this.h = h || 8;
};

/*
HB.Entity.prototype.tick = function(delta) {
	return true;
};

HB.Entity.prototype.render = function(ctx) {
	return true;
};
*/

HB.Entity.prototype.collidesWith = function(x, y, r) {
	if (!('radius' in this))
		return false;

	var xd = Math.abs(this.x - x);
	var yd = Math.abs(this.y - y);
	var rs = this.radius + r;
	if (xd >= rs || yd >= rs)
		return false;

	return xd*xd + yd*yd < rs*rs;
};


HB.Planet = function (scene, x, y, radius) {
	HB.Entity.call(this, scene, x, y);

	this.radius = radius;

	muted = function () {
		return (80 + 80 * Math.random())>>>0;
	};

	this.color = '#' + muted().toString(16) + muted().toString(16) + muted().toString(16);
};

HB.Planet.prototype = Object.create(HB.Entity.prototype);

HB.Planet.prototype.render = function(ctx) {
	ctx.save();

	ctx.translate(this.x, this.y);
	ctx.beginPath();
	ctx.arc(0, 0, this.radius, 0, 2 * Math.PI);
	ctx.fillStyle = this.color;
	ctx.fill();

	ctx.restore();

	return true;
};


HB.Wormhole = function (scene, x, y) {
	HB.Entity.call(this, scene, x, y);

	this.radius = 16;

	this.animTimer = 0;
};

HB.Wormhole.prototype = Object.create(HB.Entity.prototype);

HB.Wormhole.prototype.render = function(ctx) {
	ctx.save();

	ctx.translate(this.x, this.y);
	ctx.beginPath();
	ctx.arc(0, 0, this.radius, 0, 2 * Math.PI);
	gradient = ctx.createRadialGradient(0, 0, 4, 0, 0, 14 + (1 + Math.sin(this.animTimer)));
	gradient.addColorStop(0, 'mintcream');
	gradient.addColorStop(1, 'black');
	ctx.fillStyle = gradient;
	ctx.fill();

	ctx.restore();

	this.animTimer += Math.PI/90;

	return true;
};


HB.Ship = function (scene, x, y, r) {
	HB.Entity.call(this, scene, x, y, r);

	this.initX = this.x;
	this.initY = this.y;
	this.initR = this.r;

	this.radius = 4;

	this.vx = 0;
	this.vy = 0;
	this.thrust = 0;

	Object.defineProperty(this, 'timer', {
		set: function (x) {
			this._timer = x;
			document.getElementById('timer').innerHTML = "Time: " + x;
		},
		get: function () {
			return this._timer;
		}
	});

	this.timer = 0;

	Object.defineProperty(this, 'fuel', {
		set: function (x) {
			this._fuel = x;
			document.getElementById('fuel').innerHTML = "Fuel: " + x;
		},
		get: function () {
			return this._fuel;
		}
	});

	this.fuel = 100;
	this.initFuel = this.fuel;
};

HB.Ship.prototype = Object.create(HB.Entity.prototype);

HB.Ship.prototype.program = function(code) {
	this.commands = {}

	code = code.split('\n');
	var clock = 0;
	for (var i = 0, len = code.length; i < len; i++) {
		var line = code[i].split(' ');
		if (line[0].indexOf('#') === 0) continue;
		switch (line[0]) {
			case '':
				break;
			case 'wait':
				var time = clock + parseInt(line[1], 10);
				if (time === NaN) {
					window.alert("Invalid parameter on line " + (i + 1) + ": " + line[1]);
					return false;
				}
				clock = time;
				break;
			case 'thrust':
			case 'rotate':
				var amount = parseInt(line[1], 10);
				if (amount === NaN) {
					window.alert("Invalid parameter on line " + (i + 1) + ": " + line[1]);
					return false;
				}
				if (!(clock in this.commands))
					this.commands[clock] = [];
				this.commands[clock].push({ command: line[0], amount: amount });
				break;
			default:
				window.alert("Unknown command on line " + (i + 1) + ": " + line[0]);
				return false;
		}
	}

	if (clock > 0) {
		if (!(clock in this.commands))
			this.commands[clock] = [];
		this.commands[clock].push('done');
	}

	return true;
};

HB.Ship.prototype.go = function() {
	this.flying = true;
	this.schedule = JSON.parse(JSON.stringify(this.commands));
};

HB.Ship.prototype.stop = function() {
	this.flying = false;
	this.timer = 0;
	this.x = this.initX;
	this.y = this.initY;
	this.r = this.initR;
	this.vx = 0;
	this.vy = 0;
	this.thrust = 0;
	this.fuel = this.initFuel;
};

HB.Ship.prototype.tick = function(delta) {
	if (!this.flying) return true;

	var nextCmdsAt = null;
	for (time in this.schedule) {
		nextCmdsAt = time;
		break;
	}

	if (nextCmdsAt === null) {
		this.stop();
		document.getElementById('playButton').innerHTML = '▶';
		return true;
	}

	if (nextCmdsAt < (this.timer + 0.5)) {
		var cmds = this.schedule[nextCmdsAt];
		for (var i = 0, len = cmds.length; i < len; i++) {
			var cmd = cmds[i];
			console.log(cmd);
			if (cmd === 'done') break;
			switch (cmd.command) {
				case 'thrust':
					this.thrust = cmd.amount;
					break;
				case 'rotate':
					this.r += cmd.amount;
					break;
				default:
					break;
			}
		}
		delete this.schedule[nextCmdsAt];
	}

	this.thrust = Math.min(this.thrust, this.fuel);
	this.fuel -= this.thrust;

	this.vx += Math.sin(this.r * Math.PI/180) * this.thrust * 0.05;
	this.vy += -Math.cos(this.r * Math.PI/180) * this.thrust * 0.05;

	this.x += this.vx;
	this.y += this.vy;

	// There is no air resistance; we're in space!
	//this.vx *= 0.9;
	//this.vy *= 0.9;

	for (var i = 0, len = this.scene.planets.length; i < len; i++) {
		var planet = this.scene.planets[i];
		if (this.collidesWith(planet.x, planet.y, planet.radius<<4)) {
			if (this.collidesWith(planet.x, planet.y, planet.radius)) {
				console.log('KABOOM!');
				if (window.chrome) HB.audio.explosion.load();
				HB.audio.explosion.play();
				this.stop();
				document.getElementById('playButton').innerHTML = '▶';
				return true;
			}
			var dirX = (planet.x - this.x);
			var dirY = (planet.y - this.y);

			var force = 0.001 * planet.radius / (dirX * dirX + dirY * dirY);

			this.vx += dirX * force;
			this.vy += dirY * force;
		}
	}

	if (this.collidesWith(this.scene.wormhole.x, this.scene.wormhole.y, this.scene.wormhole.radius)) {
		document.getElementById('winScreen').className = 'visible';
		if (window.chrome) HB.audio.warp.load();
		HB.audio.warp.play();
		this.stop();
		document.getElementById('playButton').innerHTML = '▶';
		return true;
	}

	// At 10ms per tick (100 ticks per second)
	this.timer += 10;

	return true;
};

HB.Ship.prototype.render = function(ctx) {
	ctx.save();

	ctx.translate(this.x, this.y);
	ctx.rotate(this.r * Math.PI/180);

	ctx.fillStyle = 'orange';
	ctx.beginPath();
	ctx.moveTo(-3, 3);
	ctx.lineTo(0, Math.min(3 + 5 * this.thrust, 20));
	ctx.lineTo(3, 3);
	ctx.closePath();
	ctx.fill();

	ctx.fillStyle = 'green';
	ctx.beginPath();
	ctx.moveTo(-4, 4);
	ctx.lineTo(-4, 2);
	ctx.lineTo(0, -4);
	ctx.lineTo(4, 2);
	ctx.lineTo(4, 4);
	ctx.lineTo(0, 3);
	ctx.closePath();
	ctx.fill();

	ctx.restore();

	return true;
};
