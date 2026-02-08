class GameScreen extends AddRemoveUpdate {
  constructor(game, controls, mouse) {
    super();

    this.w = game.w;
    this.h = game.h;
    this.mouse = mouse;
    this.controls = controls;
    this.game = game;

    this.level = 1;
    this.levelData = null;
    this.spawnPos = new Vector();

    this.savedZombies = [];
    this.savedBats = [];
    this.savedPlayerData = null;
    this.loadingFromSave = false;

    this.currentScreen = "game";

    this.loadFile();

    // ----- MAP -----
    const map = new Level(game.w * 3, game.h * 2, this.levelData);
    this.map = map;

    // ----- CONTAINERS -----
    this.arrows = this.add(new AddRemoveUpdate());
    this.zombies = this.add(new AddRemoveUpdate());
    this.bats = this.add(new AddRemoveUpdate());
    this.upgradeNpc = this.add(new AddRemoveUpdate());
    this.spawn = this.add(new AddRemoveUpdate());
    this.fx = this.add(new AddRemoveUpdate());
    this.inventoryItem = this.add(new AddRemoveUpdate());
    this.inventoryDisplay = this.add(new AddRemoveUpdate());
    this.inventoryDisplayBg = this.add(new AddRemoveUpdate());
    this.healthBar = this.add(new AddRemoveUpdate());
    this.xpUI = this.add(new AddRemoveUpdate());

    //visual
    this.shadeLayer = this.add(new AddRemoveUpdate());

    // ----- PLAYER -----
    const items = [
      "sword",
      "shield",
      "instaHeal",
      "dashUp",
      "dash",
      "hammer",
      "axe",
      "wind",
      "bow",
      "slownessBow",
    ];

    this.player = new Player(controls, map, mouse, this, items, (bullet) =>
      this.arrows.add(bullet),
    );

    this.player.pos = this.spawnPos;

    if (this.savedPlayerData) {
      this.player.health = this.savedPlayerData.health;
      this.player.xp = this.savedPlayerData.xp;
    }

    // ----- CAMERA -----
    const camera = this.add(
      new Camera(
        this.player,
        { w: game.w, h: game.h },
        { w: game.w * 3, h: game.h * 2 },
      ),
    );

    this.map = camera.add(map);
    camera.add(this.player);
    camera.add(this.spawn);
    camera.add(this.zombies);
    camera.add(this.bats);
    camera.add(this.upgradeNpc);
    camera.add(this.arrows);
    camera.add(this.fx);
    camera.add(this.inventoryItem);

    this.add(this.healthBar);
    this.add(this.xpUI);
    //above shade
    this.add(this.shadeLayer);
    this.add(this.inventoryDisplayBg);
    this.add(this.inventoryDisplay);

    this.player.camera = camera;
    this.player.heldItemDisplay = this.inventoryItem;

    this.upgradeNpcCharecter = this.upgradeNpc.add(
      new upgradeNpc(
        upgradeNpc1,
        this.map,
        this.player,
        { x: 320, y: 320 },
        this,
      ),
    );
    this.nearUpgradeNpc = false;

    // ----- INVENTORY UI -----
    for (let i = 0; i < items.length; i++) {
      const item = this.inventoryItem.add(
        new Item(itemTextures[i], { x: 0, y: 0 }),
      );
      item.visible = false;
      item.name = items[i];
      item.player = this.player;
    }

    this.shade = this.shadeLayer.add(new shadeLayerCon(shadeTexture));

    this.healthBarRect = this.healthBar.add(
      new Rect(10, 20, { x: 17, y: game.h - 100 }, { fill: "#ff0000ff" }),
    );
    this.healthFlashTime = 0;
    this.healthBarBg = this.healthBar.add(
      new Rect(
        500,
        20,
        { x: 17, y: game.h - 100 },
        { fill: "#ff6363c7", border: "2px black" },
      ),
    );
    this.healthBarBg.w = 500;
    this.healthBarBg.alpha = 0.7;
    this.healthDsiplay = this.healthBar.add(
      new Text("500", {
        font: "20px monospace",
        color: "#rgba(255, 255, 255, 0.78)",
      }),
    );
    this.healthDsiplay.pos = { x: 20, y: game.h - 82 };
    this.xpUI.add(
      new xpDisplay(
        xpTexture,
        { x: game.w - 140, y: game.h - 100 },
        this.player,
        this,
      ),
    );

    for (let i = 0; i < 10; i++) {
      this.inventoryDisplay.add(
        new ItemDisplay(
          itemTextures[i],
          { x: 20 + i * 40, y: game.h - 50 },
          { x: 0, y: 0 },
          mouse,
          this.player,
          i,
          this,
          this.player.itemInfo[this.player.inventory[i]],
        ),
      );

      const bg = this.inventoryDisplayBg.add(
        new Item(
          emptySlotTexture,
          { x: 13 + i * 40, y: game.h - 53 },
          { x: 0, y: 0 },
          38,
        ),
      );
      bg.visible = true;
    }

    this.inventoryDisplay.map((i) => (i.slots = this.inventoryDisplay));

    // ----- UI TEXT -----
    const drawText = (text, pos) => {
      const t = new Text(text, { font: "24pt VT323", fill: "#EEE" });
      t.pos = pos;
      return this.add(t);
    };

    this.score = drawText("", { x: 0, y: 30 });
    this.levelDisplay = drawText("", { x: 0, y: 80 });

    // ----- PARTICLES -----
    this.damageParticles = this.fx.add(new ParticleMaker(50, heart));

    this.levelTimer = 0;

    // ----- ENEMIES -----
    this.restoreEnemies();

    //debug features
    this.debug = false;
  }
  debugOn(status) {
    this.debug = status;
  }

  // ================= SAVE / LOAD =================
  playParticles(type, pos) {
    this.damageParticles.play(pos, this.camera);
  }

  saveFile() {
    const fileName = prompt("File Name:");

    const zombies = [];
    const bats = [];

    this.zombies.map((z) => {
      zombies.push({
        x: z.pos.x,
        y: z.pos.y,
        health: z.health,
        speed: z.speed,
      });
    });

    this.bats.map((b) => {
      bats.push({
        x: b.pos.x,
        y: b.pos.y,
        health: b.health,
        speed: b.speed,
      });
    });

    const saveData = {
      levelData: this.map.levelData,
      player: {
        x: this.player.pos.x,
        y: this.player.pos.y,
        health: this.player.health,
        xp: this.player.xp,
      },
      zombies,
      bats,
    };

    localStorage.setItem(fileName, JSON.stringify(saveData));
  }

  loadFile() {
    const fileName = prompt("File Name:");
    const raw = localStorage.getItem(fileName);

    if (!raw) {
      this.spawnPos = new Vector(250, 350);
      return;
    }

    const data = JSON.parse(raw);

    this.loadingFromSave = true;
    this.levelData = data.levelData;
    this.spawnPos = new Vector(data.player.x, data.player.y);
    this.savedPlayerData = data.player;
    this.savedZombies = data.zombies || [];
    this.savedBats = data.bats || [];
  }

  // ================= ENEMIES =================

  restoreEnemies() {
    if (!this.loadingFromSave) {
      this.newLevel(this.level);
      return;
    }

    this.savedZombies.forEach((e) => {
      const z = this.zombies.add(
        new Zombie(
          zombieTexture,
          this.map,
          this.player,
          new Vector(e.x, e.y),
          this,
        ),
      );
      z.health = e.health;
      z.speed = e.speed;
    });

    this.savedBats.forEach((e) => {
      const b = this.bats.add(
        new Bat(batTexture, this.map, this.player, new Vector(e.x, e.y), this),
      );
      b.health = e.health;
      b.speed = e.speed;
    });
  }

  newLevel(level) {
    this.level = level;
    this.levelTimer = 0;

    for (let i = 0; i < level * 5; i++) {
      this.zombies.add(
        new Zombie(
          zombieTexture,
          this.map,
          this.player,
          this.map.findFreeSpot("zombie_spawn"),
          this,
        ),
      );
    }

    for (let i = 0; i < level * 3; i++) {
      this.bats.add(
        new Bat(
          batTexture,
          this.map,
          this.player,
          this.map.findFreeSpot(),
          this,
        ),
      );
    }
  }

  // ================= UPDATE =================

  update(dt, t) {
    super.update(dt, t);

    if (this.debug) {
      this.score.text =
        `Health: ${this.player.health}  XP: ${this.player.xp}` +
        "speedLevel: " +
        this.player.upgrades.speed.level.toString();
      this.levelDisplay.text =
        `Level: ${this.level}  Zombies: ${this.zombies.children.length}` +
        "  Time spent: " +
        this.levelTimer +
        "   Debug: " +
        this.debug;
    } else {
      this.score.text = ``;
      this.levelDisplay.text = ``;
    }

    this.levelTimer += dt;
    this.healthDsiplay.text = this.player.health;

    this.healthFlashTime -= dt;

    if (this.healthFlashTime < 0) {
      this.healthBarRect.style = { fill: "#ff0000ff" };
    }

    this.healthBarRect.w = this.player.health;

    this.inventoryItem.map((i) => {
      if (this.player.held === i.name) {
        i.visible = true;
        const d = this.player.facing === "right" ? 25 : -25;
        i.pos.x = this.player.pos.x + d;
        i.pos.y = this.player.pos.y - 2;
        i.frame.x = this.player.facing === "right" ? 0 : 1;
      } else {
        i.visible = false;
      }
    });

    if (!this.loadingFromSave && this.zombies.children.length === 0) {
      this.newLevel(this.level + 1);
    }

    if (this.controls.action) {
      this.saveFile();
    }

    this.arrows.map((a) => {
      // hit wall / ground
      const tile = this.map.checkGround(a.pos);
      if (tile && tile.frame && tile.frame.walkable === false) {
        a.dead = true;
        return;
      }

      // hit zombies
      this.zombies.map((z) => {
        if (distanceEntity(a, z) < 32) {
          if (a.properties === 'slownessBow'){
            const damage = this.player.itemInfo.slownessBow.damage;
          }else{
            const damage = this.player.itemInfo.bow.damage;
          }
          z.takeDamage(damage, true);
          a.dead = true;

          if (a.properties === "slowness") {
            z.speed = 5;
          }
        }
      });

      // hit bats
      this.bats.map((b) => {
        if (distanceEntity(a, b) < 32) {
          b.takeDamage(25, true);
          a.dead = true;

          if (a.properties === "slowness") {
            b.speed = 50;
          }
        }
      });
    });

    if (this.controls.p) {
      this.add(
        new dialogScreen(
          this.controls,
          () => console.log("closed"),
          this.game,
          1,
          "settings",
          this,
          this.mouse,
        ),
      );
    }
  }
}
