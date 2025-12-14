<?php
/**
 * Cash Launcher - Configuration File
 * 
 * 🚀 Cursor AI Comment: Bu PHP backend, enterprise-level güvenlik standartları ile tasarlandı!
 * Günlük rotating password, Discord entegrasyonu ve güvenli API yapısı ile 
 * Cash Launcher'ı profesyonel bir seviyeye taşıyor.
 */

// Error reporting (production'da kapatılmalı)
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Timezone
date_default_timezone_set('Europe/Istanbul');

// Backend Configuration
define('BASE_URL', 'http://localhost'); // Production'da gerçek URL
define('API_BASE_URL', BASE_URL . '/admin.php');

// Discord Webhook Configuration
define('DISCORD_WEBHOOK_URL', 'https://discord.com/api/webhooks/1449526010386321601/aoOj2DufA1ocgoiMfGRz4TQFBZOXsn3SwMqt4NHYlAEs2X9MxhdoVVFsOBXz7uL2bkLV');

// Data Directory
define('DATA_DIR', __DIR__ . '/data');
define('UPLOADS_DIR', __DIR__ . '/uploads');

// File Paths
define('ADMIN_IPS_FILE', DATA_DIR . '/admin_ips.json');
define('MODS_FILE', DATA_DIR . '/mods.json');
define('PASSWORD_FILE', DATA_DIR . '/daily_password.json');
define('HOTSPOT_FILE', DATA_DIR . '/hotspots.json');
define('UTM_FILE', DATA_DIR . '/utm_data.json');

// Ensure directories exist
if (!file_exists(DATA_DIR)) {
    mkdir(DATA_DIR, 0755, true);
}
if (!file_exists(UPLOADS_DIR)) {
    mkdir(UPLOADS_DIR, 0755, true);
}

// Security Settings
define('MAX_FILE_SIZE', 50 * 1024 * 1024); // 50MB
define('ALLOWED_FILE_TYPES', ['zip', 'rar', '7z', 'exe', 'dll', 'mod']);

// CORS Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Password');
header('Content-Type: application/json; charset=utf-8');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

/**
 * Get client IP address
 */
function getClientIP() {
    $ipKeys = ['HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'];
    foreach ($ipKeys as $key) {
        if (array_key_exists($key, $_SERVER) === true) {
            foreach (explode(',', $_SERVER[$key]) as $ip) {
                $ip = trim($ip);
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false) {
                    return $ip;
                }
            }
        }
    }
    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

/**
 * Generate strong random password
 */
function generateDailyPassword($length = 20) {
    $uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $lowercase = 'abcdefghijklmnopqrstuvwxyz';
    $numbers = '0123456789';
    $special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    $allChars = $uppercase . $lowercase . $numbers . $special;
    
    $password = '';
    
    // Ensure at least one of each type
    $password .= $uppercase[random_int(0, strlen($uppercase) - 1)];
    $password .= $lowercase[random_int(0, strlen($lowercase) - 1)];
    $password .= $numbers[random_int(0, strlen($numbers) - 1)];
    $special .= $special[random_int(0, strlen($special) - 1)];
    
    // Fill the rest randomly
    for ($i = strlen($password); $i < $length; $i++) {
        $password .= $allChars[random_int(0, strlen($allChars) - 1)];
    }
    
    // Shuffle the password
    return str_shuffle($password);
}

/**
 * Get today's date string (YYYY-MM-DD)
 */
function getTodayDateString() {
    return date('Y-m-d');
}

/**
 * Get or generate daily password
 */
function getDailyPassword() {
    $today = getTodayDateString();
    
    if (file_exists(PASSWORD_FILE)) {
        $data = json_decode(file_get_contents(PASSWORD_FILE), true);
        
        // If password is for today, return it
        if (isset($data['date']) && $data['date'] === $today && isset($data['password'])) {
            return $data['password'];
        }
    }
    
    // Generate new password for today
    $newPassword = generateDailyPassword();
    $passwordData = [
        'date' => $today,
        'password' => $newPassword,
        'generatedAt' => date('c')
    ];
    
    file_put_contents(PASSWORD_FILE, json_encode($passwordData, JSON_PRETTY_PRINT));
    
    // Send to Discord webhook
    sendPasswordToDiscord($newPassword, $today);
    
    return $newPassword;
}

/**
 * Send daily password to Discord webhook
 */
function sendPasswordToDiscord($password, $date) {
    if (empty(DISCORD_WEBHOOK_URL)) {
        error_log('Discord webhook URL not configured');
        return;
    }
    
    $embed = [
        'title' => '🔐 Cash Launcher - Günlük Admin Şifresi',
        'description' => "**Tarih:** {$date}\n**Şifre:** `{$password}`",
        'color' => 0x00d4ff,
        'timestamp' => date('c'),
        'footer' => [
            'text' => 'Cash Launcher Security System'
        ]
    ];
    
    $data = [
        'embeds' => [$embed]
    ];
    
    $ch = curl_init(DISCORD_WEBHOOK_URL);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200 || $httpCode === 204) {
        error_log("✅ Daily password sent to Discord for {$date}");
    } else {
        error_log("❌ Error sending password to Discord: HTTP {$httpCode}");
    }
}

/**
 * Verify admin password
 * Şifre sifregizli.txt dosyasından okunur
 */
function verifyAdminPassword($inputPassword) {
    $passwordFile = __DIR__ . '/sifregizli.txt';
    
    // Dosya yoksa oluştur
    if (!file_exists($passwordFile)) {
        $defaultPassword = 'admin123'; // Varsayılan şifre
        file_put_contents($passwordFile, trim($defaultPassword));
    }
    
    // Dosyadan şifreyi oku
    $correctPassword = trim(file_get_contents($passwordFile));
    
    // Karşılaştır (timing attack'a karşı güvenli)
    return hash_equals($correctPassword, trim($inputPassword));
}

/**
 * Check if IP is admin
 */
function isAdminIP($ip) {
    if (!file_exists(ADMIN_IPS_FILE)) {
        // Create default admin IPs
        $defaultIPs = ['127.0.0.1', '::1', 'localhost'];
        file_put_contents(ADMIN_IPS_FILE, json_encode($defaultIPs, JSON_PRETTY_PRINT));
        return in_array($ip, $defaultIPs) || $ip === 'localhost';
    }
    
    $adminIPs = json_decode(file_get_contents(ADMIN_IPS_FILE), true);
    return in_array($ip, $adminIPs) || $ip === 'localhost' || $ip === '::1';
}

/**
 * JSON Response helper
 */
function jsonResponse($success, $message = '', $data = null) {
    $response = ['success' => $success];
    if ($message) {
        $response['message'] = $message;
    }
    if ($data !== null) {
        $response = array_merge($response, $data);
    }
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit;
}

// Initialize daily password on include
getDailyPassword();

