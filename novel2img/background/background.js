/**
 * Novel2Img Background Script
 * 处理API调用、右键菜单和消息传递
 */

// 导入API客户端和工具函数
importScripts('../lib/api-client.js', '../lib/utils.js');

// 初始化API客户端
const apiClient = new Novel2ImgAPIClient();

// 插件安装时的初始化
chrome.runtime.onInstalled.addListener(async (details) => {
    console.log('Novel2Img 插件已安装');
    
    // 设置默认配置
    if (details.reason === 'install') {
        await setDefaultSettings();
    }
});

/**
 * 设置默认配置
 */
async function setDefaultSettings() {
    const defaultSettings = {
        // 自动下载功能已移除
        // autoDownload: true
    };
    
    try {
        await Novel2ImgUtils.storage.saveSettings(defaultSettings);
        console.log('✅ 默认设置已保存');
    } catch (error) {
        console.error('❌ 保存默认设置失败:', error);
    }
}

/**
 * 处理来自其他脚本的消息
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('收到消息:', request.action);
    
    // 异步处理消息
    handleMessage(request, sender, sendResponse);
    
    // 返回true表示会异步发送响应
    return true;
});

/**
 * 处理消息的异步函数
 */
async function handleMessage(request, sender, sendResponse) {
    try {
        switch (request.action) {
            case 'generateImage':
                await handleGenerateImage(request, sender, sendResponse);
                break;
                
            case 'validateApiKey':
                await handleValidateApiKey(request, sendResponse);
                break;
                
            case 'saveSettings':
                await handleSaveSettings(request, sendResponse);
                break;
                
            case 'getSettings':
                await handleGetSettings(request, sendResponse);
                break;
                
            case 'getHistory':
                await handleGetHistory(request, sendResponse);
                break;
                
            case 'deleteHistory':
                await handleDeleteHistory(request, sendResponse);
                break;
                
            case 'downloadImage':
                await handleDownloadImage(request, sendResponse);
                break;
                
            default:
                sendResponse({ success: false, error: '未知的操作' });
        }
    } catch (error) {
        console.error(`❌ 处理消息失败 (${request.action}):`, error);
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * 处理图片生成请求
 */
async function handleGenerateImage(request, sender, sendResponse) {
    const { prompt, options = {} } = request;
    const tabId = sender.tab?.id;
    
    try {
        // 验证提示词
        const validation = Novel2ImgUtils.validator.validatePrompt(prompt);
        if (!validation.valid) {
            throw new Error(validation.message);
        }
        
        // 验证图片尺寸
        if (options.size && !Novel2ImgUtils.validator.validateImageSize(options.size)) {
            throw new Error('不支持的图片尺寸');
        }
        
        // 生成图片
        const result = await generateImage(validation.prompt, options, tabId);
        
        sendResponse({ success: true, data: result });
    } catch (error) {
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * 处理API密钥验证
 */
async function handleValidateApiKey(request, sendResponse) {
    const { apiKey } = request;
    
    try {
        // 格式验证
        const validation = Novel2ImgUtils.validator.validateApiKey(apiKey);
        if (!validation.valid) {
            sendResponse({ success: false, error: validation.message });
            return;
        }
        
        // API验证
        const isValid = await apiClient.validateApiKey(validation.apiKey);
        
        if (isValid) {
            // 保存有效的API密钥
            await Novel2ImgUtils.storage.saveSettings({ apiKey: validation.apiKey });
            apiClient.setApiKey(validation.apiKey);
            sendResponse({ success: true, message: 'API密钥验证成功' });
        } else {
            sendResponse({ success: false, error: 'API密钥无效，请检查密钥是否正确' });
        }
    } catch (error) {
        sendResponse({ success: false, error: '验证API密钥时发生错误' });
    }
}

/**
 * 处理保存设置
 */
async function handleSaveSettings(request, sendResponse) {
    const { settings } = request;
    
    try {
        await Novel2ImgUtils.storage.saveSettings(settings);
        sendResponse({ success: true, message: '设置已保存' });
    } catch (error) {
        sendResponse({ success: false, error: '保存设置失败' });
    }
}

/**
 * 处理获取设置
 */
async function handleGetSettings(request, sendResponse) {
    const { keys } = request;
    
    try {
        const settings = await Novel2ImgUtils.storage.getSettings(keys);
        sendResponse({ success: true, data: settings });
    } catch (error) {
        sendResponse({ success: false, error: '获取设置失败' });
    }
}

/**
 * 处理获取历史记录
 */
async function handleGetHistory(request, sendResponse) {
    try {
        const history = await Novel2ImgUtils.storage.getHistory();
        sendResponse({ success: true, data: history });
    } catch (error) {
        sendResponse({ success: false, error: '获取历史记录失败' });
    }
}

/**
 * 处理删除历史记录
 */
async function handleDeleteHistory(request, sendResponse) {
    const { recordId } = request;
    
    try {
        await Novel2ImgUtils.storage.deleteHistoryRecord(recordId);
        sendResponse({ success: true, message: '历史记录已删除' });
    } catch (error) {
        sendResponse({ success: false, error: '删除历史记录失败' });
    }
}

/**
 * 处理下载单张图片
 */
async function handleDownloadImage(request, sendResponse) {
    const { imageUrl, filename } = request;
    
    try {
        if (!imageUrl) {
            throw new Error('图片URL不能为空');
        }
        
        const downloadId = await apiClient.downloadImage(imageUrl, filename);
        
        sendResponse({ 
            success: true, 
            data: { downloadId, filename },
            message: '图片下载开始' 
        });
    } catch (error) {
        console.error('❗ 下载图片失败:', error);
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * 核心图片生成函数
 */
async function generateImage(prompt, options = {}, tabId = null) {
    console.log('🎨 开始生成图片');
    console.log('📝 提示词:', prompt);
    console.log('🔧 选项:', options);
    
    const startTime = Date.now();
    
    try {
        // 通知开始生成
        if (tabId) {
            chrome.tabs.sendMessage(tabId, {
                action: 'generationStarted',
                prompt: prompt,
                options: options
            });
        }
        
        // 调用API生成图片
        const imageUrls = await apiClient.generateImageAsync(prompt, options);
        
        if (!imageUrls || imageUrls.length === 0) {
            throw new Error('未生成任何图片');
        }
        
        // 不再自动下载，留给用户选择
        const totalTime = Date.now() - startTime;
        console.log(`⏱️ 总耗时: ${(totalTime / 1000).toFixed(1)}秒`);
        console.log(`🎉 成功生成 ${imageUrls.length} 张图片！`);
        
        // 保存到历史记录
        await Novel2ImgUtils.storage.saveHistory({
            prompt: prompt,
            options: options,
            imageUrls: imageUrls,
            duration: totalTime,
            status: 'success'
        });
        
        // 通知生成完成
        if (tabId) {
            chrome.tabs.sendMessage(tabId, {
                action: 'generationCompleted',
                result: {
                    prompt: prompt,
                    imageUrls: imageUrls,
                    duration: totalTime
                }
            });
        }
        
        return {
            prompt: prompt,
            imageUrls: imageUrls,
            duration: totalTime
        };
        
    } catch (error) {
        console.error('❌ 图片生成失败:', error);
        
        // 保存失败记录
        await Novel2ImgUtils.storage.saveHistory({
            prompt: prompt,
            options: options,
            error: error.message,
            duration: Date.now() - startTime,
            status: 'failed'
        });
        
        // 通知生成失败
        if (tabId) {
            chrome.tabs.sendMessage(tabId, {
                action: 'generationFailed',
                error: error.message
            });
        }
        
        throw error;
    }
}

console.log('Novel2Img Background Script 已加载');