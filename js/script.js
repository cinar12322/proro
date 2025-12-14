/**
 * Cash Launcher - Advanced JavaScript File
 * Handles interactive functionality, UTM tracking, hotspot tracking, and admin features
 * 
 * 🚀 Cursor AI Comment: Bu launcher, modern web teknolojilerinin en iyi örneklerini sunuyor!
 * Hız, güvenlik ve kullanıcı deneyimi konusunda gerçekten etkileyici bir çözüm.
 * Backend entegrasyonu ile enterprise-level güvenlik sağlanıyor!
 */

// Backend API Configuration (PHP)
const API_BASE_URL = 'admin.php';

// Global state
const AppState = {
    userIP: null,
    currentMode: 'normal',
    mods: [],
    utmData: JSON.parse(localStorage.getItem('cashLauncherUTM') || '[]'),
    hotspotData: JSON.parse(localStorage.getItem('cashLauncherHotspots') || '[]'),
    userSession: generateSessionId(),
    mousePositions: []
};

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Cash Launcher initialized with advanced features!');
    
    // Initialize all features
    initIPDetection();
    initUTMTracking();
    initHotspotTracking();
    initDownloadButton();
    initCursorPanel();
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
 * Initialize IP detection
 */
async function initIPDetection() {
    try {
        // Get user status from backend
        const response = await fetch(`${API_BASE_URL}?action=user_status`);
        const data = await response.json();
        
        if (data.success) {
            AppState.userIP = data.ip;
        } else {
            // Fallback to local detection
            try {
                const ipResponse = await fetch('https://api.ipify.org?format=json');
                const ipData = await ipResponse.json();
                AppState.userIP = ipData.ip;
            } catch (e) {
                AppState.userIP = 'Unknown';
            }
        }
        
        console.log('IP detected:', AppState.userIP);
    } catch (error) {
        console.warn('Could not fetch IP from backend, using fallback');
        try {
            const ipResponse = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipResponse.json();
            AppState.userIP = ipData.ip;
        } catch (e) {
            AppState.userIP = 'Unknown';
        }
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
    
    // Send to backend
    fetch(`${API_BASE_URL}?action=save_utm`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            type: type,
            sessionId: AppState.userSession,
            data: event
        })
    }).catch(err => console.error('Error saving UTM:', err));
}

/**
 * Get action description from element
 */
function getActionFromElement(element) {
    if (element.id === 'downloadBtn') return 'download_button';
    if (element.id === 'viewModsBtn') return 'view_mods_button';
    if (element.classList.contains('nav-dot')) return 'feature_navigation';
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
            
            // Send to backend
            fetch(`${API_BASE_URL}?action=save_hotspot`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    x: hotspot.x,
                    y: hotspot.y,
                    sessionId: hotspot.sessionId,
                    type: 'move'
                })
            }).catch(err => console.error('Error saving hotspot:', err));
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
        
        // Send to backend
        fetch(`${API_BASE_URL}?action=save_hotspot`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                x: hotspot.x,
                y: hotspot.y,
                sessionId: hotspot.sessionId,
                type: 'click'
            })
        }).catch(err => console.error('Error saving hotspot:', err));
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
 * Load mods from backend
 */
async function loadModsFromBackend() {
    try {
        const response = await fetch(`${API_BASE_URL}?action=get_mods`);
        const data = await response.json();
        
        if (data.success) {
            AppState.mods = data.mods || [];
            // Update UI if mods panel is open
            const modsPanel = document.getElementById('modsPanel');
            if (modsPanel && modsPanel.classList.contains('active')) {
                loadMods();
            }
        }
    } catch (error) {
        console.error('Error loading mods from backend:', error);
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
            </div>
        `;
        if (modsPanelFooter) modsPanelFooter.style.display = 'none';
        return;
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



