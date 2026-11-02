import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { router } from '@inertiajs/react';

interface CalendarService {
    id: number;
    code: string;
    title: string;
    start: string;
    end: string | null;
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
        backgroundColor: getEventColor(service.status),
        borderColor: getEventColor(service.status),
        extendedProps: {
            status: service.status,
            status_label: service.status_label,
            client: service.client,
            deceased: service.deceased,
            service_type: service.service_type,
            branch: service.branch,
        },
    }));

    const handleEventClick = (info: any) => {
        const serviceId = info.event.id;
        router.visit(`/services/${serviceId}`);
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
                dayMaxEvents={3}
                eventTimeFormat={{
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

function getEventColor(status: string): string {
    switch (status) {
        case 'accepted': return '#10b981';
        case 'in_progress': return '#3b82f6';
        case 'pending': return '#f59e0b';
        case 'completed': return '#8b5cf6';
        case 'cancelled': return '#ef4444';
        case 'rejected': return '#6b7280';
        default: return '#64748b';
    }
}