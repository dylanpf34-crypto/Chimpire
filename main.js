
        // ============================================
        // CORE GAME STATE MANAGEMENT
        // ============================================
        
        let scene, camera, renderer, clock;
        let gameActive = false;
        let isPaused = false;
        
        // Score & Progression
        let score = 0;
        let distance = 0;
        let combo = 1;
        let maxCombo = 1;
        let lastBananaTime = 0;
        const COMBO_TIMEOUT = 3000; // 3 seconds
        
        // Load Core Progression State from localStorage
        let playerLevel = parseInt(localStorage.getItem('monkeyLvl')) || 1;
        let playerXP = parseInt(localStorage.getItem('monkeyXP')) || 0;
        let totalBananas = parseInt(localStorage.getItem('monkeyBananas')) || 0;
        let sessionHighScore = parseInt(localStorage.getItem('monkeyHighScore')) || 0;
        
        // Advanced Statistics
        let gameStats = {
            totalRuns: parseInt(localStorage.getItem('totalRuns')) || 0,
            totalDistance: parseInt(localStorage.getItem('totalDistance')) || 0,
            totalBananasCollected: parseInt(localStorage.getItem('totalBananasCollected')) || 0,
            totalCrashes: parseInt(localStorage.getItem('totalCrashes')) || 0,
            perfectRuns: parseInt(localStorage.getItem('perfectRuns')) || 0,
            longestRun: parseInt(localStorage.getItem('longestRun')) || 0,
            topScores: JSON.parse(localStorage.getItem('topScores') || '[]')
        };

        // Daily Missions System
        let dailyMissions = [
            { id: 1, desc: "Collect 50 bananas in one run", target: 50, progress: 0, reward: 100, completed: false },
            { id: 2, desc: "Reach 500m distance", target: 500, progress: 0, reward: 150, completed: false },
            { id: 3, desc: "Maintain a x5 combo", target: 5, progress: 0, reward: 200, completed: false }
        ];

        let gameSpeed = 0.4;
        const BASE_SPEED = 0.4;
        const MAX_SPEED = 1.4;
        let speedMultiplier = 1.0;
        
        // Power-ups System
        let activePowerUp = null;
        let powerUpTimer = 0;
        const POWERUP_DURATION = 10000; // 10 seconds

        // Graphical Settings
        let settings = {
            bobbing: localStorage.getItem('setBobbing') !== 'false',
            shadows: localStorage.getItem('setShadows') !== 'false',
            particles: localStorage.getItem('setParticles') !== 'false'
        };

        // ============================================
        // WORLD & ENVIRONMENT SETUP
        // ============================================
        
        const LANE_WIDTH = 3.5;
        const WORLD_LENGTH = 180;
        let obstacles = [];
        let scenery = [];
        let bananas = [];
        let powerUps = [];
        let spawnTimer = 0;
        
        let laneState = { 
            '-1': { type: null, z: 0 }, 
            '0': { type: null, z: 0 }, 
            '1': { type: null, z: 0 } 
        };

        // ============================================
        // PLAYER VARIABLES & PHYSICS
        // ============================================
        
        let playerGroup;
        let hitbox;
        let currentLane = 0; // -1 (Left), 0 (Middle), 1 (Right)
        let targetLane = 0;
        let isJumping = false;
        let playerVelocityY = 0;
        const GRAVITY = -0.018;
        const JUMP_FORCE = 0.42;
        const GROUND_Y = 0; 

        // Advanced Monkey Parts for Realistic Animation
        let monkeyTorso, monkeyHead, monkeyFace, monkeySnout;
        let armLeft, armRight, armLeftLower, armRightLower;
        let legLeft, legRight, legLeftLower, legRightLower;
        let tailSegments = [];
        let runningCycleTime = 0;
        let animationMixer;

        // ============================================
        // GEAR SHOP DATA (3D Visual Equipment)
        // ============================================
        
        let gearData = {
            visor: { 
                name: "Neon Visor", 
                cost: 150, 
                owned: false, 
                equipped: false, 
                color: 0x00ffff, 
                bonus: "Gain +15% run speed",
                description: "Cyberpunk eyewear for enhanced reflexes"
            },
            crown: { 
                name: "Golden Crown", 
                cost: 400, 
                owned: false, 
                equipped: false, 
                color: 0xfacc15, 
                bonus: "Earns +50% bananas",
                description: "Royal headpiece that attracts wealth"
            },
            jetpack: { 
                name: "Super Jetpack", 
                cost: 900, 
                owned: false, 
                equipped: false, 
                color: 0xef4444, 
                bonus: "Double Score Points",
                description: "Rocket-powered backpack for aerial domination"
            },
            cape: {
                name: "Hero Cape",
                cost: 600,
                owned: false,
                equipped: false,
                color: 0x8b5cf6,
                bonus: "Longer jump duration",
                description: "Flowing cape that extends air time"
            },
            sneakers: {
                name: "Speed Sneakers",
                cost: 500,
                owned: false,
                equipped: false,
                color: 0xf97316,
                bonus: "+20% movement speed",
                description: "Turbo-charged running shoes"
            }
        };
        
        // Load gear state
        try {
            const savedGear = JSON.parse(localStorage.getItem('monkeyGearData'));
            if (savedGear) gearData = savedGear;
        } catch(e){}

        // 3D references to current accessories
        let visor3D, crown3D, jetpack3D, cape3D, sneakers3D;

        // ============================================
        // ARMY / IDLE GENERATION SYSTEM
        // ============================================
        
        let armyData = {
            intern: { 
                name: "Chimp Interns", 
                cost: 60, 
                count: 0, 
                dps: 1, 
                desc: "Entry-level primates handling paperwork",
                icon: "👨‍💼"
            },
            guard: { 
                name: "Gorilla Enforcers", 
                cost: 250, 
                count: 0, 
                dps: 5, 
                desc: "Muscular security protecting assets",
                icon: "🦍"
            },
            scientist: { 
                name: "Scientist Chimps", 
                cost: 750, 
                count: 0, 
                dps: 25, 
                desc: "Genius researchers optimizing banana yields",
                icon: "👨‍🔬"
            },
            executive: {
                name: "Executive Orangutans",
                cost: 2000,
                count: 0,
                dps: 100,
                desc: "C-suite leaders making strategic decisions",
                icon: "🦧"
            },
            hacker: {
                name: "Cyber Monkeys",
                cost: 5000,
                count: 0,
                dps: 300,
                desc: "Digital warfare specialists stealing crypto-bananas",
                icon: "💻"
            }
        };
        
        try {
            const savedArmy = JSON.parse(localStorage.getItem('monkeyArmyData'));
            if (savedArmy) armyData = savedArmy;
        } catch(e){}

        // ============================================
        // COMPANY TAKEOVER BATTLE SYSTEM
        // ============================================
        
        let companyData = {
            corpKong: { 
                name: "Kong Conglomerates", 
                difficulty: 1, 
                targetValue: 100, 
                completed: false, 
                bonus: 1.2, 
                desc: "A massive block tower company. Grants permanent 1.2x Banana Multiplier!",
                icon: "🏢"
            },
            bananaCorp: { 
                name: "BananaCorp International", 
                difficulty: 2, 
                targetValue: 180, 
                completed: false, 
                bonus: 1.5, 
                desc: "Rival banana distributor. Grants permanent 1.5x score multiplier!",
                icon: "🍌"
            },
            megaPrimate: { 
                name: "MegaPrimate Tech", 
                difficulty: 3, 
                targetValue: 300, 
                completed: false, 
                bonus: 2.0, 
                desc: "A giant cyber-jungle monopoly. Grants permanent 2.0x overall earnings!",
                icon: "🚀"
            },
            toyEmpire: {
                name: "Toy Empire Inc.",
                difficulty: 4,
                targetValue: 500,
                completed: false,
                bonus: 2.5,
                desc: "Global toy manufacturer. Grants 2.5x combo multiplier!",
                icon: "🎮"
            }
        };
        
        try {
            const savedCompanies = JSON.parse(localStorage.getItem('monkeyCompanies'));
            if (savedCompanies) companyData = savedCompanies;
        } catch(e){}

        // Battle Mini-Game State
        let activeBattleCompany = null;
        let battleTimeLimit = 25;
        let battleTimeElapsed = 0;
        let battleTimerInterval = null;
        let battleOwnershipPercentage = 0;
        let battlePointerPos = 0;
        let battlePointerDirection = 1;
        let battlePointerSpeed = 1.8;
        let sweetSpotMin = 35;
        let sweetSpotMax = 65;
        let battlePerfectHits = 0;
        let battleMisses = 0;

        // Passive Banana Idle loop
        let lastIdleTick = Date.now();

        // ============================================
        // ENHANCED MATERIALS & AESTHETICS
        // ============================================
        
        const MAT_ROAD = new THREE.MeshStandardMaterial({ 
            color: 0x475569, 
            roughness: 0.8, 
            metalness: 0.1 
        });
        
        const MAT_GRASS = new THREE.MeshStandardMaterial({ 
            color: 0x22c55e, 
            roughness: 0.9, 
            metalness: 0 
        });
        
        const MAT_WOOD = new THREE.MeshStandardMaterial({ 
            color: 0x8b5cf6, 
            roughness: 0.6 
        });
        
        const MAT_BANANA = new THREE.MeshStandardMaterial({ 
            color: 0xfacc15, 
            roughness: 0.2, 
            metalness: 0.2, 
            emissive: 0x443300,
            emissiveIntensity: 0.3
        });
        
        const MAT_PLASTIC = {
            red: new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.2, metalness: 0.1 }),
            blue: new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.2, metalness: 0.1 }),
            yellow: new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2, metalness: 0.1 }),
            white: new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.1, metalness: 0.1 }),
            black: new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 }),
            glass: new THREE.MeshStandardMaterial({ 
                color: 0xbae6fd, 
                transparent: true, 
                opacity: 0.6, 
                roughness: 0.1, 
                metalness: 0.9 
            }),
            brown: new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 }),
            tan: new THREE.MeshStandardMaterial({ color: 0xfed7aa, roughness: 0.7 }),
            purple: new THREE.MeshStandardMaterial({ color: 0x8b5cf6, roughness: 0.3, metalness: 0.2 }),
            orange: new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.3 }),
            green: new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.4 })
        };

        // ============================================
        // THREE.JS INITIALIZATION
        // ============================================
        
        function init() {
            const container = document.getElementById('game-canvas');

            scene = new THREE.Scene();
            scene.background = new THREE.Color(0xa5f3fc);
            scene.fog = new THREE.FogExp2(0xa5f3fc, 0.008); 

            camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 300);
            camera.position.set(0, 7, -12); 

            renderer = new THREE.WebGLRenderer({ 
                antialias: true, 
                powerPreference: "high-performance",
                alpha: false
            });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); 
            renderer.shadowMap.enabled = settings.shadows;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            renderer.outputEncoding = THREE.sRGBEncoding;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.1;
            container.appendChild(renderer.domElement);

            clock = new THREE.Clock();

            // Enhanced Lighting System
            const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
            hemiLight.position.set(0, 30, 0);
            scene.add(hemiLight);

            const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
            dirLight.position.set(-20, 30, -20);
            dirLight.castShadow = settings.shadows;
            dirLight.shadow.camera.left = -40;
            dirLight.shadow.camera.right = 40;
            dirLight.shadow.camera.top = 40;
            dirLight.shadow.camera.bottom = -40;
            dirLight.shadow.camera.far = 180;
            dirLight.shadow.bias = -0.0005; 
            dirLight.shadow.mapSize.width = 2048;
            dirLight.shadow.mapSize.height = 2048;
            scene.add(dirLight);

            // Ambient fill light
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
            scene.add(ambientLight);

            // Accent rim light
            const rimLight = new THREE.DirectionalLight(0xadd8e6, 0.3);
            rimLight.position.set(10, 10, -10);
            scene.add(rimLight);

            // Initialize UI States
            updateMenuStats();
            document.getElementById('highscore-display').innerText = sessionHighScore;
            document.getElementById('set-bobbing').checked = settings.bobbing;
            document.getElementById('set-shadows').checked = settings.shadows;
            document.getElementById('set-particles').checked = settings.particles;

            createEnvironment();
            createPlayer();

            window.addEventListener('resize', onWindowResize, false);
            document.addEventListener('keydown', handleKeyDown);
            setupTouchControls();

            // Initialize Lucide icons
            lucide.createIcons();

            // Hide loading screen
            setTimeout(() => {
                const loadingScreen = document.getElementById('loading-screen');
                loadingScreen.style.opacity = '0';
                setTimeout(() => loadingScreen.style.display = 'none', 500);
            }, 1500);

            // Start render loop
            animate();
            
            // Passive income generation
            setInterval(updatePassiveBananas, 1000);
        }

        // ============================================
        // ADVANCED ENVIRONMENT CREATION
        // ============================================
        
        function createEnvironment() {
            // Main Road with lane markings
            const roadGeo = new THREE.PlaneGeometry(LANE_WIDTH * 3, WORLD_LENGTH * 2);
            const road = new THREE.Mesh(roadGeo, MAT_ROAD);
            road.rotation.x = -Math.PI / 2;
            road.position.z = WORLD_LENGTH / 2;
            road.receiveShadow = true;
            scene.add(road);

            // Lane divider lines
            const lineGeo = new THREE.PlaneGeometry(0.2, WORLD_LENGTH * 2);
            const lineMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
            
            const line1 = new THREE.Mesh(lineGeo, lineMat);
            line1.rotation.x = -Math.PI / 2;
            line1.position.set(-LANE_WIDTH, 0.02, WORLD_LENGTH / 2);
            scene.add(line1);

            const line2 = new THREE.Mesh(lineGeo, lineMat);
            line2.rotation.x = -Math.PI / 2;
            line2.position.set(LANE_WIDTH, 0.02, WORLD_LENGTH / 2);
            scene.add(line2);

            // Colored Sidewalks
            const swGeo = new THREE.PlaneGeometry(2, WORLD_LENGTH * 2);
            const swMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9 });
            
            const swLeft = new THREE.Mesh(swGeo, swMat);
            swLeft.rotation.x = -Math.PI / 2;
            swLeft.position.set(-LANE_WIDTH * 1.5 - 1, 0.05, WORLD_LENGTH / 2);
            swLeft.receiveShadow = true;
            scene.add(swLeft);

            const swRight = new THREE.Mesh(swGeo, swMat);
            swRight.rotation.x = -Math.PI / 2;
            swRight.position.set(LANE_WIDTH * 1.5 + 1, 0.05, WORLD_LENGTH / 2);
            swRight.receiveShadow = true;
            scene.add(swRight);

            // Grass fields
            const grassGeo = new THREE.PlaneGeometry(100, WORLD_LENGTH * 2);
            const grassLeft = new THREE.Mesh(grassGeo, MAT_GRASS);
            grassLeft.rotation.x = -Math.PI / 2;
            grassLeft.position.set(-50 - (LANE_WIDTH * 1.5) - 2, 0, WORLD_LENGTH / 2);
            grassLeft.receiveShadow = true;
            scene.add(grassLeft);

            const grassRight = new THREE.Mesh(grassGeo, MAT_GRASS);
            grassRight.rotation.x = -Math.PI / 2;
            grassRight.position.set(50 + (LANE_WIDTH * 1.5) + 2, 0, WORLD_LENGTH / 2);
            grassRight.receiveShadow = true;
            scene.add(grassRight);

            // Populate initial scenery
            for (let i = 0; i < 25; i++) {
                spawnScenery(Math.random() * WORLD_LENGTH);
            }
        }

        function spawnScenery(zPos) {
            const isLeft = Math.random() > 0.5;
            const xPos = isLeft ? 
                -(LANE_WIDTH * 1.5 + 5 + Math.random() * 15) : 
                (LANE_WIDTH * 1.5 + 5 + Math.random() * 15);
            
            let mesh = new THREE.Group();
            
            const rand = Math.random();
            
            if (rand > 0.6) {
                // Detailed Toy Tree
                const trunkGeo = new THREE.CylinderGeometry(0.5, 0.7, 3.5, 8);
                const trunk = new THREE.Mesh(trunkGeo, MAT_PLASTIC.yellow);
                trunk.position.y = 1.75;
                trunk.castShadow = true;
                trunk.receiveShadow = true;
                mesh.add(trunk);
                
                // Layered foliage
                const foliageMat = new THREE.MeshStandardMaterial({ 
                    color: 0x10b981, 
                    roughness: 0.9 
                });
                
                const leaf1 = new THREE.Mesh(
                    new THREE.ConeGeometry(2, 2.5, 8), 
                    foliageMat
                );
                leaf1.position.set(0, 4.5, 0);
                leaf1.castShadow = true;
                mesh.add(leaf1);

                const leaf2 = new THREE.Mesh(
                    new THREE.ConeGeometry(1.5, 2, 8), 
                    foliageMat
                );
                leaf2.position.set(0, 6, 0);
                leaf2.castShadow = true;
                mesh.add(leaf2);
                
            } else if (rand > 0.3) {
                // Colorful Toy Building
                const height = 5 + Math.random() * 10;
                const buildingGeo = new THREE.BoxGeometry(3.5, height, 3.5);
                const colors = [
                    MAT_PLASTIC.blue, 
                    MAT_PLASTIC.red, 
                    MAT_PLASTIC.white,
                    MAT_PLASTIC.purple,
                    MAT_PLASTIC.orange
                ];
                const mat = colors[Math.floor(Math.random() * colors.length)];
                
                const building = new THREE.Mesh(buildingGeo, mat);
                building.position.y = height / 2;
                building.castShadow = true;
                building.receiveShadow = true;
                mesh.add(building);

                // Windows
                const windowGeo = new THREE.BoxGeometry(0.6, 0.8, 0.1);
                const windowMat = MAT_PLASTIC.glass;
                
                for (let i = 0; i < Math.floor(height / 2); i++) {
                    for (let j = 0; j < 2; j++) {
                        const window1 = new THREE.Mesh(windowGeo, windowMat);
                        window1.position.set(j * 1.5 - 0.75, i * 2 + 1, 1.76);
                        mesh.add(window1);
                    }
                }

                // Roof decoration
                const roofGeo = new THREE.ConeGeometry(2, 1.5, 4);
                const roof = new THREE.Mesh(roofGeo, MAT_PLASTIC.red);
                roof.position.y = height + 0.75;
                roof.rotation.y = Math.PI / 4;
                roof.castShadow = true;
                mesh.add(roof);
                
            } else {
                // Street lamp
                const poleGeo = new THREE.CylinderGeometry(0.15, 0.15, 4, 8);
                const pole = new THREE.Mesh(poleGeo, MAT_PLASTIC.black);
                pole.position.y = 2;
                pole.castShadow = true;
                mesh.add(pole);

                const lampGeo = new THREE.SphereGeometry(0.4, 8, 8);
                const lampMat = new THREE.MeshStandardMaterial({
                    color: 0xfacc15,
                    emissive: 0xfacc15,
                    emissiveIntensity: 0.5
                });
                const lamp = new THREE.Mesh(lampGeo, lampMat);
                lamp.position.y = 4.2;
                mesh.add(lamp);

                if (settings.shadows) {
                    const light = new THREE.PointLight(0xfacc15, 0.5, 15);
                    light.position.copy(lamp.position);
                    light.castShadow = true;
                    mesh.add(light);
                }
            }

            mesh.position.set(xPos, 0, zPos);
            scene.add(mesh);
            scenery.push(mesh);
        }

   // ============================================
// CARTOON MONKEY CREATION (Cute & Friendly)
// ============================================

function createPlayer() {
    playerGroup = new THREE.Group();

    // Precise Hitbox
    const hitGeo = new THREE.BoxGeometry(1.4, 2.6, 1.4);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    hitbox = new THREE.Mesh(hitGeo, hitMat);
    hitbox.position.y = 1.3;
    playerGroup.add(hitbox);

    // ==========================================
    // CARTOON MATERIALS (brighter, less realistic)
    // ==========================================
    const TOON_BROWN = new THREE.MeshStandardMaterial({
        color: 0x8B5E3C, roughness: 1, metalness: 0
    });
    const TOON_TAN = new THREE.MeshStandardMaterial({
        color: 0xFDDCB5, roughness: 1, metalness: 0
    });
    const TOON_BLACK = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a, roughness: 1, metalness: 0
    });
    const TOON_WHITE = new THREE.MeshStandardMaterial({
        color: 0xffffff, roughness: 1, metalness: 0
    });
    const TOON_PINK = new THREE.MeshStandardMaterial({
        color: 0xFFB6C1, roughness: 1, metalness: 0
    });
    const TOON_DARK_BROWN = new THREE.MeshStandardMaterial({
        color: 0x5C3A1E, roughness: 1, metalness: 0
    });

    // ==========================================
    // BODY - Chubby & Round (cartoon proportions)
    // ==========================================

    // Torso - round ball shape instead of cylinder
    const torsoGeo = new THREE.SphereGeometry(0.6, 16, 16);
    monkeyTorso = new THREE.Mesh(torsoGeo, TOON_BROWN);
    monkeyTorso.position.y = 1.1;
    monkeyTorso.scale.set(1, 1.1, 0.9);
    monkeyTorso.castShadow = true;
    monkeyTorso.receiveShadow = true;
    playerGroup.add(monkeyTorso);

    // Belly patch (lighter oval on front)
    const bellyGeo = new THREE.SphereGeometry(0.4, 12, 12);
    const belly = new THREE.Mesh(bellyGeo, TOON_TAN);
    belly.position.set(0, 1.05, 0.35);
    belly.scale.set(0.8, 1, 0.5);
    playerGroup.add(belly);

    // ==========================================
    // HEAD - Big & Round (chibi style ~40% of height)
    // ==========================================

    const headGeo = new THREE.SphereGeometry(0.8, 16, 16);
    monkeyHead = new THREE.Mesh(headGeo, TOON_BROWN);
    monkeyHead.position.set(0, 2.2, 0);
    monkeyHead.castShadow = true;
    monkeyHead.receiveShadow = true;
    playerGroup.add(monkeyHead);

    // Face mask (tan area around eyes and mouth)
    const faceGeo = new THREE.SphereGeometry(0.6, 16, 16);
    const faceMask = new THREE.Mesh(faceGeo, TOON_TAN);
    faceMask.position.set(0, 2.1, 0.35);
    faceMask.scale.set(1, 0.85, 0.7);
    playerGroup.add(faceMask);

    // ==========================================
    // EYES - Big, expressive cartoon eyes
    // ==========================================

    const eyeWhiteGeo = new THREE.SphereGeometry(0.22, 12, 12);
    const eyePupilGeo = new THREE.SphereGeometry(0.13, 8, 8);
    const eyeShineGeo = new THREE.SphereGeometry(0.05, 6, 6);

    // Left Eye
    const eyeWhiteL = new THREE.Mesh(eyeWhiteGeo, TOON_WHITE);
    eyeWhiteL.position.set(-0.25, 2.3, 0.6);
    eyeWhiteL.scale.set(1, 1.2, 0.8);
    playerGroup.add(eyeWhiteL);

    const eyePupilL = new THREE.Mesh(eyePupilGeo, TOON_BLACK);
    eyePupilL.position.set(-0.25, 2.28, 0.75);
    playerGroup.add(eyePupilL);

    const eyeShineL = new THREE.Mesh(eyeShineGeo, TOON_WHITE);
    eyeShineL.position.set(-0.21, 2.34, 0.8);
    playerGroup.add(eyeShineL);

    // Right Eye
    const eyeWhiteR = new THREE.Mesh(eyeWhiteGeo, TOON_WHITE);
    eyeWhiteR.position.set(0.25, 2.3, 0.6);
    eyeWhiteR.scale.set(1, 1.2, 0.8);
    playerGroup.add(eyeWhiteR);

    const eyePupilR = new THREE.Mesh(eyePupilGeo, TOON_BLACK);
    eyePupilR.position.set(0.25, 2.28, 0.75);
    playerGroup.add(eyePupilR);

    const eyeShineR = new THREE.Mesh(eyeShineGeo, TOON_WHITE);
    eyeShineR.position.set(0.29, 2.34, 0.8);
    playerGroup.add(eyeShineR);

    // ==========================================
    // CUTE SMILE (simple curved line using torus)
    // ==========================================

    const smileGeo = new THREE.TorusGeometry(0.12, 0.025, 8, 12, Math.PI);
    const smile = new THREE.Mesh(smileGeo, TOON_DARK_BROWN);
    smile.position.set(0, 1.92, 0.85);
    smile.rotation.x = Math.PI;
    smile.rotation.z = Math.PI;
    playerGroup.add(smile);

    // ==========================================
    // SNOUT - Small & Round (not cylindrical)
    // ==========================================

    const snoutGeo = new THREE.SphereGeometry(0.2, 12, 12);
    monkeySnout = new THREE.Mesh(snoutGeo, TOON_TAN);
    monkeySnout.position.set(0, 2.0, 0.7);
    monkeySnout.scale.set(1.2, 0.8, 0.8);
    monkeySnout.castShadow = true;
    playerGroup.add(monkeySnout);

    // Nostrils (two small dark dots)
    const nostrilGeo = new THREE.SphereGeometry(0.04, 6, 6);
    const nostrilL = new THREE.Mesh(nostrilGeo, TOON_DARK_BROWN);
    nostrilL.position.set(-0.07, 2.0, 0.88);
    playerGroup.add(nostrilL);

    const nostrilR = new THREE.Mesh(nostrilGeo, TOON_DARK_BROWN);
    nostrilR.position.set(0.07, 2.0, 0.88);
    playerGroup.add(nostrilR);

    // ==========================================
    // EARS - Big, round, cartoon ears
    // ==========================================

    const earGeo = new THREE.SphereGeometry(0.35, 12, 12);

    const earL = new THREE.Mesh(earGeo, TOON_BROWN);
    earL.position.set(-0.85, 2.2, 0);
    earL.scale.set(0.4, 1, 0.7);
    earL.castShadow = true;
    playerGroup.add(earL);

    const earInnerL = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 10, 10),
        TOON_PINK
    );
    earInnerL.position.set(-0.9, 2.2, 0);
    earInnerL.scale.set(0.4, 1, 0.7);
    playerGroup.add(earInnerL);

    const earR = new THREE.Mesh(earGeo.clone(), TOON_BROWN);
    earR.position.set(0.85, 2.2, 0);
    earR.scale.set(0.4, 1, 0.7);
    earR.castShadow = true;
    playerGroup.add(earR);

    const earInnerR = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 10, 10),
        TOON_PINK
    );
    earInnerR.position.set(0.9, 2.2, 0);
    earInnerR.scale.set(0.4, 1, 0.7);
    playerGroup.add(earInnerR);

    // ==========================================
    // ARMS - Stubby & Simple (single segment each)
    // ==========================================

    const armGeo = new THREE.SphereGeometry(0.22, 10, 10);
    const handGeo = new THREE.SphereGeometry(0.2, 10, 10);

    // Left Arm
    armLeft = new THREE.Group();
    const upperArmL = new THREE.Mesh(armGeo, TOON_BROWN);
    upperArmL.position.y = -0.25;
    upperArmL.scale.set(1, 1.6, 1);
    upperArmL.castShadow = true;
    armLeft.add(upperArmL);

    armLeftLower = new THREE.Group();
    const lowerArmL = new THREE.Mesh(armGeo.clone(), TOON_BROWN);
    lowerArmL.position.y = -0.25;
    lowerArmL.scale.set(0.9, 1.4, 0.9);
    lowerArmL.castShadow = true;
    armLeftLower.add(lowerArmL);

    const handL = new THREE.Mesh(handGeo, TOON_TAN);
    handL.position.y = -0.5;
    handL.castShadow = true;
    armLeftLower.add(handL);

    armLeftLower.position.y = -0.5;
    armLeft.add(armLeftLower);
    armLeft.position.set(-0.7, 1.4, 0);
    playerGroup.add(armLeft);

    // Right Arm
    armRight = new THREE.Group();
    const upperArmR = new THREE.Mesh(armGeo.clone(), TOON_BROWN);
    upperArmR.position.y = -0.25;
    upperArmR.scale.set(1, 1.6, 1);
    upperArmR.castShadow = true;
    armRight.add(upperArmR);

    armRightLower = new THREE.Group();
    const lowerArmR = new THREE.Mesh(armGeo.clone(), TOON_BROWN);
    lowerArmR.position.y = -0.25;
    lowerArmR.scale.set(0.9, 1.4, 0.9);
    lowerArmR.castShadow = true;
    armRightLower.add(lowerArmR);

    const handR = new THREE.Mesh(handGeo.clone(), TOON_TAN);
    handR.position.y = -0.5;
    handR.castShadow = true;
    armRightLower.add(handR);

    armRightLower.position.y = -0.5;
    armRight.add(armRightLower);
    armRight.position.set(0.7, 1.4, 0);
    playerGroup.add(armRight);

    // ==========================================
    // LEGS - Stubby & Chubby (single segment each)
    // ==========================================

    const legGeo = new THREE.SphereGeometry(0.26, 10, 10);
    const footGeo = new THREE.SphereGeometry(0.22, 10, 10);

    // Left Leg
    legLeft = new THREE.Group();
    const upperLegL = new THREE.Mesh(legGeo, TOON_BROWN);
    upperLegL.position.y = -0.3;
    upperLegL.scale.set(1, 1.5, 1);
    upperLegL.castShadow = true;
    legLeft.add(upperLegL);

    legLeftLower = new THREE.Group();
    const lowerLegL = new THREE.Mesh(legGeo.clone(), TOON_BROWN);
    lowerLegL.position.y = -0.25;
    lowerLegL.scale.set(0.9, 1.3, 0.9);
    lowerLegL.castShadow = true;
    legLeftLower.add(lowerLegL);

    const footL = new THREE.Mesh(footGeo, TOON_TAN);
    footL.position.set(0, -0.45, 0.1);
    footL.scale.set(1, 0.6, 1.3);
    footL.castShadow = true;
    legLeftLower.add(footL);

    legLeftLower.position.y = -0.55;
    legLeft.add(legLeftLower);
    legLeft.position.set(-0.35, 0.8, 0);
    playerGroup.add(legLeft);

    // Right Leg
    legRight = new THREE.Group();
    const upperLegR = new THREE.Mesh(legGeo.clone(), TOON_BROWN);
    upperLegR.position.y = -0.3;
    upperLegR.scale.set(1, 1.5, 1);
    upperLegR.castShadow = true;
    legRight.add(upperLegR);

    legRightLower = new THREE.Group();
    const lowerLegR = new THREE.Mesh(legGeo.clone(), TOON_BROWN);
    lowerLegR.position.y = -0.25;
    lowerLegR.scale.set(0.9, 1.3, 0.9);
    lowerLegR.castShadow = true;
    legRightLower.add(lowerLegR);

    const footR = new THREE.Mesh(footGeo.clone(), TOON_TAN);
    footR.position.set(0, -0.45, 0.1);
    footR.scale.set(1, 0.6, 1.3);
    footR.castShadow = true;
    legRightLower.add(footR);

    legRightLower.position.y = -0.55;
    legRight.add(legRightLower);
    legRight.position.set(0.35, 0.8, 0);
    playerGroup.add(legRight);

    // ==========================================
    // TAIL - Curly & Playful (bouncy spiral)
    // ==========================================

    const tailGroup = new THREE.Group();
    const segmentCount = 10;

    for (let i = 0; i < segmentCount; i++) {
        const radius = 0.12 - (i * 0.008);
        const segGeo = new THREE.SphereGeometry(radius, 8, 8);
        const segment = new THREE.Mesh(segGeo, TOON_BROWN);

        const t = i / segmentCount;
        const angle = t * Math.PI * 2.5; // spiral
        const spiralRadius = 0.15 + t * 0.2;

        segment.position.set(
            Math.sin(angle) * spiralRadius,
            0.3 + t * 0.5,
            -i * 0.25
        );
        segment.castShadow = true;

        tailGroup.add(segment);
        tailSegments.push(segment);
    }

    tailGroup.position.set(0, 0.6, -0.55);
    playerGroup.add(tailGroup);

    // ==========================================
    // HAIR TUFT - Little cute tuft on top of head
    // ==========================================

    const tuftGeo = new THREE.SphereGeometry(0.15, 8, 8);
    const tuft = new THREE.Mesh(tuftGeo, TOON_DARK_BROWN);
    tuft.position.set(0, 2.95, 0);
    tuft.scale.set(1.5, 1, 1);
    playerGroup.add(tuft);

    const tuft2 = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 8),
        TOON_DARK_BROWN
    );
    tuft2.position.set(-0.1, 3.0, 0.05);
    playerGroup.add(tuft2);

    const tuft3 = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 8),
        TOON_DARK_BROWN
    );
    tuft3.position.set(0.1, 3.0, -0.05);
    playerGroup.add(tuft3);

    // Apply initial gear rendering
    updateVisuallyEquippedGear();

    playerGroup.position.set(0, GROUND_Y, 0);
    scene.add(playerGroup);
}

        // ============================================
        // GEAR VISUAL RENDERING SYSTEM
        // ============================================
        
        function updateVisuallyEquippedGear() {
            if (!playerGroup) return;

            // Remove existing accessories
            if (visor3D) playerGroup.remove(visor3D);
            if (crown3D) playerGroup.remove(crown3D);
            if (jetpack3D) playerGroup.remove(jetpack3D);
            if (cape3D) playerGroup.remove(cape3D);
            if (sneakers3D) playerGroup.remove(sneakers3D);

            // Render Neon Visor
            if (gearData.visor.equipped) {
                visor3D = new THREE.Group();
                
                const visorGlass = new THREE.Mesh(
                    new THREE.BoxGeometry(1.3, 0.3, 0.7),
                    new THREE.MeshStandardMaterial({
                        color: gearData.visor.color,
                        emissive: gearData.visor.color,
                        emissiveIntensity: 0.5,
                        transparent: true,
                        opacity: 0.7,
                        metalness: 0.8,
                        roughness: 0.2
                    })
                );
                visorGlass.position.set(0, 2.2, 0.45);
                visor3D.add(visorGlass);

                const visorFrame = new THREE.Mesh(
                    new THREE.BoxGeometry(1.35, 0.35, 0.05),
                    MAT_PLASTIC.black
                );
                visorFrame.position.set(0, 2.2, 0.1);
                visor3D.add(visorFrame);

                playerGroup.add(visor3D);
            }

            // Render Golden Crown
            if (gearData.crown.equipped) {
                crown3D = new THREE.Group();
                
                const crownMat = new THREE.MeshStandardMaterial({
                    color: gearData.crown.color,
                    metalness: 0.9,
                    roughness: 0.1,
                    emissive: 0x443300,
                    emissiveIntensity: 0.2
                });

                const baseCrown = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.5, 0.45, 0.3, 12, 1, true),
                    crownMat
                );
                baseCrown.castShadow = true;
                crown3D.add(baseCrown);
                
                // Crown spikes
                for (let i = 0; i < 8; i++) {
                    const spike = new THREE.Mesh(
                        new THREE.ConeGeometry(0.12, 0.4, 4),
                        crownMat
                    );
                    const angle = (i / 8) * Math.PI * 2;
                    spike.position.set(
                        Math.cos(angle) * 0.45,
                        0.2,
                        Math.sin(angle) * 0.45
                    );
                    spike.castShadow = true;
                    crown3D.add(spike);
                }

                // Jewels
                for (let i = 0; i < 4; i++) {
                    const jewel = new THREE.Mesh(
                        new THREE.SphereGeometry(0.08, 8, 8),
                        new THREE.MeshStandardMaterial({
                            color: [0xff0000, 0x00ff00, 0x0000ff, 0xff00ff][i],
                            metalness: 0.9,
                            roughness: 0.1,
                            emissive: [0xff0000, 0x00ff00, 0x0000ff, 0xff00ff][i],
                            emissiveIntensity: 0.3
                        })
                    );
                    const angle = (i / 4) * Math.PI * 2;
                    jewel.position.set(
                        Math.cos(angle) * 0.4,
                        0,
                        Math.sin(angle) * 0.4
                    );
                    crown3D.add(jewel);
                }

                crown3D.position.set(0, 2.8, 0);
                playerGroup.add(crown3D);
            }

            // Render Jetpack
            if (gearData.jetpack.equipped) {
                jetpack3D = new THREE.Group();
                
                const packMat = new THREE.MeshStandardMaterial({ 
                    color: gearData.jetpack.color, 
                    metalness: 0.6, 
                    roughness: 0.3 
                });
                
                // Twin rocket cylinders
                const cyl1 = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.22, 0.22, 1.0, 12),
                    packMat
                );
                cyl1.position.set(-0.4, 1.2, -0.65);
                cyl1.castShadow = true;
                jetpack3D.add(cyl1);

                const cyl2 = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.22, 0.22, 1.0, 12),
                    packMat
                );
                cyl2.position.set(0.4, 1.2, -0.65);
                cyl2.castShadow = true;
                jetpack3D.add(cyl2);

                // Connector plate
                const connector = new THREE.Mesh(
                    new THREE.BoxGeometry(0.7, 0.4, 0.25),
                    MAT_PLASTIC.black
                );
                connector.position.set(0, 1.2, -0.55);
                jetpack3D.add(connector);

                // Exhaust nozzles
                const nozzle1 = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.18, 0.25, 0.3, 8),
                    MAT_PLASTIC.black
                );
                nozzle1.position.set(-0.4, 0.65, -0.65);
                jetpack3D.add(nozzle1);

                const nozzle2 = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.18, 0.25, 0.3, 8),
                    MAT_PLASTIC.black
                );
                nozzle2.position.set(0.4, 0.65, -0.65);
                jetpack3D.add(nozzle2);

                // Flame effects when active
                const flameGeo = new THREE.ConeGeometry(0.15, 0.6, 8);
                const flameMat = new THREE.MeshBasicMaterial({
                    color: 0xff6600,
                    transparent: true,
                    opacity: 0.8
                });
                
                const flame1 = new THREE.Mesh(flameGeo, flameMat);
                flame1.position.set(-0.4, 0.2, -0.65);
                flame1.rotation.x = Math.PI;
                jetpack3D.add(flame1);

                const flame2 = new THREE.Mesh(flameGeo, flameMat);
                flame2.position.set(0.4, 0.2, -0.65);
                flame2.rotation.x = Math.PI;
                jetpack3D.add(flame2);

                jetpack3D.userData = { flames: [flame1, flame2], flicker: 0 };

                playerGroup.add(jetpack3D);
            }

            // Render Hero Cape
            if (gearData.cape.equipped) {
                cape3D = new THREE.Group();

                const capeMat = new THREE.MeshStandardMaterial({
                    color: gearData.cape.color,
                    side: THREE.DoubleSide,
                    roughness: 0.7,
                    metalness: 0.1
                });

                const capeGeo = new THREE.PlaneGeometry(1.2, 1.5);
                const cape = new THREE.Mesh(capeGeo, capeMat);
                cape.position.set(0, 1.0, -0.5);
                cape.castShadow = true;
                cape3D.add(cape);

                cape3D.userData = { cape: cape, wave: 0 };

                playerGroup.add(cape3D);
            }

            // Render Speed Sneakers
            if (gearData.sneakers.equipped) {
                sneakers3D = new THREE.Group();

                const sneakerMat = new THREE.MeshStandardMaterial({
                    color: gearData.sneakers.color,
                    roughness: 0.4,
                    metalness: 0.2
                });

                // Left Sneaker
                const sneakerL = new THREE.Mesh(
                    new THREE.BoxGeometry(0.32, 0.22, 0.5),
                    sneakerMat
                );
                sneakerL.position.set(-0.4, 0.1, 0.1);
                sneakerL.castShadow = true;
                sneakers3D.add(sneakerL);

                // Right Sneaker
                const sneakerR = new THREE.Mesh(
                    new THREE.BoxGeometry(0.32, 0.22, 0.5),
                    sneakerMat
                );
                sneakerR.position.set(0.4, 0.1, 0.1);
                sneakerR.castShadow = true;
                sneakers3D.add(sneakerR);

                playerGroup.add(sneakers3D);
            }
        }

        // Rest of the game code continues with the same logic as before...
        // (Due to length constraints, I'm including just the critical fixes)
        // The rest of the functions remain identical to the previous version

        // PLACEHOLDER: Include all remaining functions from previous version
        // (spawnObstacle, createDetailedCar, createDetailedBarrier, etc.)

    
      function spawnObstacle() {
            let eligibleLanes = [-1, 0, 1];
            const guaranteedEmpty = eligibleLanes[Math.floor(Math.random() * 3)];
            eligibleLanes = eligibleLanes.filter(l => l !== guaranteedEmpty);

            for (let lane of eligibleLanes) {
                if (Math.random() < 0.35) continue;

                const state = laneState[lane.toString()];
                const distSinceLast = WORLD_LENGTH - state.z;
                
                let typeToSpawn = '';
                const typeRoll = Math.random();

                if (typeRoll > 0.7) {
                    typeToSpawn = 'car';
                } else if (typeRoll > 0.5) {
                    typeToSpawn = 'cop';
                } else if (typeRoll > 0.3) {
                    typeToSpawn = 'barrier';
                } else {
                    typeToSpawn = 'powerup';
                }

                // Anti-phasing collision prevention
                if (typeToSpawn === 'car' || typeToSpawn === 'cop') {
                    if (state.type === 'barrier' && distSinceLast < 65) {
                        typeToSpawn = 'barrier'; 
                    }
                } else if (typeToSpawn === 'barrier') {
                    if ((state.type === 'car' || state.type === 'cop') && distSinceLast < 65) {
                        continue; 
                    }
                }

                let obs;
                if (typeToSpawn === 'car') {
                    obs = createDetailedCar(false);
                    obs.userData = { type: 'car', speed: -gameSpeed * 0.6 };
                } else if (typeToSpawn === 'cop') {
                    obs = createDetailedCar(true);
                    obs.userData = { type: 'cop', speed: -gameSpeed * 1.1 };
                } else if (typeToSpawn === 'powerup') {
                    obs = createPowerUp();
                    obs.userData = { type: 'powerup', speed: 0 };
                } else {
                    obs = createDetailedBarrier();
                    obs.userData = { type: 'barrier', speed: 0 };
                }

                obs.position.set(lane * LANE_WIDTH, 0, WORLD_LENGTH);
                scene.add(obs);
                
                if (typeToSpawn === 'powerup') {
                    powerUps.push(obs);
                } else {
                    obstacles.push(obs);
                }

                laneState[lane.toString()] = { type: typeToSpawn, z: WORLD_LENGTH };

                // Spawn bananas near barriers
                if (typeToSpawn === 'barrier' && Math.random() > 0.25) {
                    spawnBanana(lane, 3.5, WORLD_LENGTH);
                }
            }

            // Random banana spawns in safe lane
            if (Math.random() > 0.35) {
                spawnBanana(guaranteedEmpty, 1.2, WORLD_LENGTH + (Math.random() * 10 - 5));
            }
        }

        function createDetailedCar(isCop) {
            const group = new THREE.Group();
            
            const bodyMat = isCop ? 
                MAT_PLASTIC.white : 
                [MAT_PLASTIC.red, MAT_PLASTIC.blue, MAT_PLASTIC.yellow, MAT_PLASTIC.purple, MAT_PLASTIC.orange][Math.floor(Math.random() * 5)];
            
            // Chassis
            const chassis = new THREE.Mesh(
                new THREE.BoxGeometry(2.2, 0.9, 4.6),
                bodyMat
            );
            chassis.position.y = 0.85;
            chassis.castShadow = true;
            chassis.receiveShadow = true;
            group.add(chassis);

            // Cabin/Windshield
            const cabin = new THREE.Mesh(
                new THREE.BoxGeometry(1.9, 0.9, 2.2),
                MAT_PLASTIC.glass
            );
            cabin.position.set(0, 1.65, -0.3);
            cabin.castShadow = true;
            group.add(cabin);

            // Hood
            const hood = new THREE.Mesh(
                new THREE.BoxGeometry(2.0, 0.3, 1.5),
                bodyMat
            );
            hood.position.set(0, 1.05, 1.5);
            hood.castShadow = true;
            group.add(hood);

            // Wheels
            const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.45, 16);
            wheelGeo.rotateZ(Math.PI / 2);
            
            const wheelPositions = [
                [-1.15, 0.5, 1.4], [1.15, 0.5, 1.4], 
                [-1.15, 0.5, -1.4], [1.15, 0.5, -1.4] 
            ];
            
            wheelPositions.forEach(pos => {
                const wheel = new THREE.Mesh(wheelGeo, MAT_PLASTIC.black);
                wheel.position.set(...pos);
                wheel.castShadow = true;
                group.add(wheel);

                // Hubcap
                const hubcap = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.25, 0.25, 0.05, 8),
                    new THREE.MeshStandardMaterial({ 
                        color: 0x94a3b8, 
                        metalness: 0.8, 
                        roughness: 0.2 
                    })
                );
                hubcap.rotation.z = Math.PI / 2;
                hubcap.position.set(pos[0] > 0 ? pos[0] + 0.2 : pos[0] - 0.2, pos[1], pos[2]);
                group.add(hubcap);
            });

            // Headlights
            const lightGeo = new THREE.BoxGeometry(0.3, 0.2, 0.1);
            const headlightMat = new THREE.MeshStandardMaterial({
                color: 0xffffcc,
                emissive: 0xffffcc,
                emissiveIntensity: 0.5
            });
            
            const headlightL = new THREE.Mesh(lightGeo, headlightMat);
            headlightL.position.set(-0.7, 0.9, 2.3);
            group.add(headlightL);

            const headlightR = new THREE.Mesh(lightGeo, headlightMat);
            headlightR.position.set(0.7, 0.9, 2.3);
            group.add(headlightR);

            if (isCop) {
                // Police Sirens
                const sirenGeo = new THREE.BoxGeometry(0.7, 0.25, 0.5);
                
                const sirenR = new THREE.Mesh(sirenGeo, 
                    new THREE.MeshStandardMaterial({ 
                        color: 0xef4444,
                        emissive: 0xef4444,
                        emissiveIntensity: 0.8
                    })
                );
                sirenR.position.set(-0.5, 2.2, -0.3);
                sirenR.castShadow = true;
                group.add(sirenR);

                const sirenB = new THREE.Mesh(sirenGeo, 
                    new THREE.MeshStandardMaterial({ 
                        color: 0x3b82f6,
                        emissive: 0x3b82f6,
                        emissiveIntensity: 0
                    })
                );
                sirenB.position.set(0.5, 2.2, -0.3);
                sirenB.castShadow = true;
                group.add(sirenB);
                
                let pLightR, pLightB;
                if (settings.shadows) {
                    pLightR = new THREE.PointLight(0xff0000, 1.5, 12);
                    pLightR.position.copy(sirenR.position);
                    group.add(pLightR);
                    
                    pLightB = new THREE.PointLight(0x0000ff, 0, 12);
                    pLightB.position.copy(sirenB.position);
                    group.add(pLightB);
                }
                
                group.userData = { sirenR, sirenB, pLightR, pLightB, blinkTimer: 0 };
            }

            return group;
        }

        function createDetailedBarrier() {
            const group = new THREE.Group();
            
            const base = new THREE.Mesh(
                new THREE.BoxGeometry(LANE_WIDTH - 0.6, 1.4, 0.9),
                MAT_PLASTIC.yellow
            );
            base.position.y = 0.7;
            base.castShadow = true;
            base.receiveShadow = true;
            group.add(base);

            // Hazard stripes
            for (let i = -1; i <= 1; i++) {
                const stripe = new THREE.Mesh(
                    new THREE.BoxGeometry(0.5, 1.45, 0.95),
                    MAT_PLASTIC.black
                );
                stripe.position.set(i * 1.1, 0.7, 0);
                group.add(stripe);
            }

            // Warning lights
            const lightGeo = new THREE.SphereGeometry(0.12, 8, 8);
            const lightMat = new THREE.MeshStandardMaterial({
                color: 0xff0000,
                emissive: 0xff0000,
                emissiveIntensity: 0.6
            });

            const light1 = new THREE.Mesh(lightGeo, lightMat);
            light1.position.set(-1.3, 1.5, 0);
            group.add(light1);

            const light2 = new THREE.Mesh(lightGeo, lightMat);
            light2.position.set(1.3, 1.5, 0);
            group.add(light2);

            return group;
        }

        function createPowerUp() {
            const group = new THREE.Group();

            const types = ['speed', 'magnet', 'shield'];
            const type = types[Math.floor(Math.random() * types.length)];

            let color, icon;
            switch(type) {
                case 'speed':
                    color = 0x8b5cf6;
                    icon = '⚡';
                    break;
                case 'magnet':
                    color = 0xf97316;
                    icon = '🧲';
                    break;
                case 'shield':
                    color = 0x10b981;
                    icon = '🛡️';
                    break;
            }

            const powerUpGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
            const powerUpMat = new THREE.MeshStandardMaterial({
                color: color,
                emissive: color,
                emissiveIntensity: 0.5,
                metalness: 0.6,
                roughness: 0.2
            });

            const box = new THREE.Mesh(powerUpGeo, powerUpMat);
            box.position.y = 1.5;
            box.castShadow = true;
            group.add(box);

            if (settings.shadows) {
                const light = new THREE.PointLight(color, 1, 8);
                light.position.y = 1.5;
                group.add(light);
            }

            group.userData = { powerType: type, rotation: 0, bob: 0 };

            return group;
        }

        function spawnBanana(lane, yPos, zPos) {
            const geometry = new THREE.TorusGeometry(0.38, 0.12, 10, 16, Math.PI * 1.3);
            const banana = new THREE.Mesh(geometry, MAT_BANANA);
            
            banana.position.set(lane * LANE_WIDTH, yPos, zPos);
            banana.rotation.x = Math.PI / 2;
            banana.castShadow = true;
            banana.userData = { rotation: 0, bob: 0 };
            
            scene.add(banana);
            bananas.push(banana);
        }

        // ============================================
        // CONTROLS & INPUT HANDLING
        // ============================================
        
        function handleKeyDown(e) {
            if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
                togglePause();
                return;
            }
            if (!gameActive || isPaused) return;
            
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') moveLane(1);
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') moveLane(-1);
            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.code === 'Space') jump();
        }

        function moveLane(direction) {
            targetLane += direction;
            if (targetLane < -1) targetLane = -1;
            if (targetLane > 1) targetLane = 1;
        }

        function jump() {
            if (!isJumping) {
                isJumping = true;
                let jumpPower = JUMP_FORCE;
                
                // Cape extends jump
                if (gearData.cape && gearData.cape.equipped) {
                    jumpPower *= 1.15;
                }
                
                playerVelocityY = jumpPower;
            }
        }

        let touchStartX = 0;
        let touchStartY = 0;
        
        function setupTouchControls() {
            document.addEventListener('touchstart', e => {
                touchStartX = e.changedTouches[0].screenX;
                touchStartY = e.changedTouches[0].screenY;
            }, { passive: false });

            document.addEventListener('touchend', e => {
                if (!gameActive || isPaused) return;
                
                const dx = e.changedTouches[0].screenX - touchStartX;
                const dy = e.changedTouches[0].screenY - touchStartY;
                
                if (Math.abs(dx) > Math.abs(dy)) {
                    if (Math.abs(dx) > 40) {
                        if (dx > 0) moveLane(1);
                        else moveLane(-1);
                    }
                } else {
                    if (dy < -40) jump();
                }
            }, { passive: false });
            
            document.getElementById('game-canvas').addEventListener('touchmove', 
                e => e.preventDefault(), 
                { passive: false }
            );
        }

        // ============================================
        // MAIN GAME RENDER LOOP
        // ============================================
        
        function animate() {
            requestAnimationFrame(animate);

            const delta = clock.getDelta();

            if (gameActive && !isPaused) {
                updatePlayer(delta);
                updateWorld(delta);
                updateCamera(delta);
                checkCollisions();
                updateUI();
                updateCombo();
                updatePowerUps(delta);
                
                // Progressive speed scaling
                let baseSpeedMult = 1.0;
                if (gearData.visor.equipped) baseSpeedMult += 0.15;
                if (gearData.sneakers.equipped) baseSpeedMult += 0.20;
                if (activePowerUp === 'speed') baseSpeedMult += 0.5;
                
                speedMultiplier = baseSpeedMult;
                
                let targetMaxSpeed = MAX_SPEED * speedMultiplier;
                if (gameSpeed < targetMaxSpeed) {
                    gameSpeed += 0.0001; 
                }
                
                distance += gameSpeed;
            }

            renderer.render(scene, camera);
        }

        // ============================================
        // PLAYER UPDATE & ANIMATION SYSTEM
        // ============================================
        
        function updatePlayer(delta) {
            // Smooth lane transitions
            currentLane += (targetLane - currentLane) * 0.18;
            const targetX = currentLane * LANE_WIDTH;
            playerGroup.position.x += (targetX - playerGroup.position.x) * 0.16;

            // Dynamic body lean on turns
            const leanAmount = (targetX - playerGroup.position.x) * -0.12;
            playerGroup.rotation.z += (leanAmount - playerGroup.rotation.z) * 0.1;

            if (!isJumping) {
                // Advanced Running Animation Cycle
                runningCycleTime += gameSpeed * 0.5;
                
                // Torso & head bob
                const bobIntensity = 0.12;
                monkeyTorso.position.y = 1.2 + Math.abs(Math.sin(runningCycleTime * 2.5)) * bobIntensity;
                monkeyHead.position.y = 2.1 + Math.abs(Math.sin(runningCycleTime * 2.5)) * (bobIntensity * 1.2);
                
                // Torso rotation for natural movement
                monkeyTorso.rotation.y = Math.sin(runningCycleTime) * 0.05;
                monkeyTorso.rotation.x = Math.sin(runningCycleTime * 2) * 0.03;

                // Arm swing with elbow bend
                const armSwing = Math.sin(runningCycleTime) * 0.9;
                armLeft.rotation.x = armSwing;
                armRight.rotation.x = -armSwing;
                
                armLeftLower.rotation.x = Math.max(0, armSwing * 0.8);
                armRightLower.rotation.x = Math.max(0, -armSwing * 0.8);
                
                // Leg run cycle with knee bend
                const legSwing = Math.sin(runningCycleTime) * 0.8;
                legLeft.rotation.x = -legSwing;
                legRight.rotation.x = legSwing;
                
                legLeftLower.rotation.x = Math.max(0, legSwing * 1.2);
                legRightLower.rotation.x = Math.max(0, -legSwing * 1.2);

                // Tail sway and curl
                tailSegments.forEach((seg, i) => {
                    seg.rotation.y = Math.sin(runningCycleTime * 0.6 + i * 0.3) * 0.15;
                    seg.rotation.x = Math.sin(runningCycleTime * 0.8 + i * 0.2) * 0.1;
                });

                // Cape wave animation
                if (cape3D) {
                    cape3D.userData.wave += delta * 5;
                    const cape = cape3D.userData.cape;
                    cape.rotation.x = Math.sin(cape3D.userData.wave) * 0.15 + 0.1;
                    cape.rotation.y = Math.sin(cape3D.userData.wave * 0.7) * 0.1;
                }

                // Jetpack flame flicker
                if (jetpack3D) {
                    jetpack3D.userData.flicker += delta * 10;
                    jetpack3D.userData.flames.forEach(flame => {
                        flame.scale.y = 1 + Math.sin(jetpack3D.userData.flicker) * 0.3;
                        flame.material.opacity = 0.6 + Math.sin(jetpack3D.userData.flicker * 2) * 0.2;
                    });
                }

            } else {
                // Jumping Physics
                playerGroup.position.y += playerVelocityY;
                playerVelocityY += GRAVITY;
                
                // Mid-air spin animation
                playerGroup.rotation.x -= 0.18;

                // Tuck pose
                armLeft.rotation.x = -1.3;
                armRight.rotation.x = -1.3;
                armLeftLower.rotation.x = 0.5;
                armRightLower.rotation.x = 0.5;
                
                legLeft.rotation.x = 1.1;
                legRight.rotation.x = 1.1;
                legLeftLower.rotation.x = -0.8;
                legRightLower.rotation.x = -0.8;

                // Cape flutter
                if (cape3D) {
                    cape3D.userData.wave += delta * 8;
                    const cape = cape3D.userData.cape;
                    cape.rotation.x = Math.sin(cape3D.userData.wave) * 0.3 + 0.5;
                }

                // Landing detection with anti-sink protection
                if (playerGroup.position.y <= GROUND_Y) {
                    playerGroup.position.y = GROUND_Y;
                    isJumping = false;
                    playerVelocityY = 0;
                    
                    playerGroup.rotation.x = 0;
                    playerGroup.rotation.y = 0;
                    
                    // Landing squash effect
                    monkeyTorso.scale.set(1.25, 0.75, 1.25);
                    setTimeout(() => {
                        monkeyTorso.scale.set(1, 1.1, 1);
                        setTimeout(() => monkeyTorso.scale.set(1, 1, 1), 80);
                    }, 100);
                }
            }
        }

        // ============================================
        // CAMERA FOLLOW & EFFECTS
        // ============================================
        
        function updateCamera(delta) {
            // Smooth horizontal tracking
            const camTargetX = playerGroup.position.x * 0.5;
            camera.position.x += (camTargetX - camera.position.x) * 0.12;
            
            // Dynamic bobbing
            if (settings.bobbing) {
                if (!isJumping) {
                    const bob = Math.sin(distance * 1.8) * 0.18;
                    camera.position.y += ((7 + bob) - camera.position.y) * 0.12;
                } else {
                    camera.position.y += (7.5 - camera.position.y) * 0.06;
                }
            } else {
                camera.position.y = 7;
            }

            // Look-ahead focus point
            const lookX = playerGroup.position.x * 0.25;
            const lookY = 2.5 + (isJumping ? playerGroup.position.y * 0.3 : 0);
            const lookZ = playerGroup.position.z + 18;
            
            camera.lookAt(lookX, lookY, lookZ);
        }

        // ============================================
        // WORLD MANAGEMENT & UPDATES
        // ============================================
        
        function updateWorld(delta) {
            const currentSpeed = gameSpeed;

            // Obstacle spawn timer
            spawnTimer -= currentSpeed;
            if (spawnTimer <= 0) {
                spawnObstacle();
                spawnTimer = 20 + Math.random() * (16 / gameSpeed); 
            }

            // Update scenery loop
            for (let i = scenery.length - 1; i >= 0; i--) {
                const s = scenery[i];
                s.position.z -= currentSpeed;
                
                if (s.position.z < -25) {
                    s.position.z += WORLD_LENGTH * 1.3; 
                }
            }

            // Update lane state tracking
            for (let lane in laneState) {
                laneState[lane].z -= currentSpeed;
            }

            // Obstacles cycle
            for (let i = obstacles.length - 1; i >= 0; i--) {
                const obs = obstacles[i];
                obs.position.z -= (currentSpeed - obs.userData.speed);
                
                // Cop siren animation
                if (obs.userData.type === 'cop') {
                    obs.userData.blinkTimer += currentSpeed * 2;
                    
                    if (obs.userData.blinkTimer > 3) {
                        obs.userData.blinkTimer = 0;
                        const rMat = obs.userData.sirenR.material;
                        const bMat = obs.userData.sirenB.material;
                        
                        if (rMat.emissiveIntensity > 0.5) {
                            rMat.emissiveIntensity = 0.1;
                            bMat.emissiveIntensity = 0.8;
                            if (obs.userData.pLightR) {
                                obs.userData.pLightR.intensity = 0;
                                obs.userData.pLightB.intensity = 1.5;
                            }
                        } else {
                            rMat.emissiveIntensity = 0.8;
                            bMat.emissiveIntensity = 0.1;
                            if (obs.userData.pLightR) {
                                obs.userData.pLightR.intensity = 1.5;
                                obs.userData.pLightB.intensity = 0;
                            }
                        }
                    }
                }

                if (obs.position.z < -18) {
                    scene.remove(obs);
                    obstacles.splice(i, 1);
                }
            }

            // Bananas cycle with animation
            for (let i = bananas.length - 1; i >= 0; i--) {
                const b = bananas[i];
                b.position.z -= currentSpeed;
                
                b.userData.rotation += delta * 3;
                b.rotation.z = b.userData.rotation;
                
                b.userData.bob += delta * 4;
                b.position.y += Math.sin(b.userData.bob) * 0.01;
                
                if (b.position.z < -12) {
                    scene.remove(b);
                    bananas.splice(i, 1);
                }
            }

            // Power-ups cycle with animation
            for (let i = powerUps.length - 1; i >= 0; i--) {
                const p = powerUps[i];
                p.position.z -= currentSpeed;
                
                p.userData.rotation += delta * 2;
                p.children[0].rotation.y = p.userData.rotation;
                
                p.userData.bob += delta * 3;
                p.children[0].position.y = 1.5 + Math.sin(p.userData.bob) * 0.2;
                
                if (p.position.z < -12) {
                    scene.remove(p);
                    powerUps.splice(i, 1);
                }
            }
        }

        // ============================================
        // COLLISION DETECTION SYSTEM
        // ============================================
        
        function checkCollisions() {
            hitbox.updateMatrixWorld();
            const pBox = new THREE.Box3().setFromObject(hitbox);
            pBox.expandByScalar(-0.18);

            // Obstacle crashes
            for (let obs of obstacles) {
                const oBox = new THREE.Box3().setFromObject(obs);
                
                if (pBox.intersectsBox(oBox)) {
                    if (activePowerUp === 'shield') {
                        // Shield absorbs hit
                        scene.remove(obs);
                        obstacles = obstacles.filter(o => o !== obs);
                        deactivatePowerUp();
                        showToast('Shield Protected You! 🛡️', 'green');
                    } else {
                        const reason = obs.userData.type === 'cop' ? 
                            'Busted by the Cops! 🚔' : 
                            'Crashed into Obstacle! 💥';
                        triggerGameOver(reason);
                        return;
                    }
                }
            }

            // Banana collection
            for (let i = bananas.length - 1; i >= 0; i--) {
                const b = bananas[i];
                const bBox = new THREE.Box3().setFromObject(b);
                
                let collectRadius = 1.0;
                if (activePowerUp === 'magnet') collectRadius = 3.0;
                
                bBox.expandByScalar(collectRadius - 1);
                
                if (pBox.intersectsBox(bBox)) {
                    let collected = 1;
                    
                    if (gearData.crown.equipped) collected = Math.floor(collected * 1.5);
                    if (companyData.corpKong.completed) collected = Math.floor(collected * 1.2);
                    
                    collected *= combo;
                    
                    score += collected;
                    totalBananas += collected;
                    gameStats.totalBananasCollected += collected;
                    
                    // Update combo
                    combo = Math.min(combo + 1, 99);
                    if (combo > maxCombo) maxCombo = combo;
                    lastBananaTime = Date.now();
                    
                    scene.remove(bananas[i]);
                    bananas.splice(i, 1);

                    localStorage.setItem('monkeyBananas', totalBananas);
                    localStorage.setItem('totalBananasCollected', gameStats.totalBananasCollected);
                    
                    // Particle effect
                    if (settings.particles) {
                        spawnParticle('🍌', b.position);
                    }
                    
                    // UI feedback
                    const el = document.getElementById('score-display');
                    el.style.transform = 'scale(1.3)';
                    setTimeout(() => el.style.transform = 'scale(1)', 150);
                }
            }

            // Power-up collection
            for (let i = powerUps.length - 1; i >= 0; i--) {
                const p = powerUps[i];
                const pBoxPowerUp = new THREE.Box3().setFromObject(p);
                
                if (pBox.intersectsBox(pBoxPowerUp)) {
                    activatePowerUp(p.userData.powerType);
                    
                    scene.remove(p);
                    powerUps.splice(i, 1);
                }
            }
        }

        // ============================================
        // COMBO SYSTEM
        // ============================================
        
        function updateCombo() {
            if (combo > 1) {
                const timeSinceLastBanana = Date.now() - lastBananaTime;
                
                if (timeSinceLastBanana > COMBO_TIMEOUT) {
                    combo = 1;
                }
            }
            
            // Visual combo display
            if (combo >= 5) {
                const comboDisplay = document.getElementById('combo-display');
                comboDisplay.innerText = `x${combo} COMBO!`;
                comboDisplay.classList.add('show');
            } else {
                document.getElementById('combo-display').classList.remove('show');
            }
        }

        // ============================================
        // POWER-UP SYSTEM
        // ============================================
        
        function activatePowerUp(type) {
            activePowerUp = type;
            powerUpTimer = POWERUP_DURATION;
            
            let name = '';
            switch(type) {
                case 'speed':
                    name = 'Speed Boost ⚡';
                    break;
                case 'magnet':
                    name = 'Banana Magnet 🧲';
                    break;
                case 'shield':
                    name = 'Shield Protection 🛡️';
                    break;
            }
            
            document.getElementById('powerup-name').innerText = name;
            document.getElementById('powerup-container').style.display = 'flex';
            document.getElementById('powerup-container').classList.add('power-up-active');
            
            showToast(`Power-Up Activated: ${name}`, 'purple');
        }

        function updatePowerUps(delta) {
            if (activePowerUp) {
                powerUpTimer -= delta * 1000;
                
                const percentage = (powerUpTimer / POWERUP_DURATION) * 100;
                document.getElementById('powerup-timer').style.width = `${percentage}%`;
                
                if (powerUpTimer <= 0) {
                    deactivatePowerUp();
                }
            }
        }

        function deactivatePowerUp() {
            activePowerUp = null;
            powerUpTimer = 0;
            document.getElementById('powerup-container').style.display = 'none';
            document.getElementById('powerup-container').classList.remove('power-up-active');
        }

        // ============================================
        // PASSIVE INCOME SYSTEM
        // ============================================
        
        function updatePassiveBananas() {
            let passiveRate = getPassiveBananaRate();
            
            if (passiveRate > 0) {
                totalBananas += passiveRate;
                localStorage.setItem('monkeyBananas', totalBananas);
                
                if (!gameActive) {
                    updateMenuStats();
                }
            }
        }

        function getPassiveBananaRate() {
            let totalRate = 0;
            
            for (let key in armyData) {
                totalRate += armyData[key].count * armyData[key].dps;
            }
            
            if (companyData.megaPrimate.completed) {
                totalRate *= 2;
            }
            
            return totalRate;
        }

        // ============================================
        // UI & MENU MANAGEMENT
        // ============================================
        
        function updateUI() {
            let earnedMult = playerLevel;
            
            if (gearData.jetpack.equipped) earnedMult *= 2;
            if (companyData.bananaCorp.completed) earnedMult *= 1.5;
            if (companyData.megaPrimate.completed) earnedMult *= 2.0;
            if (companyData.toyEmpire.completed) earnedMult *= 1.5;

            const displayScore = Math.floor(score * earnedMult);
            document.getElementById('score-display').innerText = displayScore;
            document.getElementById('dist-display').innerText = Math.floor(distance);
            document.getElementById('combo-value').innerText = combo;
            document.getElementById('speed-display').innerText = Math.floor((gameSpeed / BASE_SPEED) * 100);
            document.getElementById('hq-banana-val').innerText = totalBananas;
        }

        function updateMenuStats() {
            document.getElementById('menu-total-runs').innerText = gameStats.totalRuns;
            document.getElementById('menu-best-score').innerText = sessionHighScore;
            document.getElementById('menu-monkey-level').innerText = playerLevel;
            document.getElementById('menu-total-bananas').innerText = totalBananas;
        }

        function startGame() {
            document.getElementById('start-screen').classList.add('hidden');
            resetVariables();
            gameActive = true;
            gameStats.totalRuns++;
            localStorage.setItem('totalRuns', gameStats.totalRuns);
        }

        function togglePause() {
            if (!gameActive) return;
            
            isPaused = !isPaused;
            const pauseScreen = document.getElementById('pause-screen');
            
            if (isPaused) {
                // Update pause screen stats
                let earnedMult = playerLevel;
                if (gearData.jetpack.equipped) earnedMult *= 2;
                if (companyData.bananaCorp.completed) earnedMult *= 1.5;
                if (companyData.megaPrimate.completed) earnedMult *= 2.0;
                
                document.getElementById('pause-score').innerText = Math.floor(score * earnedMult);
                document.getElementById('pause-dist').innerText = Math.floor(distance);
                document.getElementById('pause-combo').innerText = `x${maxCombo}`;
                document.getElementById('pause-speed').innerText = Math.floor((gameSpeed / BASE_SPEED) * 100) + '%';
                
                pauseScreen.classList.remove('hidden');
            } else {
                pauseScreen.classList.add('hidden');
            }
        }

        function quitGame() {
            isPaused = false;
            gameActive = false;
            
            document.getElementById('pause-screen').classList.add('hidden');
            document.getElementById('game-over-screen').classList.add('hidden');
            document.getElementById('start-screen').classList.remove('hidden');
            
            updateMenuStats();
        }

        function openSettings() {
            const wasActive = gameActive && !isPaused;
            if (wasActive) togglePause();
            
            document.getElementById('settings-screen').classList.remove('hidden');
        }

        function closeSettings() {
            document.getElementById('settings-screen').classList.add('hidden');
        }

        function updateSettings() {
            settings.bobbing = document.getElementById('set-bobbing').checked;
            settings.shadows = document.getElementById('set-shadows').checked;
            settings.particles = document.getElementById('set-particles').checked;
            
            localStorage.setItem('setBobbing', settings.bobbing);
            localStorage.setItem('setShadows', settings.shadows);
            localStorage.setItem('setParticles', settings.particles);

            renderer.shadowMap.enabled = settings.shadows;
            
            scene.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = settings.shadows;
                    child.receiveShadow = settings.shadows;
                }
            });

            showToast('Settings Saved!', 'blue');
        }

        function confirmResetProgress() {
            if (confirm('⚠️ WARNING: This will delete ALL your progress, gear, army, and takeovers! Are you absolutely sure?')) {
                if (confirm('This action cannot be undone! Final confirmation?')) {
                    localStorage.clear();
                    location.reload();
                }
            }
        }

        function openStats() {
            document.getElementById('stats-screen').classList.remove('hidden');
            renderStatsScreen();
        }

        function closeStats() {
            document.getElementById('stats-screen').classList.add('hidden');
        }

        function renderStatsScreen() {
            // Lifetime Stats
            const statsList = document.getElementById('stats-list');
            statsList.innerHTML = '';
            
            const stats = [
                { label: 'Total Runs', value: gameStats.totalRuns, icon: '🏃' },
                { label: 'Total Distance', value: `${gameStats.totalDistance}m`, icon: '📏' },
                { label: 'Bananas Collected', value: gameStats.totalBananasCollected, icon: '🍌' },
                { label: 'Total Crashes', value: gameStats.totalCrashes, icon: '💥' },
                { label: 'Perfect Runs', value: gameStats.perfectRuns, icon: '✨' },
                { label: 'Longest Run', value: `${gameStats.longestRun}m`, icon: '🏆' }
            ];

            stats.forEach(stat => {
                const item = document.createElement('div');
                item.className = 'stat-item';
                item.innerHTML = `
                    <span class="font-sans-bold text-slate-700">${stat.icon} ${stat.label}</span>
                    <span class="font-sans-bold text-blue-600">${stat.value}</span>
                `;
                statsList.appendChild(item);
            });

            // Daily Missions
            const missionsList = document.getElementById('missions-list');
            missionsList.innerHTML = '';

            dailyMissions.forEach(mission => {
                const missionCard = document.createElement('div');
                missionCard.className = 'mission-card';
                
                const progress = Math.min(100, (mission.progress / mission.target) * 100);
                
                missionCard.innerHTML = `
                    <div class="flex justify-between items-start mb-2">
                        <div class="font-sans-bold text-sm text-slate-700">${mission.desc}</div>
                        <div class="text-xs font-sans-bold ${mission.completed ? 'text-green-600' : 'text-blue-600'}">
                            ${mission.completed ? '✅ Done' : `🍌 ${mission.reward}`}
                        </div>
                    </div>
                    <div class="progress-bar h-2">
                        <div class="progress-fill ${mission.completed ? 'bg-green-500' : 'bg-blue-500'}" style="width: ${progress}%;"></div>
                    </div>
                    <div class="text-xs font-sans-normal text-slate-500 mt-1">${mission.progress} / ${mission.target}</div>
                `;
                
                missionsList.appendChild(missionCard);
            });

            // Leaderboard
            const leaderboardList = document.getElementById('leaderboard-list');
            leaderboardList.innerHTML = '';

            const topScores = gameStats.topScores.slice(0, 5);
            
            if (topScores.length === 0) {
                leaderboardList.innerHTML = '<div class="text-center text-slate-400 font-sans-normal text-sm py-4">No runs recorded yet!</div>';
            } else {
                topScores.forEach((entry, index) => {
                    const item = document.createElement('div');
                    item.className = 'leaderboard-entry';
                    
                    item.innerHTML = `
                        <div class="leaderboard-rank ${index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-slate-300' : index === 2 ? 'bg-orange-400' : 'bg-slate-200'}">
                            ${index + 1}
                        </div>
                        <div class="flex-1 font-sans-bold text-slate-700">
                            <div class="text-sm">${entry.score} 🍌</div>
                            <div class="text-xs text-slate-500">${entry.distance}m</div>
                        </div>
                        <div class="text-xs font-sans-normal text-slate-400">
                            ${new Date(entry.date).toLocaleDateString()}
                        </div>
                    `;
                    
                    leaderboardList.appendChild(item);
                });
            }
        }

        function triggerGameOver(reason) {
            gameActive = false;
            gameStats.totalCrashes++;
            gameStats.totalDistance += Math.floor(distance);
            
            localStorage.setItem('totalCrashes', gameStats.totalCrashes);
            localStorage.setItem('totalDistance', gameStats.totalDistance);
            
            if (Math.floor(distance) > gameStats.longestRun) {
                gameStats.longestRun = Math.floor(distance);
                localStorage.setItem('longestRun', gameStats.longestRun);
            }

            // Calculate final score with all multipliers
            let earnedMult = playerLevel;
            if (gearData.jetpack.equipped) earnedMult *= 2;
            if (companyData.bananaCorp.completed) earnedMult *= 1.5;
            if (companyData.megaPrimate.completed) earnedMult *= 2.0;
            if (companyData.toyEmpire.completed) earnedMult *= 1.5;

            let finalRunScore = Math.floor(score * earnedMult);
            
            // XP Gain (distance-based)
            const xpGained = Math.floor(distance / 10);
            playerXP += xpGained;
            
            // Check for level up
            const xpNeeded = Math.floor(100 * Math.pow(1.5, playerLevel - 1));
            while (playerXP >= xpNeeded) {
                playerXP -= xpNeeded;
                playerLevel++;
                showAchievement(`Level Up! Now Level ${playerLevel}!`);
            }
            
            localStorage.setItem('monkeyXP', playerXP);
            localStorage.setItem('monkeyLvl', playerLevel);

            // Check for new high score
            let isNewRecord = false;
            if (finalRunScore > sessionHighScore) {
                sessionHighScore = finalRunScore;
                localStorage.setItem('monkeyHighScore', sessionHighScore);
                isNewRecord = true;
            }

            // Add to leaderboard
            gameStats.topScores.push({
                score: finalRunScore,
                distance: Math.floor(distance),
                combo: maxCombo,
                date: Date.now()
            });
            gameStats.topScores.sort((a, b) => b.score - a.score);
            gameStats.topScores = gameStats.topScores.slice(0, 10);
            localStorage.setItem('topScores', JSON.stringify(gameStats.topScores));

            // Update daily missions
            dailyMissions[0].progress = Math.max(dailyMissions[0].progress, score);
            dailyMissions[1].progress = Math.max(dailyMissions[1].progress, Math.floor(distance));
            dailyMissions[2].progress = Math.max(dailyMissions[2].progress, maxCombo);

            // Update game over screen
            document.getElementById('death-reason').innerText = reason;
            document.getElementById('final-score').innerText = finalRunScore;
            document.getElementById('final-dist').innerText = Math.floor(distance);
            document.getElementById('final-combo').innerText = `x${maxCombo}`;
            document.getElementById('final-bananas').innerText = score;
            document.getElementById('final-xp').innerText = xpGained;
            
            if (isNewRecord) {
                document.getElementById('new-record-badge').classList.remove('hidden');
            } else {
                document.getElementById('new-record-badge').classList.add('hidden');
            }
            
            document.getElementById('game-over-screen').classList.remove('hidden');
        }

        function resetGame() {
            document.getElementById('game-over-screen').classList.add('hidden');
            resetVariables();
            gameActive = true;
        }

        function resetVariables() {
            score = 0;
            distance = 0;
            combo = 1;
            maxCombo = 1;
            lastBananaTime = Date.now();
            gameSpeed = BASE_SPEED;
            speedMultiplier = 1.0;
            currentLane = 0;
            targetLane = 0;
            isJumping = false;
            activePowerUp = null;
            powerUpTimer = 0;
            
            playerGroup.position.set(0, GROUND_Y, 0);
            playerGroup.rotation.set(0, 0, 0);
            
            obstacles.forEach(o => scene.remove(o));
            obstacles = [];
            bananas.forEach(b => scene.remove(b));
            bananas = [];
            powerUps.forEach(p => scene.remove(p));
            powerUps = [];
            
            laneState = { 
                '-1': { type: null, z: 0 }, 
                '0': { type: null, z: 0 }, 
                '1': { type: null, z: 0 } 
            };
            
            spawnTimer = 20;
            
            deactivatePowerUp();
            updateUI();
        }

        // ============================================
        // HQ SYSTEM - GEAR TAB
        // ============================================
        
        function openHQ() {
            if (gameActive) togglePause();
            
            document.getElementById('hq-screen').classList.remove('hidden');
            document.getElementById('hq-banana-val').innerText = totalBananas;
            
            renderGearTab();
            renderArmyTab();
            renderTrainingTab();
            renderTakeoverTab();
            
            lucide.createIcons();
        }

        function closeHQ() {
            document.getElementById('hq-screen').classList.add('hidden');
        }

        function switchHQTab(tabName) {
            document.getElementById('tab-gear').classList.add('hidden');
            document.getElementById('tab-army').classList.add('hidden');
            document.getElementById('tab-level').classList.add('hidden');
            document.getElementById('tab-takeover').classList.add('hidden');

            document.getElementById('tab-btn-gear').className = "toy-btn text-xs px-3 py-2 flex-1 bg-slate-200";
            document.getElementById('tab-btn-army').className = "toy-btn text-xs px-3 py-2 flex-1 bg-slate-200";
            document.getElementById('tab-btn-level').className = "toy-btn text-xs px-3 py-2 flex-1 bg-slate-200";
            document.getElementById('tab-btn-takeover').className = "toy-btn text-xs px-3 py-2 flex-1 bg-slate-200";

            document.getElementById(`tab-${tabName}`).classList.remove('hidden');
            document.getElementById(`tab-btn-${tabName}`).className = "toy-btn text-xs px-3 py-2 flex-1 bg-yellow-400";
        }

        function renderGearTab() {
            const container = document.getElementById('gear-list');
            container.innerHTML = '';
            
            for (let key in gearData) {
                const item = gearData[key];
                const card = document.createElement('div');
                card.className = "flex justify-between items-center bg-white p-3 border-3 border-slate-800 rounded-xl transition-transform hover:translate-x-1";
                
                let actionBtnHTML = '';
                if (!item.owned) {
                    const canAfford = totalBananas >= item.cost;
                    actionBtnHTML = `<button class="toy-btn text-sm px-4 py-2" ${canAfford ? '' : 'disabled'} onclick="buyGear('${key}')">Buy 🍌${item.cost}</button>`;
                } else {
                    const isEquipped = item.equipped;
                    actionBtnHTML = `<button class="toy-btn ${isEquipped ? 'btn-green' : 'btn-blue'} text-sm px-4 py-2" onclick="toggleEquipGear('${key}')">${isEquipped ? '✓ Equipped' : 'Equip'}</button>`;
                }

                card.innerHTML = `
                    <div class="text-left font-sans-bold text-slate-700 max-w-[60%]">
                        <div class="text-base">${item.name}</div>
                        <div class="text-xs text-slate-500 font-normal">${item.bonus}</div>
                        <div class="text-[10px] text-slate-400 font-normal italic mt-1">${item.description}</div>
                    </div>
                    <div>${actionBtnHTML}</div>
                `;
                container.appendChild(card);
            }
        }

        function buyGear(key) {
            const item = gearData[key];
            if (totalBananas >= item.cost) {
                totalBananas -= item.cost;
                item.owned = true;
                item.equipped = true;
                
                localStorage.setItem('monkeyBananas', totalBananas);
                localStorage.setItem('monkeyGearData', JSON.stringify(gearData));
                
                updateVisuallyEquippedGear();
                showToast(`Purchased: ${item.name}!`, 'green');
                openHQ();
            }
        }

        function toggleEquipGear(key) {
            const item = gearData[key];
            item.equipped = !item.equipped;
            
            localStorage.setItem('monkeyGearData', JSON.stringify(gearData));
            updateVisuallyEquippedGear();
            
            showToast(item.equipped ? `Equipped: ${item.name}` : `Unequipped: ${item.name}`, 'blue');
            openHQ();
        }

        // ============================================
        // HQ SYSTEM - ARMY TAB
        // ============================================
        
        function renderArmyTab() {
            const container = document.getElementById('army-list');
            container.innerHTML = '';
            
            document.getElementById('hq-passive-rate').innerText = getPassiveBananaRate();

            for (let key in armyData) {
                const item = armyData[key];
                const card = document.createElement('div');
                card.className = "flex justify-between items-center bg-white p-3 border-3 border-slate-800 rounded-xl transition-transform hover:translate-x-1";
                
                const canAfford = totalBananas >= item.cost;
                
                card.innerHTML = `
                    <div class="text-left font-sans-bold text-slate-700 max-w-[60%]">
                        <div class="text-base">${item.icon} ${item.name} <span class="text-blue-500">(x${item.count})</span></div>
                        <div class="text-xs text-slate-500 font-normal">${item.desc}</div>
                        <div class="text-xs text-green-600 font-bold mt-1">+${item.dps} 🍌/sec each</div>
                    </div>
                    <div>
                        <button class="toy-btn text-xs px-3 py-2" ${canAfford ? '' : 'disabled'} onclick="buyArmy('${key}')">
                            Hire<br>🍌${item.cost}
                        </button>
                    </div>
                `;
                container.appendChild(card);
            }
        }

        function buyArmy(key) {
            const item = armyData[key];
            if (totalBananas >= item.cost) {
                totalBananas -= item.cost;
                item.count++;
                item.cost = Math.floor(item.cost * 1.35);

                localStorage.setItem('monkeyBananas', totalBananas);
                localStorage.setItem('monkeyArmyData', JSON.stringify(armyData));
                
                showToast(`Hired: ${item.name}!`, 'green');
                openHQ();
            }
        }

        // ============================================
        // HQ SYSTEM - TRAINING TAB
        // ============================================
        
        function renderTrainingTab() {
            const lvlCost = Math.floor(100 * Math.pow(1.5, playerLevel - 1));
            const xpNeeded = Math.floor(100 * Math.pow(1.5, playerLevel - 1));
            
            document.getElementById('monkey-lvl-text').innerText = playerLevel;
            document.getElementById('lvlup-cost').innerText = lvlCost;
            document.getElementById('total-xp-text').innerText = playerXP;
            document.getElementById('next-lvl-xp').innerText = xpNeeded;
            
            const xpProgress = (playerXP / xpNeeded) * 100;
            document.getElementById('level-progress').style.width = `${xpProgress}%`;
            
            let earnedMult = playerLevel;
            if (companyData.bananaCorp.completed) earnedMult *= 1.5;
            if (companyData.megaPrimate.completed) earnedMult *= 2.0;
            
            document.getElementById('monkey-mult-text').innerText = `${earnedMult.toFixed(1)}x`;

            const btn = document.getElementById('btn-lvlup');
            if (totalBananas < lvlCost) {
                btn.disabled = true;
            } else {
                btn.disabled = false;
            }
        }

        function buyLevelUp() {
            const lvlCost = Math.floor(100 * Math.pow(1.5, playerLevel - 1));
            if (totalBananas >= lvlCost) {
                totalBananas -= lvlCost;
                playerLevel++;
                
                localStorage.setItem('monkeyBananas', totalBananas);
                localStorage.setItem('monkeyLvl', playerLevel);
                
                showAchievement(`Level Up! Now Level ${playerLevel}!`);
                openHQ();
            }
        }

        // ============================================
        // HQ SYSTEM - TAKEOVER TAB
        // ============================================
        
        function renderTakeoverTab() {
            const container = document.getElementById('company-list');
            container.innerHTML = '';

            for (let key in companyData) {
                const comp = companyData[key];
                const card = document.createElement('div');
                card.className = "flex flex-col bg-white p-3 border-3 border-slate-800 rounded-xl text-left transition-transform hover:translate-x-1";

                let actionBtnHTML = '';
                if (comp.completed) {
                    actionBtnHTML = `<span class="text-green-600 font-sans-bold border-2 border-green-400 px-3 py-1 rounded-lg bg-green-50">✅ ACQUIRED</span>`;
                } else {
                    actionBtnHTML = `<button class="toy-btn btn-red text-xs px-4 py-2" onclick="startCompanyTakeover('${key}')">🎯 LAUNCH RAID</button>`;
                }

                card.innerHTML = `
                    <div class="flex justify-between items-start mb-2">
                        <div class="font-sans-bold text-slate-700">
                            <div class="text-lg">${comp.icon} ${comp.name}</div>
                            <div class="text-xs text-slate-500 font-normal mt-1">${comp.desc}</div>
                            <div class="text-xs text-purple-600 font-bold mt-2">Difficulty: ${'⭐'.repeat(comp.difficulty)}</div>
                        </div>
                        <div>${actionBtnHTML}</div>
                    </div>
                `;
                container.appendChild(card);
            }
        }

        // ============================================
        // COMPANY TAKEOVER BATTLE MINIGAME
        // ============================================
        
        function startCompanyTakeover(companyKey) {
            closeHQ();
            activeBattleCompany = companyData[companyKey];
            
            document.getElementById('battle-company-name').innerText = activeBattleCompany.icon + ' ' + activeBattleCompany.name;
            document.getElementById('battle-screen').classList.remove('hidden');

            battleOwnershipPercentage = 0;
            battleTimeElapsed = 0;
            battlePerfectHits = 0;
            battleMisses = 0;
            
            document.getElementById('battle-perfect-hits').innerText = '0';
            document.getElementById('battle-misses').innerText = '0';
            
            battlePointerSpeed = 1.5 + (activeBattleCompany.difficulty * 0.4);
            sweetSpotMin = 42 - (activeBattleCompany.difficulty * 4);
            sweetSpotMax = 58 + (activeBattleCompany.difficulty * 4);

            const sliderSweet = document.getElementById('battle-slider-sweet');
            sliderSweet.style.left = `${sweetSpotMin}%`;
            sliderSweet.style.width = `${sweetSpotMax - sweetSpotMin}%`;

            let armyDPSRate = getPassiveBananaRate() / 40; 
            document.getElementById('battle-army-dps').innerText = `${armyDPSRate.toFixed(2)}%`;

            battleTimerInterval = setInterval(() => {
                battleTimeElapsed += 0.1;
                let timeLeft = Math.max(0, battleTimeLimit - Math.floor(battleTimeElapsed));
                document.getElementById('battle-time-left').innerText = `${timeLeft}s`;

                battlePointerPos += battlePointerSpeed * battlePointerDirection;
                if (battlePointerPos >= 100) {
                    battlePointerPos = 100;
                    battlePointerDirection = -1;
                } else if (battlePointerPos <= 0) {
                    battlePointerPos = 0;
                    battlePointerDirection = 1;
                }
                document.getElementById('battle-slider-pointer').style.left = `${battlePointerPos}%`;

                battleOwnershipPercentage += armyDPSRate * 0.1;
                
                if (battleOwnershipPercentage >= 100) {
                    winTakeoverBattle();
                }

                let widthPct = Math.min(100, Math.floor(battleOwnershipPercentage));
                document.getElementById('battle-ownership').innerText = `${widthPct}%`;
                document.getElementById('battle-progress-bar').style.width = `${widthPct}%`;

                if (battleTimeElapsed >= battleTimeLimit && battleOwnershipPercentage < 100) {
                    loseTakeoverBattle();
                }
            }, 100);
        }

        function triggerTakeoverClick() {
            if (!activeBattleCompany) return;

            if (battlePointerPos >= sweetSpotMin && battlePointerPos <= sweetSpotMax) {
                let clickForce = 10 + (playerLevel * 1.5);
                if (gearData.jetpack.equipped) clickForce *= 1.4;
                
                battleOwnershipPercentage += clickForce;
                battlePerfectHits++;
                
                document.getElementById('battle-perfect-hits').innerText = battlePerfectHits;
                
                const sweet = document.getElementById('battle-slider-sweet');
                sweet.style.background = 'linear-gradient(135deg, #ffffff 0%, #10b981 100%)';
                setTimeout(() => sweet.style.background = 'linear-gradient(135deg, var(--ui-green) 0%, #059669 100%)', 150);
                
                if (settings.particles) {
                    spawnParticle('💥', { x: 0, y: window.innerHeight / 2, z: 0 });
                }
            } else {
                battleOwnershipPercentage += 0.5;
                battleMisses++;
                
                document.getElementById('battle-misses').innerText = battleMisses;
            }
        }

        function retreatFromBattle() {
            clearInterval(battleTimerInterval);
            document.getElementById('battle-screen').classList.add('hidden');
            activeBattleCompany = null;
            openHQ();
        }

        function winTakeoverBattle() {
            clearInterval(battleTimerInterval);
            document.getElementById('battle-screen').classList.add('hidden');
            
            activeBattleCompany.completed = true;
            localStorage.setItem('monkeyCompanies', JSON.stringify(companyData));

            showAchievement(`🎉 TAKEOVER SUCCESSFUL! You acquired ${activeBattleCompany.name}!`);
            
            activeBattleCompany = null;
            openHQ();
        }

        function loseTakeoverBattle() {
            clearInterval(battleTimerInterval);
            document.getElementById('battle-screen').classList.add('hidden');
            
            showToast('⏰ Takeover Failed - Time Ran Out!', 'red');
            
            activeBattleCompany = null;
            openHQ();
        }

        // ============================================
        // VISUAL EFFECTS & NOTIFICATIONS
        // ============================================
        
        function showToast(message, color) {
            const colors = {
                green: 'bg-green-500',
                blue: 'bg-blue-500',
                red: 'bg-red-500',
                purple: 'bg-purple-500',
                yellow: 'bg-yellow-500'
            };

            const toast = document.createElement('div');
            toast.className = `toast ${colors[color] || 'bg-slate-500'}`;
            toast.innerHTML = `
                <div class="font-sans-bold text-white text-sm">${message}</div>
            `;
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }

        function showAchievement(message) {
            const achievement = document.createElement('div');
            achievement.className = 'achievement';
            achievement.innerHTML = `
                <div class="text-2xl text-slate-800 font-sans-bold text-outline">
                    🏆 ${message}
                </div>
            `;
            
            document.body.appendChild(achievement);
            
            setTimeout(() => {
                achievement.style.opacity = '0';
                setTimeout(() => achievement.remove(), 500);
            }, 4000);
        }

        function spawnParticle(emoji, position) {
            const container = document.getElementById('particle-container');
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.innerText = emoji;
            
            const rect = renderer.domElement.getBoundingClientRect();
            const screenPos = position;
            
            particle.style.left = (rect.width / 2) + 'px';
            particle.style.top = (rect.height / 2) + 'px';
            
            container.appendChild(particle);
            
            setTimeout(() => particle.remove(), 2000);
        }

        // ============================================
        // WINDOW RESIZE HANDLER
        // ============================================
        
        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

        // ============================================
        // INITIALIZE GAME ON LOAD
        // ============================================
        
        window.onload = init;
    
