/**
 * Life29 - 3D 地球模块
 * 精确地图版本
 */

class Globe {
    constructor(container, cities = []) {
        this.container = container;
        this.cities = cities;
        this.markers = [];
        this.hoveredMarker = null;
        this.homeCity = null;
        this.isHovering = false;
        
        this.config = {
            radius: 180,
            markerSize: 3, // 缩小一半
            segments: 64,
            autoRotate: true,
            autoRotateSpeed: 0.0006,
            minDistance: 280,
            maxDistance: 550
        };
        
        this.isDragging = false;
        this.previousMousePosition = { x: 0, y: 0 };
        this.targetRotation = { x: 0, y: 0 };
        this.currentRotation = { x: 0, y: 0 };
        this.momentum = { x: 0, y: 0 };
        
        this.chinaCities = {
            '北京': [39.9, 116.4], '上海': [31.2, 121.5], '天津': [39.1, 117.2],
            '重庆': [29.6, 106.5], '香港': [22.3, 114.2], '澳门': [22.2, 113.5],
            '台北': [25.0, 121.5], '广州': [23.1, 113.3], '深圳': [22.5, 114.1],
            '杭州': [30.3, 120.2], '南京': [32.1, 118.8], '苏州': [31.3, 120.6],
            '成都': [30.7, 104.1], '武汉': [30.6, 114.3], '西安': [34.3, 108.9],
            '长沙': [28.2, 113.0], '郑州': [34.8, 113.7], '青岛': [36.1, 120.4],
            '大连': [38.9, 121.6], '厦门': [24.5, 118.1], '福州': [26.1, 119.3],
            '济南': [36.7, 117.0], '沈阳': [41.8, 123.4], '哈尔滨': [45.8, 126.5],
            '长春': [43.9, 125.3], '南昌': [28.7, 115.9], '合肥': [31.9, 117.3],
            '昆明': [25.0, 102.7], '贵阳': [26.6, 106.7], '南宁': [22.8, 108.3],
            '海口': [20.0, 110.3], '三亚': [18.3, 109.5], '拉萨': [29.6, 91.1],
            '乌鲁木齐': [43.8, 87.6], '兰州': [36.1, 103.8], '银川': [38.5, 106.3],
            '西宁': [36.6, 101.8], '呼和浩特': [40.8, 111.7], '石家庄': [38.0, 114.5],
            '太原': [37.9, 112.5], '无锡': [31.5, 120.3], '宁波': [29.9, 121.5],
            '温州': [28.0, 120.7], '珠海': [22.3, 113.6], '东莞': [23.0, 113.7],
            '浙江': [29.2, 120.2]
        };
        
        this.usCities = {
            'San Francisco': [37.8, -122.4], 'Los Angeles': [34.1, -118.2],
            'New York': [40.7, -74.0], 'Chicago': [41.9, -87.6],
            'Houston': [29.8, -95.4], 'Phoenix': [33.4, -112.1],
            'Philadelphia': [40.0, -75.2], 'San Antonio': [29.4, -98.5],
            'San Diego': [32.7, -117.2], 'Dallas': [32.8, -96.8],
            'San Jose': [37.3, -121.9], 'Austin': [30.3, -97.7],
            'Seattle': [47.6, -122.3], 'Denver': [39.7, -105.0],
            'Boston': [42.4, -71.1], 'Las Vegas': [36.2, -115.1],
            'Portland': [45.5, -122.7], 'Miami': [25.8, -80.2],
            'Atlanta': [33.7, -84.4], 'Washington DC': [38.9, -77.0]
        };
        
        this.init();
    }
    
    // 中国省份数据 - 简化但准确的多边形
    getChinaProvinces() {
        const colors = {
            pink: 0xf8d0d8, green: 0xc8e8c8, yellow: 0xf8f0c0,
            blue: 0xc8d8f0, orange: 0xf8e0c0, purple: 0xe0d0e8
        };
        return [
            // 黑龙江
            { coords: [[53.5,123],[52,127],[50,129],[48,134],[46,133],[45,131],[43,130],[45,128],[47,124],[49,121],[51,120],[53,121],[53.5,123]], color: colors.green },
            // 吉林
            { coords: [[46,123],[47,124],[45,128],[44,129],[43,128],[42,128],[41,126],[42,124],[44,122],[46,123]], color: colors.pink },
            // 辽宁
            { coords: [[43,120],[44,122],[42,124],[41,126],[40,124],[39,122],[39,120],[40,119],[42,119],[43,120]], color: colors.blue },
            // 内蒙古
            { coords: [[53,120],[51,120],[49,118],[47,119],[45,116],[43,115],[41,114],[40,112],[39,108],[40,106],[42,102],[44,98],[46,93],[48,90],[50,89],[49,97],[51,108],[53,115],[53,120]], color: colors.yellow },
            // 新疆
            { coords: [[49,88],[48,92],[47,96],[44,96],[42,93],[40,88],[38,82],[36,79],[35,76],[36,74],[38,74],[40,76],[42,80],[44,82],[47,84],[49,88]], color: colors.orange },
            // 西藏
            { coords: [[36,79],[34,80],[32,80],[30,82],[28,86],[27,90],[28,94],[30,97],[32,99],[34,96],[36,90],[37,84],[36,79]], color: colors.blue },
            // 青海
            { coords: [[39,96],[38,100],[36,103],[34,102],[33,100],[32,98],[34,94],[36,92],[38,94],[39,96]], color: colors.blue },
            // 甘肃
            { coords: [[42,100],[40,102],[38,104],[36,106],[35,105],[34,104],[35,102],[37,100],[39,98],[41,98],[42,100]], color: colors.yellow },
            // 宁夏
            { coords: [[39,105],[39,107],[38,107],[37,106],[37,105],[38,105],[39,105]], color: colors.blue },
            // 陕西
            { coords: [[39,108],[39,111],[37,111],[35,111],[34,110],[33,108],[34,106],[36,106],[38,107],[39,108]], color: colors.orange },
            // 山西
            { coords: [[40,111],[40,114],[38,114],[36,113],[35,112],[36,111],[38,111],[40,111]], color: colors.yellow },
            // 河北
            { coords: [[42,115],[42,118],[40,119],[39,118],[38,117],[37,116],[38,115],[40,114],[42,115]], color: colors.pink },
            // 山东
            { coords: [[38,115],[38,120],[37,122],[35,121],[34,120],[35,117],[37,116],[38,115]], color: colors.yellow },
            // 河南
            { coords: [[36,111],[36,115],[34,116],[32,115],[32,112],[34,111],[36,111]], color: colors.yellow },
            // 江苏
            { coords: [[35,117],[35,120],[33,121],[32,121],[31,119],[32,117],[34,117],[35,117]], color: colors.yellow },
            // 安徽
            { coords: [[34,116],[34,118],[32,119],[30,118],[30,116],[32,115],[34,116]], color: colors.green },
            // 浙江
            { coords: [[31,119],[31,122],[29,122],[28,121],[27,120],[28,118],[30,118],[31,119]], color: colors.pink },
            // 江西
            { coords: [[30,114],[30,117],[28,118],[26,117],[25,115],[26,114],[28,114],[30,114]], color: colors.pink },
            // 福建
            { coords: [[28,117],[28,120],[26,120],[24,119],[24,117],[26,117],[28,117]], color: colors.pink },
            // 台湾
            { coords: [[25,120],[26,122],[24,122],[22,121],[22,120],[24,120],[25,120]], color: colors.green },
            // 湖北
            { coords: [[33,109],[33,114],[31,116],[29,114],[29,110],[31,109],[33,109]], color: colors.orange },
            // 湖南
            { coords: [[30,109],[30,114],[27,114],[25,112],[26,109],[28,109],[30,109]], color: colors.orange },
            // 广东
            { coords: [[25,112],[25,117],[23,117],[21,114],[21,111],[23,110],[25,112]], color: colors.pink },
            // 广西
            { coords: [[26,105],[26,111],[23,110],[21,108],[22,105],[24,105],[26,105]], color: colors.pink },
            // 海南
            { coords: [[20,109],[20,111],[19,111],[18,110],[18,109],[19,109],[20,109]], color: colors.orange },
            // 四川
            { coords: [[34,102],[34,108],[31,108],[28,106],[27,103],[29,100],[32,100],[34,102]], color: colors.orange },
            // 贵州
            { coords: [[29,104],[29,109],[26,109],[25,107],[26,104],[28,104],[29,104]], color: colors.orange },
            // 云南
            { coords: [[29,98],[29,105],[25,105],[22,103],[21,100],[24,98],[27,98],[29,98]], color: colors.yellow },
            // 北京
            { coords: [[40.5,116],[40.5,117],[40,117],[39.5,117],[39.5,116],[40,116],[40.5,116]], color: colors.pink },
            // 天津
            { coords: [[40,117],[40,118],[39.5,118.5],[39,118],[39,117],[39.5,117],[40,117]], color: colors.green },
            // 上海
            { coords: [[31.5,121],[31.5,122],[31,122],[30.8,121.5],[31,121],[31.5,121]], color: colors.yellow },
            // 重庆
            { coords: [[32,106],[32,109],[30,110],[29,109],[29,107],[30,106],[32,106]], color: colors.blue },
            // 香港
            { coords: [[22.5,113.8],[22.5,114.4],[22.2,114.4],[22.2,113.8],[22.5,113.8]], color: colors.yellow },
            // 澳门
            { coords: [[22.25,113.5],[22.25,113.6],[22.1,113.6],[22.1,113.5],[22.25,113.5]], color: colors.green }
        ];
    }
    
    // 美国州数据
    getUSStates() {
        const colors = {
            pink: 0xf8d0d8, green: 0xc8e8c8, yellow: 0xf8f0c0,
            blue: 0xc8d8f0, purple: 0xe0d0e8
        };
        return [
            // Washington
            { coords: [[49,-124],[49,-117],[46,-117],[46,-120],[47,-122],[48,-123],[49,-124]], color: colors.green },
            // Oregon
            { coords: [[46,-124],[46,-117],[42,-117],[42,-121],[43,-124],[46,-124]], color: colors.green },
            // California
            { coords: [[42,-124],[42,-120],[39,-120],[35,-115],[33,-117],[32.5,-117],[34,-120],[36,-122],[39,-123],[42,-124]], color: colors.green },
            // Nevada
            { coords: [[42,-120],[42,-114],[35,-114],[36,-117],[39,-120],[42,-120]], color: colors.purple },
            // Idaho
            { coords: [[49,-117],[49,-111],[44,-111],[42,-114],[42,-117],[46,-117],[49,-117]], color: colors.green },
            // Montana
            { coords: [[49,-116],[49,-104],[45,-104],[45,-111],[46,-113],[47,-115],[49,-116]], color: colors.yellow },
            // Wyoming
            { coords: [[45,-111],[45,-104],[41,-104],[41,-111],[45,-111]], color: colors.pink },
            // Utah
            { coords: [[42,-114],[42,-109],[37,-109],[37,-114],[42,-114]], color: colors.purple },
            // Colorado
            { coords: [[41,-109],[41,-102],[37,-102],[37,-109],[41,-109]], color: colors.pink },
            // Arizona
            { coords: [[37,-114],[37,-109],[31.5,-109],[32,-111],[32.5,-114],[37,-114]], color: colors.yellow },
            // New Mexico
            { coords: [[37,-109],[37,-103],[32,-103],[31.5,-109],[37,-109]], color: colors.pink },
            // North Dakota
            { coords: [[49,-104],[49,-97],[46,-97],[46,-104],[49,-104]], color: colors.yellow },
            // South Dakota
            { coords: [[46,-104],[46,-97],[43,-97],[43,-104],[46,-104]], color: colors.purple },
            // Nebraska
            { coords: [[43,-104],[43,-97],[40,-97],[40,-102],[41,-104],[43,-104]], color: colors.yellow },
            // Kansas
            { coords: [[40,-102],[40,-95],[37,-95],[37,-102],[40,-102]], color: colors.pink },
            // Oklahoma
            { coords: [[37,-103],[37,-95],[34,-95],[33.5,-97],[34,-100],[36.5,-100],[36.5,-103],[37,-103]], color: colors.green },
            // Texas
            { coords: [[36.5,-103],[36.5,-100],[34,-100],[33.5,-97],[34,-95],[30,-94],[28,-97],[26,-97],[26,-99],[29,-101],[32,-106],[36.5,-103]], color: colors.purple },
            // Minnesota
            { coords: [[49,-97],[49,-90],[47,-90],[44,-92],[43,-96],[46,-97],[49,-97]], color: colors.pink },
            // Iowa
            { coords: [[43.5,-96],[44,-92],[43,-90],[41,-91],[40.5,-95],[43.5,-96]], color: colors.yellow },
            // Missouri
            { coords: [[40.5,-95],[41,-91],[40,-89],[38,-90],[36,-90],[36,-94],[39,-95],[40.5,-95]], color: colors.green },
            // Arkansas
            { coords: [[36.5,-94],[36,-90],[35,-90],[33,-91],[33,-94],[36.5,-94]], color: colors.pink },
            // Louisiana
            { coords: [[33,-94],[33,-91],[31,-90],[29,-90],[29,-94],[33,-94]], color: colors.purple },
            // Wisconsin
            { coords: [[47,-92],[47,-87],[45,-87],[43,-87],[43,-91],[45,-92],[47,-92]], color: colors.green },
            // Illinois
            { coords: [[42.5,-91],[43,-87],[41,-87],[38,-88],[37,-89],[37,-91],[40,-91],[42.5,-91]], color: colors.yellow },
            // Michigan
            { coords: [[46,-90],[46,-84],[44,-84],[42,-83],[42,-86],[44,-87],[45,-88],[46,-90]], color: colors.green },
            // Indiana
            { coords: [[41.8,-88],[42,-85],[40,-85],[38,-86],[37.8,-88],[41.8,-88]], color: colors.pink },
            // Ohio
            { coords: [[42,-85],[42,-81],[40,-81],[39,-81],[38,-82],[38,-85],[42,-85]], color: colors.yellow },
            // Kentucky
            { coords: [[39,-89],[39,-83],[38,-82],[36.5,-84],[36.5,-89],[39,-89]], color: colors.green },
            // Tennessee
            { coords: [[36.7,-90],[36.7,-82],[35,-82],[35,-88],[35,-90],[36.7,-90]], color: colors.yellow },
            // Mississippi
            { coords: [[35,-91],[35,-88],[32,-88],[30.5,-89],[30.5,-91],[35,-91]], color: colors.purple },
            // Alabama
            { coords: [[35,-88],[35,-85],[32,-85],[30.5,-88],[35,-88]], color: colors.pink },
            // Georgia
            { coords: [[35,-85],[35,-81],[32,-81],[30.5,-82],[30.5,-85],[35,-85]], color: colors.green },
            // Florida
            { coords: [[31,-87.5],[31,-82],[30,-81],[27,-80],[25,-80],[25,-82],[28,-84],[30,-86],[31,-87.5]], color: colors.purple },
            // South Carolina
            { coords: [[35,-83],[35,-79],[33,-79],[32,-80],[32,-81.5],[34,-83],[35,-83]], color: colors.pink },
            // North Carolina
            { coords: [[36.5,-84],[36.5,-76],[35,-76],[34,-78],[35,-81],[35,-83],[36.5,-84]], color: colors.green },
            // Virginia
            { coords: [[39.5,-83],[39,-78],[38.5,-76],[37,-76],[36.5,-76],[36.5,-83],[39.5,-83]], color: colors.pink },
            // West Virginia
            { coords: [[40,-81],[40,-78],[39,-78],[38,-79],[37.5,-81],[39,-82],[40,-81]], color: colors.purple },
            // Pennsylvania
            { coords: [[42,-80],[42,-75],[40,-75],[40,-80],[42,-80]], color: colors.green },
            // New York
            { coords: [[45,-79],[45,-73],[43,-73],[42,-74],[42,-79],[43,-79],[45,-79]], color: colors.purple },
            // Vermont
            { coords: [[45,-73],[45,-71.5],[43,-71.5],[43,-73],[45,-73]], color: colors.green },
            // New Hampshire
            { coords: [[45,-71.5],[45,-71],[43.5,-70.5],[43,-71],[43,-71.5],[45,-71.5]], color: colors.yellow },
            // Maine
            { coords: [[47,-71],[47,-67],[45,-67],[44,-69],[43.5,-70.5],[45,-71],[47,-71]], color: colors.purple },
            // Massachusetts
            { coords: [[42.8,-73.5],[42.8,-70],[41.5,-70],[41.5,-71],[42,-73.5],[42.8,-73.5]], color: colors.green },
            // Rhode Island
            { coords: [[42,-71.8],[42,-71.2],[41.3,-71.2],[41.3,-71.8],[42,-71.8]], color: colors.yellow },
            // Connecticut
            { coords: [[42.1,-73.7],[42.1,-72],[41,-72],[41,-73.7],[42.1,-73.7]], color: colors.yellow },
            // New Jersey
            { coords: [[41.4,-75],[41.4,-74],[40,-74],[39,-74.5],[39,-75],[40,-75],[41.4,-75]], color: colors.yellow },
            // Delaware
            { coords: [[39.8,-75.8],[39.8,-75.1],[38.5,-75.1],[38.5,-75.8],[39.8,-75.8]], color: colors.blue },
            // Maryland
            { coords: [[39.7,-79],[39.5,-76],[39,-76],[38,-76],[38.5,-76.5],[39,-78],[39.7,-79]], color: colors.pink }
        ];
    }
    
    init() {
        try {
            this.setupScene();
            this.createStars();
            this.createGlobe();
            this.createAtmosphere();
            this.createCountryMaps();
            this.bindEvents();
            this.animate();
        } catch (error) {
            console.error('Globe init error:', error);
        }
    }
    
    setupScene() {
        this.scene = new THREE.Scene();
        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 2000);
        this.camera.position.z = this.config.maxDistance;
        
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true, 
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.sortObjects = true;
        this.container.appendChild(this.renderer.domElement);
        
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.7));
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
        dirLight.position.set(5, 3, 5);
        this.scene.add(dirLight);
        
        this.globeGroup = new THREE.Group();
        this.scene.add(this.globeGroup);
        
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
    }
    
    createStars() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (!isDark) {
            this.createLightModeStars();
            return;
        }
        
        // Dark mode: 特殊星星效果
        const count = 1500;
        const starGroup = new THREE.Group();
        
        // 创建星星点
        const positions = [];
        const sizes = [];
        const starData = []; // 保存每颗星的信息用于光晕
        
        for (let i = 0; i < count; i++) {
            const r = 700 + Math.random() * 500;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta);
            const z = r * Math.cos(phi);
            
            positions.push(x, y, z);
            
            // 一半维持3px，一半随机1-6px
            let size;
            if (i < count / 2) {
                size = 3;
            } else {
                size = 1 + Math.random() * 5;
            }
            sizes.push(size);
            
            starData.push({ x, y, z, size });
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
        
        // 星星材质
        const starMaterial = new THREE.ShaderMaterial({
            uniforms: {},
            vertexShader: `
                attribute float size;
                varying float vSize;
                void main() {
                    vSize = size;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying float vSize;
                void main() {
                    float dist = length(gl_PointCoord - vec2(0.5));
                    if (dist > 0.5) discard;
                    float alpha = smoothstep(0.5, 0.0, dist);
                    gl_FragColor = vec4(1.0, 1.0, 0.98, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        const stars = new THREE.Points(geometry, starMaterial);
        stars.renderOrder = -100;
        starGroup.add(stars);
        
        // 给部分星星添加光晕 (约15%的星星)
        const glowColors = [0xd7e3ee, 0xf1e5e6];
        const glowCount = Math.floor(count * 0.15);
        
        for (let i = 0; i < glowCount; i++) {
            const idx = Math.floor(Math.random() * count);
            const star = starData[idx];
            const color = glowColors[Math.floor(Math.random() * 2)];
            const glowSize = star.size * 1.2;
            
            // 使用Sprite创建光晕
            const spriteMaterial = new THREE.SpriteMaterial({
                map: this.createGlowTexture(color),
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            
            const sprite = new THREE.Sprite(spriteMaterial);
            sprite.position.set(star.x, star.y, star.z);
            sprite.scale.set(glowSize * 8, glowSize * 8, 1);
            sprite.renderOrder = -99;
            starGroup.add(sprite);
        }
        
        this.stars = starGroup;
        this.scene.add(starGroup);
    }
    
    createGlowTexture(color) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        
        // 解析颜色
        const r = (color >> 16) & 255;
        const g = (color >> 8) & 255;
        const b = color & 255;
        
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.3)`);
        gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.1)`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
        
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }
    
    createLightModeStars() {
        const count = 400;
        const positions = [];
        
        for (let i = 0; i < count; i++) {
            const r = 700 + Math.random() * 500;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            positions.push(
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.sin(phi) * Math.sin(theta),
                r * Math.cos(phi)
            );
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            size: 1.5,
            color: 0xffffff,
            transparent: true,
            opacity: 0.4,
            sizeAttenuation: true
        });
        
        this.stars = new THREE.Points(geometry, material);
        this.stars.renderOrder = -100;
        this.scene.add(this.stars);
    }
    
    createGlobe() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        
        this.globe = new THREE.Mesh(
            new THREE.SphereGeometry(this.config.radius, this.config.segments, this.config.segments),
            new THREE.MeshPhongMaterial({ 
                color: isDark ? 0x1a1816 : 0xdedad5,
                transparent: false,
                shininess: 5
            })
        );
        this.globe.renderOrder = 0;
        this.globeGroup.add(this.globe);
        
        this.createGridLines(isDark);
    }
    
    createGridLines(isDark) {
        const mat = new THREE.LineBasicMaterial({ 
            color: isDark ? 0x2a2622 : 0xc5c0ba,
            transparent: true, 
            opacity: 0.25
        });
        
        for (let lat = -60; lat <= 60; lat += 30) {
            const pts = [];
            const phi = (90 - lat) * Math.PI / 180;
            for (let lng = 0; lng <= 360; lng += 3) {
                const theta = lng * Math.PI / 180;
                pts.push(new THREE.Vector3(
                    this.config.radius * Math.sin(phi) * Math.cos(theta),
                    this.config.radius * Math.cos(phi),
                    this.config.radius * Math.sin(phi) * Math.sin(theta)
                ));
            }
            const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat);
            line.renderOrder = 1;
            this.globeGroup.add(line);
        }
        
        for (let lng = 0; lng < 360; lng += 30) {
            const pts = [];
            const theta = lng * Math.PI / 180;
            for (let lat = -90; lat <= 90; lat += 3) {
                const phi = (90 - lat) * Math.PI / 180;
                pts.push(new THREE.Vector3(
                    this.config.radius * Math.sin(phi) * Math.cos(theta),
                    this.config.radius * Math.cos(phi),
                    this.config.radius * Math.sin(phi) * Math.sin(theta)
                ));
            }
            const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat);
            line.renderOrder = 1;
            this.globeGroup.add(line);
        }
    }
    
    createCountryMaps() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        
        // 绘制中国省份
        const chinaProvinces = this.getChinaProvinces();
        chinaProvinces.forEach(province => {
            this.drawFilledRegion(province.coords, province.color, isDark);
        });
        
        // 绘制美国州
        const usStates = this.getUSStates();
        usStates.forEach(state => {
            this.drawFilledRegion(state.coords, state.color, isDark);
        });
    }
    
    drawFilledRegion(coords, fillColor, isDark) {
        // 将坐标转换为3D点
        const points = coords.map(([lat, lng]) => 
            this.latLngToVector3(lat, lng, this.config.radius + 0.3)
        );
        
        // 绘制填充区域 (使用多个三角形)
        if (points.length >= 3) {
            const shape = new THREE.Shape();
            
            // 将3D点投影到2D进行形状创建
            const center = this.latLngToVector3(
                coords.reduce((s, c) => s + c[0], 0) / coords.length,
                coords.reduce((s, c) => s + c[1], 0) / coords.length,
                this.config.radius + 0.3
            );
            
            // 创建填充材质
            const adjustedColor = isDark ? this.darkenColor(fillColor, 0.3) : fillColor;
            const fillMaterial = new THREE.MeshBasicMaterial({
                color: adjustedColor,
                transparent: true,
                opacity: isDark ? 0.4 : 0.6,
                side: THREE.DoubleSide,
                depthWrite: false
            });
            
            // 使用简化的方法：创建多个小三角形来填充
            const geometry = new THREE.BufferGeometry();
            const vertices = [];
            
            for (let i = 1; i < points.length - 1; i++) {
                vertices.push(
                    points[0].x, points[0].y, points[0].z,
                    points[i].x, points[i].y, points[i].z,
                    points[i + 1].x, points[i + 1].y, points[i + 1].z
                );
            }
            
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            geometry.computeVertexNormals();
            
            const mesh = new THREE.Mesh(geometry, fillMaterial);
            mesh.renderOrder = 2;
            this.globeGroup.add(mesh);
        }
        
        // 绘制边框
        const borderColor = isDark ? 0x4a4642 : 0x888480;
        const borderMaterial = new THREE.LineBasicMaterial({
            color: borderColor,
            transparent: true,
            opacity: 0.7
        });
        
        const borderLine = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(points),
            borderMaterial
        );
        borderLine.renderOrder = 3;
        this.globeGroup.add(borderLine);
    }
    
    darkenColor(color, factor) {
        const r = Math.floor(((color >> 16) & 255) * factor);
        const g = Math.floor(((color >> 8) & 255) * factor);
        const b = Math.floor((color & 255) * factor);
        return (r << 16) | (g << 8) | b;
    }
    
    createAtmosphere() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        
        this.atmosphere = new THREE.Mesh(
            new THREE.SphereGeometry(this.config.radius * 1.08, this.config.segments, this.config.segments),
            new THREE.ShaderMaterial({
                vertexShader: `
                    varying vec3 vNormal;
                    void main() {
                        vNormal = normalize(normalMatrix * normal);
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    varying vec3 vNormal;
                    void main() {
                        float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                        gl_FragColor = vec4(${isDark ? '0.6, 0.4, 0.45' : '0.85, 0.65, 0.7'}, 1.0) * intensity * 0.3;
                    }
                `,
                blending: THREE.AdditiveBlending,
                side: THREE.BackSide,
                transparent: true,
                depthWrite: false
            })
        );
        this.atmosphere.renderOrder = -1;
        this.scene.add(this.atmosphere);
    }
    
    updateCities(cities) {
        this.cities = cities;
        
        this.markers.forEach(m => {
            if (m.group) this.globeGroup.remove(m.group);
        });
        this.markers = [];
        
        const citiesWithContent = cities.filter(city => 
            (city.photos?.length > 0) || (city.journals?.length > 0)
        );
        
        const markerPositions = [];
        citiesWithContent.forEach(city => {
            const basePos = this.latLngToVector3(city.lat, city.lng, this.config.radius);
            let offset = { lat: 0, lng: 0 };
            let attempts = 0;
            
            while (attempts < 10) {
                let overlapping = false;
                const testLat = city.lat + offset.lat;
                const testLng = city.lng + offset.lng;
                const testPos = this.latLngToVector3(testLat, testLng, this.config.radius);
                
                for (const existing of markerPositions) {
                    const distance = testPos.distanceTo(existing.pos);
                    if (distance < 12) {
                        overlapping = true;
                        break;
                    }
                }
                
                if (!overlapping) {
                    markerPositions.push({ 
                        pos: testPos, 
                        city,
                        lat: testLat,
                        lng: testLng
                    });
                    break;
                }
                
                const angle = attempts * Math.PI / 5;
                const offsetDist = 3 + attempts * 2;
                offset = {
                    lat: Math.sin(angle) * offsetDist * 0.05,
                    lng: Math.cos(angle) * offsetDist * 0.05
                };
                attempts++;
            }
            
            if (attempts >= 10) {
                markerPositions.push({ 
                    pos: basePos, 
                    city,
                    lat: city.lat,
                    lng: city.lng
                });
            }
        });
        
        markerPositions.forEach((data, index) => {
            this.createCityMarker(data.city, data.lat, data.lng, index);
        });
    }
    
    createCityMarker(city, lat, lng, index) {
        const group = new THREE.Group();
        const markerColor = new THREE.Color(city.color || '#E8B4B8');
        const size = this.config.markerSize;
        const zOffset = 2 + index * 0.3;
        
        // 1. 白色渐变光晕 - 1.2倍大小，中心0.5向外渐变到0
        const glowTexture = this.createMarkerGlowTexture();
        const glowMaterial = new THREE.SpriteMaterial({
            map: glowTexture,
            transparent: true,
            depthWrite: false
        });
        const glow = new THREE.Sprite(glowMaterial);
        glow.scale.set(size * 1.2 * 3, size * 1.2 * 3, 1);
        glow.renderOrder = 10 + index * 3;
        group.add(glow);
        
        // 2. 脉动环
        const ringGeometry = new THREE.RingGeometry(size * 0.85, size * 1.0, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: markerColor,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.renderOrder = 11 + index * 3;
        group.add(ring);
        
        // 3. 主标记
        const markerGeometry = new THREE.CircleGeometry(size * 0.6, 32);
        const markerMaterial = new THREE.MeshBasicMaterial({
            color: markerColor,
            transparent: true,
            opacity: 1,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.renderOrder = 12 + index * 3;
        group.add(marker);
        
        const markerPosition = this.latLngToVector3(lat, lng, this.config.radius + zOffset);
        group.position.copy(markerPosition);
        group.lookAt(markerPosition.clone().multiplyScalar(2));
        
        this.globeGroup.add(group);
        
        this.markers.push({ 
            group, 
            mesh: marker, 
            ring,
            glow,
            city, 
            pulsePhase: Math.random() * Math.PI * 2 
        });
    }
    
    createMarkerGlowTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
        
        return new THREE.CanvasTexture(canvas);
    }
    
    getCityCoordinates(country, cityName) {
        if (country === '中国') {
            return this.chinaCities[cityName] ? { lat: this.chinaCities[cityName][0], lng: this.chinaCities[cityName][1] } : null;
        }
        if (country === '美国') {
            return this.usCities[cityName] ? { lat: this.usCities[cityName][0], lng: this.usCities[cityName][1] } : null;
        }
        return null;
    }
    
    latLngToVector3(lat, lng, radius) {
        const phi = (90 - lat) * Math.PI / 180;
        const theta = (lng + 180) * Math.PI / 180;
        return new THREE.Vector3(
            -radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.cos(phi),
            radius * Math.sin(phi) * Math.sin(theta)
        );
    }
    
    focusOnCity(city, animate = true) {
        const y = -city.lng * Math.PI / 180 - Math.PI / 2;
        const x = city.lat * Math.PI / 180;
        if (animate) {
            this.targetRotation = { x, y };
        } else {
            this.currentRotation = this.targetRotation = { x, y };
            this.globeGroup.rotation.x = x;
            this.globeGroup.rotation.y = y;
        }
    }
    
    setHomeCity(city) { this.homeCity = city; if (city) this.focusOnCity(city, true); }
    goHome() { if (this.homeCity) this.focusOnCity(this.homeCity, true); }
    
    bindEvents() {
        this.container.addEventListener('mousedown', e => { 
            this.isDragging = true; 
            this.previousMousePosition = { x: e.clientX, y: e.clientY }; 
            this.momentum = { x: 0, y: 0 }; 
        });
        this.container.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.container.addEventListener('mouseup', () => this.isDragging = false);
        this.container.addEventListener('mouseleave', () => { 
            this.isDragging = false; 
            this.isHovering = false; 
            this.hoveredMarker = null; 
            this.container.style.cursor = 'grab'; 
            if (this.onCityHover) this.onCityHover(null); 
        });
        this.container.addEventListener('wheel', e => { 
            e.preventDefault(); 
            this.camera.position.z = Math.max(
                this.config.minDistance, 
                Math.min(this.config.maxDistance, this.camera.position.z + (e.deltaY > 0 ? 20 : -20))
            ); 
        }, { passive: false });
        
        this.container.addEventListener('touchstart', e => { 
            if (e.touches.length === 1) { 
                this.isDragging = true; 
                this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY }; 
            } 
        }, { passive: true });
        this.container.addEventListener('touchmove', e => { 
            if (this.isDragging && e.touches.length === 1) { 
                const dx = e.touches[0].clientX - this.previousMousePosition.x;
                const dy = e.touches[0].clientY - this.previousMousePosition.y;
                this.targetRotation.y += dx * 0.005;
                this.targetRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.targetRotation.x + dy * 0.005));
                this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY }; 
            } 
        }, { passive: true });
        this.container.addEventListener('touchend', () => this.isDragging = false);
        
        window.addEventListener('resize', () => { 
            const w = this.container.clientWidth || window.innerWidth;
            const h = this.container.clientHeight || window.innerHeight;
            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(w, h);
        });
        
        this.container.addEventListener('click', () => { 
            if (this.hoveredMarker && this.onCityClick) {
                this.onCityClick(this.hoveredMarker.city); 
            }
        });
    }
    
    onMouseMove(e) {
        const rect = this.container.getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        
        if (this.isDragging) {
            const dx = e.clientX - this.previousMousePosition.x;
            const dy = e.clientY - this.previousMousePosition.y;
            this.targetRotation.y += dx * 0.005;
            this.targetRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.targetRotation.x + dy * 0.005));
            this.momentum = { x: dy * 0.002, y: dx * 0.002 };
            this.previousMousePosition = { x: e.clientX, y: e.clientY };
        }
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const meshes = this.markers.map(m => m.mesh);
        const hits = this.raycaster.intersectObjects(meshes);
        
        if (hits.length > 0) {
            const m = this.markers.find(m => m.mesh === hits[0].object);
            if (m) {
                this.isHovering = true;
                if (m !== this.hoveredMarker) {
                    this.hoveredMarker = m;
                    this.container.style.cursor = 'pointer';
                    if (this.onCityHover) this.onCityHover(m.city, e);
                }
            }
        } else {
            this.isHovering = false;
            if (this.hoveredMarker) {
                this.hoveredMarker = null;
                this.container.style.cursor = 'grab';
                if (this.onCityHover) this.onCityHover(null);
            }
        }
    }
    
    updateTheme() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        
        if (this.globe) {
            this.globe.material.color.setHex(isDark ? 0x1a1816 : 0xdedad5);
        }
        
        // 重建星星
        if (this.stars) {
            if (this.stars.isGroup) {
                this.stars.children.forEach(child => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (child.material.map) child.material.map.dispose();
                        child.material.dispose();
                    }
                });
            } else {
                if (this.stars.geometry) this.stars.geometry.dispose();
                if (this.stars.material) this.stars.material.dispose();
            }
            this.scene.remove(this.stars);
        }
        this.createStars();
        
        this.updateCities(this.cities);
    }
    
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        if (!this.isDragging && !this.isHovering && this.config.autoRotate) {
            this.targetRotation.y += this.config.autoRotateSpeed;
        }
        
        if (!this.isDragging) {
            this.targetRotation.x += this.momentum.x;
            this.targetRotation.y += this.momentum.y;
            this.momentum.x *= 0.95;
            this.momentum.y *= 0.95;
        }
        
        this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * 0.08;
        this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * 0.08;
        this.globeGroup.rotation.x = this.currentRotation.x;
        this.globeGroup.rotation.y = this.currentRotation.y;
        
        const time = Date.now() * 0.001;
        this.markers.forEach(m => {
            if (m.ring) {
                const pulse = Math.sin(time * 2 + m.pulsePhase) * 0.3 + 0.7;
                m.ring.material.opacity = 0.4 * pulse;
                m.ring.scale.setScalar(1 + Math.sin(time * 2 + m.pulsePhase) * 0.15);
            }
        });
        
        this.renderer.render(this.scene, this.camera);
    }
}
