/**
 * Life29 - 3D 地球模块
 * 保留所有原始细节 + GeoJSON国家轮廓线
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
        
        this.init();
    }
    
    init() {
        try {
            this.setupScene();
            this.createGlobe();
            this.createAtmosphere();
            this.createStars();
            this.loadGeoJSONCountries(); // 新增：加载真实GeoJSON轮廓
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
        // 默认最小缩放（最远距离）
        this.camera.position.z = this.config.maxDistance;
        
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000000, 0);
        this.container.appendChild(this.renderer.domElement);
        
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
        directionalLight.position.set(5, 3, 5);
        this.scene.add(directionalLight);
        
        this.globeGroup = new THREE.Group();
        this.scene.add(this.globeGroup);
        
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
    }
    
    createGlobe() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        
        const globeGeometry = new THREE.SphereGeometry(this.config.radius, this.config.segments, this.config.segments);
        const globeMaterial = new THREE.MeshPhongMaterial({
            color: isDark ? 0x12100e : 0xddd8d0,
            transparent: true,
            opacity: 0.95,
            shininess: 3
        });
        this.globe = new THREE.Mesh(globeGeometry, globeMaterial);
        this.globeGroup.add(this.globe);
        
        this.createGridLines(isDark);
    }
    
    createGridLines(isDark) {
        const gridColor = isDark ? 0x252220 : 0xccc8c4;
        const gridMaterial = new THREE.LineBasicMaterial({
            color: gridColor,
            transparent: true,
            opacity: 0.12
        });
        
        // 纬线
        for (let lat = -60; lat <= 60; lat += 30) {
            const points = [];
            const phi = (90 - lat) * (Math.PI / 180);
            for (let lng = 0; lng <= 360; lng += 5) {
                const theta = lng * (Math.PI / 180);
                points.push(new THREE.Vector3(
                    this.config.radius * Math.sin(phi) * Math.cos(theta),
                    this.config.radius * Math.cos(phi),
                    this.config.radius * Math.sin(phi) * Math.sin(theta)
                ));
            }
            this.globeGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), gridMaterial));
        }
        
        // 经线
        for (let lng = 0; lng < 360; lng += 30) {
            const points = [];
            const theta = lng * (Math.PI / 180);
            for (let lat = -90; lat <= 90; lat += 5) {
                const phi = (90 - lat) * (Math.PI / 180);
                points.push(new THREE.Vector3(
                    this.config.radius * Math.sin(phi) * Math.cos(theta),
                    this.config.radius * Math.cos(phi),
                    this.config.radius * Math.sin(phi) * Math.sin(theta)
                ));
            }
            this.globeGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), gridMaterial));
        }
    }
    
    // 新增：从GeoJSON加载国家轮廓
    loadGeoJSONCountries() {
        const geoJsonUrl = 'https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson';
        
        fetch(geoJsonUrl)
            .then(res => res.json())
            .then(data => {
                const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
                // 只显示中国和美国
                const targetCountries = ['CHN', 'USA'];
                const filtered = data.features.filter(f => 
                    targetCountries.includes(f.properties.ISO_A3)
                );
                
                filtered.forEach(feature => {
                    this.drawGeoJSONFeature(feature, isDark);
                });
            })
            .catch(err => {
                console.warn('GeoJSON加载失败，使用备用轮廓:', err);
                this.createFallbackOutlines();
            });
    }
    
    // 绘制GeoJSON要素
    drawGeoJSONFeature(feature, isDark) {
        const borderColor = isDark ? 0x5a5550 : 0x9a968e;
        const material = new THREE.LineBasicMaterial({
            color: borderColor,
            transparent: true,
            opacity: 0.5
        });
        
        const geometry = feature.geometry;
        
        if (geometry.type === 'Polygon') {
            this.drawPolygon(geometry.coordinates, material);
        } else if (geometry.type === 'MultiPolygon') {
            geometry.coordinates.forEach(polygon => {
                this.drawPolygon(polygon, material);
            });
        }
    }
    
    // 绘制多边形轮廓
    drawPolygon(coordinates, material) {
        coordinates.forEach(ring => {
            const points = [];
            ring.forEach(coord => {
                const lng = coord[0];
                const lat = coord[1];
                const point = this.latLngToVector3(lat, lng, this.config.radius + 0.3);
                points.push(point);
            });
            
            if (points.length > 2) {
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const line = new THREE.Line(geometry, material);
                this.globeGroup.add(line);
            }
        });
    }
    
    // 备用轮廓（GeoJSON加载失败时）
    createFallbackOutlines() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const outlineColor = isDark ? 0x3a3530 : 0xb8b4b0;
        
        // 中国轮廓
        const chinaOutline = [
            [53.5, 121], [49, 87.5], [46, 82], [40, 74], [35, 78], [31, 79],
            [28, 84], [27, 88], [28, 97], [22, 99], [22, 106], [18, 108],
            [18, 110], [21, 111], [22, 114], [23, 117], [25, 119], [27, 121],
            [31, 122], [32, 121], [35, 119], [37, 122], [39, 118], [40, 120],
            [41, 124], [43, 130], [45, 131], [48, 135], [53.5, 121]
        ];
        this.drawOutline(chinaOutline, outlineColor, 0.25);
        
        // 美国本土轮廓
        const usOutline = [
            [49, -123], [49, -95], [49, -67], [45, -67], [41, -70], [35, -75],
            [30, -81], [25, -80], [25, -97], [29, -95], [26, -97], [26, -99],
            [32, -106], [32, -114], [34, -120], [40, -124], [46, -124], [49, -123]
        ];
        this.drawOutline(usOutline, outlineColor, 0.25);
    }
    
    drawOutline(coords, color, opacity) {
        const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
        const points = coords.map(([lat, lng]) => this.latLngToVector3(lat, lng, this.config.radius + 0.3));
        this.globeGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material));
    }
    
    createAtmosphere() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        
        const atmosphereGeometry = new THREE.SphereGeometry(this.config.radius * 1.08, this.config.segments, this.config.segments);
        const atmosphereMaterial = new THREE.ShaderMaterial({
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
                    float intensity = pow(0.55 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                    gl_FragColor = vec4(${isDark ? '0.55, 0.35, 0.4' : '0.8, 0.6, 0.65'}, 1.0) * intensity * 0.25;
                }
            `,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
            transparent: true
        });
        
        this.atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        this.scene.add(this.atmosphere);
    }
    
    createStars() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        // Dark mode: 更多更大的星星
        const starCount = isDark ? 2500 : 400;
        const baseSize = isDark ? 0.5 : 0.3;
        const sizeRange = isDark ? 3.0 : 2.0;
        
        const positions = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);
        
        for (let i = 0; i < starCount; i++) {
            const radius = 550 + Math.random() * 450;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);
            sizes[i] = baseSize + Math.random() * sizeRange;
        }
        
        const starGeometry = new THREE.BufferGeometry();
        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const starMaterial = new THREE.ShaderMaterial({
            uniforms: { opacity: { value: isDark ? 0.85 : 0.35 } },
            vertexShader: `
                attribute float size;
                void main() {
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * (250.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform float opacity;
                void main() {
                    float dist = length(gl_PointCoord - vec2(0.5));
                    if (dist > 0.5) discard;
                    float alpha = smoothstep(0.5, 0.0, dist) * opacity;
                    gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending
        });
        
        this.stars = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(this.stars);
    }
    
    updateCities(cities) {
        this.cities = cities;
        this.markers.forEach(m => {
            if (m.mesh) this.globeGroup.remove(m.mesh);
            if (m.ring) this.globeGroup.remove(m.ring);
            if (m.glow) this.globeGroup.remove(m.glow);
        });
        this.markers = [];
        
        // 计算标记位置，检测重叠并调整大小
        const markerPositions = [];
        cities.forEach(city => {
            const hasContent = (city.photos?.length > 0) || (city.journals?.length > 0);
            if (!hasContent) return;
            
            const pos = this.latLngToVector3(city.lat, city.lng, this.config.radius);
            let scale = 1;
            
            // 检查与其他标记的距离
            for (const existingPos of markerPositions) {
                const distance = pos.distanceTo(existingPos.pos);
                if (distance < 15) {
                    scale = Math.min(scale, 0.6);
                } else if (distance < 25) {
                    scale = Math.min(scale, 0.8);
                }
            }
            
            markerPositions.push({ pos, city, scale });
        });
        
        markerPositions.forEach(({ city, scale }) => this.createCityMarker(city, scale));
    }
    
    createCityMarker(city, scale = 1) {
        const position = this.latLngToVector3(city.lat, city.lng, this.config.radius);
        const markerColor = new THREE.Color(city.color || '#E8B4B8');
        const size = this.config.markerSize * scale;
        
        // 白色渐变光晕（1.5px向外变透明）
        const glowGeometry = new THREE.CircleGeometry(size + 1.5, 32);
        const glowMaterial = new THREE.ShaderMaterial({
            uniforms: {
                color: { value: new THREE.Color(0xffffff) }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 color;
                varying vec2 vUv;
                void main() {
                    float dist = length(vUv - vec2(0.5)) * 2.0;
                    float alpha = smoothstep(1.0, 0.6, dist) * 0.6;
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.copy(position);
        glow.lookAt(position.clone().multiplyScalar(2));
        this.globeGroup.add(glow);
        
        // 主标记点
        const marker = new THREE.Mesh(
            new THREE.CircleGeometry(size, 16),
            new THREE.MeshBasicMaterial({ color: markerColor, side: THREE.DoubleSide, transparent: true, opacity: 0.95 })
        );
        marker.position.copy(position);
        marker.lookAt(position.clone().multiplyScalar(2));
        this.globeGroup.add(marker);
        
        // 脉动环
        const ring = new THREE.Mesh(
            new THREE.RingGeometry(size * 1.4, size * 1.7, 32),
            new THREE.MeshBasicMaterial({ color: markerColor, side: THREE.DoubleSide, transparent: true, opacity: 0.25 })
        );
        ring.position.copy(position);
        ring.lookAt(position.clone().multiplyScalar(2));
        this.globeGroup.add(ring);
        
        this.markers.push({ mesh: marker, ring, glow, city, pulsePhase: Math.random() * Math.PI * 2 });
    }
    
    getCityCoordinates(country, cityName) {
        if (country === '中国') {
            return this.chinaCities[cityName] ? { lat: this.chinaCities[cityName][0], lng: this.chinaCities[cityName][1] } : null;
        } else if (country === '美国') {
            return this.usCities[cityName] ? { lat: this.usCities[cityName][0], lng: this.usCities[cityName][1] } : null;
        }
        return null;
    }
    
    latLngToVector3(lat, lng, radius) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lng + 180) * (Math.PI / 180);
        return new THREE.Vector3(
            -radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.cos(phi),
            radius * Math.sin(phi) * Math.sin(theta)
        );
    }
    
    focusOnCity(city, animate = true) {
        const targetY = -city.lng * (Math.PI / 180) - Math.PI / 2;
        const targetX = city.lat * (Math.PI / 180);
        if (animate) {
            this.targetRotation = { x: targetX, y: targetY };
        } else {
            this.currentRotation = this.targetRotation = { x: targetX, y: targetY };
            this.globeGroup.rotation.x = targetX;
            this.globeGroup.rotation.y = targetY;
        }
    }
    
    setHomeCity(city) { this.homeCity = city; if (city) this.focusOnCity(city, true); }
    goHome() { if (this.homeCity) this.focusOnCity(this.homeCity, true); }
    
    bindEvents() {
        this.container.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.container.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.container.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.container.addEventListener('mouseleave', this.onMouseLeave.bind(this));
        this.container.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
        this.container.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: true });
        this.container.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: true });
        this.container.addEventListener('touchend', () => { this.isDragging = false; });
        window.addEventListener('resize', this.onResize.bind(this));
        this.container.addEventListener('click', this.onClick.bind(this));
    }
    
    onMouseDown(e) { this.isDragging = true; this.previousMousePosition = { x: e.clientX, y: e.clientY }; this.momentum = { x: 0, y: 0 }; }
    
    onMouseMove(e) {
        const rect = this.container.getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        
        if (this.isDragging) {
            const deltaX = e.clientX - this.previousMousePosition.x;
            const deltaY = e.clientY - this.previousMousePosition.y;
            this.targetRotation.y += deltaX * 0.005;
            this.targetRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.targetRotation.x + deltaY * 0.005));
            this.momentum = { x: deltaY * 0.002, y: deltaX * 0.002 };
            this.previousMousePosition = { x: e.clientX, y: e.clientY };
        }
        this.checkHover(e);
    }
    
    onMouseUp() { this.isDragging = false; }
    onMouseLeave() { this.isDragging = false; this.isHovering = false; this.hoveredMarker = null; this.container.style.cursor = 'grab'; if (this.onCityHover) this.onCityHover(null); }
    
    onWheel(e) { e.preventDefault(); this.camera.position.z = Math.max(this.config.minDistance, Math.min(this.config.maxDistance, this.camera.position.z + (e.deltaY > 0 ? 20 : -20))); }
    
    onTouchStart(e) { if (e.touches.length === 1) { this.isDragging = true; this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY }; } }
    
    onTouchMove(e) {
        if (this.isDragging && e.touches.length === 1) {
            const deltaX = e.touches[0].clientX - this.previousMousePosition.x;
            const deltaY = e.touches[0].clientY - this.previousMousePosition.y;
            this.targetRotation.y += deltaX * 0.005;
            this.targetRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.targetRotation.x + deltaY * 0.005));
            this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
    }
    
    onResize() {
        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || window.innerHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
    
    checkHover(e) {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.markers.map(m => m.mesh));
        
        if (intersects.length > 0) {
            const marker = this.markers.find(m => m.mesh === intersects[0].object);
            if (marker) {
                this.isHovering = true;
                if (marker !== this.hoveredMarker) {
                    this.hoveredMarker = marker;
                    this.container.style.cursor = 'pointer';
                    if (this.onCityHover) this.onCityHover(marker.city, e);
                }
            }
        } else {
            this.isHovering = false;
            if (this.hoveredMarker) { this.hoveredMarker = null; this.container.style.cursor = 'grab'; if (this.onCityHover) this.onCityHover(null); }
        }
    }
    
    onClick() { if (this.hoveredMarker && this.onCityClick) this.onCityClick(this.hoveredMarker.city); }
    
    updateTheme() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (this.globe) this.globe.material.color.setHex(isDark ? 0x12100e : 0xddd8d0);
        if (this.stars) { this.scene.remove(this.stars); this.stars.geometry.dispose(); this.stars.material.dispose(); }
        this.createStars();
        this.updateCities(this.cities);
    }
    
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        // 悬停时停止自动旋转
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
        
        // 脉动动画
        const time = Date.now() * 0.001;
        this.markers.forEach(m => {
            if (m.ring) {
                const pulse = Math.sin(time * 2 + m.pulsePhase) * 0.3 + 0.7;
                m.ring.material.opacity = 0.25 * pulse;
                m.ring.scale.setScalar(1 + Math.sin(time * 2 + m.pulsePhase) * 0.12);
            }
        });
        
        this.renderer.render(this.scene, this.camera);
    }
}
