# GunZone - PvP Game Mode for alt:V

A dynamic PvP game mode system for alt:V multiplayer modification for GTA V.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![alt:V](https://img.shields.io/badge/alt:V-compatible-brightgreen.svg)

## Features

- 3 Unique Game Modes:
  - Deathmatch at Sawmill
  - Team Battle at Abandoned Factory
  - Capture Points at Port
- Team System:
  - Automatic team balancing
  - Team-specific skins
  - Friendly fire prevention
- Weapon System:
  - Random weapon spawns
  - Mode-specific weapon sets
  - Automatic rearm on respawn
- Statistics:
  - Kill/Death tracking
  - Top players leaderboard
  - Real-time stats updates
- Modern UI:
  - Clean and responsive design
  - Game mode selection menu
  - In-game HUD with stats
  - Top players display

## Installation

1. Copy the `gunzone` folder to your server's `resources` directory
2. Add the following to your `server.toml`:
```toml
resources = [
    'gunzone'
]
```

## Usage

1. Go to the Maze Bank Arena entrance
2. Press E to open the game mode selection menu
3. Choose your preferred game mode
4. Use `/exitdm` command to leave the game mode

## Game Modes

### Deathmatch
- Every player for themselves
- Random weapon spawns
- Last survivor wins

### Team Battle
- Two teams: Purple vs Green
- Team-specific spawn points
- Friendly fire disabled
- Team-based scoring

### Capture Points
- Multiple capture points
- Territory control
- Strategic gameplay

## Dependencies

- alt:V Server
- Chat resource

## Commands

- `/exitdm` - Leave the current game mode

## Configuration

Game locations and weapon sets can be modified in `server/index.js`:

```javascript
const GAME_LOCATIONS = {
    deathmatch: {
        name: "Sawmill",
        dimension: 1,
        spawns: [...]
    },
    // Add more locations as needed
};

const WEAPONS = {
    deathmatch: [0x1B06D571, 0x2BE6766B, ...],
    // Modify weapon sets as needed
};
```

## License

This project is licensed under the MIT License.

## Credits

- alt:V Team for the multiplayer platform
- Contributors and testers 
