function createBlock(type, name, category, requirements, properties){
    var block = extend(type, name, properties || {});
    block.buildVisibility = BuildVisibility.shown;
    block.category = category;
    block.requirements = requirements;
    java.util.Arrays.sort(block.requirements);
    block.alwaysUnlocked = true;
    return block;
}

var superDrill = createBlock(Drill, "superDrill", Category.production, ItemStack.with(Items.copper, 10), {
    size: 2,
    health: 2600,
    drillTime: 5,
    tier: 6,
    itemCapacity: 100,
    drawRim: true,
    rotateSpeed: 6,
    floating: true
});

var superPlasmaBore = createBlock(BeamDrill, "superPlasma-bore", Category.production, ItemStack.with(Items.beryllium, 10), {
    size: 2,
    range: 7,
    fogRadius: 8,
    health: 2600,
    drillTime: 60,
    tier: 6,
    itemCapacity: 100,
    floating: true
});

var superCliffCrusher = createBlock(WallCrafter, "superCliff-crusher", Category.production,
    ItemStack.with(Items.graphite, 15, Items.beryllium, 10), {
        size: 2,
        health: 2600,
        drillTime: 5
    });

var superCrafter = createBlock(GenericCrafter, "superCrafter", Category.crafting, ItemStack.with(Items.copper, 10), {
    size: 2,
    hasItems: true,
    craftEffect: Fx.smeltsmoke,
    updateEffect: Fx.pulverizeRed,
    outputItems: ItemStack.with(
        Items.scrap, 1,
        Items.lead, 1,
        Items.titanium, 1,
        Items.graphite, 1,
        Items.silicon, 1
    ),
    craftTime: 20
});
superCrafter.consumeItems(ItemStack.with(Items.copper, 5));

var superConveyor = createBlock(Conveyor, "superConveyor", Category.distribution, ItemStack.with(Items.copper, 2), {
    noSideBlend: true,
    health: 200,
    speed: 12,
    displayedSpeed: 12,
    itemCapacity: 10
});

var superDuct = createBlock(Duct, "superDuct", Category.distribution, ItemStack.with(Items.beryllium, 1), {
    health: 200,
    speed: 1,
    itemCapacity: 1
});

var superReactor = createBlock(ConsumeGenerator, "superReactor", Category.power, ItemStack.with(Items.copper, 300), {
    size: 2,
    hasItems: true,
    itemCapacity: 20,
    itemDuration: 10,
    powerProduction: 300
});
superReactor.consumeItems(ItemStack.with(Items.copper, 9));

var superTurbine = createBlock(ThermalGenerator, "superTurbine-condenser", Category.power,
    ItemStack.with(Items.beryllium, 60), {
        size: 3,
        attribute: Attribute.steam,
        powerProduction: 1.5,
        outputLiquid: new LiquidStack(Liquids.water, 0.3),
        displayEfficiencyScale: 0.1,
        generateEffect: Fx.turbinegenerate,
        effectChance: 0.04,
        hasLiquids: true,
        fogRadius: 3
    });

var superTurret = createBlock(ItemTurret, "superTurret", Category.turret, ItemStack.with(Items.copper, 100), {
    health: 2800,
    itemCapacity: 6,
    reload: 60,
    range: 250,
    inaccuracy: 5,
    size: 1,
    targetAir: true,
    targetGround: true,
    rotateSpeed: 2,
    recoil: 1,
    shootSound: Sounds.shoot,
    buildCostMultiplier: 0,
    shoot: new ShootSpread()
});
superTurret.shoot.shots = 2;
superTurret.shoot.spread = 5;

function createSuperTurretBullet(knockback){
    var bullet = new BasicBulletType(6, 200);
    bullet.ammoUsed = 0.125;
    bullet.knockback = knockback || 0;
    bullet.lifetime = 250;
    bullet.scaleLife = true;
    bullet.impact = knockback > 0;
    return bullet;
}

superTurret.ammo(
    Items.sand, createSuperTurretBullet(1),
    Items.copper, createSuperTurretBullet(0),
    Items.lead, createSuperTurretBullet(0),
    Items.titanium, createSuperTurretBullet(0)
);

var superBreach = createBlock(PowerTurret, "superBreach", Category.turret,
    ItemStack.with(Items.beryllium, 100, Items.graphite, 100), {
        targetAir: true,
        targetGround: true,
        health: 5000,
        size: 2,
        reload: 5,
        rotateSpeed: 60,
        range: 360,
        shootSound: Sounds.shootLancer,
        heatColor: Color.valueOf("5782c2"),
        inaccuracy: 3
    });
superBreach.consumePower(1);

var breachShoot = new ShootBarrel();
breachShoot.barrels = newFloats(9);
breachShoot.barrels[0] = 0;
breachShoot.barrels[1] = -3;
breachShoot.barrels[2] = 0;
breachShoot.barrels[3] = 8;
breachShoot.barrels[4] = -4;
breachShoot.barrels[5] = 0;
breachShoot.barrels[6] = -8;
breachShoot.barrels[7] = -4;
breachShoot.barrels[8] = 0;
breachShoot.barrelOffset = 1;
breachShoot.shots = 3;
breachShoot.firstShotDelay = 10;
breachShoot.shotDelay = 4.5;
superBreach.shoot = breachShoot;

var breachBullet = new LaserBulletType(200);
breachBullet.length = 360;
breachBullet.width = 20;
breachBullet.chargeEffect = Fx.lightningCharge;
var breachColors = java.lang.reflect.Array.newInstance(Color, 3);
breachColors[0] = Color.valueOf("7382f040");
breachColors[1] = Color.valueOf("7382f0");
breachColors[2] = Color.white;
breachBullet.colors = breachColors;
superBreach.shootType = breachBullet;

var breachDrawer = new DrawTurret();
var breachHeat = new RegionPart("-heat");
breachHeat.mirror = true;
breachHeat.progress = DrawPart.PartProgress.warmup;
breachHeat.moveX = 1;
breachHeat.moveY = 2;
breachHeat.under = true;
breachHeat.moves.add(new DrawPart.PartMove(DrawPart.PartProgress.recoil, 0, -1, 0));
breachDrawer.parts.add(breachHeat);
superBreach.drawer = breachDrawer;
