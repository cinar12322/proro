<?php
/**
 * Cash Launcher - Mod File Upload Handler
 * Handles file uploads for mods
 */

require_once 'config.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, 'Only POST method allowed');
}

// Verify admin authentication
$password = $_SERVER['HTTP_X_ADMIN_PASSWORD'] ?? $_POST['password'] ?? '';
if (empty($password) || !verifyAdminPassword($password)) {
    jsonResponse(false, 'Admin authentication required');
}

// Check if file was uploaded
if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    jsonResponse(false, 'No file uploaded or upload error');
}

$file = $_FILES['file'];
$fileName = $file['name'];
$fileSize = $file['size'];
$fileTmpName = $file['tmp_name'];
$fileError = $file['error'];

// Validate file size
if ($fileSize > MAX_FILE_SIZE) {
    jsonResponse(false, 'File size exceeds maximum allowed size');
}

// Validate file type
$fileExt = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
if (!in_array($fileExt, ALLOWED_FILE_TYPES)) {
    jsonResponse(false, 'File type not allowed');
}

// Generate unique filename
$uniqueFileName = time() . '_' . uniqid() . '_' . basename($fileName);
$uploadPath = UPLOADS_DIR . '/' . $uniqueFileName;

// Move uploaded file
if (!move_uploaded_file($fileTmpName, $uploadPath)) {
    jsonResponse(false, 'Failed to save uploaded file');
}

// Read file and convert to base64
$fileContent = file_get_contents($uploadPath);
$base64Content = base64_encode($fileContent);

// Return file info
jsonResponse(true, 'File uploaded successfully', [
    'name' => $fileName,
    'size' => $fileSize,
    'type' => mime_content_type($uploadPath),
    'base64' => $base64Content,
    'path' => $uniqueFileName
]);

