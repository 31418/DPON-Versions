class Player extends TileSprite {
  constructor(controls, map, mouse, gameScreen, inventory, arrows) {
    super(playerTexture, 32, 32);
    this.rate = 0.5;
    this.curTime = 0;
    this.curFrame = 0;
    this.anims = new AnimManager(this);

    this.controls = controls;
    this.mouse = mouse;
    this.map = map;
    this.health = 500;
    this.jumping = false;
    this.vel = new Vector();
    this.acc = new Vector();
    this.score = 0;
    this.falling = true;
    this.hitBox = {
      x: 8,
      y: 8,
      w: 24,
      h: 24,
    };
    const { anims } = this;
    anims.add(
      "walk",
      [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 3, y: 0 },
      ],
      0.1,
    );
    anims.add(
      "idle",
      [
        { x: 0, y: 1 },
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 3, y: 1 },
      ],
      0.1,
    );
    anims.add(
      "attack",
      [
        { x: 0, y: 2 },
        { x: 1, y: 2 },
        { x: 2, y: 2 },
        { x: 3, y: 2 },
      ],
      0.1,
    );

    this.speed = 1200;
    this.maxSpeed = 300;
    this.walktime = 0;
    this.dashUp = false;
    this.dash = false;

    this.bounce = new soundpool("sounds/hit.wav", { volume: 0.3 });
    const walk = new soundgroup([
      new sound("sounds/walk.m4a", { volume: 0.5 }),
      new sound("sounds/walk2.m4a", { volume: 0.5 }),
      new sound("sounds/walk3.m4a", { volume: 0.5 }),
    ]);
    this.walk = walk;

    this.jumpFrames = 0;
    this.standingFrames = 0;

    this.inventory = inventory;
    this.held = null;

    this.facing = "left";

    this.game = gameScreen;
    //fighting
    this.attackCooldown = 1;
    this.attackTimer = 0;
    this.swingSword = false;
    this.swingSwordTimer = 0;
    this.swingHammer = false;
    this.swingHammerTimer = 0;
    this.swingAxe = false;
    this.swingAxeTimer = 0;

    this.addArrow = arrows;

    this.immune = 1;

    this.itemMoused = false;
    this.itemMousedItem = null;

    this.instaHealCooldown = 1;
    this.dashUpCooldown = 2;

    this.inventoryCooldowns = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    this.heldNumber = null;

    this.xp = 0;

    this.invincible = false;

    this.lastBoughtTime = 0;

    this.upgrades = {
      speed: {
        name: "speed",
        level: 0,
        cost: 3,
        buyEffect: () => {
          if (this.lastBoughtTime <= 0 && this.xp >= this.upgrades.speed.cost) {
            this.upgrades.speed.level += 1;
            this.xp -= this.upgrades.speed.cost;
            this.lastBoughtTime = 0.2;
            this.upgrades.speed.cost += 2;
            console.log(this.lastBoughtTime);
          }
        },
      },
      resistance: {
        name: "resistance",
        level: 0,
        cost: 4,
        buyEffect: () => {
          if (
            this.lastBoughtTime <= 0 &&
            this.xp >= this.upgrades.resistance.cost
          ) {
            this.upgrades.resistance.level += 1;
            this.xp -= this.upgrades.resistance.cost;
            this.lastBoughtTime = 0.2;
            this.upgrades.resistance.cost += 5;
            console.log(this.lastBoughtTime);
          }
        },
      },
    };

    this.itemInfo = {
      sword: {
        name: "sword",
        weapon: true,
        damage: 50,
        damageLevel: 1,
        damageCost: 5,
        cooldown: 1,
      },

      hammer: {
        name: "hammer",
        weapon: true,
        damage: 0, // uses velocity for damage
        damageLevel: 1,
        damageCost: 8,
        cooldown: 5,
      },

      axe: {
        name: "axe",
        weapon: true,
        damage: 30,
        damageLevel: 1,
        damageCost: 6,
        knockback: 200,
        cooldown: 2,
      },

      bow: {
        name: "bow",
        weapon: true,
        damage: 1, // projectile handles real damage
        damageLevel: 1,
        damageCost: 7,
        cooldown: 2,
        projectileSpeed: 600,
        projectileType: "damage",
      },

      slownessBow: {
        name: "slownessBow",
        weapon: true,
        damage: 0,
        damageLevel: 1,
        damageCost: 7,
        cooldown: 3,
        projectileSpeed: 600,
        projectileType: "slowness",
      },

      shield: {
        name: "shield",
        weapon: false,
        damage: 0,
        damageReduction: 0.9,
        speedPenalty: 400,
      },

      instaHeal: {
        name: "instaHeal",
        weapon: false,
        healAmount: 150,
        xpCost: 5,
        cooldown: 2,
      },

      dashUp: {
        name: "dashUp",
        weapon: false,
        cooldown: 2,
      },

      dash: {
        name: "dash",
        weapon: false,
        cooldown: 2,
      },

      wind: {
        name: "wind",
        weapon: false,
        knockback: 500,
        cooldown: 0.25,
      },
    };
  }
  upgradeItem(item, type) {
    if (
      this.xp >= item.damageCost &&
      type === "damage" &&
      this.lastBoughtTime <= 0
    ) {
      this.xp -= item.damageCost;
      item.damage += 10;
      item.damageLevel += 1;
      item.damageCost = Math.floor(item.damageCost * 1.5);
      this.lastBoughtTime = 0.2;
    }
  }
  takeDamage(damage) {
    this.health -= this.immune * damage - this.upgrades.resistance.level;
    this.camera.shake(2, 0.2);
    this.game.healthBarRect.style = { fill: "#d89797ff" };
    this.game.healthFlashTime = 0.05;
  }
  attack(weapon) {
    this.attackTimer = this.attackCooldown;
    if (weapon === "sword") {
      //swing sword
      this.swingSword = true;
      this.swingSwordTimer = 0.25;

      //zombies
      this.game.zombies.map((z) => {
        z.takeDamage(this.itemInfo.sword.damage);
      });
      this.game.bats.map((b) => {
        b.takeDamage(this.itemInfo.sword.damage);
      });
    }
    if (weapon === "hammer") {
      this.swingHammer = true;
      this.swingHammerTimer = 0.25;

      this.game.zombies.map((z) => {
        z.takeDamage(this.vel.mag() * this.itemInfo.hammer.damage);
      });
      this.game.bats.map((b) => {
        b.takeDamage(this.vel.mag() * this.itemInfo.hammer.damage);
      });
    }
    if (weapon === "axe") {
      this.swingAxe = true;
      this.swingAxeTimer = 0.25;

      this.game.zombies.map((z) => {
        z.takeDamage(this.itemInfo.axe.damage);
        z.takeKnockback(200);
      });
      this.game.bats.map((b) => {
        b.takeDamage(this.itemInfo.axe.damage);
        b.takeKnockback(100);
      });
    }
  }
  computeHeld() {
    if (this.controls.numberHeldAligned !== null) {
      this.held = this.inventory[this.controls.numberHeldAligned];
      this.heldNumber = this.controls.numberHeldAligned;
    }
  }
  setInvincible(status) {
    this.invincible = status;
  }
  update(dt, t) {
    const { x, y } = this.controls;

    this.lastBoughtTime -= dt;

    this.attackTimer -= dt;
    this.swingSwordTimer -= dt;
    this.swingHammerTimer -= dt;
    this.swingAxeTimer -= dt;
    for (let i = 0; i < this.inventoryCooldowns.length; i++) {
      this.inventoryCooldowns[i] -= dt;
    }

    if (y === -1 && this.standingFrames > 0) {
      applyImpulse(this, { x: 0, y: -600 }, dt);
      this.jumping = true;
      this.standingFrames = 0;
    }
    if (this.dashUp) {
      applyImpulse(this, { x: 0, y: -1600 }, dt);
      this.jumping = true;
      this.dashUp = false;
    }
    if (this.dash) {
      let amount;
      if (this.facing === "left") {
        amount = -900;
      } else {
        amount = 900;
      }
      applyImpulse(this, { x: amount, y: 0 }, dt);
      this.dash = false;
    }
    if (this.jumping) {
      this.jumpFrames += 1;
    } else {
      this.jumpFrames = 0;
    }
    if (this.jumpFrames > 20) {
      applyForce(this, { x: 0, y: 1600 });
    }
    if (x !== 0) {
      if (this.vel.mag() < this.maxSpeed + this.upgrades.speed.level * 50) {
        applyForce(this, {
          x: x * (this.speed + this.upgrades.speed.level * 50),
          y: 0,
        });
      }
    }

    const friction = this.vel.clone().multiply(-1).normalize().multiply(700);
    applyForce(this, friction);

    let r = integrate(this, dt);

    if (this.vel.mag() < 5) {
      this.vel.set(0, 0);
    }

    r = wallslide(this, this.map, r.x, r.y);
    this.pos.increase(r);

    if (r.hits.down) {
      this.jumping = false;
      this.vel.y = 0;
      this.standingFrames = 30;
    } else {
      this.standingFrames -= 1;
    }
    if (!this.jumping && !r.hits.down) {
      this.jumping = true;
    }
    if (r.hits.up) {
      this.vel.y = 0;
    }
    if (r.hits.left) {
      this.vel.x = 0;
    }
    if (r.hits.right) {
      this.vel.x = 0;
    }

    //anims

    if (x === 0) {
      //this.anims.play("idle");
    }
    if (this.walktime > 10) {
      //this.anims.play("walk");
    }

    if (x !== 0) {
      this.walktime += 1;
      this.walk.play();
    } else {
      this.walktime = 0;
    }

    if (this.mouse.pos.x > this.pos.x + 16 + this.camera.pos.x) {
      this.facing = "right";
      this.frame.x = 0;
    } else {
      this.facing = "left";
      this.frame.x = 1;
    }

    //check ground
    if (
      this.map.tileAtPixelPos({ x: this.pos.x + 16, y: this.pos.y + 16 }).frame
        .id === "spike"
    ) {
      if (this.vel.y > 120) {
        this.takeDamage(this.vel.y * 0.1);
      }
    }

    //holding
    this.computeHeld();

    //fighting & actions
    if (this.controls.space) {
      if (this.held === "sword" && this.attackTimer < 0) {
        this.attack("sword");
      } else if (this.held === "shield") {
        this.speed = 800;
        this.immune = 0.1; //90% damage reduction
        this.maxSpeed = 150;
      } else if (
        this.held === "instaHeal" &&
        this.inventoryCooldowns[this.heldNumber] < 0 &&
        this.xp > 4
      ) {
        this.takeDamage(-150);
        this.inventoryCooldowns[this.heldNumber] = 2;
        this.xp -= 5;
      } else if (
        this.held === "dashUp" &&
        this.inventoryCooldowns[this.heldNumber] < 0
      ) {
        this.inventoryCooldowns[this.heldNumber] = 2;
        this.dashUp = true;
      } else if (
        this.held === "dash" &&
        this.inventoryCooldowns[this.heldNumber] < 0
      ) {
        this.inventoryCooldowns[this.heldNumber] = 2;
        this.dash = true;
      } else if (
        this.held === "hammer" &&
        this.inventoryCooldowns[this.heldNumber] < 0
      ) {
        this.inventoryCooldowns[this.heldNumber] = 5;
        this.attack("hammer");
      } else if (
        this.held === "axe" &&
        this.inventoryCooldowns[this.heldNumber] < 0
      ) {
        this.inventoryCooldowns[this.heldNumber] = 2;
        this.attack("axe");
      } else if (
        this.held === "wind" &&
        this.inventoryCooldowns[this.heldNumber] < 0
      ) {
        this.game.zombies.map((z) => {
          z.takeKnockback(500);
        });
        this.inventoryCooldowns[this.heldNumber] = 0.25;
      } else if (
        this.held === "bow" &&
        this.inventoryCooldowns[this.heldNumber] < 0
      ) {
        this.inventoryCooldowns[this.heldNumber] = 2;
        const dx = this.mouse.pos.x - this.camera.pos.x - this.pos.x;
        const dy = this.mouse.pos.y - this.camera.pos.y - this.pos.y - 10;

        const mag = Math.hypot(dx, dy);
        const dir = {
          x: dx / mag,
          y: dy / mag,
        };

        const bullet = new Bullet(dir, 600, "damage");

        let arrow = this.addArrow(bullet);
        arrow.pos = { x: this.pos.x, y: this.pos.y };
      } else if (
        this.held === "slownessBow" &&
        this.inventoryCooldowns[this.heldNumber] < 0
      ) {
        this.inventoryCooldowns[this.heldNumber] = 3;
        const dx = this.mouse.pos.x - this.camera.pos.x - this.pos.x;
        const dy = this.mouse.pos.y - this.camera.pos.y - this.pos.y;

        const mag = Math.hypot(dx, dy);
        const dir = {
          x: dx / mag,
          y: dy / mag,
        };

        const bullet = new Bullet(dir, 600, "slowness");
        let arrow = this.addArrow(bullet);
        arrow.pos = { x: this.pos.x, y: this.pos.y };
      }
    }
    if (!(this.held === "shield" && this.controls.space)) {
      this.speed = 1200;
      this.maxSpeed = 400;
      this.immune = 1;
    }
    if (this.swingSword && this.swingSwordTimer > 0) {
      this.heldItemDisplay.children[0].swing(this.swingSwordTimer);
    }
    if (this.swingSwordTimer < 0) {
      this.swingSword = false;
      this.heldItemDisplay.children[0].rotation = 0;
    }
    if (this.swingHammer && this.swingHammerTimer > 0) {
      this.heldItemDisplay.children[5].swing(this.swingHammerTimer);
    }
    if (this.swingHammerTimer < 0) {
      this.swingHammer = false;
      this.heldItemDisplay.children[5].rotation = 0;
    }
    if (this.swingAxe && this.swingAxeTimer > 0) {
      this.heldItemDisplay.children[6].swing(this.swingAxeTimer);
    }
    if (this.swingAxeTimer < 0) {
      this.swingAxe = false;
      this.heldItemDisplay.children[6].rotation = 0;
    }

    //health

    if (this.health <= 0 && this.invincible === false) {
      this.dead = true;
    } else if (this.health > 500) {
      this.health = 500;
    }
  }
}
