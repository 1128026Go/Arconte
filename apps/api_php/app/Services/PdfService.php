<?php

namespace App\Services;

use Dompdf\Dompdf;

class PdfService
{
    public function htmlToPdf(string $html): string
    {
        $dompdf = new Dompdf();
        $dompdf->loadHtml($html);
        $dompdf->render();

        return $dompdf->output();
    }
}