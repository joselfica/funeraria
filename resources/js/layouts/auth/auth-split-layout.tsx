import AppLogoIcon from '@/components/app-logo-icon';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    title?: string;
    description?: string;
}

export default function AuthLayout({
    children,
    title,
    description,
}: PropsWithChildren<AuthLayoutProps>) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
            <div className="w-full max-w-md">
                
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="h-16 w-16">
                            <AppLogoIcon />
                        </div>
                    </Link>
                    <h1 className="text-2xl font-bold mt-4">Funeraria Cristo Rey</h1>
                    <p className="text-sm text-muted-foreground">Sistema de Gestión</p>
                </div>

                {/* Title/Description */}
                {title && <h2 className="text-xl font-semibold text-center mb-2">{title}</h2>}
                {description && <p className="text-sm text-muted-foreground text-center mb-6">{description}</p>}

                {/* Form */}
                {children}
            </div>
        </div>
    );
}