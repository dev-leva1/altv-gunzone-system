import * as alt from 'alt-client';
import * as native from 'natives';

const MAZE_BANK_ARENA_POS = { x: -248.49, y: -2010.51, z: 30.14 };
let menuOpen = false;
let view = null;
let hudView = null;

function distance(pos1, pos2) {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    const dz = pos2.z - pos1.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function toggleMenuState(state) {
    menuOpen = state;
    alt.showCursor(state);
    alt.toggleGameControls(!state);
}

function playHoverSound() {
    native.playSoundFrontend(-1, "NAV_UP_DOWN", "HUD_FRONTEND_DEFAULT_SOUNDSET", true);
}

function createHUD() {
    if (hudView) {
        hudView.destroy();
    }
    hudView = new alt.WebView("http://resource/client/html/hud.html");
}

function destroyHUD() {
    if (hudView) {
        hudView.destroy();
        hudView = null;
    }
}

alt.everyTick(() => {
    const playerPos = alt.Player.local.pos;
    const dist = distance(playerPos, MAZE_BANK_ARENA_POS);
    
    if (dist <= 3) {
        if (!menuOpen) {
            native.beginTextCommandDisplayHelp('STRING');
            native.addTextComponentSubstringPlayerName('Press ~INPUT_CONTEXT~ to open GunZone menu');
            native.endTextCommandDisplayHelp(0, false, true, -1);
        }
        
        if (native.isControlJustPressed(0, 38)) {
            if (!menuOpen) {
                alt.emitServer('gunzone:openMenu');
            }
        }
    }
});

alt.everyTick(() => {
    native.drawMarker(1, MAZE_BANK_ARENA_POS.x, MAZE_BANK_ARENA_POS.y, MAZE_BANK_ARENA_POS.z - 1,
        0, 0, 0, 0, 0, 0, 2.0, 2.0, 1.0, 255, 0, 0, 200, false, false, 2, false, null, null, false);
});

alt.onServer('gunzone:closeMenu', () => {
    if (view) {
        view.destroy();
        view = null;
    }
    toggleMenuState(false);
});

alt.onServer('gunzone:showMenu', () => {
    if (view) {
        view.destroy();
    }
    
    view = new alt.WebView("http://resource/client/html/index.html", true);
    view.focus();
    toggleMenuState(true);
    
    view.on('gunzone:playHoverSound', () => {
        playHoverSound();
    });
    
    view.on('gunzone:selectMode', (mode) => {
        alt.emitServer('gunzone:selectMode', mode);
        view.destroy();
        view = null;
        toggleMenuState(false);
    });
});

alt.on('keyup', (key) => {
    if (key === 27 && menuOpen) {
        if (view) {
            view.destroy();
            view = null;
        }
        toggleMenuState(false);
    }
});

alt.onServer('gunzone:startGame', (modeName) => {
    createHUD();
    if (hudView) {
        hudView.emit('updateModeName', modeName);
    }
});

alt.onServer('gunzone:endGame', () => {
    destroyHUD();
});

alt.onServer('gunzone:updateStats', (kills, deaths) => {
    if (hudView) {
        hudView.emit('updatePlayerStats', kills, deaths);
    }
});

alt.onServer('gunzone:updateTopPlayers', (topPlayers) => {
    if (hudView) {
        hudView.emit('updateTopPlayers', topPlayers);
    }
});

alt.onServer('gunzone:showTeamDamageMessage', () => {
    showNotification('~r~You cannot damage teammates!');
});

function showNotification(message) {
    native.beginTextCommandThefeedPost('STRING');
    native.addTextComponentSubstringPlayerName(message);
    native.endTextCommandThefeedPostTicker(false, true);
} 