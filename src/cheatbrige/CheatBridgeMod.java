package cheatbrige;

import mindustry.mod.Mod;

public class CheatBridgeMod extends Mod{
    @Override
    public void loadContent(){
        new ConstructionBureauBlock("construction-bureau");
    }
}
