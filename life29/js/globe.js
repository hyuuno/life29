/**
 * Life29 - 3D 地球模块
 * 中国省份和美国州地图
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
            markerSize: 2.2,
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
        
        // 中国城市坐标
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
        
        // 美国城市坐标
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
        
        this.chinaProvinces = this.getChinaProvinceData();
        this.usStates = this.getUSStateData();
        
        this.init();
    }
    
    getChinaProvinceData() {
        return {
            '黑龙江': [[53.5,121.5],[52,127],[48,135],[45,132],[43,131],[45,125],[47,120],[50,120],[53.5,121.5]],
            '吉林': [[46,122],[44,131],[43,129],[41,129],[41,126],[42,124],[43,122],[46,122]],
            '辽宁': [[43,119],[43,125],[41,125],[39,122],[39,120],[40,119],[43,119]],
            '内蒙古': [[53,120],[50,117],[47,120],[45,112],[42,115],[40,111],[38,107],[39,106],[42,97],[47,90],[49,88],[53,98],[53,120]],
            '新疆': [[49,87],[48,90],[47,96],[45,96],[42,96],[40,80],[37,79],[36,76],[35,79],[37,90],[40,96],[45,96],[49,87]],
            '西藏': [[36,79],[34,79],[32,79],[29,82],[28,86],[27,88],[28,92],[29,97],[32,99],[34,94],[36,84],[36,79]],
            '青海': [[39,96],[38,102],[36,103],[35,100],[33,98],[32,97],[34,90],[36,90],[39,96]],
            '甘肃': [[42,97],[40,104],[38,104],[36,106],[34,105],[33,104],[34,102],[36,100],[38,97],[42,97]],
            '宁夏': [[39,106],[39,107],[37,107],[36,106],[37,105],[39,106]],
            '陕西': [[39,107],[39,111],[36,111],[34,111],[32,109],[33,107],[35,106],[39,107]],
            '山西': [[40,111],[40,114],[38,114],[35,113],[35,111],[37,111],[40,111]],
            '河北': [[42,114],[42,119],[40,118],[39,117],[38,116],[36,115],[37,114],[40,114],[42,114]],
            '山东': [[38,115],[38,122],[36,122],[34,119],[35,116],[38,115]],
            '河南': [[36,111],[36,116],[34,116],[32,114],[32,111],[34,111],[36,111]],
            '江苏': [[35,117],[35,121],[32,122],[31,120],[32,117],[35,117]],
            '安徽': [[34,115],[34,119],[31,119],[30,116],[31,115],[34,115]],
            '浙江': [[31,118],[31,122],[28,122],[27,119],[28,118],[31,118]],
            '江西': [[30,114],[30,118],[27,118],[25,115],[26,114],[30,114]],
            '福建': [[28,117],[28,120],[24,120],[23,117],[25,117],[28,117]],
            '台湾': [[25,121],[25,122],[22,121],[22,120],[24,120],[25,121]],
            '湖北': [[33,109],[33,116],[30,116],[29,112],[30,109],[33,109]],
            '湖南': [[30,109],[30,114],[26,114],[25,110],[27,109],[30,109]],
            '广东': [[25,110],[25,117],[22,117],[21,110],[23,110],[25,110]],
            '广西': [[26,105],[26,112],[22,112],[21,106],[24,105],[26,105]],
            '海南': [[20,108],[20,111],[18,111],[18,109],[20,108]],
            '四川': [[34,98],[34,108],[30,108],[27,104],[27,98],[30,98],[34,98]],
            '贵州': [[29,104],[29,109],[25,109],[24,106],[26,104],[29,104]],
            '云南': [[29,98],[29,106],[24,106],[21,100],[23,98],[29,98]],
            '北京': [[40.5,115.5],[40.5,117.5],[39.5,117.5],[39.5,115.5],[40.5,115.5]],
            '天津': [[40,116.8],[40,118],[38.8,118],[38.8,116.8],[40,116.8]],
            '上海': [[31.8,120.8],[31.8,122],[30.7,122],[30.7,120.8],[31.8,120.8]],
            '重庆': [[32,105],[32,110],[28,110],[28,106],[30,105],[32,105]],
            '香港': [[22.6,113.8],[22.6,114.5],[22.1,114.5],[22.1,113.8],[22.6,113.8]],
            '澳门': [[22.3,113.4],[22.3,113.7],[22.0,113.7],[22.0,113.4],[22.3,113.4]]
        };
    }
    
    getUSStateData() {
        return {
            'Washington': [[49,-124.7],[49,-117],[46,-117],[46,-124],[49,-124.7]],
            'Oregon': [[46,-124.5],[46,-117],[42,-117],[42,-124.5],[46,-124.5]],
            'California': [[42,-124.4],[42,-120],[39,-120],[35,-115],[33,-117],[32.5,-117],[33,-120],[35,-121],[37,-122],[40,-124.4],[42,-124.4]],
            'Nevada': [[42,-120],[42,-114],[35,-114],[36,-117],[39,-120],[42,-120]],
            'Idaho': [[49,-117],[49,-111],[44,-111],[42,-114],[42,-117],[46,-117],[49,-117]],
            'Montana': [[49,-116],[49,-104],[45,-104],[45,-111],[46,-117],[49,-116]],
            'Wyoming': [[45,-111],[45,-104],[41,-104],[41,-111],[45,-111]],
            'Utah': [[42,-114],[42,-109],[37,-109],[37,-114],[42,-114]],
            'Colorado': [[41,-109],[41,-102],[37,-102],[37,-109],[41,-109]],
            'Arizona': [[37,-114],[37,-109],[31.3,-109],[32,-114],[37,-114]],
            'New Mexico': [[37,-109],[37,-103],[32,-103],[31.8,-109],[37,-109]],
            'North Dakota': [[49,-104],[49,-97],[46,-97],[46,-104],[49,-104]],
            'South Dakota': [[46,-104],[46,-97],[43,-97],[43,-104],[46,-104]],
            'Nebraska': [[43,-104],[43,-97],[40,-97],[40,-104],[43,-104]],
            'Kansas': [[40,-102],[40,-95],[37,-95],[37,-102],[40,-102]],
            'Oklahoma': [[37,-103],[37,-95],[34,-95],[34,-100],[36.5,-100],[36.5,-103],[37,-103]],
            'Texas': [[36.5,-103],[36.5,-100],[34,-100],[34,-95],[30,-94],[26,-97],[26,-99],[29,-101],[32,-106],[36.5,-103]],
            'Minnesota': [[49,-97],[49,-90],[44,-90],[43,-97],[49,-97]],
            'Iowa': [[43.5,-96],[43.5,-90],[40.5,-90],[40.5,-96],[43.5,-96]],
            'Missouri': [[40.5,-96],[40.5,-89],[36,-89],[36,-96],[40.5,-96]],
            'Arkansas': [[36.5,-94],[36.5,-89.5],[33,-89.5],[33,-94.5],[36.5,-94]],
            'Louisiana': [[33,-94],[33,-89],[29,-89],[29,-94],[33,-94]],
            'Wisconsin': [[47,-92],[47,-87],[42.5,-87],[42.5,-92],[47,-92]],
            'Illinois': [[42.5,-91],[42.5,-87.5],[37,-87.5],[37,-91.5],[42.5,-91]],
            'Michigan': [[46,-90],[46,-83],[42,-83],[42,-87],[44,-87],[46,-90]],
            'Indiana': [[41.8,-88],[41.8,-84.8],[38,-84.8],[38,-88],[41.8,-88]],
            'Ohio': [[42,-84.8],[42,-80.5],[38.5,-80.5],[38.5,-84.8],[42,-84.8]],
            'Kentucky': [[39,-89],[39,-82],[36.5,-82],[36.5,-89],[39,-89]],
            'Tennessee': [[36.7,-90],[36.7,-82],[35,-82],[35,-90],[36.7,-90]],
            'Mississippi': [[35,-91],[35,-88],[30.5,-88],[30.5,-91],[35,-91]],
            'Alabama': [[35,-88.5],[35,-85],[30.5,-85],[30.5,-88.5],[35,-88.5]],
            'Georgia': [[35,-85.5],[35,-81],[31,-81],[30.5,-85],[35,-85.5]],
            'Florida': [[31,-87.5],[31,-80],[25,-80],[25,-81.5],[27,-83],[30,-85],[31,-87.5]],
            'South Carolina': [[35,-83],[35,-79],[32,-79],[32,-81],[33.5,-83],[35,-83]],
            'North Carolina': [[36.5,-84],[36.5,-75.5],[34,-76.5],[34,-84],[36.5,-84]],
            'Virginia': [[39.5,-83.5],[39.5,-75.5],[36.5,-75.5],[36.5,-83.5],[39.5,-83.5]],
            'West Virginia': [[40.5,-82.5],[40.5,-77.7],[37.2,-77.7],[37.2,-82.5],[40.5,-82.5]],
            'Pennsylvania': [[42,-80.5],[42,-75],[39.7,-75],[39.7,-80.5],[42,-80.5]],
            'New York': [[45,-79.8],[45,-73],[41,-73],[41,-74.5],[42,-79.8],[45,-79.8]],
            'Vermont': [[45,-73.3],[45,-71.5],[42.7,-71.5],[42.7,-73.3],[45,-73.3]],
            'New Hampshire': [[45,-71.5],[45,-70.7],[42.7,-70.7],[42.7,-71.5],[45,-71.5]],
            'Maine': [[47.5,-70.7],[47.5,-67],[43.5,-67],[43.5,-71],[47.5,-70.7]],
            'Massachusetts': [[42.9,-73.5],[42.9,-70],[41.2,-70],[41.2,-73.5],[42.9,-73.5]],
            'Rhode Island': [[42,-71.8],[42,-71.1],[41.1,-71.1],[41.1,-71.8],[42,-71.8]],
            'Connecticut': [[42.1,-73.7],[42.1,-72],[41,-72],[41,-73.7],[42.1,-73.7]],
            'New Jersey': [[41.4,-75.5],[41.4,-74],[38.9,-74],[38.9,-75.5],[41.4,-75.5]],
            'Delaware': [[39.8,-75.8],[39.8,-75],[38.4,-75],[38.4,-75.8],[39.8,-75.8]],
            'Maryland': [[39.7,-79.5],[39.7,-75],[38,-75],[38,-76.5],[39,-79.5],[39.7,-79.5]]
        };
    }
    
    init() {
        try {
            this.setupScene();
            this.createGlobe();
            this.createAtmosphere();
            this.createStars();
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
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000000, 0);
        this.container.appendChild(this.renderer.domElement);
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
        dirLight.position.set(5, 3, 5);
        this.scene.add(dirLight);
        this.globeGroup = new THREE.Group();
        this.scene.add(this.globeGroup);
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
    }
    
    createGlobe() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        this.globe = new THREE.Mesh(
            new THREE.SphereGeometry(this.config.radius, this.config.segments, this.config.segments),
            new THREE.MeshPhongMaterial({ color: isDark ? 0x12100e : 0xddd8d0, transparent: true, opacity: 0.95, shininess: 3 })
        );
        this.globeGroup.add(this.globe);
        this.createGridLines(isDark);
    }
    
    createGridLines(isDark) {
        const mat = new THREE.LineBasicMaterial({ color: isDark ? 0x252220 : 0xccc8c4, transparent: true, opacity: 0.12 });
        for (let lat = -60; lat <= 60; lat += 30) {
            const pts = [];
            const phi = (90 - lat) * Math.PI / 180;
            for (let lng = 0; lng <= 360; lng += 5) {
                const theta = lng * Math.PI / 180;
                pts.push(new THREE.Vector3(this.config.radius * Math.sin(phi) * Math.cos(theta), this.config.radius * Math.cos(phi), this.config.radius * Math.sin(phi) * Math.sin(theta)));
            }
            this.globeGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));
        }
        for (let lng = 0; lng < 360; lng += 30) {
            const pts = [];
            const theta = lng * Math.PI / 180;
            for (let lat = -90; lat <= 90; lat += 5) {
                const phi = (90 - lat) * Math.PI / 180;
                pts.push(new THREE.Vector3(this.config.radius * Math.sin(phi) * Math.cos(theta), this.config.radius * Math.cos(phi), this.config.radius * Math.sin(phi) * Math.sin(theta)));
            }
            this.globeGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));
        }
    }
    
    createCountryMaps() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const color = isDark ? 0x454038 : 0xaaa69e;
        Object.values(this.chinaProvinces).forEach(c => this.drawBorder(c, color, 0.4));
        Object.values(this.usStates).forEach(c => this.drawBorder(c, color, 0.4));
    }
    
    drawBorder(coords, color, opacity) {
        const pts = coords.map(([lat, lng]) => this.latLngToVector3(lat, lng, this.config.radius + 0.2));
        this.globeGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color, transparent: true, opacity })));
    }
    
    createAtmosphere() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        this.atmosphere = new THREE.Mesh(
            new THREE.SphereGeometry(this.config.radius * 1.08, this.config.segments, this.config.segments),
            new THREE.ShaderMaterial({
                vertexShader: `varying vec3 vNormal; void main() { vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
                fragmentShader: `varying vec3 vNormal; void main() { float i = pow(0.55 - dot(vNormal, vec3(0,0,1)), 2.0); gl_FragColor = vec4(${isDark ? '0.55,0.35,0.4' : '0.8,0.6,0.65'}, 1.0) * i * 0.25; }`,
                blending: THREE.AdditiveBlending, side: THREE.BackSide, transparent: true
            })
        );
        this.scene.add(this.atmosphere);
    }
    
    createStars() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const count = isDark ? 600 : 400;
        const baseSize = isDark ? 2 : 0.3;
        const sizeRange = isDark ? 4 : 2.5;
        const positions = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            const r = 550 + Math.random() * 450;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);
            sizes[i] = baseSize + Math.random() * sizeRange;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        this.stars = new THREE.Points(geo, new THREE.ShaderMaterial({
            uniforms: { opacity: { value: isDark ? 0.9 : 0.35 } },
            vertexShader: `attribute float size; void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = size * (250.0 / -mv.z); gl_Position = projectionMatrix * mv; }`,
            fragmentShader: `uniform float opacity; void main() { float d = length(gl_PointCoord - vec2(0.5)); if (d > 0.5) discard; gl_FragColor = vec4(1.0, 1.0, 1.0, smoothstep(0.5, 0.0, d) * opacity); }`,
            transparent: true, blending: THREE.AdditiveBlending
        }));
        this.scene.add(this.stars);
    }
    
    updateCities(cities) {
        this.cities = cities;
        this.markers.forEach(m => { if (m.mesh) this.globeGroup.remove(m.mesh); if (m.ring) this.globeGroup.remove(m.ring); if (m.glow) this.globeGroup.remove(m.glow); });
        this.markers = [];
        const positions = [];
        cities.forEach(city => {
            if (!(city.photos?.length > 0 || city.journals?.length > 0)) return;
            const pos = this.latLngToVector3(city.lat, city.lng, this.config.radius);
            let scale = 1;
            for (const p of positions) { const d = pos.distanceTo(p.pos); if (d < 15) scale = Math.min(scale, 0.55); else if (d < 25) scale = Math.min(scale, 0.75); }
            positions.push({ pos, city, scale });
        });
        positions.forEach(({ city, scale }) => this.createCityMarker(city, scale));
    }
    
    createCityMarker(city, scale = 1) {
        const pos = this.latLngToVector3(city.lat, city.lng, this.config.radius);
        const col = new THREE.Color(city.color || '#E8B4B8');
        const size = this.config.markerSize * scale;
        
        // 白色渐变光晕
        const glow = new THREE.Mesh(new THREE.CircleGeometry(size + 1.5, 32), new THREE.ShaderMaterial({
            uniforms: { color: { value: new THREE.Color(0xffffff) } },
            vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
            fragmentShader: `uniform vec3 color; varying vec2 vUv; void main() { float d = length(vUv - vec2(0.5)) * 2.0; float a = smoothstep(1.0, 0.5, d) * 0.5; gl_FragColor = vec4(color, a); }`,
            transparent: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending
        }));
        glow.position.copy(pos); glow.lookAt(pos.clone().multiplyScalar(2)); this.globeGroup.add(glow);
        
        // 主标记
        const marker = new THREE.Mesh(new THREE.CircleGeometry(size, 16), new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide, transparent: true, opacity: 0.95 }));
        marker.position.copy(pos); marker.lookAt(pos.clone().multiplyScalar(2)); this.globeGroup.add(marker);
        
        // 脉动环
        const ring = new THREE.Mesh(new THREE.RingGeometry(size * 1.4, size * 1.7, 32), new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide, transparent: true, opacity: 0.25 }));
        ring.position.copy(pos); ring.lookAt(pos.clone().multiplyScalar(2)); this.globeGroup.add(ring);
        
        this.markers.push({ mesh: marker, ring, glow, city, pulsePhase: Math.random() * Math.PI * 2 });
    }
    
    getCityCoordinates(country, cityName) {
        if (country === '中国') return this.chinaCities[cityName] ? { lat: this.chinaCities[cityName][0], lng: this.chinaCities[cityName][1] } : null;
        if (country === '美国') return this.usCities[cityName] ? { lat: this.usCities[cityName][0], lng: this.usCities[cityName][1] } : null;
        return null;
    }
    
    latLngToVector3(lat, lng, radius) {
        const phi = (90 - lat) * Math.PI / 180, theta = (lng + 180) * Math.PI / 180;
        return new THREE.Vector3(-radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta));
    }
    
    focusOnCity(city, animate = true) {
        const y = -city.lng * Math.PI / 180 - Math.PI / 2, x = city.lat * Math.PI / 180;
        if (animate) this.targetRotation = { x, y };
        else { this.currentRotation = this.targetRotation = { x, y }; this.globeGroup.rotation.x = x; this.globeGroup.rotation.y = y; }
    }
    
    setHomeCity(city) { this.homeCity = city; if (city) this.focusOnCity(city, true); }
    goHome() { if (this.homeCity) this.focusOnCity(this.homeCity, true); }
    
    bindEvents() {
        this.container.addEventListener('mousedown', e => { this.isDragging = true; this.previousMousePosition = { x: e.clientX, y: e.clientY }; this.momentum = { x: 0, y: 0 }; });
        this.container.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.container.addEventListener('mouseup', () => this.isDragging = false);
        this.container.addEventListener('mouseleave', () => { this.isDragging = false; this.isHovering = false; this.hoveredMarker = null; this.container.style.cursor = 'grab'; if (this.onCityHover) this.onCityHover(null); });
        this.container.addEventListener('wheel', e => { e.preventDefault(); this.camera.position.z = Math.max(this.config.minDistance, Math.min(this.config.maxDistance, this.camera.position.z + (e.deltaY > 0 ? 20 : -20))); }, { passive: false });
        this.container.addEventListener('touchstart', e => { if (e.touches.length === 1) { this.isDragging = true; this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY }; } }, { passive: true });
        this.container.addEventListener('touchmove', e => { if (this.isDragging && e.touches.length === 1) { const dx = e.touches[0].clientX - this.previousMousePosition.x, dy = e.touches[0].clientY - this.previousMousePosition.y; this.targetRotation.y += dx * 0.005; this.targetRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.targetRotation.x + dy * 0.005)); this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY }; } }, { passive: true });
        this.container.addEventListener('touchend', () => this.isDragging = false);
        window.addEventListener('resize', () => { const w = this.container.clientWidth || window.innerWidth, h = this.container.clientHeight || window.innerHeight; this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); this.renderer.setSize(w, h); });
        this.container.addEventListener('click', () => { if (this.hoveredMarker && this.onCityClick) this.onCityClick(this.hoveredMarker.city); });
    }
    
    onMouseMove(e) {
        const rect = this.container.getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        if (this.isDragging) {
            const dx = e.clientX - this.previousMousePosition.x, dy = e.clientY - this.previousMousePosition.y;
            this.targetRotation.y += dx * 0.005;
            this.targetRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.targetRotation.x + dy * 0.005));
            this.momentum = { x: dy * 0.002, y: dx * 0.002 };
            this.previousMousePosition = { x: e.clientX, y: e.clientY };
        }
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const hits = this.raycaster.intersectObjects(this.markers.map(m => m.mesh));
        if (hits.length > 0) {
            const m = this.markers.find(m => m.mesh === hits[0].object);
            if (m) { this.isHovering = true; if (m !== this.hoveredMarker) { this.hoveredMarker = m; this.container.style.cursor = 'pointer'; if (this.onCityHover) this.onCityHover(m.city, e); } }
        } else { this.isHovering = false; if (this.hoveredMarker) { this.hoveredMarker = null; this.container.style.cursor = 'grab'; if (this.onCityHover) this.onCityHover(null); } }
    }
    
    updateTheme() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (this.globe) this.globe.material.color.setHex(isDark ? 0x12100e : 0xddd8d0);
        if (this.stars) { this.scene.remove(this.stars); this.stars.geometry.dispose(); this.stars.material.dispose(); }
        this.createStars();
        this.updateCities(this.cities);
    }
    
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        if (!this.isDragging && !this.isHovering && this.config.autoRotate) this.targetRotation.y += this.config.autoRotateSpeed;
        if (!this.isDragging) { this.targetRotation.x += this.momentum.x; this.targetRotation.y += this.momentum.y; this.momentum.x *= 0.95; this.momentum.y *= 0.95; }
        this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * 0.08;
        this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * 0.08;
        this.globeGroup.rotation.x = this.currentRotation.x;
        this.globeGroup.rotation.y = this.currentRotation.y;
        const t = Date.now() * 0.001;
        this.markers.forEach(m => { if (m.ring) { const p = Math.sin(t * 2 + m.pulsePhase) * 0.3 + 0.7; m.ring.material.opacity = 0.25 * p; m.ring.scale.setScalar(1 + Math.sin(t * 2 + m.pulsePhase) * 0.12); } });
        this.renderer.render(this.scene, this.camera);
    }
}
