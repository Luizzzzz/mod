package cheatbrige;

import mindustry.mod.Mod;
import mindustry.type.UnitType;

public class CheatBridgeMod extends Mod{
    static UnitType bureauDroneType;

    @Override
    public void loadContent(){
        bureauDroneType = new BureauDroneType();
        new ConstructionBureauBlock("construction-bureau");
    }
}
