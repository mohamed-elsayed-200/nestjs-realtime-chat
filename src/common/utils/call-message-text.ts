import { CallScope, CallStatus, CallType } from '../types/enums';

export function formatCallDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds || 0));
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const mm = mins.toString().padStart(hrs > 0 ? 2 : 1, '0');
  const ss = secs.toString().padStart(2, '0');

  return hrs > 0
    ? `${hrs}:${mins.toString().padStart(2, '0')}:${ss}`
    : `${mm}:${ss}`;
}

interface CallLike {
  type: CallType;
  scope: CallScope;
  status: CallStatus;
  duration?: number;
}

export function buildCallSystemMessageText(call: CallLike): string {
  const isVideo = call.type === CallType.VIDEO;
  const isGroup = call.scope !== CallScope.PRIVATE;
  const kind = isVideo ? 'video call' : 'voice call';
  const groupPrefix = isGroup ? 'Group ' : '';

  switch (call.status) {
    case CallStatus.COMPLETED: {
      const duration = formatCallDuration(call.duration ?? 0);
      if (!call.duration || call.duration <= 0) {
        return isGroup ? `${groupPrefix}call ended` : `Missed ${kind}`;
      }
      return `${groupPrefix}${capitalize(kind)} (${duration})`;
    }

    case CallStatus.REJECTED:
      return isGroup
        ? `${groupPrefix}call declined`
        : `${capitalize(kind)} declined`;

    case CallStatus.MISSED:
      return isGroup ? `${groupPrefix}call missed` : `Missed ${kind}`;

    case CallStatus.FAILED:
      return `${capitalize(kind)} failed`;

    default:
      return `${capitalize(kind)} ended`;
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
