/**
 * Life29 - Cloudinary Upload Service
 * 使用 unsigned upload preset 进行文件上传
 */

class CloudinaryService {
    constructor() {
        this.cloudName = CONFIG.cloudinary?.cloudName || 'dkwsbttsi';
        this.uploadPreset = CONFIG.cloudinary?.uploadPreset || 'life29_unsigned';
        this.uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}`;
    }
    
    /**
     * 上传文件到 Cloudinary
     * @param {File} file - 要上传的文件
     * @param {string} folder - 存放文件夹 (music / covers / moments)
     * @param {Function} onProgress - 进度回调 (0-100)
     * @returns {Promise<{url: string, publicId: string}>}
     */
    async upload(file, folder = 'life29', onProgress = null) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', this.uploadPreset);
        formData.append('folder', `life29/${folder}`);
        
        // 根据文件类型选择资源类型
        const resourceType = file.type.startsWith('audio/') ? 'video' : 
                            file.type.startsWith('video/') ? 'video' : 'image';
        
        const uploadEndpoint = `${this.uploadUrl}/${resourceType}/upload`;
        
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            
            // 进度监听
            if (onProgress) {
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const percent = Math.round((e.loaded / e.total) * 100);
                        onProgress(percent);
                    }
                });
            }
            
            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        resolve({
                            url: response.secure_url,
                            publicId: response.public_id,
                            format: response.format,
                            duration: response.duration, // 音频时长
                            width: response.width,
                            height: response.height
                        });
                    } catch (e) {
                        reject(new Error('Failed to parse response'));
                    }
                } else {
                    let errorMsg = 'Upload failed';
                    try {
                        const err = JSON.parse(xhr.responseText);
                        errorMsg = err.error?.message || errorMsg;
                    } catch (e) {}
                    reject(new Error(errorMsg));
                }
            });
            
            xhr.addEventListener('error', () => reject(new Error('Network error')));
            xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));
            
            xhr.open('POST', uploadEndpoint);
            xhr.send(formData);
        });
    }
    
    /**
     * 上传音乐文件
     */
    async uploadMusic(file, onProgress) {
        return this.upload(file, 'music', onProgress);
    }
    
    /**
     * 上传封面图片
     */
    async uploadCover(file, onProgress) {
        return this.upload(file, 'covers', onProgress);
    }
    
    /**
     * 上传 moment 图片
     */
    async uploadMomentImage(file, onProgress) {
        return this.upload(file, 'moments', onProgress);
    }
    
    /**
     * 批量上传图片
     */
    async uploadMultiple(files, folder, onTotalProgress) {
        const results = [];
        const total = files.length;
        let completed = 0;
        
        for (const file of files) {
            try {
                const result = await this.upload(file, folder, (fileProgress) => {
                    if (onTotalProgress) {
                        const totalProgress = Math.round(((completed + fileProgress / 100) / total) * 100);
                        onTotalProgress(totalProgress);
                    }
                });
                results.push(result);
                completed++;
            } catch (e) {
                console.error('Upload failed for file:', file.name, e);
                results.push({ error: e.message, fileName: file.name });
                completed++;
            }
        }
        
        return results;
    }
    
    /**
     * 获取优化后的图片 URL
     */
    getOptimizedUrl(url, options = {}) {
        if (!url || !url.includes('cloudinary.com')) return url;
        
        const { width, height, quality = 'auto', format = 'auto' } = options;
        
        // 构建转换参数
        const transforms = [`q_${quality}`, `f_${format}`];
        if (width) transforms.push(`w_${width}`);
        if (height) transforms.push(`h_${height}`);
        if (width || height) transforms.push('c_fill');
        
        // 插入转换参数到 URL
        return url.replace('/upload/', `/upload/${transforms.join(',')}/`);
    }
    
    /**
     * 获取缩略图 URL
     */
    getThumbnailUrl(url, size = 200) {
        return this.getOptimizedUrl(url, { width: size, height: size });
    }
}

// 全局实例
window.cloudinaryService = new CloudinaryService();
