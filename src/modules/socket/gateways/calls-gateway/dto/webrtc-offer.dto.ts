export interface WebrtcOfferDto {
  callId: string;
  toUserId: string;
  sdp: RTCSessionDescriptionInit;
}
