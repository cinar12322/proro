<?php
/**
 * Cash Launcher - Admin Panel
 * 
 * Bu sayfa şifre korumalıdır. Şifre sifregizli.txt dosyasından okunur.
 * HTML veya JavaScript içinde şifre bilgisi bulunmaz.
 */

require_once 'config.php';

// Session başlat
session_start();

// API endpoint kontrolü - action parametresi varsa API modunda çalış
$action = $_GET['action'] ?? '';
if (!empty($action)) {
    // API endpoint modu
    handleAPIRequest($action);
    exit;
}

// Logout işlemi
if (isset($_GET['logout'])) {
    session_destroy();
    header('Location: admin.php');
    exit;
}

// POST isteği - şifre kontrolü (sadece HTML formundan)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['password']) && empty($action)) {
    $inputPassword = $_POST['password'] ?? '';
    
    if (verifyAdminPassword($inputPassword)) {
        // Şifre doğru - session'a kaydet
        $_SESSION['admin_authenticated'] = true;
        $_SESSION['admin_login_time'] = time();
        
        // Admin paneli göster
        showAdminPanel();
        exit;
    } else {
        // Şifre yanlış
        $error = 'Geçersiz şifre!';
        showLoginForm($error);
        exit;
    }
}

// GET isteği veya session kontrolü (HTML sayfası)
if (isset($_SESSION['admin_authenticated']) && $_SESSION['admin_authenticated'] === true) {
    // Session geçerli - admin paneli göster
    showAdminPanel();
    exit;
} else {
    // Şifre formu göster
    showLoginForm();
    exit;
}

/**
 * API isteklerini yönet
 */
function handleAPIRequest($action) {
    $method = $_SERVER['REQUEST_METHOD'];
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    
    // Route requests
    switch ($action) {
        case 'health':
            handleHealth();
            break;
        
        case 'user_status':
            handleUserStatus();
            break;
        
        case 'admin_verify':
            handleAdminVerify($input);
            break;
        
        case 'get_ips':
            handleGetIPs();
            break;
        
        case 'add_ip':
            handleAddIP($input);
            break;
        
        case 'remove_ip':
            handleRemoveIP();
            break;
        
        case 'get_mods':
            handleGetMods();
            break;
        
        case 'add_mod':
            handleAddMod($input);
            break;
        
        case 'delete_mod':
            handleDeleteMod();
            break;
        
        case 'save_hotspot':
            handleSaveHotspot($input);
            break;
        
        case 'save_utm':
            handleSaveUTM($input);
            break;
        
        case 'get_analytics':
            handleGetAnalytics();
            break;
        
        default:
            jsonResponse(false, 'Invalid action');
    }
}

/**
 * Health check endpoint
 */
function handleHealth() {
    jsonResponse(true, 'Cash Launcher Backend is running', [
        'timestamp' => date('c'),
        'version' => '2.0.0'
    ]);
}

/**
 * Get user status
 */
function handleUserStatus() {
    $clientIP = getClientIP();
    $isAdmin = isAdminIP($clientIP);
    
    jsonResponse(true, '', [
        'ip' => $clientIP,
        'isAdmin' => $isAdmin,
        'canAccessAdmin' => false
    ]);
}

/**
 * Verify admin password
 */
function handleAdminVerify($input) {
    $password = $input['password'] ?? '';
    $clientIP = getClientIP();
    
    if (empty($password)) {
        jsonResponse(false, 'Şifre gerekli');
    }
    
    $isValid = verifyAdminPassword($password);
    $isIPAdmin = isAdminIP($clientIP);
    
    if ($isValid) {
        jsonResponse(true, 'Admin doğrulaması başarılı', [
            'ip' => $clientIP
        ]);
    } else {
        error_log("❌ Failed admin verification from IP: {$clientIP}");
        jsonResponse(false, 'Geçersiz admin şifresi');
    }
}

/**
 * Get admin IPs (requires admin auth)
 */
function handleGetIPs() {
    if (!verifyAdminRequest()) {
        return;
    }
    
    if (!file_exists(ADMIN_IPS_FILE)) {
        $defaultIPs = ['127.0.0.1', '::1', 'localhost'];
        file_put_contents(ADMIN_IPS_FILE, json_encode($defaultIPs, JSON_PRETTY_PRINT));
        jsonResponse(true, '', ['ips' => $defaultIPs]);
    }
    
    $adminIPs = json_decode(file_get_contents(ADMIN_IPS_FILE), true);
    jsonResponse(true, '', ['ips' => $adminIPs]);
}

/**
 * Add admin IP (requires admin auth)
 */
function handleAddIP($input) {
    if (!verifyAdminRequest()) {
        return;
    }
    
    $ip = $input['ip'] ?? '';
    
    if (empty($ip)) {
        jsonResponse(false, 'IP adresi gerekli');
    }
    
    // Basic IP validation
    $ipRegex = '/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^localhost$|^::1$|^127\.0\.0\.1$/';
    if (!preg_match($ipRegex, $ip) && $ip !== 'localhost') {
        jsonResponse(false, 'Geçersiz IP adresi formatı');
    }
    
    $adminIPs = file_exists(ADMIN_IPS_FILE) 
        ? json_decode(file_get_contents(ADMIN_IPS_FILE), true) 
        : [];
    
    if (in_array($ip, $adminIPs)) {
        jsonResponse(false, 'Bu IP zaten listede');
    }
    
    $adminIPs[] = $ip;
    file_put_contents(ADMIN_IPS_FILE, json_encode($adminIPs, JSON_PRETTY_PRINT));
    
    $clientIP = getClientIP();
    error_log("✅ Admin IP added: {$ip} by {$clientIP}");
    
    jsonResponse(true, 'IP başarıyla eklendi', ['ips' => $adminIPs]);
}

/**
 * Remove admin IP (requires admin auth)
 */
function handleRemoveIP() {
    if (!verifyAdminRequest()) {
        return;
    }
    
    $ip = $_GET['ip'] ?? '';
    
    if (empty($ip)) {
        jsonResponse(false, 'IP adresi gerekli');
    }
    
    if (!file_exists(ADMIN_IPS_FILE)) {
        jsonResponse(false, 'IP listesi bulunamadı');
    }
    
    $adminIPs = json_decode(file_get_contents(ADMIN_IPS_FILE), true);
    
    if (!in_array($ip, $adminIPs)) {
        jsonResponse(false, 'IP listede bulunamadı');
    }
    
    $adminIPs = array_values(array_filter($adminIPs, function($adminIP) use ($ip) {
        return $adminIP !== $ip;
    }));
    
    file_put_contents(ADMIN_IPS_FILE, json_encode($adminIPs, JSON_PRETTY_PRINT));
    
    $clientIP = getClientIP();
    error_log("✅ Admin IP removed: {$ip} by {$clientIP}");
    
    jsonResponse(true, 'IP başarıyla kaldırıldı', ['ips' => $adminIPs]);
}

/**
 * Get all mods
 */
function handleGetMods() {
    if (!file_exists(MODS_FILE)) {
        jsonResponse(true, '', ['mods' => []]);
    }
    
    $mods = json_decode(file_get_contents(MODS_FILE), true);
    jsonResponse(true, '', ['mods' => $mods ?? []]);
}

/**
 * Add mod (requires admin auth)
 */
function handleAddMod($input) {
    if (!verifyAdminRequest()) {
        return;
    }
    
    $name = $input['name'] ?? '';
    $description = $input['description'] ?? '';
    $file = $input['file'] ?? null;
    
    if (empty($name) || empty($description)) {
        jsonResponse(false, 'Mod adı ve açıklaması gerekli');
    }
    
    $mods = file_exists(MODS_FILE) 
        ? json_decode(file_get_contents(MODS_FILE), true) 
        : [];
    
    $newMod = [
        'id' => time() . rand(1000, 9999),
        'name' => $name,
        'description' => $description,
        'file' => $file,
        'createdAt' => date('c'),
        'createdBy' => getClientIP()
    ];
    
    $mods[] = $newMod;
    file_put_contents(MODS_FILE, json_encode($mods, JSON_PRETTY_PRINT));
    
    $clientIP = getClientIP();
    error_log("✅ Mod added: {$name} by {$clientIP}");
    
    jsonResponse(true, 'Mod başarıyla eklendi', ['mod' => $newMod]);
}

/**
 * Delete mod (requires admin auth)
 */
function handleDeleteMod() {
    if (!verifyAdminRequest()) {
        return;
    }
    
    $id = $_GET['id'] ?? '';
    
    if (empty($id)) {
        jsonResponse(false, 'Mod ID gerekli');
    }
    
    if (!file_exists(MODS_FILE)) {
        jsonResponse(false, 'Mod bulunamadı');
    }
    
    $mods = json_decode(file_get_contents(MODS_FILE), true);
    $modIndex = -1;
    
    foreach ($mods as $index => $mod) {
        if (isset($mod['id']) && $mod['id'] == $id) {
            $modIndex = $index;
            break;
        }
    }
    
    if ($modIndex === -1) {
        jsonResponse(false, 'Mod bulunamadı');
    }
    
    unset($mods[$modIndex]);
    $mods = array_values($mods);
    
    file_put_contents(MODS_FILE, json_encode($mods, JSON_PRETTY_PRINT));
    
    $clientIP = getClientIP();
    error_log("✅ Mod deleted: {$id} by {$clientIP}");
    
    jsonResponse(true, 'Mod başarıyla silindi');
}

/**
 * Save hotspot data
 */
function handleSaveHotspot($input) {
    $hotspot = [
        'x' => $input['x'] ?? 0,
        'y' => $input['y'] ?? 0,
        'timestamp' => time(),
        'sessionId' => $input['sessionId'] ?? '',
        'type' => $input['type'] ?? 'move',
        'ip' => getClientIP()
    ];
    
    $hotspots = file_exists(HOTSPOT_FILE) 
        ? json_decode(file_get_contents(HOTSPOT_FILE), true) 
        : [];
    
    $hotspots[] = $hotspot;
    
    // Keep only last 10000 hotspots
    if (count($hotspots) > 10000) {
        $hotspots = array_slice($hotspots, -10000);
    }
    
    file_put_contents(HOTSPOT_FILE, json_encode($hotspots, JSON_PRETTY_PRINT));
    
    jsonResponse(true, 'Hotspot kaydedildi');
}

/**
 * Save UTM data
 */
function handleSaveUTM($input) {
    $utmData = [
        'type' => $input['type'] ?? 'event',
        'sessionId' => $input['sessionId'] ?? '',
        'ip' => getClientIP(),
        'data' => $input['data'] ?? [],
        'timestamp' => date('c')
    ];
    
    $utmRecords = file_exists(UTM_FILE) 
        ? json_decode(file_get_contents(UTM_FILE), true) 
        : [];
    
    $utmRecords[] = $utmData;
    
    // Keep only last 5000 records
    if (count($utmRecords) > 5000) {
        $utmRecords = array_slice($utmRecords, -5000);
    }
    
    file_put_contents(UTM_FILE, json_encode($utmRecords, JSON_PRETTY_PRINT));
    
    jsonResponse(true, 'UTM verisi kaydedildi');
}

/**
 * Get analytics data (requires admin auth)
 */
function handleGetAnalytics() {
    if (!verifyAdminRequest()) {
        return;
    }
    
    $hotspots = file_exists(HOTSPOT_FILE) 
        ? json_decode(file_get_contents(HOTSPOT_FILE), true) 
        : [];
    
    $utmRecords = file_exists(UTM_FILE) 
        ? json_decode(file_get_contents(UTM_FILE), true) 
        : [];
    
    // Calculate statistics
    $totalClicks = 0;
    $totalViews = 0;
    $uniqueSessions = [];
    
    foreach ($utmRecords as $record) {
        if (isset($record['type'])) {
            if ($record['type'] === 'click') {
                $totalClicks++;
            } elseif ($record['type'] === 'pageview') {
                $totalViews++;
            }
        }
        if (isset($record['sessionId'])) {
            $uniqueSessions[$record['sessionId']] = true;
        }
    }
    
    jsonResponse(true, '', [
        'hotspots' => array_slice($hotspots, -1000), // Last 1000
        'utmRecords' => array_slice($utmRecords, -100), // Last 100
        'stats' => [
            'totalClicks' => $totalClicks,
            'totalViews' => $totalViews,
            'uniqueVisitors' => count($uniqueSessions)
        ]
    ]);
}

/**
 * Verify admin request
 */
function verifyAdminRequest() {
    // Session kontrolü (HTML sayfasından gelen istekler için)
    if (isset($_SESSION['admin_authenticated']) && $_SESSION['admin_authenticated'] === true) {
        return true;
    }
    
    // API istekleri için şifre kontrolü
    $password = $_SERVER['HTTP_X_ADMIN_PASSWORD'] ?? $_POST['password'] ?? '';
    
    if (empty($password)) {
        jsonResponse(false, 'Admin şifresi gerekli');
        return false;
    }
    
    if (!verifyAdminPassword($password)) {
        $clientIP = getClientIP();
        error_log("❌ Failed admin request from IP: {$clientIP}");
        jsonResponse(false, 'Geçersiz admin şifresi');
        return false;
    }
    
    return true;
}

/**
 * Şifre giriş formunu göster
 */
function showLoginForm($error = '') {
    ?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Panel - Cash Launcher</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="css/style.css">
    <style>
        .login-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .login-box {
            background: rgba(255, 255, 255, 0.95);
            padding: 2rem;
            border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            max-width: 400px;
            width: 100%;
        }
        .login-title {
            text-align: center;
            margin-bottom: 2rem;
            color: #333;
        }
        .login-error {
            color: #dc3545;
            margin-top: 0.5rem;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="login-box">
            <h2 class="login-title">🔐 Admin Panel Girişi</h2>
            <form method="POST" action="admin.php">
                <div class="mb-3">
                    <label for="password" class="form-label">Şifre</label>
                    <input 
                        type="password" 
                        class="form-control" 
                        id="password" 
                        name="password" 
                        required 
                        autofocus
                        autocomplete="off"
                    >
                    <?php if ($error): ?>
                        <div class="login-error"><?php echo htmlspecialchars($error); ?></div>
                    <?php endif; ?>
                </div>
                <button type="submit" class="btn btn-primary w-100">Giriş Yap</button>
            </form>
        </div>
    </div>
</body>
</html>
    <?php
}

/**
 * Admin paneli göster
 */
function showAdminPanel() {
    ?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Panel - Cash Launcher</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="css/style.css">
    <style>
        .admin-container {
            padding: 2rem;
            max-width: 1200px;
            margin: 0 auto;
        }
        .admin-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid #667eea;
        }
        .admin-section {
            background: white;
            padding: 1.5rem;
            border-radius: 10px;
            margin-bottom: 1.5rem;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .admin-section-title {
            color: #333;
            margin-bottom: 1rem;
        }
        .btn-logout {
            background: #dc3545;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 5px;
            cursor: pointer;
        }
        .btn-logout:hover {
            background: #c82333;
        }
    </style>
</head>
<body>
    <div class="admin-container">
        <div class="admin-header">
            <h1>🛡️ Admin Panel</h1>
            <a href="admin.php?logout=1" class="btn-logout" style="text-decoration: none; display: inline-block; padding: 0.5rem 1rem; background: #dc3545; color: white; border-radius: 5px;">Çıkış Yap</a>
        </div>

        <div class="admin-section">
            <h3 class="admin-section-title">Mod Yönetimi</h3>
            <div class="mod-management">
                <div class="add-mod-form">
                    <input type="text" id="modNameInput" class="form-control mb-2" placeholder="Mod Adı">
                    <textarea id="modDescInput" class="form-control mb-2" placeholder="Mod Açıklaması" rows="3"></textarea>
                    <div class="file-upload-container mb-2">
                        <label for="modFileInput" class="form-label">Dosya Seç (Opsiyonel)</label>
                        <input type="file" id="modFileInput" class="form-control" accept=".zip,.rar,.7z,.exe,.dll,.mod">
                    </div>
                    <button class="btn btn-primary" id="addModBtn">Mod Ekle</button>
                </div>
            </div>
        </div>

        <div class="admin-section">
            <h3 class="admin-section-title">Admin IP Yönetimi</h3>
            <div class="ip-management">
                <div class="add-ip-form mb-3">
                    <input type="text" id="newIPInput" class="form-control d-inline-block" style="width: 70%;" placeholder="IP Adresi (örn: 192.168.1.1)">
                    <button class="btn btn-success" id="addIPBtn" style="width: 28%; margin-left: 2%;">IP Ekle</button>
                </div>
                <div class="ip-list-container">
                    <h5>Mevcut Admin IP'leri</h5>
                    <div class="ip-list" id="ipList">
                        <div class="text-muted">Yükleniyor...</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="admin-section">
            <h3 class="admin-section-title">Sistem Bilgileri</h3>
            <div class="admin-info">
                <div class="mb-2">
                    <strong>Launcher Versiyonu:</strong> v2.1.0
                </div>
                <div class="mb-2">
                    <strong>Durum:</strong> <span class="text-success">Online</span>
                </div>
                <div class="mb-2">
                    <strong>Son Güncelleme:</strong> 2025-01-15
                </div>
                <div class="mb-2">
                    <strong>IP Adresi:</strong> <span id="userIP">-</span>
                </div>
            </div>
        </div>

        <div class="admin-section">
            <h3 class="admin-section-title">Kullanıcı Analitiği</h3>
            <div class="analytics-tabs mb-3">
                <button class="btn btn-outline-primary analytics-tab active" data-tab="hotspots">Hotspot Haritası</button>
                <button class="btn btn-outline-primary analytics-tab" data-tab="utm">UTM Raporları</button>
            </div>
            <div class="analytics-content">
                <div class="analytics-tab-content active" id="hotspotsTab">
                    <div class="hotspot-visualization">
                        <canvas id="hotspotCanvas" style="width: 100%; height: 300px; border: 1px solid #ddd;"></canvas>
                    </div>
                </div>
                <div class="analytics-tab-content" id="utmTab" style="display: none;">
                    <div class="utm-reports">
                        <div class="utm-stats mb-3">
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="card">
                                        <div class="card-body text-center">
                                            <h5>Toplam Tıklama</h5>
                                            <h3 id="totalClicks">0</h3>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="card">
                                        <div class="card-body text-center">
                                            <h5>Sayfa Görüntüleme</h5>
                                            <h3 id="totalViews">0</h3>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="card">
                                        <div class="card-body text-center">
                                            <h5>Benzersiz Ziyaretçi</h5>
                                            <h3 id="uniqueVisitors">0</h3>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="table-responsive">
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Zaman</th>
                                        <th>UTM Source</th>
                                        <th>UTM Medium</th>
                                        <th>UTM Campaign</th>
                                        <th>Aksiyon</th>
                                    </tr>
                                </thead>
                                <tbody id="utmTableBody">
                                    <tr>
                                        <td colspan="5" class="text-center text-muted">Henüz veri yok</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        // API Base URL
        const API_BASE_URL = 'admin.php';
        
        // Sayfa yüklendiğinde
        document.addEventListener('DOMContentLoaded', function() {
            loadIPList();
            loadMods();
            updateAnalytics();
            updateUserIP();
            
            // Analytics tab değiştirme
            document.querySelectorAll('.analytics-tab').forEach(tab => {
                tab.addEventListener('click', function() {
                    document.querySelectorAll('.analytics-tab').forEach(t => t.classList.remove('active'));
                    document.querySelectorAll('.analytics-tab-content').forEach(c => c.style.display = 'none');
                    this.classList.add('active');
                    const targetTab = this.getAttribute('data-tab') + 'Tab';
                    document.getElementById(targetTab).style.display = 'block';
                });
            });
            
            // Mod ekleme
            document.getElementById('addModBtn').addEventListener('click', function() {
                const name = document.getElementById('modNameInput').value.trim();
                const desc = document.getElementById('modDescInput').value.trim();
                const file = document.getElementById('modFileInput').files[0];
                
                if (!name || !desc) {
                    alert('Lütfen mod adı ve açıklaması girin!');
                    return;
                }
                
                // API çağrısı yapılacak
                alert('Mod ekleme özelliği API entegrasyonu gerektirir.');
            });
            
            // IP ekleme
            document.getElementById('addIPBtn').addEventListener('click', function() {
                const ip = document.getElementById('newIPInput').value.trim();
                if (!ip) {
                    alert('Lütfen bir IP adresi girin!');
                    return;
                }
                
                // API çağrısı yapılacak
                alert('IP ekleme özelliği API entegrasyonu gerektirir.');
            });
        });
        
        async function loadIPList() {
            try {
                const response = await fetch(API_BASE_URL + '?action=get_ips');
                const data = await response.json();
                if (data.success) {
                    const ipList = document.getElementById('ipList');
                    if (data.ips && data.ips.length > 0) {
                        ipList.innerHTML = data.ips.map(ip => `
                            <div class="d-flex justify-content-between align-items-center p-2 border-bottom">
                                <span>${ip}</span>
                                <button class="btn btn-sm btn-danger" onclick="removeIP('${ip}')">Kaldır</button>
                            </div>
                        `).join('');
                    } else {
                        ipList.innerHTML = '<div class="text-muted">Henüz IP eklenmemiş.</div>';
                    }
                }
            } catch (error) {
                console.error('IP listesi yüklenemedi:', error);
            }
        }
        
        async function loadMods() {
            // Mod listesi yükleme
        }
        
        async function updateAnalytics() {
            try {
                const response = await fetch(API_BASE_URL + '?action=get_analytics');
                const data = await response.json();
                if (data.success && data.stats) {
                    document.getElementById('totalClicks').textContent = data.stats.totalClicks || 0;
                    document.getElementById('totalViews').textContent = data.stats.totalViews || 0;
                    document.getElementById('uniqueVisitors').textContent = data.stats.uniqueVisitors || 0;
                }
            } catch (error) {
                console.error('Analitik veriler yüklenemedi:', error);
            }
        }
        
        async function updateUserIP() {
            try {
                const response = await fetch(API_BASE_URL + '?action=user_status');
                const data = await response.json();
                if (data.success) {
                    document.getElementById('userIP').textContent = data.ip || '-';
                }
            } catch (error) {
                console.error('IP bilgisi alınamadı:', error);
            }
        }
    </script>
</body>
</html>
    <?php
}

// Logout işlemi
if (isset($_GET['logout'])) {
    session_destroy();
    header('Location: admin.php');
    exit;
}
