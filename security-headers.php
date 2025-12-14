<?php
/**
 * Security Headers PHP Implementation
 * Use this if server-level headers are not available
 * Include at the top of PHP files: require_once 'security-headers.php';
 */

header('Content-Security-Policy: default-src \'self\'; script-src \'self\' \'unsafe-inline\' https://www.googletagmanager.com https://www.google-analytics.com https://cdn.jsdelivr.net; style-src \'self\' \'unsafe-inline\' https://cdn.jsdelivr.net; img-src \'self\' data: https:; font-src \'self\' https://cdn.jsdelivr.net data:; connect-src \'self\' https://www.google-analytics.com https://www.googletagmanager.com; frame-ancestors \'none\'; base-uri \'self\'; form-action \'self\';');
header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()');
