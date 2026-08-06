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

interface CallParticipant {
  userId: string;
  socketId: string;
  joinedAt: Date;
}

interface ActiveCall {
  callId: string;
  spaceId: string;
  startedBy: string;
  status: 'ongoing' | 'ended';
  participants: Map<string, CallParticipant>;
  startedAt: Date;
}

@WebSocketGateway({ cors: true })
export class CallsGateway {
  private activeCalls = new Map<string, ActiveCall>();
  private spaceCallMap = new Map<string, string>();

  constructor(private readonly socketEmitter: SocketEmitterService) {}

  @SubscribeMessage(SocketEvents.CALL_START)
  async onCallStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: { spaceId: string; callId: string },
  ) {
    const authUser = client.data.user;
    const { spaceId, callId } = dto;

    if (this.spaceCallMap.has(spaceId)) {
      return {
        success: false,
        error: 'There is already an active call in this space',
      };
    }

    const call: ActiveCall = {
      callId,
      spaceId,
      startedBy: authUser._id.toString(),
      status: 'ongoing',
      participants: new Map([
        [
          authUser._id.toString(),
          {
            userId: authUser._id.toString(),
            socketId: client.id,
            joinedAt: new Date(),
          },
        ],
      ]),
      startedAt: new Date(),
    };

    this.activeCalls.set(callId, call);
    this.spaceCallMap.set(spaceId, callId);

    this.socketEmitter.emitToSpace(
      spaceId,
      SocketEvents.CALL_INCOMING,
      {
        callId,
        spaceId,
        startedBy: authUser._id.toString(),
        startedByName: authUser.name,
        startedByAvatar: authUser.avatar,
      },
      client.id,
    );

    return { success: true, callId };
  }

  @SubscribeMessage(SocketEvents.CALL_JOIN)
  async onCallJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: { callId: string },
  ) {
    const authUser = client.data.user;
    const call = this.activeCalls.get(dto.callId);

    if (!call) return { success: false, error: 'Call not found' };
    if (call.status === 'ended')
      return { success: false, error: 'Call has ended' };

    if (call.participants.has(authUser._id.toString())) {
      return { success: true };
    }

    call.participants.set(authUser._id.toString(), {
      userId: authUser._id.toString(),
      socketId: client.id,
      joinedAt: new Date(),
    });

    this.socketEmitter.emitToSpace(
      call.spaceId,
      SocketEvents.CALL_USER_JOINED,
      {
        callId: dto.callId,
        userId: authUser._id.toString(),
        userName: authUser.name,
        userAvatar: authUser.avatar,
      },
      client.id,
    );

    return { success: true };
  }

  @SubscribeMessage(SocketEvents.CALL_LEAVE)
  async onCallLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: { callId: string },
  ) {
    const authUser = client.data.user;
    const call = this.activeCalls.get(dto.callId);

    if (!call) return { success: false, error: 'Call not found' };

    call.participants.delete(authUser._id.toString());

    if (call.participants.size === 0) {
      call.status = 'ended';
      this.spaceCallMap.delete(call.spaceId);

      this.socketEmitter.emitToSpace(call.spaceId, SocketEvents.CALL_ENDED, {
        callId: dto.callId,
        reason: 'ended',
      });

      this.activeCalls.delete(dto.callId);
      return { success: true, ended: true };
    }

    this.socketEmitter.emitToSpace(
      call.spaceId,
      SocketEvents.CALL_USER_LEFT,
      {
        callId: dto.callId,
        userId: authUser._id.toString(),
      },
      client.id,
    );

    return { success: true };
  }

  @SubscribeMessage(SocketEvents.CALL_END)
  async onCallEnd(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: { callId: string },
  ) {
    const call = this.activeCalls.get(dto.callId);
    if (!call) return { success: false, error: 'Call not found' };

    call.status = 'ended';
    this.spaceCallMap.delete(call.spaceId);

    this.socketEmitter.emitToSpace(
      call.spaceId,
      SocketEvents.CALL_ENDED,
      { callId: dto.callId, reason: 'ended' },
      client.id,
    );

    this.activeCalls.delete(dto.callId);
    return { success: true };
  }

  @SubscribeMessage(SocketEvents.CALL_OFFER)
  async onOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    dto: {
      callId: string;
      offer: RTCSessionDescriptionInit;
      targetUserId: string;
    },
  ) {
    const call = this.activeCalls.get(dto.callId);
    if (!call) return { success: false };

    const target = call.participants.get(dto.targetUserId);
    if (target) {
      client.to(target.socketId).emit(SocketEvents.CALL_OFFER, {
        callId: dto.callId,
        offer: dto.offer,
        from: client.data.user._id.toString(),
      });
    }

    return { success: true };
  }

  @SubscribeMessage(SocketEvents.CALL_ANSWER)
  async onAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    dto: {
      callId: string;
      answer: RTCSessionDescriptionInit;
      targetUserId: string;
    },
  ) {
    const call = this.activeCalls.get(dto.callId);
    if (!call) return { success: false };

    const target = call.participants.get(dto.targetUserId);
    if (target) {
      client.to(target.socketId).emit(SocketEvents.CALL_ANSWER, {
        callId: dto.callId,
        answer: dto.answer,
        from: client.data.user._id.toString(),
      });
    }

    return { success: true };
  }

  @SubscribeMessage(SocketEvents.CALL_ICE_CANDIDATE)
  async onIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    dto: {
      callId: string;
      candidate: RTCIceCandidateInit;
      targetUserId: string;
    },
  ) {
    const call = this.activeCalls.get(dto.callId);
    if (!call) return { success: false };

    const target = call.participants.get(dto.targetUserId);
    if (target) {
      client.to(target.socketId).emit(SocketEvents.CALL_ICE_CANDIDATE, {
        callId: dto.callId,
        candidate: dto.candidate,
        from: client.data.user._id.toString(),
      });
    }

    return { success: true };
  }
}
