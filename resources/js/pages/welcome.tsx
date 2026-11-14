import { Head, Link } from '@inertiajs/react';
import { 
    Phone, Mail, MapPin, Clock, ShieldCheck, HeartHandshake, 
    ChevronRight, Menu, X, CheckCircle2, ArrowRight
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function Welcome() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Datos de ejemplo (en producción, estos vendrían de la BD)
    const services = [
        {
            title: 'Servicios Funerarios',
            description: 'Acompañamiento integral en los momentos más difíciles. Coordinamos todo el proceso con respeto y profesionalismo.',
            icon: HeartHandshake,
        },
        {
            title: 'Trámites Legales',
            description: 'Nos encargamos de toda la documentación, certificados y gestiones ante el Registro Civil y cementerios.',
            icon: ShieldCheck,
        },
        {
            title: 'Atención 24/7',
            description: 'Estamos disponibles todos los días del año, a cualquier hora, para atender sus necesidades de inmediato.',
            icon: Clock,
        },
    ];

    const branches = [
        {
            name: 'Casa Matriz',
            address: 'Manuel Montt #1991, Temuco',
            phone: '+56 45 212 3456',
            email: 'contacto@funerariacristorey.cl',
        },
        {
            name: 'Sucursal Manuel Blanco Encalada',
            address: 'Calle Blanco #456, Temuco',
            phone: '+56 45 265 4321',
            email: 'sucursal2@funerariacristorey.cl',
        },
    ];

    return (
        <>
            <Head title="Funeraria Cristo Rey - Acompañamos en los momentos difíciles" />

            <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
                
                {/* ============ NAVBAR ============ */}
                <nav className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16 md:h-20">
                            {/* Logo */}
                            <Link href="/" className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-rose-800 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                                    CR
                                </div>
                                <div>
                                    <p className="font-bold text-lg leading-tight text-rose-900">Cristo Rey</p>
                                    <p className="text-[10px] uppercase tracking-widest text-slate-500">Funeraria</p>
                                </div>
                            </Link>

                            {/* Menú Desktop */}
                            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                                <a href="#servicios" className="hover:text-rose-800 transition-colors">Servicios</a>
                                <a href="#nosotros" className="hover:text-rose-800 transition-colors">Nosotros</a>
                                <a href="#sucursales" className="hover:text-rose-800 transition-colors">Sucursales</a>
                                <a href="#contacto" className="hover:text-rose-800 transition-colors">Contacto</a>
                            </div>

                            {/* Botones Desktop */}
                            <div className="hidden md:flex items-center gap-3">
                                <Link href="/login">
                                    <Button variant="outline" size="sm" className="border-slate-300">Iniciar Sesión</Button>
                                </Link>
                                <a href="tel:+56452123456">
                                    <Button size="sm" className="bg-rose-800 hover:bg-rose-900 text-white">
                                        <Phone className="h-4 w-4 mr-2" />
                                        Llamar Ahora
                                    </Button>
                                </a>
                            </div>

                            {/* Menú Móvil Toggle */}
                            <button 
                                className="md:hidden text-slate-600"
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                            >
                                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                        </div>
                    </div>

                    {/* Menú Móvil Desplegable */}
                    {isMenuOpen && (
                        <div className="md:hidden bg-white border-t border-slate-200 px-4 py-4 space-y-3">
                            <a href="#servicios" className="block text-sm font-medium text-slate-600 py-2">Servicios</a>
                            <a href="#nosotros" className="block text-sm font-medium text-slate-600 py-2">Nosotros</a>
                            <a href="#sucursales" className="block text-sm font-medium text-slate-600 py-2">Sucursales</a>
                            <a href="#contacto" className="block text-sm font-medium text-slate-600 py-2">Contacto</a>
                            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                                <Link href="/login">
                                    <Button variant="outline" className="w-full border-slate-300">Iniciar Sesión</Button>
                                </Link>
                                <a href="tel:+56452123456">
                                    <Button className="w-full bg-rose-800 hover:bg-rose-900 text-white">
                                        <Phone className="h-4 w-4 mr-2" /> Llamar Ahora
                                    </Button>
                                </a>
                            </div>
                        </div>
                    )}
                </nav>

                {/* ============ HERO SECTION ============ */}
                <section className="relative bg-slate-900 text-white overflow-hidden">
                    {/* Fondo decorativo */}
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519817650390-64a93db51149?q=80&w=2070')] bg-cover bg-center opacity-20"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-slate-900/40"></div>

                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
                        <div className="max-w-2xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-900/30 border border-rose-800/50 text-rose-300 text-xs font-semibold mb-6">
                                <Clock className="h-3 w-3" /> Atención 24 horas, los 365 días del año
                            </div>
                            
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                                Acompañamos a tu familia en los <span className="text-rose-400">momentos más difíciles</span>
                            </h1>
                            
                            <p className="text-lg md:text-xl text-slate-300 mb-8 leading-relaxed">
                                En Funeraria Cristo Rey brindamos un servicio digno, respetuoso y profesional. 
                                Estamos aquí para ayudarte a despedir a quien más quieres.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <a href="tel:+56452123456">
                                    <Button size="lg" className="w-full sm:w-auto bg-rose-800 hover:bg-rose-900 text-white text-base h-12 px-8">
                                        <Phone className="h-5 w-5 mr-2" /> Llamar en Emergencia
                                    </Button>
                                </a>
                                <a href="#servicios">
                                    <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10 text-base h-12 px-8">
                                        Conocer Servicios <ChevronRight className="h-5 w-5 ml-1" />
                                    </Button>
                                </a>
                            </div>

                            {/* Trust badges */}
                            <div className="mt-12 flex flex-wrap gap-6 text-sm text-slate-400">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-400" /> +30 años de experiencia
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-400" /> 2 sucursales en Temuco
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Trámites incluidos
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ============ SERVICIOS ============ */}
                <section id="servicios" className="py-20 md:py-28 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <p className="text-rose-800 font-semibold text-sm uppercase tracking-wider mb-2">Nuestros Servicios</p>
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                                Todo lo que necesitas en un solo lugar
                            </h2>
                            <p className="text-slate-600 text-lg">
                                Nos encargamos de cada detalle para que tú puedas enfocarte en lo que realmente importa: tu familia.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                            {services.map((service, index) => (
                                <div 
                                    key={index} 
                                    className="group bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:border-rose-200 hover:shadow-lg transition-all duration-300"
                                >
                                    <div className="w-14 h-14 bg-rose-100 text-rose-800 rounded-xl flex items-center justify-center mb-6 group-hover:bg-rose-800 group-hover:text-white transition-colors">
                                        <service.icon className="h-7 w-7" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-3">{service.title}</h3>
                                    <p className="text-slate-600 leading-relaxed">{service.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ============ NOSOTROS ============ */}
                <section id="nosotros" className="py-20 md:py-28 bg-slate-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <div>
                                <p className="text-rose-800 font-semibold text-sm uppercase tracking-wider mb-2">Sobre Nosotros</p>
                                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                                    Más de 30 años sirviendo a las familias de La Araucanía
                                </h2>
                                <p className="text-slate-600 text-lg mb-6 leading-relaxed">
                                    Desde 1990, Funeraria Cristo Rey ha acompañado a miles de familias en sus momentos más difíciles. 
                                    Nuestro compromiso es brindar un servicio digno, transparente y con calidez humana.
                                </p>
                                <ul className="space-y-3 mb-8">
                                    {[
                                        'Atención personalizada las 24 horas',
                                        'Trámites legales incluidos sin costos ocultos',
                                        'Amplia variedad de ataúdes y urnas',
                                        'Convenios con AFP, IPS y municipalidades',
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                                            <span className="text-slate-700">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Link href="/nosotros">
                                    <Button variant="outline" className="border-rose-800 text-rose-800 hover:bg-rose-50">
                                        Conocer más <ArrowRight className="h-4 w-4 ml-2" />
                                    </Button>
                                </Link>
                            </div>
                            <div className="relative">
                                <img 
                                    src="https://images.unsplash.com/photo-1544928147-79a2dbc1f389?q=80&w=2070" 
                                    alt="Funeraria Cristo Rey"
                                    className="rounded-2xl shadow-xl w-full h-[400px] object-cover"
                                />
                                <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-lg p-6 border border-slate-100">
                                    <p className="text-4xl font-bold text-rose-800">+10.000</p>
                                    <p className="text-sm text-slate-600 font-medium mt-1">Familias atendidas</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ============ SUCURSALES ============ */}
                <section id="sucursales" className="py-20 md:py-28 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <p className="text-rose-800 font-semibold text-sm uppercase tracking-wider mb-2">Nuestras Sucursales</p>
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                                Estamos cerca de ti
                            </h2>
                            <p className="text-slate-600 text-lg">
                                Contamos con dos sucursales en Temuco para atenderte de la mejor manera.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {branches.map((branch, index) => (
                                <div 
                                    key={index}
                                    className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:shadow-lg transition-shadow"
                                >
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 bg-rose-100 text-rose-800 rounded-lg flex items-center justify-center">
                                            <MapPin className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900">{branch.name}</h3>
                                            <p className="text-sm text-rose-800 font-medium">Sucursal Oficial</p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3 text-slate-600">
                                        <div className="flex items-start gap-3">
                                            <MapPin className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                                            <span>{branch.address}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Phone className="h-5 w-5 text-slate-400 shrink-0" />
                                            <a href={`tel:${branch.phone}`} className="hover:text-rose-800 transition-colors">
                                                {branch.phone}
                                            </a>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Mail className="h-5 w-5 text-slate-400 shrink-0" />
                                            <a href={`mailto:${branch.email}`} className="hover:text-rose-800 transition-colors break-all">
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
                <section id="contacto" className="py-20 md:py-28 bg-rose-900 text-white">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">
                            ¿Necesitas ayuda en este momento?
                        </h2>
                        <p className="text-lg text-rose-100 mb-8 max-w-2xl mx-auto">
                            Estamos disponibles las 24 horas del día, los 365 días del año. No dudes en contactarnos, 
                            estamos aquí para acompañarte.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <a href="tel:+56452123456">
                                <Button size="lg" className="w-full sm:w-auto bg-white text-rose-900 hover:bg-rose-50 text-base h-12 px-8">
                                    <Phone className="h-5 w-5 mr-2" /> Llamar Ahora
                                </Button>
                            </a>
                            <a href="https://wa.me/56912345678" target="_blank" rel="noopener noreferrer">
                                <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10 text-base h-12 px-8">
                                    Escribir por WhatsApp
                                </Button>
                            </a>
                        </div>
                    </div>
                </section>

                {/* ============ FOOTER ============ */}
                <footer className="bg-slate-950 text-slate-400 py-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            <div className="md:col-span-2">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 bg-rose-800 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                                        CR
                                    </div>
                                    <div>
                                        <p className="font-bold text-white leading-tight">Cristo Rey</p>
                                        <p className="text-[10px] uppercase tracking-widest text-slate-500">Funeraria</p>
                                    </div>
                                </div>
                                <p className="text-sm leading-relaxed max-w-sm">
                                    Acompañando a las familias de La Araucanía por más de 30 años. 
                                    Servicio digno, respetuoso y profesional.
                                </p>
                            </div>
                            
                            <div>
                                <h4 className="text-white font-semibold mb-4">Enlaces</h4>
                                <ul className="space-y-2 text-sm">
                                    <li><a href="#servicios" className="hover:text-white transition-colors">Servicios</a></li>
                                    <li><a href="#nosotros" className="hover:text-white transition-colors">Nosotros</a></li>
                                    <li><a href="#sucursales" className="hover:text-white transition-colors">Sucursales</a></li>
                                    <li><Link href="/login" className="hover:text-white transition-colors">Iniciar Sesión</Link></li>
                                </ul>
                            </div>
                            
                            <div>
                                <h4 className="text-white font-semibold mb-4">Contacto</h4>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-center gap-2">
                                        <Phone className="h-4 w-4" /> +56 45 212 3456
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Mail className="h-4 w-4" /> contacto@funerariacristorey.cl
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4" /> Manuel Montt #1991, Temuco
                                    </li>
                                </ul>
                            </div>
                        </div>
                        
                        <div className="border-t border-slate-800 mt-12 pt-6 text-center text-xs">
                            <p>© {new Date().getFullYear()} Funeraria Cristo Rey. Todos los derechos reservados.</p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}