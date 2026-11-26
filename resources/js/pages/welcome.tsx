import { Head, Link } from '@inertiajs/react';
import { 
    Phone, Mail, MapPin, Clock, CheckCircle2, ArrowRight, 
    ChevronRight, Menu, X, MessageCircle, FileText, Flame, 
    Crown, Eye, ShieldCheck, Sparkles
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export interface CatalogItem {
    id: number;
    name: string;
    category: 'ataud' | 'urna';
    material: string;
    finish: string;
    description: string;
    image: string;
    tag?: string;
    specs: string[];
}

interface WelcomeProps {
    catalogItems?: CatalogItem[];
}

const DEFAULT_CATALOG: CatalogItem[] = [
    {
        id: 1,
        name: 'Modelo Catedral Roble',
        category: 'ataud',
        material: 'Madera de Roble Seleccionado',
        finish: 'Barniz satinado nogal oscuro con herrajes bronce',
        description: 'Diseño clásico de líneas sobrias, interior acolchado en raso marfil y terminaciones artesanales de alta durabilidad.',
        image: 'https://s.alicdn.com/@sc04/kf/He978584d8b78479db753b364bc33b5b9G.png',
        tag: 'Más solicitado',
        specs: [
            'Interior tapizado en raso blanco/marfil',
            'Manillas metálicas reforzadas',
            'Compatible con cuota mortuoria AFP / IPS',
        ],
    },
    {
        id: 2,
        name: 'Modelo Araucanía Nativo',
        category: 'ataud',
        material: 'Madera Nativa de Raulí',
        finish: 'Acabado natural mate con veta visible',
        description: 'Fabricación tradicional del sur de Chile, de estética cálida y respetuosa, ideal para ceremonias íntimas y familiares.',
        image: 'https://funerariaalarcon.cl/wp-content/uploads/2024/05/Urna-Italiana-de-Rauli-2.390.000-scaled.jpeg',
        tag: 'Tradición Regional',
        specs: [
            'Madera noble certificada de La Araucanía',
            'Sellado interior hermético',
            'Incluye placa identificatoria grabada',
        ],
    },
    {
        id: 3,
        name: 'Modelo Cerezo Premium',
        category: 'ataud',
        material: 'Cerezo',
        finish: 'Laca brillante profunda con detalles dorados',
        description: 'Nuestra línea superior de máxima solemnidad, con doble tapa abatible y tapicería capitoné confeccionada a mano.',
        image: 'https://image.made-in-china.com/365f3j00fshbEzwMYUri/Caja-s-lida-de-ata-d-de-madera-de-cerezo-de-calidad-superior-para-hogares-funerarios-Suministro.webp',
        tag: 'Línea Superior',
        specs: [
            'Doble tapa de exhibición',
            'Tapicería capitoné de terciopelo suave',
            'Herrajes continuos de bronce envejecido',
        ],
    },
    {
        id: 4,
        name: 'Urna Cineraria Mármol Blanco',
        category: 'urna',
        material: 'Mármol Natural Pulido',
        finish: 'Veta gris suave con cierre roscado seguro',
        description: 'Pieza sobria y atemporal diseñada para columbario, nicho o resguardo familiar en el hogar.',
        image: 'https://funerariasporsiempre.com/wp-content/uploads/2022/12/urna-crema-con-grabado.jpg',
        tag: 'Cremación',
        specs: [
            'Capacidad estándar adulto (3.5 litros)',
            'Tapa superior con sello de seguridad',
            'Base con fieltro protector',
        ],
    },
    {
        id: 5,
        name: 'Urna Cineraria Cedro Noble',
        category: 'urna',
        material: 'Madera de Cedro Rojo',
        finish: 'Ebanistería fina satinada',
        description: 'Cofre cinerario de madera cálida con ensambles invisibles y espacio frontal para placa conmemorativa.',
        image: 'https://i.etsystatic.com/31432200/r/il/235d57/3591855974/il_570xN.3591855974_7mbf.jpg',
        specs: [
            'Apertura inferior asegurada con tornillos',
            'Placa metálica personalizada incluida',
            'Apta para sepultación o columbario',
        ],
    },
    {
        id: 6,
        name: 'Urna Porcelana',
        category: 'urna',
        material: 'Porcelana',
        finish: 'Textura orgánica arena',
        description: 'Pensada para ceremonias ecológicas en tierra o agua, reintegrándose naturalmente al entorno sin dejar residuos.',
        image: 'https://http2.mlstatic.com/D_NQ_NP_994565-MLA110129227684_042026-O-urna-recipiente-cenizas-anfora-para-humanos-bronce-esmaltado.webp',
        tag: 'Ecológica',
        specs: [
            '100% biodegradable y libre de químicos',
            'Apta para plantación conmemorativa',
            'Incluye bolsa interior hidrosoluble',
        ],
    },
];

export default function Welcome({ catalogItems = DEFAULT_CATALOG }: WelcomeProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeBranch, setActiveBranch] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState<'todos' | 'ataud' | 'urna'>('todos');
    const [selectedProduct, setSelectedProduct] = useState<CatalogItem | null>(null);

    const filteredCatalog = catalogItems.filter((item) =>
        selectedCategory === 'todos' ? true : item.category === selectedCategory
    );

    const services = [
        {
            number: '01',
            title: 'Servicios Funerarios Integrales',
            description: 'Coordinación completa de velatorios, traslados, capillas ardientes y ceremonias de despedida con absoluta solemnidad y respeto.',
            icon: Flame,
        },
        {
            number: '02',
            title: 'Gestión Legal y Previsional',
            description: 'Tramitamos certificados médicos, inscripciones en Registro Civil, pases de sepultación y cobro de cuotas mortuorias (AFP / IPS).',
            icon: FileText,
        },
        {
            number: '03',
            title: 'Asistencia Inmediata 24/7',
            description: 'Equipo de guardia permanente en Temuco y toda La Araucanía. Acudimos al domicilio o centro asistencial en minutos.',
            icon: Clock,
        },
    ];

    const branches = [
        {
            name: 'Casa Matriz — Manuel Montt',
            address: 'Manuel Montt #1991, Temuco',
            phone: '+56 45 212 3456',
            rawPhone: '+56452123456',
            email: 'contacto@funerariacristorey.cl',
            badge: 'Atención 24 Horas',
            hours: 'Abierto las 24 horas, todos los días',
            mapUrl: 'https://maps.google.com/?q=Manuel+Montt+1991,+Temuco',
        },
        {
            name: 'Sucursal — Blanco Encalada',
            address: 'Calle Blanco #456, Temuco',
            phone: '+56 45 265 4321',
            rawPhone: '+56452654321',
            email: 'sucursal2@funerariacristorey.cl',
            badge: 'Salas de Atención',
            hours: 'Lunes a Domingo: 08:30 – 21:00 hrs',
            mapUrl: 'https://maps.google.com/?q=Blanco+456,+Temuco',
        },
    ];

    const emergencySteps = [
        {
            step: '1',
            title: 'Contáctanos de inmediato',
            desc: 'Llámanos a cualquier hora. Un asesor te guiará con calma desde el primer segundo.',
        },
        {
            step: '2',
            title: 'Certificado de defunción',
            desc: 'Te orientamos para obtener el certificado médico o gestionamos el trámite si ocurrió en casa.',
        },
        {
            step: '3',
            title: 'Nos encargamos del resto',
            desc: 'Traslado, preparación, elección de urna o ataúd, velatorio y trámites legales sin preocupaciones.',
        },
    ];

    const getWhatsAppUrl = (productName?: string) => {
        const text = productName
            ? `Hola Funeraria Cristo Rey, quisiera consultar disponibilidad y valores sobre: ${productName}.`
            : `Hola Funeraria Cristo Rey, necesito orientación y asistencia.`;
        return `https://wa.me/56912345678?text=${encodeURIComponent(text)}`;
    };

    return (
        <>
            <Head title="Funeraria Cristo Rey | Servicios Funerarios y Catálogo en Temuco">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Great+Vibes&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
            </Head>

            <div 
                className="min-h-screen bg-white text-neutral-800 selection:bg-[#9B111E] selection:text-white"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
                {/* ============ TOPBAR DE EMERGENCIA ============ */}
                <div className="bg-[#7A0C17] text-white text-xs py-2 px-4">
                    <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                            </span>
                            <span className="tracking-wide font-medium">Guardia funeraria activa las 24 horas en Temuco y La Araucanía</span>
                        </div>
                        <div className="hidden sm:flex items-center gap-6">
                            <a href="tel:+56452123456" className="hover:underline font-semibold">
                                Urgencias: +56 45 212 3456
                            </a>
                            <span className="text-red-300/60">|</span>
                            <span>Manuel Montt #1991, Temuco</span>
                        </div>
                    </div>
                </div>

                {/* ============ NAVBAR ============ */}
                <nav className="bg-white/95 backdrop-blur-md sticky top-0 z-40 border-b border-neutral-200/80 shadow-xs">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-20">
                            {/* Logo oficial */}
                            <Link href="/" className="flex items-center gap-3 group">
                                <div className="flex flex-col leading-none">
                                    <span className="text-[10px] font-extrabold italic tracking-[0.18em] text-[#9B111E] uppercase">
                                        FUNERARIA
                                    </span>
                                    <div className="flex items-center relative">
                                        <span 
                                            className="text-3xl sm:text-4xl text-[#9B111E] pr-1"
                                            style={{ fontFamily: "'Great Vibes', cursive" }}
                                        >
                                            Cristo Rey
                                        </span>
                                        <Crown className="h-3.5 w-3.5 text-[#9B111E] fill-[#9B111E] -mt-4 -ml-1" />
                                    </div>
                                </div>
                            </Link>

                            {/* Menú Desktop */}
                            <div className="hidden lg:flex items-center gap-7 text-sm font-medium text-neutral-600">
                                {[
                                    { label: 'Servicios', href: '#servicios' },
                                    { label: 'Catálogo de Ataúdes y Urnas', href: '#catalogo' },
                                    { label: 'Guía de Emergencia', href: '#guia' },
                                    { label: 'Trayectoria', href: '#nosotros' },
                                    { label: 'Sucursales', href: '#sucursales' },
                                ].map((item) => (
                                    <a 
                                        key={item.label}
                                        href={item.href} 
                                        className="hover:text-[#9B111E] transition-colors relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-[#9B111E] hover:after:w-full after:transition-all"
                                    >
                                        {item.label}
                                    </a>
                                ))}
                            </div>

                            {/* Botones Desktop */}
                            <div className="hidden md:flex items-center gap-3">
                                <Link href="/login">
                                    <Button variant="ghost" size="sm" className="text-neutral-500 hover:text-[#9B111E] hover:bg-red-50/60 text-xs">
                                        Acceso Sistema
                                    </Button>
                                </Link>
                                <a href="tel:+56452123456">
                                    <Button size="sm" className="bg-[#9B111E] hover:bg-[#7A0C17] text-white px-5 h-10 shadow-sm">
                                        <Phone className="h-3.5 w-3.5 mr-2" />
                                        Llamar 24/7
                                    </Button>
                                </a>
                            </div>

                            {/* Menú Móvil Toggle */}
                            <button 
                                className="lg:hidden p-2 text-neutral-700 hover:text-[#9B111E] hover:bg-red-50 rounded-lg"
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                aria-label="Abrir menú"
                            >
                                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                        </div>
                    </div>

                    {/* Menú Móvil Desplegable */}
                    {isMenuOpen && (
                        <div className="lg:hidden bg-white border-t border-neutral-200 px-4 py-5 space-y-2 shadow-xl">
                            {[
                                { label: 'Servicios', href: '#servicios' },
                                { label: 'Catálogo de Ataúdes y Urnas', href: '#catalogo' },
                                { label: 'Guía de Emergencia', href: '#guia' },
                                { label: 'Trayectoria', href: '#nosotros' },
                                { label: 'Sucursales', href: '#sucursales' },
                            ].map((item) => (
                                <a 
                                    key={item.label}
                                    href={item.href} 
                                    className="block text-base font-medium text-neutral-700 py-2.5 px-3 rounded-lg hover:bg-red-50 hover:text-[#9B111E]"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {item.label}
                                </a>
                            ))}
                            <div className="pt-4 border-t border-neutral-100 flex flex-col gap-2.5">
                                <Link href="/login">
                                    <Button variant="outline" className="w-full border-neutral-300">Acceso Sistema Interno</Button>
                                </Link>
                                <a href="tel:+56452123456">
                                    <Button className="w-full bg-[#9B111E] hover:bg-[#7A0C17] text-white">
                                        <Phone className="h-4 w-4 mr-2" /> Llamar Ahora
                                    </Button>
                                </a>
                            </div>
                        </div>
                    )}
                </nav>

                {/* ============ HERO EDITORIAL ============ */}
                <section className="relative bg-neutral-950 text-white overflow-hidden">
                    <div className="absolute inset-0">
                        <img 
                            src="https://s3.us-east-1.amazonaws.com/website-anf/header/_1600x900_crop_center-center_100_none/ANF-Heaven-Hope-of-Our-Souls-1600x900.jpg" 
                            alt="Luz y serenidad"
                            className="w-full h-full object-cover opacity-30 scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/90 to-[#7A0C17]/65"></div>
                    </div>

                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                            <div className="lg:col-span-8">
                                <div className="inline-flex items-center gap-3 text-red-200 text-xs uppercase tracking-[0.25em] font-semibold mb-6">
                                    <span className="w-8 h-[1.5px] bg-[#9B111E]"></span>
                                    Desde 1990 en La Araucanía
                                </div>
                                
                                <h1 
                                    className="text-4xl sm:text-5xl lg:text-7xl font-semibold leading-[1.08] mb-6 text-white"
                                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                                >
                                    Honramos la memoria con{' '}
                                    <span className="italic text-red-200 font-normal">
                                        serenidad, respeto y calidez humana.
                                    </span>
                                </h1>
                                
                                <p className="text-lg text-neutral-300 mb-10 leading-relaxed max-w-2xl font-normal">
                                    Cuando ocurre una pérdida, no tienes que enfrentarlo solo. Nos hacemos cargo 
                                    de cada gestión y detalle ceremonial para que tu familia pueda despedirse en paz.
                                </p>

                                <div className="flex flex-col sm:flex-row gap-4">
                                    <a href="tel:+56452123456">
                                        <Button size="lg" className="w-full sm:w-auto bg-[#9B111E] hover:bg-[#7A0C17] text-white text-base h-13 px-8 rounded-lg shadow-lg shadow-black/40">
                                            <Phone className="h-4 w-4 mr-2.5" /> Solicitar Asistencia Inmediata
                                        </Button>
                                    </a>
                                    <a href="#catalogo">
                                        <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/25 bg-white/5 text-white hover:bg-white hover:text-[#9B111E] text-base h-13 px-8 rounded-lg transition-colors">
                                            Ver Catálogo de Urnas y Ataúdes
                                        </Button>
                                    </a>
                                </div>
                            </div>

                            {/* Tarjeta lateral de contacto rápido */}
                            <div className="lg:col-span-4">
                                <div className="bg-white text-neutral-900 rounded-2xl p-7 shadow-2xl border-t-4 border-[#9B111E]">
                                    <p className="text-xs uppercase tracking-[0.2em] text-[#9B111E] font-bold mb-2">
                                        Línea Directa de Urgencia
                                    </p>
                                    <h3 
                                        className="text-2xl text-neutral-900 font-bold mb-4"
                                        style={{ fontFamily: "'Cormorant Garamond', serif" }}
                                    >
                                        Atención inmediata en domicilio, clínica u hospital
                                    </h3>
                                    <div className="space-y-3 text-sm text-neutral-600 border-t border-neutral-100 pt-4 mb-6">
                                        <div className="flex justify-between items-center">
                                            <span className="text-neutral-500">Teléfono fijo:</span>
                                            <a href="tel:+56452123456" className="text-[#9B111E] font-bold text-base hover:underline">+56 45 212 3456</a>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-neutral-500">Convenios:</span>
                                            <span className="text-neutral-800 font-medium">AFP · IPS · Cajas · Seguros</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-neutral-500">Cobertura:</span>
                                            <span className="text-neutral-800 font-medium">Temuco y toda la región</span>
                                        </div>
                                    </div>
                                    <a href="#guia" className="inline-flex items-center text-xs uppercase tracking-wider text-[#9B111E] hover:text-[#7A0C17] font-bold">
                                        Ver pasos en caso de fallecimiento <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ============ FRANJA DE CIFRAS ============ */}
                <div className="bg-neutral-50 border-y border-neutral-200/80">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-9">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-y md:divide-y-0 md:divide-x divide-neutral-200">
                            {[
                                { value: '+30 Años', label: 'De tradición familiar en Temuco' },
                                { value: '+10.000', label: 'Familias acompañadas con respeto' },
                                { value: '100%', label: 'Gestión de trámites incluida' },
                                { value: '24 / 7', label: 'Disponibilidad todos los días' },
                            ].map((stat, idx) => (
                                <div key={idx} className={`pt-4 md:pt-0 ${idx > 0 ? 'md:pl-8' : ''}`}>
                                    <p 
                                        className="text-3xl md:text-4xl font-bold text-[#9B111E]"
                                        style={{ fontFamily: "'Cormorant Garamond', serif" }}
                                    >
                                        {stat.value}
                                    </p>
                                    <p className="text-xs sm:text-sm text-neutral-600 mt-1">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ============ SERVICIOS ============ */}
                <section id="servicios" className="py-24 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                            <div className="max-w-2xl">
                                <p className="text-[#9B111E] font-bold text-xs uppercase tracking-[0.25em] mb-3">
                                    Nuestros Servicios
                                </p>
                                <h2 
                                    className="text-4xl md:text-5xl font-semibold text-neutral-900 leading-tight"
                                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                                >
                                    Un acompañamiento integral, transparente y sin sobresaltos
                                </h2>
                            </div>
                            <p className="text-neutral-600 max-w-md text-sm leading-relaxed">
                                Cada familia y cada despedida es única. Adaptamos nuestros planes y ceremonias a sus deseos, creencias y presupuesto.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {services.map((service, index) => (
                                <div 
                                    key={index} 
                                    className="group bg-white rounded-xl p-9 border border-neutral-200 hover:border-[#9B111E] transition-all duration-300 shadow-xs hover:shadow-xl flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-8">
                                            <span 
                                                className="text-4xl font-light text-neutral-300 group-hover:text-[#9B111E] transition-colors"
                                                style={{ fontFamily: "'Cormorant Garamond', serif" }}
                                            >
                                                {service.number}
                                            </span>
                                            <div className="w-11 h-11 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-[#9B111E] group-hover:bg-[#9B111E] group-hover:text-white transition-colors">
                                                <service.icon className="h-5 w-5" />
                                            </div>
                                        </div>
                                        <h3 
                                            className="text-2xl font-bold text-neutral-900 mb-3"
                                            style={{ fontFamily: "'Cormorant Garamond', serif" }}
                                        >
                                            {service.title}
                                        </h3>
                                        <p className="text-neutral-600 leading-relaxed text-sm">
                                            {service.description}
                                        </p>
                                    </div>
                                    <div className="mt-8 pt-5 border-t border-neutral-100">
                                        <a href="#contacto" className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-[#9B111E] group-hover:translate-x-1 transition-transform">
                                            Consultar detalles <ChevronRight className="h-4 w-4 ml-1" />
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ============ CATÁLOGO DE ATAÚDES Y URNAS ============ */}
                <section id="catalogo" className="py-24 bg-neutral-50 border-y border-neutral-200/80">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                            <div className="max-w-2xl">
                                <p className="text-[#9B111E] font-bold text-xs uppercase tracking-[0.25em] mb-3">
                                    Catálogo Referencial
                                </p>
                                <h2 
                                    className="text-4xl md:text-5xl font-semibold text-neutral-900 leading-tight"
                                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                                >
                                    Ataúdes y Urnas Cinerarias
                                </h2>
                                <p className="text-neutral-600 text-base mt-3">
                                    Conoce nuestra selección de maderas nobles, líneas tradicionales y urnas. Todos nuestros modelos pueden financiarse mediante cuota mortuoria o convenios.
                                </p>
                            </div>

                            {/* Filtros de categoría */}
                            <div className="inline-flex bg-white p-1.5 rounded-xl border border-neutral-200 shadow-2xs self-start md:self-auto">
                                {[
                                    { id: 'todos', label: 'Todos los modelos' },
                                    { id: 'ataud', label: 'Ataúdes' },
                                    { id: 'urna', label: 'Urnas' },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setSelectedCategory(tab.id as 'todos' | 'ataud' | 'urna')}
                                        className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                                            selectedCategory === tab.id
                                                ? 'bg-[#9B111E] text-white shadow-xs'
                                                : 'text-neutral-600 hover:text-neutral-900'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Grid de productos */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredCatalog.map((item) => (
                                <div 
                                    key={item.id}
                                    className="group bg-white rounded-2xl overflow-hidden border border-neutral-200/90 hover:border-[#9B111E]/60 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col"
                                >
                                    {/* Imagen */}
                                    <div className="relative h-60 bg-neutral-100 overflow-hidden">
                                        <img 
                                            src={item.image} 
                                            alt={item.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent"></div>
                                        
                                        {/* Badges */}
                                        <div className="absolute top-4 left-4 flex items-center gap-2">
                                            <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/95 text-neutral-900 shadow-xs">
                                                {item.category === 'ataud' ? 'Ataúd' : 'Urna'}
                                            </span>
                                            {item.tag && (
                                                <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-[#9B111E] text-white shadow-xs">
                                                    {item.tag}
                                                </span>
                                            )}
                                        </div>

                                        <p className="absolute bottom-3 left-4 right-4 text-xs text-white/95 font-medium truncate">
                                            {item.material}
                                        </p>
                                    </div>

                                    {/* Contenido */}
                                    <div className="p-6 flex-1 flex flex-col justify-between">
                                        <div>
                                            <h3 
                                                className="text-2xl font-bold text-neutral-900 mb-2 group-hover:text-[#9B111E] transition-colors"
                                                style={{ fontFamily: "'Cormorant Garamond', serif" }}
                                            >
                                                {item.name}
                                            </h3>
                                            <p className="text-xs text-[#9B111E] font-medium mb-3">
                                                {item.finish}
                                            </p>
                                            <p className="text-sm text-neutral-600 leading-relaxed line-clamp-2 mb-5">
                                                {item.description}
                                            </p>
                                        </div>

                                        <div className="pt-4 border-t border-neutral-100 flex items-center gap-2.5">
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => setSelectedProduct(item)}
                                                className="flex-1 border-neutral-300 text-neutral-700 hover:border-[#9B111E] hover:text-[#9B111E] text-xs font-semibold h-10"
                                            >
                                                <Eye className="h-3.5 w-3.5 mr-1.5" /> Ver ficha
                                            </Button>
                                            <a 
                                                href={getWhatsAppUrl(item.name)} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="flex-1"
                                            >
                                                <Button 
                                                    size="sm" 
                                                    className="w-full bg-[#9B111E] hover:bg-[#7A0C17] text-white text-xs font-semibold h-10"
                                                >
                                                    <MessageCircle className="h-3.5 w-3.5 mr-1.5" /> Consultar
                                                </Button>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Nota de convenios bajo el catálogo */}
                        <div className="mt-12 bg-white rounded-2xl p-6 sm:p-8 border border-neutral-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-red-50 text-[#9B111E] flex items-center justify-center shrink-0">
                                    <ShieldCheck className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-neutral-900 text-base">
                                        ¿Tienes dudas sobre cobertura de Cuota Mortuoria (AFP / IPS)?
                                    </h4>
                                    <p className="text-sm text-neutral-600 mt-1">
                                        Contamos con planes integrales cubiertos total o parcialmente por el beneficio previsional, además de exhibición presencial en nuestras sucursales de Temuco.
                                    </p>
                                </div>
                            </div>
                            <a href={getWhatsAppUrl('Planes con Cuota Mortuoria')} target="_blank" rel="noopener noreferrer" className="shrink-0">
                                <Button className="bg-neutral-900 hover:bg-neutral-800 text-white px-6 h-11 text-sm">
                                    Solicitar asesoría sin compromiso
                                </Button>
                            </a>
                        </div>
                    </div>
                </section>

                {/* ============ GUÍA RÁPIDA DE EMERGENCIA ============ */}
                <section id="guia" className="py-20 bg-neutral-950 text-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="max-w-2xl mb-14">
                            <p className="text-red-400 font-bold text-xs uppercase tracking-[0.25em] mb-3">
                                Orientación en momentos difíciles
                            </p>
                            <h2 
                                className="text-3xl md:text-5xl font-semibold text-white mb-4"
                                style={{ fontFamily: "'Cormorant Garamond', serif" }}
                            >
                                ¿Qué hacer cuando fallece un ser querido?
                            </h2>
                            <p className="text-neutral-400 text-base">
                                Sabemos que en ese instante es difícil pensar con claridad. Solo sigue estos tres pasos:
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {emergencySteps.map((item) => (
                                <div key={item.step} className="bg-neutral-900 border border-neutral-800 rounded-xl p-8">
                                    <div className="w-10 h-10 rounded-full bg-[#9B111E] text-white flex items-center justify-center font-serif text-lg font-bold mb-5">
                                        {item.step}
                                    </div>
                                    <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                                    <p className="text-neutral-400 text-sm leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ============ NOSOTROS ============ */}
                <section id="nosotros" className="py-24 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 items-center">
                            <div className="lg:col-span-6 relative">
                                <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
                                    <img 
                                        src="https://images.unsplash.com/photo-1544928147-79a2dbc1f389?q=80&w=2070" 
                                        alt="Funeraria Cristo Rey Temuco"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="hidden sm:block absolute -bottom-6 -right-6 bg-[#9B111E] text-white p-7 rounded-xl shadow-xl max-w-xs">
                                    <p 
                                        className="text-2xl italic leading-snug mb-2"
                                        style={{ fontFamily: "'Cormorant Garamond', serif" }}
                                    >
                                        “Tratamos a cada familia con el mismo cuidado con el que honraríamos a la nuestra.”
                                    </p>
                                    <p className="text-xs uppercase tracking-widest text-red-200">
                                        Dirección · Funeraria Cristo Rey
                                    </p>
                                </div>
                            </div>

                            <div className="lg:col-span-6">
                                <p className="text-[#9B111E] font-bold text-xs uppercase tracking-[0.25em] mb-3">
                                    Nuestra Trayectoria
                                </p>
                                <h2 
                                    className="text-4xl md:text-5xl font-semibold text-neutral-900 mb-6 leading-tight"
                                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                                >
                                    Más de tres décadas acompañando a las familias de La Araucanía
                                </h2>
                                <p className="text-neutral-600 text-base mb-8 leading-relaxed">
                                    Desde 1990 en Temuco, hemos construido nuestro prestigio sobre la palabra empeñada, 
                                    la transparencia en nuestros valores y la calidez de nuestro equipo humano.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                                    {[
                                        'Asesoría personalizada 24/7',
                                        'Sin costos ocultos ni letra chica',
                                        'Urnas de maderas nobles y ecológicas',
                                        'Tramitación directa de cuota mortuoria',
                                        'Carrozas fúnebres de primer nivel',
                                        'Traslados dentro y fuera de la región',
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-start gap-2.5">
                                            <CheckCircle2 className="h-4 w-4 text-[#9B111E] shrink-0 mt-1" />
                                            <span className="text-sm text-neutral-700">{item}</span>
                                        </div>
                                    ))}
                                </div>
                                <Link href="/nosotros">
                                    <Button className="bg-[#9B111E] hover:bg-[#7A0C17] text-white px-7 h-11">
                                        Conocer nuestra historia <ArrowRight className="h-4 w-4 ml-2" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ============ SUCURSALES ============ */}
                <section id="sucursales" className="py-24 bg-neutral-50 border-t border-neutral-200/80">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-2xl mx-auto mb-14">
                            <p className="text-[#9B111E] font-bold text-xs uppercase tracking-[0.25em] mb-3">
                                Ubicaciones en Temuco
                            </p>
                            <h2 
                                className="text-4xl md:text-5xl font-semibold text-neutral-900 mb-4"
                                style={{ fontFamily: "'Cormorant Garamond', serif" }}
                            >
                                Nuestras Sucursales
                            </h2>
                            <p className="text-neutral-600 text-base">
                                Visítanos en cualquiera de nuestras dos direcciones en Temuco o solicita atención a domicilio.
                            </p>
                        </div>

                        <div className="flex justify-center gap-3 mb-10 md:hidden">
                            {branches.map((b, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveBranch(idx)}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                                        activeBranch === idx 
                                            ? 'bg-[#9B111E] text-white' 
                                            : 'bg-white text-neutral-600 border border-neutral-200'
                                    }`}
                                >
                                    {idx === 0 ? 'Casa Matriz' : 'Sucursal Blanco'}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {branches.map((branch, index) => (
                                <div 
                                    key={index}
                                    className={`${activeBranch !== index ? 'hidden md:block' : 'block'} bg-white rounded-2xl p-8 md:p-10 border border-neutral-200 shadow-xs`}
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2 mb-6 pb-6 border-b border-neutral-100">
                                        <div>
                                            <span className="text-xs uppercase tracking-widest text-[#9B111E] font-bold">
                                                {branch.badge}
                                            </span>
                                            <h3 
                                                className="text-2xl font-bold text-neutral-900 mt-1"
                                                style={{ fontFamily: "'Cormorant Garamond', serif" }}
                                            >
                                                {branch.name}
                                            </h3>
                                        </div>
                                        <a 
                                            href={branch.mapUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-xs font-bold text-[#9B111E] hover:bg-red-50 flex items-center gap-1 border border-red-200 px-3 py-2 rounded-lg transition-colors"
                                        >
                                            <MapPin className="h-3.5 w-3.5" /> Ver en Mapa
                                        </a>
                                    </div>
                                    
                                    <div className="space-y-4 text-sm text-neutral-600">
                                        <div className="flex items-start gap-3.5">
                                            <MapPin className="h-5 w-5 text-[#9B111E] shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-semibold text-neutral-900">{branch.address}</p>
                                                <p className="text-xs text-neutral-500 mt-0.5">{branch.hours}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3.5">
                                            <Phone className="h-5 w-5 text-[#9B111E] shrink-0" />
                                            <a href={`tel:${branch.rawPhone}`} className="hover:text-[#9B111E] font-bold text-neutral-900">
                                                {branch.phone}
                                            </a>
                                        </div>
                                        <div className="flex items-center gap-3.5">
                                            <Mail className="h-5 w-5 text-[#9B111E] shrink-0" />
                                            <a href={`mailto:${branch.email}`} className="hover:text-[#9B111E] break-all">
                                                {branch.email}
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ============ CTA FINAL ============ */}
                <section id="contacto" className="py-24 bg-[#9B111E] text-white relative overflow-hidden">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                        <p className="text-red-200 text-xs uppercase tracking-[0.28em] font-bold mb-4">
                            Estamos contigo
                        </p>
                        <h2 
                            className="text-4xl md:text-5xl font-semibold mb-6"
                            style={{ fontFamily: "'Cormorant Garamond', serif" }}
                        >
                            ¿Necesitas orientación o asistencia ahora mismo?
                        </h2>
                        <p className="text-red-100 text-lg mb-10 max-w-2xl mx-auto font-normal">
                            Nuestro equipo de turno responderá de inmediato para ayudarte con respeto, claridad y sin compromiso.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a href="tel:+56452123456">
                                <Button size="lg" className="w-full sm:w-auto bg-white hover:bg-neutral-100 text-[#9B111E] font-bold text-base h-13 px-8 shadow-lg">
                                    <Phone className="h-4 w-4 mr-2" /> Llamar al +56 45 212 3456
                                </Button>
                            </a>
                            <a href={getWhatsAppUrl()} target="_blank" rel="noopener noreferrer">
                                <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/40 text-white hover:bg-white/10 text-base h-13 px-8">
                                    <MessageCircle className="h-4 w-4 mr-2" /> Escribir por WhatsApp
                                </Button>
                            </a>
                        </div>
                    </div>
                </section>

                {/* ============ FOOTER ============ */}
                <footer className="bg-neutral-950 text-neutral-400 py-16 border-t border-neutral-800">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
                            <div className="md:col-span-2">
                                <div className="flex flex-col leading-none mb-5">
                                    <span className="text-[10px] font-extrabold italic tracking-[0.18em] text-red-400 uppercase">
                                        FUNERARIA
                                    </span>
                                    <div className="flex items-center">
                                        <span 
                                            className="text-3xl text-white pr-1"
                                            style={{ fontFamily: "'Great Vibes', cursive" }}
                                        >
                                            Cristo Rey
                                        </span>
                                        <Crown className="h-3.5 w-3.5 text-red-400 fill-red-400 -mt-3.5 -ml-1" />
                                    </div>
                                </div>
                                <p className="text-sm leading-relaxed max-w-sm text-neutral-400">
                                    Más de 30 años brindando servicios funerarios dignos, transparentes y humanos a las familias de Temuco y La Araucanía.
                                </p>
                            </div>
                            
                            <div>
                                <h4 className="text-white font-semibold mb-4 text-xs uppercase tracking-widest">Navegación</h4>
                                <ul className="space-y-2.5 text-sm">
                                    <li><a href="#servicios" className="hover:text-white transition-colors">Servicios Funerarios</a></li>
                                    <li><a href="#catalogo" className="hover:text-white transition-colors">Catálogo de Ataúdes y Urnas</a></li>
                                    <li><a href="#guia" className="hover:text-white transition-colors">Guía en caso de fallecimiento</a></li>
                                    <li><a href="#sucursales" className="hover:text-white transition-colors">Sucursales</a></li>
                                    <li><Link href="/login" className="hover:text-white transition-colors">Acceso Sistema</Link></li>
                                </ul>
                            </div>
                            
                            <div>
                                <h4 className="text-white font-semibold mb-4 text-xs uppercase tracking-widest">Contacto 24/7</h4>
                                <ul className="space-y-3 text-sm">
                                    <li className="flex items-center gap-2.5">
                                        <Phone className="h-4 w-4 text-red-400 shrink-0" /> 
                                        <a href="tel:+56452123456" className="hover:text-white">+56 45 212 3456</a>
                                    </li>
                                    <li className="flex items-center gap-2.5">
                                        <Mail className="h-4 w-4 text-red-400 shrink-0" /> 
                                        <a href="mailto:contacto@funerariacristorey.cl" className="hover:text-white break-all">
                                            contacto@funerariacristorey.cl
                                        </a>
                                    </li>
                                    <li className="flex items-start gap-2.5">
                                        <MapPin className="h-4 w-4 text-red-400 shrink-0 mt-0.5" /> 
                                        <span>Manuel Montt #1991, Temuco</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        
                        <div className="border-t border-neutral-800/80 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-neutral-500">
                            <p>© {new Date().getFullYear()} Funeraria Cristo Rey · Temuco, Chile.</p>
                            <p>Atención permanente las 24 horas del día.</p>
                        </div>
                    </div>
                </footer>

                {/* ============ MODAL FICHA TÉCNICA DE PRODUCTO ============ */}
                {selectedProduct && (
                    <div 
                        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
                        onClick={() => setSelectedProduct(null)}
                    >
                        <div 
                            className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2">
                                <div className="h-64 md:h-auto bg-neutral-100 relative">
                                    <img 
                                        src={selectedProduct.image} 
                                        alt={selectedProduct.name} 
                                        className="w-full h-full object-cover"
                                    />
                                    <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold uppercase bg-white text-neutral-900 shadow-sm">
                                        {selectedProduct.category === 'ataud' ? 'Ataúd' : 'Urna'}
                                    </span>
                                </div>

                                <div className="p-6 sm:p-8 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start gap-2 mb-2">
                                            <h3 
                                                className="text-3xl font-bold text-neutral-900 leading-tight"
                                                style={{ fontFamily: "'Cormorant Garamond', serif" }}
                                            >
                                                {selectedProduct.name}
                                            </h3>
                                            <button 
                                                onClick={() => setSelectedProduct(null)}
                                                className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100"
                                                aria-label="Cerrar ficha"
                                            >
                                                <X className="h-5 w-5" />
                                            </button>
                                        </div>

                                        <p className="text-xs font-bold uppercase tracking-wider text-[#9B111E] mb-4">
                                            {selectedProduct.material}
                                        </p>

                                        <p className="text-sm text-neutral-600 leading-relaxed mb-5">
                                            {selectedProduct.description}
                                        </p>

                                        <div className="border-t border-neutral-100 pt-4 mb-6">
                                            <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
                                                Características incluidas
                                            </p>
                                            <ul className="space-y-2">
                                                {selectedProduct.specs.map((spec, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-xs text-neutral-700">
                                                        <CheckCircle2 className="h-4 w-4 text-[#9B111E] shrink-0 mt-0.5" />
                                                        <span>{spec}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="space-y-2.5">
                                        <a 
                                            href={getWhatsAppUrl(selectedProduct.name)} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="block"
                                        >
                                            <Button className="w-full bg-[#9B111E] hover:bg-[#7A0C17] text-white h-11 font-semibold">
                                                <MessageCircle className="h-4 w-4 mr-2" /> Consultar valor por WhatsApp
                                            </Button>
                                        </a>
                                        <a href="tel:+56452123456" className="block">
                                            <Button variant="outline" className="w-full border-neutral-300 text-neutral-700 h-10 text-xs font-semibold">
                                                <Phone className="h-3.5 w-3.5 mr-2 text-[#9B111E]" /> Llamar a sala de ventas
                                            </Button>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ============ BOTÓN FLOTANTE DE WHATSAPP ============ */}
                <a
                    href={getWhatsAppUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Contactar por WhatsApp"
                    className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 bg-white hover:bg-neutral-50 text-neutral-900 border border-neutral-200 px-4 py-3 rounded-full shadow-2xl transition-transform hover:scale-105"
                >
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <MessageCircle className="h-5 w-5 text-[#9B111E]" />
                    <span className="text-xs font-bold pr-1 hidden sm:inline">Asistencia WhatsApp 24/7</span>
                </a>
            </div>
        </>
    );
}