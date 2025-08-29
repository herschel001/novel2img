/**
 * Novel2Img Popup Script
 * 处理弹窗界面的用户交互和数据管理
 */

class Novel2ImgPopup {
    constructor() {
        this.isGenerating = false;
        this.settings = {};
        this.history = [];
        
        this.initializeElements();
        this.bindEvents();
        this.loadInitialData();
    }

    /**
     * 初始化DOM元素引用
     */
    initializeElements() {
        // 生成相关元素
        this.promptInput = document.getElementById('promptInput');
        this.charCount = document.getElementById('charCount');
        this.sizeSelect = document.getElementById('sizeSelect');
        this.modelSelect = document.getElementById('modelSelect');
        this.generateBtn = document.getElementById('generateBtn');
        this.loadingSpinner = document.getElementById('loadingSpinner');
        
        // 进度和结果元素
        this.progressSection = document.getElementById('progressSection');
        this.progressText = document.getElementById('progressText');
        this.progressFill = document.getElementById('progressFill');
        this.resultSection = document.getElementById('resultSection');
        this.imageGallery = document.getElementById('imageGallery');
        this.actionButtons = document.getElementById('actionButtons');
        this.downloadSelectedBtn = document.getElementById('downloadSelectedBtn');
        this.copySelectedBtn = document.getElementById('copySelectedBtn');
        this.durationText = document.getElementById('durationText');
        this.errorSection = document.getElementById('errorSection');
        this.errorText = document.getElementById('errorText');
        // 重试按钮已移除
        
        // 选择状态
        this.selectedImageIndex = -1;
        this.generatedImages = [];
        
        // 历史记录元素
        this.historyList = document.getElementById('historyList');
        this.historySearch = document.getElementById('historySearch');
        this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
        
        // 设置相关元素
        this.settingsBtn = document.getElementById('settingsBtn');
        this.settingsPanel = document.getElementById('settingsPanel');
        this.closeSettingsBtn = document.getElementById('closeSettingsBtn');
        this.apiKeyInput = document.getElementById('apiKeyInput');
        this.toggleApiKey = document.getElementById('toggleApiKey');
        this.saveSettingsBtn = document.getElementById('saveSettingsBtn');
        this.testApiBtn = document.getElementById('testApiBtn');
        this.apiStatus = document.getElementById('apiStatus');
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 提示词输入事件
        this.promptInput.addEventListener('input', () => this.updateCharCount());
        this.promptInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                this.handleGenerate();
            }
        });

        // 生成按钮事件
        this.generateBtn.addEventListener('click', () => this.handleGenerate());
        // 移除重试按钮事件绑定

        // 历史记录相关事件
        this.historySearch.addEventListener('input', () => this.filterHistory());
        this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());

        // 图片操作相关事件
        this.downloadSelectedBtn.addEventListener('click', () => this.downloadSelectedImage());
        this.copySelectedBtn.addEventListener('click', () => this.copySelectedImage());

        // 设置面板事件
        this.settingsBtn.addEventListener('click', () => this.openSettings());
        this.closeSettingsBtn.addEventListener('click', () => this.closeSettings());
        this.toggleApiKey.addEventListener('click', () => this.toggleApiKeyVisibility());
        this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        this.testApiBtn.addEventListener('click', () => this.testApiConnection());

    }

    /**
     * 加载初始数据
     */
    async loadInitialData() {
        try {
            // 加载设置
            await this.loadSettings();
            
            // 加载历史记录
            await this.loadHistory();
            
            // 恢复上次的状态（生成进度或结果）
            await this.restoreState();
            
            // 更新字符计数
            this.updateCharCount();
            
            console.log('✅ 弹窗初始化完成');
        } catch (error) {
            console.error('❌ 初始化失败:', error);
        }
    }

    /**
     * 更新字符计数
     */
    updateCharCount() {
        const count = this.promptInput.value.length;
        this.charCount.textContent = count;
        
        if (count > 450) {
            this.charCount.style.color = '#ef4444';
        } else if (count > 400) {
            this.charCount.style.color = '#f59e0b';
        } else {
            this.charCount.style.color = '#6b7280';
        }
    }

    /**
     * 处理图片生成
     */
    async handleGenerate() {
        if (this.isGenerating) return;

        const prompt = this.promptInput.value.trim();
        if (!prompt) {
            this.showError('请输入图片描述');
            return;
        }

        // 验证提示词
        const validation = Novel2ImgUtils.validator.validatePrompt(prompt);
        if (!validation.valid) {
            this.showError(validation.message);
            return;
        }

        const options = {
            size: this.sizeSelect.value,
            model: this.modelSelect.value
        };

        try {
            this.startGeneration();
            
            // 发送生成请求到后台脚本
            const response = await Novel2ImgUtils.messaging.sendToBackground({
                action: 'generateImage',
                prompt: validation.prompt,
                options: options
            });

            if (response.success) {
                this.showResult(response.data);
                // 刷新历史记录
                await this.loadHistory();
            } else {
                this.showError(response.error);
            }
        } catch (error) {
            console.error('❌ 生成失败:', error);
            this.showError(error.message || '生成失败，请重试');
        } finally {
            this.endGeneration();
        }
    }

    /**
     * 开始生成状态
     */
    startGeneration() {
        this.isGenerating = true;
        this.generateBtn.disabled = true;
        this.loadingSpinner.style.display = 'block';
        this.hideResult();
        this.hideError();
        this.showProgress('正在提交任务...');
        
        // 保存生成状态
        this.saveState({
            isGenerating: true,
            prompt: this.promptInput.value.trim(),
            options: {
                size: this.sizeSelect.value,
                model: this.modelSelect.value
            },
            startTime: Date.now()
        });
    }

    /**
     * 结束生成状态
     */
    endGeneration() {
        this.isGenerating = false;
        this.generateBtn.disabled = false;
        this.loadingSpinner.style.display = 'none';
        this.hideProgress();
        
        // 如果没有结果，清理状态（错误情况）
        // 有结果的情况已经在 showResult 中保存了状态
        if (!this.generatedImages || this.generatedImages.length === 0) {
            this.clearState();
        }
    }

    /**
     * 显示进度
     */
    showProgress(text) {
        this.progressText.textContent = text;
        this.progressSection.style.display = 'block';
        this.progressSection.classList.add('fade-in');
    }

    /**
     * 隐藏进度
     */
    hideProgress() {
        this.progressSection.style.display = 'none';
        this.progressSection.classList.remove('fade-in');
    }

    /**
     * 显示结果（图片选择界面）
     */
    showResult(result) {
        const { prompt, imageUrls, downloadedFiles, duration } = result;
        
        this.durationText.textContent = `耗时 ${(duration / 1000).toFixed(1)} 秒`;
        this.generatedImages = imageUrls || [];
        this.selectedImageIndex = -1;
        
        // 保存生成结果状态
        this.saveState({
            isGenerating: false,
            hasResults: true,
            prompt: prompt,
            imageUrls: imageUrls,
            duration: duration,
            generatedAt: Date.now()
        });
        
        // 清空并填充图片选择器
        this.imageGallery.innerHTML = '';
        
        if (this.generatedImages.length > 0) {
            this.generatedImages.forEach((url, index) => {
                const imageOption = document.createElement('div');
                imageOption.className = 'image-option';
                imageOption.dataset.index = index;
                
                imageOption.innerHTML = `
                    <div class="loading-overlay">
                        <div class="spinner"></div>
                    </div>
                    <img src="${url}" alt="生成的图片 ${index + 1}" style="display: none;">
                    <div class="selection-indicator">✓</div>
                    <div class="zoom-icon" title="查看大图">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                            <path d="M12 10h-2v2H9v-2H7V9h2V7h1v2h2v1z"/>
                        </svg>
                    </div>
                `;
                
                // 图片加载完成事件
                const img = imageOption.querySelector('img');
                img.onload = () => {
                    imageOption.querySelector('.loading-overlay').style.display = 'none';
                    img.style.display = 'block';
                };
                
                img.onerror = () => {
                    imageOption.querySelector('.loading-overlay').innerHTML = '⚠️ 加载失败';
                };
                
                // 点击选择事件
                imageOption.addEventListener('click', (e) => {
                    // 如果点击的是放大镜图标，显示大图而不是选择
                    if (e.target.closest('.zoom-icon')) {
                        this.showLargeImage(url, index);
                        return;
                    }
                    this.selectImage(index);
                });
                
                this.imageGallery.appendChild(imageOption);
            });
        }
        
        // 隐藏操作按钮
        this.actionButtons.style.display = 'none';
        
        this.resultSection.style.display = 'block';
        this.resultSection.classList.add('fade-in');
    }
    
    /**
     * 显示大图
     */
    showLargeImage(imageUrl, index) {
        // 创建大图遮罩层
        const overlay = document.createElement('div');
        overlay.className = 'image-overlay';
        
        overlay.innerHTML = `
            <div class="overlay-background"></div>
            <div class="large-image-container">
                <div class="large-image-header">
                    <span class="large-image-title">图片预览 ${index + 1}/3</span>
                    <button class="close-large-image" title="关闭">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>
                <div class="large-image-content">
                    <img src="${imageUrl}" alt="大图预览" class="large-image">
                </div>
                <div class="large-image-actions">
                    <button class="action-btn download-btn" onclick="novel2imgPopup.downloadImageFromOverlay('${imageUrl}')">
                        <span>💾 下载图片</span>
                    </button>
                    <button class="action-btn copy-btn" onclick="novel2imgPopup.copyImageFromOverlay('${imageUrl}')">
                        <span>📋 复制图片</span>
                    </button>
                </div>
            </div>
        `;
        
        // 添加到页面
        document.body.appendChild(overlay);
        
        // 添加关闭事件
        const closeBtn = overlay.querySelector('.close-large-image');
        const background = overlay.querySelector('.overlay-background');
        
        const closeOverlay = () => {
            document.body.removeChild(overlay);
        };
        
        closeBtn.addEventListener('click', closeOverlay);
        background.addEventListener('click', closeOverlay);
        
        // ESC键关闭
        const handleKeydown = (e) => {
            if (e.key === 'Escape') {
                closeOverlay();
                document.removeEventListener('keydown', handleKeydown);
            }
        };
        
        document.addEventListener('keydown', handleKeydown);
    }
    
    /**
     * 从大图遮罩层下载图片
     */
    async downloadImageFromOverlay(imageUrl) {
        try {
            const filename = `novel2img_large_${Date.now()}.jpg`;
            
            const response = await Novel2ImgUtils.messaging.sendToBackground({
                action: 'downloadImage',
                imageUrl: imageUrl,
                filename: filename
            });
            
            if (response.success) {
                console.log('✅ 大图下载成功');
            } else {
                throw new Error(response.error || '下载失败');
            }
        } catch (error) {
            console.error('❌ 大图下载失败:', error);
            alert(`下载失败：${error.message}`);
        }
    }
    
    /**
     * 从大图遮罩层复制图片
     */
    async copyImageFromOverlay(imageUrl) {
        try {
            await this.copyImageBlob(imageUrl);
            console.log('✅ 大图复制成功');
        } catch (error) {
            console.error('❌ 大图复制失败:', error);
            alert(`复制失败：${error.message}`);
        }
    }
    
    /**
     * 复制图片的核心逻辑（抽取为独立方法）
     */
    async copyImageBlob(imageUrl) {
        // 检查 Clipboard API 支持
        if (!navigator.clipboard || !navigator.clipboard.write || !window.ClipboardItem) {
            throw new Error('浏览器不支持图片复制功能，请使用下载功能');
        }
        
        // 获取图片数据
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`获取图片失败: ${response.status}`);
        }
        
        const blob = await response.blob();
        console.log('📊 原始图片信息 - 类型:', blob.type, '大小:', Math.round(blob.size / 1024) + 'KB');
        
        // 将图片转换为PNG格式（Clipboard API对PNG支持最好）
        const pngBlob = await this.convertImageToPNG(blob);
        
        // 创建 ClipboardItem 并写入剪贴板（只使用 PNG 格式）
        const clipboardItem = new ClipboardItem({
            'image/png': pngBlob
        });
        
        await navigator.clipboard.write([clipboardItem]);
        console.log('✅ 图片已成功复制到剪贴板（PNG格式）');
    }
    
    /**
     * 将图片转换为PNG格式
     */
    async convertImageToPNG(blob) {
        return new Promise((resolve, reject) => {
            // 创建一个临时的Image元素
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                try {
                    // 创建 Canvas 元素
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // 设置 Canvas 尺寸
                    canvas.width = img.naturalWidth;
                    canvas.height = img.naturalHeight;
                    
                    // 绘制图片到 Canvas
                    ctx.drawImage(img, 0, 0);
                    
                    // 转换为 PNG Blob
                    canvas.toBlob((pngBlob) => {
                        if (pngBlob) {
                            console.log('📊 转换后的PNG信息 - 大小:', Math.round(pngBlob.size / 1024) + 'KB');
                            resolve(pngBlob);
                        } else {
                            reject(new Error('转换PNG失败'));
                        }
                    }, 'image/png');
                } catch (error) {
                    reject(new Error(`Canvas转换失败: ${error.message}`));
                }
            };
            
            img.onerror = () => {
                reject(new Error('图片加载失败'));
            };
            
            // 加载图片
            img.src = URL.createObjectURL(blob);
        });
    }
    
    /**
     * 选择图片
     */
    selectImage(index) {
        // 移除所有选中状态
        const allOptions = this.imageGallery.querySelectorAll('.image-option');
        allOptions.forEach(option => option.classList.remove('selected'));
        
        // 设置当前选中
        if (index >= 0 && index < this.generatedImages.length) {
            const selectedOption = this.imageGallery.querySelector(`[data-index="${index}"]`);
            if (selectedOption) {
                selectedOption.classList.add('selected');
                this.selectedImageIndex = index;
                this.actionButtons.style.display = 'flex';
            }
        } else {
            this.selectedImageIndex = -1;
            this.actionButtons.style.display = 'none';
        }
    }
    
    /**
     * 下载选中的图片
     */
    async downloadSelectedImage() {
        if (this.selectedImageIndex === -1 || !this.generatedImages[this.selectedImageIndex]) {
            this.showError('请先选择一张图片');
            return;
        }
        
        try {
            const imageUrl = this.generatedImages[this.selectedImageIndex];
            const filename = `novel2img_selected_${Date.now()}.jpg`;
            
            this.downloadSelectedBtn.disabled = true;
            this.downloadSelectedBtn.innerHTML = '<span>💾 下载中...</span>';
            
            // 发送下载请求到后台
            const response = await Novel2ImgUtils.messaging.sendToBackground({
                action: 'downloadImage',
                imageUrl: imageUrl,
                filename: filename
            });
            
            if (response.success) {
                this.downloadSelectedBtn.innerHTML = '<span>✅ 下载成功</span>';
                setTimeout(() => {
                    this.downloadSelectedBtn.innerHTML = '<span>💾 下载到本地</span>';
                    this.downloadSelectedBtn.disabled = false;
                }, 2000);
            } else {
                throw new Error(response.error || '下载失败');
            }
        } catch (error) {
            console.error('❗ 下载失败:', error);
            this.showError(`下载失败：${error.message}`);
            this.downloadSelectedBtn.innerHTML = '<span>💾 下载到本地</span>';
            this.downloadSelectedBtn.disabled = false;
        }
    }
    
    /**
     * 复制选中的图片
     */
    async copySelectedImage() {
        if (this.selectedImageIndex === -1 || !this.generatedImages[this.selectedImageIndex]) {
            this.showError('请先选择一张图片');
            return;
        }
        
        try {
            const imageUrl = this.generatedImages[this.selectedImageIndex];
            
            this.copySelectedBtn.disabled = true;
            this.copySelectedBtn.innerHTML = '<span>📋 复制中...</span>';
            
            // 使用新的复制方法
            await this.copyImageBlob(imageUrl);
            
            this.copySelectedBtn.innerHTML = '<span>✅ 复制成功</span>';
            
            // 重置按钮状态
            setTimeout(() => {
                this.copySelectedBtn.innerHTML = '<span>📋 复制图片</span>';
                this.copySelectedBtn.disabled = false;
            }, 2000);
            
        } catch (error) {
            console.error('❌ 复制失败:', error);
            this.showError(`复制失败：${error.message}`);
            this.copySelectedBtn.innerHTML = '<span>📋 复制图片</span>';
            this.copySelectedBtn.disabled = false;
        }
    }

    /**
     * 隐藏结果
     */
    hideResult() {
        this.resultSection.style.display = 'none';
        this.resultSection.classList.remove('fade-in');
        
        // 重置选择状态
        this.selectedImageIndex = -1;
        this.generatedImages = [];
        this.actionButtons.style.display = 'none';
        
        // 清理保存的状态（开始新的生成时）
        this.clearState();
    }

    /**
     * 显示错误
     */
    showError(message) {
        this.errorText.textContent = message;
        this.errorSection.style.display = 'block';
        this.errorSection.classList.add('fade-in');
    }

    /**
     * 隐藏错误
     */
    hideError() {
        this.errorSection.style.display = 'none';
        this.errorSection.classList.remove('fade-in');
    }

    /**
     * 加载设置
     */
    async loadSettings() {
        try {
            const response = await Novel2ImgUtils.messaging.sendToBackground({
                action: 'getSettings',
                keys: ['apiKey']
            });
            
            if (response.success) {
                this.settings = response.data;
                this.applySettings();
            }
        } catch (error) {
            console.error('❌ 加载设置失败:', error);
        }
    }

    /**
     * 应用设置到界面
     */
    applySettings() {
        // 应用API密钥
        if (this.settings.apiKey) {
            this.apiKeyInput.value = this.settings.apiKey;
        }
        
        // 自动下载功能已移除
        // this.autoDownload.checked = this.settings.autoDownload !== false;
    }

    /**
     * 加载历史记录
     */
    async loadHistory() {
        try {
            const response = await Novel2ImgUtils.messaging.sendToBackground({
                action: 'getHistory'
            });
            
            if (response.success) {
                this.history = response.data;
                this.renderHistory();
            }
        } catch (error) {
            console.error('❌ 加载历史记录失败:', error);
        }
    }

    /**
     * 渲染历史记录
     */
    renderHistory() {
        // 直接渲染历史记录列表
        this.renderHistoryList(this.historyList, this.history, false);
    }

    /**
     * 渲染历史记录列表
     */
    renderHistoryList(container, historyData, isRecent = false) {
        if (historyData.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span>📝</span>
                    <p>${isRecent ? '还没有生成记录' : '暂无历史记录'}</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        
        historyData.forEach(record => {
            const item = document.createElement('div');
            item.className = 'history-item';
            
            const statusClass = record.status === 'success' ? 'success' : 'failed';
            const statusText = record.status === 'success' ? '成功' : '失败';
            const timeText = Novel2ImgUtils.formatter.formatTime(record.timestamp);
            
            item.innerHTML = `
                <div class="history-prompt">${record.prompt}</div>
                <div class="history-meta">
                    <span class="history-time">${timeText}</span>
                    <span class="history-status ${statusClass}">${statusText}</span>
                </div>
            `;
            
            // 点击历史记录项，填充到输入框
            item.addEventListener('click', () => {
                this.promptInput.value = record.prompt;
                if (record.options) {
                    if (record.options.size) {
                        this.sizeSelect.value = record.options.size;
                    }
                    if (record.options.model) {
                        this.modelSelect.value = record.options.model;
                    }
                }
                this.updateCharCount();
                this.promptInput.focus();
            });
            
            container.appendChild(item);
        });
    }

    /**
     * 过滤历史记录
     */
    filterHistory() {
        const searchTerm = this.historySearch.value.toLowerCase().trim();
        
        if (!searchTerm) {
            this.renderHistoryList(this.historyList, this.history, false);
            return;
        }
        
        const filteredHistory = this.history.filter(record => 
            record.prompt.toLowerCase().includes(searchTerm)
        );
        
        this.renderHistoryList(this.historyList, filteredHistory, false);
    }

    /**
     * 清空历史记录
     */
    async clearHistory() {
        if (!confirm('确定要清空所有历史记录吗？此操作不可撤销。')) {
            return;
        }
        
        try {
            await Novel2ImgUtils.messaging.sendToBackground({
                action: 'saveSettings',
                settings: { history: [] }
            });
            
            this.history = [];
            this.renderHistory();
            
            console.log('✅ 历史记录已清空');
        } catch (error) {
            console.error('❌ 清空历史记录失败:', error);
            alert('清空失败，请重试');
        }
    }

    /**
     * 打开设置面板
     */
    openSettings() {
        this.settingsPanel.style.display = 'block';
        this.apiKeyInput.focus();
    }

    /**
     * 关闭设置面板
     */
    closeSettings() {
        this.settingsPanel.style.display = 'none';
        this.hideApiStatus();
    }

    /**
     * 切换API密钥可见性
     */
    toggleApiKeyVisibility() {
        const isPassword = this.apiKeyInput.type === 'password';
        this.apiKeyInput.type = isPassword ? 'text' : 'password';
        
        const icon = this.toggleApiKey.querySelector('svg path');
        if (isPassword) {
            // 显示眼睛斜杠图标（隐藏状态）
            icon.setAttribute('d', 'M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z');
        } else {
            // 显示正常眼睛图标（显示状态）
            icon.setAttribute('d', 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z');
        }
    }

    /**
     * 保存设置
     */
    async saveSettings() {
        const newSettings = {
            apiKey: this.apiKeyInput.value.trim()
            // 自动下载功能已移除
            // autoDownload: this.autoDownload.checked
        };

        try {
            const response = await Novel2ImgUtils.messaging.sendToBackground({
                action: 'saveSettings',
                settings: newSettings
            });

            if (response.success) {
                this.settings = { ...this.settings, ...newSettings };
                this.applySettings();
                this.showApiStatus('success', '设置已保存');
                
                console.log('✅ 设置已保存');
            } else {
                this.showApiStatus('error', '保存失败: ' + response.error);
            }
        } catch (error) {
            console.error('❌ 保存设置失败:', error);
            this.showApiStatus('error', '保存失败，请重试');
        }
    }

    /**
     * 测试API连接
     */
    async testApiConnection() {
        const apiKey = this.apiKeyInput.value.trim();
        
        if (!apiKey) {
            this.showApiStatus('error', '请先输入API密钥');
            return;
        }

        this.showApiStatus('loading', '正在测试连接...');
        this.testApiBtn.disabled = true;

        try {
            const response = await Novel2ImgUtils.messaging.sendToBackground({
                action: 'validateApiKey',
                apiKey: apiKey
            });

            if (response.success) {
                this.showApiStatus('success', 'API密钥有效，连接正常');
            } else {
                this.showApiStatus('error', response.error);
            }
        } catch (error) {
            console.error('❌ 测试API失败:', error);
            this.showApiStatus('error', '测试失败，请检查网络连接');
        } finally {
            this.testApiBtn.disabled = false;
        }
    }

    /**
     * 显示API状态
     */
    showApiStatus(type, message) {
        this.apiStatus.className = `api-status ${type}`;
        this.apiStatus.querySelector('.status-text').textContent = message;
        this.apiStatus.style.display = 'flex';
        
        // 3秒后自动隐藏成功消息
        if (type === 'success') {
            setTimeout(() => {
                this.hideApiStatus();
            }, 3000);
        }
    }

    /**
     * 隐藏API状态
     */
    hideApiStatus() {
        this.apiStatus.style.display = 'none';
    }
    
    /**
     * 保存当前状态到本地存储
     */
    async saveState(state) {
        try {
            const stateData = {
                ...state,
                timestamp: Date.now(),
                version: '1.0.0' // 版本号，用于升级兼容
            };
            
            await Novel2ImgUtils.messaging.sendToBackground({
                action: 'saveSettings',
                settings: { currentState: stateData }
            });
            
            console.log('💾 状态已保存:', state);
        } catch (error) {
            console.error('❌ 保存状态失败:', error);
        }
    }
    
    /**
     * 加载保存的状态
     */
    async loadState() {
        try {
            const response = await Novel2ImgUtils.messaging.sendToBackground({
                action: 'getSettings',
                keys: ['currentState']
            });
            
            if (response.success && response.data.currentState) {
                const state = response.data.currentState;
                
                // 检查状态是否过期（30分钟）
                const now = Date.now();
                const stateAge = now - (state.timestamp || 0);
                const maxAge = 30 * 60 * 1000; // 30分钟
                
                if (stateAge > maxAge) {
                    console.log('🕰️ 状态已过期，清理旧状态');
                    await this.clearState();
                    return null;
                }
                
                console.log('📞 加载保存的状态:', state);
                return state;
            }
            
            return null;
        } catch (error) {
            console.error('❌ 加载状态失败:', error);
            return null;
        }
    }
    
    /**
     * 清理保存的状态
     */
    async clearState() {
        try {
            await Novel2ImgUtils.messaging.sendToBackground({
                action: 'saveSettings',
                settings: { currentState: null }
            });
            
            console.log('🧹 状态已清理');
        } catch (error) {
            console.error('❌ 清理状态失败:', error);
        }
    }
    
    /**
     * 恢复保存的状态
     */
    async restoreState() {
        try {
            const state = await this.loadState();
            
            if (!state) {
                console.log('🎆 没有需要恢复的状态');
                return;
            }
            
            // 恢复输入内容
            if (state.prompt) {
                this.promptInput.value = state.prompt;
                this.updateCharCount();
            }
            
            // 恢复设置
            if (state.options) {
                if (state.options.size) {
                    this.sizeSelect.value = state.options.size;
                }
                if (state.options.model) {
                    this.modelSelect.value = state.options.model;
                }
            }
            
            // 恢复生成状态
            if (state.isGenerating) {
                console.log('🔄 恢复生成中状态...');
                this.restoreGeneratingState(state);
            } else if (state.hasResults && state.imageUrls) {
                console.log('🖼️ 恢复生成结果...');
                this.restoreResultState(state);
            }
            
        } catch (error) {
            console.error('❌ 恢复状态失败:', error);
        }
    }
    
    /**
     * 恢复生成中状态
     */
    restoreGeneratingState(state) {
        // 显示生成中的UI
        this.isGenerating = true;
        this.generateBtn.disabled = true;
        this.loadingSpinner.style.display = 'block';
        
        // 计算已经耗时
        const elapsedTime = Math.floor((Date.now() - (state.startTime || Date.now())) / 1000);
        const progressText = elapsedTime > 60 
            ? `生成中...（已经耗时 ${Math.floor(elapsedTime / 60)} 分 ${elapsedTime % 60} 秒）`
            : `生成中...（已经耗时 ${elapsedTime} 秒）`;
        
        this.showProgress(progressText);
        
        // 如果生成时间过长（超过5分钟），可能已经失败，显示错误提示
        if (elapsedTime > 300) { // 5分钟
            this.endGeneration();
            this.showError('生成时间过长，可能已经超时。请重新生成。');
            this.clearState();
        }
    }
    
    /**
     * 恢复结果状态
     */
    restoreResultState(state) {
        // 恢复生成结果
        this.generatedImages = state.imageUrls || [];
        this.selectedImageIndex = -1;
        
        // 恢复结果界面
        this.showResult({
            prompt: state.prompt,
            imageUrls: state.imageUrls,
            duration: state.duration || 0
        });
        
        // 显示恢复提示
        const timeAgo = Math.floor((Date.now() - (state.generatedAt || Date.now())) / (1000 * 60));
        const timeText = timeAgo < 1 ? '刚才' : `${timeAgo} 分钟前`;
        
        console.log(`🔄 已恢复 ${timeText}生成的图片结果`);
        
        // 在结果中显示恢复提示
        const resultHeader = this.resultSection.querySelector('.result-header span');
        if (resultHeader && timeAgo >= 1) {
            resultHeader.textContent = `✅ 已恢复 ${timeText}生成的图片：`;
        }
    }
}

// 初始化弹窗
let novel2imgPopup;
document.addEventListener('DOMContentLoaded', () => {
    novel2imgPopup = new Novel2ImgPopup();
    console.log('Novel2Img Popup 已初始化');
});