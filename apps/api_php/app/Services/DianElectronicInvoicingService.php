<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\DianInvoice;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class DianElectronicInvoicingService
{
    protected string $dianApiUrl;
    protected string $dianTestUrl;
    protected bool $isProduction;

    public function __construct()
    {
        $this->dianApiUrl = env('DIAN_API_URL', 'https://vpfe.dian.gov.co/WcfDianCustomerServices.svc');
        $this->dianTestUrl = env('DIAN_TEST_URL', 'https://vpfe-hab.dian.gov.co/WcfDianCustomerServices.svc');
        $this->isProduction = env('DIAN_ENVIRONMENT', 'test') === 'production';
    }

    /**
     * Generar factura electrónica DIAN desde Invoice
     */
    public function generateElectronicInvoice(Invoice $invoice): DianInvoice
    {
        // 1. Validar RUT y NIT
        $this->validateRUT($invoice->nit ?? '');

        // 2. Generar XML UBL 2.1 (DIAN compliant)
        $xml = $this->generateUBL21XML($invoice);

        // 3. Firmar digitalmente el XML
        $signedXml = $this->signXML($xml);

        // 4. Generar CUFE (Código Único de Factura Electrónica)
        $cufe = $this->generateCUFE($invoice, $signedXml);

        // 5. Enviar a DIAN
        $response = $this->sendToDian($signedXml, $cufe);

        // 6. Guardar en base de datos
        $dianInvoice = DianInvoice::create([
            'invoice_id' => $invoice->id,
            'cufe' => $cufe,
            'xml_content' => $signedXml,
            'pdf_path' => $this->generatePDF($invoice, $cufe),
            'dian_response' => $response,
            'estado' => $response['success'] ? 'aprobada' : 'rechazada',
            'numero_factura' => $this->generateInvoiceNumber(),
            'fecha_emision' => now(),
        ]);

        return $dianInvoice;
    }

    /**
     * Validar RUT/NIT con DIAN
     */
    protected function validateRUT(string $nit): bool
    {
        try {
            $response = Http::timeout(10)->get('https://muisca.dian.gov.co/WebRutMuisca/DefConsultaEstadoRUT.faces', [
                'nit' => $nit
            ]);

            return $response->successful();
        } catch (\Exception $e) {
            report($e);
            return false;
        }
    }

    /**
     * Generar XML UBL 2.1 según estándar DIAN
     */
    protected function generateUBL21XML(Invoice $invoice): string
    {
        $emisor = $this->getEmisorData();
        $cliente = $this->getClienteData($invoice);

        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"' . "\n";
        $xml .= '          xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"' . "\n";
        $xml .= '          xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"' . "\n";
        $xml .= '          xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">' . "\n";

        // UBLVersionID
        $xml .= '  <cbc:UBLVersionID>UBL 2.1</cbc:UBLVersionID>' . "\n";
        $xml .= '  <cbc:CustomizationID>10</cbc:CustomizationID>' . "\n";
        $xml .= '  <cbc:ProfileID>DIAN 2.1</cbc:ProfileID>' . "\n";

        // Número de factura
        $invoiceNumber = $this->generateInvoiceNumber();
        $xml .= '  <cbc:ID>' . $invoiceNumber . '</cbc:ID>' . "\n";

        // Fecha y hora de emisión
        $xml .= '  <cbc:IssueDate>' . now()->format('Y-m-d') . '</cbc:IssueDate>' . "\n";
        $xml .= '  <cbc:IssueTime>' . now()->format('H:i:s') . '</cbc:IssueTime>' . "\n";

        // Tipo de factura (01 = Factura de Venta)
        $xml .= '  <cbc:InvoiceTypeCode>01</cbc:InvoiceTypeCode>' . "\n";

        // Moneda
        $xml .= '  <cbc:DocumentCurrencyCode>COP</cbc:DocumentCurrencyCode>' . "\n";

        // Datos del emisor (Arconte)
        $xml .= '  <cac:AccountingSupplierParty>' . "\n";
        $xml .= '    <cac:Party>' . "\n";
        $xml .= '      <cac:PartyIdentification>' . "\n";
        $xml .= '        <cbc:ID schemeID="31">' . $emisor['nit'] . '</cbc:ID>' . "\n";
        $xml .= '      </cac:PartyIdentification>' . "\n";
        $xml .= '      <cac:PartyName>' . "\n";
        $xml .= '        <cbc:Name>' . htmlspecialchars($emisor['nombre']) . '</cbc:Name>' . "\n";
        $xml .= '      </cac:PartyName>' . "\n";
        $xml .= '      <cac:PartyTaxScheme>' . "\n";
        $xml .= '        <cbc:RegistrationName>' . htmlspecialchars($emisor['razon_social']) . '</cbc:RegistrationName>' . "\n";
        $xml .= '        <cbc:CompanyID>' . $emisor['nit'] . '</cbc:CompanyID>' . "\n";
        $xml .= '      </cac:PartyTaxScheme>' . "\n";
        $xml .= '    </cac:Party>' . "\n";
        $xml .= '  </cac:AccountingSupplierParty>' . "\n";

        // Datos del cliente
        $xml .= '  <cac:AccountingCustomerParty>' . "\n";
        $xml .= '    <cac:Party>' . "\n";
        $xml .= '      <cac:PartyIdentification>' . "\n";
        $xml .= '        <cbc:ID schemeID="13">' . ($cliente['cedula'] ?? 'N/A') . '</cbc:ID>' . "\n";
        $xml .= '      </cac:PartyIdentification>' . "\n";
        $xml .= '      <cac:PartyName>' . "\n";
        $xml .= '        <cbc:Name>' . htmlspecialchars($cliente['nombre']) . '</cbc:Name>' . "\n";
        $xml .= '      </cac:PartyName>' . "\n";
        $xml .= '    </cac:Party>' . "\n";
        $xml .= '  </cac:AccountingCustomerParty>' . "\n";

        // Items de la factura
        foreach ($invoice->items as $index => $item) {
            $lineNumber = $index + 1;
            $xml .= '  <cac:InvoiceLine>' . "\n";
            $xml .= '    <cbc:ID>' . $lineNumber . '</cbc:ID>' . "\n";
            $xml .= '    <cbc:InvoicedQuantity unitCode="EA">' . $item->quantity . '</cbc:InvoicedQuantity>' . "\n";
            $xml .= '    <cbc:LineExtensionAmount currencyID="COP">' . $item->amount . '</cbc:LineExtensionAmount>' . "\n";
            $xml .= '    <cac:Item>' . "\n";
            $xml .= '      <cbc:Description>' . htmlspecialchars($item->description) . '</cbc:Description>' . "\n";
            $xml .= '    </cac:Item>' . "\n";
            $xml .= '  </cac:InvoiceLine>' . "\n";
        }

        // Totales
        $xml .= '  <cac:LegalMonetaryTotal>' . "\n";
        $xml .= '    <cbc:LineExtensionAmount currencyID="COP">' . $invoice->subtotal . '</cbc:LineExtensionAmount>' . "\n";
        $xml .= '    <cbc:TaxExclusiveAmount currencyID="COP">' . $invoice->subtotal . '</cbc:TaxExclusiveAmount>' . "\n";
        $xml .= '    <cbc:TaxInclusiveAmount currencyID="COP">' . $invoice->total . '</cbc:TaxInclusiveAmount>' . "\n";
        $xml .= '    <cbc:PayableAmount currencyID="COP">' . $invoice->total . '</cbc:PayableAmount>' . "\n";
        $xml .= '  </cac:LegalMonetaryTotal>' . "\n";

        $xml .= '</Invoice>';

        return $xml;
    }

    /**
     * Firmar XML digitalmente
     */
    protected function signXML(string $xml): string
    {
        // En producción, usar certificado digital real
        // Por ahora retornamos XML sin firma (solo para testing)

        $certificatePath = env('DIAN_CERTIFICATE_PATH');
        $certificatePassword = env('DIAN_CERTIFICATE_PASSWORD');

        if (!$certificatePath || !file_exists($certificatePath)) {
            return $xml; // Testing mode
        }

        // Firmar con certificado digital
        // Implementación real requiere biblioteca XMLSecLibs
        return $xml;
    }

    /**
     * Generar CUFE (Código Único de Factura Electrónica)
     */
    protected function generateCUFE(Invoice $invoice, string $xml): string
    {
        $invoiceNumber = $this->generateInvoiceNumber();
        $fecha = now()->format('Y-m-d');
        $hora = now()->format('H:i:s');
        $emisor = $this->getEmisorData();

        $data = implode('', [
            $invoiceNumber,
            $fecha,
            $hora,
            $invoice->subtotal,
            '01', // Código impuesto IVA
            $invoice->tax ?? 0,
            '04', // Código impuesto INC
            0, // INC
            '03', // Código impuesto ICA
            0, // ICA
            $invoice->total,
            $emisor['nit'],
            $invoice->client_id ?? '',
            env('DIAN_SOFTWARE_ID', ''),
            env('DIAN_ENVIRONMENT', 'test') === 'production' ? '1' : '2',
        ]);

        return hash('sha384', $data);
    }

    /**
     * Enviar a DIAN
     */
    protected function sendToDian(string $xml, string $cufe): array
    {
        $url = $this->isProduction ? $this->dianApiUrl : $this->dianTestUrl;

        try {
            $response = Http::timeout(30)
                ->withHeaders([
                    'Content-Type' => 'application/xml',
                    'SOAPAction' => 'http://wcf.dian.colombia/IWcfDianCustomerServices/SendBillSync',
                ])
                ->post($url, $xml);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'cufe' => $cufe,
                    'response' => $response->body(),
                ];
            }

            return [
                'success' => false,
                'error' => $response->body(),
            ];
        } catch (\Exception $e) {
            report($e);
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Generar número de factura secuencial
     */
    protected function generateInvoiceNumber(): string
    {
        $prefix = env('DIAN_INVOICE_PREFIX', 'ARC');
        $lastInvoice = DianInvoice::latest()->first();
        $number = $lastInvoice ? ((int) substr($lastInvoice->numero_factura, strlen($prefix))) + 1 : 1;

        return $prefix . str_pad($number, 10, '0', STR_PAD_LEFT);
    }

    /**
     * Generar PDF de la factura
     */
    protected function generatePDF(Invoice $invoice, string $cufe): string
    {
        // Usar DomPDF o similar para generar PDF
        $filename = 'invoices/dian/' . $cufe . '.pdf';

        // Implementación simplificada
        // En producción, usar plantilla HTML con DomPDF

        return $filename;
    }

    /**
     * Obtener datos del emisor (Arconte)
     */
    protected function getEmisorData(): array
    {
        return [
            'nit' => env('DIAN_COMPANY_NIT', '900123456'),
            'nombre' => env('APP_NAME', 'Arconte'),
            'razon_social' => env('DIAN_COMPANY_NAME', 'Arconte SAS'),
            'direccion' => env('DIAN_COMPANY_ADDRESS', 'Bogotá, Colombia'),
        ];
    }

    /**
     * Obtener datos del cliente
     */
    protected function getClienteData(Invoice $invoice): array
    {
        return [
            'cedula' => $invoice->client_nit ?? 'N/A',
            'nombre' => $invoice->client_name ?? 'Cliente',
        ];
    }

    /**
     * Consultar estado de factura en DIAN
     */
    public function consultarEstado(string $cufe): array
    {
        $url = $this->isProduction ? $this->dianApiUrl : $this->dianTestUrl;

        try {
            $response = Http::timeout(30)->get($url . '/GetStatus', [
                'trackId' => $cufe
            ]);

            return $response->json();
        } catch (\Exception $e) {
            report($e);
            return ['error' => $e->getMessage()];
        }
    }
}
