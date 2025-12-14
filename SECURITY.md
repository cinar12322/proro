# Security Configuration Guide

## Apache Configuration (.htaccess)

The `.htaccess` file is already configured with security headers. Ensure `mod_headers` is enabled:

```apache
LoadModule headers_module modules/mod_headers.so
```

## Nginx Configuration

Add the contents of `nginx-security.conf` to your server block:

```nginx
server {
    listen 80;
    server_name 95.70.181.95;
    
    # Include security headers
    include /path/to/nginx-security.conf;
    
    # ... rest of configuration
}
```

## Security Headers Explained

### Content-Security-Policy (CSP)
- Prevents XSS attacks
- Allows: Google Analytics, Bootstrap CDN, self-hosted assets
- Blocks inline scripts except where necessary

### X-Frame-Options
- Prevents clickjacking
- Set to DENY (no framing allowed)

### X-Content-Type-Options
- Prevents MIME type sniffing
- Forces browsers to respect declared content types

### Referrer-Policy
- Controls referrer information
- Set to strict-origin-when-cross-origin

### Permissions-Policy
- Disables unnecessary browser features
- Reduces attack surface

## Testing

Test headers with:
```bash
curl -I http://95.70.181.95
```

Or use online tools:
- https://securityheaders.com
- https://observatory.mozilla.org

## Notes

- Meta tags in HTML are fallback only
- Server-level headers take precedence
- Uncomment HTTPS redirect when SSL is available
