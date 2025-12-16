/**
 * Life29 - 3D 地球模块
 * 修复版本：清晰地图、无闪烁标记、明显星星
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
            markerSize: 6,
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
        
        this.init();
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
        
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(5, 3, 5);
        this.scene.add(dirLight);
        
        this.globeGroup = new THREE.Group();
        this.scene.add(this.globeGroup);
        
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
    }
    
    createStars() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const count = isDark ? 1500 : 500;
        
        const positions = [];
        const colors = [];
        
        for (let i = 0; i < count; i++) {
            const r = 800 + Math.random() * 400;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            positions.push(
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.sin(phi) * Math.sin(theta),
                r * Math.cos(phi)
            );
            
            // 星星颜色略微变化
            const brightness = 0.7 + Math.random() * 0.3;
            colors.push(brightness, brightness, brightness * 0.95);
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        
        // 使用Sprite材质让星星更明显
        const material = new THREE.PointsMaterial({
            size: isDark ? 3 : 1.5,
            vertexColors: true,
            transparent: true,
            opacity: isDark ? 1.0 : 0.5,
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
            opacity: 0.3
        });
        
        // 纬线
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
        
        // 经线
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
        
        // 中国整体轮廓
        const chinaOutline = [
            [53.5, 121], [52, 127], [48, 134], [46, 133], [43, 131], [40, 131],
            [42, 130], [43, 129], [42, 128], [41, 128], [40, 125], [40, 124],
            [39, 123], [39, 121], [40, 120], [40, 118], [39, 117], [38, 117],
            [37, 118], [36, 119], [35, 119], [34, 120], [32, 121], [31, 122],
            [30, 122], [28, 121], [27, 120], [25, 119], [24, 118], [23, 117],
            [22, 114], [22, 113], [21, 111], [21, 109], [20, 108], [18, 109],
            [18, 111], [21, 111], [21, 107], [22, 106], [23, 106], [22, 104],
            [22, 100], [21, 99], [23, 98], [24, 98], [26, 98], [28, 97],
            [28, 93], [27, 89], [28, 85], [28, 81], [30, 81], [32, 79],
            [34, 78], [35, 78], [37, 75], [37, 74], [39, 74], [41, 80],
            [45, 80], [46, 83], [47, 85], [47, 88], [45, 90], [46, 91],
            [48, 87], [49, 88], [49, 91], [51, 98], [53, 98], [53, 108],
            [53, 120], [53.5, 121]
        ];
        
        // 美国整体轮廓
        const usaOutline = [
            [49, -125], [49, -123], [48, -123], [48, -122], [49, -95], [49, -89],
            [47, -85], [46, -84], [46, -83], [43, -82], [42, -83], [41, -83],
            [42, -79], [43, -79], [44, -76], [45, -75], [45, -71], [44, -69],
            [44, -67], [47, -68], [47, -70], [45, -71], [45, -73], [42, -73],
            [41, -74], [40, -74], [39, -75], [38, -75], [37, -76], [35, -76],
            [35, -77], [34, -78], [33, -79], [32, -81], [30, -81], [29, -83],
            [30, -84], [30, -85], [30, -88], [29, -89], [29, -90], [30, -90],
            [29, -94], [28, -96], [26, -97], [26, -99], [28, -100], [29, -102],
            [31, -104], [32, -106], [31, -108], [31, -111], [32, -114], [33, -117],
            [34, -118], [34, -120], [36, -122], [37, -122], [38, -123], [40, -124],
            [42, -124], [43, -124], [46, -124], [48, -123], [49, -123], [49, -125]
        ];
        
        // 绘制国家轮廓
        this.drawCountryOutline(chinaOutline, isDark);
        this.drawCountryOutline(usaOutline, isDark);
        
        // 绘制省份/州边界
        this.drawProvinceBorders(isDark);
    }
    
    drawCountryOutline(coords, isDark) {
        const material = new THREE.LineBasicMaterial({
            color: isDark ? 0x5a5550 : 0x999590,
            transparent: true,
            opacity: 0.8,
            linewidth: 2
        });
        
        const points = coords.map(([lat, lng]) => 
            this.latLngToVector3(lat, lng, this.config.radius + 0.5)
        );
        
        const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material);
        line.renderOrder = 2;
        this.globeGroup.add(line);
    }
    
    drawProvinceBorders(isDark) {
        const borderColor = isDark ? 0x3a3632 : 0xb5b0aa;
        const material = new THREE.LineBasicMaterial({
            color: borderColor,
            transparent: true,
            opacity: 0.5
        });
        
        // 中国主要省份边界（简化但更准确）
        const chinaProvinces = [
            // 东北
            [[53, 121], [50, 125], [47, 130], [43, 131]],
            [[47, 130], [44, 125], [43, 122]],
            [[44, 125], [41, 123], [40, 120]],
            // 华北
            [[42, 118], [40, 117], [38, 114], [36, 114]],
            [[40, 114], [38, 111], [35, 111]],
            // 华东
            [[36, 117], [34, 117], [32, 119]],
            [[34, 117], [32, 115], [30, 117]],
            [[32, 119], [30, 120], [28, 121]],
            [[30, 117], [28, 118], [27, 119]],
            [[28, 118], [26, 115], [25, 117]],
            [[27, 119], [25, 117], [24, 118]],
            // 华中
            [[34, 111], [32, 114], [30, 112]],
            [[32, 114], [30, 116], [28, 114]],
            [[30, 112], [28, 110], [26, 112]],
            // 华南
            [[26, 112], [24, 109], [22, 110]],
            [[25, 117], [23, 114], [22, 113]],
            [[24, 109], [22, 106], [21, 108]],
            // 西南
            [[32, 104], [30, 106], [28, 104]],
            [[30, 106], [28, 109], [26, 106]],
            [[28, 104], [26, 100], [24, 102]],
            [[26, 106], [24, 104], [22, 106]],
            // 西北
            [[42, 97], [40, 100], [36, 104]],
            [[40, 100], [38, 103], [36, 106]],
            [[39, 107], [37, 106], [36, 104]],
            // 内蒙古
            [[50, 120], [47, 115], [43, 112], [40, 107]],
            // 新疆
            [[49, 88], [46, 85], [42, 80], [37, 76]],
            // 西藏
            [[36, 80], [32, 84], [28, 88], [28, 96]]
        ];
        
        chinaProvinces.forEach(coords => {
            const points = coords.map(([lat, lng]) => 
                this.latLngToVector3(lat, lng, this.config.radius + 0.3)
            );
            const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material);
            line.renderOrder = 2;
            this.globeGroup.add(line);
        });
        
        // 美国主要州边界
        const usStates = [
            // 西海岸
            [[49, -117], [42, -117]],
            [[42, -120], [42, -114]],
            [[42, -120], [39, -120], [35, -115]],
            // 山区
            [[49, -111], [45, -111], [41, -111], [37, -109]],
            [[45, -104], [41, -104], [37, -103]],
            [[41, -109], [41, -102]],
            [[37, -109], [37, -102]],
            // 中部
            [[49, -97], [43, -97], [40, -97], [37, -97]],
            [[49, -90], [43, -90], [37, -90]],
            [[43, -97], [43, -90]],
            [[40, -97], [40, -90]],
            // 南部
            [[37, -102], [37, -94], [34, -94]],
            [[36.5, -100], [34, -100], [34, -94]],
            [[34, -100], [30, -94], [30, -90]],
            [[30, -94], [26, -97]],
            // 东部
            [[42, -84], [39, -84], [36, -84]],
            [[42, -80], [39, -80], [36, -80]],
            [[42, -76], [40, -76], [38, -76]],
            [[45, -73], [42, -73], [41, -74]]
        ];
        
        usStates.forEach(coords => {
            const points = coords.map(([lat, lng]) => 
                this.latLngToVector3(lat, lng, this.config.radius + 0.3)
            );
            const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material);
            line.renderOrder = 2;
            this.globeGroup.add(line);
        });
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
        
        // 清除旧标记
        this.markers.forEach(m => {
            if (m.group) this.globeGroup.remove(m.group);
        });
        this.markers = [];
        
        // 过滤有内容的城市
        const citiesWithContent = cities.filter(city => 
            (city.photos?.length > 0) || (city.journals?.length > 0)
        );
        
        // 计算标记位置，避免重叠
        const markerPositions = [];
        citiesWithContent.forEach(city => {
            const basePos = this.latLngToVector3(city.lat, city.lng, this.config.radius);
            let offset = { x: 0, y: 0 };
            let attempts = 0;
            
            // 检查是否与其他标记重叠
            while (attempts < 10) {
                let overlapping = false;
                for (const existing of markerPositions) {
                    const testPos = basePos.clone().add(new THREE.Vector3(offset.x, offset.y, 0));
                    const distance = testPos.distanceTo(existing.pos);
                    if (distance < 15) {
                        overlapping = true;
                        break;
                    }
                }
                
                if (!overlapping) break;
                
                // 偏移位置
                const angle = attempts * Math.PI / 5;
                const offsetDist = 8 + attempts * 3;
                offset = {
                    x: Math.cos(angle) * offsetDist * 0.02,
                    y: Math.sin(angle) * offsetDist * 0.02
                };
                attempts++;
            }
            
            const finalLat = city.lat + offset.y;
            const finalLng = city.lng + offset.x;
            const finalPos = this.latLngToVector3(finalLat, finalLng, this.config.radius);
            
            markerPositions.push({ 
                pos: finalPos, 
                city,
                lat: finalLat,
                lng: finalLng
            });
        });
        
        // 创建标记
        markerPositions.forEach((data, index) => {
            this.createCityMarker(data.city, data.lat, data.lng, index);
        });
    }
    
    createCityMarker(city, lat, lng, index) {
        const group = new THREE.Group();
        const position = this.latLngToVector3(lat, lng, this.config.radius);
        const markerColor = new THREE.Color(city.color || '#E8B4B8');
        const size = this.config.markerSize;
        
        // 基础偏移，避免z-fighting
        const zOffset = 1 + index * 0.5;
        
        // 1. 外层光晕 (最底层) - 降低opacity
        const glowGeometry = new THREE.CircleGeometry(size * 1.8, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.15,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.renderOrder = 10 + index * 3;
        group.add(glow);
        
        // 2. 脉动环 (中间层)
        const ringGeometry = new THREE.RingGeometry(size * 0.9, size * 1.1, 32);
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
        
        // 3. 主标记 (最顶层)
        const markerGeometry = new THREE.CircleGeometry(size * 0.7, 32);
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
        
        // 定位
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
    
    setHomeCity(city) { 
        this.homeCity = city; 
        if (city) this.focusOnCity(city, true); 
    }
    
    goHome() { 
        if (this.homeCity) this.focusOnCity(this.homeCity, true); 
    }
    
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
        
        // 检查悬停
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
        
        // 更新地球颜色
        if (this.globe) {
            this.globe.material.color.setHex(isDark ? 0x1a1816 : 0xdedad5);
        }
        
        // 重建星星
        if (this.stars) {
            this.scene.remove(this.stars);
            this.stars.geometry.dispose();
            this.stars.material.dispose();
        }
        this.createStars();
        
        // 更新城市标记
        this.updateCities(this.cities);
    }
    
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        // 自动旋转（悬停时停止）
        if (!this.isDragging && !this.isHovering && this.config.autoRotate) {
            this.targetRotation.y += this.config.autoRotateSpeed;
        }
        
        // 惯性
        if (!this.isDragging) {
            this.targetRotation.x += this.momentum.x;
            this.targetRotation.y += this.momentum.y;
            this.momentum.x *= 0.95;
            this.momentum.y *= 0.95;
        }
        
        // 平滑旋转
        this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * 0.08;
        this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * 0.08;
        this.globeGroup.rotation.x = this.currentRotation.x;
        this.globeGroup.rotation.y = this.currentRotation.y;
        
        // 脉动动画
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
