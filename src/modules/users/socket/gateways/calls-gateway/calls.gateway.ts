import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { StartCallDto } from './dto/start-call.dto';
import { AcceptCallDto } from './dto/accept-call.dto';
import { RejectCallDto } from './dto/reject-call.dto';
import { JoinCallDto } from './dto/join-call.dto';
import { LeaveCallDto } from './dto/leave-call.dto';
import { EndCallDto } from './dto/end-call.dto';
import { WebrtcOfferDto } from './dto/webrtc-offer.dto';
import { WebrtcAnswerDto } from './dto/webrtc-answer.dto';
import { WebrtcIceCandidateDto } from './dto/webrtcIce-candidate.dto';
import { ToggleMuteDto } from './dto/toggle-mute.dto';
import { CallsService } from '../../../platform/calls/calls.service';
import { CallStatus, SocketEvents } from '../../../../../common/types/enums';
import { SocketEmitterService } from '../../services/socket-emitter.service';
import { RoomNames } from '../../../../../common/utils/room-names';
import { ToggleRaiseHandDto } from './dto/toggle-raise-hand.dto';
import { UpdateCallSettingsDto } from './dto/update-call-settings.dto';

@WebSocketGateway()
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
    client.join(RoomNames.call(payload.callId));
    this.socketEmitter.emitToCall(
      payload.callId,
      SocketEvents.WEBRTC_OFFER,
      {
        callId: payload.callId,
        fromUserId: authUser._id,
        sdp: payload.sdp,
      },
      client.id,
    );
  }

  @SubscribeMessage(SocketEvents.WEBRTC_ANSWER)
  async onWebrtcAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: WebrtcAnswerDto,
  ) {
    const authUser = client.data.user;
    client.join(RoomNames.call(payload.callId));
    this.socketEmitter.emitToCall(
      payload.callId,
      SocketEvents.WEBRTC_ANSWER,
      {
        callId: payload.callId,
        fromUserId: authUser._id,
        sdp: payload.sdp,
      },
      client.id,
    );
  }

  @SubscribeMessage(SocketEvents.WEBRTC_ICE_CANDIDATE)
  async onWebrtcIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: WebrtcIceCandidateDto,
  ) {
    const authUser = client.data.user;
    client.join(RoomNames.call(payload.callId));
    this.socketEmitter.emitToCall(
      payload.callId,
      SocketEvents.WEBRTC_ICE_CANDIDATE,
      {
        callId: payload.callId,
        fromUserId: authUser._id,
        candidate: payload.candidate,
      },
      client.id,
    );
  }

  @SubscribeMessage(SocketEvents.SCREEN_SHARE_STARTED)
  async onScreenShareStarted(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { callId: string; toUserId: string },
  ) {
    const authUser = client.data.user;
    client.join(RoomNames.call(payload.callId));
    this.socketEmitter.emitToCall(
      payload.callId,
      SocketEvents.SCREEN_SHARE_STARTED,
      {
        callId: payload.callId,
        fromUserId: authUser._id,
      },
    );
  }

  @SubscribeMessage(SocketEvents.SCREEN_SHARE_STOPPED)
  async onScreenShareStopped(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { callId: string; toUserId: string },
  ) {
    const authUser = client.data.user;
    client.join(RoomNames.call(payload.callId));
    this.socketEmitter.emitToCall(
      payload.callId,
      SocketEvents.SCREEN_SHARE_STOPPED,
      {
        callId: payload.callId,
        fromUserId: authUser._id,
      },
      client.id,
    );
  }

  @SubscribeMessage(SocketEvents.CALL_START)
  async onCallStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: StartCallDto,
  ) {
    const authUser = client.data.user;
    try {
      const { call, participant } = await this.callsService.startCall({
        dto,
        authUser,
      });

      client.join(RoomNames.call(call.id));

      if (
        call.status === CallStatus.IN_PROGRESS &&
        call.participantsCount > 1
      ) {
        this.socketEmitter.emitToCall(
          call.id?.toString(),
          SocketEvents.CALL_JOINED,
          { call, participant },
          client.id,
        );
      }

      this.socketEmitter.emitToSpace(
        call.space?.toString(),
        SocketEvents.CALL_RINGING,
        { call, participant },
        client.id,
      );

      return { success: true, call, participant };
    } catch (err: any) {
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
      const { call, participant } = await this.callsService.acceptCall({
        dto,
        authUser,
      });

      client.join(RoomNames.call(dto.callId));

      this.socketEmitter.emitToSpace(
        call.space?.toString(),
        SocketEvents.CALL_ACCEPTED,
        { call, participant },
        client.id,
      );

      return { success: true, call, participant };
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
    const authUser = client.data.user;
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

      return { success: true, call, systemMessage };
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
    const authUser = client.data.user;
    try {
      const { call, participant } = await this.callsService.joinCall({
        dto,
        authUser,
      });

      client.join(RoomNames.call(dto.callId));

      this.socketEmitter.emitToCall(
        call.id?.toString(),
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
    const authUser = client.data.user;
    try {
      const { call, systemMessage, participant, participants } =
        await this.callsService.leaveCall({
          dto,
          authUser,
        });

      client.join(RoomNames.call(dto.callId));

      const room = RoomNames.call(dto.callId);

      const event =
        call?.status === CallStatus.COMPLETED ||
        call?.status === CallStatus.MISSED
          ? SocketEvents.CALL_ENDED
          : SocketEvents.CALL_LEFT;

      this.socketEmitter.emitToCall(
        call?.id?.toString(),
        event,
        { call, participant },
        client.id,
      );

      if (systemMessage) {
        this.socketEmitter.emitToSpace(
          call.space?.toString(),
          SocketEvents.MESSAGE_NEW,
          systemMessage,
          client.id,
        );
      }

      client.leave(room);

      return { success: true, call, participant, participants };
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
      const { call, systemMessage, participants } =
        await this.callsService.endCall({
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

      return { success: true, call, systemMessage, participants };
    } catch (err: any) {
      client.emit('error', {
        event: SocketEvents.CALL_END,
        message: err?.message ?? 'Failed to end call',
      });
      return { success: false, error: err?.message };
    }
  }

  @SubscribeMessage(SocketEvents.CALL_TOGGLE_MUTE)
  async onToggleMute(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: ToggleMuteDto,
  ) {
    const authUser = client.data.user;
    try {
      const result = await this.callsService.toggleParticipantMute({
        dto,
        authUser,
      });

      client.join(RoomNames.call(dto.callId));

      this.socketEmitter.emitToCall(
        result?.call.id?.toString(),
        SocketEvents.CALL_JOINED,
        result,
        client.id,
      );

      return { success: true, ...result };
    } catch (err: any) {
      client.emit('error', {
        event: SocketEvents.CALL_TOGGLE_MUTE,
        message: err?.message ?? 'Failed to toggle mute',
      });
      return { success: false, error: err?.message };
    }
  }

  @SubscribeMessage(SocketEvents.CALL_TOGGLE_RAISE_HAND)
  async onToggleRaiseHand(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: ToggleRaiseHandDto,
  ) {
    const authUser = client.data.user;
    try {
      const { call, participant } = await this.callsService.toggleRaiseHand({
        dto,
        authUser,
      });

      client.join(RoomNames.call(dto.callId));

      this.socketEmitter.emitToCall(
        call?.id?.toString(),
        SocketEvents.CALL_PARTICIPANT_UPDATED,
        {
          call,
          participant,
          targetUserId: participant.user?.toString?.(),
        },
        client.id,
      );

      return {
        success: true,
        call,
        participant,
        targetUserId: participant.user?.toString?.(),
      };
    } catch (err: any) {
      client.emit('error', {
        event: SocketEvents.CALL_TOGGLE_RAISE_HAND,
        message: err?.message ?? 'Failed to toggle raise hand',
      });
      return { success: false, error: err?.message };
    }
  }

  @SubscribeMessage(SocketEvents.CALL_UPDATE_SETTINGS)
  async onUpdateCallSettings(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: UpdateCallSettingsDto,
  ) {
    const authUser = client.data.user;
    try {
      const result = await this.callsService.updateCallSettings({
        dto,
        authUser,
      });

      client.join(RoomNames.call(dto.callId));

      this.socketEmitter.emitToSpace(
        result.spaceId,
        SocketEvents.CALL_SETTINGS_UPDATED,
        result,
        client.id,
      );

      return { success: true, ...result };
    } catch (err: any) {
      client.emit('error', {
        event: SocketEvents.CALL_UPDATE_SETTINGS,
        message: err?.message ?? 'Failed to update call settings',
      });
      return { success: false, error: err?.message };
    }
  }
}
