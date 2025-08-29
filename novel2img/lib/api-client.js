/**
 * Novel2Img API客户端
 * 封装魔搭生图服务的异步调用
 */
class Novel2ImgAPIClient {
    constructor() {
        this.baseUrl = 'https://api-inference.modelscope.cn/';
        this.apiKey = null;
        this.defaultModel = 'Qwen/Qwen-Image';
    }

    /**
     * 设置API密钥
     * @param {string} apiKey - API密钥
     */
    setApiKey(apiKey) {
        this.apiKey = apiKey;
    }

    /**
     * 获取API密钥
     * @returns {Promise<string>} API密钥
     */
    async getApiKey() {
        if (this.apiKey) {
            return this.apiKey;
        }
        
        // 从存储中获取API密钥
        const result = await chrome.storage.local.get(['apiKey']);
        this.apiKey = result.apiKey;
        return this.apiKey;
    }

    /**
     * 异步生成图片
     * @param {string} prompt - 提示词
     * @param {Object} options - 生成选项 (默认生成3张图片)
     * @returns {Promise<Array>} 生成的图片URL数组
     */
    async generateImageAsync(prompt, options = {}) {
        const apiKey = await this.getApiKey();
        if (!apiKey) {
            throw new Error('API密钥未配置，请在插件设置中配置API密钥');
        }

        const {
            model = this.defaultModel,
            size = '1024x1024',
            count = 3
        } = options;

        console.log('🚀 开始异步生成图片...');
        console.log(`📝 提示词: "${prompt}"`);
        console.log(`🎨 模型: ${model}`);
        console.log(`📊 生成数量: ${count}张`);

        // 由于魔搭 API 不支持一次生成多张，我们连续调用多次
        const imageUrls = [];
        
        for (let i = 0; i < count; i++) {
            console.log(`🔄 正在生成第 ${i + 1} 张图片...`);
            
            try {
                const singleImageUrls = await this.generateSingleImage(prompt, model, size, apiKey);
                if (singleImageUrls && singleImageUrls.length > 0) {
                    imageUrls.push(...singleImageUrls);
                    console.log(`✅ 第 ${i + 1} 张图片生成成功`);
                } else {
                    console.warn(`⚠️ 第 ${i + 1} 张图片生成失败，跳过...`);
                }
            } catch (error) {
                console.error(`❌ 第 ${i + 1} 张图片生成失败:`, error.message);
                // 继续生成下一张，不中断整个过程
            }
            
            // 在连续调用之间添加小的延迟，避免频率限制
            if (i < count - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        if (imageUrls.length === 0) {
            throw new Error('所有图片生成都失败了，请稍后重试');
        }
        
        console.log(`🎉 成功生成 ${imageUrls.length} 张图片！`);
        return imageUrls;
    }
    
    /**
     * 生成单张图片
     * @param {string} prompt - 提示词
     * @param {string} model - 模型名称
     * @param {string} size - 图片尺寸
     * @param {string} apiKey - API密钥
     * @returns {Promise<Array>} 生成的图片URL数组
     */
    async generateSingleImage(prompt, model, size, apiKey) {
        // 第一步：提交生成任务
        const taskResponse = await fetch(`${this.baseUrl}v1/images/generations`, {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "X-ModelScope-Async-Mode": "true"
            },
            body: JSON.stringify({
                model: model,
                prompt: prompt,
                size: size,
                n: 1  // 只生成一张
            })
        });

        if (!taskResponse.ok) {
            const errorText = await taskResponse.text();
            throw new Error(`提交任务失败: ${taskResponse.status} - ${errorText}`);
        }

        const taskData = await taskResponse.json();
        const taskId = taskData.task_id;
        
        // 第二步：轮询任务状态
        return await this.pollTaskStatus(taskId, apiKey);
    }

    /**
     * 轮询任务状态
     * @param {string} taskId - 任务ID
     * @param {string} apiKey - API密钥
     * @returns {Promise<Array>} 生成的图片URL数组
     */
    async pollTaskStatus(taskId, apiKey) {
        let attempts = 0;
        const maxAttempts = 60; // 最多等待5分钟
        
        while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // 等待5秒
            attempts++;
            
            console.log(`🔍 检查任务状态 (${attempts}/${maxAttempts})...`);
            
            const statusResponse = await fetch(`${this.baseUrl}v1/tasks/${taskId}`, {
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                    "X-ModelScope-Task-Type": "image_generation"
                }
            });

            if (!statusResponse.ok) {
                const errorText = await statusResponse.text();
                throw new Error(`检查任务状态失败: ${statusResponse.status} - ${errorText}`);
            }

            const statusData = await statusResponse.json();
            console.log(`📊 任务状态: ${statusData.task_status}`);

            if (statusData.task_status === "SUCCEED") {
                console.log('✅ 生成成功！');
                return statusData.output_images || [];
            } else if (statusData.task_status === "FAILED") {
                throw new Error('图片生成失败');
            }
            // 继续等待其他状态 (RUNNING, PENDING等)
        }

        throw new Error('任务超时，请稍后重试');
    }

    /**
     * 下载图片到本地
     * @param {string} imageUrl - 图片URL
     * @param {string} filename - 文件名
     * @returns {Promise<string>} 下载的文件路径
     */
    async downloadImage(imageUrl, filename) {
        try {
            console.log(`📥 开始下载图片: ${imageUrl}`);
            
            // 使用Chrome Downloads API下载图片
            const downloadId = await chrome.downloads.download({
                url: imageUrl,
                filename: filename || `novel2img_generated_${Date.now()}.jpg`,
                saveAs: false
            });
            
            console.log(`✅ 图片下载开始，下载ID: ${downloadId}`);
            return downloadId;
        } catch (error) {
            console.error(`❌ 下载失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 验证API密钥
     * @param {string} apiKey - 要验证的API密钥
     * @returns {Promise<boolean>} 验证结果
     */
    async validateApiKey(apiKey) {
        try {
            const response = await fetch(`${this.baseUrl}v1/images/generations`, {
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                    "X-ModelScope-Async-Mode": "true"
                },
                body: JSON.stringify({
                    model: this.defaultModel,
                    prompt: "test"
                })
            });
            
            // 如果返回401或403，说明密钥无效
            if (response.status === 401 || response.status === 403) {
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('API密钥验证失败:', error);
            return false;
        }
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Novel2ImgAPIClient;
} else if (typeof window !== 'undefined') {
    window.Novel2ImgAPIClient = Novel2ImgAPIClient;
}