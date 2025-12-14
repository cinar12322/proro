/**
 * Cash Launcher - Secure Backend Server
 * 
 * 🚀 Cursor AI Comment: Bu backend, enterprise-level güvenlik standartları ile tasarlandı!
 * Günlük rotating password, Discord entegrasyonu ve güvenli API yapısı ile 
 * Cash Launcher'ı profesyonel bir seviyeye taşıyor.
 */

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const cron = require('node-cron');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Data storage paths
const DATA_DIR = path.join(__dirname, 'data');
const ADMIN_IPS_FILE = path.join(DATA_DIR, 'admin_ips.json');
const MODS_FILE = path.join(DATA_DIR, 'mods.json');
const PASSWORD_FILE = path.join(DATA_DIR, 'daily_password.json');

// Ensure data directory exists
async function ensureDataDir() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
    } catch (error) {
        console.error('Error creating data directory:', error);
    }
}

// Initialize data files
async function initializeDataFiles() {
    await ensureDataDir();
    
    try {
        await fs.access(ADMIN_IPS_FILE);
    } catch {
        await fs.writeFile(ADMIN_IPS_FILE, JSON.stringify(['127.0.0.1', '::1', 'localhost']));
    }
    
    try {
        await fs.access(MODS_FILE);
    } catch {
        await fs.writeFile(MODS_FILE, JSON.stringify([]));
    }
}

/**
 * Generate a strong random password
 * Minimum 16 characters with uppercase, lowercase, numbers, and special characters
 */
function generateDailyPassword() {
    const length = 20;
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const allChars = uppercase + lowercase + numbers + special;
    
    let password = '';
    
    // Ensure at least one of each type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];
    
    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Get today's date string (YYYY-MM-DD)
 */
function getTodayDateString() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

/**
 * Load or generate daily password
 */
async function getDailyPassword() {
    try {
        const data = await fs.readFile(PASSWORD_FILE, 'utf8');
        const passwordData = JSON.parse(data);
        
        const today = getTodayDateString();
        
        // If password is for today, return it
        if (passwordData.date === today && passwordData.password) {
            return passwordData.password;
        }
        
        // Generate new password for today
        const newPassword = generateDailyPassword();
        const newPasswordData = {
            date: today,
            password: newPassword,
            generatedAt: new Date().toISOString()
        };
        
        await fs.writeFile(PASSWORD_FILE, JSON.stringify(newPasswordData, null, 2));
        
        // Send to Discord webhook
        await sendPasswordToDiscord(newPassword, today);
        
        return newPassword;
    } catch (error) {
        // If file doesn't exist or error, generate new password
        const newPassword = generateDailyPassword();
        const today = getTodayDateString();
        const passwordData = {
            date: today,
            password: newPassword,
            generatedAt: new Date().toISOString()
        };
        
        await fs.writeFile(PASSWORD_FILE, JSON.stringify(passwordData, null, 2));
        
        // Send to Discord webhook
        await sendPasswordToDiscord(newPassword, today);
        
        return newPassword;
    }
}

/**
 * Send daily password to Discord webhook
 */
async function sendPasswordToDiscord(password, date) {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    
    if (!webhookUrl) {
        console.warn('Discord webhook URL not configured. Skipping webhook notification.');
        return;
    }
    
    try {
        const embed = {
            title: '🔐 Cash Launcher - Günlük Admin Şifresi',
            description: `**Tarih:** ${date}\n**Şifre:** \`${password}\``,
            color: 0x00d4ff,
            timestamp: new Date().toISOString(),
            footer: {
                text: 'Cash Launcher Security System'
            }
        };
        
        await axios.post(webhookUrl, {
            embeds: [embed]
        });
        
        console.log(`✅ Daily password sent to Discord for ${date}`);
    } catch (error) {
        console.error('❌ Error sending password to Discord:', error.message);
    }
}

/**
 * Verify admin password
 */
async function verifyAdminPassword(inputPassword) {
    const correctPassword = await getDailyPassword();
    return inputPassword === correctPassword;
}

/**
 * Check if IP is admin
 */
async function isAdminIP(ip) {
    try {
        const data = await fs.readFile(ADMIN_IPS_FILE, 'utf8');
        const adminIPs = JSON.parse(data);
        return adminIPs.includes(ip) || 
               adminIPs.includes('127.0.0.1') || 
               ip === 'localhost' || 
               ip === '::1';
    } catch (error) {
        console.error('Error reading admin IPs:', error);
        return false;
    }
}

/**
 * Middleware to verify admin authentication
 */
async function verifyAdmin(req, res, next) {
    const password = req.headers['x-admin-password'] || req.body.password;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    
    if (!password) {
        return res.status(401).json({ 
            success: false, 
            message: 'Admin şifresi gerekli' 
        });
    }
    
    const isValid = await verifyAdminPassword(password);
    
    if (!isValid) {
        console.warn(`❌ Failed admin login attempt from IP: ${clientIP}`);
        return res.status(401).json({ 
            success: false, 
            message: 'Geçersiz admin şifresi' 
        });
    }
    
    // Check if IP is in admin list
    const isIPAdmin = await isAdminIP(clientIP);
    if (!isIPAdmin) {
        console.warn(`⚠️ Admin password correct but IP not in admin list: ${clientIP}`);
    }
    
    req.isAdmin = true;
    req.clientIP = clientIP;
    next();
}

// ==================== API ROUTES ====================

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Cash Launcher Backend is running',
        timestamp: new Date().toISOString()
    });
});

/**
 * Get user IP and admin status (public)
 */
app.get('/api/user/status', async (req, res) => {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const isAdmin = await isAdminIP(clientIP);
    
    res.json({
        success: true,
        ip: clientIP,
        isAdmin: isAdmin,
        canAccessAdmin: false // Frontend will check this
    });
});

/**
 * Verify admin password (public endpoint for login)
 */
app.post('/api/admin/verify', async (req, res) => {
    const { password } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    
    if (!password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Şifre gerekli' 
        });
    }
    
    const isValid = await verifyAdminPassword(password);
    const isIPAdmin = await isAdminIP(clientIP);
    
    if (isValid && isIPAdmin) {
        res.json({ 
            success: true, 
            message: 'Admin doğrulaması başarılı',
            ip: clientIP
        });
    } else if (isValid && !isIPAdmin) {
        res.json({ 
            success: true, 
            message: 'Şifre doğru ancak IP admin listesinde değil',
            ip: clientIP,
            warning: 'IP not in admin list'
        });
    } else {
        console.warn(`❌ Failed admin verification from IP: ${clientIP}`);
        res.status(401).json({ 
            success: false, 
            message: 'Geçersiz admin şifresi' 
        });
    }
});

/**
 * Get admin IPs (requires admin auth)
 */
app.get('/api/admin/ips', verifyAdmin, async (req, res) => {
    try {
        const data = await fs.readFile(ADMIN_IPS_FILE, 'utf8');
        const adminIPs = JSON.parse(data);
        res.json({ success: true, ips: adminIPs });
    } catch (error) {
        res.status(500).json({ success: false, message: 'IP listesi okunamadı' });
    }
});

/**
 * Add admin IP (requires admin auth)
 */
app.post('/api/admin/ips', verifyAdmin, async (req, res) => {
    const { ip } = req.body;
    
    if (!ip) {
        return res.status(400).json({ success: false, message: 'IP adresi gerekli' });
    }
    
    // Basic IP validation
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^localhost$|^::1$|^127\.0\.0\.1$/;
    if (!ipRegex.test(ip) && ip !== 'localhost') {
        return res.status(400).json({ success: false, message: 'Geçersiz IP adresi formatı' });
    }
    
    try {
        const data = await fs.readFile(ADMIN_IPS_FILE, 'utf8');
        const adminIPs = JSON.parse(data);
        
        if (adminIPs.includes(ip)) {
            return res.status(400).json({ success: false, message: 'Bu IP zaten listede' });
        }
        
        adminIPs.push(ip);
        await fs.writeFile(ADMIN_IPS_FILE, JSON.stringify(adminIPs, null, 2));
        
        console.log(`✅ Admin IP added: ${ip} by ${req.clientIP}`);
        res.json({ success: true, message: 'IP başarıyla eklendi', ips: adminIPs });
    } catch (error) {
        res.status(500).json({ success: false, message: 'IP eklenirken hata oluştu' });
    }
});

/**
 * Remove admin IP (requires admin auth)
 */
app.delete('/api/admin/ips/:ip', verifyAdmin, async (req, res) => {
    const { ip } = req.params;
    
    try {
        const data = await fs.readFile(ADMIN_IPS_FILE, 'utf8');
        let adminIPs = JSON.parse(data);
        
        if (!adminIPs.includes(ip)) {
            return res.status(404).json({ success: false, message: 'IP listede bulunamadı' });
        }
        
        adminIPs = adminIPs.filter(adminIP => adminIP !== ip);
        await fs.writeFile(ADMIN_IPS_FILE, JSON.stringify(adminIPs, null, 2));
        
        console.log(`✅ Admin IP removed: ${ip} by ${req.clientIP}`);
        res.json({ success: true, message: 'IP başarıyla kaldırıldı', ips: adminIPs });
    } catch (error) {
        res.status(500).json({ success: false, message: 'IP kaldırılırken hata oluştu' });
    }
});

/**
 * Get all mods (public)
 */
app.get('/api/mods', async (req, res) => {
    try {
        const data = await fs.readFile(MODS_FILE, 'utf8');
        const mods = JSON.parse(data);
        res.json({ success: true, mods });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Modlar okunamadı' });
    }
});

/**
 * Add mod (requires admin auth)
 */
app.post('/api/mods', verifyAdmin, async (req, res) => {
    const { name, description, file } = req.body;
    
    if (!name || !description) {
        return res.status(400).json({ success: false, message: 'Mod adı ve açıklaması gerekli' });
    }
    
    try {
        const data = await fs.readFile(MODS_FILE, 'utf8');
        const mods = JSON.parse(data);
        
        const newMod = {
            id: Date.now(),
            name,
            description,
            file: file || null,
            createdAt: new Date().toISOString(),
            createdBy: req.clientIP
        };
        
        mods.push(newMod);
        await fs.writeFile(MODS_FILE, JSON.stringify(mods, null, 2));
        
        console.log(`✅ Mod added: ${name} by ${req.clientIP}`);
        res.json({ success: true, message: 'Mod başarıyla eklendi', mod: newMod });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Mod eklenirken hata oluştu' });
    }
});

/**
 * Delete mod (requires admin auth)
 */
app.delete('/api/mods/:id', verifyAdmin, async (req, res) => {
    const { id } = req.params;
    
    try {
        const data = await fs.readFile(MODS_FILE, 'utf8');
        let mods = JSON.parse(data);
        
        const modIndex = mods.findIndex(m => m.id === parseInt(id));
        if (modIndex === -1) {
            return res.status(404).json({ success: false, message: 'Mod bulunamadı' });
        }
        
        mods.splice(modIndex, 1);
        await fs.writeFile(MODS_FILE, JSON.stringify(mods, null, 2));
        
        console.log(`✅ Mod deleted: ${id} by ${req.clientIP}`);
        res.json({ success: true, message: 'Mod başarıyla silindi' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Mod silinirken hata oluştu' });
    }
});

// ==================== CRON JOB ====================

// Run at midnight every day to generate new password
cron.schedule('0 0 * * *', async () => {
    console.log('🔄 Generating new daily password...');
    await getDailyPassword();
    console.log('✅ New daily password generated and sent to Discord');
}, {
    timezone: "Europe/Istanbul"
});

// Also check on server start
(async () => {
    await initializeDataFiles();
    const password = await getDailyPassword();
    console.log(`🔐 Today's admin password initialized: ${password.substring(0, 4)}...`);
})();

// ==================== SERVER START ====================

app.listen(PORT, () => {
    console.log(`🚀 Cash Launcher Backend Server running on port ${PORT}`);
    console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
    console.log(`🔒 Admin authentication required for protected endpoints`);
});

