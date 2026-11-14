# 🏛️ Sistema de Gestión Integral - Funeraria Cristo Rey

Sistema web completo para la gestión de expedientes, servicios funerarios, inventario, flota y finanzas de la Funeraria Cristo Rey.

![Laravel](https://img.shields.io/badge/Laravel-13.x-red)
![React](https://img.shields.io/badge/React-19.x-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18.x-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 📖 Descripción del Proyecto

Este sistema fue desarrollado como Proyecto Integrado para la carrera de **Analista Programador** (INACAP), en colaboración con la **Funeraria Cristo Rey**.

Resuelve los problemas de gestión manual (planillas, doble asignación de recursos, falta de seguimiento de pagos) mediante una plataforma centralizada, moderna y responsiva que incluye:

- **Expedientes completos (Wizard):** Creación guiada en 3 pasos que incluye Cliente, Fallecido, Servicio, Recursos (Inventario, Vehículo y Chofer) y Abono inicial en una sola transacción.
- **Asignación inteligente de recursos:** Validación automática de disponibilidad de empleados (ausencias) y prevención de choques de agenda para vehículos y choferes.
- **Control de inventario:** Ataúdes y urnas con procedencia (Talca/Santiago), descuento automático de stock y alertas de stock mínimo.
- **Gestión de flota:** Vehículos con estados (disponible, en servicio, mantenimiento) y mantención programada.
- **Módulo financiero:** Abonos, saldos, comprobantes en PDF y certificados de Paz y Salvo.
- **Portal del cliente:** Acceso privado para que la familia vea su expediente y el estado de sus pagos.
- **Reportes:** Exportación a PDF y Excel para fiscalización (Seremi).
- **Seguridad robusta:** Bloqueo automático de cuentas tras 3 intentos fallidos, con desbloqueo manual por el administrador. Excepción de seguridad para cuentas de Administrador.

---

## 🛠️ Stack Tecnológico

### Backend
| Tecnología | Versión | Uso |
|---|---|---|
| **PHP** | 8.4 | Lenguaje base |
| **Laravel** | 13.x | Framework principal |
| **PostgreSQL** | 18.x | Base de datos relacional |
| **Laravel Fortify** | - | Autenticación y 2FA |
| **Spatie Permission** | - | Roles y permisos |
| **Laravel Excel** | - | Exportación a Excel |
| **dompdf** | - | Generación de PDFs |

### Frontend
| Tecnología | Versión | Uso |
|---|---|---|
| **React** | 19.x | Biblioteca de UI |
| **Inertia.js** | 3.x | Puente Laravel ↔ React |
| **TypeScript** | 5.x | Tipado estático |
| **Tailwind CSS** | 4.x | Estilos utilitarios |
| **shadcn/ui** | - | Componentes UI |
| **Lucide React** | - | Iconografía |
| **Vite Plus** | - | Bundler |

---

## 🚀 Requisitos Previos

Antes de instalar, asegúrate de tener:

- **PHP 8.4+** (recomendado: [Laravel Herd](https://herd.laravel.com))
- **Composer** (incluido con Herd)
- **Node.js 20+** y **npm**
- **PostgreSQL 18+** (instalado y corriendo)
- **Git**

---

## 📦 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/joselfica/funeraria.git
cd funeraria-cristo-rey