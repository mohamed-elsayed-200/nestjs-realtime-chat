import { CallsService } from './../../../users/platform/calls/calls.service';
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { SocketEmitterService } from '../../services/socket-emitter.service';
import { SocketEvents } from '../../../../common/types/enums';
import { RoomNames } from '../../../../common/utils/room-names';
import { StartCallDto } from './dto/start-call.dto';
import { AcceptCallDto } from './dto/accept-call.dto';
import { RejectCallDto } from './dto/reject-call.dto';
import { JoinCallDto } from './dto/join-call.dto';
import { LeaveCallDto } from './dto/leave-call.dto';
import { EndCallDto } from './dto/end-call.dto';
import { WebrtcOfferDto } from './dto/webrtc-offer.dto';
import { WebrtcAnswerDto } from './dto/webrtc-answer.dto';
import { WebrtcIceCandidateDto } from './dto/webrtcIce-candidate.dto';

@WebSocketGateway({ cors: true })
export class CallsGateway {
  constructor(
    private readonly socketEmitter: SocketEmitterService,
    private readonly callsService: CallsService,
  ) {}

  @SubscribeMessage(SocketEvents.WEBRTC_OFFER)
  async onWebrtcOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: WebrtcOfferDto,
  ) {
    const authUser = client.data.user;

    this.socketEmitter.emitToUser(payload.toUserId, SocketEvents.WEBRTC_OFFER, {
      callId: payload.callId,
      fromUserId: authUser._id,
      sdp: payload.sdp,
    });
  }

  @SubscribeMessage(SocketEvents.WEBRTC_ANSWER)
  async onWebrtcAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: WebrtcAnswerDto,
  ) {
    const authUser = client.data.user;

    this.socketEmitter.emitToUser(
      payload.toUserId,
      SocketEvents.WEBRTC_ANSWER,
      {
        callId: payload.callId,
        fromUserId: authUser._id,
        sdp: payload.sdp,
      },
    );
  }

  @SubscribeMessage(SocketEvents.WEBRTC_ICE_CANDIDATE)
  async onWebrtcIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: WebrtcIceCandidateDto,
  ) {
    const authUser = client.data.user;

    this.socketEmitter.emitToUser(
      payload.toUserId,
      SocketEvents.WEBRTC_ICE_CANDIDATE,
      {
        callId: payload.callId,
        fromUserId: authUser._id,
        candidate: payload.candidate,
      },
    );
  }

  @SubscribeMessage(SocketEvents.CALL_START)
  async onCallStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: StartCallDto,
  ) {
    const authUser = client.data.user;
    try {
      const call = await this.callsService.startCall({ dto, authUser });
      this.socketEmitter.emitToSpace(
        call.space?.toString(),
        SocketEvents.CALL_RINGING,
        call,
        client.id,
      );

      return { success: true, call };
    } catch (err: any) {
      console.log('error', err);

      client.emit('error', {
        event: SocketEvents.CALL_START,
        message: err?.message ?? 'Failed to start call',
      });
      return { success: false, error: err?.message };
    }
  }

  @SubscribeMessage(SocketEvents.CALL_ACCEPT)
  async onCallAccept(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: AcceptCallDto,
  ) {
    const authUser = client.data.user;
    try {
      const call = await this.callsService.acceptCall({ dto, authUser });

      this.socketEmitter.emitToSpace(
        call.space?.toString(),
        SocketEvents.CALL_ACCEPTED,
        call,
        client.id,
      );

      return { success: true, call };
    } catch (err: any) {
      client.emit('error', {
        event: SocketEvents.CALL_ACCEPT,
        message: err?.message ?? 'Failed to accept call',
      });
      return { success: false, error: err?.message };
    }
  }

  @SubscribeMessage(SocketEvents.CALL_REJECT)
  async onCallReject(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: RejectCallDto,
  ) {
    const authUser = client.data.user as string;
    try {
      const { call, systemMessage } = await this.callsService.rejectCall({
        dto,
        authUser,
      });

      this.socketEmitter.emitToSpace(
        call.space?.toString(),
        SocketEvents.CALL_REJECTED,
        call,
        client.id,
      );

      if (systemMessage) {
        this.socketEmitter.emitToSpace(
          call.space?.toString(),
          SocketEvents.MESSAGE_NEW,
          systemMessage,
          client?.id,
        );
      }

      return { success: true, call };
    } catch (err: any) {
      client.emit('error', {
        event: SocketEvents.CALL_REJECT,
        message: err?.message ?? 'Failed to reject call',
      });
      return { success: false, error: err?.message };
    }
  }

  @SubscribeMessage(SocketEvents.CALL_JOIN)
  async onCallJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: JoinCallDto,
  ) {
    const authUser = client.data.user as string;
    try {
      const { call, participant } = await this.callsService.joinCall({
        dto,
        authUser,
      });

      client.join(RoomNames.call(dto.callId));

      this.socketEmitter.emitToSpace(
        call.space?.toString(),
        SocketEvents.CALL_JOINED,
        { call, participant },
        client.id,
      );

      return { success: true, call, participant };
    } catch (err: any) {
      client.emit('error', {
        event: SocketEvents.CALL_JOIN,
        message: err?.message ?? 'Failed to join call',
      });
      return { success: false, error: err?.message };
    }
  }

  @SubscribeMessage(SocketEvents.CALL_LEAVE)
  async onCallLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: LeaveCallDto,
  ) {
    const authUser = client.data.user as string;
    try {
      const result = await this.callsService.leaveCall({ dto, authUser });

      const room = RoomNames.call(dto.callId);

      const event =
        result?.status === 'completed'
          ? SocketEvents.CALL_ENDED
          : SocketEvents.CALL_LEFT;

      this.socketEmitter.emitToSpace(
        result?.space?.toString(),
        event,
        result,
        client.id,
      );

      client.leave(room);

      return { success: true, call: result };
    } catch (err: any) {
      client.emit('error', {
        event: SocketEvents.CALL_LEAVE,
        message: err?.message ?? 'Failed to leave call',
      });
      return { success: false, error: err?.message };
    }
  }

  @SubscribeMessage(SocketEvents.CALL_END)
  async onCallEnd(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: EndCallDto,
  ) {
    const authUser = client.data.user;
    try {
      const { call, systemMessage } = await this.callsService.endCall({
        dto,
        authUser,
      });

      const room = RoomNames.call(dto.callId);

      this.socketEmitter.emitToSpace(
        call.space?.toString(),
        SocketEvents.CALL_ENDED,
        call,
        client.id,
      );

      if (systemMessage) {
        this.socketEmitter.emitToSpace(
          call.space?.toString(),
          SocketEvents.MESSAGE_NEW,
          systemMessage,
          client?.id,
        );
      }

      const sockets = await client.nsp.in(room).fetchSockets();
      sockets.forEach((s) => s.leave(room));

      return { success: true, call };
    } catch (err: any) {
      client.emit('error', {
        event: SocketEvents.CALL_END,
        message: err?.message ?? 'Failed to end call',
      });
      return { success: false, error: err?.message };
    }
  }
}
