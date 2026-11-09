import { Link } from '@inertiajs/react';
import { dashboard } from '@/routes';

export function AppLogo() {
    return (
        <Link href={dashboard()} prefetch className="flex items-center gap-2 overflow-hidden">
            <img
                src="/images/logo-square.png"
                alt="Funeraria Cristo Rey"
                className="h-9 w-9 rounded-full object-cover shrink-0"
                onError={(e) => {
                    // Fallback si no carga la imagen
                    e.currentTarget.style.display = 'none';
                }}
            />
            <div className="flex flex-col leading-tight">
                <span className="font-bold text-xs whitespace-nowrap">
                    Funeraria
                </span>
                <span className="font-bold text-xs whitespace-nowrap text-primary">
                    Cristo Rey
                </span>
            </div>
        </Link>
    );
}

export default AppLogo;