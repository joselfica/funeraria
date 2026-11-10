import { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <img
            src="/images/logo-square.png"
            alt="Funeraria Cristo Rey"
            className="h-full w-full object-contain"
        />
    );
}