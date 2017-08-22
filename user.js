// ==UserScript==
// @name         AutoTrimps-FirenX
// @namespace    https://github.com/FirenX/AutoTrimps
// @version      3.0.0.0-FirenX-08-21-2017
// @description  Automate all the trimps!
// @author       zininzinin, spindrjr, Ishkaru, genBTC, FirenX
// @include        *trimps.github.io*
// @include        *kongregate.com/games/GreenSatellite/trimps
// @grant        none
// ==/UserScript==

var script = document.createElement('script');
script.id = 'AutoTrimps-script';
script.src = 'https://FirenX.github.io/AutoTrimps/AutoTrimps2.js';
document.head.appendChild(script);

// This File is Deprecated, please use .user.js instead (with the leading dot) so TamperMonkey/Greasemonkey can detect it as a script automatically.
// Other than that they are identical and no change is required on your part if everything is working already.
