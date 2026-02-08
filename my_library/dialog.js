class dialogScreen extends AddRemoveUpdate {
  constructor(
    controls,
    onClose,
    game,
    slowdown,
    dialogType,
    parent,
    mouse,
    item,
  ) {
    super();
    this.onClose = onClose;
    this.parent = parent;
    this.controls = controls;
    this.dialogType = dialogType;
    game.speed = slowdown;
    this.game = game;
    this.mouse = mouse;
    this.item = item;

    this.itemSelected = "none";

    this.parent.currentScreen = "upgrades";
    this.parent.shade.alpha = 0.4;

    if (this.dialogType === "itemUpgrade") {
      const bg = this.add(
        new Rect(750, 250, { x: 800, y: 400 }, { fill: "rgb(192, 186, 186)" }),
      );
      bg.pos = { x: (game.w - 750) / 2, y: (game.h - 250) / 2 };
    } else {
      const bg = this.add(
        new Rect(800, 550, { x: 800, y: 550 }, { fill: "rgb(242, 235, 235)" }),
      );
      bg.pos = { x: (game.w - 800) / 2, y: (game.h - 650) / 2 };
    }

    this.buttons = [];

    this.upgradeLevels = [];

    if (this.dialogType === "upgrades") {
      this.instruction = this.add(
        new PickUp(
          instructionTextureUpgrade,
          { x: 5, y: this.game.h - 65 },
          "none",
        ),
      );
    }

    // ---------- helpers ----------

    const createOption = (text, pos, yEffect, nEffect) => {
      const txt = this.add(new Text(text, { font: "10px monospace" }));
      txt.pos = { x: pos.x, y: pos.y + 10 };

      this.add(new Rect(32, 32, { x: pos.x + 200, y: pos.y }));
      this.add(new Rect(32, 32, { x: pos.x + 260, y: pos.y }));

      this.buttons.push({
        pos: { x: pos.x + 200, y: pos.y },
        w: 32,
        h: 32,
        type: "yes",
        effect: yEffect,
      });

      this.buttons.push({
        pos: { x: pos.x + 260, y: pos.y },
        w: 32,
        h: 32,
        type: "no",
        effect: nEffect,
      });
    };

    const createUpgrade = (upgrade, pos) => {
      const txt = this.add(
        new Text(upgrade.name.toUpperCase(), { font: "20px monospace" }),
      );
      txt.pos = { x: pos.x, y: pos.y + 10 };

      const levels = this.add(
        new Text(upgrade.level.toString(), { font: "20px monospace" }),
      );
      levels.pos = { x: pos.x + 300, y: pos.y + 10 };

      const cost = this.add(
        new Text(upgrade.cost.toString(), { font: "20px monospace" }),
      );
      cost.pos = { x: pos.x + 400, y: pos.y + 10 };

      this.upgradeLevels.push({
        levelText: levels,
        costText: cost,
        upgrade: upgrade.name,
      });

      this.add(new Rect(32, 32, { x: pos.x + 200, y: pos.y - 15 }));

      this.buttons.push({
        pos: { x: pos.x + 200, y: pos.y - 15 },
        w: 32,
        h: 32,
        type: "buy",
        effect: () => upgrade.buyEffect(),
      });
      console.log(this.buttons, "work");
    };
    function createItemUpgrade(parent, statX, statY, item) {
      const stat = parent.add(new Text("DAMAGE", { font: "20px monospace" }));
      stat.pos = { x: statX, y: statY + 200 };

      const levelText = parent.add(
        new Text(item.damageLevel.toString(), {
          font: "20px monospace",
        }),
      );
      levelText.pos = { x: statX + 300, y: statY + 200 };

      const costText = parent.add(
        new Text(item.damageCost.toString(), {
          font: "20px monospace",
        }),
      );
      costText.pos = { x: statX + 400, y: statY + 200 };

      parent.add(
        new Rect(32, 32, {
          x: statX + 200,
          y: statY + 185,
        }),
      );

      parent.buttons.push({
        pos: { x: statX + 200, y: statY + 185 },
        w: 32,
        h: 32,
        type: "buyer",
        effect: () => {
          console.log(parent);
          parent.parent.player.upgradeItem(item, "damage");
        },
      });

      parent.upgradeLevels.push({
        upgrade: "itemDamage",
        item,
        levelText,
        costText,
      });
    }

    // ---------- dialog types ----------

    if (dialogType === "settings") {
      const t = this.add(
        new Text("Settings          Yes   No", { font: "20px monospace" }),
      );
      t.pos = { x: (game.w - 780) / 2, y: (game.h - 480) / 2 };

      createOption(
        "Debug overlay",
        { x: (game.w - 780) / 2, y: (game.h - 410) / 2 },
        () => this.parent.debugOn(true),
        () => this.parent.debugOn(false),
      );

      createOption(
        "Invincible",
        { x: (game.w - 780) / 2, y: (game.h - 340) / 2 },
        () => this.parent.player.setInvincible(true),
        () => this.parent.player.setInvincible(false),
      );
    } else if (dialogType === "upgrades") {
      const t = this.add(
        new Text("UPGRADES      BUY   LEVEL  COST", {
          font: "25px monospace",
        }),
      );
      t.pos = { x: (game.w - 780) / 2, y: (game.h - 480) / 2 };

      createUpgrade(this.parent.player.upgrades.speed, {
        x: (game.w - 780) / 2,
        y: (game.h - 410) / 2,
      });
      createUpgrade(this.parent.player.upgrades.resistance, {
        x: (game.w - 780) / 2,
        y: (game.h - 410) / 2 + 40,
      });
    } else if (dialogType === "itemUpgrade") {
      const item = this.item;

      const title = this.add(
        new Text(item.name + " UPGRADES", {
          font: "25px monospace",
        }),
      );
      title.pos = { x: (game.w - 700) / 2, y: (game.h - 430) / 2 + 200 };

      if (item.weapon === true) {
        const statY = (game.h - 360) / 2;
        const statX = (game.w - 700) / 2;

        createItemUpgrade(this, statX, statY, item);
      }
    }
  }

  selectItemUpgrade(itemName) {
    this.itemSelected = itemName;
    this.screen = this.add(
      new dialogScreen(
        this.controls,
        this.onClose,
        this.game,
        1,
        "itemUpgrade",
        this.parent,
        this.mouse,
        itemName,
      ),
    );
  }

  close() {
    this.dead = true;
    this.onClose();
    this.game.speed = 1;
    this.parent.shade.alpha = 0;
    this.parent.upgradeNpcCharecter.screen = "none";
  }

  update(dt) {
    if (this.controls.esc) this.close();

    const mouseEntity = {
      pos: {
        x: this.mouse.pos.x,
        y: this.mouse.pos.y,
      },
      w: 1,
      h: 1,
    };

    this.buttons.forEach((b) => {
      if (hit(b, mouseEntity) && this.mouse.pressed) {
        b.effect();
      }
    });
    this.upgradeLevels.forEach((u) => {
      if (u.upgrade === "itemDamage") {
        u.levelText.text = u.item.damageLevel.toString();
        u.costText.text = u.item.damageCost.toString();
      } else {
        const up = this.parent.player.upgrades[u.upgrade];
        u.levelText.text = up.level.toString();
        u.costText.text = up.cost.toString();
      }
    });
    if (this.screen) {
      this.screen.buttons.forEach((b) => {
        if (hit(b, mouseEntity) && this.mouse.pressed) {
          b.effect();
          console.log("finally");
        }
      });
      this.screen.upgradeLevels.forEach((u) => {
        if (u.upgrade === "itemDamage") {
          u.levelText.text = u.item.damageLevel.toString();
          u.costText.text = u.item.damageCost.toString();
        } else {
          const up = this.parent.player.upgrades[u.upgrade];
          u.levelText.text = up.level.toString();
          u.costText.text = up.cost.toString();
        }
      });
    }

    // live updates
  }
}
