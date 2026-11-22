import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { router } from '@inertiajs/react';

type DateStatus = 'past' | 'today' | 'future';

interface CalendarService {
    id: number;
    uuid: string;
    code: string;
    title: string;
    start: string;
    end: string | null;
    date_status: DateStatus;
    status: string;
    status_label: string;
    client: string | null;
    deceased: string | null;
    service_type: string | null;
    branch: string | null;
}

interface Props {
    services: CalendarService[];
}

export default function ServicesCalendar({ services }: Props) {
    // Convertir los servicios a formato de eventos de FullCalendar
    const events = services.map((service) => ({
        id: String(service.id),
        title: service.title,
        start: service.start,      // Solo la fecha de inicio
        // end: service.end,       // ← COMENTADO: No pasar el fin en vista mensual
        allDay: false,
        // El color depende de si el sepelio es pasado, de hoy o futuro
        backgroundColor: DATE_STATUS_COLORS[service.date_status].bg,
        borderColor: DATE_STATUS_COLORS[service.date_status].border,
        textColor: DATE_STATUS_COLORS[service.date_status].text,
        extendedProps: {
            date_status: service.date_status,
            uuid: service.uuid,
            status: service.status,
            status_label: service.status_label,
            client: service.client,
            deceased: service.deceased,
            service_type: service.service_type,
            branch: service.branch,
        },
    }));

    const handleEventClick = (info: any) => {
        const serviceUuid = info.event.extendedProps.uuid;
        router.visit(`/services/${serviceUuid}`);
    };

    return (
        <div className="services-calendar">
            <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                locale="es"
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth',
                }}
                buttonText={{
                    today: 'Hoy',
                    month: 'Mes',
                }}
                events={events}
                eventClick={handleEventClick}
                height="auto"
                eventDisplay="block"
                displayEventTime={false}
                dayMaxEvents={3}                eventTimeFormat={{
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                }}
                eventContent={(eventInfo) => {
                    return (
                        <div className="p-1 text-xs overflow-hidden">
                            <div className="font-semibold truncate">
                                {eventInfo.event.title}
                            </div>
                        </div>
                    );
                }}
            />
        </div>
    );
}

/**
 * Colores de los eventos según la fecha.
 * Para cambiarlos, basta con editar estos tres valores
 * (conviene mantenerlos iguales a la leyenda del dashboard).
 */
const DATE_STATUS_COLORS: Record<DateStatus, { bg: string; border: string; text: string }> = {
    past: { bg: '#94a3b8', border: '#94a3b8', text: '#ffffff' },    // Gris (pasado)
    today: { bg: '#f59e0b', border: '#d97706', text: '#ffffff' },   // Ámbar (hoy)
    future: { bg: '#0ea5e9', border: '#0ea5e9', text: '#ffffff' },  // Celeste (próximos)
};