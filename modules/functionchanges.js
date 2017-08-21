MODULES["automaps"].enoughDamageCutoff = 4; //above this the game will do maps for map bonus stacks
MODULES["automaps"].farmingCutoff = 100; //above this the game will farm.
MODULES["automaps"].numHitsSurvived = 10;
MODULES["automaps"].watchChallengeMaps = [16, 26, 36, 51];
MODULES["jobs"].autoRatio4 = [1, 2, 9];
MODULES["jobs"].autoRatio6 = [1, 2, 40];
upgradeList = ['Miners', 'Scientists', 'Coordination', 'Speedminer', 'Speedlumber', 'Speedfarming', 'Speedscience', 'Megaminer', 'Megalumber', 'Megafarming', 'Megascience', 'Efficiency', 'TrainTacular', 'Trainers', 'Blockmaster', 'Battle', 'Bloodlust', 'Bounty', 'Egg', 'Anger', 'Formations', 'Dominance', 'Barrier', 'UberHut', 'UberHouse', 'UberMansion', 'UberHotel', 'UberResort', 'Trapstorm', 'Gigastation', 'Shieldblock', 'Potency', 'Magmamancers'];
MODULES["autobreedtimer"].breedFireOn = 60; //turn breedfire on at X seconds (if BreedFire)
MODULES["autobreedtimer"].breedFireOff = 35; //turn breedfire off at X seconds(if BreedFire)
MODULES["buildings"].nurseSpireAmt = 400;
MODULES["buildings"].nurseVoidMapsAmt = 400;


function workerRatios() {
    var ratioSet;
    if ((game.global.world <= getPageSetting('VoidMaps')) && (voidCheckPercent > 0)) {
        if (userCheckSiphonUsage() && globalvar4) {
            ratioSet = globalvar2;
        } else {
            ratioSet = globalvar3;
        }
    } else if (game.buildings.Tribute.owned > 3000 && mutations.Magma.active()) {
        ratioSet = MODULES["jobs"].autoRatio6;
    } else if (game.buildings.Tribute.owned > 1500) {
        ratioSet = MODULES["jobs"].autoRatio5;
    } else if (game.buildings.Tribute.owned > 1000) {
        ratioSet = MODULES["jobs"].autoRatio4;
    } else if (game.resources.trimps.realMax() > 3000000) {
        ratioSet = MODULES["jobs"].autoRatio3;
    } else if (game.resources.trimps.realMax() > 300000) {
        ratioSet = MODULES["jobs"].autoRatio2;
    } else {
        ratioSet = MODULES["jobs"].autoRatio1;
    }
    if (game.global.challengeActive == 'Metal') {
        ratioSet = [4, 5, 0]; //needs to be this to split workers half and half between farmers and lumbers (idk why)
    }

    setPageSetting('FarmerRatio', ratioSet[0]);
    setPageSetting('LumberjackRatio', ratioSet[1]);
    setPageSetting('MinerRatio', ratioSet[2]);
}

function calcBaseDamageinX() {
    //baseDamage
    baseDamage = game.global.soldierCurrentAttack * (1 + (game.global.achievementBonus / 100)) * ((game.global.antiStacks * game.portal.Anticipation.level * game.portal.Anticipation.modifier) + 1) * (1 + (game.global.roboTrimpLevel * 0.2)) * (1 + (game.global.totalSquaredReward / 100));
    if (game.global.challengeActive == "Daily") {
        if (typeof game.global.dailyChallenge.weakness !== 'undefined') {
            baseDamage *= dailyModifiers.weakness.getMult(game.global.dailyChallenge.weakness.strength, game.global.dailyChallenge.weakness.stacks);
        }
        if (typeof game.global.dailyChallenge.oddTrimpNerf !== 'undefined' && ((game.global.world % 2) == 1)) {
            baseDamage *= dailyModifiers.oddTrimpNerf.getMult(game.global.dailyChallenge.oddTrimpNerf.strength);
        }
        if (typeof game.global.dailyChallenge.evenTrimpBuff !== 'undefined' && ((game.global.world % 2) == 0)) {
            baseDamage *= dailyModifiers.evenTrimpBuff.getMult(game.global.dailyChallenge.evenTrimpBuff.strength);
        }
        if (typeof game.global.dailyChallenge.rampage !== 'undefined') {
            baseDamage *= dailyModifiers.rampage.getMult(game.global.dailyChallenge.rampage.strength, game.global.dailyChallenge.rampage.stacks);
        }
    }
    //baseBlock
    baseBlock = game.global.soldierCurrentBlock;
    //baseHealth
    baseHealth = game.global.soldierHealthMax;

    //if (game.global.soldierHealth <= 0) return; //dont calculate stances when dead, cause the "current" numbers are not updated when dead.

    //D stance
    if (game.global.formation == 2)
        baseDamage /= 4;
    else if (game.global.formation != "0")
        baseDamage *= 2;

    //B stance
    if (game.global.formation == 3)
        baseBlock /= 4;
    else if (game.global.formation != "0")
        baseBlock *= 2;

    //H stance
    if (game.global.formation == 1)
        baseHealth /= 4;
    else if (game.global.formation != "0")
        baseHealth *= 2;
    //S stance is accounted for (combination of all the above's else clauses)
}

function calcOurDmg(number, maxormin, disableStances, disableFlucts) { //number = base attack
    var fluctuation = .2; //%fluctuation
    var maxFluct = -1;
    var minFluct = -1;
    //Situational Trimp damage increases
    if (game.global.radioStacks > 0) {
        number *= (1 - (game.global.radioStacks * 0.1));
    }
    if (game.global.antiStacks > 0) {
        number *= ((game.global.antiStacks * game.portal.Anticipation.level * game.portal.Anticipation.modifier) + 1);
        updateAntiStacks();
    }
    // if (!game.global.mapsActive && game.global.mapBonus > 0){
    // number *= ((game.global.mapBonus * .2) + 1);
    // }
    // if (game.global.titimpLeft >= 1 && game.global.mapsActive){
    // number *= 2;
    // }
    if (game.global.achievementBonus > 0) {
        number *= (1 + (game.global.achievementBonus / 100));
    }
    if (game.global.totalSquaredReward > 0) {
        number *= (1 + (game.global.totalSquaredReward / 100));
    }
    if (game.global.challengeActive == "Discipline") {
        fluctuation = .995;
    } else if (game.portal.Range.level > 0) {
        minFluct = fluctuation - (.02 * game.portal.Range.level);
    }
    if (game.global.challengeActive == "Decay") {
        number *= 5;
        number *= Math.pow(0.995, game.challenges.Decay.stacks);
    }
    if (game.global.roboTrimpLevel > 0) {
        number *= ((0.2 * game.global.roboTrimpLevel) + 1);
    }
    if (game.global.challengeActive == "Lead" && ((game.global.world % 2) == 1)) {
        number *= 1.5;
    }
    if (game.goldenUpgrades.Battle.currentBonus > 0) {
        number *= game.goldenUpgrades.Battle.currentBonus + 1;
    }
    if (game.talents.voidPower.purchased && game.global.voidBuff) {
        var vpAmt = (game.talents.voidPower2.purchased) ? 35 : 15;
        number *= ((vpAmt / 100) + 1);
    }

    if (game.global.challengeActive == "Daily") {
        if (typeof game.global.dailyChallenge.minDamage !== 'undefined') {
            if (minFluct == -1) minFluct = fluctuation;
            minFluct += dailyModifiers.minDamage.getMult(game.global.dailyChallenge.minDamage.strength);
        }
        if (typeof game.global.dailyChallenge.maxDamage !== 'undefined') {
            if (maxFluct == -1) maxFluct = fluctuation;
            maxFluct += dailyModifiers.maxDamage.getMult(game.global.dailyChallenge.maxDamage.strength);
        }
        if (typeof game.global.dailyChallenge.weakness !== 'undefined') {
            number *= dailyModifiers.weakness.getMult(game.global.dailyChallenge.weakness.strength, game.global.dailyChallenge.weakness.stacks);
        }
        if (typeof game.global.dailyChallenge.oddTrimpNerf !== 'undefined' && ((game.global.world % 2) == 1)) {
            number *= dailyModifiers.oddTrimpNerf.getMult(game.global.dailyChallenge.oddTrimpNerf.strength);
        }
        if (typeof game.global.dailyChallenge.evenTrimpBuff !== 'undefined' && ((game.global.world % 2) == 0)) {
            number *= dailyModifiers.evenTrimpBuff.getMult(game.global.dailyChallenge.evenTrimpBuff.strength);
        }
        if (typeof game.global.dailyChallenge.rampage !== 'undefined') {
            number *= dailyModifiers.rampage.getMult(game.global.dailyChallenge.rampage.strength, game.global.dailyChallenge.rampage.stacks);
        }
    }
    if (!disableStances) {
        //Formations
        if (game.global.formation == 2)
            number /= 4;
        else if (game.global.formation != "0")
            number *= 2;
    }
    if (!disableFlucts) {
        if (minFluct > 1) minFluct = 1;
        if (maxFluct == -1) maxFluct = fluctuation;
        if (minFluct == -1) minFluct = fluctuation;
        var min = Math.floor(number * (1 - minFluct));
        var max = Math.ceil(number + (number * maxFluct));

        //number = Math.floor(Math.random() * ((max + 1) - min)) + min;
        return maxormin ? max : min;
    } else
        return number;
}

function autoMap() {
    var customVars = MODULES["automaps"];
    //allow script to handle abandoning
    if (game.options.menu.alwaysAbandon.enabled == 1) toggleSetting('alwaysAbandon');
    //if we are prestige mapping, force equip first mode
    var prestige = autoTrimpSettings.Prestige.selected;
    if (prestige != "Off" && game.options.menu.mapLoot.enabled != 1) toggleSetting('mapLoot');
    //Control in-map right-side-buttons for people who can't control themselves. If you wish to use these buttons manually, turn off autoMaps temporarily.
    if (game.options.menu.repeatUntil.enabled == 2) toggleSetting('repeatUntil');
    if (game.options.menu.exitTo.enabled != 0) toggleSetting('exitTo');
    if (game.options.menu.repeatVoids.enabled != 0) toggleSetting('repeatVoids');
    //exit and do nothing if we are prior to zone 6 (maps haven't been unlocked):
    if (!game.global.mapsUnlocked || !(baseDamage > 0)) { //if we have no damage, why bother running anything? (this fixes weird bugs)
        enoughDamage = true;
        enoughHealth = true;
        shouldFarm = false;
        updateAutoMapsStatus(); //refresh the UI status (10x per second)
        return;
    }

    var AutoStance = getPageSetting('AutoStance');
    //if we are in mapology and we have no credits, exit
    if (game.global.challengeActive == "Mapology" && game.challenges.Mapology.credits < 1) return;
    //FIND VOID MAPS LEVEL:
    var voidMapLevelSetting = getPageSetting('VoidMaps');
    //decimal void maps are possible, using string function to avoid false float precision (0.29999999992). javascript can compare ints to strings anyway.
    var voidMapLevelSettingZone = (voidMapLevelSetting + "").split(".")[0];
    var voidMapLevelSettingMap = (voidMapLevelSetting + "").split(".")[1];
    if (voidMapLevelSettingMap === undefined || game.global.challengeActive == 'Lead')
        voidMapLevelSettingMap = 93;
    if (voidMapLevelSettingMap.length == 1) voidMapLevelSettingMap += "0"; //entering 187.70 becomes 187.7, this will bring it back to 187.70
    var voidsuntil = getPageSetting('RunNewVoidsUntil');
    needToVoid = voidMapLevelSetting > 0 && game.global.totalVoidMaps > 0 && game.global.lastClearedCell + 1 >= voidMapLevelSettingMap &&
        (game.global.world == voidMapLevelSettingZone ||
            (game.global.world >= voidMapLevelSettingZone && getPageSetting('RunNewVoids') && (voidsuntil == -1 || game.global.world <= voidsuntil)));
    if (game.global.totalVoidMaps == 0 || !needToVoid)
        doVoids = false;
    //calculate if we are behind on unlocking prestiges
    needPrestige = prestige != "Off" && game.mapUnlocks[prestige].last <= game.global.world - 5 && game.global.challengeActive != "Frugal";
    //dont need prestige if we are caught up, and have (2) unbought prestiges:
    if (getPageSetting('PrestigeSkipMode')) {
        var prestigeList = ['Dagadder', 'Megamace', 'Polierarm', 'Axeidic', 'Greatersword', 'Harmbalest', 'Bootboost', 'Hellishmet', 'Pantastic', 'Smoldershoulder', 'Bestplate', 'GambesOP'];
        var numUnbought = 0;
        for (var i = 0, len = prestigeList.length; i < len; i++) {
            var p = prestigeList[i];
            if (game.upgrades[p].allowed - game.upgrades[p].done > 0)
                numUnbought++;
        }
        if (numUnbought >= customVars.SkipNumUnboughtPrestiges) needPrestige = false;
    }

    //START CALCULATING DAMAGES:
    //calculate crits (baseDamage was calced in function autoStance)    this is a weighted average of nonCrit + Crit. (somewhere in the middle)
    ourBaseDamage = baseDamage;
    //calculate with map bonus
    var mapbonusmulti = 1 + (0.20 * game.global.mapBonus);
    //(autostance2 has mapbonusmulti built in)
    ourBaseDamage2 = ourBaseDamage; //keep a version without mapbonus
    ourBaseDamage *= mapbonusmulti;

    //get average enemyhealth and damage for the next zone, cell 50, snimp type and multiply it by a max range fluctuation of 1.2
    var enemyDamage;
    var enemyHealth;
    if (AutoStance <= 1) {
        enemyDamage = getEnemyMaxAttack(game.global.world, 99, 'Snimp', 1.2);
        enemyDamage = calcDailyAttackMod(enemyDamage); //daily mods: badStrength,badMapStrength,bloodthirst
    } else {
        enemyDamage = calcBadGuyDmg(null, getEnemyMaxAttack(game.global.world, 99, 'Snimp', 1.0), true, true); //(enemy,attack,daily,maxormin,[disableFlucts])
    }
    enemyHealth = getEnemyMaxHealth(game.global.world, 99);
    if (game.global.challengeActive == "Toxicity") {
        enemyHealth *= 2;
    }
    //Corruption Zone Proportionality Farming Calculator:
    var corrupt = game.global.world >= mutations.Corruption.start(true);
    if (getPageSetting('CorruptionCalc') && corrupt) {
        var cptnum = getCorruptedCellsNum(); //count corrupted cells
        var cpthlth = getCorruptScale("health"); //get corrupted health mod
        var cptpct = cptnum / 100; //percentage of zone which is corrupted.
        var hlthprop = cptpct * cpthlth; //Proportion of cells corrupted * health of a corrupted cell
        if (hlthprop >= 1) //dont allow sub-1 numbers to make the number less
            enemyHealth *= hlthprop;
        var cptatk = getCorruptScale("attack"); //get corrupted attack mod
        var atkprop = cptpct * cptatk; //Proportion of cells corrupted * attack of a corrupted cell
        if (atkprop >= 1)
            enemyDamage *= atkprop;
        //console.log("enemy dmg:" + enemyDamage + " enemy hp:" + enemyHealth + " base dmg: " + ourBaseDamage);
    }
    // enter farming if it takes over 4 hits in D stance (16) (and exit if under.)
    if (!getPageSetting('DisableFarm')) {
        shouldFarm = enemyHealth > (ourBaseDamage * customVars.farmingCutoff);
        if (game.options.menu.repeatUntil.enabled == 1) toggleSetting('repeatUntil'); //turn repeat forever on if farming is on.
    }

    //Lead specific farming calcuation section:
    if (game.global.challengeActive == 'Lead') {
        ourBaseDamage /= mapbonusmulti;
        if (AutoStance <= 1) {
            enemyDamage *= (1 + (game.challenges.Lead.stacks * 0.04));
        }
        enemyHealth *= (1 + (game.challenges.Lead.stacks * 0.04));
        //if the zone is odd:   (skip the +2 calc for the last level.
        if (game.global.world % 2 == 1 && game.global.world != 179) {
            //calculate for the next level in advance (since we only farm on odd, and evens are very tough)
            enemyDamage = getEnemyMaxAttack(game.global.world + 2, 50, 'Chimp', 1.2);
            enemyHealth = getEnemyMaxHealth(game.global.world + 2, 50);
            ourBaseDamage /= 1.5; //subtract the odd-zone bonus.
        }
        if (game.global.world == 179) {
            ourBaseDamage *= mapbonusmulti;
        }
        //let people disable this if they want.
        if (!getPageSetting('DisableFarm')) {
            shouldFarm = enemyHealth > (ourBaseDamage * customVars.LeadfarmingCutoff);
        }
    }
    //Enough Health and Damage calculations:
    var pierceMod = (game.global.brokenPlanet && !game.global.mapsActive) ? getPierceAmt() : 0;
    const FORMATION_MOD_1 = game.upgrades.Dominance.done ? 2 : 1;
    //const FORMATION_MOD_2 = game.upgrades.Dominance.done ? 4 : 1;
    //asks if we can survive x number of hits in either D stance or X stance.
    enoughHealth = (baseHealth / FORMATION_MOD_1 > customVars.numHitsSurvived * (enemyDamage - baseBlock / FORMATION_MOD_1 > 0 ? enemyDamage - baseBlock / FORMATION_MOD_1 : enemyDamage * pierceMod));
    enoughDamage = (ourBaseDamage * customVars.enoughDamageCutoff > enemyHealth);
    var enoughDamageNext = (game.global.mapBonus == 10) ? false : (ourBaseDamage / (mapbonusmulti) * (mapbonusmulti + 0.2) * customVars.enoughDamageCutoff > enemyHealth);

    shouldFarm = shouldFarm || mapsForFuel;
    //remove this in the meantime until it works for everyone.
    /*     if (!wantToScry) {
            //enough health if we can survive 8 hits in D stance (health/2 and block/2)
            enoughHealth = (baseHealth/2 > 8 * (enemyDamage - baseBlock/2 > 0 ? enemyDamage - baseBlock/2 : enemyDamage * pierceMod));
            //enough damage if we can one-shot the enemy in D (ourBaseDamage*4)
            enoughDamage = (ourBaseDamage * 4) > enemyHealth;
            scryerStuck = false;
        } else {
            //enough health if we can pass all the tests in autostance2 under the best of the worst conditions.
            //enough damage if we can one-shot the enemy in S (ourBaseDamage/2)
            var result = autoStanceCheck(true);
            enoughHealth = result[0];
            enoughDamage = result[1];
            scryerStuck = !enoughHealth;
        } */

    //Health:Damage ratio: (status)
    HDratio = enemyHealth / ourBaseDamage;
    updateAutoMapsStatus(); //refresh the UI status (10x per second)
    //var enoughHealth2enoughDamage2 = autoStanceCheck(false);
    HDratio = (HDratio >= 1) ? HDratio : (-1 / HDratio);
    //BEGIN AUTOMAPS DECISIONS:
    //variables for doing maps
    var selectedMap = "world";
    var shouldFarmLowerZone = false;
    shouldDoMaps = false;
    //prevents map-screen from flickering on and off during startup when base damage is 0.
    if (ourBaseDamage > 0) {
        shouldDoMaps = !enoughDamage || shouldFarm || scryerStuck; // || !enoughHealth2enoughDamage2[0];
    }

    if (mapTimeEstimate == 0) {
        var lastzone = lookUpZoneData(game.global.world - 1);
    }

    var shouldDoHealthMaps = false;
    //if we are at max map bonus (10), and we don't need to farm, don't do maps
    if (game.global.mapBonus >= customVars.maxMapBonus && !shouldFarm)
        shouldDoMaps = false;
    else if (game.global.mapBonus >= customVars.maxMapBonus && shouldFarm)
        shouldFarmLowerZone = getPageSetting('LowerFarmingZone');
    //do (1) map if we dont have enough health
    else if (game.global.mapBonus < customVars.wantHealthMapBonus && !enoughHealth && !shouldDoMaps && !needPrestige) {
        shouldDoMaps = true;
        shouldDoHealthMaps = true;
    }

    //FarmWhenNomStacks7
    var restartVoidMap = false;
    if (game.global.challengeActive == 'Nom' && getPageSetting('FarmWhenNomStacks7')) {
        //Get maxMapBonus (10) if we go above (7) stacks on Improbability (boss)
        if (game.global.gridArray[99].nomStacks > customVars.NomFarmStacksCutoff[0]) {
            if (game.global.mapBonus != customVars.maxMapBonus)
                shouldDoMaps = true;
        }
        //Go into maps on (30) stacks on Improbability (boss), farm until we fall under (10) H:D ratio
        if (game.global.gridArray[99].nomStacks == customVars.NomFarmStacksCutoff[1]) {
            shouldFarm = (HDratio > customVars.NomfarmingCutoff);
            shouldDoMaps = true;
        }
        //If we ever hit (100) nomstacks in the world, farm.
        if (!game.global.mapsActive && game.global.gridArray[game.global.lastClearedCell + 1].nomStacks >= customVars.NomFarmStacksCutoff[2]) {
            shouldFarm = (HDratio > customVars.NomfarmingCutoff);
            shouldDoMaps = true;
        }
        //If we ever hit (100) nomstacks in a map (likely a voidmap), farm, (exit the voidmap and prevent void from running, until situation is clear)
        if (game.global.mapsActive && game.global.mapGridArray[game.global.lastClearedMapCell + 1].nomStacks >= customVars.NomFarmStacksCutoff[2]) {
            shouldFarm = (HDratio > customVars.NomfarmingCutoff);
            shouldDoMaps = true;
            restartVoidMap = true;
        }
    }

    //Disable Farm mode if we have nothing left to farm for (prevent infinite farming)
    if (shouldFarm && !needPrestige) {
        //check if we have cap to 10 equip on, and we are capped for all attack weapons
        var capped = areWeAttackLevelCapped();
        //check if we have any additional prestiges available to unlock:
        var prestigeitemsleft;
        if (game.global.mapsActive) {
            prestigeitemsleft = addSpecials(true, true, getCurrentMapObject());
        } else if (lastMapWeWereIn) {
            prestigeitemsleft = addSpecials(true, true, lastMapWeWereIn);
        }
        //check if we have unbought+available prestiges
        var prestigeList = ['Dagadder', 'Megamace', 'Polierarm', 'Axeidic', 'Greatersword', 'Harmbalest'];
        var numUnbought = 0;
        for (var i = 0, len = prestigeList.length; i < len; i++) {
            var p = prestigeList[i];
            if (game.upgrades[p].allowed - game.upgrades[p].done > 0)
                numUnbought++;
        }
        //Disable farm mode, only do up to mapbonus.
        if (capped && prestigeitemsleft == 0 && numUnbought == 0 && !mapsForFuel) {
            shouldFarm = false;
            if (game.global.mapBonus >= customVars.maxMapBonus && !shouldFarm)
                shouldDoMaps = false;
        }
    }

    //stack tox stacks if we are doing max tox, or if we need to clear our void maps
    if (game.global.challengeActive == 'Toxicity' && game.global.lastClearedCell > 93 && game.challenges.Toxicity.stacks < 1500 && ((getPageSetting('MaxTox') && game.global.world > 59) || needToVoid)) {
        shouldDoMaps = true;
        //we will get at least 85 toxstacks from the 1st voidmap (unless we have overkill)
        //            if (!game.portal.Overkill.locked && game.stats.cellsOverkilled.value)

        stackingTox = !(needToVoid && game.challenges.Toxicity.stacks > 1415);
        //force abandon army
        if (!game.global.mapsActive && !game.global.preMapsActive) {
            mapsClicked();
            mapsClicked();
        }
    } else stackingTox = false;

    //during 'watch' challenge, run maps on these levels:
    var watchmaps = customVars.watchChallengeMaps;
    var shouldDoWatchMaps = false;
    if (game.global.challengeActive == 'Watch' && watchmaps.indexOf(game.global.world) > -1 && game.global.mapBonus < 1) {
        shouldDoMaps = true;
        shouldDoWatchMaps = true;
    }
    //Farm X Minutes Before Spire:
    var shouldDoSpireMaps = false;
    var needFarmSpire = game.global.world == 200 && game.global.spireActive && (((new Date().getTime() - game.global.zoneStarted) / 1000 / 60) < getPageSetting('MinutestoFarmBeforeSpire'));
    if (needFarmSpire) {
        shouldDoMaps = true;
        shouldDoSpireMaps = true;
    }
    //Run a single map to get nurseries when blacksmithery is purchased
    if (game.talents.blacksmith.purchased && game.buildings.Nursery.locked && game.global.world >= customVars.NurseryMapLevel) {
        shouldDoMaps = true;
        shouldDoWatchMaps = true;
    }

    //Dynamic Siphonology section (when necessary)
    //Lower Farming Zone = Lowers the zone used during Farming mode. Starts 10 zones below current and Finds the minimum map level you can successfully one-shot
    var siphlvl = shouldFarmLowerZone ? game.global.world - 10 : game.global.world - game.portal.Siphonology.level;
    var ovkillsiphlvl = 0;
    var mapHealthMultiplier = 1;
    if (game.global.challengeActive == "Daily") {
        if (typeof game.global.dailyChallenge.badMapHealth !== 'undefined') {
            mapHealthMultiplier = dailyModifiers.badMapHealth.getMult(game.global.dailyChallenge.badMapHealth.strength);
        }
    }
    var maxlvl = game.talents.mapLoot.purchased ? game.global.world - 1 : game.global.world;
    if (getPageSetting('DynamicSiphonology') || shouldFarmLowerZone) {
        if (game.portal.Overkill.level > 0) {
            var maphp = getEnemyMaxHealth(siphlvl - 1) * 1.1 * mapHealthMultiplier; // 1.1 mod is for all maps (taken out of the function)
            var cpthlth = getCorruptScale("health") / 2; //get corrupted health mod
            if (mutations.Magma.active())
                maphp *= cpthlth;
            var mapdmg = ourBaseDamage2 * (game.unlocks.imps.Titimp ? 2 : 1); // *2 for titimp. (ourBaseDamage2 has no mapbonus in it)
            if (game.upgrades.Dominance.done && !getPageSetting('ScryerUseinMaps2'))
                mapdmg *= 4; //dominance stance and not-scryer stance in maps.
            if (game.portal.Overkill.level > 0) {
                if (mapdmg > maphp * (1 + 200 / game.portal.Overkill.level)) {
                    ovkillsiphlvl = siphlvl;
                }
            }
        }

        for (siphlvl; siphlvl < maxlvl; siphlvl++) {
            //check HP vs damage and find how many siphonology levels we need.
            var maphp = getEnemyMaxHealth(siphlvl) * 1.1 * mapHealthMultiplier; // 1.1 mod is for all maps (taken out of the function)
            var cpthlth = getCorruptScale("health") / 2; //get corrupted health mod
            if (mutations.Magma.active())
                maphp *= cpthlth;
            var mapdmg = ourBaseDamage2 * (game.unlocks.imps.Titimp ? 2 : 1); // *2 for titimp. (ourBaseDamage2 has no mapbonus in it)
            if (game.upgrades.Dominance.done && !getPageSetting('ScryerUseinMaps2'))
                mapdmg *= 4; //dominance stance and not-scryer stance in maps.
            if (game.portal.Overkill.level > 0) {
                if (mapdmg > maphp * (1 + 200 / game.portal.Overkill.level)) {
                    ovkillsiphlvl = siphlvl + 1;
                }
            }
            if (mapdmg < maphp) {
                break;
            }
        }
        if (ovkillsiphlvl > siphlvl - 4) {
            siphlvl = ovkillsiphlvl;
        }
    }
    var obj = {};
    var siphonMap = -1;
    for (var map in game.global.mapsOwnedArray) {
        if (!game.global.mapsOwnedArray[map].noRecycle) {
            obj[map] = game.global.mapsOwnedArray[map].level;
            if (game.global.mapsOwnedArray[map].level == siphlvl)
                siphonMap = map;
        }
    }
    var keysSorted = Object.keys(obj).sort(function(a, b) {
        return obj[b] - obj[a];
    });
    //if there are no non-unique maps, there will be nothing in keysSorted, so set to create a map
    var highestMap;
    if (keysSorted[0])
        highestMap = keysSorted[0];
    else
        selectedMap = "create";

    //Look through all the maps we have - find Uniques and figure out if we need to run them.
    for (var map in game.global.mapsOwnedArray) {
        var theMap = game.global.mapsOwnedArray[map];
        if (theMap.noRecycle && getPageSetting('RunUniqueMaps')) {
            if (theMap.name == 'The Wall' && game.upgrades.Bounty.allowed == 0 && !game.talents.bounty.purchased) {
                (theMap.name == 'Trimple Of Doom' && (game.global.challengeActive == "Meditate" || game.global.challengeActive == "Trapper"))
                var theMapDifficulty = Math.ceil(theMap.difficulty / 2);
                if (game.global.world < 15 + theMapDifficulty) continue;
                selectedMap = theMap.id;
                break;
            }
            if (theMap.name == 'Dimension of Anger' && document.getElementById("portalBtn").style.display == "none" && !game.talents.portal.purchased) {
                var theMapDifficulty = Math.ceil(theMap.difficulty / 2);
                if (game.global.world < 20 + theMapDifficulty) continue;
                selectedMap = theMap.id;
                break;
            }
            //run the prison only if we are 'cleared' to run level 80 + 1 level per 200% difficulty. Could do more accurate calc if needed
            if (theMap.name == 'The Prison' && (game.global.challengeActive == "Electricity" || game.global.challengeActive == "Mapocalypse")) {
                var theMapDifficulty = Math.ceil(theMap.difficulty / 2);
                if (game.global.world < 80 + theMapDifficulty) continue;
                selectedMap = theMap.id;
                break;
            }
            if (theMap.name == 'The Block' && !game.upgrades.Shieldblock.allowed && (game.global.challengeActive == "Scientist" || game.global.challengeActive == "Trimp" || getPageSetting('BuyShieldblock'))) {
                var theMapDifficulty = Math.ceil(theMap.difficulty / 2);
                if (game.global.world < 11 + theMapDifficulty) continue;
                selectedMap = theMap.id;
                break;
            }
            if (theMap.name == 'Trimple Of Doom' && game.global.challengeActive == "Meditate") {
                var theMapDifficulty = Math.ceil(theMap.difficulty / 2);
                if (game.global.world < 33 + theMapDifficulty) continue;
                selectedMap = theMap.id;
                break;
            }
            if (theMap.name == 'Bionic Wonderland' && game.global.challengeActive == "Crushed") {
                var theMapDifficulty = Math.ceil(theMap.difficulty / 2);
                if (game.global.world < 125 + theMapDifficulty) continue;
                selectedMap = theMap.id;
                break;
            }
            //run Bionics before spire to farm.
            if (getPageSetting('RunBionicBeforeSpire') && (game.global.world == 200) && theMap.name.includes('Bionic Wonderland')) {
                //this is how to check if a bionic is green or not.
                var bionicnumber = 1 + ((theMap.level - 125) / 15);
                //if numbers match, map is green, so run it. (do the pre-requisite bionics one at a time in order)
                if (bionicnumber == game.global.bionicOwned && bionicnumber < 6) {
                    selectedMap = theMap.id;
                    break;
                }
                if (shouldDoSpireMaps && theMap.name == 'Bionic Wonderland VI') {
                    selectedMap = theMap.id;
                    break;
                }
            }
            //other unique maps here
        }
    }
    //VOIDMAPS:
    //voidArray: make an array with all our voidmaps, so we can sort them by real-world difficulty level
    var voidArray = [];
    //values are easiest to hardest. (hardest has the highest value)
    var prefixlist = {
        'Deadly': 10,
        'Heinous': 11,
        'Poisonous': 20,
        'Destructive': 30
    };
    var prefixkeys = Object.keys(prefixlist);
    var suffixlist = {
        'Descent': 7.077,
        'Void': 8.822,
        'Nightmare': 9.436,
        'Pit': 10.6
    };
    var suffixkeys = Object.keys(suffixlist);
    for (var map in game.global.mapsOwnedArray) {
        var theMap = game.global.mapsOwnedArray[map];
        if (theMap.location == 'Void') {
            for (var pre in prefixkeys) {
                if (theMap.name.includes(prefixkeys[pre]))
                    theMap.sortByDiff = 1 * prefixlist[prefixkeys[pre]];
            }
            for (var suf in suffixkeys) {
                if (theMap.name.includes(suffixkeys[suf]))
                    theMap.sortByDiff += 1 * suffixlist[suffixkeys[suf]];
            }
            voidArray.push(theMap);
        }
    }
    //sort the array (harder/highvalue last):
    var voidArraySorted = voidArray.sort(function(a, b) {
        return a.sortByDiff - b.sortByDiff;
    });
    for (var map in voidArraySorted) {
        var theMap = voidArraySorted[map];
        //Only proceed if we needToVoid right now.
        if (needToVoid) {
            //if we are on toxicity, don't clear until we will have max stacks at the last cell.
            if (game.global.challengeActive == 'Toxicity' && game.challenges.Toxicity.stacks < (1500 - theMap.size)) break;
            doVoids = true;
            //check to make sure we won't get 1-shot in nostance by boss
            var eAttack = getEnemyMaxAttack(game.global.world, theMap.size, 'Voidsnimp', theMap.difficulty);
            if (game.global.world >= 181 || (game.global.challengeActive == "Corrupted" && game.global.world >= 60))
                eAttack *= (getCorruptScale("attack") / 2).toFixed(1);
            //TODO: Account for magmated voidmaps. (not /2)
            //TODO: Account for daily.
            var ourHealth = baseHealth;
            if (game.global.challengeActive == 'Balance') {
                var stacks = game.challenges.Balance.balanceStacks ? (game.challenges.Balance.balanceStacks > theMap.size) ? theMap.size : game.challenges.Balance.balanceStacks : false;
                eAttack *= 2;
                if (stacks) {
                    for (i = 0; i < stacks; i++) {
                        ourHealth *= 1.01;
                    }
                }
            }
            if (game.global.challengeActive == 'Toxicity') eAttack *= 5;
            //break to prevent finishing map to finish a challenge?
            //continue to check for doable map?
            var diff = parseInt(getPageSetting('VoidCheck')) > 0 ? parseInt(getPageSetting('VoidCheck')) : 2;
            var ourBlock = getBattleStats("block", true); //use block tooltip (after death block) instead of current army block.
            if (ourHealth / diff < eAttack - ourBlock) {
                shouldFarm = true;
                voidCheckPercent = Math.round((ourHealth / diff) / (eAttack - ourBlock) * 100);
                abandonVoidMap(); //exit/restart if below <95% health, we have ForceAbandon on, and its not due to randomly losing anti stacks
                break;
            } else {
                voidCheckPercent = 0;
                if (getPageSetting('DisableFarm'))
                    shouldFarm = shouldFarm || false;
            }
            //only go into the voidmap if we need to.
            if (!restartVoidMap)
                selectedMap = theMap.id;
            //Restart the voidmap if we hit (100) nomstacks on the final boss
            if (game.global.mapsActive && getCurrentMapObject().location == "Void" && game.global.challengeActive == "Nom" && getPageSetting('FarmWhenNomStacks7')) {
                if (game.global.mapGridArray[theMap.size - 1].nomStacks >= customVars.NomFarmStacksCutoff[2]) {
                    mapsClicked(true);
                }
            }
            break;
        }
    }
    //MAPS CREATION pt1:
    //map if we don't have health/dmg or we need to clear void maps or if we are prestige mapping, and our set item has a new prestige available
    if (shouldDoMaps || doVoids || needPrestige) {
        //selectedMap = world here if we haven't set it to create yet, meaning we found appropriate high level map, or siphon map
        if (selectedMap == "world") {
            //if needFarmSpire x minutes is true, switch over from wood maps to metal maps.
            if (needFarmSpire) {
                var spiremaplvl = (game.talents.mapLoot.purchased && MODULES["automaps"].SpireFarm199Maps) ? 199 : 200;
                if (game.global.mapsOwnedArray[highestMap].level >= spiremaplvl && game.global.mapsOwnedArray[highestMap].location == ((customVars.preferGardens && game.global.decayDone) ? 'Plentiful' : 'Mountain'))
                    selectedMap = game.global.mapsOwnedArray[highestMap].id;
                else
                    selectedMap = "create";
                //if needPrestige, TRY to find current level map as the highest level map we own.
            } else if (needPrestige) {
                if (game.global.world == game.global.mapsOwnedArray[highestMap].level)
                    selectedMap = game.global.mapsOwnedArray[highestMap].id;
                else
                    selectedMap = "create";
                //if shouldFarm is true, use a siphonology adjusted map, as long as we aren't trying to prestige
            } else if (siphonMap != -1)
                selectedMap = game.global.mapsOwnedArray[siphonMap].id;
            //if we dont' have an appropriate max level map, or a siphon map, we need to make one
            else
                selectedMap = "create";
        }
        //if selectedMap != world, it already has a map ID and will be run below
    }
    //LEAD EVEN ZONE EXIT
    //don't map on even worlds if on Lead Challenge, except if person is dumb and wants to void on even
    if (game.global.challengeActive == 'Lead' && !doVoids && (game.global.world % 2 == 0 || game.global.lastClearedCell < customVars.shouldFarmCell)) {
        if (game.global.preMapsActive)
            mapsClicked();
        return; //exit
    }
    //REPEAT BUTTON:
    //Repeat Button Management (inside a map):
    if (!game.global.preMapsActive && game.global.mapsActive) {
        //Set the repeatBionics flag (farm bionics before spire), for the repeat button management code.
        var repeatBionics = getPageSetting('RunBionicBeforeSpire') && game.global.bionicOwned >= 6;
        //if we are doing the right map, and it's not a norecycle (unique) map, and we aren't going to hit max map bonus
        //or repeatbionics is true and there are still prestige items available to get
        if (selectedMap == game.global.currentMapId && (!getCurrentMapObject().noRecycle && (game.global.mapBonus < customVars.maxMapBonus - 1 || shouldFarm || stackingTox || needPrestige || shouldDoSpireMaps) || repeatBionics)) {
            var targetPrestige = autoTrimpSettings.Prestige.selected;
            //make sure repeat map is on
            if (!game.global.repeatMap) {
                repeatClicked();
            }
            if (!enoughDamage && enoughDamageNext) {
                repeatClicked();
            }
            //if we aren't here for dmg/hp, and we see the prestige we are after on the last cell of this map, and it's the last one available, turn off repeat to avoid an extra map cycle
            if (!shouldDoMaps && (game.global.mapGridArray[game.global.mapGridArray.length - 1].special == targetPrestige && game.mapUnlocks[targetPrestige].last >= game.global.world - 9)) {
                repeatClicked();
            }
            //avoid another map cycle due to having the amount of tox stacks we need.
            if (stackingTox && (game.challenges.Toxicity.stacks + game.global.mapGridArray.length - (game.global.lastClearedMapCell + 1) >= 1500)) {
                repeatClicked();
            }
            //turn off repeat maps if we doing Watch maps.
            if (shouldDoWatchMaps)
                repeatClicked();
            //turn repeat off on the last WantHealth map.
            if (shouldDoHealthMaps && game.global.mapBonus >= customVars.wantHealthMapBonus - 1)
                repeatClicked();
        } else {
            //otherwise, make sure repeat map is off
            if (game.global.repeatMap) {
                repeatClicked();
            }
            if (restartVoidMap) {
                mapsClicked(true);
            }
        }
        //FORCE EXIT WORLD->MAPS
        //clicks the maps button, once or twice (inside the world):
    } else if (!game.global.preMapsActive && !game.global.mapsActive) {
        if (selectedMap != "world") {
            //if we should not be in the world, and the button is not already clicked, click map button once (and wait patiently until death)
            if (!game.global.switchToMaps) {
                mapsClicked();
            }
            //Get Impatient/Abandon if: (need prestige / _NEED_ to do void maps / on lead in odd world.) AND (a new army is ready, OR _need_ to void map OR lead farming and we're almost done with the zone) (handle shouldDoWatchMaps elsewhere below)
            if (game.global.switchToMaps && !shouldDoWatchMaps &&
                (needPrestige || doVoids ||
                    (game.global.challengeActive == 'Lead' && game.global.world % 2 == 1) ||
                    (!enoughDamage && enoughHealth && game.global.lastClearedCell < 9) ||
                    (shouldFarm && game.global.lastClearedCell >= customVars.shouldFarmCell) ||
                    (scryerStuck)) &&
                (
                    (game.resources.trimps.realMax() <= game.resources.trimps.owned + 1) ||
                    (game.global.challengeActive == 'Lead' && game.global.lastClearedCell > 93) ||
                    (doVoids && game.global.lastClearedCell > 93)
                )
            ) {
                //output stuck message
                if (scryerStuck) {
                    debug("Got perma-stuck on cell " + (game.global.lastClearedCell + 2) + " during scryer stance. Are your scryer settings correct? Entering map to farm to fix it.");
                }
                mapsClicked();
            }
        }
        //forcibly run watch maps (or click to restart voidmap?)
        if (shouldDoWatchMaps) {
            mapsClicked();
        }
        //MAPS CREATION pt2:
    } else if (game.global.preMapsActive) {
        if (selectedMap == "world") {
            mapsClicked(); //go back
        } else if (selectedMap == "create") {
            document.getElementById("mapLevelInput").value = needPrestige ? game.global.world : siphlvl;
            var decrement; //['size','diff','loot']
            var tier; //taken from MODULES vars at the top of this file.
            //instead of normal map locations, use Plentiful (Gardens) if the Decay challenge has been completed. (for +25% better loot)
            var useGardens = (customVars.preferGardens && game.global.decayDone);
            if (game.global.world >= customVars.MapTierZone[0]) {
                //Zone 72+ (old: 9/9/9 Metal):
                tier = customVars.MapTier0Sliders;
                decrement = [];
            } else if (game.global.world >= customVars.MapTierZone[1]) {
                //Zone 47-72 (old: 9/9/4 Metal):
                tier = customVars.MapTier1Sliders;
                decrement = ['loot'];
            } else if (game.global.world >= customVars.MapTierZone[2]) {
                //Zone 16-47 (old: 9/9/0 Random):
                tier = customVars.MapTier2Sliders;
                decrement = ['loot'];
            } else {
                //Zone 6-16 (old: 9/0/0 Random):
                tier = customVars.MapTier3Sliders;
                decrement = ['diff', 'loot'];
            }
            //NEW: start all maps off on 9/9/9 sliders and decrement from there.
            sizeAdvMapsRange.value = tier[0];
            adjustMap('size', tier[0]);
            difficultyAdvMapsRange.value = tier[1];
            adjustMap('difficulty', tier[1]);
            lootAdvMapsRange.value = tier[2];
            adjustMap('loot', tier[2]);
            biomeAdvMapsSelect.value = useGardens ? "Plentiful" : tier[3];
            //choose spire level 199 or 200
            if (needFarmSpire && MODULES["automaps"].SpireFarm199Maps)
                document.getElementById("mapLevelInput").value = game.talents.mapLoot.purchased ? 199 : 200;
            //recalculate cost.
            updateMapCost();
            //if we are "Farming" for resources, make sure it's Plentiful OR metal (and always aim for lowest difficulty)
            if (shouldFarm || !enoughDamage || !enoughHealth || game.global.challengeActive == 'Metal') {
                biomeAdvMapsSelect.value = useGardens ? "Plentiful" : "Mountain";
                updateMapCost();
            }
            //set up various priorities for various situations
            if (updateMapCost(true) > game.resources.fragments.owned) {
                if (needPrestige && !enoughDamage) decrement.push('diff');
                if (shouldFarm) decrement.push('size');
            }
            //Decrement 1 - use priorities first:
            //if we STILL cant afford the map, lower the loot slider (less loot)
            while (decrement.indexOf('loot') > -1 && lootAdvMapsRange.value > 0 && updateMapCost(true) > game.resources.fragments.owned) {
                lootAdvMapsRange.value -= 1;
            }
            //default: if we can't afford the map:
            //Put a priority on small size, and increase the difficulty? for high Helium that just wants prestige = yes.
            //Really just trying to prevent prestige mapping from getting stuck
            while (decrement.indexOf('diff') > -1 && difficultyAdvMapsRange.value > 0 && updateMapCost(true) > game.resources.fragments.owned) {
                difficultyAdvMapsRange.value -= 1;
            }
            //if we still cant afford the map, lower the size slider (make it larger) (doesn't matter much for farming.)
            while (decrement.indexOf('size') > -1 && sizeAdvMapsRange.value > 0 && updateMapCost(true) > game.resources.fragments.owned) {
                sizeAdvMapsRange.value -= 1;
            }
            //Decrement 2 - if its still too expensive:
            //if we STILL cant afford the map, lower the loot slider (less loot)
            while (lootAdvMapsRange.value > 0 && updateMapCost(true) > game.resources.fragments.owned) {
                lootAdvMapsRange.value -= 1;
            }
            //default: if we can't afford the map:
            //Put a priority on small size, and increase the difficulty? for high Helium that just wants prestige = yes.
            //Really just trying to prevent prestige mapping from getting stuck
            while (difficultyAdvMapsRange.value > 0 && updateMapCost(true) > game.resources.fragments.owned) {
                difficultyAdvMapsRange.value -= 1;
            }
            //if we still cant afford the map, lower the size slider (make it larger) (doesn't matter much for farming.)
            while (sizeAdvMapsRange.value > 0 && updateMapCost(true) > game.resources.fragments.owned) {
                sizeAdvMapsRange.value -= 1;
            }

            //if we can't afford the map we designed, pick our highest existing map
            var maplvlpicked = document.getElementById("mapLevelInput").value;
            if (updateMapCost(true) > game.resources.fragments.owned) {
                selectMap(game.global.mapsOwnedArray[highestMap].id);
                debug("Can't afford the map we designed, #" + maplvlpicked, "maps", '*crying2');
                debug("..picking our highest map:# " + game.global.mapsOwnedArray[highestMap].id + " Level: " + game.global.mapsOwnedArray[highestMap].level, "maps", '*happy2');
                runMap();
                lastMapWeWereIn = getCurrentMapObject();
            } else {
                debug("BUYING a Map, level: #" + maplvlpicked, "maps", 'th-large');
                var result = buyMap();
                if (result == -2) {
                    debug("Too many maps, recycling now: ", "maps", 'th-large');
                    recycleBelow(true);
                    debug("Retrying BUYING a Map, level: #" + maplvlpicked, "maps", 'th-large');
                    buyMap();
                }
            }
            //if we already have a map picked, run it
        } else {
            selectMap(selectedMap);
            var themapobj = game.global.mapsOwnedArray[getMapIndex(selectedMap)];
            var levelText = " Level: " + themapobj.level;
            var voidorLevelText = themapobj.location == "Void" ? " Void: " : levelText;
            debug("Already have a map picked: Running map: " + selectedMap + voidorLevelText + " Name: " + themapobj.name, "maps", 'th-large');
            runMap();
            lastMapWeWereIn = getCurrentMapObject();
        }
    }
    if (!game.global.mapsActive && !game.global.preMapsActive && mapsForFuel) {
        if (!game.global.switchToMaps) {
            mapsClicked();
        }
        if (game.global.switchToMaps) {
            mapsClicked();
        }
    }
}

function getBattleStats(what, form, crit) {
    var currentCalc = 0;
    //  var maxFluct = 0.2;
    //  var minFluct = 0.2;
    if (what == "health" || what == "attack") {
        currentCalc += (what == "health") ? 50 : 6;
        /*      if (what == "attack"){
                    //Discipline
                    if (game.global.challengeActive == "Discipline"){
                        minFluct = 0.995;
                        maxFluct = 0.995;
                    }
                    else {
                        //Range
                            if (game.portal.Range.level > 0){
                                minFluct -= (0.02 * game.portal.Range.level);
                            }
                        //MinDamageDaily
                            if (typeof game.global.dailyChallenge.minDamage !== 'undefined'){
                                var addMin = dailyModifiers.minDamage.getMult(game.global.dailyChallenge.minDamage.strength);
                                minFluct += addMin;
                                if (minFluct > 1) minFluct = 1;
                            }
                        //MaxDamageDaily
                            if (typeof game.global.dailyChallenge.maxDamage !== 'undefined'){
                                var addMax = dailyModifiers.maxDamage.getMult(game.global.dailyChallenge.maxDamage.strength);
                                maxFluct += addMax;
                            }
                    }
                } */
        for (var equip in game.equipment) {
            var temp = game.equipment[equip];
            if (typeof temp[what] === 'undefined' || temp.level <= 0 || temp.blockNow) continue;
            var equipStrength = temp[what + "Calculated"] * temp.level;
            currentCalc += equipStrength;
        }
    } else if (what == "block") {
        //Add Gym
        var gym = game.buildings.Gym;
        if (gym.owned > 0) {
            var gymStrength = gym.owned * gym.increase.by;
            currentCalc += gymStrength;
        }
        var shield = game.equipment.Shield;
        if (shield.blockNow && shield.level > 0) {
            var shieldStrength = shield.level * shield.blockCalculated;
            currentCalc += shieldStrength;
        }
        var trainer = game.jobs.Trainer;
        if (trainer.owned > 0) {
            var trainerStrength = trainer.owned * (trainer.modifier / 100);
            trainerStrength = calcHeirloomBonus("Shield", "trainerEfficiency", trainerStrength);
            currentCalc *= (trainerStrength + 1);
        }
    }
    //Add coordination
    currentCalc *= game.resources.trimps.maxSoldiers;
    //Add challengeSquared
    if (what != "block" && game.global.totalSquaredReward > 0) {
        currentCalc *= 1 + (game.global.totalSquaredReward / 100)
    }
    //Add achievements
    if (what == "attack" && game.global.achievementBonus > 0) {
        currentCalc *= 1 + (game.global.achievementBonus / 100);
    }
    //Add perk
    var perk = "";
    if (what == "health") perk = "Toughness";
    if (what == "attack") perk = "Power";
    if (perk && game.portal[perk].level > 0) {
        var PerkStrength = (game.portal[perk].level * game.portal[perk].modifier);
        currentCalc *= (PerkStrength + 1);
    }
    perk = perk + "_II";
    if (game.portal[perk] && game.portal[perk].level > 0) {
        var PerkStrength = (game.portal[perk].level * game.portal[perk].modifier);
        currentCalc *= (PerkStrength + 1);
    }
    //Add resilience
    if (what == "health" && game.portal.Resilience.level > 0) {
        var resStrength = Math.pow(game.portal.Resilience.modifier + 1, game.portal.Resilience.level);
        currentCalc *= resStrength;
    }
    //Add Geneticist
    var geneticist = game.jobs.Geneticist;
    if (geneticist.owned > 0 && what == "health") {
        var geneticistStrength = Math.pow(1.01, game.global.lastLowGen);
        currentCalc *= geneticistStrength;
    }
    //Add Anticipation
    var anticipation = game.portal.Anticipation;
    if (anticipation.level > 0 && what == "attack") {
        var antiStrength = ((anticipation.level * anticipation.modifier * game.global.antiStacks) + 1);
        currentCalc *= antiStrength;
    }
    //Add formations
    if (form && game.global.formation > 0) {
        var formStrength = 0.5;
        if ((game.global.formation == 1 && what == "health") || (game.global.formation == 2 && what == "attack") || (game.global.formation == 3 && what == "block")) formStrength = 4;
        currentCalc *= formStrength;
    }
    //radiostacks increases from "Electricity" || "Mapocalypse"
    if (game.global.radioStacks > 0 && what == "attack") {
        currentCalc *= (1 - (game.global.radioStacks * 0.1));
    }
    //Add Titimp
    if (game.global.titimpLeft > 1 && game.global.mapsActive && what == "attack") {
        currentCalc *= 2;
    }
    //Add map bonus
    if (!game.global.mapsActive && game.global.mapBonus > 0 && what == "attack") {
        var mapBonusMult = 0.2 * game.global.mapBonus;
        currentCalc *= (1 + mapBonusMult);
        mapBonusMult *= 100;
    }
    //Add RoboTrimp
    if (what == "attack" && game.global.roboTrimpLevel > 0) {
        var roboTrimpMod = 0.2 * game.global.roboTrimpLevel;
        currentCalc *= (1 + roboTrimpMod);
        roboTrimpMod *= 100;
    }
    //Add challenges
    if (what == "health" && game.global.challengeActive == "Balance") {
        currentCalc *= game.challenges.Balance.getHealthMult();
    }
    if (what == "attack" && game.global.challengeActive == "Lead" && ((game.global.world % 2) == 1)) {
        currentCalc *= 1.5;
    }
    var heirloomBonus = calcHeirloomBonus("Shield", "trimp" + capitalizeFirstLetter(what), 0, true);
    if (heirloomBonus > 0) {
        currentCalc *= ((heirloomBonus / 100) + 1);
    }
    if (game.global.challengeActive == "Decay" && what == "attack") {
        currentCalc *= 5;
        var stackStr = Math.pow(0.995, game.challenges.Decay.stacks);
        currentCalc *= stackStr;
    }
    if (game.global.challengeActive == "Daily") {
        var mult = 0;
        if (typeof game.global.dailyChallenge.weakness !== 'undefined' && what == "attack") {
            mult = dailyModifiers.weakness.getMult(game.global.dailyChallenge.weakness.strength, game.global.dailyChallenge.weakness.stacks);
            currentCalc *= mult;
        }
        if (typeof game.global.dailyChallenge.oddTrimpNerf !== 'undefined' && what == "attack" && (game.global.world % 2 == 1)) {
            mult = dailyModifiers.oddTrimpNerf.getMult(game.global.dailyChallenge.oddTrimpNerf.strength);
            currentCalc *= mult;
        }
        if (typeof game.global.dailyChallenge.evenTrimpBuff !== 'undefined' && what == "attack" && (game.global.world % 2 == 0)) {
            mult = dailyModifiers.evenTrimpBuff.getMult(game.global.dailyChallenge.evenTrimpBuff.strength);
            currentCalc *= mult;
        }
        if (typeof game.global.dailyChallenge.rampage !== 'undefined' && what == "attack") {
            mult = dailyModifiers.rampage.getMult(game.global.dailyChallenge.rampage.strength, game.global.dailyChallenge.rampage.stacks);
            currentCalc *= mult;
        }
    }
    //Add golden battle
    if (what != "block" && game.goldenUpgrades.Battle.currentBonus > 0) {
        amt = game.goldenUpgrades.Battle.currentBonus;
        currentCalc *= 1 + amt;
    }
    if (what != "block" && game.talents.voidPower.purchased && game.global.voidBuff) {
        amt = (game.talents.voidPower2.purchased) ? 35 : 15;
        currentCalc *= (1 + (amt / 100));
    }
    //Magma
    if (mutations.Magma.active() && (what == "attack" || what == "health")) {
        mult = mutations.Magma.getTrimpDecay();
        var lvls = game.global.world - mutations.Magma.start() + 1;
        currentCalc *= mult;
    }
    if (crit) {
        var critChance = getPlayerCritChance();
        if (what == "attack" && critChance) {
            currentCalc *= getPlayerCritDamageMult();
        }
    }
    return currentCalc;
}

function useScryerStance() {
    var AutoStance = getPageSetting('AutoStance');

    function autostancefunction() {
        if (AutoStance <= 1) autoStance(); //"Auto Stance"
        else if (AutoStance == 2) autoStance2(); //"Auto Stance #2"
    };
    //check preconditions   (exit quick, if impossible to use)
    var use_auto = game.global.preMapsActive || game.global.gridArray.length === 0 || game.global.highestLevelCleared < 180;
    use_auto = use_auto || game.global.world <= 60;
    if (use_auto) {
        autostancefunction();
        wantToScry = false;
        return;
    }

    if (AutoStance <= 1)
        calcBaseDamageinX(); //calculate internal script variables normally processed by autostance.
    else if (AutoStance == 2)
        calcBaseDamageinX2(); //calculate method #2
    var missingHealth = game.global.soldierHealthMax - game.global.soldierHealth;
    var newSquadRdy = game.resources.trimps.realMax() <= game.resources.trimps.owned + 1;
    var form = game.global.formation;
    var oktoswitch = true;
    var die = getPageSetting('ScryerDieToUseS');
    if (form == 0 || form == 1)
        oktoswitch = die || newSquadRdy || (missingHealth < (baseHealth / 2));

    var useoverkill = getPageSetting('ScryerUseWhenOverkill');
    if (useoverkill && game.portal.Overkill.level == 0)
        setPageSetting('ScryerUseWhenOverkill', false);
    if (useoverkill && !game.global.mapsActive && game.global.world == 200 && game.global.spireActive && getPageSetting('ScryerUseinSpire2') == 2)
        useoverkill = false;
    //Overkill button being on and being able to overkill in S will override any other setting, regardless.
    if (useoverkill && game.portal.Overkill.level > 0) {
        var avgDamage = baseDamage;
        var Sstance = 0.5;
        if (game.global.titimpLeft > 1 && game.global.mapsActive) {
            avgDamage *= 2;
        }
        var ovklHDratio = (Sstance * avgDamage / getCurrentEnemy(1).maxHealth);
        //are we going to overkill in S?
        if (ovklHDratio > 1.2 * (1 + (200 / game.portal.Overkill.level))) {
            if (oktoswitch)
                setFormation(4);
            return;
        }
        //debug("overkillratio is " + ovklHDratio);
    }

    //Any of these being true will indicate scryer should not be used, and cause the function to dump back to regular autoStance():
    //check for spire
    use_auto = use_auto || !game.global.mapsActive && game.global.world == 200 && game.global.spireActive && getPageSetting('ScryerUseinSpire2') != 1;
    //check for voids
    use_auto = use_auto || game.global.mapsActive && getCurrentMapObject().location == "Void" && !getPageSetting('ScryerUseinVoidMaps2');
    //check for maps
    use_auto = use_auto || game.global.mapsActive && !getPageSetting('ScryerUseinMaps2');
    //check for bosses above voidlevel
    use_auto = use_auto || getPageSetting('ScryerSkipBoss2') == 1 && game.global.world > getPageSetting('VoidMaps') && game.global.lastClearedCell == 98;
    //check for bosses (all levels)
    use_auto = use_auto || getPageSetting('ScryerSkipBoss2') == 2 && game.global.lastClearedCell == 98;
    if (use_auto) {
        autostancefunction(); //falls back to autostance when not using S.
        wantToScry = false;
        return;
    }

    //check for corrupted cells (and exit)
    var iscorrupt = getCurrentEnemy(1).mutation == "Corruption";
    iscorrupt = iscorrupt || (mutations.Magma.active() && game.global.mapsActive);
    iscorrupt = iscorrupt || (game.global.mapsActive && getCurrentMapObject().location == "Void" && game.global.world >= mutations.Corruption.start());
    if (iscorrupt && getPageSetting('ScryerSkipCorrupteds2')) {
        autostancefunction();
        wantToScry = false;
        return;
    }

    //Default.
    var min_zone = getPageSetting('ScryerMinZone');
    var max_zone = getPageSetting('ScryerMaxZone');
    var valid_min = game.global.world >= min_zone;
    var valid_max = max_zone <= 0 || game.global.world < max_zone;
    if (valid_min && valid_max) {
        if (oktoswitch)
            setFormation(4);
        wantToScry = true;
    } else {
        autostancefunction();
        wantToScry = false;
        return;
    }
}

function updateAutoMapsStatus() {
    //automaps status
    var status = document.getElementById('autoMapStatus');
    if (!autoTrimpSettings.AutoMaps.enabled) status.innerHTML = 'Off';
    else if (!game.global.mapsUnlocked) status.innerHTML = '&nbsp;';
    else if (needPrestige && !doVoids) status.innerHTML = 'Prestige';
    else if (doVoids && voidCheckPercent == 0) status.innerHTML = 'Void Maps: ' + game.global.totalVoidMaps + ' remaining';
    else if (needToVoid && !doVoids && game.global.totalVoidMaps > 0 && !stackingTox) status.innerHTML = 'Prepping for Voids';
    else if (doVoids && voidCheckPercent > 0) status.innerHTML = 'Farming to do Voids: ' + voidCheckPercent + '%';
    else if (shouldFarm && !doVoids) status.innerHTML = 'Farming: ' + HDratio.toFixed(4) + 'x';
    else if (stackingTox) status.innerHTML = 'Getting Tox Stacks';
    else if (scryerStuck) status.innerHTML = 'Scryer Got Stuck, Farming';
    else if (!enoughHealth && !enoughDamage) status.innerHTML = 'Want Health & Damage';
    else if (!enoughDamage) status.innerHTML = 'Want ' + HDratio.toFixed(4) + 'x &nbspmore damage';
    else if (!enoughHealth) status.innerHTML = 'Want more health';
    else if (enoughHealth && enoughDamage) status.innerHTML = 'Advancing';

    //hider he/hr% status
    var area51 = document.getElementById('hiderStatus');
    var getPercent = (game.stats.heliumHour.value() / (game.global.totalHeliumEarned - (game.global.heliumLeftover + game.resources.helium.owned))) * 100;
    var lifetime = (game.resources.helium.owned / (game.global.totalHeliumEarned - game.resources.helium.owned)) * 100;
    area51.innerHTML = 'He/hr: ' + getPercent.toFixed(3) + '%<br>&nbsp;&nbsp;&nbsp;He: ' + lifetime.toFixed(3) + '%';
}


function getEnemyMaxHealth(world, level, corrupt) {
    if (!level)
        level = 30;
    var amt = 0;
    amt += 130 * Math.sqrt(world) * Math.pow(3.265, world / 2);
    amt -= 110;
    if (world == 1 || world == 2 && level < 10) {
        amt *= 0.6;
        amt = (amt * 0.25) + ((amt * 0.72) * (level / 100));
    } else if (world < 60)
        amt = (amt * 0.4) + ((amt * 0.4) * (level / 110));
    else {
        amt = (amt * 0.5) + ((amt * 0.8) * (level / 100));
        amt *= Math.pow(1.1, world - 59);
    }
    if (world < 60) amt *= 0.75;
    //if (world > 5 && game.global.mapsActive) amt *= 1.1;
    if (!corrupt)
        amt *= game.badGuys["Grimp"].health;
    else
        amt *= getCorruptScale("health");
    if (game.global.challengeActive) {
        //Challenge bonuses here
        if (game.global.challengeActive == "Coordinate") {
            var badCoordLevel = 1;
            for (var x = 0; x < world - 1; x++) {
                badCoordLevel = Math.ceil(badCoordLevel * 1.25);
            }
            amt *= badCoordLevel;
        }
    }
    return Math.floor(amt);
}

function getEnemyMaxAttack(world, level, name, diff, corrupt) {
    var amt = 0;
    var adjWorld = ((world - 1) * 100) + level;
    amt += 50 * Math.sqrt(world) * Math.pow(3.27, world / 2);
    amt -= 10;
    if (world == 1) {
        amt *= 0.35;
        amt = (amt * 0.20) + ((amt * 0.75) * (level / 100));
    } else if (world == 2) {
        amt *= 0.5;
        amt = (amt * 0.32) + ((amt * 0.68) * (level / 100));
    } else if (world < 60)
        amt = (amt * 0.375) + ((amt * 0.7) * (level / 100));
    else {
        amt = (amt * 0.4) + ((amt * 0.9) * (level / 100));
        amt *= Math.pow(1.15, world - 59);
    }
    if (world < 60) amt *= 0.85;
    //if (world > 6 && game.global.mapsActive) amt *= 1.1;
    if (diff) {
        amt *= diff;
    }
    if (game.global.challengeActive) {
        //Challenge bonuses here
        if (game.global.challengeActive == "Coordinate") {
            var badCoordLevel = 1;
            for (var x = 0; x < world - 1; x++) {
                badCoordLevel = Math.ceil(badCoordLevel * 1.25);
            }
            amt *= badCoordLevel;
        }
    }
    if (!corrupt)
        amt *= game.badGuys[name].attack;
    else {
        amt *= getCorruptScale("attack");
    }
    return Math.floor(amt);
}

function autoStance() {
    //get back to a baseline of no stance (X)
    calcBaseDamageinX();
    //no need to continue
    if (game.global.gridArray.length === 0) return;
    if (game.global.soldierHealth <= 0) return; //dont calculate stances when dead, cause the "current" numbers are not updated when dead.
    if (!getPageSetting('AutoStance')) return;
    if (!game.upgrades.Formations.done) return;

    //start analyzing autostance
    var missingHealth = game.global.soldierHealthMaxax - game.global.soldierHealth;
    var newSquadRdy = ewSquadRdy = ewSquadRdy = game.resources.trimps.realMax() <= game.resources.trimps.owned + 1;
    var dHealth = baseHealth / 2;
    var xHealth = baseHealth;
    var bHealth = baseHealth / 2;
    var enemy;
    var corrupt = game.global.world >= mutations.Corruption.start();
    if (!game.global.mapsActive && !game.global.preMapsActive) {
        enemy = getCurrentEnemy();
        var enemyFast = game.global.challengeActive == "Slow" || ((((game.badGuys[enemy.name].fast || enemy.mutation == "Corruption") && game.global.challengeActive != "Nom") && game.global.challengeActive != "Coordinate"));
        var enemyHealth = enemy.health;
        var enemyDamage = calcBadGuyDmg(enemy, null, true, true);
        enemyDamage = calcDailyAttackMod(enemyDamage); //daily mods: badStrength,badMapStrength,bloodthirst
        //check for world Corruption
        if (enemy && enemy.mutation == "Corruption") {
            enemyHealth *= getCorruptScale("health");
            enemyDamage *= getCorruptScale("attack");
        }
        if (enemy && enemy.corrupted == 'corruptStrong') {
            enemyDamage *= 2;
        }
        if (enemy && enemy.corrupted == 'corruptTough') {
            enemyHealth *= 5;
        }
        if (enemy && game.global.challengeActive == "Nom" && typeof enemy.nomStacks !== 'undefined') {
            enemyDamage *= Math.pow(1.25, enemy.nomStacks);
        }
        if (game.global.challengeActive == 'Lead') {
            enemyDamage *= (1 + (game.challenges.Lead.stacks * 0.04));
        }
        if (game.global.challengeActive == 'Watch') {
            enemyDamage *= 1.25;
        }
        var pierceMod = getPierceAmt();
        var dDamage = enemyDamage - baseBlock / 2 > enemyDamage * pierceMod ? enemyDamage - baseBlock / 2 : enemyDamage * pierceMod;
        var xDamage = enemyDamage - baseBlock > enemyDamage * pierceMod ? enemyDamage - baseBlock : enemyDamage * pierceMod;
        var bDamage = enemyDamage - baseBlock * 4 > enemyDamage * pierceMod ? enemyDamage - baseBlock * 4 : enemyDamage * pierceMod;

    } else if (game.global.mapsActive && !game.global.preMapsActive) {
        enemy = getCurrentEnemy();
        var enemyFast = game.global.challengeActive == "Slow" || ((((game.badGuys[enemy.name].fast || enemy.mutation == "Corruption") && game.global.challengeActive != "Nom") || game.global.voidBuff == "doubleAttack") && game.global.challengeActive != "Coordinate");
        var enemyHealth = enemy.health;
        var enemyDamage = calcBadGuyDmg(enemy, null, true, true);
        enemyDamage = calcDailyAttackMod(enemyDamage); //daily mods: badStrength,badMapStrength,bloodthirst
        //check for voidmap Corruption
        if (getCurrentMapObject().location == "Void" && corrupt) {
            enemyDamage *= getCorruptScale("attack");
            enemyHealth *= getCorruptScale("health");
            //halve if magma is not active (like it was before)
            if (!mutations.Magma.active()) {
                enemyDamage /= 2;
                enemyHealth /= 2;
            }
        }
        //check for z230 magma map corruption
        else if (getCurrentMapObject().location != "Void" && mutations.Magma.active()) {
            enemyHealth *= (getCorruptScale("health") / 2);
            enemyDamage *= (getCorruptScale("attack") / 2);
        }
        if (enemy && enemy.corrupted == 'corruptStrong') {
            enemyDamage *= 2;
        }
        if (enemy && enemy.corrupted == 'corruptTough') {
            enemyHealth *= 5;
        }
        if (enemy && game.global.challengeActive == "Nom" && typeof enemy.nomStacks !== 'undefined') {
            enemyDamage *= Math.pow(1.25, enemy.nomStacks);
        }
        if (game.global.challengeActive == 'Lead') {
            enemyDamage *= (1 + (game.challenges.Lead.stacks * 0.04));
        }
        if (game.global.challengeActive == 'Watch') {
            enemyDamage *= 1.25;
        }
        var dDamage = enemyDamage - baseBlock / 2 > 0 ? enemyDamage - baseBlock / 2 : 0;
        var dVoidCritDamage = enemyDamage * 5 - baseBlock / 2 > 0 ? enemyDamage * 5 - baseBlock / 2 : 0;
        var xDamage = enemyDamage - baseBlock > 0 ? enemyDamage - baseBlock : 0;
        var xVoidCritDamage = enemyDamage * 5 - baseBlock > 0 ? enemyDamage * 5 - baseBlock : 0;
        var bDamage = enemyDamage - baseBlock * 4 > 0 ? enemyDamage - baseBlock * 4 : 0;
    }

    var drainChallenge = game.global.challengeActive == 'Nom' || game.global.challengeActive == "Toxicity";
    var dailyPlague = game.global.challengeActive == 'Daily' && (typeof game.global.dailyChallenge.plague !== 'undefined');
    var dailyBogged = game.global.challengeActive == 'Daily' && (typeof game.global.dailyChallenge.bogged !== 'undefined');

    if (game.global.challengeActive == "Electricity" || game.global.challengeActive == "Mapocalypse") {
        dDamage += dHealth * game.global.radioStacks * 0.1;
        xDamage += xHealth * game.global.radioStacks * 0.1;
        bDamage += bHealth * game.global.radioStacks * 0.1;
    } else if (drainChallenge) {
        dDamage += dHealth / 20;
        xDamage += xHealth / 20;
        bDamage += bHealth / 20;
        var drainChallengeOK = dHealth - missingHealth > dHealth / 20;
    } else if (dailyPlague) {
        drainChallenge = true;
        var hplost = dailyModifiers.plague.getMult(game.global.dailyChallenge.plague.strength, 1 + game.global.dailyChallenge.plague.stacks);
        //x% of TOTAL health;
        dDamage += dHealth * hplost;
        xDamage += xHealth * hplost;
        bDamage += bHealth * hplost;
        var drainChallengeOK = dHealth - missingHealth > dHealth * hplost;
    } else if (dailyBogged) {
        drainChallenge = true;
        // 1 + was added to the stacks to anticipate the next stack ahead of time.
        var hplost = dailyModifiers.bogged.getMult(game.global.dailyChallenge.bogged.strength);
        //x% of TOTAL health;
        dDamage += dHealth * hplost;
        xDamage += xHealth * hplost;
        bDamage += bHealth * hplost;
        var drainChallengeOK = dHealth - missingHealth > dHealth * hplost;
    } else if (game.global.challengeActive == "Crushed") {
        if (dHealth > baseBlock / 2)
            dDamage = enemyDamage * 5 - baseBlock / 2 > 0 ? enemyDamage * 5 - baseBlock / 2 : 0;
        if (xHealth > baseBlock)
            xDamage = enemyDamage * 5 - baseBlock > 0 ? enemyDamage * 5 - baseBlock : 0;
    }
    //^dont attach^.
    if (game.global.voidBuff == "bleed" || (enemy && enemy.corrupted == 'corruptBleed')) {
        dDamage += game.global.soldierHealth * 0.2;
        xDamage += game.global.soldierHealth * 0.2;
        bDamage += game.global.soldierHealth * 0.2;
    }
    baseDamage *= (game.global.titimpLeft > 0 ? 2 : 1); //consider titimp
    //double attack is OK if the buff isn't double attack, or we will survive a double attack. see main.js @ 7197-7217 https://puu.sh/ssVNP/95f699a879.png (cant prevent the 2nd hit)
    var isDoubleAttack = game.global.voidBuff == 'doubleAttack' || (enemy && enemy.corrupted == 'corruptDbl');
    var doubleAttackOK = !isDoubleAttack || ((newSquadRdy && dHealth > dDamage * 2) || dHealth - missingHealth > dDamage * 2);
    //lead attack ok if challenge isn't lead, or we are going to one shot them, or we can survive the lead damage
    var leadDamage = game.challenges.Lead.stacks * 0.0003;
    var leadAttackOK = game.global.challengeActive != 'Lead' || enemyHealth <= baseDamage || ((newSquadRdy && dHealth > dDamage + (dHealth * leadDamage)) || (dHealth - missingHealth > dDamage + (dHealth * leadDamage)));
    //added voidcrit.
    //voidcrit is OK if the buff isn't crit-buff, or we will survive a crit, or we are going to one-shot them (so they won't be able to crit)
    var isCritVoidMap = game.global.voidBuff == 'getCrit' || (enemy && enemy.corrupted == 'corruptCrit');
    var voidCritinDok = !isCritVoidMap || (!enemyFast ? enemyHealth <= baseDamage : false) || (newSquadRdy && dHealth > dVoidCritDamage) || (dHealth - missingHealth > dVoidCritDamage);
    var voidCritinXok = !isCritVoidMap || (!enemyFast ? enemyHealth <= baseDamage : false) || (newSquadRdy && xHealth > xVoidCritDamage) || (xHealth - missingHealth > xVoidCritDamage);

    if (!game.global.preMapsActive && game.global.soldierHealth > 0) {
        if (!enemyFast && game.upgrades.Dominance.done && enemyHealth <= baseDamage && (newSquadRdy || (dHealth - missingHealth > 0 && !drainChallenge) || (drainChallenge && drainChallengeOK))) {
            setFormation(2);
            //use D stance if: new army is ready&waiting / can survive void-double-attack or we can one-shot / can survive lead damage / can survive void-crit-dmg
        } else if (game.upgrades.Dominance.done && ((newSquadRdy && dHealth > dDamage) || dHealth - missingHealth > dDamage) && doubleAttackOK && leadAttackOK && voidCritinDok) {
            setFormation(2);
            //if CritVoidMap, switch out of D stance if we cant survive. Do various things.
        } else if (isCritVoidMap && !voidCritinDok) {
            //if we are already in X and the NEXT potential crit would take us past the point of being able to return to D/B, switch to B.
            if (game.global.formation == "0" && game.global.soldierHealth - xVoidCritDamage < game.global.soldierHealthMax / 2) {
                if (game.upgrades.Barrier.done && (newSquadRdy || (missingHealth < game.global.soldierHealthMax / 2)))
                    setFormation(3);
            }
            //else if we can totally block all crit damage in X mode, OR we can't survive-crit in D, but we can in X, switch to X.
            // NOTE: during next loop, the If-block above may immediately decide it wants to switch to B.
            else if (xVoidCritDamage == 0 || ((game.global.formation == 2 || game.global.formation == 4) && voidCritinXok)) {
                setFormation("0");
            }
            //otherwise, stuff:
            else {
                if (game.global.formation == "0") {
                    if (game.upgrades.Barrier.done && (newSquadRdy || (missingHealth < game.global.soldierHealthMax / 2)))
                        setFormation(3);
                    else
                        setFormation(1);
                } else if (game.upgrades.Barrier.done && (game.global.formation == 2 || game.global.formation == 4))
                    setFormation(3);
            }
        } else if (game.upgrades.Formations.done && ((newSquadRdy && xHealth > xDamage) || xHealth - missingHealth > xDamage)) {
            //in lead challenge, switch to H if about to die, so doesn't just die in X mode without trying
            if ((game.global.challengeActive == 'Lead') && (xHealth - missingHealth < xDamage + (xHealth * leadDamage)))
                setFormation(1);
            else
                setFormation("0");
        } else if (game.upgrades.Barrier.done && ((newSquadRdy && bHealth > bDamage) || bHealth - missingHealth > bDamage)) {
            setFormation(3); //does this ever run?
        } else if (game.upgrades.Formations.done) {
            setFormation(1);
        } else
            setFormation("0");
    }
    baseDamage /= (game.global.titimpLeft > 0 ? 2 : 1); //unconsider titimp :P
}

function autoStance2() {
    //get back to a baseline of no stance (X)
    calcBaseDamageinX2();
    //no need to continue
    if (game.global.gridArray.length === 0) return true;
    if (game.global.soldierHealth <= 0) return; //dont calculate stances when dead, cause the "current" numbers are not updated when dead.
    if (!getPageSetting('AutoStance')) return true;
    if (!game.upgrades.Formations.done) return true;

    //start analyzing autostance
    var missingHealth = game.global.soldierHealthMax - game.global.soldierHealth;
    var newSquadRdy = game.resources.trimps.realMax() <= game.resources.trimps.owned + 1;
    var dHealth = baseHealth / 2;
    var xHealth = baseHealth;
    var bHealth = baseHealth / 2;
    //COMMON:
    var corrupt = game.global.world >= mutations.Corruption.start();
    var enemy = getCurrentEnemy();
    if (typeof enemy === 'undefined') return true;
    var enemyHealth = enemy.health;
    var enemyDamage = calcBadGuyDmg(enemy, null, true, true);
    //crits
    var critMulti = 1;
    var isCrushed = (game.global.challengeActive == "Crushed") && game.global.soldierHealth > game.global.soldierCurrentBlock;
    critMulti *= isCrushed ? 5 : 1;
    var isCritVoidMap = game.global.voidBuff == 'getCrit' || (enemy.corrupted == 'corruptCrit');
    critMulti *= isCritVoidMap ? 5 : 1;
    var isCritDaily = (game.global.challengeActive == "Daily") && (typeof game.global.dailyChallenge.crits !== 'undefined');
    critMulti *= isCritDaily ? dailyModifiers.crits.getMult(game.global.dailyChallenge.crits.strength) : 1;
    enemyDamage *= critMulti;
    //double attacks
    var isDoubleAttack = game.global.voidBuff == 'doubleAttack' || (enemy.corrupted == 'corruptDbl');
    //fast
    var enemyFast = (game.global.challengeActive == "Slow" || ((game.badGuys[enemy.name].fast || enemy.mutation == "Corruption") && game.global.challengeActive != "Coordinate" && game.global.challengeActive != "Nom")) || isDoubleAttack;
    //
    if (enemy.corrupted == 'corruptStrong')
        enemyDamage *= 2;
    if (enemy.corrupted == 'corruptTough')
        enemyHealth *= 5;

    //calc X,D,B:
    var xDamage = (enemyDamage - baseBlock);
    var dDamage = (enemyDamage - baseBlock / 2);
    var bDamage = (enemyDamage - baseBlock * 4);
    var dDamageNoCrit = (enemyDamage / critMulti - baseBlock / 2);
    var xDamageNoCrit = (enemyDamage / critMulti - baseBlock);
    var pierce = 0;
    if (game.global.brokenPlanet && !game.global.mapsActive) {
        pierce = getPierceAmt();
        var atkPierce = pierce * enemyDamage;
        var atkPierceNoCrit = pierce * (enemyDamage / critMulti);
        if (xDamage < atkPierce) xDamage = atkPierce;
        if (dDamage < atkPierce) dDamage = atkPierce;
        if (bDamage < atkPierce) bDamage = atkPierce;
        if (dDamageNoCrit < atkPierceNoCrit) dDamageNoCrit = atkPierceNoCrit;
        if (xDamageNoCrit < atkPierceNoCrit) xDamageNoCrit = atkPierceNoCrit;
    }
    if (xDamage < 0) xDamage = 0;
    if (dDamage < 0) dDamage = 0;
    if (bDamage < 0) bDamage = 0;
    if (dDamageNoCrit < 0) dDamageNoCrit = 0;
    if (xDamageNoCrit < 0) xDamageNoCrit = 0;
    var isdba = isDoubleAttack ? 2 : 1;
    xDamage *= isdba;
    dDamage *= isdba;
    bDamage *= isdba;
    dDamageNoCrit *= isdba;
    xDamageNoCrit *= isdba;

    var drainChallenge = game.global.challengeActive == 'Nom' || game.global.challengeActive == "Toxicity";
    var dailyPlague = game.global.challengeActive == 'Daily' && (typeof game.global.dailyChallenge.plague !== 'undefined');
    var dailyBogged = game.global.challengeActive == 'Daily' && (typeof game.global.dailyChallenge.bogged !== 'undefined');
    var leadChallenge = game.global.challengeActive == 'Lead';
    if (drainChallenge) {
        var hplost = 0.20; //equals 20% of TOTAL health
        dDamage += dHealth * hplost;
        xDamage += xHealth * hplost;
        bDamage += bHealth * hplost;
    } else if (dailyPlague) {
        drainChallenge = true;
        // 1 + was added to the stacks to anticipate the next stack ahead of time.
        var hplost = dailyModifiers.plague.getMult(game.global.dailyChallenge.plague.strength, 1 + game.global.dailyChallenge.plague.stacks);
        //x% of TOTAL health;
        dDamage += dHealth * hplost;
        xDamage += xHealth * hplost;
        bDamage += bHealth * hplost;
    } else if (dailyBogged) {
        drainChallenge = true;
        // 1 + was added to the stacks to anticipate the next stack ahead of time.
        var hplost = dailyModifiers.bogged.getMult(game.global.dailyChallenge.bogged.strength);
        //x% of TOTAL health;
        dDamage += dHealth * hplost;
        xDamage += xHealth * hplost;
        bDamage += bHealth * hplost;
    } else if (leadChallenge) {
        var leadDamage = game.challenges.Lead.stacks * 0.0003; //0.03% of their health per enemy stack.
        var added = game.global.soldierHealth * leadDamage;
        dDamage += added;
        xDamage += added;
        bDamage += added;
    }
    //^dont attach^.
    if (game.global.voidBuff == "bleed" || (enemy.corrupted == 'corruptBleed')) {
        //20% of CURRENT health;
        var added = game.global.soldierHealth * 0.20;
        dDamage += added;
        xDamage += added;
        bDamage += added;
    }
    baseDamage *= (game.global.titimpLeft > 0 ? 2 : 1); //consider titimp
    baseDamage *= (!game.global.mapsActive && game.global.mapBonus > 0) ? ((game.global.mapBonus * .2) + 1) : 1; //consider mapbonus

    //lead attack ok if challenge isn't lead, or we are going to one shot them, or we can survive the lead damage
    var oneshotFast = enemyFast ? enemyHealth <= baseDamage : false;
    var surviveD = ((newSquadRdy && dHealth > dDamage) || (dHealth - missingHealth > dDamage));
    var surviveX = ((newSquadRdy && xHealth > xDamage) || (xHealth - missingHealth > xDamage));
    var surviveB = ((newSquadRdy && bHealth > bDamage) || (bHealth - missingHealth > bDamage));
    var leadAttackOK = !leadChallenge || oneshotFast || surviveD;
    var drainAttackOK = !drainChallenge || oneshotFast || surviveD;
    var isCritThing = isCritVoidMap || isCritDaily || isCrushed;
    var voidCritinDok = !isCritThing || oneshotFast || surviveD;
    var voidCritinXok = !isCritThing || oneshotFast || surviveX;

    if (!game.global.preMapsActive && game.global.soldierHealth > 0) {
        //use D stance if: new army is ready&waiting / can survive void-double-attack or we can one-shot / can survive lead damage / can survive void-crit-dmg
        if (game.upgrades.Dominance.done && surviveD && leadAttackOK && drainAttackOK && (!isCritThing || voidCritinDok)) {
            setFormation(2);
            //if CritVoidMap, switch out of D stance if we cant survive. Do various things.
        } else if (isCritThing && !voidCritinDok) {
            //if we are already in X and the NEXT potential crit would take us past the point of being able to return to D/B, switch to B.
            // if (game.global.formation == "0" && game.global.soldierHealth - xDamage < bHealth){
            //     if (game.upgrades.Barrier.done && (newSquadRdy || missingHealth < bHealth))
            //         setFormation(3);
            // }
            //else if we can totally block all crit damage in X mode, OR we can't survive-crit in D, but we can in X, switch to X.
            // NOTE: during next loop, the If-block above may immediately decide it wants to switch to B.
            // else
            // if (xDamage == 0 || ((game.global.formation == 2 || game.global.formation == 4) && voidCritinXok)){
            if (xDamage == 0 || (!(game.global.formation == 1) && voidCritinXok)) {
                setFormation("0");
            }
            //otherwise, stuff: (Try for B again)
            else {
                if (game.global.formation == "0") {
                    // if (game.upgrades.Barrier.done && (newSquadRdy || missingHealth < bHealth))
                    //     setFormation(3);
                    // else
                    setFormation(1);
                }
                // else if (game.upgrades.Barrier.done && (game.global.formation == 2 || game.global.formation == 4))
                //     setFormation(3);
            }
        } else if (game.upgrades.Formations.done && surviveX) {
            //in lead challenge, switch to H if about to die, so doesn't just die in X mode without trying
            if ((game.global.challengeActive == 'Lead') && (xHealth - missingHealth < xDamage + (xHealth * leadDamage)))
                setFormation(1);
            else
                setFormation("0");
        } else if (game.upgrades.Barrier.done && surviveB) {
            if (game.global.formation != 3) {
                setFormation(3); //does this ever run?
                debug("AutoStance B/3", "other");
            }
        } else {
            if (game.global.formation != 1) {
                setFormation(1); //the last thing that runs
            }
        }
    }
    baseDamage /= (game.global.titimpLeft > 0 ? 2 : 1); //unconsider titimp
    baseDamage /= (!game.global.mapsActive && game.global.mapBonus > 0) ? ((game.global.mapBonus * .2) + 1) : 1; //unconsider mapbonus
    return true;
}

function buyBuildings() {
    if ((game.jobs.Miner.locked && game.global.challengeActive != 'Metal') || (game.jobs.Scientist.locked && game.global.challengeActive != "Scientist"))
        return;
    var customVars = MODULES["buildings"];
    var oldBuy = preBuy2();
    game.global.buyAmt = 1;
    buyFoodEfficientHousing(); //["Hut", "House", "Mansion", "Hotel", "Resort"];
    buyGemEfficientHousing(); //["Hotel", "Resort", "Gateway", "Collector", "Warpstation"];
    //WormHoles:
    if (getPageSetting('MaxWormhole') > 0 && game.buildings.Wormhole.owned < getPageSetting('MaxWormhole') && !game.buildings.Wormhole.locked) {
        safeBuyBuilding('Wormhole');
    }
    //Buy non-housing buildings:
    //Gyms:
    if (!game.buildings.Gym.locked && (getPageSetting('MaxGym') > game.buildings.Gym.owned || getPageSetting('MaxGym') == -1)) {
        var skipGym = false;
        if (getPageSetting('DynamicGyms')) {
            //getBattleStats calculation comes from battlecalc.js and shows the tooltip-table block amount. calcBadGuyDmg is in that file also
            if (!game.global.preMapsActive && getBattleStats("block", true) > calcBadGuyDmg(getCurrentEnemy(), null, true, true))
                skipGym = true;
        }
        //still buy gyms if we are farming for voids
        if (doVoids && voidCheckPercent > 0)
            skipGym = false;
        //(unless gymwall; thats why its after. debateable.)
        var gymwallpct = getPageSetting('GymWall');
        if (gymwallpct > 1) {
            //Gym Wall - allow only gyms that cost 1/n'th less then current wood (try to save wood for nurseries for new z230+ Magma nursery strategy)
            if (getBuildingItemPrice(game.buildings.Gym, "wood", false, 1) * Math.pow(1 - game.portal.Resourceful.modifier, game.portal.Resourceful.level) > (game.resources.wood.owned / gymwallpct))
                skipGym = true;
        }
        //ShieldBlock cost Effectiveness:
        if (game.equipment['Shield'].blockNow) {
            var gymEff = evaluateEquipmentEfficiency('Gym');
            var shieldEff = evaluateEquipmentEfficiency('Shield');
            if ((gymEff.Wall) || (gymEff.Factor <= shieldEff.Factor && !gymEff.Wall))
                skipGym = true;
        }
        if (needGymystic) skipGym = true;
        if (!skipGym)
            safeBuyBuilding('Gym');
    }
    //Tributes:
    if (!game.buildings.Tribute.locked && (getPageSetting('MaxTribute') > game.buildings.Tribute.owned || getPageSetting('MaxTribute') == -1)) {
        safeBuyBuilding('Tribute');
    }
    //Nurseries:
    var minNursery = 0;
    if (game.global.world == 200)
        minNursery = MODULES["buildings"].nurseSpireAmt;
    if (game.global.world == getPageSetting("VoidMaps"))
        minNursery = MODULES["buildings"].nurseVoidMapsAmt;
    if (game.global.world >= getPageSetting('CustomAutoPortal') - 3)
        minNursery = 200000;
    if (game.buildings.Nursery.owned < minNursery) {
        safeBuyBuilding('Nursery');
    }
    var targetBreed = parseInt(getPageSetting('GeneticistTimer'));
    //NoNurseriesUntil', 'No Nurseries Until z', 'For Magma z230+ purposes. Nurseries get shut down, and wasting nurseries early on is probably a bad idea. Might want to set this to 230+ as well.'
    var nursminlvl = getPageSetting('NoNurseriesUntil');
    if ((game.global.world < nursminlvl) || enoughHealth) {
        postBuy2(oldBuy);
        return;
    }
    //only buy nurseries if enabled,   and we need to lower our breed time, or our target breed time is 0, or we aren't trying to manage our breed time before geneticists, and they aren't locked
    //even if we are trying to manage breed timer pre-geneticists, start buying nurseries once geneticists are unlocked AS LONG AS we can afford a geneticist (to prevent nurseries from outpacing geneticists soon after they are unlocked)
    if ((targetBreed < getBreedTime() || targetBreed <= 0 ||
            (targetBreed < getBreedTime(true) && game.global.challengeActive == 'Watch') ||
            (!game.jobs.Geneticist.locked && canAffordJob('Geneticist', false, 1))) && !game.buildings.Nursery.locked) {
        var nwr = customVars.nursCostRatio; //nursery to warpstation/collector cost ratio. Also for extra gems.
        var nursCost = getBuildingItemPrice(game.buildings.Nursery, "gems", false, 1);
        var warpCost = getBuildingItemPrice(game.buildings.Warpstation, "gems", false, 1);
        var collCost = getBuildingItemPrice(game.buildings.Collector, "gems", false, 1);
        var resomod = Math.pow(1 - game.portal.Resourceful.modifier, game.portal.Resourceful.level); //need to apply the resourceful mod when comparing anything other than building vs building.
        //buy nurseries irrelevant of warpstations (after we unlock them) - if we have enough extra gems that its not going to impact anything. note:(we will be limited by wood anyway - might use a lot of extra wood)
        var buyWithExtraGems = (!game.buildings.Warpstation.locked && nursCost * resomod < nwr * game.resources.gems.owned);
        //refactored the old calc, and added new buyWithExtraGems tacked on the front
        if ((getPageSetting('MaxNursery') > game.buildings.Nursery.owned || getPageSetting('MaxNursery') == -1) &&
            (buyWithExtraGems ||
                ((nursCost < nwr * warpCost || game.buildings.Warpstation.locked) &&
                    (nursCost < nwr * collCost || game.buildings.Collector.locked || !game.buildings.Warpstation.locked)))) {
            safeBuyBuilding('Nursery');
        }
    }
    postBuy2(oldBuy);
}

function manualLabor() {
    if (getPageSetting('ManualGather2') == 0) return;
    //vars
    var breedingTrimps = game.resources.trimps.owned - game.resources.trimps.employed;
    var trapTrimpsOK = getPageSetting('TrapTrimps');
    var targetBreed = getPageSetting('GeneticistTimer');
    var trapperTrapUntilFull = game.global.challengeActive == "Trapper" && game.resources.trimps.owned < game.resources.trimps.realMax();
    var watchJumpstartTraps = game.global.challengeActive == "Watch" && game.resources.trimps.owned < game.resources.trimps.realMax();

    //FRESH GAME NO HELIUM CODE.
    if (game.global.world <= 3 && game.global.totalHeliumEarned <= 5000) {
        if (game.global.buildingsQueue.length == 0 && (game.global.playerGathering != 'trimps' || game.buildings.Trap.owned == 0)) {
            if (!game.triggers.wood.done || game.resources.food.owned < 10 || Math.floor(game.resources.food.owned) < Math.floor(game.resources.wood.owned))
                setGather('food');
            else
                setGather('wood');
        }
    }

    if ((watchJumpstartTraps || trapTrimpsOK) && (breedingTrimps < 5 || trapperTrapUntilFull) && game.buildings.Trap.owned == 0 && canAffordBuilding('Trap')) {
        //safeBuyBuilding returns false if item is already in queue
        if (!safeBuyBuilding('Trap'))
            setGather('buildings');
    } else if ((watchJumpstartTraps || trapTrimpsOK) && (breedingTrimps < 5 || trapperTrapUntilFull) && game.buildings.Trap.owned > 0) {
        setGather('trimps');
        if (trapperTrapUntilFull && (game.global.buildingsQueue.length == 0 || game.buildings.Trap.owned == 1) && !game.global.trapBuildAllowed && canAffordBuilding('Trap'))
            safeBuyBuilding('Trap'); //get ahead on trap building since it is always needed for Trapper
    } else if (getPageSetting('ManualGather2') != 2 && game.resources.science.owned < MODULES["gather"].minScienceAmount && document.getElementById('scienceCollectBtn').style.display != 'none' && document.getElementById('science').style.visibility != 'hidden')
        setGather('science');
    //if we have more than 2 buildings in queue, or (our modifier is real fast and trapstorm is off), build
    else if (!game.talents.foreman.purchased && (game.global.buildingsQueue.length ? (game.global.buildingsQueue.length > 1 || game.global.autoCraftModifier == 0 || (getPlayerModifier() > 1000 && game.global.buildingsQueue[0] != 'Trap.1')) : false)) {
        setGather('buildings');
    }
    //if trapstorm is off (likely we havent gotten it yet, the game is still early, buildings take a while to build ), then Prioritize Storage buildings when they hit the front of the queue (should really be happening anyway since the queue should be >2(fits the clause above this), but in case they are the only object in the queue.)
    else if (!game.global.trapBuildToggled && (game.global.buildingsQueue[0] == 'Barn.1' || game.global.buildingsQueue[0] == 'Shed.1' || game.global.buildingsQueue[0] == 'Forge.1')) {
        setGather('buildings');
    }
    //if we have some upgrades sitting around which we don't have enough science for, gather science
    else if (game.resources.science.owned < scienceNeeded && document.getElementById('scienceCollectBtn').style.display != 'none' && document.getElementById('science').style.visibility != 'hidden') {
        // debug('Science needed ' + scienceNeeded);
        if ((getPlayerModifier() < getPerSecBeforeManual('Scientist') && game.global.turkimpTimer > 0) || getPageSetting('ManualGather2') == 2) {
            //if manual is less than science production, switch on turkimp
            setGather('metal');
        } else if (getPageSetting('ManualGather2') != 2) {
            setGather('science');
        }
    } else if (trapTrimpsOK && targetBreed < getBreedTime(true)) {
        //combined to optimize code.
        if (game.buildings.Trap.owned < 1 && canAffordBuilding('Trap')) {
            safeBuyBuilding('Trap');
            setGather('buildings');
        } else if (game.buildings.Trap.owned > 0)
            setGather('trimps');
    } else {
        var manualResourceList = {
            'food': 'Farmer',
            'wood': 'Lumberjack',
            'metal': 'Miner',
        };
        var lowestResource = 'food';
        var lowestResourceRate = -1;
        var haveWorkers = true;
        for (var resource in manualResourceList) {
            var job = manualResourceList[resource];
            var currentRate = game.jobs[job].owned * game.jobs[job].modifier;
            // debug('Current rate for ' + resource + ' is ' + currentRate + ' is hidden? ' + (document.getElementById(resource).style.visibility == 'hidden'));
            if (document.getElementById(resource).style.visibility != 'hidden') {
                //find the lowest resource rate
                if (currentRate === 0) {
                    currentRate = game.resources[resource].owned;
                    // debug('Current rate for ' + resource + ' is ' + currentRate + ' lowest ' + lowestResource + lowestResourceRate);
                    if ((haveWorkers) || (currentRate < lowestResourceRate)) {
                        // debug('New Lowest1 ' + resource + ' is ' + currentRate + ' lowest ' + lowestResource + lowestResourceRate+ ' haveworkers ' +haveWorkers);
                        haveWorkers = false;
                        lowestResource = resource;
                        lowestResourceRate = currentRate;
                    }
                }
                if ((currentRate < lowestResourceRate || lowestResourceRate == -1) && haveWorkers) {
                    // debug('New Lowest2 ' + resource + ' is ' + currentRate + ' lowest ' + lowestResource + lowestResourceRate);
                    lowestResource = resource;
                    lowestResourceRate = currentRate;
                }
            }
            // debug('Current Stats ' + resource + ' is ' + currentRate + ' lowest ' + lowestResource + lowestResourceRate+ ' haveworkers ' +haveWorkers);
        }
        if (game.global.playerGathering != lowestResource && !haveWorkers && !breedFire) {
            if (game.global.turkimpTimer > 0)
                setGather('metal');
            else
                setGather(lowestResource); //gather the lowest resource
            //This stuff seems to be repeated from above. Should be refactored and fixed so this is not confusing.
        } else if (getPageSetting('ManualGather2') != 2 && document.getElementById('scienceCollectBtn').style.display != 'none' && document.getElementById('science').style.visibility != 'hidden') {
            if (game.resources.science.owned < getPsString('science', true) * MODULES["gather"].minScienceSeconds && game.global.turkimpTimer < 1 && haveWorkers)
                setGather('science');
            else if (game.global.turkimpTimer > 0)
                setGather('metal');
            else
                setGather(lowestResource);
        }
        //refactored into the if else block above:
        //else if (getPageSetting('ManualGather2') != 2 && document.getElementById('scienceCollectBtn').style.display != 'none' && document.getElementById('science').style.visibility != 'hidden')
        //    setGather('science');
        //Build more traps if we have TrapTrimps on, and we own less than (100) traps.
        else if (trapTrimpsOK && game.global.trapBuildToggled == true && game.buildings.Trap.owned < MODULES["gather"].minTraps)
            setGather('buildings'); //confusing (was always like this, see commits @ 2/23/16).
        else
            setGather(lowestResource);
    }
}

//NEW: #2 "Auto Gather/Build"
function manualLabor2() {
    if (getPageSetting('ManualGather2') == 0) return;
    //vars
    var breedingTrimps = game.resources.trimps.owned - game.resources.trimps.employed;
    var trapTrimpsOK = getPageSetting('TrapTrimps');
    var targetBreed = getPageSetting('GeneticistTimer');
    var trapperTrapUntilFull = game.global.challengeActive == "Trapper" && game.resources.trimps.owned < game.resources.trimps.realMax();
    var watchJumpstartTraps = game.global.challengeActive == "Watch" && game.resources.trimps.owned < game.resources.trimps.realMax();

    //FRESH GAME LOWLEVEL NOHELIUM CODE.
    if (game.global.world <= 3 && game.global.totalHeliumEarned <= 5000) {
        if (game.global.buildingsQueue.length == 0 && (game.global.playerGathering != 'trimps' || game.buildings.Trap.owned == 0)) {
            if (!game.triggers.wood.done || game.resources.food.owned < 10 || Math.floor(game.resources.food.owned) < Math.floor(game.resources.wood.owned)) {
                setGather('food');
                return;
            } else {
                setGather('wood');
                return;
            }
        }
    }

    //Traps and Trimps:
    if ((watchJumpstartTraps || trapTrimpsOK) && (breedingTrimps < 5 || trapperTrapUntilFull) && game.buildings.Trap.owned == 0 && canAffordBuilding('Trap')) {
        //safeBuyBuilding returns false if item is already in queue
        if (!safeBuyBuilding('Trap'))
            setGather('buildings');
        return;
    } else if ((watchJumpstartTraps || trapTrimpsOK) && (breedingTrimps < 5 || trapperTrapUntilFull) && game.buildings.Trap.owned > 0) {
        setGather('trimps');
        if (trapperTrapUntilFull && (game.global.buildingsQueue.length == 0 || game.buildings.Trap.owned == 1) && !game.global.trapBuildAllowed && canAffordBuilding('Trap'))
            safeBuyBuilding('Trap'); //get ahead on trap building since it is always needed for Trapper
        return;
    }

    //Buildings:
    var manualBuildSpeedAdvantage = getPlayerModifier() / game.global.autoCraftModifier;
    //pre-requisites for all: have something in the build queue, and playerCraftmod does actually speed it up.
    if ((game.global.buildingsQueue.length && manualBuildSpeedAdvantage > 1) && //AND:
        //if we have 2 or more buildings in queue, and playerCraftmod is high enough (>3x autoCraftmod) to speed it up.
        ((game.global.buildingsQueue.length >= 2 && manualBuildSpeedAdvantage > 3) ||
            //Prioritize Storage buildings when they hit the front of the queue (in case they are the only object in the queue).
            (game.global.buildingsQueue[0] == 'Barn.1' || game.global.buildingsQueue[0] == 'Shed.1' || game.global.buildingsQueue[0] == 'Forge.1') ||
            //manualBuild traps if we have TrapTrimps on, AutoTraps on, and we own less than (100) traps.
            (trapTrimpsOK && game.global.trapBuildAllowed && game.global.trapBuildToggled && game.buildings.Trap.owned < MODULES["gather"].minTraps))) {
        setGather('buildings'); //buildBuildings = true;
        return;
    }

    //Sciencey:
    //if we have some upgrades sitting around which we don't have enough science for, gather science
    if (document.getElementById('scienceCollectBtn').style.display != 'none' && document.getElementById('science').style.visibility != 'hidden') {
        //if we have less than (100) science or less than a minute of science
        if (game.resources.science.owned < MODULES["gather"].minScienceAmount ||
            (game.resources.science.owned < getPsString('science', true) * MODULES["gather"].minScienceSeconds && game.global.turkimpTimer < 1))
            if (getPageSetting('ManualGather2') != 2) {
                setGather('science');
                return;
            }
        if (game.resources.science.owned < scienceNeeded) {
            //if manual is less than science production and turkimp, metal. (or science is set as disallowed)
            if ((getPlayerModifier() < getPerSecBeforeManual('Scientist') && game.global.turkimpTimer > 0) || getPageSetting('ManualGather2') == 2)
                setGather('metal');
            else if (getPageSetting('ManualGather2') != 2) {
                setGather('science');
                return;
            }
        }
    }

    //If we got here, without exiting, gather Normal Resources:
    var manualResourceList = {
        'food': 'Farmer',
        'wood': 'Lumberjack',
        'metal': 'Miner',
    };
    var lowestResource = 'food';
    var lowestResourceRate = -1;
    var haveWorkers = true;
    for (var resource in manualResourceList) {
        var job = manualResourceList[resource];
        var currentRate = game.jobs[job].owned * game.jobs[job].modifier;
        // debug('Current rate for ' + resource + ' is ' + currentRate + ' is hidden? ' + (document.getElementById(resource).style.visibility == 'hidden'));
        if (document.getElementById(resource).style.visibility != 'hidden') {
            //find the lowest resource rate
            if (currentRate === 0) {
                currentRate = game.resources[resource].owned;
                // debug('Current rate for ' + resource + ' is ' + currentRate + ' lowest ' + lowestResource + lowestResourceRate);
                if ((haveWorkers) || (currentRate < lowestResourceRate)) {
                    // debug('New Lowest1 ' + resource + ' is ' + currentRate + ' lowest ' + lowestResource + lowestResourceRate+ ' haveworkers ' +haveWorkers);
                    haveWorkers = false;
                    lowestResource = resource;
                    lowestResourceRate = currentRate;
                }
            }
            if ((currentRate < lowestResourceRate || lowestResourceRate == -1) && haveWorkers) {
                // debug('New Lowest2 ' + resource + ' is ' + currentRate + ' lowest ' + lowestResource + lowestResourceRate);
                lowestResource = resource;
                lowestResourceRate = currentRate;
            }
        }
        // debug('Current Stats ' + resource + ' is ' + currentRate + ' lowest ' + lowestResource + lowestResourceRate+ ' haveworkers ' +haveWorkers);
    }
    if (game.global.playerGathering != lowestResource && !haveWorkers && !breedFire) {
        if (game.global.turkimpTimer > 0)
            setGather('metal');
        else
            setGather(lowestResource); //gather the lowest resource
    } else if (game.global.turkimpTimer > 0)
        setGather('metal');
    else
        setGather(lowestResource);
    //ok
    return true;
}

function autoGoldenUpgrades() {
    //get the numerical value of the selected index of the dropdown box
    try {
        var setting = document.getElementById('AutoGoldenUpgrades').value;
        if (setting == "Off") return; //if disabled, exit.
        var num = getAvailableGoldenUpgrades();
        if (num == 0) return; //if we have nothing to buy, exit.
        //buy one upgrade per loop.
        if (setting != "Void") {
            buyGoldenUpgrade(setting);
        } else {
            buyGoldenUpgrade("Void");
            num = getAvailableGoldenUpgrades();
            if (num == 0) return; // we actually bought the upgrade.
            buyGoldenUpgrade("Battle"); // since we did not buy a "Void", we buy a "Battle" instead.
        }
    } catch (err) {
        debug("Error in autoGoldenUpgrades: " + err.message);
    }
}
