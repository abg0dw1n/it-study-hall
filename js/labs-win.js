// Windows terminal simulation stub
export class WinSession {
  constructor(config) {}
  send(cmd) { return ''; }
  cmd = '';
}

export function newWin(config) { return new WinSession(config); }