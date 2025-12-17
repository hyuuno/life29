/**
 * Life29 - Supabase Client Service
 * 处理数据库操作
 */

class SupabaseService {
    constructor() {
        this.client = null;
        this.initialized = false;
    }
    
    async init() {
        if (this.initialized) return true;
        
        const { url, anonKey } = CONFIG.supabase;
        
        if (url === 'YOUR_SUPABASE_PROJECT_URL' || !url || !anonKey) {
            console.warn('Supabase not configured, using local mode');
            return false;
        }
        
        try {
            // 使用 Supabase JS 客户端
            const { createClient } = supabase;
            this.client = createClient(url, anonKey);
            this.initialized = true;
            console.log('✅ Supabase connected');
            return true;
        } catch (e) {
            console.error('Supabase init error:', e);
            return false;
        }
    }
    
    isConnected() {
        return this.initialized && this.client !== null;
    }
    
    // ==========================================
    // Music Library 操作
    // ==========================================
    
    async getMusicList() {
        if (!this.isConnected()) return [];
        
        try {
            const { data, error } = await this.client
                .from('music_library')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data || [];
        } catch (e) {
            console.error('Failed to fetch music:', e);
            return [];
        }
    }
    
    async addMusic(musicData) {
        if (!this.isConnected()) {
            console.warn('Supabase not connected');
            return null;
        }
        
        try {
            const { data, error } = await this.client
                .from('music_library')
                .insert([{
                    music_name: musicData.title,
                    artist: musicData.artist,
                    album: musicData.album,
                    music_genre: musicData.genre,
                    language: musicData.language,
                    file_url: musicData.fileUrl,
                    cover_url: musicData.coverUrl,
                    upload_user: musicData.uploadUser || CONFIG.users[0]
                }])
                .select()
                .single();
            
            if (error) throw error;
            console.log('✅ Music added:', data);
            return data;
        } catch (e) {
            console.error('Failed to add music:', e);
            return null;
        }
    }
    
    async deleteMusic(id) {
        if (!this.isConnected()) return false;
        
        try {
            const { error } = await this.client
                .from('music_library')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            return true;
        } catch (e) {
            console.error('Failed to delete music:', e);
            return false;
        }
    }
    
    // ==========================================
    // Moments 操作
    // ==========================================
    
    async getMoments(options = {}) {
        if (!this.isConnected()) return [];
        
        try {
            let query = this.client
                .from('moments')
                .select('*')
                .order('date', { ascending: false });
            
            // 可选过滤
            if (options.city) {
                query = query.eq('city', options.city);
            }
            if (options.country) {
                query = query.eq('country', options.country);
            }
            if (options.user) {
                query = query.eq('user_name', options.user);
            }
            if (options.limit) {
                query = query.limit(options.limit);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            return data || [];
        } catch (e) {
            console.error('Failed to fetch moments:', e);
            return [];
        }
    }
    
    async addMoment(momentData) {
        if (!this.isConnected()) {
            console.warn('Supabase not connected');
            return null;
        }
        
        try {
            const { data, error } = await this.client
                .from('moments')
                .insert([{
                    user_name: momentData.userName,
                    content: momentData.content,
                    image_urls: momentData.imageUrls, // JSON string or comma-separated
                    country: momentData.country,
                    city: momentData.city,
                    date: momentData.date || new Date().toISOString().split('T')[0]
                }])
                .select()
                .single();
            
            if (error) throw error;
            console.log('✅ Moment added:', data);
            return data;
        } catch (e) {
            console.error('Failed to add moment:', e);
            return null;
        }
    }
    
    async deleteMoment(id) {
        if (!this.isConnected()) return false;
        
        try {
            const { error } = await this.client
                .from('moments')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            return true;
        } catch (e) {
            console.error('Failed to delete moment:', e);
            return false;
        }
    }
    
    async updateMoment(id, updates) {
        if (!this.isConnected()) return null;
        
        try {
            const { data, error } = await this.client
                .from('moments')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            return data;
        } catch (e) {
            console.error('Failed to update moment:', e);
            return null;
        }
    }
    
    // ==========================================
    // 获取城市列表 (从 moments 聚合)
    // ==========================================
    
    async getCities() {
        if (!this.isConnected()) return [];
        
        try {
            const { data, error } = await this.client
                .from('moments')
                .select('country, city')
                .not('city', 'is', null);
            
            if (error) throw error;
            
            // 去重并统计
            const cityMap = new Map();
            data.forEach(m => {
                const key = `${m.city}-${m.country}`;
                if (!cityMap.has(key)) {
                    cityMap.set(key, { city: m.city, country: m.country, count: 0 });
                }
                cityMap.get(key).count++;
            });
            
            return Array.from(cityMap.values());
        } catch (e) {
            console.error('Failed to get cities:', e);
            return [];
        }
    }
}

// 全局实例
window.supabaseService = new SupabaseService();
