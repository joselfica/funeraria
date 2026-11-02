import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Eye, Pencil, Trash2 } from 'lucide-react';

interface Props {
    viewHref?: string;
    editHref?: string;
    onDelete?: () => void;
    extraActions?: React.ReactNode;
    showView?: boolean;
    showEdit?: boolean;
    showDelete?: boolean;
}

export function TableActions({
    viewHref,
    editHref,
    onDelete,
    extraActions,
    showView = true,
    showEdit = true,
    showDelete = true,
}: Props) {
    return (
        <div className="flex items-center justify-end gap-1">
            {extraActions}
            
            {showView && viewHref && (
                <Link href={viewHref}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Ver">
                        <Eye className="h-4 w-4" />
                    </Button>
                </Link>
            )}
            
            {showEdit && editHref && (
                <Link href={editHref}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Editar">
                        <Pencil className="h-4 w-4" />
                    </Button>
                </Link>
            )}
            
            {showDelete && onDelete && (
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" 
                    onClick={onDelete}
                    title="Eliminar"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
}