/**
 * Cash Launcher - Main JavaScript File
 * Handles interactive functionality for the website
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all features
    initDownloadButton();
    initCursorPanel();
    initAdminPanel();
    
    /**
     * Initialize download button functionality
     */
    function initDownloadButton() {
        const downloadBtn = document.getElementById('downloadBtn');
        
        if (downloadBtn) {
            downloadBtn.addEventListener('click', handleDownload);
        }
    }
    
    /**
     * Handle download button click
     * Shows an alert and simulates download action
     */
    function handleDownload() {
        // Show alert message
        alert('Thank you for downloading Cash Launcher!\n\nYour download will begin shortly...');
        
        // Simulate download action
        simulateDownload();
    }
    
    /**
     * Simulate download action
     * Creates a temporary download link and triggers it
     */
    function simulateDownload() {
        // Create a temporary anchor element
        const link = document.createElement('a');
        
        // Set download attributes
        link.href = '#'; // In production, this would be the actual download URL
        link.download = 'CashLauncher.exe'; // Filename for download
        
        // Append to body, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Log download action
        console.log('Download initiated: CashLauncher.exe');
        
        // Show success message after a short delay
        setTimeout(function() {
            console.log('Download simulation completed');
        }, 1000);
    }
    
    /**
     * Initialize interactive cursor panel
     */
    function initCursorPanel() {
        const features = document.querySelectorAll('.cursor-feature');
        const navDots = document.querySelectorAll('.nav-dot');
        let currentFeature = 0;
        
        // Feature descriptions in Turkish
        const featureDescriptions = {
            speed: {
                title: 'Lightning Fast',
                description: 'Cash Launcher, oyun başlatma sürecini optimize ederek saniyeler içinde oyunlarınızı açmanızı sağlar. Gelişmiş önbellekleme teknolojisi ve akıllı kaynak yönetimi sayesinde, launcher\'ımız oyunlarınızı geleneksel yöntemlere göre %300 daha hızlı başlatır. SSD optimizasyonu ve paralel işleme ile bekleme sürelerini minimize eder, oyun deneyiminizi kesintisiz hale getirir.',
                stats: [
                    { value: '0.8s', label: 'Ortalama Başlatma' },
                    { value: '%300', label: 'Daha Hızlı' }
                ]
            },
            security: {
                title: 'Bank-Level Security',
                description: 'Cash Launcher, bankacılık seviyesinde güvenlik standartları ile verilerinizi korur. AES-256 şifreleme, iki faktörlü kimlik doğrulama (2FA) ve gerçek zamanlı tehdit tespiti ile hesabınız ve oyun verileriniz tam güvende. SSL/TLS protokolleri ile tüm iletişimler şifrelenir ve güvenli sunucular üzerinde saklanır. Düzenli güvenlik güncellemeleri ve penetrasyon testleri ile sisteminiz her zaman en yüksek güvenlik seviyesinde kalır.',
                stats: [
                    { value: 'AES-256', label: 'Şifreleme' },
                    { value: '24/7', label: 'Güvenlik İzleme' }
                ]
            }
        };
        
        /**
         * Switch to a specific feature
         */
        function switchFeature(index) {
            // Remove active class from all features and dots
            features.forEach(feature => feature.classList.remove('active'));
            navDots.forEach(dot => dot.classList.remove('active'));
            
            // Add active class to selected feature and dot
            if (features[index]) {
                features[index].classList.add('active');
            }
            if (navDots[index]) {
                navDots[index].classList.add('active');
            }
            
            currentFeature = index;
        }
        
        // Add click event listeners to navigation dots
        navDots.forEach((dot, index) => {
            dot.addEventListener('click', function() {
                switchFeature(index);
            });
        });
        
        // Auto-rotate features every 5 seconds
        setInterval(function() {
            currentFeature = (currentFeature + 1) % features.length;
            switchFeature(currentFeature);
        }, 5000);
        
        // Make cursor panel clickable (click anywhere to switch)
        const cursorPanel = document.querySelector('.cursor-panel');
        if (cursorPanel) {
            cursorPanel.addEventListener('click', function(e) {
                // Don't switch if clicking on navigation dots
                if (!e.target.closest('.feature-nav')) {
                    currentFeature = (currentFeature + 1) % features.length;
                    switchFeature(currentFeature);
                }
            });
        }
    }
    
    /**
     * Initialize admin/mod panel functionality
     */
    function initAdminPanel() {
        const adminToggle = document.getElementById('adminToggle');
        const adminPanel = document.getElementById('adminPanel');
        const adminClose = document.getElementById('adminClose');
        const modeButtons = document.querySelectorAll('.mode-btn');
        
        let currentMode = 'normal';
        
        // Toggle admin panel
        if (adminToggle && adminPanel) {
            adminToggle.addEventListener('click', function() {
                adminPanel.classList.toggle('active');
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
                // Remove active class from all buttons
                modeButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked button
                this.classList.add('active');
                
                // Get mode from data attribute
                const mode = this.getAttribute('data-mode');
                currentMode = mode;
                
                // Update page based on mode
                updateMode(mode);
                
                console.log('Mode switched to:', mode);
            });
        });
        
        /**
         * Update page appearance and behavior based on selected mode
         */
        function updateMode(mode) {
            const body = document.body;
            const heroSection = document.querySelector('.hero-section');
            const cursorPanel = document.querySelector('.cursor-panel');
            
            // Remove previous mode classes
            body.classList.remove('mode-normal', 'mode-admin', 'mode-mod');
            heroSection?.classList.remove('mode-normal', 'mode-admin', 'mode-mod');
            cursorPanel?.classList.remove('mode-normal', 'mode-admin', 'mode-mod');
            
            // Add new mode class
            body.classList.add('mode-' + mode);
            heroSection?.classList.add('mode-' + mode);
            cursorPanel?.classList.add('mode-' + mode);
            
            // Update download button text based on mode
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
        
        // Close panel when clicking outside
        document.addEventListener('click', function(e) {
            if (adminPanel && adminPanel.classList.contains('active')) {
                if (!adminPanel.contains(e.target) && !adminToggle.contains(e.target)) {
                    adminPanel.classList.remove('active');
                }
            }
        });
    }
    
    // Add smooth scroll behavior for better UX
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

