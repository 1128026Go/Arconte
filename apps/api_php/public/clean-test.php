<?php
// Limpiar cualquier salida previa
ob_clean();

// Configurar headers para JSON limpio
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, private');

// Enviar JSON sin BOM
echo json_encode([
    'test' => 'OK',
    'timestamp' => time(),
    'message' => 'Endpoint de prueba limpio'
], JSON_UNESCAPED_UNICODE);

// Asegurar que no hay salida adicional
exit;
?>