import * as alt from 'alt-server';
import * as chat from 'chat';

const MAZE_BANK_ARENA_POS = { x: -248.49, y: -2010.51, z: 30.14 };

const GAME_LOCATIONS = {
    deathmatch: {
        name: "Sawmill",
        dimension: 1,
        spawns: [
            { x: -557.75, y: 5385.45, z: 70.35 },
            { x: -552.97, y: 5376.96, z: 70.35 },
            { x: -545.23, y: 5386.92, z: 70.35 },
            { x: -534.42, y: 5372.45, z: 70.35 }
        ]
    },
    team: {
        name: "Abandoned Factory",
        dimension: 2,
        spawns: {
            team1: [
                { x: 2747.77, y: 1531.05, z: 30.79 },
                { x: 2752.96, y: 1536.48, z: 30.79 }
            ],
            team2: [
                { x: 2808.47, y: 1587.05, z: 30.79 },
                { x: 2813.66, y: 1592.48, z: 30.79 }
            ]
        },
        skins: {
            team1: 'g_m_y_ballasout_01',
            team2: 'g_m_y_famca_01'
        }
    },
    capture: {
        name: "Port",
        dimension: 3,
        spawns: [
            { x: 1239.77, y: -2945.05, z: 8.79 },
            { x: 1244.96, y: -2950.48, z: 8.79 },
            { x: 1234.58, y: -2939.86, z: 8.79 }
        ],
        capturePoints: [
            { x: 1239.77, y: -2915.05, z: 8.79, owner: null },
            { x: 1289.77, y: -2945.05, z: 8.79, owner: null },
            { x: 1239.77, y: -2975.05, z: 8.79, owner: null }
        ]
    }
};

const WEAPONS = {
    deathmatch: [0x1B06D571, 0x2BE6766B, 0x05FC3C11, 0x7F7497E5, 0x0C472FE2],
    team: [0x1B06D571, 0x2BE6766B, 0x7F7497E5],
    capture: [0x1B06D571, 0x2BE6766B, 0x7F7497E5, 0x0C472FE2]
};

class GunZone {
    constructor() {
        this.players = new Map();
        this.activeGames = new Map();
        this.setupEvents();
        
        alt.setInterval(() => {
            this.updateAllPlayersStats();
        }, 5000);

        alt.on('entityDamage', (target, attacker, damage, weapon) => {
            this.handleDamage(target, attacker, damage, weapon);
        });
    }

    setupEvents() {
        alt.on('playerConnect', (player) => {
            this.players.set(player, {
                inGame: false,
                gameMode: null,
                team: null,
                kills: 0,
                deaths: 0
            });
        });

        alt.on('playerDisconnect', (player) => {
            this.removePlayerFromGame(player);
            this.players.delete(player);
        });

        alt.on('playerDeath', (victim, killer, weaponHash) => {
            this.handlePlayerDeath(victim, killer);
        });
    }

    updatePlayerStats(player) {
        const playerData = this.players.get(player);
        if (!playerData || !playerData.inGame) return;

        alt.emitClient(player, 'gunzone:updateStats', playerData.kills, playerData.deaths);

        const game = this.activeGames.get(playerData.gameMode);
        if (game) {
            const topPlayers = game.players
                .map(p => {
                    const data = this.players.get(p);
                    return {
                        name: p.name,
                        kills: data.kills
                    };
                })
                .sort((a, b) => b.kills - a.kills)
                .slice(0, 3);

            alt.emitClient(player, 'gunzone:updateTopPlayers', topPlayers);
        }
    }

    updateAllPlayersStats() {
        for (const [mode, game] of this.activeGames) {
            for (const player of game.players) {
                this.updatePlayerStats(player);
            }
        }
    }

    handlePlayerDeath(victim, killer) {
        const victimData = this.players.get(victim);
        if (!victimData || !victimData.inGame) return;

        victimData.deaths++;
        if (killer) {
            const killerData = this.players.get(killer);
            if (killerData) {
                killerData.kills++;
                this.updatePlayerStats(killer);
            }
        }

        this.updatePlayerStats(victim);

        alt.setTimeout(() => {
            if (victim && victim.valid) {
                this.respawnPlayer(victim);
            }
        }, 3000);
    }

    respawnPlayer(player) {
        const playerData = this.players.get(player);
        if (!playerData || !playerData.inGame) return;

        const gameMode = playerData.gameMode;
        const location = GAME_LOCATIONS[gameMode];

        let spawnPoint;
        if (gameMode === 'team') {
            const teamSpawns = location.spawns[playerData.team];
            spawnPoint = teamSpawns[Math.floor(Math.random() * teamSpawns.length)];
        } else {
            spawnPoint = location.spawns[Math.floor(Math.random() * location.spawns.length)];
        }

        player.spawn(spawnPoint.x, spawnPoint.y, spawnPoint.z);
        player.dimension = location.dimension;
        this.giveRandomWeapons(player, gameMode);
        player.health = 100;
        player.armour = 100;
    }

    giveRandomWeapons(player, mode) {
        player.removeAllWeapons();
        const availableWeapons = WEAPONS[mode];
        const weaponsToGive = 2;
        const selectedWeapons = new Set();

        while (selectedWeapons.size < weaponsToGive) {
            const weapon = availableWeapons[Math.floor(Math.random() * availableWeapons.length)];
            selectedWeapons.add(weapon);
        }

        for (const weapon of selectedWeapons) {
            player.giveWeapon(weapon, 999, true);
        }
    }

    removePlayerFromGame(player) {
        const playerData = this.players.get(player);
        if (playerData && playerData.inGame) {
            const game = this.activeGames.get(playerData.gameMode);
            if (game) {
                game.players = game.players.filter(p => p !== player);
                
                if (game.players.length === 0) {
                    this.activeGames.delete(playerData.gameMode);
                } else {
                    for (const p of game.players) {
                        this.updatePlayerStats(p);
                    }
                }
            }
            
            player.dimension = 0;
            player.pos = MAZE_BANK_ARENA_POS;
            playerData.inGame = false;
            playerData.gameMode = null;
            playerData.team = null;
            
            player.removeAllWeapons();
            alt.emitClient(player, 'gunzone:endGame');
            chat.send(player, '{00FF00}You have left the mode and been teleported to GunZone entrance');
            player.model = alt.hash('mp_m_freemode_01');
        }
    }

    startGame(mode, player) {
        const playerData = this.players.get(player);
        if (!playerData) return;

        let game = this.activeGames.get(mode);
        if (!game) {
            game = {
                mode: mode,
                players: [],
                started: false,
                scores: new Map(),
                team1Score: 0,
                team2Score: 0
            };
            this.activeGames.set(mode, game);
        }

        game.players.push(player);
        playerData.inGame = true;
        playerData.gameMode = mode;
        playerData.kills = 0;
        playerData.deaths = 0;

        if (mode === 'team') {
            const team1Count = game.players.filter(p => this.players.get(p).team === 'team1').length;
            const team2Count = game.players.filter(p => this.players.get(p).team === 'team2').length;
            const team = team1Count <= team2Count ? 'team1' : 'team2';
            this.setPlayerTeam(player, team);
        }

        chat.send(player, `{00FF00}You have joined the mode: ${GAME_LOCATIONS[mode].name}`);
        chat.send(player, '{FFFF00}Use /exitdm to leave the mode');
        
        alt.emitClient(player, 'gunzone:startGame', GAME_LOCATIONS[mode].name);
        this.updatePlayerStats(player);
        this.respawnPlayer(player);
    }

    handleDamage(target, attacker, damage, weapon) {
        if (!(target instanceof alt.Player) || !(attacker instanceof alt.Player)) return;

        const targetData = this.players.get(target);
        const attackerData = this.players.get(attacker);

        if (!targetData?.inGame || !attackerData?.inGame || 
            targetData.gameMode !== attackerData.gameMode) return;

        if (targetData.gameMode === 'team') {
            if (targetData.team === attackerData.team) {
                alt.emitClient(attacker, 'gunzone:showTeamDamageMessage');
                return false;
            }
        }
    }

    setPlayerTeam(player, team) {
        const playerData = this.players.get(player);
        if (!playerData) return;

        playerData.team = team;
        
        if (playerData.gameMode === 'team') {
            const teamSkin = GAME_LOCATIONS.team.skins[team];
            player.model = alt.hash(teamSkin);
        }

        const teamName = team === 'team1' ? 'Purple' : 'Green';
        chat.send(player, `{00FF00}You have joined team: ${teamName}`);
    }
}

const gunZone = new GunZone();

chat.registerCmd('exitdm', (player) => {
    const playerData = gunZone.players.get(player);
    if (playerData && playerData.inGame) {
        gunZone.removePlayerFromGame(player);
    } else {
        chat.send(player, '{FF0000}You are not in GunZone mode');
    }
});

alt.onClient('gunzone:openMenu', (player) => {
    alt.emitClient(player, 'gunzone:showMenu');
});

alt.onClient('gunzone:selectMode', (player, mode) => {
    gunZone.startGame(mode, player);
}); 