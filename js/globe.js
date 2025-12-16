/**
 * Life29 - 3D 地球模块
 */

class Globe {
    constructor(container, cities = []) {
        this.container = container;
        this.cities = cities;
        this.markers = [];
        this.hoveredMarker = null;
        this.homeCity = null;
        
        this.config = {
            radius: 180,
            markerSize: 5,
            segments: 64,
            autoRotate: true,
            autoRotateSpeed: 0.0008,
            minDistance: 280,
            maxDistance: 550
        };
        
        this.isDragging = false;
        this.previousMousePosition = { x: 0, y: 0 };
        this.targetRotation = { x: 0, y: 0 };
        this.currentRotation = { x: 0, y: 0 };
        this.momentum = { x: 0, y: 0 };
        
        this.init();
    }
    
    init() {
        try {
            this.setupScene();
            this.createGlobe();
            this.createAtmosphere();
            this.createStars();
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
        this.camera.position.z = 420;
        
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000000, 0);
        this.container.appendChild(this.renderer.domElement);
        
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
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
            color: isDark ? 0x1a1816 : 0xf8f5f2,
            transparent: true,
            opacity: 0.95,
            shininess: 5
        });
        this.globe = new THREE.Mesh(globeGeometry, globeMaterial);
        this.globeGroup.add(this.globe);
        
        this.createGridLines(isDark);
        this.createContinentOutlines(isDark);
    }
    
    createGridLines(isDark) {
        const gridColor = isDark ? 0x3a3530 : 0xe8e4e0;
        const gridMaterial = new THREE.LineBasicMaterial({
            color: gridColor,
            transparent: true,
            opacity: 0.25
        });
        
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
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            this.globeGroup.add(new THREE.Line(geometry, gridMaterial));
        }
        
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
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            this.globeGroup.add(new THREE.Line(geometry, gridMaterial));
        }
    }
    
    createContinentOutlines(isDark) {
        const continents = {
            asia: [[40, 120], [35, 105], [25, 100], [20, 105], [10, 105], [5, 100], [1, 104], [-5, 105], [-8, 115], [-8, 130], [0, 130], [10, 125], [20, 122], [25, 120], [30, 122], [35, 130], [40, 130], [45, 135], [50, 140], [55, 135]],
            europe: [[35, -10], [40, -10], [45, -5], [50, 0], [55, 5], [60, 10], [65, 15], [70, 25], [65, 40], [60, 30], [55, 25], [50, 20], [45, 15], [40, 20], [35, 25]],
            africa: [[35, -5], [30, 0], [20, -18], [10, -15], [0, 5], [-10, 15], [-20, 20], [-35, 20], [-35, 30], [-25, 35], [-10, 45], [5, 50], [15, 40], [25, 35], [35, 35]],
            northAmerica: [[70, -165], [55, -165], [45, -125], [35, -120], [25, -110], [20, -105], [25, -85], [35, -75], [45, -65], [55, -60], [65, -70], [70, -140]],
            southAmerica: [[10, -75], [0, -80], [-10, -75], [-25, -65], [-40, -75], [-55, -70], [-55, -65], [-40, -60], [-25, -45], [-10, -35], [0, -50], [10, -75]],
            australia: [[-10, 140], [-20, 115], [-35, 120], [-40, 145], [-35, 150], [-25, 153], [-15, 145], [-10, 140]]
        };
        
        const outlineColor = isDark ? 0x5a5550 : 0xd0ccc8;
        const outlineMaterial = new THREE.LineBasicMaterial({
            color: outlineColor,
            transparent: true,
            opacity: 0.4
        });
        
        Object.values(continents).forEach(continent => {
            const points = continent.map(([lat, lng]) => this.latLngToVector3(lat, lng, this.config.radius + 0.5));
            if (points.length > 0) points.push(points[0].clone());
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            this.globeGroup.add(new THREE.Line(geometry, outlineMaterial));
        });
    }
    
    createAtmosphere() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        
        const atmosphereGeometry = new THREE.SphereGeometry(this.config.radius * 1.12, this.config.segments, this.config.segments);
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
                    float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                    gl_FragColor = vec4(${isDark ? '0.7, 0.5, 0.55' : '0.9, 0.7, 0.72'}, 1.0) * intensity * 0.35;
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
        const starGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(800 * 3);
        
        for (let i = 0; i < 800 * 3; i += 3) {
            const radius = 700 + Math.random() * 300;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            positions[i] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i + 2] = radius * Math.cos(phi);
        }
        
        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({
            color: 0xffffff, size: 1, transparent: true, opacity: 0.5
        }));
        this.scene.add(this.stars);
    }
    
    updateCities(cities) {
        this.cities = cities;
        this.markers.forEach(m => {
            if (m.mesh) this.globeGroup.remove(m.mesh);
            if (m.ring) this.globeGroup.remove(m.ring);
        });
        this.markers = [];
        cities.forEach(city => this.createCityMarker(city));
    }
    
    createCityMarker(city) {
        const hasContent = (city.photos?.length > 0) || (city.journals?.length > 0);
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const position = this.latLngToVector3(city.lat, city.lng, this.config.radius);
        
        const markerSize = hasContent ? this.config.markerSize : this.config.markerSize * 0.6;
        const markerGeometry = new THREE.CircleGeometry(markerSize, 16);
        const markerColor = hasContent ? new THREE.Color(city.color || '#E8B4B8') : (isDark ? new THREE.Color(0x4a4540) : new THREE.Color(0xd8d4d0));
        
        const marker = new THREE.Mesh(markerGeometry, new THREE.MeshBasicMaterial({
            color: markerColor, side: THREE.DoubleSide, transparent: true, opacity: hasContent ? 0.9 : 0.4
        }));
        marker.position.copy(position);
        marker.lookAt(position.clone().multiplyScalar(2));
        this.globeGroup.add(marker);
        
        let ring = null;
        if (hasContent) {
            const ringGeometry = new THREE.RingGeometry(markerSize * 1.3, markerSize * 1.6, 32);
            ring = new THREE.Mesh(ringGeometry, new THREE.MeshBasicMaterial({
                color: markerColor, side: THREE.DoubleSide, transparent: true, opacity: 0.35
            }));
            ring.position.copy(position);
            ring.lookAt(position.clone().multiplyScalar(2));
            this.globeGroup.add(ring);
        }
        
        this.markers.push({ mesh: marker, ring, city, hasContent, pulsePhase: Math.random() * Math.PI * 2 });
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
            this.currentRotation = { x: targetX, y: targetY };
            this.targetRotation = { x: targetX, y: targetY };
            this.globeGroup.rotation.x = targetX;
            this.globeGroup.rotation.y = targetY;
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
        this.container.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.container.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.container.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.container.addEventListener('mouseleave', this.onMouseUp.bind(this));
        this.container.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
        this.container.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: true });
        this.container.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: true });
        this.container.addEventListener('touchend', this.onTouchEnd.bind(this));
        window.addEventListener('resize', this.onResize.bind(this));
        this.container.addEventListener('click', this.onClick.bind(this));
    }
    
    onMouseDown(e) {
        this.isDragging = true;
        this.previousMousePosition = { x: e.clientX, y: e.clientY };
        this.momentum = { x: 0, y: 0 };
    }
    
    onMouseMove(e) {
        const rect = this.container.getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        
        if (this.isDragging) {
            const deltaX = e.clientX - this.previousMousePosition.x;
            const deltaY = e.clientY - this.previousMousePosition.y;
            this.targetRotation.y += deltaX * 0.005;
            this.targetRotation.x += deltaY * 0.005;
            this.targetRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.targetRotation.x));
            this.momentum = { x: deltaY * 0.002, y: deltaX * 0.002 };
            this.previousMousePosition = { x: e.clientX, y: e.clientY };
        }
        this.checkHover(e);
    }
    
    onMouseUp() { this.isDragging = false; }
    
    onWheel(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 15 : -15;
        this.camera.position.z = Math.max(this.config.minDistance, Math.min(this.config.maxDistance, this.camera.position.z + delta));
    }
    
    onTouchStart(e) {
        if (e.touches.length === 1) {
            this.isDragging = true;
            this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
    }
    
    onTouchMove(e) {
        if (this.isDragging && e.touches.length === 1) {
            const deltaX = e.touches[0].clientX - this.previousMousePosition.x;
            const deltaY = e.touches[0].clientY - this.previousMousePosition.y;
            this.targetRotation.y += deltaX * 0.005;
            this.targetRotation.x += deltaY * 0.005;
            this.targetRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.targetRotation.x));
            this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
    }
    
    onTouchEnd() { this.isDragging = false; }
    
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
            if (marker && marker !== this.hoveredMarker) {
                this.hoveredMarker = marker;
                this.container.style.cursor = 'pointer';
                if (this.onCityHover) this.onCityHover(marker.city, e);
            }
        } else if (this.hoveredMarker) {
            this.hoveredMarker = null;
            this.container.style.cursor = 'grab';
            if (this.onCityHover) this.onCityHover(null);
        }
    }
    
    onClick() {
        if (this.hoveredMarker && this.onCityClick) this.onCityClick(this.hoveredMarker.city);
    }
    
    updateTheme() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (this.globe) this.globe.material.color.setHex(isDark ? 0x1a1816 : 0xf8f5f2);
        if (this.stars) this.stars.material.opacity = isDark ? 0.7 : 0.4;
        this.updateCities(this.cities);
    }
    
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        if (!this.isDragging && this.config.autoRotate) {
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
            if (m.ring && m.hasContent) {
                const pulse = Math.sin(time * 2 + m.pulsePhase) * 0.3 + 0.7;
                m.ring.material.opacity = 0.35 * pulse;
                m.ring.scale.setScalar(1 + Math.sin(time * 2 + m.pulsePhase) * 0.08);
            }
        });
        
        this.renderer.render(this.scene, this.camera);
    }
}
