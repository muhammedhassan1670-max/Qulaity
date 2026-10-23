<?php
/**
 * QMS Enterprise 4.0 - Server File Storage API (PHP)
 * Saves records directly to server JSON files inside the website directory.
 * Works seamlessly on any PHP web hosting (e.g. InfinityFree, cPanel, Apache).
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Tenant-Id');

// Handle CORS Pre-flight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// -----------------------------------------------------------------------------
// 1. Storage Directory Setup
// -----------------------------------------------------------------------------
$dataDir = __DIR__ . '/data';
if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0755, true);
    // Protect data directory from direct browser downloads
    @file_put_contents($dataDir . '/.htaccess', "Order allow,deny\nDeny from all\n");
}

// -----------------------------------------------------------------------------
// 2. Health Check / Ping
// -----------------------------------------------------------------------------
if (isset($_GET['ping'])) {
    echo json_encode([
        'status' => 'ok',
        'server' => 'QMS PHP Storage API',
        'version' => '1.0.0',
        'php_version' => PHP_VERSION,
        'storage_writable' => is_writable($dataDir),
        'storage_path' => realpath($dataDir) ?: $dataDir,
        'timestamp' => date('c')
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit(0);
}

// -----------------------------------------------------------------------------
// 3. Resolve Endpoint & Record ID
// -----------------------------------------------------------------------------
$endpointParam = $_GET['endpoint'] ?? '';

if (empty($endpointParam) && !empty($_SERVER['PATH_INFO'])) {
    $endpointParam = trim($_SERVER['PATH_INFO'], '/');
}

if (empty($endpointParam)) {
    $reqUri = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
    if (preg_match('#/api/(.+)#i', $reqUri, $matches)) {
        $endpointParam = $matches[1];
    }
}

$endpointParam = trim($endpointParam, '/');
$parts = !empty($endpointParam) ? explode('/', $endpointParam) : [];
$module = !empty($parts[0]) ? strtolower(trim($parts[0])) : 'status';
$recordId = !empty($parts[1]) ? trim($parts[1]) : null;

// Clean module name for safe file storage
$safeModule = preg_replace('/[^a-z0-9_-]/', '', $module);
if (empty($safeModule)) {
    $safeModule = 'general';
}

$dataFile = $dataDir . '/' . $safeModule . '.json';

// Helper: Check if record is fake or mock data
function isServerMockRecord($item) {
    if (!is_array($item)) return false;
    $id = strval($item['id'] ?? '');
    $num = strval($item['inspectionNumber'] ?? ($item['ncrNumber'] ?? ($item['capaNumber'] ?? ($item['auditNumber'] ?? ($item['code'] ?? '')))));
    $lot = strval($item['batchNumber'] ?? ($item['batch'] ?? ($item['lotNumber'] ?? '')));
    $prod = strval($item['productName'] ?? ($item['product'] ?? ($item['title'] ?? ($item['name'] ?? ''))));
    $supp = strval($item['supplierName'] ?? ($item['supplier'] ?? ''));
    $inspectedBy = strval($item['inspectedBy'] ?? '');

    if (strpos($id, 'INS-2026-RM-') === 0 || strpos($num, 'INS-2026-RM-') === 0) return true;
    if (strpos($id, 'INS-2026-OQC-') === 0 || strpos($num, 'INS-2026-OQC-') === 0) return true;
    if (strpos($id, 'NCR-SUP-') === 0 || strpos($num, 'NCR-SUP-') === 0) return true;
    if (strpos($id, 'DEF-2026-901') === 0 || strpos($num, 'DEF-2026-901') === 0) return true;
    if ($id === 'NCR-2026-901' || $num === 'NCR-2026-901') return true;
    if ($id === 'CAPA-2026-901' || $num === 'CAPA-2026-901') return true;
    if ($id === 'AUD-2026-901' || $num === 'AUD-2026-901') return true;
    if ($id === 'CP-PUMP-01' || $num === 'CP-PUMP-01') return true;
    if ($id === 'CMP-2026-101' || $num === 'CMP-2026-101') return true;
    if (in_array($id, ['SUP-001', 'SUP-002', 'SUP-003', 'SUP-004', 'SUP-005'])) return true;

    if (in_array($lot, ['LOT-2026-AL-01', 'LOT-2026-OR-02', 'LOT-2026-VL-03', 'LOT-2026-OL-05', 'BATCH-2026-901'])) return true;

    if (strpos($prod, 'سبائك ألمونيوم') !== false) return true;
    if (strpos($prod, 'حلقات إحكام مطاطية') !== false) return true;
    if (strpos($prod, 'صمامات بلانجر') !== false) return true;
    if (strpos($prod, 'مضخات هيدروليكية') !== false) return true;
    if (strpos($prod, 'مجموعات تروس صناعية') !== false) return true;

    if (strpos($supp, 'Precision Metals') !== false) return true;
    if (strpos($supp, 'Apex Polymer') !== false) return true;
    if (strpos($supp, 'Delta Precision') !== false) return true;
    if (strpos($supp, 'Titan Fasteners') !== false) return true;
    if (strpos($supp, 'Precision Castings') !== false) return true;
    if (strpos($supp, 'Global Fasteners') !== false) return true;
    if (strpos($supp, 'Apex Electronics') !== false) return true;

    if ($inspectedBy === 'م. مصطفى رفعت') return true;

    return false;
}

// Helper: Read JSON Data from server file
function readDataFile($file, $module) {
    if (!file_exists($file)) {
        return [];
    }
    $raw = @file_get_contents($file);
    if ($raw === false || empty(trim($raw))) return [];
    $parsed = @json_decode($raw, true);
    if (!is_array($parsed)) return [];

    // Purge any legacy fake/seed records
    $cleaned = array_values(array_filter($parsed, function($item) {
        return !isServerMockRecord($item);
    }));

    if (count($cleaned) !== count($parsed)) {
        @file_put_contents($file, json_encode($cleaned, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
    }

    return $cleaned;
}

// Helper: Write JSON Data safely to server file
function writeDataFile($file, $data) {
    // Filter out any mock records before saving
    $cleanData = array_values(array_filter($data, function($item) {
        return !isServerMockRecord($item);
    }));
    $json = json_encode($cleanData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    return @file_put_contents($file, $json, LOCK_EX) !== false;
}

$method = $_SERVER['REQUEST_METHOD'];
$existingData = readDataFile($dataFile, $safeModule);

// -----------------------------------------------------------------------------
// 4. Handle HTTP Methods
// -----------------------------------------------------------------------------

switch ($method) {
    case 'GET':
        // If requesting a specific record by ID
        if ($recordId !== null) {
            foreach ($existingData as $item) {
                if (isset($item['id']) && (string)$item['id'] === (string)$recordId) {
                    echo json_encode(['data' => $item], JSON_UNESCAPED_UNICODE);
                    exit(0);
                }
                // Check common alias ID fields
                if (isset($item['inspectionNumber']) && (string)$item['inspectionNumber'] === (string)$recordId) {
                    echo json_encode(['data' => $item], JSON_UNESCAPED_UNICODE);
                    exit(0);
                }
                if (isset($item['ncrNumber']) && (string)$item['ncrNumber'] === (string)$recordId) {
                    echo json_encode(['data' => $item], JSON_UNESCAPED_UNICODE);
                    exit(0);
                }
            }
            http_response_code(404);
            echo json_encode(['error' => 'Record not found', 'id' => $recordId], JSON_UNESCAPED_UNICODE);
            exit(0);
        }

        // Return list with pagination format
        $search = isset($_GET['search']) ? trim(mb_strtolower($_GET['search'], 'UTF-8')) : '';
        $filtered = $existingData;

        if (!empty($search)) {
            $filtered = array_values(array_filter($filtered, function ($item) use ($search) {
                $blob = mb_strtolower(json_encode($item, JSON_UNESCAPED_UNICODE), 'UTF-8');
                return mb_strpos($blob, $search) !== false;
            }));
        }

        $page = max(1, intval($_GET['page'] ?? 1));
        $limit = max(1, min(500, intval($_GET['limit'] ?? 100)));
        $total = count($filtered);
        $totalPages = ceil($total / $limit);

        echo json_encode([
            'data' => $filtered,
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
            'totalPages' => max(1, $totalPages)
        ], JSON_UNESCAPED_UNICODE);
        break;

    case 'POST':
        $rawInput = file_get_contents('php://input');
        $body = @json_decode($rawInput, true);
        if (!is_array($body)) {
            $body = $_POST;
        }

        // Support Batch Sync (if array of records sent)
        if (isset($body['batch']) && is_array($body['batch'])) {
            $incomingList = $body['batch'];
            $serverIds = array_column($existingData, 'id');
            $added = 0;
            foreach ($incomingList as $rec) {
                if (is_array($rec)) {
                    $recId = $rec['id'] ?? null;
                    if (!$recId || !in_array($recId, $serverIds)) {
                        if (!$recId) {
                            $rec['id'] = $safeModule . '-' . date('Y') . '-' . substr(uniqid(), -5);
                        }
                        array_unshift($existingData, $rec);
                        $serverIds[] = $rec['id'];
                        $added++;
                    }
                }
            }
            writeDataFile($dataFile, $existingData);
            echo json_encode(['status' => 'success', 'added' => $added, 'total' => count($existingData)], JSON_UNESCAPED_UNICODE);
            exit(0);
        }

        // Single record creation
        $newRecord = $body;
        if (empty($newRecord['id'])) {
            $prefix = strtoupper(substr($safeModule, 0, 3));
            $newRecord['id'] = $prefix . '-' . date('Y') . '-' . mt_rand(100, 999);
        }
        if (empty($newRecord['createdAt'])) {
            $newRecord['createdAt'] = date('c');
        }
        $newRecord['updatedAt'] = date('c');

        // Check if ID already exists, replace it, otherwise unshift
        $existingIndex = -1;
        foreach ($existingData as $idx => $it) {
            if (isset($it['id']) && (string)$it['id'] === (string)$newRecord['id']) {
                $existingIndex = $idx;
                break;
            }
        }

        if ($existingIndex !== -1) {
            $existingData[$existingIndex] = array_merge($existingData[$existingIndex], $newRecord);
        } else {
            array_unshift($existingData, $newRecord);
        }

        writeDataFile($dataFile, $existingData);
        echo json_encode(['data' => $newRecord, 'status' => 'success'], JSON_UNESCAPED_UNICODE);
        break;

    case 'PATCH':
    case 'PUT':
        $rawInput = file_get_contents('php://input');
        $body = @json_decode($rawInput, true);
        if (!is_array($body)) $body = [];

        $targetId = $recordId ?? ($body['id'] ?? null);
        if (!$targetId) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing record ID for update'], JSON_UNESCAPED_UNICODE);
            exit(0);
        }

        $found = false;
        $updatedRecord = null;
        foreach ($existingData as $idx => $item) {
            if (isset($item['id']) && (string)$item['id'] === (string)$targetId) {
                $body['updatedAt'] = date('c');
                $existingData[$idx] = array_merge($item, $body);
                $updatedRecord = $existingData[$idx];
                $found = true;
                break;
            }
        }

        if (!$found) {
            // If not found, treat as new
            $body['id'] = $targetId;
            $body['updatedAt'] = date('c');
            array_unshift($existingData, $body);
            $updatedRecord = $body;
        }

        writeDataFile($dataFile, $existingData);
        echo json_encode(['data' => $updatedRecord, 'status' => 'success'], JSON_UNESCAPED_UNICODE);
        break;

    case 'DELETE':
        $targetId = $recordId;
        if (!$targetId) {
            $rawInput = file_get_contents('php://input');
            $body = @json_decode($rawInput, true);
            $targetId = $body['id'] ?? null;
        }

        if (!$targetId) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing record ID for delete'], JSON_UNESCAPED_UNICODE);
            exit(0);
        }

        $existingData = array_values(array_filter($existingData, function ($item) use ($targetId) {
            return !isset($item['id']) || (string)$item['id'] !== (string)$targetId;
        }));

        writeDataFile($dataFile, $existingData);
        echo json_encode(['status' => 'success', 'deleted' => $targetId], JSON_UNESCAPED_UNICODE);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed'], JSON_UNESCAPED_UNICODE);
        break;
}
