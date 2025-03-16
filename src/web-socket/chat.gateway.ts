import { WebSocketGateway, OnGatewayConnection, OnGatewayDisconnect, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from "@nestjs/websockets";
import { DateOrderedMessages } from "./interfaces/date-ordered-messages.interface";
import { Server, Socket } from "socket.io";

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    rooms: Map<string, Set<{ socketId: string; userId: string }>> = new Map();

    handleConnection(client: Socket) {
        // Lógica de conexión (si es necesario)
    }

    handleDisconnect(client: Socket) {
        // Lógica de desconexión (limpiar la sala, etc.)
    }

    @SubscribeMessage('join_room')
    async handleJoinRoom(
        @MessageBody() data: { citizenBenefitId: string },
        @ConnectedSocket() client: Socket,
    ) {
        const { citizenBenefitId } = data;
        const userId = 'Manuel';

        /**
        * Cosas que deberìan ocurrir:
        * Aquí deberìa de autenticarse la conexión.
        * Identificar al usuario conectado
        * También hacer la búsqueda de citizenBenefitId y si existe, iniciar la sala
        * Si no existe por alguna razón, no se debe de iniciar el chat
        * Para eso está el paso previo a desarrollarse que es a través de API REST
        */

        if (!this.rooms.has(citizenBenefitId)) {
            this.rooms.set(citizenBenefitId, new Set());
        }
        this.rooms.get(citizenBenefitId)!.add({ socketId: client.id, userId });
        client.join(citizenBenefitId);

        /**
        * Aquí se deben de consultar los ùltimos 50 mensajes en orden cronológico y ser enviados
        * al cliente a través del evento emit, voy a crear  una constante para simular esta consulta,
        */

        // Simulación de mensajes iniciales agrupados por fecha
        const initialMessages: DateOrderedMessages[] = [
            {
                date: new Date().toISOString(),
                messages: [
                    { sender: 'system', textContent: 'El estado de tu apoyo es: Por asignar', type: 'notification', timestamp: new Date().toISOString(), },
                    {
                        sender: 'Atención a Migrantes', textContent: 'Bienvenido al inicio de tu apoyo, en unos momentos serás asignado a un servidor público', type: 'text', options: [
                            { title: 'Opción uno', subtitle: 'Asì se verán los chips' },
                            { title: 'Opción dos', subtitle: 'Este es un chip' },
                            { title: 'Opción tres', subtitle: 'Y este es otro' },
                        ],
                        timestamp: new Date().toISOString(),
                    },
                    {
                        sender: 'Atención a Migrantes', textContent: 'Puedes escribir lo que necesites', type: 'text',
                        timestamp: new Date().toISOString(),
                    },
                    {
                        sender: 'Atención a Migrantes', textContent: 'En cuanto se asigne el servidor público, leerá el chat', type: 'text',
                        timestamp: new Date().toISOString(),
                    },
                 /*    {
                        sender: 'Quetzal', textContent: '¡Hola! Soy Quetzal 😊', type: 'text',
                        timestamp: new Date().toISOString(),
                    },
                    {
                        sender: 'Quetzal', textContent: 'Te ayudaré a encontrar lo que necesitas en RUTS', type: 'text',
                        timestamp: new Date().toISOString(),
                    },
                    {
                        sender: 'Quetzal', textContent: '¿Con qué tramite puedo ayudarte hoy?', type: 'text',
                        timestamp: new Date().toISOString(),
                        options: [
                            { title: 'Licencia de conducir', subtitle: 'Secretaría de Transporte' },
                            { title: 'Const. de no Inhabilitación', subtitle: 'Contraloría del estado' },
                            { title: 'Pago de tenencia', subtitle: 'Secretaría de Transporte' },
                        ],
                    }, */
                ]
            }
        ];
        // Emitir mensajes iniciales al cliente que se acaba de conectar
        client.emit('initial_messages', initialMessages);
    }

    @SubscribeMessage('typing')
    handleTyping(client: Socket, payload: { sender: string; typing: boolean }) {
        // Identificamos la sala a la que pertenece el cliente (excluyendo su propio id)
        const roomId = [...client.rooms].find(r => r !== client.id);
        if (roomId) {
            // Reenviamos el evento a todos los demás en la sala
            client.broadcast.to(roomId).emit('typing', payload);
        }
    }

    @SubscribeMessage('message')
    handleMessage(client: Socket, payload: { sender: string; textContent: string }) {
        // Para enviar el mensaje de forma individual, identificamos la sala del cliente
        const roomId = [...client.rooms].find(r => r !== client.id);
        // Se agrega una marca de tiempo para facilitar la agrupación en el front
        const newMessage = { ...payload, timestamp: new Date().toISOString() };
        if (roomId) {
            // Emitimos el mensaje nuevo solo a los miembros de la sala
            this.server.to(roomId).emit('new_message', newMessage);
        }
    }
}