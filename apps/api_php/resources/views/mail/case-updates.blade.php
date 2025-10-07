<x-mail::message>
# Novedades en tus procesos

@foreach($updates as $u)
- **{{ $u["radicado"] }}**: {{ $u["mensaje"] }} ({{ $u["fecha"] }})
@endforeach

Gracias,<br>
{{ config('app.name') }}
</x-mail::message>
