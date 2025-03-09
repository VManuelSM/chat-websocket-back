import { SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DateOrderedMessages } from './interfaces/date-ordered-messages.interface';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    rooms: Map<string, Set<{ socketId: string; userId: string }>> = new Map();

    handleConnection(client: Socket) {
    }

    handleDisconnect(client: Socket) {
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

        const initialMessages: DateOrderedMessages[] = [
            {
                date: new Date().toISOString(),
                messages: [
                    { sender: 'Humberto Zarco', textContent: 'Gracias por iniciar el apoyo, te estaremos guiando paso a paso', type: 'text' },
                    { sender: 'Humberto Zarco', textContent: 'Por favor, espera a que nuestros moderadores te asignen un servidor público, se te enviará una notificación cuando esto ocurra', type: 'text' },
                    { sender: 'Humberto Zarco', textContent: 'Siéntete libre de enviarnos los mensajes que consideres. En cuanto seas asignado, nuestro servidor público podrá leer toda la conversación', type: 'text' },
                ]
            }
        ]
        client.emit('message', initialMessages);
    }

    @SubscribeMessage('message')
    handleMessage(client: Socket, payload: { sender: string; content: string }) {
        this.server.emit('message', payload);
    }

    @SubscribeMessage('typing')
    handleTyping(client: Socket, payload: { sender: string; typing: boolean }) {
        this.server.emit('typing', payload);
    }
}