<?php
// Isolated lab endpoint. No phpinfo dump, credentials, request echo, or commands.
header('Content-Type: application/json');
header('Cache-Control: no-store');
echo json_encode([
    'version' => PHP_VERSION,
    'version_id' => PHP_VERSION_ID,
    'sapi' => PHP_SAPI,
    'worker_pid' => getmypid(),
    'memory_limit' => ini_get('memory_limit'),
    'session_upload_progress_enabled' => filter_var(ini_get('session.upload_progress.enabled'), FILTER_VALIDATE_BOOLEAN),
    'session_serialize_handler' => ini_get('session.serialize_handler'),
], JSON_THROW_ON_ERROR | JSON_PRETTY_PRINT);
