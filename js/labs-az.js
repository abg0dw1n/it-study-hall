// Azure portal simulation stub
export class AzSession {
  constructor(config) {}
  send(cmd) { return ''; }
  cmd = '';
}

export function newAz(config) { return new AzSession(config); }