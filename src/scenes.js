HB.Scene = function() {
	this.entityManager = new HB.EntityManager(this);
};

HB.Scene.prototype.add = function (entity) {
	this.entityManager.add(entity);
};

HB.Scene.prototype.tick = function (delta) {
	this.entityManager.tick(delta);
};

HB.Scene.prototype.render = function (ctx) {
	this.entityManager.render(ctx);
};

HB.SceneRandom = function(seed) {
	HB.Scene.call(this);

	this.seed = seed || (Math.random() * 100000);
	console.log(this.seed);

	this.add(this.ship = new HB.Ship(this, 16, 434));
	this.add(this.wormhole = new HB.Wormhole(this, 776, 24));

	this.planets = [];

	for (var y = 0; y < 450; y++) {
		for (var x = 0; x < 800; x++) {
			var rand = this.noise(this.seed, x, y);
			rand *= 10000;

			if (rand < 1) {
				var planet = new HB.Planet(this, x, y, (0.1 + rand) * 10);
				this.planets.push(planet);
				this.add(planet);
			}
		}
	}
};

HB.SceneRandom.prototype = Object.create(HB.Scene.prototype);
HB.SceneRandom.prototype.superClass = HB.Scene.prototype;

HB.SceneRandom.prototype.noise = function (seed, x, y) {
	var n = x * 89 + y * 4173 + seed * 110133;
	n = (n >> 13) ^ n;
	return ((n * (n * n * 60493 + 19990303) + 1376312589) % 0x7FFFFFFF) / 2147483648.0;
	//return ((seed*717815713 ^ x* 862079717 ^ y*809893709 ^ z*743349007)&0x3FFFFFFF)/536870911 - 1;
}
