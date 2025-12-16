/**
 * Life29 - 3D 地球模块
 * 使用GeoJSON数据渲染精确地图
 */

class Globe {
    constructor(container, cities = []) {
        this.container = container;
        this.cities = cities;
        this.markers = [];
        this.hoveredMarker = null;
        this.homeCity = null;
        this.isHovering = false;
        this.geoDataLoaded = false;
        
        this.config = {
            radius: 180,
            markerSize: 3,
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
    
    async init() {
        try {
            this.setupScene();
            this.createStars();
            this.createGlobe();
            this.createAtmosphere();
            await this.loadGeoData();
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
        
        const count = 1500;
        const starGroup = new THREE.Group();
        const positions = [];
        const sizes = [];
        const starData = [];
        
        for (let i = 0; i < count; i++) {
            const r = 700 + Math.random() * 500;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta);
            const z = r * Math.cos(phi);
            
            positions.push(x, y, z);
            
            let size = i < count / 2 ? 3 : 2 + Math.random() * 4;
            sizes.push(size);
            starData.push({ x, y, z, size });
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
        
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
        
        // 15%星星添加光晕
        const glowColors = [0x5287a3, 0x663556];
        const glowCount = Math.floor(count * 0.15);
        
        for (let i = 0; i < glowCount; i++) {
            const idx = Math.floor(Math.random() * count);
            const star = starData[idx];
            const color = glowColors[Math.floor(Math.random() * 2)];
            const glowSize = star.size * 0.2;
            
            const spriteMaterial = new THREE.SpriteMaterial({
                map: this.createStarGlowTexture(color),
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            
            const sprite = new THREE.Sprite(spriteMaterial);
            sprite.position.set(star.x, star.y, star.z);
            sprite.scale.set(glowSize * 15, glowSize * 15, 1);
            sprite.renderOrder = -101;
            starGroup.add(sprite);
        }
        
        this.stars = starGroup;
        this.scene.add(starGroup);
    }
    
    createStarGlowTexture(color) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        const r = (color >> 16) & 255;
        const g = (color >> 8) & 255;
        const b = color & 255;
        
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.3)`);
        gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.1)`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
        
        return new THREE.CanvasTexture(canvas);
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
            opacity: 0.2
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
    
    async loadGeoData() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        
        try {
            // 加载中国GeoJSON
            const chinaRes = await fetch('data/china.geojson');
            const chinaData = await chinaRes.json();
            this.renderGeoJSON(chinaData, isDark);
            
            // 加载美国GeoJSON
            const usaRes = await fetch('data/usa.geojson');
            const usaData = await usaRes.json();
            this.renderGeoJSON(usaData, isDark);
            
            this.geoDataLoaded = true;
        } catch (error) {
            console.error('Failed to load GeoJSON:', error);
        }
    }
    
    renderGeoJSON(geojson, isDark) {
        geojson.features.forEach(feature => {
            const coords = feature.geometry.coordinates[0];
            const colorHex = feature.properties.color;
            const color = parseInt(colorHex.replace('#', ''), 16);
            
            // 调整颜色亮度
            const adjustedColor = isDark ? this.darkenColor(color, 0.35) : color;
            
            // 转换坐标到3D点
            const points3D = coords.map(coord => {
                const lng = coord[0];
                const lat = coord[1];
                return this.latLngToVector3(lat, lng, this.config.radius + 0.3);
            });
            
            // 绘制填充区域
            if (points3D.length >= 3) {
                const fillMaterial = new THREE.MeshBasicMaterial({
                    color: adjustedColor,
                    transparent: true,
                    opacity: isDark ? 0.5 : 0.65,
                    side: THREE.DoubleSide,
                    depthWrite: false
                });
                
                // 创建三角形网格填充
                const vertices = [];
                for (let i = 1; i < points3D.length - 1; i++) {
                    vertices.push(
                        points3D[0].x, points3D[0].y, points3D[0].z,
                        points3D[i].x, points3D[i].y, points3D[i].z,
                        points3D[i + 1].x, points3D[i + 1].y, points3D[i + 1].z
                    );
                }
                
                const geometry = new THREE.BufferGeometry();
                geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
                geometry.computeVertexNormals();
                
                const mesh = new THREE.Mesh(geometry, fillMaterial);
                mesh.renderOrder = 2;
                this.globeGroup.add(mesh);
            }
            
            // 绘制边框线
            const borderColor = isDark ? 0x5a5652 : 0x9a9692;
            const borderMaterial = new THREE.LineBasicMaterial({
                color: borderColor,
                transparent: true,
                opacity: isDark ? 0.7 : 0.8
            });
            
            const borderLine = new THREE.Line(
                new THREE.BufferGeometry().setFromPoints(points3D),
                borderMaterial
            );
            borderLine.renderOrder = 3;
            this.globeGroup.add(borderLine);
        });
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
                    markerPositions.push({ pos: testPos, city, lat: testLat, lng: testLng });
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
                markerPositions.push({ pos: basePos, city, lat: city.lat, lng: city.lng });
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
        
        // 白色渐变光晕
        const glowTexture = this.createMarkerGlowTexture();
        const glowMaterial = new THREE.SpriteMaterial({
            map: glowTexture,
            transparent: true,
            depthWrite: false
        });
        const glow = new THREE.Sprite(glowMaterial);
        glow.scale.set(size * 0.5 * 6, size * 0.5 * 6, 1);
        glow.renderOrder = 10 + index * 3;
        group.add(glow);
        
        // 脉动环
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
        
        // 主标记
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
        
        this.markers.push({ group, mesh: marker, ring, glow, city, pulsePhase: Math.random() * Math.PI * 2 });
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
        
        // 清除旧的地图和重新加载
        // 这里简单处理，完整实现需要清除所有地图mesh
        
        if (this.stars) {
            if (this.stars.isGroup || this.stars.type === 'Group') {
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
