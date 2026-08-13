export interface WebrtcIceCandidateDto {
  callId: string;
  toUserId: string;
  candidate: RTCIceCandidateInit;
}
