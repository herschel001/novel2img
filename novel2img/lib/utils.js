/**
 * Novel2Img 工具函数库
 */
const Novel2ImgUtils = {
    
    /**
     * 存储管理
     */
    storage: {
        /**
         * 保存设置
         * @param {Object} settings - 设置对象
         */
        async saveSettings(settings) {
            try {
                await chrome.storage.local.set(settings);
                console.log('✅ 设置已保存');
            } catch (error) {
                console.error('❌ 保存设置失败:', error);
                throw error;
            }
        },

        /**
         * 获取设置
         * @param {Array|string} keys - 要获取的键名
         * @returns {Promise<Object>} 设置对象
         */
        async getSettings(keys) {
            try {
                const result = await chrome.storage.local.get(keys);
                return result;
            } catch (error) {
                console.error('❌ 获取设置失败:', error);
                throw error;
            }
        },

        /**
         * 保存历史记录
         * @param {Object} record - 历史记录对象
         */
        async saveHistory(record) {
            try {
                const { history = [] } = await chrome.storage.local.get(['history']);
                
                // 添加时间戳
                record.timestamp = Date.now();
                record.id = `${record.timestamp}_${Math.random().toString(36).substr(2, 9)}`;
                
                // 添加到历史记录开头
                history.unshift(record);
                
                // 限制历史记录数量为100条
                if (history.length > 100) {
                    history.splice(100);
                }
                
                await chrome.storage.local.set({ history });
                console.log('✅ 历史记录已保存');
            } catch (error) {
                console.error('❌ 保存历史记录失败:', error);
                throw error;
            }
        },

        /**
         * 获取历史记录
         * @returns {Promise<Array>} 历史记录数组
         */
        async getHistory() {
            try {
                const { history = [] } = await chrome.storage.local.get(['history']);
                return history;
            } catch (error) {
                console.error('❌ 获取历史记录失败:', error);
                return [];
            }
        },

        /**
         * 删除历史记录
         * @param {string} recordId - 记录ID
         */
        async deleteHistoryRecord(recordId) {
            try {
                const { history = [] } = await chrome.storage.local.get(['history']);
                const filteredHistory = history.filter(record => record.id !== recordId);
                await chrome.storage.local.set({ history: filteredHistory });
                console.log('✅ 历史记录已删除');
            } catch (error) {
                console.error('❌ 删除历史记录失败:', error);
                throw error;
            }
        }
    },

    /**
     * 验证器
     */
    validator: {
        /**
         * 验证提示词
         * @param {string} prompt - 提示词
         * @returns {Object} 验证结果
         */
        validatePrompt(prompt) {
            if (!prompt || typeof prompt !== 'string') {
                return { valid: false, message: '请输入提示词' };
            }
            
            const trimmedPrompt = prompt.trim();
            if (trimmedPrompt.length === 0) {
                return { valid: false, message: '提示词不能为空' };
            }
            
            if (trimmedPrompt.length > 500) {
                return { valid: false, message: '提示词长度不能超过500个字符' };
            }
            
            return { valid: true, prompt: trimmedPrompt };
        },

        /**
         * 验证图片尺寸
         * @param {string} size - 图片尺寸
         * @returns {boolean} 验证结果
         */
        validateImageSize(size) {
            const validSizes = ['512x512', '1024x1024', '768x512', '512x768'];
            return validSizes.includes(size);
        },

        /**
         * 验证API密钥格式
         * @param {string} apiKey - API密钥
         * @returns {Object} 验证结果
         */
        validateApiKey(apiKey) {
            if (!apiKey || typeof apiKey !== 'string') {
                return { valid: false, message: '请输入API密钥' };
            }
            
            const trimmedKey = apiKey.trim();
            if (trimmedKey.length === 0) {
                return { valid: false, message: 'API密钥不能为空' };
            }
            
            // 简单的格式验证（魔搭API密钥通常以ms-开头）
            if (!trimmedKey.startsWith('ms-') || trimmedKey.length < 20) {
                return { valid: false, message: 'API密钥格式不正确' };
            }
            
            return { valid: true, apiKey: trimmedKey };
        }
    },

    /**
     * 格式化工具
     */
    formatter: {
        /**
         * 格式化时间
         * @param {number} timestamp - 时间戳
         * @returns {string} 格式化的时间字符串
         */
        formatTime(timestamp) {
            const date = new Date(timestamp);
            const now = new Date();
            const diffInMinutes = Math.floor((now - date) / (1000 * 60));
            
            if (diffInMinutes < 1) {
                return '刚刚';
            } else if (diffInMinutes < 60) {
                return `${diffInMinutes}分钟前`;
            } else if (diffInMinutes < 1440) {
                const hours = Math.floor(diffInMinutes / 60);
                return `${hours}小时前`;
            } else {
                const days = Math.floor(diffInMinutes / 1440);
                if (days === 1) {
                    return '昨天';
                } else if (days < 7) {
                    return `${days}天前`;
                } else {
                    return date.toLocaleDateString('zh-CN');
                }
            }
        },

        /**
         * 格式化文件大小
         * @param {number} bytes - 字节数
         * @returns {string} 格式化的文件大小
         */
        formatFileSize(bytes) {
            if (bytes === 0) return '0 B';
            
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            
            return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
        },

        /**
         * 生成文件名
         * @param {string} prompt - 提示词
         * @param {string} extension - 文件扩展名
         * @returns {string} 生成的文件名
         */
        generateFileName(prompt, extension = 'jpg') {
            const timestamp = Date.now();
            const safePrompt = prompt
                .replace(/[^\w\s\u4e00-\u9fff]/g, '') // 移除特殊字符，保留中文
                .trim()
                .substring(0, 20); // 截取前20个字符
            
            return `novel2img_${safePrompt}_${timestamp}.${extension}`;
        }
    },

    /**
     * DOM操作工具
     */
    dom: {
        /**
         * 创建元素
         * @param {string} tag - 标签名
         * @param {Object} attributes - 属性对象
         * @param {string} textContent - 文本内容
         * @returns {HTMLElement} 创建的元素
         */
        createElement(tag, attributes = {}, textContent = '') {
            const element = document.createElement(tag);
            
            Object.keys(attributes).forEach(key => {
                if (key === 'className') {
                    element.className = attributes[key];
                } else if (key === 'innerHTML') {
                    element.innerHTML = attributes[key];
                } else {
                    element.setAttribute(key, attributes[key]);
                }
            });
            
            if (textContent) {
                element.textContent = textContent;
            }
            
            return element;
        },

        /**
         * 检查元素是否在视窗内
         * @param {HTMLElement} element - 要检查的元素
         * @returns {boolean} 是否在视窗内
         */
        isElementInViewport(element) {
            const rect = element.getBoundingClientRect();
            return (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth)
            );
        },

        /**
         * 获取选中的文本
         * @returns {string} 选中的文本
         */
        getSelectedText() {
            const selection = window.getSelection();
            return selection ? selection.toString().trim() : '';
        }
    },

    /**
     * 消息通信工具
     */
    messaging: {
        /**
         * 发送消息到后台脚本
         * @param {Object} message - 消息对象
         * @returns {Promise<any>} 响应结果
         */
        async sendToBackground(message) {
            return new Promise((resolve, reject) => {
                chrome.runtime.sendMessage(message, (response) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        resolve(response);
                    }
                });
            });
        },

        /**
         * 发送消息到内容脚本
         * @param {number} tabId - 标签页ID
         * @param {Object} message - 消息对象
         * @returns {Promise<any>} 响应结果
         */
        async sendToContent(tabId, message) {
            return new Promise((resolve, reject) => {
                chrome.tabs.sendMessage(tabId, message, (response) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        resolve(response);
                    }
                });
            });
        }
    }
};

// 导出工具函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Novel2ImgUtils;
} else if (typeof window !== 'undefined') {
    window.Novel2ImgUtils = Novel2ImgUtils;
}