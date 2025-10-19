/**
 * Arconte Landing - Footer Component
 *
 * Footer completo con links, redes sociales y copyright.
 * Layout multi-columna responsive.
 *
 * Features:
 * - Logo y tagline
 * - Links organizados por categoría
 * - Social media icons
 * - Newsletter signup (placeholder)
 * - Copyright
 * - Responsive
 *
 * @author Arconte Team
 * @date 2025-10-18
 */

import { Link } from 'react-router-dom';
import { Scale, Github, Twitter, Linkedin, Mail, Heart } from 'lucide-react';

export default function Footer() {
  const footerLinks = {
    producto: [
      { name: 'Funcionalidades', href: '#features' },
      { name: 'Precios', href: '#pricing' },
      { name: 'IA Gemini', href: '#ai-section' },
      { name: 'Integraciones', href: '/integrations' },
      { name: 'Changelog', href: '/changelog' },
    ],
    recursos: [
      { name: 'Documentación', href: '/docs' },
      { name: 'Tutoriales', href: '/tutorials' },
      { name: 'Blog', href: '/blog' },
      { name: 'API', href: '/api-docs' },
      { name: 'Status', href: '/status' },
    ],
    empresa: [
      { name: 'Sobre Nosotros', href: '/about' },
      { name: 'Contacto', href: '/contact' },
      { name: 'Careers', href: '/careers' },
      { name: 'Prensa', href: '/press' },
      { name: 'Partners', href: '/partners' },
    ],
    legal: [
      { name: 'Términos de Uso', href: '/terms' },
      { name: 'Privacidad', href: '/privacy' },
      { name: 'Cookies', href: '/cookies' },
      { name: 'GDPR', href: '/gdpr' },
      { name: 'Seguridad', href: '/security' },
    ],
  };

  const socialLinks = [
    { name: 'Twitter', icon: Twitter, href: 'https://twitter.com/arconte' },
    { name: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com/company/arconte' },
    { name: 'GitHub', icon: Github, href: 'https://github.com/arconte' },
    { name: 'Email', icon: Mail, href: 'mailto:hola@arconte.co' },
  ];

  const scrollToSection = (e, href) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer */}
      <div className="landing-container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4 group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Scale className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                Arconte
              </span>
            </Link>
            <p className="text-gray-400 mb-6 max-w-sm">
              Tu asistente jurídico inteligente. Gestiona casos, automatiza documentos y accede a jurisprudencia colombiana con IA.
            </p>

            {/* Social Links */}
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h3 className="font-bold text-white mb-4">Producto</h3>
            <ul className="space-y-3">
              {footerLinks.producto.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    onClick={(e) => scrollToSection(e, link.href)}
                    className="hover:text-blue-400 transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-white mb-4">Recursos</h3>
            <ul className="space-y-3">
              {footerLinks.recursos.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="hover:text-blue-400 transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-white mb-4">Empresa</h3>
            <ul className="space-y-3">
              {footerLinks.empresa.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="hover:text-blue-400 transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-white mb-4">Legal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="hover:text-blue-400 transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter (Placeholder) */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="max-w-md">
            <h3 className="font-bold text-white mb-2">Mantente actualizado</h3>
            <p className="text-gray-400 text-sm mb-4">
              Recibe las últimas novedades y tips legales en tu email
            </p>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder="tu@email.com"
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                Suscribir
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="landing-container py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Arconte. Todos los derechos reservados.
            </p>
            <p className="text-gray-500 text-sm flex items-center gap-1">
              Hecho con <Heart className="w-4 h-4 text-red-500" /> en Colombia
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
