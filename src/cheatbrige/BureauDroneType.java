package cheatbrige;

import mindustry.content.Fx;
import mindustry.content.UnitTypes;
import mindustry.gen.UnitEntity;
import mindustry.type.UnitType;

public class BureauDroneType extends UnitType{
    public BureauDroneType(){
        super("construction-bureau-drone");

        UnitType base = UnitTypes.poly;
        constructor = UnitEntity::create;
        flying = base.flying;
        lowAltitude = base.lowAltitude;
        drag = base.drag;
        accel = base.accel;
        speed = base.speed;
        rotateSpeed = base.rotateSpeed;
        health = base.health;
        hitSize = base.hitSize;
        engineSize = base.engineSize;
        engineOffset = base.engineOffset;
        buildSpeed = base.buildSpeed;
        buildRange = base.buildRange;
        mineTier = base.mineTier;
        mineSpeed = base.mineSpeed;
        useUnitCap = false;
        targetable = false;
        killable = false;
        createWreck = false;
        deathExplosionEffect = Fx.none;
        deathShake = 0f;
        hidden = true;
        playerControllable = false;
        logicControllable = false;
    }

    @Override
    public void load(){
        super.load();
        region = UnitTypes.poly.region;
        previewRegion = UnitTypes.poly.previewRegion;
        shadowRegion = UnitTypes.poly.shadowRegion;
        outlineRegion = UnitTypes.poly.outlineRegion;
        clipSize = Math.max(clipSize, UnitTypes.poly.clipSize);
    }
}
