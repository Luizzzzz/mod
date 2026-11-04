package cheatbrige;

import arc.math.Mathf;
import arc.util.Time;
import arc.util.io.Reads;
import arc.util.io.Writes;
import mindustry.Vars;
import mindustry.ai.types.BuilderAI;
import mindustry.content.Items;
import mindustry.content.UnitTypes;
import mindustry.entities.units.BuildPlan;
import mindustry.game.Teams;
import mindustry.gen.Building;
import mindustry.gen.Unit;
import mindustry.graphics.Drawf;
import mindustry.graphics.Pal;
import mindustry.type.Category;
import mindustry.type.ItemStack;
import mindustry.world.Block;
import mindustry.world.blocks.storage.CoreBlock.CoreBuild;

public class ConstructionBureauBlock extends Block{
    static final int droneCount = 10;
    static final float workRadius = 300f;
    static final float buildingRepairPerTick = 0.45f;
    static final float unitRepairPerTick = 5f / (60f * 8f);
    static final float scanInterval = 20f;
    static final float repairDistance = 18f;

    public ConstructionBureauBlock(String name){
        super(name);
        update = true;
        solid = true;
        size = 3;
        configurable = false;
        hasPower = true;
        health = 3000;
        consumePower(5f);
        requirements(Category.units, ItemStack.with(
            Items.graphite, 300,
            Items.silicon, 200
        ));
        alwaysUnlocked = true;
        buildType = () -> new BureauBuild();
    }

    public class BureauBuild extends Building{
        private final BureauDroneAI[] drones = new BureauDroneAI[droneCount];
        private final int[] savedDroneIds = new int[droneCount];
        private CoreBuild linkedCore;
        private float scanTimer;
        private float droneSpawnTimer;

        public BureauBuild(){
            for(int i = 0; i < savedDroneIds.length; i++){
                savedDroneIds[i] = -1;
            }
        }

        @Override
        public void updateTile(){
            linkedCore = findClosestCore();
            if(Vars.net.client()) return;

            ensureDrones();

            if(linkedCore == null || !enabled || efficiency <= 0f){
                clearAssignments();
                return;
            }

            for(BureauDroneAI drone : drones){
                if(drone == null || !drone.unit.isValid()) continue;
                validateAssignment(drone);
            }

            repairAssignedTargets();

            scanTimer += Time.delta;
            if(scanTimer < scanInterval) return;
            scanTimer %= scanInterval;

            for(BureauDroneAI drone : drones){
                if(drone == null || !drone.unit.isValid() || drone.isBusy()) continue;

                BuildPlan plan = findBuildPlan(drone);
                if(plan != null){
                    drone.assign(plan);
                    continue;
                }

                Object target = findRepairTarget(drone);
                if(target instanceof Building building){
                    drone.assign(building);
                }else if(target instanceof Unit unit){
                    drone.assign(unit);
                }
            }

        }

        @Override
        public void drawSelect(){
            super.drawSelect();
            if(linkedCore != null && linkedCore.isValid()){
                Drawf.dashCircle(linkedCore.x, linkedCore.y, workRadius, Pal.accent);
            }
        }

        @Override
        public void write(Writes write){
            super.write(write);
            for(int i = 0; i < drones.length; i++){
                BureauDroneAI drone = drones[i];
                int id = drone == null || !drone.unit.isValid() ? savedDroneIds[i] : drone.unit.id();
                write.i(id);
            }
        }

        @Override
        public void read(Reads read, byte revision){
            super.read(read, revision);
            for(int i = 0; i < savedDroneIds.length; i++){
                savedDroneIds[i] = read.i();
            }
        }

        @Override
        public byte version(){
            return 1;
        }

        @Override
        public void onRemoved(){
            if(!Vars.net.client()) removeDrones();
            super.onRemoved();
        }

        private CoreBuild findClosestCore(){
            CoreBuild closest = null;
            float closestDistance = Float.MAX_VALUE;
            for(CoreBuild core : team.cores()){
                if(!core.isValid()) continue;
                float distance = Mathf.dst2(x, y, core.x, core.y);
                if(distance < closestDistance){
                    closest = core;
                    closestDistance = distance;
                }
            }
            return closest;
        }

        private void ensureDrones(){
            for(int i = 0; i < droneCount; i++){
                BureauDroneAI drone = drones[i];
                if(drone != null && drone.unit.isValid() && !drone.unit.dead()) continue;

                Unit unit = findUnit(savedDroneIds[i]);
                if(unit == null || !unit.isValid() || unit.dead() || unit.team != team || unit.type != UnitTypes.mono){
                    droneSpawnTimer += Time.delta;
                    if(droneSpawnTimer < 6f) return;
                    droneSpawnTimer = 0f;

                    unit = UnitTypes.mono.create(team);
                    float angle = i * 360f / droneCount;
                    float cos = Mathf.cosDeg(angle);
                    float sin = Mathf.sinDeg(angle);
                    float extent = Mathf.max(Mathf.abs(cos), Mathf.abs(sin));
                    float radius = (size * Vars.tilesize / 2f + unit.type.hitSize + 1f) / extent;
                    unit.set(x + cos * radius, y + sin * radius);
                    unit.add();
                }

                drone = new BureauDroneAI(this, unit);
                drones[i] = drone;
                savedDroneIds[i] = unit.id();
                unit.plans().clear();
                unit.controller(drone);
            }
        }

        private Unit findUnit(int id){
            if(id < 0) return null;
            Unit[] result = {null};
            team.data().units.each(unit -> {
                if(unit.id() == id){
                    result[0] = unit;
                }
            });
            return result[0];
        }

        private void validateAssignment(BureauDroneAI drone){
            if(drone.plan != null){
                if(drone.plan.isDone() || !validPlan(drone.plan)){
                    drone.clearAssignment();
                }
            }else if(drone.repairBuilding != null){
                if(!validRepairTarget(drone.repairBuilding.x, drone.repairBuilding.y)
                    || !drone.repairBuilding.isValid()
                    || drone.repairBuilding.team != team
                    || drone.repairBuilding.health >= drone.repairBuilding.maxHealth){
                    drone.clearAssignment();
                }
            }else if(drone.repairUnit != null){
                if(!validRepairTarget(drone.repairUnit.x, drone.repairUnit.y)
                    || !drone.repairUnit.isValid()
                    || drone.repairUnit.team != team
                    || !drone.repairUnit.damaged()){
                    drone.clearAssignment();
                }
            }
        }

        private BuildPlan findBuildPlan(BureauDroneAI requester){
            BuildPlan[] best = {null};
            float[] bestDistance = {Float.MAX_VALUE};

            team.data().units.each(worker -> {
                if(worker.team != team || !worker.isValid() || worker == requester.unit
                    || worker.controller() instanceof BureauDroneAI){
                    return;
                }

                for(BuildPlan plan : worker.plans()){
                    considerPlan(plan, requester, best, bestDistance);
                }
            });

            for(Teams.BlockPlan plan : team.data().plans){
                BuildPlan candidate = new BuildPlan(plan.x, plan.y, plan.rotation, plan.block, plan.config);
                considerPlan(candidate, requester, best, bestDistance);
            }

            return best[0] == null ? null : best[0].copy();
        }

        private void considerPlan(BuildPlan plan, BureauDroneAI requester, BuildPlan[] best, float[] bestDistance){
            if(plan == null || plan.tile() == null || plan.isDone() || !validPlan(plan) || isPlanAssigned(plan, requester)){
                return;
            }

            float distance = Mathf.dst2(requester.unit.x, requester.unit.y, plan.drawx(), plan.drawy());
            if(distance < bestDistance[0]){
                best[0] = plan;
                bestDistance[0] = distance;
            }
        }

        private boolean isPlanAssigned(BuildPlan plan, BureauDroneAI requester){
            boolean[] assigned = {false};
            team.data().units.each(worker -> {
                if(worker == requester.unit || !(worker.controller() instanceof BureauDroneAI other)
                    || other.plan == null){
                    return;
                }

                if(other.plan.x == plan.x && other.plan.y == plan.y
                    && other.plan.breaking == plan.breaking){
                    assigned[0] = true;
                }
            });
            return assigned[0];
        }

        private boolean validPlan(BuildPlan plan){
            if(linkedCore == null || plan.tile() == null || !inWorkArea(plan.drawx(), plan.drawy())){
                return false;
            }

            if(plan.breaking){
                return plan.tile().build != null && plan.tile().team() == team;
            }

            return plan.block != null;
        }

        private Object findRepairTarget(BureauDroneAI requester){
            Object[] best = {null};
            float[] bestHealth = {Float.MAX_VALUE};

            team.data().buildings.each(building -> {
                if(building.team != team || !building.isValid()
                    || building.health >= building.maxHealth
                    || !validRepairTarget(building.x, building.y)
                    || isRepairAssigned(building, requester)){
                    return;
                }

                float healthFraction = building.health / building.maxHealth;
                if(healthFraction < bestHealth[0]){
                    best[0] = building;
                    bestHealth[0] = healthFraction;
                }
            });

            team.data().units.each(unit -> {
                if(unit.team != team || !unit.isValid() || !unit.damaged()
                    || !validRepairTarget(unit.x, unit.y)
                    || isRepairAssigned(unit, requester)){
                    return;
                }

                float healthFraction = unit.healthf();
                if(healthFraction < bestHealth[0]){
                    best[0] = unit;
                    bestHealth[0] = healthFraction;
                }
            });

            return best[0];
        }

        private boolean isRepairAssigned(Object target, BureauDroneAI requester){
            boolean[] assigned = {false};
            team.data().units.each(worker -> {
                if(worker == requester.unit || !(worker.controller() instanceof BureauDroneAI other)){
                    return;
                }

                if(other.repairBuilding == target || other.repairUnit == target){
                    assigned[0] = true;
                }
            });
            return assigned[0];
        }

        private boolean validRepairTarget(float targetX, float targetY){
            return linkedCore != null && inWorkArea(targetX, targetY);
        }

        private boolean inWorkArea(float targetX, float targetY){
            return Mathf.dst2(linkedCore.x, linkedCore.y, targetX, targetY) <= workRadius * workRadius
                && Vars.fogControl.isVisible(team, targetX, targetY);
        }

        private void repairAssignedTargets(){
            for(BureauDroneAI drone : drones){
                if(drone == null || !drone.unit.isValid()) continue;

                if(drone.repairBuilding != null && drone.unit.within(drone.repairBuilding, repairDistance)){
                    Building target = drone.repairBuilding;
                    target.health = Math.min(target.maxHealth, target.health + buildingRepairPerTick * Time.delta);
                    target.healthChanged();
                }else if(drone.repairUnit != null && drone.unit.within(drone.repairUnit, repairDistance)){
                    drone.repairUnit.heal(unitRepairPerTick * Time.delta);
                }
            }
        }

        private void clearAssignments(){
            for(BureauDroneAI drone : drones){
                if(drone != null) drone.clearAssignment();
            }
        }

        private void removeDrones(){
            for(BureauDroneAI drone : drones){
                if(drone != null && drone.unit.isValid()){
                    drone.unit.remove();
                }
            }
        }
    }

    private static class BureauDroneAI extends BuilderAI{
        final BureauBuild bureau;
        final Unit unit;
        BuildPlan plan;
        Building repairBuilding;
        Unit repairUnit;

        BureauDroneAI(BureauBuild bureau, Unit unit){
            this.bureau = bureau;
            this.unit = unit;
            onlyAssist = true;
        }

        boolean isBusy(){
            return plan != null || repairBuilding != null || repairUnit != null;
        }

        void assign(BuildPlan plan){
            clearAssignment();
            this.plan = plan.copy();
            unit.plans().clear();
            unit.addBuild(this.plan.copy());
        }

        void assign(Building building){
            clearAssignment();
            repairBuilding = building;
        }

        void assign(Unit unit){
            clearAssignment();
            repairUnit = unit;
        }

        void clearAssignment(){
            plan = null;
            repairBuilding = null;
            repairUnit = null;
            unit.plans().clear();
        }

        @Override
        public void updateMovement(){
            unit.updateBuilding = true;

            if(plan != null){
                super.updateMovement();
                return;
            }

            if(repairBuilding != null){
                moveTo(repairBuilding, repairDistance - 2f, 20f);
            }else if(repairUnit != null){
                moveTo(repairUnit, repairDistance - 2f, 20f);
            }else if(bureau.linkedCore != null){
                moveTo(bureau.linkedCore, 24f, 20f);
            }else{
                moveTo(bureau, 24f, 20f);
            }
        }
    }
}
