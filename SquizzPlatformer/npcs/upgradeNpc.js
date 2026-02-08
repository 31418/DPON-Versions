class upgradeNpc extends TileSprite {
  constructor(texture, map, player, pos, game) {
    super(texture, 32, 32);

    this.map = map;
    this.player = player;
    this.pos.x = pos.x;
    this.pos.y = pos.y;

    this.game = game;

    this.hitBox = {
      x: 8,
      y: 8,
      w: 24,
      h: 24,
    };

    this.screen = "none";
  }
  update(dt, t) {
    super.update(dt, t);

    if (distanceEntity(this, this.player) < 150) {
      this.game.nearUpgradeNpc = true;
    } else {
      this.game.nearUpgradeNpc = false;
    }
    if (
      this.game.nearUpgradeNpc &&
      this.game.controls.r &&
      this.screen === "none"
    ) {
      this.screen = this.game.add(
        new dialogScreen(
          this.game.controls,
          () => console.log("closed"),
          this.game.game,
          1,
          "upgrades",
          this.game,
          this.game.mouse,
        ),
      );
    }
  }
}
