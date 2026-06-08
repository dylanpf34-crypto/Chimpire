<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Chimpire: Toy City Run - Ultimate Edition</title>
    
    <!-- Tailwind CSS for UI -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Three.js for 3D Engine -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>
    
    <!-- Cheerful, playful Google Font -->
    <link href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;700;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" type="text/css" href="app.css">
</head>
<body>

    <!-- Loading Screen - Toy Themed -->
    <div id="loading-screen">
        <div class="loading-toy-blocks">
            <div class="loading-block"></div>
            <div class="loading-block"></div>
            <div class="loading-block"></div>
        </div>
        <div class="loading-text">
            <div class="text-2xl text-slate-800 text-outline" style="font-family: 'Fredoka One', cursive;">
                Loading Chimpire...
            </div>
        </div>
    </div>

    <!-- 3D Engine Canvas -->
    <div id="game-canvas"></div>

    <!-- Particle Container -->
    <div id="particle-container"></div>

    <!-- Combo Display -->
    <div id="combo-display"></div>

    <!-- UI Layer -->
    <div id="ui-layer" class="p-4 sm:p-6">
        
        <!-- Top HUD -->
        <div class="flex justify-between items-start w-full">
            <div class="flex flex-col gap-2">
                <div class="hud-panel text-2xl sm:text-3xl text-yellow-400 text-outline">
                    🍌 <span id="score-display">0</span>
                </div>
                <div class="hud-panel text-lg text-blue-400 text-outline py-1 px-3">
                    <i data-lucide="trophy" class="w-4 h-4 text-yellow-500"></i> <span id="highscore-display">0</span>
                </div>
                <div class="hud-panel text-sm font-sans-bold text-green-600 py-1 px-3">
                    <span id="combo-text">Combo: x<span id="combo-value">1</span></span>
                </div>
            </div>
            
            <div class="flex flex-col items-end gap-2">
                <div class="hud-panel text-xl sm:text-2xl text-blue-400 text-outline">
                    <span id="dist-display">0</span>m
                </div>
                <div class="hud-panel text-sm font-sans-bold text-purple-600 py-1 px-3">
                    Speed: <span id="speed-display">100</span>%
                </div>
                <div class="flex gap-2">
                    <button class="toy-btn btn-icon bg-white" onclick="togglePause()" title="Pause (P)">
                        <i data-lucide="pause" class="w-5 h-5"></i>
                    </button>
                    <button class="toy-btn btn-icon bg-white" onclick="openSettings()" title="Settings">
                        <i data-lucide="settings" class="w-5 h-5"></i>
                    </button>
                    <button id="hud-hq-btn" class="toy-btn btn-icon btn-blue" onclick="openHQ()" title="Monkey HQ">
                        <i data-lucide="home" class="w-5 h-5"></i>
                    </button>
                </div>
            </div>
        </div>

        <!-- Power-up Bar -->
        <div class="flex justify-center pb-4 pointer-events-none">
            <div class="hud-panel" id="powerup-container" style="display: none;">
                <i data-lucide="zap" class="w-5 h-5 text-yellow-500"></i>
                <span class="font-sans-bold text-sm">Power-up: <span id="powerup-name">None</span></span>
                <div class="progress-bar w-32 h-3">
                    <div class="progress-fill bg-yellow-400" id="powerup-timer" style="width: 100%;"></div>
                </div>
            </div>
        </div>

        <!-- Controls Hint -->
        <div class="flex justify-center pb-8 pointer-events-none">
            <div class="hud-panel text-slate-600 text-sm font-sans-bold hidden md:flex">
                ⬅️ ➡️ Dodge &nbsp;|&nbsp; ⬆️ Jump &nbsp;|&nbsp; P Pause &nbsp;|&nbsp; HQ to Upgrade
            </div>
            <div class="hud-panel text-slate-600 text-sm font-sans-bold flex md:hidden">
                Swipe to Dodge / Jump | Tap HQ to Upgrade
            </div>
        </div>
    </div>

    <!-- Start Screen -->
    <div id="start-screen" class="overlay">
        <div class="menu-card">
            <h1 class="text-5xl sm:text-6xl text-yellow-400 text-outline mb-1 tracking-wide">Chimpire</h1>
            <p class="font-sans-bold text-lg text-slate-500 mb-2">Toy City Run & Corporate Takeover</p>
            <p class="font-sans-normal text-sm text-slate-400 mb-6">Ultimate Edition v2.0</p>
            
            <div class="flex flex-col gap-3 mb-4">
                <button class="toy-btn w-full text-2xl py-3" onclick="startGame()">
                    <i data-lucide="play" class="w-6 h-6"></i> START RUN
                </button>
                <button class="toy-btn w-full btn-blue text-xl py-3" onclick="openHQ()">
                    <i data-lucide="shield" class="w-5 h-5"></i> MONKEY HQ
                </button>
                <button class="toy-btn w-full btn-purple text-xl py-3" onclick="openStats()">
                    <i data-lucide="bar-chart" class="w-5 h-5"></i> STATS & MISSIONS
                </button>
            </div>

            <div class="text-left bg-white/50 rounded-xl p-3 border-2 border-slate-300">
                <div class="font-sans-bold text-sm text-slate-700 mb-2">🎮 Quick Stats:</div>
                <div class="grid grid-cols-2 gap-2 text-xs font-sans-normal">
                    <div>Total Runs: <span class="font-bold" id="menu-total-runs">0</span></div>
                    <div>Best Score: <span class="font-bold" id="menu-best-score">0</span></div>
                    <div>Level: <span class="font-bold" id="menu-monkey-level">1</span></div>
                    <div>Bananas: <span class="font-bold" id="menu-total-bananas">0</span></div>
                </div>
            </div>
        </div>
    </div>

    <!-- Monkey HQ (Upgrades, Gear, Army, Takeovers) -->
    <div id="hq-screen" class="overlay hidden">
        <div class="menu-card max-w-lg">
            <div class="flex justify-between items-center border-b-4 border-slate-800 pb-3 mb-4">
                <h1 class="text-3xl text-yellow-400 text-outline flex items-center gap-2">
                    <i data-lucide="home" class="w-8 h-8"></i> MONKEY HQ
                </h1>
                <button class="toy-btn btn-icon btn-red" onclick="closeHQ()">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>

            <!-- HQ Bananas Wallet -->
            <div class="bg-gradient-to-r from-yellow-100 to-yellow-200 border-4 border-slate-800 rounded-xl p-3 mb-4 flex justify-between items-center px-4">
                <span class="text-slate-700 text-lg font-sans-bold">Your Bananas:</span>
                <span class="text-2xl text-yellow-500 text-outline">🍌 <span id="hq-banana-val">0</span></span>
            </div>

            <!-- Tab Buttons -->
            <div class="flex gap-1 mb-4 overflow-x-auto pb-1">
                <button class="toy-btn text-xs px-3 py-2 flex-1 bg-yellow-400" id="tab-btn-gear" onclick="switchHQTab('gear')">
                    <i data-lucide="shopping-bag" class="w-4 h-4"></i> Gear
                </button>
                <button class="toy-btn text-xs px-3 py-2 flex-1 bg-slate-200" id="tab-btn-army" onclick="switchHQTab('army')">
                    <i data-lucide="users" class="w-4 h-4"></i> Army
                </button>
                <button class="toy-btn text-xs px-3 py-2 flex-1 bg-slate-200" id="tab-btn-level" onclick="switchHQTab('level')">
                    <i data-lucide="trending-up" class="w-4 h-4"></i> Training
                </button>
                <button class="toy-btn text-xs px-3 py-2 flex-1 bg-slate-200" id="tab-btn-takeover" onclick="switchHQTab('takeover')">
                    <i data-lucide="target" class="w-4 h-4"></i> Takeover
                </button>
            </div>

            <!-- Tab Content: Gear -->
            <div id="tab-gear" class="space-y-3">
                <p class="font-sans-bold text-xs text-slate-500 mb-2">Buy gear that visibly renders on your 3D monkey in game!</p>
                <div class="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1" id="gear-list">
                    <!-- Dynamic Gear Cards -->
                </div>
            </div>

            <!-- Tab Content: Army -->
            <div id="tab-army" class="space-y-3 hidden">
                <p class="font-sans-bold text-xs text-slate-500 mb-2">Build a Primate Army to generate passive bananas every second!</p>
                <div class="bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl p-2 text-xs font-sans-bold text-blue-700 mb-2">
                    Current Passive Income: <span class="text-green-600 text-lg">🍌 <span id="hq-passive-rate">0</span>/sec</span>
                </div>
                <div class="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1" id="army-list">
                    <!-- Dynamic Army Cards -->
                </div>
            </div>

            <!-- Tab Content: Training Level -->
            <div id="tab-level" class="space-y-3 hidden">
                <div class="bg-gradient-to-br from-slate-100 to-slate-200 border-4 border-slate-800 rounded-xl p-4 text-center">
                    <h3 class="text-2xl text-blue-500 mb-2">Monkey Level: <span id="monkey-lvl-text">1</span></h3>
                    <div class="progress-bar mb-3">
                        <div class="progress-fill" id="level-progress" style="width: 0%;"></div>
                    </div>
                    <p class="font-sans-bold text-sm text-slate-600 my-2">Provides a permanent <span class="text-green-600 text-lg" id="monkey-mult-text">1.0x</span> multiplier on run scores & bananas collected!</p>
                    <div class="grid grid-cols-2 gap-2 text-xs font-sans-bold text-slate-600 mb-3">
                        <div class="bg-white rounded-lg p-2 border-2 border-slate-300">
                            Total XP: <span class="text-blue-600" id="total-xp-text">0</span>
                        </div>
                        <div class="bg-white rounded-lg p-2 border-2 border-slate-300">
                            Next Level: <span class="text-purple-600" id="next-lvl-xp">100</span>
                        </div>
                    </div>
                    <button class="toy-btn btn-green w-full mt-2" id="btn-lvlup" onclick="buyLevelUp()">
                        Train Monkey (+1 Level) <br><span class="text-sm">Cost: 🍌 <span id="lvlup-cost">100</span></span>
                    </button>
                </div>
            </div>

            <!-- Tab Content: Corporate Takeover -->
            <div id="tab-takeover" class="space-y-3 hidden">
                <p class="font-sans-bold text-xs text-slate-500 mb-2">Compete with rival tech & toy companies! Win timing battles to seize their assets for giant multipliers.</p>
                <div class="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1" id="company-list">
                    <!-- Dynamic Company Cards -->
                </div>
            </div>
        </div>
    </div>

    <!-- Stats & Missions Screen -->
    <div id="stats-screen" class="overlay hidden">
        <div class="menu-card max-w-lg">
            <div class="flex justify-between items-center border-b-4 border-slate-800 pb-3 mb-4">
                <h1 class="text-3xl text-purple-400 text-outline flex items-center gap-2">
                    <i data-lucide="bar-chart" class="w-8 h-8"></i> STATS
                </h1>
                <button class="toy-btn btn-icon btn-red" onclick="closeStats()">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>

            <!-- Lifetime Stats -->
            <div class="mb-4">
                <h3 class="font-sans-bold text-lg text-slate-700 mb-2 flex items-center gap-2">
                    <i data-lucide="award" class="w-5 h-5 text-yellow-500"></i> Lifetime Statistics
                </h3>
                <div class="space-y-2" id="stats-list">
                    <!-- Dynamic stats -->
                </div>
            </div>

            <!-- Daily Missions -->
            <div class="mb-4">
                <h3 class="font-sans-bold text-lg text-slate-700 mb-2 flex items-center gap-2">
                    <i data-lucide="target" class="w-5 h-5 text-green-500"></i> Daily Missions
                </h3>
                <div class="space-y-2" id="missions-list">
                    <!-- Dynamic missions -->
                </div>
            </div>

            <!-- Local Leaderboard -->
            <div>
                <h3 class="font-sans-bold text-lg text-slate-700 mb-2 flex items-center gap-2">
                    <i data-lucide="trophy" class="w-5 h-5 text-orange-500"></i> Top Runs
                </h3>
                <div class="space-y-2 max-h-48 overflow-y-auto" id="leaderboard-list">
                    <!-- Dynamic leaderboard -->
                </div>
            </div>

            <button class="toy-btn w-full mt-4" onclick="closeStats()">CLOSE</button>
        </div>
    </div>

    <!-- Clicker Takeover Battle Mini-Game Screen -->
    <div id="battle-screen" class="overlay hidden">
        <div class="menu-card max-w-md border-red-500">
            <h1 class="text-3xl text-red-500 text-outline mb-1">COMPANY TAKEOVER</h1>
            <p class="font-sans-bold text-sm text-slate-500 mb-4" id="battle-company-name">BananaCorp</p>

            <!-- Progress Bar / Market Share -->
            <div class="space-y-1 mb-4">
                <div class="flex justify-between text-xs font-sans-bold">
                    <span>Your Ownership: <span class="text-green-600 text-lg" id="battle-ownership">0%</span></span>
                    <span>Target: <span class="text-blue-600">100%</span></span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill bg-green-500" id="battle-progress-bar" style="width: 0%;"></div>
                </div>
            </div>

            <!-- Timing/Slider Interaction Game -->
            <div class="bg-slate-100 border-4 border-slate-800 rounded-xl p-4 mb-4">
                <p class="font-sans-bold text-xs text-slate-600 mb-3">Tap/Click "TAKEOVER BOOST" when the red pointer is inside the green sweet spot!</p>
                <div class="slider-track mb-4">
                    <div class="slider-sweet" id="battle-slider-sweet" style="left: 40%; width: 20%;"></div>
                    <div class="slider-pointer" id="battle-slider-pointer" style="left: 0%;"></div>
                </div>
                <button class="toy-btn btn-green w-full py-3 text-lg" onclick="triggerTakeoverClick()">
                    🚀 TAKEOVER BOOST!
                </button>
                <div class="mt-2 text-center font-sans-bold text-sm">
                    <span class="text-green-600">Perfect Hits: <span id="battle-perfect-hits">0</span></span> | 
                    <span class="text-red-600">Misses: <span id="battle-misses">0</span></span>
                </div>
            </div>

            <!-- Timing Stats -->
            <div class="flex justify-between items-center text-sm font-sans-bold text-slate-600 px-2 mb-4">
                <span>Time Left: <span class="text-red-500 text-xl" id="battle-time-left">20s</span></span>
                <span>Army DPS: <span class="text-green-600" id="battle-army-dps">0%</span>/s</span>
            </div>

            <button class="toy-btn btn-red w-full" onclick="retreatFromBattle()">
                <i data-lucide="flag" class="w-5 h-5"></i> RETREAT
            </button>
        </div>
    </div>

    <!-- Pause Screen -->
    <div id="pause-screen" class="overlay hidden">
        <div class="menu-card border-blue-500">
            <h1 class="text-4xl text-blue-400 text-outline mb-2">Paused</h1>
            <div class="bg-white/50 rounded-xl p-3 border-2 border-slate-300 mb-6">
                <div class="text-sm font-sans-bold text-slate-600">Current Run:</div>
                <div class="grid grid-cols-2 gap-2 mt-2 text-sm font-sans-normal">
                    <div>Score: <span class="font-bold text-yellow-600" id="pause-score">0</span></div>
                    <div>Distance: <span class="font-bold text-blue-600" id="pause-dist">0m</span></div>
                    <div>Combo: <span class="font-bold text-green-600" id="pause-combo">x1</span></div>
                    <div>Speed: <span class="font-bold text-purple-600" id="pause-speed">100%</span></div>
                </div>
            </div>
            <div class="flex flex-col gap-3">
                <button class="toy-btn w-full btn-blue animate-pulse" onclick="togglePause()">
                    <i data-lucide="play" class="w-5 h-5"></i> RESUME RUN
                </button>
                <button class="toy-btn w-full btn-purple" onclick="openSettings()">
                    <i data-lucide="settings" class="w-5 h-5"></i> SETTINGS
                </button>
                <button class="toy-btn w-full bg-slate-200" onclick="quitGame()">
                    <i data-lucide="log-out" class="w-5 h-5"></i> QUIT TO HQ
                </button>
            </div>
        </div>
    </div>

    <!-- Settings Screen -->
    <div id="settings-screen" class="overlay hidden">
        <div class="menu-card">
            <div class="flex justify-between items-center border-b-4 border-slate-800 pb-3 mb-4">
                <h1 class="text-3xl text-slate-700 text-outline">Settings</h1>
                <button class="toy-btn btn-icon btn-red" onclick="closeSettings()">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>
            
            <div class="space-y-4 mb-6 text-left font-sans-bold text-slate-700">
                <div class="stat-item">
                    <div>
                        <div class="text-base">Camera Bobbing</div>
                        <div class="text-xs font-sans-normal text-slate-500">Adds dynamic camera movement</div>
                    </div>
                    <input type="checkbox" id="set-bobbing" class="toggle-switch" checked onchange="updateSettings()">
                </div>
                <div class="stat-item">
                    <div>
                        <div class="text-base">Detailed Shadows</div>
                        <div class="text-xs font-sans-normal text-slate-500">Higher quality but may reduce FPS</div>
                    </div>
                    <input type="checkbox" id="set-shadows" class="toggle-switch" checked onchange="updateSettings()">
                </div>
                <div class="stat-item">
                    <div>
                        <div class="text-base">Particles</div>
                        <div class="text-xs font-sans-normal text-slate-500">Show floating banana particles</div>
                    </div>
                    <input type="checkbox" id="set-particles" class="toggle-switch" checked onchange="updateSettings()">
                </div>
                <div class="stat-item">
                    <div>
                        <div class="text-base">Music</div>
                        <div class="text-xs font-sans-normal text-slate-500">Background music (coming soon)</div>
                    </div>
                    <input type="checkbox" id="set-music" class="toggle-switch" disabled>
                </div>
                <div class="stat-item">
                    <div>
                        <div class="text-base">Sound Effects</div>
                        <div class="text-xs font-sans-normal text-slate-500">Game sound effects (coming soon)</div>
                    </div>
                    <input type="checkbox" id="set-sfx" class="toggle-switch" disabled>
                </div>
            </div>
            
            <div class="bg-red-50 border-3 border-red-300 rounded-xl p-3 mb-4">
                <h3 class="font-sans-bold text-red-700 mb-2 flex items-center gap-2">
                    <i data-lucide="alert-triangle" class="w-5 h-5"></i> Danger Zone
                </h3>
                <button class="toy-btn btn-red w-full text-sm" onclick="confirmResetProgress()">
                    <i data-lucide="trash-2" class="w-4 h-4"></i> RESET ALL PROGRESS
                </button>
            </div>

            <button class="toy-btn btn-green w-full" onclick="closeSettings()">
                <i data-lucide="check" class="w-5 h-5"></i> SAVE & CLOSE
            </button>
        </div>
    </div>

    <!-- Game Over Screen -->
    <div id="game-over-screen" class="overlay hidden">
        <div class="menu-card">
            <h1 class="text-5xl text-red-500 text-outline mb-2">Busted!</h1>
            <p class="font-sans-bold text-lg text-slate-600 mb-6" id="death-reason">You crashed!</p>
            
            <div class="bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl p-4 mb-4 border-3 border-slate-300">
                <div class="text-4xl text-yellow-500 text-outline mb-2">
                    🍌 <span id="final-score">0</span>
                </div>
                <div class="grid grid-cols-2 gap-3 text-sm font-sans-bold text-slate-600">
                    <div class="bg-white rounded-lg p-2">
                        Distance: <span class="text-blue-600" id="final-dist">0</span>m
                    </div>
                    <div class="bg-white rounded-lg p-2">
                        Max Combo: <span class="text-green-600" id="final-combo">x1</span>
                    </div>
                    <div class="bg-white rounded-lg p-2">
                        Bananas: <span class="text-yellow-600" id="final-bananas">0</span>
                    </div>
                    <div class="bg-white rounded-lg p-2">
                        XP Gained: <span class="text-purple-600" id="final-xp">0</span>
                    </div>
                </div>
            </div>

            <div id="new-record-badge" class="hidden bg-gradient-to-r from-yellow-200 to-orange-200 border-3 border-yellow-600 rounded-xl p-3 mb-4 animate-pulse">
                <div class="text-2xl text-yellow-600 text-outline flex items-center justify-center gap-2">
                    <i data-lucide="star" class="w-6 h-6"></i>
                    NEW RECORD!
                    <i data-lucide="star" class="w-6 h-6"></i>
                </div>
            </div>
            
            <div class="flex gap-2">
                <button class="toy-btn flex-1 bg-slate-200 text-base" onclick="quitGame()">
                    <i data-lucide="home" class="w-4 h-4"></i> HQ
                </button>
                <button class="toy-btn flex-1 btn-blue text-base" onclick="resetGame()">
                    <i data-lucide="rotate-ccw" class="w-4 h-4"></i> RETRY
                </button>
            </div>
        </div>
    </div>

    <script src="main.js"></script>
</body>
</html>
