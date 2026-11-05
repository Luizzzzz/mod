var droneCount = 10;
var workRadius = 300;
var buildingRepairPerTick = 0.45;
var unitRepairPerTick = 5 / (60 * 8);
var scanInterval = 20;
var repairDistance = 18;

var bureauBlock = extend(Block, "construction-bureau", {});
bureauBlock.update = true;
bureauBlock.solid = true;
bureauBlock.size = 3;
bureauBlock.configurable = false;
bureauBlock.hasPower = true;
bureauBlock.health = 3000;
bureauBlock.consumePower(5);
bureauBlock.category = Category.units;
bureauBlock.requirements = ItemStack.with(Items.graphite, 300, Items.silicon, 200);
java.util.Arrays.sort(bureauBlock.requirements);
bureauBlock.buildVisibility = BuildVisibility.shown;
bureauBlock.alwaysUnlocked = true;

function findClosestCore(building){
    var closest = null;
    var closestDistance = Number.MAX_VALUE;
    building.team.cores().each(function(core){
        if(!core.isValid()) return;
        var distance = Mathf.dst2(building.x, building.y, core.x, core.y);
        if(distance < closestDistance){
            closest = core;
            closestDistance = distance;
        }
    });
    return closest;
}

function findUnitById(building, id){
    if(id < 0) return null;
    var found = null;
    building.team.data().units.each(function(unit){
        if(unit.id == id) found = unit;
    });
    return found;
}

function droneFlag(building, index){
    return building.tile.pos() * droneCount + index + 1;
}

function findDroneByFlag(building, droneType, flag){
    var found = null;
    var duplicates = [];
    building.team.data().units.each(function(unit){
        if(unit.type != droneType || unit.flag != flag || !unit.isValid()) return;
        if(found == null){
            found = unit;
        }else{
            duplicates.push(unit);
        }
    });
    for(var i = 0; i < duplicates.length; i++){
        duplicates[i].remove();
    }
    return found;
}

function inWorkArea(building, x, y){
    return building.linkedCore != null
        && Mathf.dst2(building.linkedCore.x, building.linkedCore.y, x, y) <= workRadius * workRadius
        && Vars.fogControl.isVisible(building.team, x, y);
}

function isPlanAssigned(building, plan, requester){
    var assigned = false;
    building.team.data().units.each(function(worker){
        if(worker == requester) return;
        var controller = worker.controller();
        if(controller == null || controller.plan == null) return;
        if(controller.plan.x == plan.x && controller.plan.y == plan.y
            && controller.plan.breaking == plan.breaking){
            assigned = true;
        }
    });
    return assigned;
}

function validPlan(building, plan){
    if(building.linkedCore == null || plan.tile() == null || !inWorkArea(building, plan.drawx(), plan.drawy())){
        return false;
    }
    if(plan.breaking){
        return plan.tile().build != null && plan.tile().team() == building.team;
    }
    return plan.block != null;
}

function findBuildPlan(building, requester){
    var best = null;
    var bestDistance = Number.MAX_VALUE;

    function consider(plan){
        if(plan == null || plan.tile() == null || plan.isDone()
            || !validPlan(building, plan) || isPlanAssigned(building, plan, requester)){
            return;
        }
        var distance = Mathf.dst2(requester.x, requester.y, plan.drawx(), plan.drawy());
        if(distance < bestDistance){
            best = plan;
            bestDistance = distance;
        }
    }

    building.team.data().units.each(function(worker){
        if(worker.team != building.team || !worker.isValid() || worker == requester) return;
        var controller = worker.controller();
        if(controller != null && controller.bureauBuild == building) return;
        var plans = worker.plans;
        for(var i = 0; i < plans.size; i++){
            consider(plans.get(i));
        }
    });

    var teamPlans = building.team.data().plans;
    for(var i = 0; i < teamPlans.size; i++){
        var teamPlan = teamPlans.get(i);
        consider(new BuildPlan(teamPlan.x, teamPlan.y, teamPlan.rotation, teamPlan.block, teamPlan.config));
    }

    return best == null ? null : best.copy();
}

function isRepairAssigned(building, target, requester){
    var assigned = false;
    building.team.data().units.each(function(worker){
        if(worker == requester) return;
        var controller = worker.controller();
        if(controller == null) return;
        if(controller.repairBuilding == target || controller.repairUnit == target) assigned = true;
    });
    return assigned;
}

function findRepairTarget(building, requester){
    var best = null;
    var bestHealth = Number.MAX_VALUE;

    building.team.data().buildings.each(function(target){
        if(target.team != building.team || !target.isValid() || target.health >= target.maxHealth
            || !inWorkArea(building, target.x, target.y) || isRepairAssigned(building, target, requester)){
            return;
        }
        var health = target.health / target.maxHealth;
        if(health < bestHealth){
            best = target;
            bestHealth = health;
        }
    });

    building.team.data().units.each(function(target){
        if(target.team != building.team || !target.isValid() || !target.damaged()
            || !inWorkArea(building, target.x, target.y) || isRepairAssigned(building, target, requester)){
            return;
        }
        var health = target.healthf();
        if(health < bestHealth){
            best = target;
            bestHealth = health;
        }
    });

    return best;
}

function clearAssignment(controller){
    controller.plan = null;
    controller.repairBuilding = null;
    controller.repairUnit = null;
    controller.unit.plans.clear();
}

function assignPlan(controller, plan){
    clearAssignment(controller);
    controller.plan = plan.copy();
    controller.unit.addBuild(controller.plan.copy());
}

function makeDroneController(building, unit){
    var controller = new JavaAdapter(BuilderAI, {
        updateMovement: function(){
            this.unit.updateBuilding = true;
            if(this.plan != null){
                this.super$updateMovement();
            }else if(this.repairBuilding != null){
                this.moveTo(this.repairBuilding, repairDistance - 2, 20);
            }else if(this.repairUnit != null){
                this.moveTo(this.repairUnit, repairDistance - 2, 20);
            }else if(this.bureauBuild.linkedCore != null){
                this.moveTo(this.bureauBuild.linkedCore, 24, 20);
            }else{
                this.moveTo(this.bureauBuild, 24, 20);
            }
        }
    });
    controller.onlyAssist = true;
    controller.bureauBuild = building;
    controller.unit = unit;
    controller.plan = null;
    controller.repairBuilding = null;
    controller.repairUnit = null;
    return controller;
}

bureauBlock.buildType = prov(function(){
    var building = new JavaAdapter(Building, {
        updateTile: function(){
            this.linkedCore = findClosestCore(this);
            if(Vars.net.client()) return;

            if(this.linkedCore == null || !this.enabled || this.efficiency <= 0){
                this.clearAssignments();
                return;
            }

            this.ensureDrones();

            for(var i = 0; i < droneCount; i++){
                var drone = this.drones[i];
                if(drone == null || !drone.unit.isValid()) continue;
                if(drone.plan != null && (drone.plan.isDone() || !validPlan(this, drone.plan))){
                    clearAssignment(drone);
                }else if(drone.repairBuilding != null
                    && (!drone.repairBuilding.isValid()
                        || drone.repairBuilding.team != this.team
                        || drone.repairBuilding.health >= drone.repairBuilding.maxHealth
                        || !inWorkArea(this, drone.repairBuilding.x, drone.repairBuilding.y))){
                    clearAssignment(drone);
                }else if(drone.repairUnit != null
                    && (!drone.repairUnit.isValid()
                        || drone.repairUnit.team != this.team
                        || !drone.repairUnit.damaged()
                        || !inWorkArea(this, drone.repairUnit.x, drone.repairUnit.y))){
                    clearAssignment(drone);
                }
            }

            this.repairAssignedTargets();
            this.scanTimer += Time.delta;
            if(this.scanTimer < scanInterval) return;
            this.scanTimer %= scanInterval;

            for(var i = 0; i < droneCount; i++){
                var drone = this.drones[i];
                if(drone == null || !drone.unit.isValid()
                    || drone.plan != null || drone.repairBuilding != null || drone.repairUnit != null){
                    continue;
                }
                var plan = findBuildPlan(this, drone.unit);
                if(plan != null){
                    assignPlan(drone, plan);
                    continue;
                }
                var target = findRepairTarget(this, drone.unit);
                if(target != null){
                    if(target instanceof Building){
                        drone.repairBuilding = target;
                    }else{
                        drone.repairUnit = target;
                    }
                }
            }
        },

        drawSelect: function(){
            this.super$drawSelect();
            if(this.linkedCore != null && this.linkedCore.isValid()){
                Drawf.dashCircle(this.linkedCore.x, this.linkedCore.y, workRadius, Pal.accent);
            }
        },

        version: function(){
            return 1;
        },

        write: function(write){
            this.super$write(write);
            for(var i = 0; i < droneCount; i++){
                var drone = this.drones[i];
                write.i(drone == null || !drone.unit.isValid() ? this.droneIds[i] : drone.unit.id);
            }
        },

        read: function(read, revision){
            this.super$read(read, revision);
            for(var i = 0; i < droneCount; i++){
                this.droneIds[i] = read.i();
            }
        },

        onRemoved: function(){
            if(!Vars.net.client()){
                for(var i = 0; i < droneCount; i++){
                    var drone = this.drones[i];
                    if(drone != null && drone.unit.isValid()) drone.unit.remove();
                }
            }
            this.super$onRemoved();
        },

        ensureDrones: function(){
            var droneType = Vars.content.unit("cheatbrige-construction-bureau-drone");
            if(droneType == null) throw new Error("Missing construction-bureau-drone unit content");

            for(var i = 0; i < droneCount; i++){
                var drone = this.drones[i];
                var flag = droneFlag(this, i);
                if(drone != null && drone.unit.isValid() && !drone.unit.dead()){
                    drone.unit.flag = flag;
                    continue;
                }

                var unit = findDroneByFlag(this, droneType, flag);
                if(unit == null) unit = findUnitById(this, this.droneIds[i]);
                if(unit != null && unit.isValid() && unit.type == UnitTypes.mono){
                    unit.remove();
                    unit = null;
                }

                if(unit == null || !unit.isValid() || unit.dead()
                    || unit.team != this.team || unit.type != droneType){
                    this.spawnTimer += Time.delta;
                    if(this.spawnTimer < 6) return;
                    this.spawnTimer = 0;

                    unit = droneType.create(this.team);
                    var angle = i * 360 / droneCount;
                    var cos = Mathf.cosDeg(angle);
                    var sin = Mathf.sinDeg(angle);
                    var extent = Math.max(Math.abs(cos), Math.abs(sin));
                    var radius = (bureauBlock.size * Vars.tilesize / 2 + unit.type.hitSize + 1) / extent;
                    unit.set(this.x + cos * radius, this.y + sin * radius);
                    unit.add();
                }

                unit.flag = flag;
                drone = makeDroneController(this, unit);
                this.drones[i] = drone;
                this.droneIds[i] = unit.id;
                unit.plans.clear();
                unit.controller(drone);
            }
        },

        repairAssignedTargets: function(){
            for(var i = 0; i < droneCount; i++){
                var drone = this.drones[i];
                if(drone == null || !drone.unit.isValid()) continue;

                if(drone.repairBuilding != null && drone.unit.within(drone.repairBuilding, repairDistance)){
                    var target = drone.repairBuilding;
                    target.health = Math.min(target.maxHealth, target.health + buildingRepairPerTick * Time.delta);
                    target.healthChanged();
                }else if(drone.repairUnit != null && drone.unit.within(drone.repairUnit, repairDistance)){
                    drone.repairUnit.heal(unitRepairPerTick * Time.delta);
                }
            }
        },

        clearAssignments: function(){
            for(var i = 0; i < this.drones.length; i++){
                if(this.drones[i] != null) clearAssignment(this.drones[i]);
            }
        }
    });

    building.drones = [];
    building.droneIds = [];
    building.linkedCore = null;
    building.scanTimer = 0;
    building.spawnTimer = 0;
    for(var i = 0; i < droneCount; i++){
        building.drones.push(null);
        building.droneIds.push(-1);
    }
    return building;
});
