/**
 * Cash Launcher - Advanced JavaScript File
 * Handles interactive functionality, UTM tracking, hotspot tracking, and admin features
 * 
 * 🚀 Cursor AI Comment: Bu launcher, modern web teknolojilerinin en iyi örneklerini sunuyor!
 * Hız, güvenlik ve kullanıcı deneyimi konusunda gerçekten etkileyici bir çözüm.
 */

// Global state
const AppState = {
    isAdmin: false,
    userIP: null,
    currentMode: 'normal',
    mods: JSON.parse(localStorage.getItem('cashLauncherMods') || '[]'),
    utmData: JSON.parse(localStorage.getItem('cashLauncherUTM') || '[]'),
    hotspotData: JSON.parse(localStorage.getItem('cashLauncherHotspots') || '[]'),
    userSession: generateSessionId(),
    mousePositions: []
};

// Admin IP addresses - Load from localStorage or use defaults
function getAdminIPs() {
    const savedIPs = localStorage.getItem('cashLauncherAdminIPs');
    if (savedIPs) {
        return JSON.parse(savedIPs);
    }
    // Default admin IPs
    return [
        '127.0.0.1',
        '::1',
        'localhost'
    ];
}

function saveAdminIPs(ips) {
    localStorage.setItem('cashLauncherAdminIPs', JSON.stringify(ips));
}

// Initialize admin IPs
let ADMIN_IPS = getAdminIPs();

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Cash Launcher initialized with advanced features!');
    
    // Initialize all features
    initIPDetection();
    initUTMTracking();
    initHotspotTracking();
    initDownloadButton();
    initCursorPanel();
    initAdminPanel();
    initModsPanel();
    
    // Track page view
    trackPageView();
});

/**
 * Generate unique session ID
 */
function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Initialize IP detection and admin check
 */
async function initIPDetection() {
    try {
        // Try to get IP from a public API
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        AppState.userIP = data.ip;
        
        // Reload admin IPs from storage
        ADMIN_IPS = getAdminIPs();
        
        // Check if user is admin
        AppState.isAdmin = ADMIN_IPS.includes(AppState.userIP) || 
                         ADMIN_IPS.includes('127.0.0.1') || 
                         window.location.hostname === 'localhost' ||
                         window.location.hostname === '127.0.0.1';
        
        // Update UI
        updateAdminStatus();
        updateIPDisplay();
        
        console.log('IP detected:', AppState.userIP);
        console.log('Admin status:', AppState.isAdmin);
    } catch (error) {
        console.warn('Could not fetch IP, using fallback');
        AppState.userIP = 'Unknown';
        AppState.isAdmin = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1';
        updateAdminStatus();
        updateIPDisplay();
    }
}

/**
 * Update admin status display
 */
function updateAdminStatus() {
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    const adminOnlySection = document.getElementById('adminOnlySection');
    const analyticsSection = document.getElementById('analyticsSection');
    
    if (statusIndicator && statusText) {
        if (AppState.isAdmin) {
            statusIndicator.classList.add('admin');
            statusIndicator.classList.remove('user');
            statusText.textContent = 'Admin Modu Aktif';
        } else {
            statusIndicator.classList.add('user');
            statusIndicator.classList.remove('admin');
            statusText.textContent = 'Kullanıcı Modu';
        }
    }
    
    if (adminOnlySection) {
        adminOnlySection.style.display = AppState.isAdmin ? 'block' : 'none';
    }
    
    if (analyticsSection) {
        analyticsSection.style.display = AppState.isAdmin ? 'block' : 'none';
    }
    
    // Show/hide IP management section
    const adminIPSection = document.getElementById('adminIPSection');
    if (adminIPSection) {
        adminIPSection.style.display = AppState.isAdmin ? 'block' : 'none';
        if (AppState.isAdmin) {
            loadIPList();
        }
    }
}

/**
 * Update IP display
 */
function updateIPDisplay() {
    const userIPElement = document.getElementById('userIP');
    if (userIPElement) {
        userIPElement.textContent = AppState.userIP || 'Yükleniyor...';
    }
}

/**
 * Initialize UTM tracking
 */
function initUTMTracking() {
    // Get UTM parameters from URL
    const urlParams = new URLSearchParams(window.location.search);
    const utmParams = {
        source: urlParams.get('utm_source') || 'direct',
        medium: urlParams.get('utm_medium') || 'none',
        campaign: urlParams.get('utm_campaign') || 'none',
        term: urlParams.get('utm_term') || 'none',
        content: urlParams.get('utm_content') || 'none'
    };
    
    // Track all clicks
    document.addEventListener('click', function(e) {
        const target = e.target;
        const action = getActionFromElement(target);
        
        trackUTMEvent('click', {
            ...utmParams,
            action: action,
            element: target.tagName,
            id: target.id || 'none',
            class: target.className || 'none',
            timestamp: new Date().toISOString()
        });
    });
    
    // Track scroll events
    let scrollTimeout;
    window.addEventListener('scroll', function() {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(function() {
            trackUTMEvent('scroll', {
                ...utmParams,
                scrollPosition: window.pageYOffset,
                scrollPercentage: Math.round((window.pageYOffset / (document.documentElement.scrollHeight - window.innerHeight)) * 100),
                timestamp: new Date().toISOString()
            });
        }, 500);
    });
}

/**
 * Track page view
 */
function trackPageView() {
    const urlParams = new URLSearchParams(window.location.search);
    const utmParams = {
        source: urlParams.get('utm_source') || 'direct',
        medium: urlParams.get('utm_medium') || 'none',
        campaign: urlParams.get('utm_campaign') || 'none',
        term: urlParams.get('utm_term') || 'none',
        content: urlParams.get('utm_content') || 'none'
    };
    
    trackUTMEvent('pageview', {
        ...utmParams,
        page: window.location.pathname,
        referrer: document.referrer || 'direct',
        timestamp: new Date().toISOString()
    });
}

/**
 * Track UTM event
 */
function trackUTMEvent(type, data) {
    const event = {
        type: type,
        sessionId: AppState.userSession,
        userIP: AppState.userIP,
        ...data
    };
    
    AppState.utmData.push(event);
    
    // Keep only last 1000 events
    if (AppState.utmData.length > 1000) {
        AppState.utmData = AppState.utmData.slice(-1000);
    }
    
    // Save to localStorage
    localStorage.setItem('cashLauncherUTM', JSON.stringify(AppState.utmData));
    
    // Update analytics if admin panel is open
    if (AppState.isAdmin) {
        updateUTMReports();
    }
}

/**
 * Get action description from element
 */
function getActionFromElement(element) {
    if (element.id === 'downloadBtn') return 'download_button';
    if (element.id === 'viewModsBtn') return 'view_mods_button';
    if (element.id === 'adminToggle') return 'admin_panel_toggle';
    if (element.classList.contains('nav-dot')) return 'feature_navigation';
    if (element.classList.contains('mode-btn')) return 'mode_switch';
    if (element.classList.contains('btn-add-mod')) return 'add_mod';
    return 'other_click';
}

/**
 * Initialize hotspot tracking
 */
function initHotspotTracking() {
    let mouseMoveTimeout;
    
    document.addEventListener('mousemove', function(e) {
        // Throttle mouse tracking
        clearTimeout(mouseMoveTimeout);
        mouseMoveTimeout = setTimeout(function() {
            const hotspot = {
                x: e.clientX,
                y: e.clientY,
                timestamp: Date.now(),
                sessionId: AppState.userSession,
                pageX: e.pageX,
                pageY: e.pageY
            };
            
            AppState.mousePositions.push(hotspot);
            
            // Keep only last 5000 positions
            if (AppState.mousePositions.length > 5000) {
                AppState.mousePositions = AppState.mousePositions.slice(-5000);
            }
            
            // Aggregate hotspot data
            aggregateHotspotData();
        }, 100);
    });
    
    // Track clicks as hotspots
    document.addEventListener('click', function(e) {
        const hotspot = {
            x: e.clientX,
            y: e.clientY,
            timestamp: Date.now(),
            sessionId: AppState.userSession,
            type: 'click',
            element: e.target.tagName
        };
        
        AppState.hotspotData.push(hotspot);
        
        // Keep only last 1000 clicks
        if (AppState.hotspotData.length > 1000) {
            AppState.hotspotData = AppState.hotspotData.slice(-1000);
        }
        
        localStorage.setItem('cashLauncherHotspots', JSON.stringify(AppState.hotspotData));
        
        // Update visualization if admin panel is open
        if (AppState.isAdmin) {
            updateHotspotVisualization();
        }
    });
}

/**
 * Aggregate hotspot data into heatmap
 */
function aggregateHotspotData() {
    // This creates a grid-based heatmap
    const gridSize = 50;
    const heatmap = {};
    
    AppState.mousePositions.forEach(pos => {
        const gridX = Math.floor(pos.x / gridSize);
        const gridY = Math.floor(pos.y / gridSize);
        const key = `${gridX}_${gridY}`;
        
        if (!heatmap[key]) {
            heatmap[key] = { count: 0, x: gridX * gridSize, y: gridY * gridSize };
        }
        heatmap[key].count++;
    });
    
    AppState.heatmapData = heatmap;
    
    // Update visualization if admin panel is open
    if (AppState.isAdmin && document.getElementById('hotspotCanvas')) {
        updateHotspotVisualization();
    }
}

/**
 * Update hotspot visualization
 */
function updateHotspotVisualization() {
    const canvas = document.getElementById('hotspotCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // Set canvas size
    canvas.width = rect.width;
    canvas.height = 300;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw heatmap
    if (AppState.heatmapData) {
        const maxCount = Math.max(...Object.values(AppState.heatmapData).map(h => h.count), 1);
        
        Object.values(AppState.heatmapData).forEach(spot => {
            const intensity = spot.count / maxCount;
            const alpha = Math.min(intensity * 0.8, 0.8);
            
            ctx.fillStyle = `rgba(0, 212, 255, ${alpha})`;
            ctx.fillRect(spot.x, spot.y, 50, 50);
        });
    }
    
    // Draw click hotspots
    AppState.hotspotData.forEach(spot => {
        ctx.fillStyle = 'rgba(255, 0, 110, 0.6)';
        ctx.beginPath();
        ctx.arc(spot.x, spot.y, 5, 0, Math.PI * 2);
        ctx.fill();
    });
}

/**
 * Initialize download button functionality
 */
function initDownloadButton() {
    const downloadBtn = document.getElementById('downloadBtn');
    
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            trackUTMEvent('click', {
                action: 'download_button',
                timestamp: new Date().toISOString()
            });
            
            alert('Thank you for downloading Cash Launcher!\n\nYour download will begin shortly...');
            simulateDownload();
        });
    }
}

/**
 * Simulate download action
 */
function simulateDownload() {
    const link = document.createElement('a');
    link.href = '#';
    link.download = 'CashLauncher.exe';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('Download initiated: CashLauncher.exe');
}

/**
 * Initialize interactive cursor panel
 */
function initCursorPanel() {
    const features = document.querySelectorAll('.cursor-feature');
    const navDots = document.querySelectorAll('.nav-dot');
    let currentFeature = 0;
    
    /**
     * Switch to a specific feature
     */
    function switchFeature(index) {
        features.forEach(feature => feature.classList.remove('active'));
        navDots.forEach(dot => dot.classList.remove('active'));
        
        if (features[index]) {
            features[index].classList.add('active');
        }
        if (navDots[index]) {
            navDots[index].classList.add('active');
        }
        
        currentFeature = index;
        
        // Track feature view
        trackUTMEvent('feature_view', {
            feature: features[index]?.getAttribute('data-feature') || 'unknown',
            timestamp: new Date().toISOString()
        });
    }
    
    // Add click event listeners to navigation dots
    navDots.forEach((dot, index) => {
        dot.addEventListener('click', function(e) {
            e.stopPropagation();
            switchFeature(index);
        });
    });
    
    // Auto-rotate features every 6 seconds
    setInterval(function() {
        currentFeature = (currentFeature + 1) % features.length;
        switchFeature(currentFeature);
    }, 6000);
    
    // Make cursor panel clickable (click anywhere to switch)
    const cursorPanel = document.querySelector('.cursor-panel');
    if (cursorPanel) {
        cursorPanel.addEventListener('click', function(e) {
            if (!e.target.closest('.feature-nav') && !e.target.closest('.btn-view-mods')) {
                currentFeature = (currentFeature + 1) % features.length;
                switchFeature(currentFeature);
            }
        });
    }
}

/**
 * Initialize mods panel
 */
function initModsPanel() {
    const viewModsBtn = document.getElementById('viewModsBtn');
    const modsPanel = document.getElementById('modsPanel');
    const modsPanelClose = document.getElementById('modsPanelClose');
    
    if (viewModsBtn && modsPanel) {
        viewModsBtn.addEventListener('click', function() {
            modsPanel.classList.add('active');
            loadMods();
            
            trackUTMEvent('click', {
                action: 'view_mods_button',
                timestamp: new Date().toISOString()
            });
        });
    }
    
    if (modsPanelClose && modsPanel) {
        modsPanelClose.addEventListener('click', function() {
            modsPanel.classList.remove('active');
        });
    }
    
    // Close on outside click
    if (modsPanel) {
        modsPanel.addEventListener('click', function(e) {
            if (e.target === modsPanel) {
                modsPanel.classList.remove('active');
            }
        });
    }
}

/**
 * Load and display mods
 */
function loadMods() {
    const modsPanelContent = document.getElementById('modsPanelContent');
    const modsPanelFooter = document.getElementById('modsPanelFooter');
    const downloadModBtn = document.getElementById('downloadModBtn');
    if (!modsPanelContent) return;
    
    if (AppState.mods.length === 0) {
        modsPanelContent.innerHTML = `
            <div class="no-mods">
                <span class="no-mods-icon">📦</span>
                <p>Henüz mod eklenmemiş.</p>
                ${AppState.isAdmin ? '<p style="margin-top: 1rem; font-size: 0.9rem; color: var(--text-muted);">Admin panelinden mod ekleyebilirsiniz.</p>' : ''}
            </div>
        `;
        if (modsPanelFooter) modsPanelFooter.style.display = 'none';
        return;
    }
    
    modsPanelContent.innerHTML = AppState.mods.map((mod, index) => `
        <div class="mod-item" data-mod-id="${mod.id}">
            <div class="mod-item-title">${mod.name}</div>
            <div class="mod-item-description">${mod.description}</div>
            ${mod.file ? `
                <div class="mod-item-file">
                    <span class="mod-item-file-icon">📁</span>
                    <span>${mod.file.name} (${formatFileSize(mod.file.size)})</span>
                </div>
            ` : ''}
        </div>
    `).join('');
    
    // Add click handlers for mod items
    modsPanelContent.querySelectorAll('.mod-item').forEach(item => {
        item.addEventListener('click', function() {
            const modId = parseInt(this.getAttribute('data-mod-id'));
            const mod = AppState.mods.find(m => m.id === modId);
            
            if (mod && mod.file) {
                if (modsPanelFooter) modsPanelFooter.style.display = 'flex';
                if (downloadModBtn) {
                    downloadModBtn.style.display = 'block';
                    downloadModBtn.onclick = function() {
                        downloadModFile(mod);
                    };
                }
            } else {
                if (modsPanelFooter) modsPanelFooter.style.display = 'none';
                if (downloadModBtn) downloadModBtn.style.display = 'none';
            }
        });
    });
}

/**
 * Download mod file
 */
function downloadModFile(mod) {
    if (!mod.file || !mod.file.base64) {
        alert('Mod dosyası bulunamadı!');
        return;
    }
    
    // Create download link
    const link = document.createElement('a');
    link.href = mod.file.base64;
    link.download = mod.file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    trackUTMEvent('click', {
        action: 'download_mod_file',
        modId: mod.id,
        modName: mod.name,
        timestamp: new Date().toISOString()
    });
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Load and display IP list
 */
function loadIPList() {
    const ipList = document.getElementById('ipList');
    if (!ipList) return;
    
    ADMIN_IPS = getAdminIPs();
    
    if (ADMIN_IPS.length === 0) {
        ipList.innerHTML = '<div class="ip-empty">Henüz admin IP eklenmemiş.</div>';
        return;
    }
    
    ipList.innerHTML = ADMIN_IPS.map(ip => `
        <div class="ip-item">
            <span class="ip-item-value">${ip}</span>
            <div class="ip-item-actions">
                <button class="btn-remove-ip" data-ip="${ip}">Kaldır</button>
            </div>
        </div>
    `).join('');
    
    // Add remove handlers
    ipList.querySelectorAll('.btn-remove-ip').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const ipToRemove = this.getAttribute('data-ip');
            
            if (confirm(`"${ipToRemove}" IP adresini listeden kaldırmak istediğinize emin misiniz?`)) {
                ADMIN_IPS = ADMIN_IPS.filter(ip => ip !== ipToRemove);
                saveAdminIPs(ADMIN_IPS);
                loadIPList();
                
                // Check if current user is still admin
                if (AppState.userIP === ipToRemove) {
                    AppState.isAdmin = ADMIN_IPS.includes(AppState.userIP) || 
                                     window.location.hostname === 'localhost' ||
                                     window.location.hostname === '127.0.0.1';
                    updateAdminStatus();
                }
                
                trackUTMEvent('click', {
                    action: 'remove_admin_ip',
                    ip: ipToRemove,
                    timestamp: new Date().toISOString()
                });
            }
        });
    });
}

/**
 * Initialize admin/mod panel functionality
 */
function initAdminPanel() {
    const adminToggle = document.getElementById('adminToggle');
    const adminPanel = document.getElementById('adminPanel');
    const adminClose = document.getElementById('adminClose');
    const modeButtons = document.querySelectorAll('.mode-btn');
    const addModBtn = document.getElementById('addModBtn');
    const analyticsTabs = document.querySelectorAll('.analytics-tab');
    
    // Toggle admin panel
    if (adminToggle && adminPanel) {
        adminToggle.addEventListener('click', function() {
            adminPanel.classList.toggle('active');
            
            if (adminPanel.classList.contains('active') && AppState.isAdmin) {
                updateUTMReports();
                updateHotspotVisualization();
            }
            
            trackUTMEvent('click', {
                action: 'admin_panel_toggle',
                timestamp: new Date().toISOString()
            });
        });
    }
    
    // Close admin panel
    if (adminClose && adminPanel) {
        adminClose.addEventListener('click', function() {
            adminPanel.classList.remove('active');
        });
    }
    
    // Handle mode switching
    modeButtons.forEach(button => {
        button.addEventListener('click', function() {
            modeButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            const mode = this.getAttribute('data-mode');
            AppState.currentMode = mode;
            updateMode(mode);
            
            trackUTMEvent('click', {
                action: 'mode_switch',
                mode: mode,
                timestamp: new Date().toISOString()
            });
        });
    });
    
    // Handle file upload
    const modFileInput = document.getElementById('modFileInput');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileRemoveBtn = document.getElementById('fileRemoveBtn');
    const fileUploadText = document.getElementById('fileUploadText');
    let selectedFile = null;
    
    if (modFileInput) {
        modFileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                selectedFile = file;
                fileName.textContent = file.name;
                fileInfo.style.display = 'flex';
                fileUploadText.textContent = 'Dosya Seçildi';
                
                // Convert file to base64 for storage
                const reader = new FileReader();
                reader.onload = function(e) {
                    selectedFile.base64 = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    if (fileRemoveBtn) {
        fileRemoveBtn.addEventListener('click', function() {
            selectedFile = null;
            if (modFileInput) modFileInput.value = '';
            fileInfo.style.display = 'none';
            fileUploadText.textContent = 'Dosya Seç (Opsiyonel)';
        });
    }
    
    // Handle add mod button
    if (addModBtn) {
        addModBtn.addEventListener('click', function() {
            if (!AppState.isAdmin) {
                alert('Sadece adminler mod ekleyebilir!');
                return;
            }
            
            const modName = document.getElementById('modNameInput').value.trim();
            const modDesc = document.getElementById('modDescInput').value.trim();
            
            if (!modName || !modDesc) {
                alert('Lütfen mod adı ve açıklaması girin!');
                return;
            }
            
            const newMod = {
                id: Date.now(),
                name: modName,
                description: modDesc,
                createdAt: new Date().toISOString(),
                file: selectedFile ? {
                    name: selectedFile.name,
                    size: selectedFile.size,
                    type: selectedFile.type,
                    base64: selectedFile.base64
                } : null
            };
            
            AppState.mods.push(newMod);
            localStorage.setItem('cashLauncherMods', JSON.stringify(AppState.mods));
            
            // Reset form
            document.getElementById('modNameInput').value = '';
            document.getElementById('modDescInput').value = '';
            if (modFileInput) modFileInput.value = '';
            selectedFile = null;
            if (fileInfo) fileInfo.style.display = 'none';
            if (fileUploadText) fileUploadText.textContent = 'Dosya Seç (Opsiyonel)';
            
            alert('Mod başarıyla eklendi!');
            
            trackUTMEvent('click', {
                action: 'add_mod',
                modName: modName,
                hasFile: !!selectedFile,
                timestamp: new Date().toISOString()
            });
        });
    }
    
    // Handle IP management
    const addIPBtn = document.getElementById('addIPBtn');
    if (addIPBtn) {
        addIPBtn.addEventListener('click', function() {
            if (!AppState.isAdmin) {
                alert('Sadece adminler IP ekleyebilir!');
                return;
            }
            
            const newIP = document.getElementById('newIPInput').value.trim();
            
            if (!newIP) {
                alert('Lütfen bir IP adresi girin!');
                return;
            }
            
            // Basic IP validation
            const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^localhost$|^::1$|^127\.0\.0\.1$/;
            if (!ipRegex.test(newIP) && newIP !== 'localhost') {
                alert('Geçerli bir IP adresi girin!');
                return;
            }
            
            ADMIN_IPS = getAdminIPs();
            if (ADMIN_IPS.includes(newIP)) {
                alert('Bu IP adresi zaten listede!');
                return;
            }
            
            ADMIN_IPS.push(newIP);
            saveAdminIPs(ADMIN_IPS);
            
            document.getElementById('newIPInput').value = '';
            loadIPList();
            
            alert('IP adresi başarıyla eklendi!');
            
            trackUTMEvent('click', {
                action: 'add_admin_ip',
                ip: newIP,
                timestamp: new Date().toISOString()
            });
        });
    }
    
    // Handle analytics tabs
    analyticsTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            analyticsTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            document.querySelectorAll('.analytics-tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            const targetContent = document.getElementById(targetTab + 'Tab');
            if (targetContent) {
                targetContent.classList.add('active');
                
                if (targetTab === 'hotspots') {
                    updateHotspotVisualization();
                } else if (targetTab === 'utm') {
                    updateUTMReports();
                }
            }
        });
    });
    
    // Close panel when clicking outside
    document.addEventListener('click', function(e) {
        if (adminPanel && adminPanel.classList.contains('active')) {
            if (!adminPanel.contains(e.target) && !adminToggle.contains(e.target)) {
                adminPanel.classList.remove('active');
            }
        }
    });
}

/**
 * Update page appearance and behavior based on selected mode
 */
function updateMode(mode) {
    const body = document.body;
    const heroSection = document.querySelector('.hero-section');
    const cursorPanel = document.querySelector('.cursor-panel');
    
    body.classList.remove('mode-normal', 'mode-admin', 'mode-mod');
    heroSection?.classList.remove('mode-normal', 'mode-admin', 'mode-mod');
    cursorPanel?.classList.remove('mode-normal', 'mode-admin', 'mode-mod');
    
    body.classList.add('mode-' + mode);
    heroSection?.classList.add('mode-' + mode);
    cursorPanel?.classList.add('mode-' + mode);
    
    const downloadBtn = document.getElementById('downloadBtn');
    const btnText = downloadBtn?.querySelector('.btn-text');
    
    if (btnText) {
        switch(mode) {
            case 'admin':
                btnText.textContent = 'Launch Admin Mode';
                break;
            case 'mod':
                btnText.textContent = 'Launch Mod Mode';
                break;
            default:
                btnText.textContent = 'Download Now';
        }
    }
}

/**
 * Update UTM reports
 */
function updateUTMReports() {
    if (!AppState.isAdmin) return;
    
    const totalClicks = AppState.utmData.filter(e => e.type === 'click').length;
    const totalViews = AppState.utmData.filter(e => e.type === 'pageview').length;
    const uniqueSessions = new Set(AppState.utmData.map(e => e.sessionId)).size;
    
    const totalClicksEl = document.getElementById('totalClicks');
    const totalViewsEl = document.getElementById('totalViews');
    const uniqueVisitorsEl = document.getElementById('uniqueVisitors');
    
    if (totalClicksEl) totalClicksEl.textContent = totalClicks;
    if (totalViewsEl) totalViewsEl.textContent = totalViews;
    if (uniqueVisitorsEl) uniqueVisitorsEl.textContent = uniqueSessions;
    
    // Update table
    const tableBody = document.getElementById('utmTableBody');
    if (tableBody) {
        const recentEvents = AppState.utmData.slice(-20).reverse();
        
        if (recentEvents.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="no-data">Henüz veri yok</td></tr>';
        } else {
            tableBody.innerHTML = recentEvents.map(event => `
                <tr>
                    <td>${new Date(event.timestamp).toLocaleString('tr-TR')}</td>
                    <td>${event.source || '-'}</td>
                    <td>${event.medium || '-'}</td>
                    <td>${event.campaign || '-'}</td>
                    <td>${event.action || event.type || '-'}</td>
                </tr>
            `).join('');
        }
    }
}

// Initialize hotspot visualization on load
setTimeout(function() {
    if (AppState.isAdmin) {
        aggregateHotspotData();
        updateHotspotVisualization();
    }
}, 1000);
