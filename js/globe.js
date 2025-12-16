/**
 * Life29 - 3D 地球模块 (使用 Globe.gl)
 * 显示中国省份和美国州的精确轮廓
 */

class Globe {
    constructor(container, cities = []) {
        this.container = container;
        this.cities = cities;
        this.world = null;
        this.selectedCity = null;
        this.homeCity = null;
        this.onCityClick = null;
        this.onCityHover = null;
        
        // 中国省份 ISO 代码
        this.chinaProvinces = [
            'CN-11', 'CN-12', 'CN-13', 'CN-14', 'CN-15', // 北京、天津、河北、山西、内蒙古
            'CN-21', 'CN-22', 'CN-23', // 辽宁、吉林、黑龙江
            'CN-31', 'CN-32', 'CN-33', 'CN-34', 'CN-35', 'CN-36', 'CN-37', // 上海、江苏、浙江、安徽、福建、江西、山东
            'CN-41', 'CN-42', 'CN-43', 'CN-44', 'CN-45', 'CN-46', // 河南、湖北、湖南、广东、广西、海南
            'CN-50', 'CN-51', 'CN-52', 'CN-53', 'CN-54', // 重庆、四川、贵州、云南、西藏
            'CN-61', 'CN-62', 'CN-63', 'CN-64', 'CN-65', // 陕西、甘肃、青海、宁夏、新疆
            'CN-71', 'CN-91', 'CN-92' // 台湾、香港、澳门
        ];
        
        this.init();
    }
    
    async init() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        
        // 创建 Globe.gl 实例
        this.world = Globe()(this.container);
        
        // 基础配置
        this.world
            .backgroundColor('rgba(0,0,0,0)')
            .showAtmosphere(true)
            .atmosphereColor(isDark ? 'rgba(180, 140, 150, 0.3)' : 'rgba(200, 180, 190, 0.2)')
            .atmosphereAltitude(0.15)
            .globeImageUrl(null)
            .pointOfView({ altitude: 2.2 });
        
        // 设置地球材质
        this.world.onGlobeReady(() => {
            const material = this.world.globeMaterial();
            if (isDark) {
                material.color = new THREE.Color(0x1a1816);
                material.emissive = new THREE.Color(0x0a0908);
                material.emissiveIntensity = 0.3;
            } else {
                material.color = new THREE.Color(0xdedad5);
                material.emissive = new THREE.Color(0x333333);
                material.emissiveIntensity = 0.1;
            }
            material.shininess = 5;
        });
        
        // 加载地理数据
        await this.loadGeoData(isDark);
        
        // 配置城市标记
        this.setupCityMarkers();
        
        // 添加星星背景
        this.addStars(isDark);
    }
    
    async loadGeoData(isDark) {
        try {
            // 加载国家边界 (用于中美轮廓)
            const countriesRes = await fetch('https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson');
            const countries = await countriesRes.json();
            
            // 过滤只显示中国和美国
            const targetCountries = countries.features.filter(d => 
                ['USA', 'CHN'].includes(d.properties.ISO_A3)
            );
            
            // 加载中国省份边界
            const chinaProvRes = await fetch('https://raw.githubusercontent.com/AshKyd/geojson-regions/master/countries/50m/CHN.geojson');
            let chinaProvinces = [];
            try {
                const chinaData = await chinaProvRes.json();
                chinaProvinces = chinaData.features || [];
            } catch (e) {
                console.log('Using country outline for China');
            }
            
            // 加载美国州边界
            const usaStatesRes = await fetch('https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json');
            let usaStates = [];
            try {
                const usaData = await usaStatesRes.json();
                usaStates = usaData.features || [];
            } catch (e) {
                console.log('Using country outline for USA');
            }
            
            // 合并所有区域数据
            const allRegions = [...targetCountries, ...chinaProvinces, ...usaStates];
            
            // 颜色配置
            const colors = ['#f8d0d8', '#c8e8c8', '#f8f0c0', '#c8d8f0', '#f8e0c0', '#e0d0e8'];
            
            this.world
                .polygonsData(allRegions)
                .polygonCapColor((d, i) => {
                    const color = colors[i % colors.length];
                    // 转换为RGBA
                    const r = parseInt(color.slice(1, 3), 16);
                    const g = parseInt(color.slice(3, 5), 16);
                    const b = parseInt(color.slice(5, 7), 16);
                    if (isDark) {
                        return `rgba(${Math.floor(r*0.3)}, ${Math.floor(g*0.3)}, ${Math.floor(b*0.3)}, 0.6)`;
                    }
                    return `rgba(${r}, ${g}, ${b}, 0.7)`;
                })
                .polygonSideColor(() => 'rgba(0, 0, 0, 0)')
                .polygonStrokeColor(() => isDark ? '#5a5652' : '#9a9692')
                .polygonAltitude(0.006)
                .polygonsTransitionDuration(0);
                
        } catch (error) {
            console.error('Failed to load geo data:', error);
            // 降级：只显示基本地球
        }
    }
    
    setupCityMarkers() {
        // 配置城市点
        this.world
            .pointsData([])
            .pointAltitude(0.02)
            .pointRadius(d => d === this.selectedCity ? 0.6 : 0.4)
            .pointColor(d => d.color || '#E8B4B8')
            .pointResolution(24)
            
            // 波纹效果
            .ringsData([])
            .ringColor(() => t => `rgba(232, 180, 184, ${1 - t})`)
            .ringMaxRadius(3)
            .ringPropagationSpeed(2)
            .ringRepeatPeriod(1500)
            
            // 标签
            .labelsData([])
            .labelLat(d => d.lat)
            .labelLng(d => d.lng)
            .labelText(d => d.name)
            .labelSize(d => d === this.selectedCity ? 1.2 : 0.8)
            .labelDotRadius(d => d === this.selectedCity ? 0.4 : 0.2)
            .labelColor(() => 'rgba(255, 255, 255, 0.85)')
            .labelResolution(2)
            .labelAltitude(0.025)
            
            // 点击事件
            .onPointClick(city => {
                this.selectedCity = city;
                this.updateCityMarkers();
                
                // 添加波纹
                this.world.ringsData([city]);
                
                // 飞向目标
                this.world.pointOfView({ lat: city.lat, lng: city.lng, altitude: 1.2 }, 1000);
                
                if (this.onCityClick) {
                    this.onCityClick(city);
                }
            })
            
            // 悬停事件
            .onPointHover(city => {
                this.container.style.cursor = city ? 'pointer' : 'grab';
                if (this.onCityHover) {
                    this.onCityHover(city);
                }
            })
            
            // 点击空白
            .onGlobeClick(() => {
                if (this.selectedCity) {
                    this.selectedCity = null;
                    this.world.ringsData([]);
                    this.updateCityMarkers();
                }
            });
    }
    
    updateCityMarkers() {
        const citiesWithContent = this.cities.filter(city => 
            (city.photos?.length > 0) || (city.journals?.length > 0)
        );
        
        this.world.pointsData([...citiesWithContent]);
        this.world.labelsData([...citiesWithContent]);
    }
    
    updateCities(cities) {
        this.cities = cities;
        this.updateCityMarkers();
    }
    
    addStars(isDark) {
        if (!isDark) return;
        
        const scene = this.world.scene();
        
        // 创建星星
        const starsGeometry = new THREE.BufferGeometry();
        const starPositions = [];
        const starCount = 2000;
        
        for (let i = 0; i < starCount; i++) {
            const radius = 500 + Math.random() * 300;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            starPositions.push(
                radius * Math.sin(phi) * Math.cos(theta),
                radius * Math.sin(phi) * Math.sin(theta),
                radius * Math.cos(phi)
            );
        }
        
        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
        
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 1.5,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true
        });
        
        this.stars = new THREE.Points(starsGeometry, starsMaterial);
        scene.add(this.stars);
    }
    
    focusOnCity(city, animate = true) {
        const duration = animate ? 1000 : 0;
        this.world.pointOfView({ lat: city.lat, lng: city.lng, altitude: 1.5 }, duration);
    }
    
    setHomeCity(city) {
        this.homeCity = city;
        if (city) {
            this.focusOnCity(city, true);
        }
    }
    
    goHome() {
        if (this.homeCity) {
            this.focusOnCity(this.homeCity, true);
        }
    }
    
    updateTheme() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        
        // 更新地球材质
        const material = this.world.globeMaterial();
        if (isDark) {
            material.color = new THREE.Color(0x1a1816);
            material.emissive = new THREE.Color(0x0a0908);
            material.emissiveIntensity = 0.3;
        } else {
            material.color = new THREE.Color(0xdedad5);
            material.emissive = new THREE.Color(0x333333);
            material.emissiveIntensity = 0.1;
        }
        
        // 更新大气层
        this.world.atmosphereColor(isDark ? 'rgba(180, 140, 150, 0.3)' : 'rgba(200, 180, 190, 0.2)');
        
        // 更新边框颜色
        this.world.polygonStrokeColor(() => isDark ? '#5a5652' : '#9a9692');
        
        // 更新背景色
        this.world.backgroundColor('rgba(0,0,0,0)');
        
        // 星星显示/隐藏
        if (this.stars) {
            this.stars.visible = isDark;
        } else if (isDark) {
            this.addStars(true);
        }
        
        // 重新加载地理数据以更新颜色
        this.loadGeoData(isDark);
    }
    
    // 获取城市坐标 (用于添加新城市)
    getCityCoordinates(country, cityName) {
        const chinaCities = {
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
            '温州': [28.0, 120.7], '珠海': [22.3, 113.6], '东莞': [23.0, 113.7]
        };
        
        const usCities = {
            'San Francisco': [37.8, -122.4], 'Los Angeles': [34.1, -118.2],
            'New York': [40.7, -74.0], 'Chicago': [41.9, -87.6],
            'Houston': [29.8, -95.4], 'Phoenix': [33.4, -112.1],
            'Seattle': [47.6, -122.3], 'Denver': [39.7, -105.0],
            'Boston': [42.4, -71.1], 'Las Vegas': [36.2, -115.1],
            'Miami': [25.8, -80.2], 'Atlanta': [33.7, -84.4]
        };
        
        if (country === '中国' && chinaCities[cityName]) {
            return { lat: chinaCities[cityName][0], lng: chinaCities[cityName][1] };
        }
        if (country === '美国' && usCities[cityName]) {
            return { lat: usCities[cityName][0], lng: usCities[cityName][1] };
        }
        return null;
    }
}
