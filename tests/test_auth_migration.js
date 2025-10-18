/**
 * Script para probar la migración de autenticación a cookies
 * Este script verifica que:
 * 1. El login funcione correctamente con cookies
 * 2. Las rutas protegidas requieran autenticación
 * 3. El logout funcione correctamente
 * 4. Las cookies se manejen apropiadamente
 */

const fetch = require('node-fetch');

// Configuración
const API_BASE = 'http://public.test/api';
const FRONTEND_URL = 'http://localhost:3000';

// Credenciales de prueba
const TEST_CREDENTIALS = {
  email: 'admin@juridica.test',
  password: 'admin123'
};

class AuthTester {
  constructor() {
    this.cookies = '';
    this.csrfToken = '';
  }

  // Extraer cookies de la respuesta
  extractCookies(response) {
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      this.cookies = setCookieHeader;
      console.log('📍 Cookies recibidas:', setCookieHeader);
    }
  }

  // Función para limpiar BOM y parsear JSON
  cleanJsonParse(text) {
    // Remover BOM UTF-8 y caracteres de reemplazo
    text = text.replace(/^\uFEFF/, ''); // UTF-8 BOM
    text = text.replace(/^\ufeff/, ''); // UTF-8 BOM alternativo
    text = text.replace(/^[\x00-\x1F\x7F-\x9F\uFFFD]*/, ''); // Caracteres de control y reemplazo
    text = text.replace(/^\?+/, ''); // Caracteres de reemplazo '???'
    
    // Buscar el primer '{' para asegurar que empezamos con JSON válido
    const jsonStart = text.indexOf('{');
    if (jsonStart > 0) {
      text = text.substring(jsonStart);
    }
    
    return JSON.parse(text);
  }

  // Hacer request con cookies
  async makeRequest(url, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Origin': FRONTEND_URL,
      'Referer': FRONTEND_URL,
      ...options.headers
    };

    if (this.cookies) {
      headers['Cookie'] = this.cookies;
    }

    if (this.csrfToken) {
      headers['X-CSRF-TOKEN'] = this.csrfToken;
    }

    return fetch(url, {
      ...options,
      headers,
      credentials: 'include'
    });
  }

  // Test 1: Obtener token CSRF (Sanctum usa sanctum/csrf-cookie)
  async testCSRF() {
    console.log('\n🔐 Test 1: Obteniendo token CSRF...');
    
    try {
      const response = await this.makeRequest(`${API_BASE.replace('/api', '')}/sanctum/csrf-cookie`);
      
      if (response.ok) {
        this.extractCookies(response);
        console.log('✅ CSRF token obtenido via Sanctum');
        return true;
      } else {
        console.log('❌ Error obteniendo CSRF token:', response.status);
        return false;
      }
    } catch (error) {
      console.log('❌ Error en CSRF:', error.message);
      return false;
    }
  }

  // Test 2: Login con credenciales
  async testLogin() {
    console.log('\n🔑 Test 2: Probando login...');
    
    try {
      const response = await this.makeRequest(`${API_BASE}/auth/login`, {
        method: 'POST',
        body: JSON.stringify(TEST_CREDENTIALS)
      });

      this.extractCookies(response);

      if (response.ok) {
        const text = await response.text();
        const data = this.cleanJsonParse(text);
        console.log('✅ Login exitoso');
        console.log('👤 Usuario:', data.user?.name || 'N/A');
        console.log('📧 Email:', data.user?.email || 'N/A');
        return true;
      } else {
        const errorData = await response.json();
        console.log('❌ Error en login:', response.status, errorData);
        return false;
      }
    } catch (error) {
      console.log('❌ Error en login:', error.message);
      return false;
    }
  }

  // Test 3: Verificar acceso a ruta protegida
  async testProtectedRoute() {
    console.log('\n🛡️ Test 3: Probando ruta protegida...');
    
    try {
      const response = await this.makeRequest(`${API_BASE}/auth/me`);

      if (response.ok) {
        const text = await response.text();
        const data = this.cleanJsonParse(text);
        console.log('✅ Acceso a ruta protegida exitoso');
        console.log('👤 Datos del usuario autenticado:', data.name || 'N/A');
        return true;
      } else {
        console.log('❌ Error accediendo a ruta protegida:', response.status);
        return false;
      }
    } catch (error) {
      console.log('❌ Error en ruta protegida:', error.message);
      return false;
    }
  }

  // Test 4: Verificar que funcionen otros endpoints
  async testOtherEndpoints() {
    console.log('\n📋 Test 4: Probando otros endpoints...');
    
    const endpoints = [
      { url: `${API_BASE}/cases`, name: 'Casos' },
      { url: `${API_BASE}/documents`, name: 'Documentos' },
      { url: `${API_BASE}/notifications`, name: 'Notificaciones' }
    ];

    let passed = 0;
    
    for (const endpoint of endpoints) {
      try {
        const response = await this.makeRequest(endpoint.url);
        
        if (response.ok) {
          const text = await response.text();
          const data = this.cleanJsonParse(text);
          console.log(`✅ ${endpoint.name}: OK (${Array.isArray(data) ? data.length : 'N/A'} items)`);
          passed++;
        } else {
          console.log(`❌ ${endpoint.name}: Error ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint.name}: ${error.message}`);
      }
    }

    return passed === endpoints.length;
  }

  // Test 5: Logout
  async testLogout() {
    console.log('\n🚪 Test 5: Probando logout...');
    
    try {
      const response = await this.makeRequest(`${API_BASE}/auth/logout`, {
        method: 'POST'
      });

      this.extractCookies(response);

      if (response.ok) {
        console.log('✅ Logout exitoso');
        
        // Verificar que ya no tenemos acceso
        const testAccess = await this.makeRequest(`${API_BASE}/user`);
        if (testAccess.status === 401) {
          console.log('✅ Confirmado: No hay acceso después del logout');
          return true;
        } else {
          console.log('⚠️ Advertencia: Aún hay acceso después del logout');
          return false;
        }
      } else {
        console.log('❌ Error en logout:', response.status);
        return false;
      }
    } catch (error) {
      console.log('❌ Error en logout:', error.message);
      return false;
    }
  }

  // Ejecutar todos los tests
  async runAllTests() {
    console.log('🧪 Iniciando pruebas de migración de autenticación...');
    console.log('🎯 Backend:', API_BASE);
    console.log('🌐 Frontend:', FRONTEND_URL);

    const tests = [
      { name: 'CSRF Token', method: 'testCSRF' },
      { name: 'Login', method: 'testLogin' },
      { name: 'Ruta Protegida', method: 'testProtectedRoute' },
      { name: 'Otros Endpoints', method: 'testOtherEndpoints' },
      { name: 'Logout', method: 'testLogout' }
    ];

    let passed = 0;
    const results = [];

    for (const test of tests) {
      const result = await this[test.method]();
      results.push({ name: test.name, passed: result });
      if (result) passed++;
    }

    // Resumen
    console.log('\n📊 RESUMEN DE PRUEBAS:');
    console.log('========================');
    
    results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.name}`);
    });

    console.log(`\n🎯 Total: ${passed}/${tests.length} pruebas pasaron`);
    
    if (passed === tests.length) {
      console.log('🎉 ¡Todas las pruebas pasaron! La migración fue exitosa.');
    } else {
      console.log('⚠️ Algunas pruebas fallaron. Revisar la configuración.');
    }

    return passed === tests.length;
  }
}

// Ejecutar tests
if (require.main === module) {
  const tester = new AuthTester();
  tester.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('💥 Error ejecutando pruebas:', error);
    process.exit(1);
  });
}

module.exports = AuthTester;