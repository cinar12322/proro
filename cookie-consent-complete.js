/**
 * GDPR-Compliant Cookie Consent with Google Analytics 4
 * Self-contained vanilla JavaScript implementation
 * Website: http://95.70.181.95
 * GA Measurement ID: G-4G8HC9L0PY
 */

(function() {
    'use strict';

    // ============================================
    // CONFIGURATION
    // ============================================
    const CONFIG = {
        GA_MEASUREMENT_ID: 'G-4G8HC9L0PY',
        CURSOR_HOVER_DELAY: 2000, // 2 seconds for AI prompt
        STORAGE_KEY: 'cookieConsent',
        WEBSITE_URL: 'http://95.70.181.95'
    };

    // ============================================
    // STATE MANAGEMENT
    // ============================================
    const state = {
        consent: null,
        cursorHoverTimer: null,
        aiPopupVisible: false,
        gaInitialized: false
    };

    // ============================================
    // INITIALIZATION
    // ============================================
    function init() {
        // Load Google Analytics first
        loadGoogleAnalytics();
        
        // Check for existing consent
        loadConsent();
        
        // Create UI elements
        createCookieBanner();
        createCustomizePanel();
        createAIPopup();
        
        // Apply consent if exists, otherwise show banner
        if (state.consent) {
            applyConsent(state.consent);
        } else {
            showBanner();
        }
    }

    // ============================================
    // GOOGLE ANALYTICS INTEGRATION
    // ============================================
    function loadGoogleAnalytics() {
        // Create and append GA4 script
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${CONFIG.GA_MEASUREMENT_ID}`;
        document.head.appendChild(script);

        // Initialize dataLayer and gtag function
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        window.gtag = gtag;
        gtag('js', new Date());

        // Set default consent to denied (GDPR compliance)
        gtag('consent', 'default', {
            'analytics_storage': 'denied',
            'ad_storage': 'denied'
        });

        state.gaInitialized = true;
    }

    // ============================================
    // CONSENT MANAGEMENT
    // ============================================
    function loadConsent() {
        try {
            const stored = localStorage.getItem(CONFIG.STORAGE_KEY);
            if (stored) {
                state.consent = JSON.parse(stored);
            }
        } catch (e) {
            console.error('Error loading consent:', e);
        }
    }

    function saveConsent(consent) {
        state.consent = consent;
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(consent));
        applyConsent(consent);
    }

    function applyConsent(consent) {
        if (!window.gtag || !state.gaInitialized) return;

        const analyticsGranted = consent.analytics || false;
        const advertisingGranted = consent.advertising || false;

        // Update Google Analytics consent mode
        gtag('consent', 'update', {
            'analytics_storage': analyticsGranted ? 'granted' : 'denied',
            'ad_storage': advertisingGranted ? 'granted' : 'denied'
        });

        // Configure GA4 with privacy settings
        if (analyticsGranted || advertisingGranted) {
            gtag('config', CONFIG.GA_MEASUREMENT_ID, {
                'anonymize_ip': true, // IP anonymization for GDPR
                'cookie_flags': 'SameSite=Lax;Secure' // Secure cookie settings
            });
        }
    }

    // ============================================
    // COOKIE BANNER UI
    // ============================================
    function createCookieBanner() {
        const banner = document.createElement('div');
        banner.id = 'cookie-consent-banner';
        banner.className = 'cookie-consent-banner';
        banner.innerHTML = `
            <div class="cookie-consent-content">
                <div class="cookie-consent-text">
                    <h3>🍪 Cookie Kullanımı</h3>
                    <p>Web sitemiz, size en iyi deneyimi sunmak için çerezler kullanmaktadır. 
                    Zorunlu çerezler site çalışması için gereklidir. Diğer çerezler için onayınızı almak istiyoruz.</p>
                </div>
                <div class="cookie-consent-actions">
                    <button id="accept-all-btn" class="cookie-btn cookie-btn-primary">Tümünü Kabul Et</button>
                    <button id="accept-essentials-btn" class="cookie-btn cookie-btn-secondary">Sadece Essentials</button>
                    <button id="customize-btn" class="cookie-btn cookie-btn-link">Özelleştir</button>
                </div>
            </div>
        `;
        document.body.appendChild(banner);

        // Event listeners for banner buttons
        document.getElementById('accept-all-btn').addEventListener('click', () => {
            saveConsent({
                essentials: true,
                preferences: true,
                analytics: true,
                advertising: true,
                timestamp: new Date().toISOString()
            });
            hideBanner();
        });

        document.getElementById('accept-essentials-btn').addEventListener('click', () => {
            saveConsent({
                essentials: true,
                preferences: false,
                analytics: false,
                advertising: false,
                timestamp: new Date().toISOString()
            });
            hideBanner();
        });

        document.getElementById('customize-btn').addEventListener('click', () => {
            showCustomizePanel();
        });

        // Setup AI cursor prompt on banner
        setupAICursorPrompt(banner);
    }

    // ============================================
    // AI CURSOR PROMPT FEATURE
    // ============================================
    function setupAICursorPrompt(banner) {
        // Start timer when mouse enters banner
        banner.addEventListener('mouseenter', () => {
            state.cursorHoverTimer = setTimeout(() => {
                if (!state.aiPopupVisible && !state.consent) {
                    showAIPopup();
                }
            }, CONFIG.CURSOR_HOVER_DELAY);
        });

        // Clear timer when mouse leaves
        banner.addEventListener('mouseleave', () => {
            if (state.cursorHoverTimer) {
                clearTimeout(state.cursorHoverTimer);
                state.cursorHoverTimer = null;
            }
        });
    }

    function createAIPopup() {
        const popup = document.createElement('div');
        popup.id = 'cookie-ai-popup';
        popup.className = 'cookie-ai-popup';
        popup.innerHTML = `
            <div class="cookie-ai-content">
                <div class="cookie-ai-header">
                    <span class="cookie-ai-icon">🤖</span>
                    <h4>AI Asistan</h4>
                </div>
                <div class="cookie-ai-message">
                    <p>Merhaba! Cookie tercihlerinizi belirlemek için yardımcı olabilir miyim?</p>
                    <p>Analytics ve reklam cookie'lerini kabul ederseniz, size daha iyi bir deneyim sunabiliriz.</p>
                </div>
                <div class="cookie-ai-actions">
                    <button id="ai-accept-btn" class="cookie-btn cookie-btn-primary">Kabul Et</button>
                    <button id="ai-decline-btn" class="cookie-btn cookie-btn-secondary">Reddet</button>
                </div>
            </div>
        `;
        document.body.appendChild(popup);

        // AI popup event listeners
        document.getElementById('ai-accept-btn').addEventListener('click', () => {
            const consent = {
                essentials: true,
                preferences: true,
                analytics: true,
                advertising: true,
                timestamp: new Date().toISOString()
            };
            saveConsent(consent);
            hideAIPopup();
            hideBanner();
        });

        document.getElementById('ai-decline-btn').addEventListener('click', () => {
            const consent = {
                essentials: true,
                preferences: false,
                analytics: false,
                advertising: false,
                timestamp: new Date().toISOString()
            };
            saveConsent(consent);
            hideAIPopup();
            hideBanner();
        });
    }

    function showAIPopup() {
        const popup = document.getElementById('cookie-ai-popup');
        if (popup) {
            popup.classList.add('visible');
            state.aiPopupVisible = true;
        }
    }

    function hideAIPopup() {
        const popup = document.getElementById('cookie-ai-popup');
        if (popup) {
            popup.classList.remove('visible');
            state.aiPopupVisible = false;
        }
    }

    // ============================================
    // CUSTOMIZE PANEL UI
    // ============================================
    function createCustomizePanel() {
        const panel = document.createElement('div');
        panel.id = 'cookie-customize-panel';
        panel.className = 'cookie-customize-panel';
        panel.innerHTML = `
            <div class="cookie-customize-content">
                <div class="cookie-customize-header">
                    <h3>Cookie Ayarları</h3>
                    <button id="close-customize-btn" class="cookie-close-btn">×</button>
                </div>
                <div class="cookie-customize-body">
                    <div class="cookie-category">
                        <div class="cookie-category-header">
                            <div>
                                <h4>Essentials (Zorunlu)</h4>
                                <p>Site çalışması için gerekli çerezler</p>
                            </div>
                            <label class="cookie-switch disabled">
                                <input type="checkbox" checked disabled>
                                <span class="cookie-switch-slider"></span>
                            </label>
                        </div>
                    </div>
                    <div class="cookie-category">
                        <div class="cookie-category-header">
                            <div>
                                <h4>Preferences (Tercihler)</h4>
                                <p>Tema, dil tercihleri için çerezler</p>
                            </div>
                            <label class="cookie-switch">
                                <input type="checkbox" id="preferences-toggle">
                                <span class="cookie-switch-slider"></span>
                            </label>
                        </div>
                    </div>
                    <div class="cookie-category">
                        <div class="cookie-category-header">
                            <div>
                                <h4>Analytics</h4>
                                <p>Web sitesi analitiği için çerezler</p>
                            </div>
                            <label class="cookie-switch">
                                <input type="checkbox" id="analytics-toggle">
                                <span class="cookie-switch-slider"></span>
                            </label>
                        </div>
                    </div>
                    <div class="cookie-category">
                        <div class="cookie-category-header">
                            <div>
                                <h4>Advertising (Reklam)</h4>
                                <p>Reklam ve takip çerezleri</p>
                            </div>
                            <label class="cookie-switch">
                                <input type="checkbox" id="advertising-toggle">
                                <span class="cookie-switch-slider"></span>
                            </label>
                        </div>
                    </div>
                </div>
                <div class="cookie-customize-footer">
                    <button id="save-customize-btn" class="cookie-btn cookie-btn-primary">Kaydet</button>
                    <button id="cancel-customize-btn" class="cookie-btn cookie-btn-secondary">İptal</button>
                </div>
            </div>
        `;
        document.body.appendChild(panel);

        // Customize panel event listeners
        document.getElementById('close-customize-btn').addEventListener('click', hideCustomizePanel);
        document.getElementById('cancel-customize-btn').addEventListener('click', hideCustomizePanel);
        document.getElementById('save-customize-btn').addEventListener('click', () => {
            const preferences = document.getElementById('preferences-toggle').checked;
            const analytics = document.getElementById('analytics-toggle').checked;
            const advertising = document.getElementById('advertising-toggle').checked;
            
            saveConsent({
                essentials: true,
                preferences: preferences,
                analytics: analytics,
                advertising: advertising,
                timestamp: new Date().toISOString()
            });
            hideCustomizePanel();
            hideBanner();
        });
    }

    function showCustomizePanel() {
        const panel = document.getElementById('cookie-customize-panel');
        if (panel) {
            // Load current settings if consent exists
            if (state.consent) {
                document.getElementById('preferences-toggle').checked = state.consent.preferences || false;
                document.getElementById('analytics-toggle').checked = state.consent.analytics || false;
                document.getElementById('advertising-toggle').checked = state.consent.advertising || false;
            }
            panel.classList.add('visible');
        }
    }

    function hideCustomizePanel() {
        const panel = document.getElementById('cookie-customize-panel');
        if (panel) {
            panel.classList.remove('visible');
        }
    }

    // ============================================
    // BANNER VISIBILITY CONTROL
    // ============================================
    function showBanner() {
        const banner = document.getElementById('cookie-consent-banner');
        if (banner) {
            banner.classList.add('visible');
        }
    }

    function hideBanner() {
        const banner = document.getElementById('cookie-consent-banner');
        if (banner) {
            banner.classList.remove('visible');
        }
    }

    // ============================================
    // CSS STYLES INJECTION
    // ============================================
    const style = document.createElement('style');
    style.textContent = `
        .cookie-consent-banner {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 100%);
            border-top: 2px solid #00d4ff;
            box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.5);
            z-index: 10000;
            padding: 1.5rem;
            transform: translateY(100%);
            transition: transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            backdrop-filter: blur(15px);
        }
        .cookie-consent-banner.visible {
            transform: translateY(0);
        }
        .cookie-consent-content {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 2rem;
            flex-wrap: wrap;
        }
        .cookie-consent-text {
            flex: 1;
            min-width: 300px;
        }
        .cookie-consent-text h3 {
            font-size: 1.5rem;
            font-weight: 700;
            color: #00d4ff;
            margin-bottom: 0.5rem;
        }
        .cookie-consent-text p {
            color: #b0b0b0;
            line-height: 1.6;
            font-size: 0.95rem;
            margin: 0;
        }
        .cookie-consent-actions {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
        }
        .cookie-btn {
            padding: 0.75rem 1.5rem;
            border-radius: 10px;
            font-weight: 600;
            font-size: 0.95rem;
            cursor: pointer;
            transition: all 0.3s ease;
            border: none;
            white-space: nowrap;
        }
        .cookie-btn-primary {
            background: linear-gradient(135deg, #00d4ff, #7b2ff7);
            color: #ffffff;
            box-shadow: 0 5px 20px rgba(0, 212, 255, 0.3);
        }
        .cookie-btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 212, 255, 0.5);
        }
        .cookie-btn-secondary {
            background: rgba(255, 255, 255, 0.05);
            color: #ffffff;
            border: 2px solid rgba(255, 255, 255, 0.1);
        }
        .cookie-btn-secondary:hover {
            border-color: #00d4ff;
            background: rgba(0, 212, 255, 0.1);
        }
        .cookie-btn-link {
            background: transparent;
            color: #00d4ff;
            text-decoration: underline;
            padding: 0.75rem 1rem;
        }
        .cookie-btn-link:hover {
            color: #7b2ff7;
        }
        .cookie-customize-panel {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
            z-index: 20000;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            padding: 2rem;
        }
        .cookie-customize-panel.visible {
            opacity: 1;
            visibility: visible;
        }
        .cookie-customize-content {
            background: linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 100%);
            border: 2px solid #00d4ff;
            border-radius: 25px;
            width: 100%;
            max-width: 700px;
            max-height: 90vh;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            transform: scale(0.9);
            transition: transform 0.3s ease;
        }
        .cookie-customize-panel.visible .cookie-customize-content {
            transform: scale(1);
        }
        .cookie-customize-header {
            padding: 2rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: rgba(0, 212, 255, 0.05);
        }
        .cookie-customize-header h3 {
            font-size: 1.75rem;
            font-weight: 700;
            color: #00d4ff;
            margin: 0;
        }
        .cookie-close-btn {
            background: transparent;
            border: none;
            color: #ffffff;
            font-size: 2.5rem;
            cursor: pointer;
            width: 45px;
            height: 45px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.3s ease;
            line-height: 1;
        }
        .cookie-close-btn:hover {
            background: rgba(255, 0, 0, 0.2);
            color: #ff006e;
            transform: rotate(90deg);
        }
        .cookie-customize-body {
            padding: 2rem;
            overflow-y: auto;
            flex: 1;
        }
        .cookie-category {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            transition: all 0.3s ease;
        }
        .cookie-category:hover {
            border-color: #00d4ff;
            background: rgba(0, 212, 255, 0.05);
        }
        .cookie-category-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 1.5rem;
        }
        .cookie-category-header h4 {
            font-size: 1.25rem;
            font-weight: 600;
            color: #00d4ff;
            margin-bottom: 0.5rem;
        }
        .cookie-category-header p {
            color: #b0b0b0;
            font-size: 0.9rem;
            line-height: 1.5;
            margin: 0;
        }
        .cookie-switch {
            position: relative;
            display: inline-block;
            width: 60px;
            height: 30px;
            cursor: pointer;
        }
        .cookie-switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }
        .cookie-switch-slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.1);
            transition: 0.3s;
            border-radius: 30px;
        }
        .cookie-switch-slider:before {
            position: absolute;
            content: "";
            height: 20px;
            width: 20px;
            left: 4px;
            bottom: 3px;
            background-color: #b0b0b0;
            transition: 0.3s;
            border-radius: 50%;
        }
        .cookie-switch input:checked + .cookie-switch-slider {
            background: linear-gradient(135deg, #00d4ff, #7b2ff7);
            border-color: #00d4ff;
        }
        .cookie-switch input:checked + .cookie-switch-slider:before {
            transform: translateX(30px);
            background-color: #ffffff;
        }
        .cookie-switch.disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        .cookie-switch.disabled .cookie-switch-slider {
            background: rgba(0, 212, 255, 0.3);
            border-color: #00d4ff;
        }
        .cookie-switch.disabled .cookie-switch-slider:before {
            background-color: #ffffff;
            transform: translateX(30px);
        }
        .cookie-customize-footer {
            padding: 1.5rem 2rem;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(0, 212, 255, 0.05);
            display: flex;
            gap: 1rem;
            justify-content: flex-end;
            flex-wrap: wrap;
        }
        .cookie-ai-popup {
            position: fixed;
            bottom: 120px;
            right: 20px;
            background: linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 100%);
            border: 2px solid #00d4ff;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
            z-index: 10001;
            max-width: 350px;
            opacity: 0;
            visibility: hidden;
            transform: translateY(20px) scale(0.9);
            transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        .cookie-ai-popup.visible {
            opacity: 1;
            visibility: visible;
            transform: translateY(0) scale(1);
        }
        .cookie-ai-content {
            padding: 1.5rem;
        }
        .cookie-ai-header {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 1rem;
        }
        .cookie-ai-icon {
            font-size: 2rem;
            animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
        .cookie-ai-header h4 {
            font-size: 1.25rem;
            font-weight: 700;
            color: #00d4ff;
            margin: 0;
        }
        .cookie-ai-message {
            margin-bottom: 1.5rem;
        }
        .cookie-ai-message p {
            color: #b0b0b0;
            line-height: 1.6;
            font-size: 0.9rem;
            margin: 0 0 0.5rem 0;
        }
        .cookie-ai-actions {
            display: flex;
            gap: 0.75rem;
        }
        .cookie-ai-actions .cookie-btn {
            flex: 1;
            padding: 0.625rem 1rem;
            font-size: 0.9rem;
        }
        @media (max-width: 768px) {
            .cookie-consent-content {
                flex-direction: column;
                align-items: stretch;
            }
            .cookie-consent-actions {
                width: 100%;
                flex-direction: column;
            }
            .cookie-btn {
                width: 100%;
            }
            .cookie-ai-popup {
                right: 10px;
                left: 10px;
                max-width: none;
                bottom: 100px;
            }
        }
    `;
    document.head.appendChild(style);

    // ============================================
    // START INITIALIZATION
    // ============================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
