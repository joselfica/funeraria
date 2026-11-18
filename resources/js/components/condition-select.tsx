import { router } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

export interface ConditionOption {
    value: string;
    label: string;
    color: string; // clases de Tailwind (bg-*, text-*, border-*) que vienen del enum ItemCondition
}

interface Props {
    itemId: number;
    value: string | null;
    conditions: ConditionOption[];
}

/**
 * Selector de estado en forma de "pill" de color para usar dentro de una fila.
 * Al elegir una opción guarda de inmediato (PATCH /inventory/{id}/condition).
 */
export function ConditionSelect({ itemId, value, conditions }: Props) {
    const [saving, setSaving] = useState(false);
    const current = conditions.find((c) => c.value === value);

    const change = (next: string) => {
        if (next === value) return;
        setSaving(true);
        router.patch(
            `/inventory/${itemId}/condition`,
            { condition: next },
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => setSaving(false),
            },
        );
    };

    return (
        <span
            className={`relative inline-flex items-center rounded-full border text-xs font-medium transition-opacity ${
                current?.color ?? 'bg-slate-100 text-slate-800 border-slate-200'
            } ${saving ? 'opacity-60' : ''}`}
        >
            <select
                value={value ?? ''}
                disabled={saving}
                onChange={(e) => change(e.target.value)}
                aria-label="Cambiar estado"
                className="cursor-pointer appearance-none rounded-full bg-transparent py-1 pl-3 pr-7 focus:outline-none focus:ring-2 focus:ring-rose-800/30"
            >
                {!current && <option value="">Sin estado</option>}
                {conditions.map((c) => (
                    <option key={c.value} value={c.value} className="bg-background text-foreground">
                        {c.label}
                    </option>
                ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 h-3 w-3" />
        </span>
    );
}