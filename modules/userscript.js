var userscriptOn = true; //controls the looping of userscripts and can be self-disabled
var globalvar0, globalvar1, globalvar2, globalvar3, globalvar4, globalvar5, globalvar6, globalvar7, globalvar8, globalvar9;


globalvar0 = false;
globalvar1 = 0;
globalvar2 = [1, 100, 1];
globalvar3 = [1, 1, 100];
globalvar4 = false;
globalvar5 = [];
globalvar6 = false;
globalvar7 = false;
globalvar8 = false;

function userAutoAbandonChallengeToggle() {
    globalvar0 = !globalvar0;
    return globalvar0;
}

function userAutoAbandonChallengeSetZone(userLevel) {
    globalvar1 = userLevel;
}

function userAutoAbandonChallenge() {
    if (globalvar1 > 0) {
        if ((game.global.world >= globalvar1) && game.global.challengeActive != "") abandonChallenge();
    }
}

function userCheckSiphonUsage() {
    var siphlvl = game.global.world - game.portal.Siphonology.level;
    var maxlvl = game.talents.mapLoot.purchased ? game.global.world - 1 : game.global.world;
    if (getPageSetting('DynamicSiphonology')) {
        for (siphlvl; siphlvl < maxlvl; siphlvl++) {
            //check HP vs damage and find how many siphonology levels we need.
            var maphp = getEnemyMaxHealth(siphlvl) * 1.1; // 1.1 mod is for all maps (taken out of the function)
            var cpthlth = getCorruptScale("health") / 2; //get corrupted health mod
            if (mutations.Magma.active()) maphp *= cpthlth;
            var mapdmg = ourBaseDamage2 * (game.unlocks.imps.Titimp ? 2 : 1); // *2 for titimp. (ourBaseDamage2 has no mapbonus in it)
            if (game.upgrades.Dominance.done && !getPageSetting('ScryerUseinMaps2')) mapdmg *= 4; //dominance stance and not-scryer stance in maps.
            if (mapdmg < maphp) {
                break;
            }
        }
    }
    return (siphlvl == maxlvl);
}

function userSetCutoffs() {
    var userCritChance = getPlayerCritChance();
    var userCritDmg = getPlayerCritDamageMult();
    var userCritAvgMult = ((1 - userCritChance) + (userCritChance * userCritDmg));
    var userOverkillLevel = game.portal.Overkill.level;
    if (userOverkillLevel > 0) {
        MODULES["automaps"].enoughDamageCutoff = (0.5 * userCritDmg) / (1 + (200 / userOverkillLevel));
        MODULES["automaps"].farmingCutoff = 70 * userCritAvgMult;
    } else {
        MODULES["automaps"].enoughDamageCutoff = (4 * userCritDmg);
        MODULES["automaps"].farmingCutoff = 5 * (4 * userCritDmg);
    }
}

function userSetVoidMaps() {
    var userCurrentZonesetting = getPageSetting('VoidMaps');
    var userToSet = 0;
    for (var i = globalvar5.length; i--;) {
        if (game.global.world <= globalvar5[i]) {
            userToSet = globalvar5[i];
        }
    }
    if (userCurrentZonesetting != userToSet) {
        setPageSetting('VoidMaps', userToSet);
    }
}

function userscripts() {
    if (globalvar0) userAutoAbandonChallenge();
    if (globalvar8) userSetCutoffs();
    if (globalvar6) userSetVoidMaps();
    if (globalvar7) autodimgen();
}
