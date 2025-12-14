<?php
/**
 * Cookie Consent Handler
 * Handles cookie consent settings and cookie management
 */

// Error reporting (production'da kapatılmalı)
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Timezone
date_default_timezone_set('Europe/Istanbul');

// CORS Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

/**
 * Check if HTTPS is enabled
 */
function isSecure() {
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') 
        || $_SERVER['SERVER_PORT'] == 443
        || (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');
}

/**
 * Set cookie with proper security settings
 */
function setSecureCookie($name, $value, $days = 365) {
    $expires = time() + ($days * 24 * 60 * 60);
    $secure = isSecure();
    
    // HttpOnly for session and security cookies only
    $httpOnly = in_array($name, ['PHPSESSID', 'csrf_token', 'session_id']);
    
    // Build cookie string for older PHP versions
    $cookieString = $name . '=' . urlencode($value);
    $cookieString .= '; expires=' . gmdate('D, d M Y H:i:s T', $expires);
    $cookieString .= '; path=/';
    $cookieString .= '; SameSite=Lax';
    
    if ($secure) {
        $cookieString .= '; Secure';
    }
    
    if ($httpOnly) {
        $cookieString .= '; HttpOnly';
    }
    
    // Use header() for better compatibility
    header('Set-Cookie: ' . $cookieString, false);
    
    return true;
}

/**
 * Delete cookie
 */
function deleteSecureCookie($name) {
    $secure = isSecure();
    $httpOnly = in_array($name, ['PHPSESSID', 'csrf_token', 'session_id']);
    
    // Build cookie deletion string
    $cookieString = $name . '=';
    $cookieString .= '; expires=' . gmdate('D, d M Y H:i:s T', time() - 3600);
    $cookieString .= '; path=/';
    $cookieString .= '; SameSite=Lax';
    
    if ($secure) {
        $cookieString .= '; Secure';
    }
    
    if ($httpOnly) {
        $cookieString .= '; HttpOnly';
    }
    
    // Use header() for better compatibility
    header('Set-Cookie: ' . $cookieString, false);
    
    return true;
}

/**
 * Start session if not already started
 */
function ensureSession() {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
}

/**
 * Generate CSRF token
 */
function generateCSRFToken() {
    ensureSession();
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

// Get request data
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || !isset($data['action'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit;
}

$action = $data['action'];
$response = ['success' => true];

try {
    switch ($action) {
        case 'init_essentials':
            // Initialize essentials cookies (always active)
            ensureSession();
            generateCSRFToken();
            
            // Set session cookie (handled by PHP session, but ensure it's set)
            if (!isset($_COOKIE['PHPSESSID'])) {
                setSecureCookie('PHPSESSID', session_id(), 0);
            }
            
            // Set CSRF token cookie
            setSecureCookie('csrf_token', $_SESSION['csrf_token'], 1);
            
            // Set site functionality cookie
            setSecureCookie('site_functionality', 'enabled', 365);
            
            $response['message'] = 'Essentials cookies initialized';
            break;
            
        case 'save':
            // Save cookie consent
            if (!isset($data['consent'])) {
                throw new Exception('Consent data missing');
            }
            
            $consent = $data['consent'];
            
            // Always set essentials cookies
            ensureSession();
            generateCSRFToken();
            
            // Set session cookie (handled by PHP session)
            if (!isset($_COOKIE['PHPSESSID'])) {
                setSecureCookie('PHPSESSID', session_id(), 0);
            }
            
            // Set CSRF token cookie
            setSecureCookie('csrf_token', $_SESSION['csrf_token'], 1);
            
            // Set site functionality cookie
            setSecureCookie('site_functionality', 'enabled', 365);
            
            // Set preferences cookies if enabled
            if (isset($consent['preferences']) && $consent['preferences']) {
                setSecureCookie('theme_preference', 'dark', 365);
                setSecureCookie('language_preference', 'tr', 365);
            } else {
                deleteSecureCookie('theme_preference');
                deleteSecureCookie('language_preference');
            }
            
            // Set advertising cookies if enabled
            if (isset($consent['advertising']) && $consent['advertising']) {
                $analyticsId = isset($data['analytics_id']) ? $data['analytics_id'] : 'analytics_' . time() . '_' . bin2hex(random_bytes(8));
                setSecureCookie('ad_tracking', 'enabled', 365);
                setSecureCookie('analytics_id', $analyticsId, 365);
            } else {
                deleteSecureCookie('ad_tracking');
                deleteSecureCookie('analytics_id');
            }
            
            // Save consent preference cookie
            setSecureCookie('cookie_consent', json_encode([
                'essentials' => true,
                'preferences' => $consent['preferences'] ?? false,
                'advertising' => $consent['advertising'] ?? false,
                'timestamp' => date('c')
            ]), 365);
            
            $response['message'] = 'Cookie preferences saved successfully';
            break;
            
        case 'delete':
            // Delete specific cookie category
            if (!isset($data['category'])) {
                throw new Exception('Category missing');
            }
            
            $category = $data['category'];
            
            switch ($category) {
                case 'preferences':
                    deleteSecureCookie('theme_preference');
                    deleteSecureCookie('language_preference');
                    break;
                    
                case 'advertising':
                    deleteSecureCookie('ad_tracking');
                    deleteSecureCookie('analytics_id');
                    break;
            }
            
            $response['message'] = 'Cookies deleted successfully';
            break;
            
        default:
            throw new Exception('Unknown action');
    }
    
} catch (Exception $e) {
    http_response_code(400);
    $response = [
        'success' => false,
        'message' => $e->getMessage()
    ];
}

echo json_encode($response, JSON_UNESCAPED_UNICODE);
exit;
