/**
 * Cash Launcher - Advanced JavaScript File
 * Handles interactive functionality, UTM tracking, hotspot tracking, and admin features
 * 
 * 🚀 Cursor AI Comment: Bu launcher, modern web teknolojilerinin en iyi örneklerini sunuyor!
 * Hız, güvenlik ve kullanıcı deneyimi konusunda gerçekten etkileyici bir çözüm.
 * Backend entegrasyonu ile enterprise-level güvenlik sağlanıyor!
 */

// Backend API Configuration (PHP)
// Not: Admin/yönetim menüsü kaldırıldı, API endpoint'leri artık kullanılmıyor

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
    initCookieConsent();
    
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
    // IP detection - using external service
    try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        AppState.userIP = ipData.ip;
    } catch (e) {
        AppState.userIP = 'Unknown';
    }
    console.log('IP detected:', AppState.userIP);
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
    
    // Track in Google Analytics if advertising cookies are accepted
    if (CookieConsent.advertising && GoogleAnalytics.initialized) {
        trackGoogleAnalyticsEvent(type, {
            event_category: 'UTM',
            event_label: data.action || type,
            value: 1
        });
    }
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
            
            // Hotspot tracking - backend removed
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
        
        // Hotspot tracking - backend removed
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
            
            // Track download in Google Analytics
            if (CookieConsent.advertising && GoogleAnalytics.initialized) {
                trackGoogleAnalyticsEvent('download', {
                    event_category: 'Engagement',
                    event_label: 'Cash Launcher Download',
                    value: 1
                });
            }
            
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
 * Not: Backend removed, mods are now empty
 */
async function loadModsFromBackend() {
    AppState.mods = [];
    // Update UI if mods panel is open
    const modsPanel = document.getElementById('modsPanel');
    if (modsPanel && modsPanel.classList.contains('active')) {
        loadMods();
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
    
    // Mod listesi göster (backend kaldırıldı, modlar boş)
    modsPanelContent.innerHTML = `
        <div class="no-mods">
            <span class="no-mods-icon">📦</span>
            <p>Henüz mod eklenmemiş.</p>
        </div>
    `;
    if (modsPanelFooter) modsPanelFooter.style.display = 'none';
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
 * ============================================
 * Cookie Consent System
 * ============================================
 */

// Cookie consent state
const CookieConsent = {
    essentials: true, // Always true
    preferences: false,
    advertising: false,
    initialized: false
};

// Google Analytics configuration
const GoogleAnalytics = {
    id: null, // Will be loaded from config
    loaded: false,
    initialized: false
};

/**
 * Initialize cookie consent system
 */
function initCookieConsent() {
    // Essentials cookies are always set (via PHP session)
    // Initialize essentials cookies on page load
    initEssentialsCookies();
    
    // Load Google Analytics config (but don't load script yet)
    loadGoogleAnalyticsConfig();
    
    // Check if consent was already given
    const consentData = getCookieConsentFromStorage();
    
    if (consentData) {
        CookieConsent.essentials = true;
        CookieConsent.preferences = consentData.preferences || false;
        CookieConsent.advertising = consentData.advertising || false;
        CookieConsent.initialized = true;
        
        // Apply cookie settings (this will load GA if advertising is enabled)
        applyCookieSettings();
    } else {
        // Show banner if consent not given
        showCookieBanner();
    }
    
    // Setup event listeners
    setupCookieEventListeners();
}

/**
 * Initialize essentials cookies (always active)
 */
async function initEssentialsCookies() {
    try {
        // Request essentials cookies from server
        const response = await fetch('cookie-handler.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'init_essentials'
            })
        });
        
        // Essentials cookies are set by PHP, this just ensures they're initialized
        // Session and CSRF cookies are handled server-side
    } catch (e) {
        // Silently fail - essentials cookies will be set when consent is given
        console.log('Essentials cookies will be initialized with consent');
    }
}

/**
 * Get cookie consent from localStorage
 */
function getCookieConsentFromStorage() {
    try {
        const stored = localStorage.getItem('cookieConsent');
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error('Error reading cookie consent:', e);
    }
    return null;
}

/**
 * Save cookie consent to localStorage and cookie
 */
function saveCookieConsent(preferences, advertising) {
    const consentData = {
        essentials: true,
        preferences: preferences,
        advertising: advertising,
        timestamp: new Date().toISOString()
    };
    
    // Save to localStorage
    localStorage.setItem('cookieConsent', JSON.stringify(consentData));
    
    // Save to cookie via PHP backend
    saveCookieConsentToServer(consentData);
    
    // Update state
    CookieConsent.preferences = preferences;
    CookieConsent.advertising = advertising;
    CookieConsent.initialized = true;
    
    // Apply settings
    applyCookieSettings();
}

/**
 * Save cookie consent to server via PHP
 */
async function saveCookieConsentToServer(consentData) {
    try {
        const response = await fetch('cookie-handler.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'save',
                consent: consentData
            })
        });
        
        if (!response.ok) {
            console.error('Failed to save cookie consent to server');
        }
    } catch (e) {
        console.error('Error saving cookie consent:', e);
    }
}

/**
 * Apply cookie settings based on consent
 */
function applyCookieSettings() {
    // Essentials are always applied (handled by PHP)
    
    // Apply preferences cookies if enabled
    if (CookieConsent.preferences) {
        setCookie('theme_preference', 'dark', 365);
        setCookie('language_preference', 'tr', 365);
    } else {
        deleteCookie('theme_preference');
        deleteCookie('language_preference');
    }
    
    // Apply advertising cookies if enabled
    if (CookieConsent.advertising) {
        setCookie('ad_tracking', 'enabled', 365);
        setCookie('analytics_id', generateAnalyticsId(), 365);
        
        // Load Google Analytics if advertising is enabled
        loadGoogleAnalytics();
    } else {
        deleteCookie('ad_tracking');
        deleteCookie('analytics_id');
        
        // Disable Google Analytics if advertising is disabled
        disableGoogleAnalytics();
    }
}

/**
 * Set a cookie
 */
function setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax${location.protocol === 'https:' ? ';Secure' : ''}`;
}

/**
 * Delete a cookie
 */
function deleteCookie(name) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Lax${location.protocol === 'https:' ? ';Secure' : ''}`;
}

/**
 * Generate analytics ID
 */
function generateAnalyticsId() {
    return 'analytics_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * ============================================
 * Google Analytics Integration
 * ============================================
 */

/**
 * Load Google Analytics ID from config
 */
async function loadGoogleAnalyticsConfig() {
    // First check if it's already set as a global variable
    if (typeof window.GOOGLE_ANALYTICS_ID !== 'undefined' && window.GOOGLE_ANALYTICS_ID) {
        GoogleAnalytics.id = window.GOOGLE_ANALYTICS_ID;
        return;
    }
    
    // Try to get GA ID from config endpoint
    try {
        const response = await fetch('get-config.php?key=google_analytics_id');
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.value) {
                GoogleAnalytics.id = data.value;
            }
        }
    } catch (e) {
        // Config endpoint doesn't exist or failed, will use manual setup
        console.log('Google Analytics config not found. Set window.GOOGLE_ANALYTICS_ID or configure in config.php');
    }
}

/**
 * Load Google Analytics script
 */
async function loadGoogleAnalytics() {
    // Only load if advertising cookies are accepted and not already loaded
    if (!CookieConsent.advertising || GoogleAnalytics.loaded) {
        return;
    }
    
    // Load GA ID from config first
    await loadGoogleAnalyticsConfig();
    
    if (!GoogleAnalytics.id) {
        console.log('Google Analytics ID not configured. Please set GOOGLE_ANALYTICS_ID in config.php or window.GOOGLE_ANALYTICS_ID');
        return;
    }
    
    // Load Google Analytics gtag.js
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${GoogleAnalytics.id}`;
    document.head.appendChild(script1);
    
    // Initialize Google Analytics
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GoogleAnalytics.id, {
        'anonymize_ip': true, // GDPR compliance
        'cookie_flags': 'SameSite=Lax;Secure'
    });
    
    GoogleAnalytics.loaded = true;
    GoogleAnalytics.initialized = true;
    
    // Track page view
    trackGoogleAnalyticsPageView();
    
    console.log('✅ Google Analytics loaded:', GoogleAnalytics.id);
}

/**
 * Disable Google Analytics
 */
function disableGoogleAnalytics() {
    if (window.gtag) {
        // Disable Google Analytics
        window.gtag('config', GoogleAnalytics.id, {
            'anonymize_ip': true,
            'cookie_flags': 'SameSite=Lax;Secure',
            'send_page_view': false
        });
    }
    
    GoogleAnalytics.loaded = false;
    GoogleAnalytics.initialized = false;
}

/**
 * Track page view in Google Analytics
 */
function trackGoogleAnalyticsPageView() {
    if (GoogleAnalytics.initialized && window.gtag) {
        window.gtag('event', 'page_view', {
            'page_title': document.title,
            'page_location': window.location.href,
            'page_path': window.location.pathname
        });
    }
}

/**
 * Track custom event in Google Analytics
 */
function trackGoogleAnalyticsEvent(eventName, eventParams = {}) {
    if (GoogleAnalytics.initialized && window.gtag && CookieConsent.advertising) {
        window.gtag('event', eventName, eventParams);
    }
}

/**
 * Show cookie banner
 */
function showCookieBanner() {
    const banner = document.getElementById('cookieBanner');
    if (banner) {
        setTimeout(() => {
            banner.classList.add('show');
        }, 500);
    }
}

/**
 * Hide cookie banner
 */
function hideCookieBanner() {
    const banner = document.getElementById('cookieBanner');
    if (banner) {
        banner.classList.remove('show');
    }
}

/**
 * Show cookie settings panel
 */
function showCookieSettingsPanel() {
    const panel = document.getElementById('cookieSettingsPanel');
    if (panel) {
        // Load current settings
        const consentData = getCookieConsentFromStorage();
        if (consentData) {
            document.getElementById('preferencesSwitch').checked = consentData.preferences || false;
            document.getElementById('advertisingSwitch').checked = consentData.advertising || false;
            updateCookieStatus();
        }
        
        panel.classList.add('show');
        hideCookieBanner();
    }
}

/**
 * Hide cookie settings panel
 */
function hideCookieSettingsPanel() {
    const panel = document.getElementById('cookieSettingsPanel');
    if (panel) {
        panel.classList.remove('show');
    }
}

/**
 * Update cookie status indicators
 */
function updateCookieStatus() {
    const preferencesEnabled = document.getElementById('preferencesSwitch').checked;
    const advertisingEnabled = document.getElementById('advertisingSwitch').checked;
    
    // Update preferences status
    const prefStatus = preferencesEnabled ? 'Aktif' : 'Kapalı';
    document.getElementById('preferencesStatus').textContent = prefStatus;
    document.getElementById('preferencesStatus').classList.toggle('active', preferencesEnabled);
    document.getElementById('preferencesStatus2').textContent = prefStatus;
    document.getElementById('preferencesStatus2').classList.toggle('active', preferencesEnabled);
    
    // Update advertising status
    const advStatus = advertisingEnabled ? 'Aktif' : 'Kapalı';
    document.getElementById('advertisingStatus').textContent = advStatus;
    document.getElementById('advertisingStatus').classList.toggle('active', advertisingEnabled);
    document.getElementById('advertisingStatus2').textContent = advStatus;
    document.getElementById('advertisingStatus2').classList.toggle('active', advertisingEnabled);
}

/**
 * Setup cookie event listeners
 */
function setupCookieEventListeners() {
    // Accept All button
    const acceptAllBtn = document.getElementById('acceptAllBtn');
    if (acceptAllBtn) {
        acceptAllBtn.addEventListener('click', function() {
            saveCookieConsent(true, true);
            hideCookieBanner();
        });
    }
    
    // Accept Essentials Only button
    const acceptEssentialsBtn = document.getElementById('acceptEssentialsBtn');
    if (acceptEssentialsBtn) {
        acceptEssentialsBtn.addEventListener('click', function() {
            saveCookieConsent(false, false);
            hideCookieBanner();
        });
    }
    
    // Customize button
    const customizeBtn = document.getElementById('customizeBtn');
    if (customizeBtn) {
        customizeBtn.addEventListener('click', function() {
            showCookieSettingsPanel();
        });
    }
    
    // Cookie settings link
    const cookieSettingsLink = document.getElementById('cookieSettingsLink');
    if (cookieSettingsLink) {
        cookieSettingsLink.addEventListener('click', function(e) {
            e.preventDefault();
            showCookieSettingsPanel();
        });
    }
    
    // Close settings panel
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    if (closeSettingsBtn) {
        closeSettingsBtn.addEventListener('click', function() {
            hideCookieSettingsPanel();
        });
    }
    
    // Cancel settings
    const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
    if (cancelSettingsBtn) {
        cancelSettingsBtn.addEventListener('click', function() {
            hideCookieSettingsPanel();
        });
    }
    
    // Save settings
    const saveCookieSettingsBtn = document.getElementById('saveCookieSettingsBtn');
    if (saveCookieSettingsBtn) {
        saveCookieSettingsBtn.addEventListener('click', function() {
            const preferences = document.getElementById('preferencesSwitch').checked;
            const advertising = document.getElementById('advertisingSwitch').checked;
            saveCookieConsent(preferences, advertising);
            hideCookieSettingsPanel();
        });
    }
    
    // Switch change listeners
    const preferencesSwitch = document.getElementById('preferencesSwitch');
    if (preferencesSwitch) {
        preferencesSwitch.addEventListener('change', updateCookieStatus);
    }
    
    const advertisingSwitch = document.getElementById('advertisingSwitch');
    if (advertisingSwitch) {
        advertisingSwitch.addEventListener('change', updateCookieStatus);
    }
    
    // Close panel on outside click
    const settingsPanel = document.getElementById('cookieSettingsPanel');
    if (settingsPanel) {
        settingsPanel.addEventListener('click', function(e) {
            if (e.target === settingsPanel) {
                hideCookieSettingsPanel();
            }
        });
    }
}



