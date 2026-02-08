class xpDisplay extends AddRemoveUpdate {
  constructor(texture, pos = { x: 0, y: 0 }, player, parent) {
    super();
    this.pos = pos;
    this.parent = parent;

    this.parent.add(new PickUp(texture, pos, "none"));

    this.player = player;
    this.displayText = this.parent.add(
      new Text("Xp", { font: "30px monospace", fill: "white" }),
    );
    this.displayText.pos = { x: pos.x + 20, y: pos.y + 40 };

    console.log(this);
  }
  update(dt) {
    this.displayText.text = this.player.xp;
    if (this.player.xp < 1) {
      this.displayText.text = "0";
    }
  }
}
