<?php
/**
 * Parcel Logistics Tycoon - Save/Load System
 */

header('Content-Type: application/json');

$saveDir = __DIR__ . '/saves';
$saveFile = $saveDir . '/gamesave.json';

// Create saves directory if it doesn't exist
if (!is_dir($saveDir)) {
    mkdir($saveDir, 0755, true);
}

// Get action from request
$action = $_GET['action'] ?? $_POST['action'] ?? null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Save game
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (isset($input['action']) && $input['action'] === 'save' && isset($input['data'])) {
        $result = file_put_contents($saveFile, $input['data']);
        
        if ($result !== false) {
            echo json_encode(['success' => true, 'message' => 'Game saved successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to save game']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid request']);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'load') {
    // Load game
    if (file_exists($saveFile)) {
        $data = file_get_contents($saveFile);
        echo json_encode(['success' => true, 'data' => $data]);
    } else {
        echo json_encode(['success' => false, 'message' => 'No save file found']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}
?>
