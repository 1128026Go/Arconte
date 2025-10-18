<?php

namespace Database\Seeders;

use App\Models\Lawyer;
use App\Models\User;
use Illuminate\Database\Seeder;

class LawyerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $specialties = [
            'Derecho Laboral',
            'Derecho Civil',
            'Derecho Penal',
            'Derecho Comercial',
            'Derecho Administrativo',
            'Derecho de Familia',
        ];

        $cities = [
            'Bogotá',
            'Medellín',
            'Cali',
            'Barranquilla',
            'Cartagena',
            'Bucaramanga',
        ];

        $lawyers = [
            [
                'name' => 'María González Pérez',
                'email' => 'maria.gonzalez@example.com',
                'phone' => '+57 300 123 4567',
                'specialty' => 'Derecho Laboral',
                'city' => 'Bogotá',
                'bio' => 'Especialista en derecho laboral con amplia experiencia en defensa de trabajadores y empresas. Magíster en Derecho del Trabajo.',
                'rating' => 4.8,
                'total_reviews' => 45,
                'cases_won' => 85,
                'cases_total' => 100,
                'experience_years' => 12,
                'hourly_rate' => 250000,
                'verified' => true,
                'available' => true,
                'specialties' => ['Derecho Laboral', 'Derecho de la Seguridad Social'],
                'languages' => ['Español', 'Inglés'],
                'education' => 'Universidad Nacional de Colombia',
                'license_number' => 'TP-123456',
                'certifications' => 'Especialización en Derecho Laboral, Magíster en Derecho del Trabajo',
            ],
            [
                'name' => 'Carlos Rodríguez Martínez',
                'email' => 'carlos.rodriguez@example.com',
                'phone' => '+57 310 987 6543',
                'specialty' => 'Derecho Civil',
                'city' => 'Medellín',
                'bio' => 'Abogado civilista con enfoque en contratos y responsabilidad civil. 8 años de experiencia exitosa.',
                'rating' => 4.6,
                'total_reviews' => 32,
                'cases_won' => 70,
                'cases_total' => 85,
                'experience_years' => 8,
                'hourly_rate' => 200000,
                'verified' => true,
                'available' => true,
                'specialties' => ['Derecho Civil', 'Derecho Contractual'],
                'languages' => ['Español'],
                'education' => 'Universidad de Antioquia',
                'license_number' => 'TP-789012',
                'certifications' => 'Especialización en Derecho Civil',
            ],
            [
                'name' => 'Ana Martínez López',
                'email' => 'ana.martinez@example.com',
                'phone' => '+57 320 456 7890',
                'specialty' => 'Derecho Penal',
                'city' => 'Cali',
                'bio' => 'Penalista con 15 años de experiencia. Especializada en defensa penal y litigios complejos.',
                'rating' => 4.9,
                'total_reviews' => 58,
                'cases_won' => 95,
                'cases_total' => 110,
                'experience_years' => 15,
                'hourly_rate' => 300000,
                'verified' => true,
                'available' => true,
                'specialties' => ['Derecho Penal', 'Criminología'],
                'languages' => ['Español', 'Inglés', 'Francés'],
                'education' => 'Universidad del Valle',
                'license_number' => 'TP-345678',
                'certifications' => 'Especialización en Derecho Penal, Diplomado en Criminología',
            ],
            [
                'name' => 'Luis Fernando Gómez',
                'email' => 'luis.gomez@example.com',
                'phone' => '+57 315 234 5678',
                'specialty' => 'Derecho Comercial',
                'city' => 'Bogotá',
                'bio' => 'Experto en derecho comercial y societario. Asesor de múltiples empresas en Colombia.',
                'rating' => 4.7,
                'total_reviews' => 40,
                'cases_won' => 75,
                'cases_total' => 88,
                'experience_years' => 10,
                'hourly_rate' => 280000,
                'verified' => true,
                'available' => true,
                'specialties' => ['Derecho Comercial', 'Derecho Societario'],
                'languages' => ['Español', 'Inglés'],
                'education' => 'Universidad de los Andes',
                'license_number' => 'TP-901234',
                'certifications' => 'Especialización en Derecho Comercial',
            ],
            [
                'name' => 'Patricia Hernández',
                'email' => 'patricia.hernandez@example.com',
                'phone' => '+57 318 765 4321',
                'specialty' => 'Derecho de Familia',
                'city' => 'Barranquilla',
                'bio' => 'Especialista en derecho de familia con enfoque humanista. Mediadora certificada.',
                'rating' => 4.8,
                'total_reviews' => 50,
                'cases_won' => 80,
                'cases_total' => 95,
                'experience_years' => 11,
                'hourly_rate' => 220000,
                'verified' => true,
                'available' => true,
                'specialties' => ['Derecho de Familia', 'Mediación'],
                'languages' => ['Español'],
                'education' => 'Universidad del Norte',
                'license_number' => 'TP-567890',
                'certifications' => 'Especialización en Derecho de Familia, Certificación en Mediación',
            ],
            [
                'name' => 'Jorge Alberto Ruiz',
                'email' => 'jorge.ruiz@example.com',
                'phone' => '+57 312 876 5432',
                'specialty' => 'Derecho Administrativo',
                'city' => 'Bogotá',
                'bio' => 'Litigante en derecho administrativo con enfoque en contratación estatal y acciones de tutela.',
                'rating' => 4.5,
                'total_reviews' => 28,
                'cases_won' => 60,
                'cases_total' => 75,
                'experience_years' => 9,
                'hourly_rate' => 240000,
                'verified' => true,
                'available' => true,
                'specialties' => ['Derecho Administrativo', 'Contratación Estatal'],
                'languages' => ['Español'],
                'education' => 'Universidad Externado de Colombia',
                'license_number' => 'TP-234567',
                'certifications' => 'Especialización en Derecho Administrativo',
            ],
            [
                'name' => 'Sandra Milena Torres',
                'email' => 'sandra.torres@example.com',
                'phone' => '+57 319 654 3210',
                'specialty' => 'Derecho Laboral',
                'city' => 'Medellín',
                'bio' => 'Abogada laboralista con experiencia en negociación colectiva y acosos laborales.',
                'rating' => 4.7,
                'total_reviews' => 35,
                'cases_won' => 68,
                'cases_total' => 80,
                'experience_years' => 7,
                'hourly_rate' => 210000,
                'verified' => true,
                'available' => true,
                'specialties' => ['Derecho Laboral', 'Negociación Colectiva'],
                'languages' => ['Español', 'Inglés'],
                'education' => 'Universidad Pontificia Bolivariana',
                'license_number' => 'TP-890123',
                'certifications' => 'Especialización en Derecho Laboral',
            ],
            [
                'name' => 'Roberto Mendoza',
                'email' => 'roberto.mendoza@example.com',
                'phone' => '+57 314 321 0987',
                'specialty' => 'Derecho Penal',
                'city' => 'Cartagena',
                'bio' => 'Defensor penal con experiencia en delitos económicos y extradiciones.',
                'rating' => 4.6,
                'total_reviews' => 30,
                'cases_won' => 55,
                'cases_total' => 70,
                'experience_years' => 13,
                'hourly_rate' => 290000,
                'verified' => true,
                'available' => true,
                'specialties' => ['Derecho Penal', 'Delitos Económicos'],
                'languages' => ['Español', 'Inglés'],
                'education' => 'Universidad de Cartagena',
                'license_number' => 'TP-456789',
                'certifications' => 'Especialización en Derecho Penal Económico',
            ],
        ];

        // Create users and lawyers
        foreach ($lawyers as $lawyerData) {
            // Check if user already exists
            $user = User::firstOrCreate(
                ['email' => $lawyerData['email']],
                [
                    'name' => $lawyerData['name'],
                    'password' => bcrypt('password123'),
                ]
            );

            // Create lawyer profile
            Lawyer::updateOrCreate(
                ['email' => $lawyerData['email']],
                array_merge($lawyerData, ['user_id' => $user->id])
            );
        }

        $this->command->info('✅ ' . count($lawyers) . ' abogados creados exitosamente');
    }
}
