// Linux terminal simulation stub
export class LinuxSession {
  constructor(config) {}
  send(cmd) { return ''; }
  cmd = '';
}

export function newLinux(config) { return new LinuxSession(config); }
export function linuxQuery(q) { return null; }