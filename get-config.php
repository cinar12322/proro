<?php
/**
 * Get Configuration Values
 * Returns configuration values for frontend use
 */

require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$key = isset($_GET['key']) ? $_GET['key'] : '';

$response = ['success' => false, 'value' => null];

switch ($key) {
    case 'google_analytics_id':
        $response['success'] = true;
        $response['value'] = defined('GOOGLE_ANALYTICS_ID') ? GOOGLE_ANALYTICS_ID : '';
        break;
    
    default:
        $response['message'] = 'Unknown config key';
        break;
}

echo json_encode($response, JSON_UNESCAPED_UNICODE);
exit;
