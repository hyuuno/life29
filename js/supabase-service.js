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
                    thoughts: musicData.thoughts || null,
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
    
    /**
     * 使用多个城市名称查询 moments（支持中英文双向匹配）
     * @param {string[]} cityNames - 城市名称数组（可能包含中文和英文）
     * @param {string} country - 国家名称（可选）
     * @returns {Promise<Array>} moments 数组
     */
    async getMomentsByCityNames(cityNames, country = null) {
        if (!this.isConnected()) return [];
        if (!cityNames || cityNames.length === 0) return [];
        
        try {
            let query = this.client
                .from('moments')
                .select('*')
                .in('city', cityNames)
                .order('date', { ascending: false });
            
            if (country) {
                query = query.eq('country', country);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            return data || [];
        } catch (e) {
            console.error('Failed to fetch moments by city names:', e);
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
    
    async deleteMomentByCondition(city, content) {
        if (!this.isConnected()) return false;
        
        try {
            // 先查询匹配的moment
            let query = this.client
                .from('moments')
                .select('id')
                .eq('city', city);
            
            if (content) {
                query = query.eq('content', content);
            }
            
            const { data, error: queryError } = await query;
            
            if (queryError) throw queryError;
            
            if (!data || data.length === 0) {
                console.log('No matching moment found in cloud');
                return true; // 云端没有数据也算成功
            }
            
            // 删除找到的第一条记录
            const { error: deleteError } = await this.client
                .from('moments')
                .delete()
                .eq('id', data[0].id);
            
            if (deleteError) throw deleteError;
            
            console.log('✅ Moment deleted from cloud:', data[0].id);
            return true;
        } catch (e) {
            console.error('Failed to delete moment by condition:', e);
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
    
    // ==========================================
    // Schedule 日程操作
    // ==========================================
    
    async getSchedule(weekKey) {
        if (!this.isConnected()) return null;
        
        try {
            const { data, error } = await this.client
                .from('schedules')
                .select('*')
                .eq('week_key', weekKey)
                .single();
            
            if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
            return data;
        } catch (e) {
            console.error('Failed to fetch schedule:', e);
            return null;
        }
    }
    
    async saveSchedule(weekKey, scheduleData) {
        if (!this.isConnected()) {
            console.warn('Supabase not connected');
            return null;
        }
        
        try {
            // 先检查是否存在
            const { data: existing, error: checkError } = await this.client
                .from('schedules')
                .select('id')
                .eq('week_key', weekKey)
                .maybeSingle(); // 使用 maybeSingle 而不是 single，不会在没有记录时报错
            
            let result;
            if (existing) {
                // 更新现有记录
                console.log('Updating existing schedule:', weekKey);
                const { data, error } = await this.client
                    .from('schedules')
                    .update({
                        wiwi_data: scheduleData.wiwi || {},
                        yuyu_data: scheduleData.yuyu || {},
                        updated_at: new Date().toISOString()
                    })
                    .eq('week_key', weekKey)
                    .select()
                    .single();
                
                if (error) throw error;
                result = data;
            } else {
                // 插入新记录
                console.log('Inserting new schedule:', weekKey);
                const newId = crypto.randomUUID ? crypto.randomUUID() : 
                    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
                        const r = Math.random() * 16 | 0;
                        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
                    });
                
                const { data, error } = await this.client
                    .from('schedules')
                    .insert({
                        id: newId,
                        week_key: weekKey,
                        wiwi_data: scheduleData.wiwi || {},
                        yuyu_data: scheduleData.yuyu || {},
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .select()
                    .single();
                
                if (error) throw error;
                result = data;
            }
            
            console.log('✅ Schedule saved:', weekKey, result);
            return result;
        } catch (e) {
            console.error('Failed to save schedule:', e);
            throw e; // 重新抛出错误以便调用者处理
        }
    }
    
    async deleteSchedule(weekKey) {
        if (!this.isConnected()) return false;
        
        try {
            const { error } = await this.client
                .from('schedules')
                .delete()
                .eq('week_key', weekKey);
            
            if (error) throw error;
            return true;
        } catch (e) {
            console.error('Failed to delete schedule:', e);
            return false;
        }
    }
    
    // ==========================================
    // Songs 操作
    // ==========================================
    
    async updateSongThoughts(songId, thoughts, author) {
        if (!this.isConnected()) return false;
        
        try {
            const { error } = await this.client
                .from('songs')
                .update({
                    thoughts: thoughts,
                    thoughts_author: author,
                    thoughts_time: new Date().toISOString()
                })
                .eq('id', songId);
            
            if (error) throw error;
            return true;
        } catch (e) {
            console.error('Failed to update song thoughts:', e);
            return false;
        }
    }
    
    async updateSongFeedback(songId, feedback, author) {
        if (!this.isConnected()) return false;
        
        try {
            const { error } = await this.client
                .from('songs')
                .update({
                    feedback: feedback,
                    feedback_author: author,
                    feedback_time: new Date().toISOString()
                })
                .eq('id', songId);
            
            if (error) throw error;
            return true;
        } catch (e) {
            console.error('Failed to update song feedback:', e);
            throw e;
        }
    }
    
    // ==========================================
    // Cloud Album 操作
    // ==========================================
    
    /**
     * 获取所有云相册
     */
    async getAlbums() {
        if (!this.isConnected()) return [];
        
        try {
            const { data, error } = await this.client
                .from('album')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data || [];
        } catch (e) {
            console.error('Failed to fetch albums:', e);
            return [];
        }
    }
    
    /**
     * 获取指定城市的云相册
     * @param {string[]} cityNames - 城市名称数组（可能包含中文和英文）
     * @param {string} country - 国家名称（可选）
     */
    async getAlbumsByCityNames(cityNames, country = null) {
        if (!this.isConnected()) return [];
        if (!cityNames || cityNames.length === 0) return [];
        
        try {
            let query = this.client
                .from('album')
                .select('*')
                .in('city', cityNames)
                .order('created_at', { ascending: false });
            
            if (country) {
                query = query.eq('country', country);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            return data || [];
        } catch (e) {
            console.error('Failed to fetch albums by city names:', e);
            return [];
        }
    }
    
    /**
     * 添加新云相册
     * @param {Object} albumData - 相册数据
     */
    async addAlbum(albumData) {
        if (!this.isConnected()) {
            console.warn('Supabase not connected');
            return null;
        }
        
        try {
            const { data, error } = await this.client
                .from('album')
                .insert([{
                    ablum_link: albumData.albumUrl,  // 注意：数据库中是 ablum_link (typo)
                    album_name: albumData.albumName,
                    country: albumData.country || null,
                    city: albumData.city || null
                }])
                .select()
                .single();
            
            if (error) throw error;
            console.log('✅ Album added:', data);
            return data;
        } catch (e) {
            console.error('Failed to add album:', e);
            return null;
        }
    }
    
    /**
     * 删除云相册
     * @param {string} albumLink - 相册链接（主键）
     */
    async deleteAlbum(albumLink) {
        if (!this.isConnected()) return false;
        
        try {
            const { error } = await this.client
                .from('album')
                .delete()
                .eq('ablum_link', albumLink);  // 注意：数据库中是 ablum_link (typo)
            
            if (error) throw error;
            console.log('✅ Album deleted:', albumLink);
            return true;
        } catch (e) {
            console.error('Failed to delete album:', e);
            return false;
        }
    }
    
    /**
     * 获取音乐库总数
     */
    async getMusicCount() {
        if (!this.isConnected()) return 0;
        
        try {
            const { count, error } = await this.client
                .from('music_library')
                .select('*', { count: 'exact', head: true });
            
            if (error) throw error;
            return count || 0;
        } catch (e) {
            console.error('Failed to get music count:', e);
            return 0;
        }
    }
    
    /**
     * 获取随机歌曲（用于 reroll）
     * @param {number} limit - 数量限制
     */
    async getRandomMusic(limit = 16) {
        if (!this.isConnected()) return [];
        
        try {
            // 获取所有歌曲
            const { data, error } = await this.client
                .from('music_library')
                .select('*');
            
            if (error) throw error;
            if (!data || data.length === 0) return [];
            
            // 在客户端随机选择
            const shuffled = [...data].sort(() => Math.random() - 0.5);
            return shuffled.slice(0, limit);
        } catch (e) {
            console.error('Failed to get random music:', e);
            return [];
        }
    }
}

// 全局实例
window.supabaseService = new SupabaseService();