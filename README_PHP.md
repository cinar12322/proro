# Cash Launcher - PHP Backend System

🚀 **Enterprise-level güvenlik ile Cash Launcher PHP backend sistemi**

## Özellikler

- 🔐 **Günlük Rotating Password**: Her gün otomatik olarak değişen güçlü admin şifresi
- 📡 **Discord Webhook Entegrasyonu**: Günlük şifreler otomatik olarak Discord'a gönderilir
- 🛡️ **IP Bazlı Admin Kontrolü**: Sadece yetkili IP'lerden admin erişimi
- 🔒 **Backend Doğrulama**: Tüm admin işlemleri backend'de doğrulanır
- 📦 **Mod Yönetimi**: Güvenli mod ekleme ve yönetimi
- 📊 **Analitik**: UTM tracking ve hotspot görselleştirme

## Gereksinimler

- PHP 7.4 veya üzeri
- Apache/Nginx web sunucusu
- cURL extension (Discord webhook için)
- JSON extension
- File upload izinleri

## Kurulum

### 1. Dosyaları Yükleyin

Tüm dosyaları web sunucunuzun root dizinine yükleyin:
- `index.html`
- `style.css`
- `script.js`
- `config.php`
- `admin.php`
- `mod_upload.php`
- `.htaccess`

### 2. Klasör İzinlerini Ayarlayın

```bash
chmod 755 data/
chmod 755 uploads/
chmod 644 config.php
chmod 644 admin.php
```

### 3. Config Dosyasını Düzenleyin

`config.php` dosyasını açın ve şu ayarları yapın:

```php
define('BASE_URL', 'https://yourdomain.com'); // Gerçek domain
define('DISCORD_WEBHOOK_URL', 'your_webhook_url_here');
```

### 4. Cron Job Ekleyin (Opsiyonel)

Günlük şifre yenileme için cron job ekleyin:

```bash
# Her gün gece yarısı çalıştır
0 0 * * * /usr/bin/php /path/to/your/project/config.php
```

Veya `admin.php?action=health` endpoint'ini düzenli olarak çağırın (şifre otomatik yenilenir).

## API Endpoints

### Public Endpoints

- `GET admin.php?action=health` - Health check
- `GET admin.php?action=user_status` - Kullanıcı IP ve admin durumu
- `POST admin.php?action=admin_verify` - Admin şifre doğrulama
- `GET admin.php?action=get_mods` - Tüm modları listele
- `POST admin.php?action=save_hotspot` - Hotspot kaydet
- `POST admin.php?action=save_utm` - UTM verisi kaydet

### Protected Endpoints (Admin Authentication Required)

Header: `X-Admin-Password: günlük_şifre`

- `GET admin.php?action=get_ips` - Admin IP listesi
- `POST admin.php?action=add_ip` - Admin IP ekle
- `GET admin.php?action=remove_ip&ip=IP_ADRESI` - Admin IP kaldır
- `POST admin.php?action=add_mod` - Mod ekle
- `GET admin.php?action=delete_mod&id=MOD_ID` - Mod sil
- `GET admin.php?action=get_analytics` - Analitik verileri

## Güvenlik

- ✅ Admin şifreleri frontend'de **asla** hardcode edilmez
- ✅ Tüm admin işlemleri backend'de doğrulanır
- ✅ Webhook URL config dosyasında saklanır
- ✅ Günlük rotating password sistemi
- ✅ IP bazlı erişim kontrolü
- ✅ `.htaccess` ile dosya koruması

## Günlük Şifre Sistemi

- Her gün otomatik olarak yeni şifre üretilir
- Şifre minimum 20 karakter, büyük/küçük harf, sayı ve özel karakter içerir
- Şifre Discord webhook'una otomatik gönderilir
- Şifre `data/daily_password.json` dosyasında saklanır

## Veri Depolama

Tüm veriler `data/` klasöründe JSON dosyaları olarak saklanır:

- `data/admin_ips.json` - Admin IP listesi
- `data/mods.json` - Mod listesi
- `data/daily_password.json` - Günlük şifre
- `data/hotspots.json` - Hotspot verileri
- `data/utm_data.json` - UTM tracking verileri

Yüklenen dosyalar `uploads/` klasöründe saklanır.

## Frontend Entegrasyonu

Frontend, PHP API'lerini kullanarak çalışır:

```javascript
const API_BASE_URL = 'admin.php';
```

Admin girişi için:

```javascript
POST admin.php?action=admin_verify
Body: { password: "günlük_şifre" }
```

## Sorun Giderme

### Şifre Discord'a gönderilmiyor
- `config.php` dosyasında `DISCORD_WEBHOOK_URL` doğru mu kontrol edin
- cURL extension yüklü mü kontrol edin
- PHP error log'larını kontrol edin

### Dosya yükleme çalışmıyor
- `uploads/` klasörü yazılabilir mi kontrol edin
- PHP `upload_max_filesize` ve `post_max_size` ayarlarını kontrol edin
- `.htaccess` dosyasının doğru çalıştığını kontrol edin

### Admin paneli açılmıyor
- Backend'in çalıştığını kontrol edin (`admin.php?action=health`)
- Şifrenin güncel olduğunu Discord'dan kontrol edin
- IP adresinizin admin listesinde olduğunu kontrol edin

## Lisans

MIT License

