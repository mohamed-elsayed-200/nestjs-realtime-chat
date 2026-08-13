export interface WebrtcAnswerDto {
  callId: string;
  toUserId: string;
  sdp: RTCSessionDescriptionInit;
}
