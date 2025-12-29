![Alt](https://repobeats.axiom.co/api/embed/3129c56687351dad502b8b21d7cecf97a529db07.svg "Repobeats analytics image")




# Cash Launcher - Secure Backend System

🚀 **Enterprise-level güvenlik ile Cash Launcher backend sistemi**

## Özellikler

- 🔐 **Günlük Rotating Password**: Her gün otomatik olarak değişen güçlü admin şifresi
- 📡 **Discord Webhook Entegrasyonu**: Günlük şifreler otomatik olarak Discord'a gönderilir
- 🛡️ **IP Bazlı Admin Kontrolü**: Sadece yetkili IP'lerden admin erişimi
- 🔒 **Backend Doğrulama**: Tüm admin işlemleri backend'de doğrulanır
- 📦 **Mod Yönetimi**: Güvenli mod ekleme ve yönetimi
- 📊 **Analitik**: UTM tracking ve hotspot görselleştirme

## Kurulum

### 1. Bağımlılıkları Yükleyin

```bash
npm install
```

### 2. Environment Variables Ayarlayın

`.env` dosyası oluşturun:

```env
PORT=3000
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN
NODE_ENV=development
```

### 3. Discord Webhook URL'ini Ayarlayın

1. Discord sunucunuzda bir webhook oluşturun
2. Webhook URL'ini `.env` dosyasına ekleyin

### 4. Sunucuyu Başlatın

```bash
npm start
```

veya development modu için:

```bash
npm run dev
```

## API Endpoints

### Public Endpoints

- `GET /api/health` - Health check
- `GET /api/user/status` - Kullanıcı IP ve admin durumu
- `POST /api/admin/verify` - Admin şifre doğrulama
- `GET /api/mods` - Tüm modları listele

### Protected Endpoints (Admin Authentication Required)

- `GET /api/admin/ips` - Admin IP listesi
- `POST /api/admin/ips` - Admin IP ekle
- `DELETE /api/admin/ips/:ip` - Admin IP kaldır
- `POST /api/mods` - Mod ekle
- `DELETE /api/mods/:id` - Mod sil

## Güvenlik

- ✅ Admin şifreleri frontend'de **asla** hardcode edilmez
- ✅ Tüm admin işlemleri backend'de doğrulanır
- ✅ Webhook URL environment variable olarak saklanır
- ✅ Günlük rotating password sistemi
- ✅ IP bazlı erişim kontrolü

## Günlük Şifre Sistemi

- Her gün gece yarısı (00:00) otomatik olarak yeni şifre üretilir
- Şifre minimum 20 karakter, büyük/küçük harf, sayı ve özel karakter içerir
- Şifre Discord webhook'una otomatik gönderilir
- Şifre `data/daily_password.json` dosyasında saklanır

## Veri Depolama

Tüm veriler `data/` klasöründe JSON dosyaları olarak saklanır:

- `data/admin_ips.json` - Admin IP listesi
- `data/mods.json` - Mod listesi
- `data/daily_password.json` - Günlük şifre

## Frontend Entegrasyonu

Frontend, backend API'lerini kullanarak çalışır:

```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

Admin girişi için:

```javascript
POST /api/admin/verify
Body: { password: "günlük_şifre" }
```

## Lisans

MIT License

