// T028: Engrave handler enforcing name policy with logging
import {ERRORS} from '../../ws/errors.js';
import {log} from '../../ws/log.js';

const NAME_MAX = 24;
const NAME_PATTERN = /^[\p{L}\p{N}_\-]{1,24}$/u; // simplified pattern vs spec allowing extended set

export interface EngraveMessage {
  type: 'engrave';
  protocol_version: string;
  run_id: string;
  name: string;
}

export function handleEngrave(msg: EngraveMessage, sendError: (err:any)=>void, send: (m:any)=>void) {
  if (msg.name.length === 0 || msg.name.length > NAME_MAX || !NAME_PATTERN.test(msg.name)) {
    log.debug('engrave_invalid_name', {name: msg.name});
    sendError(ERRORS.validation(msg.protocol_version, {field: 'name'}));
    return;
  }
  // In real impl we would update leaderboard; placeholder no-op.
  log.info('engrave_accept', {run_id: msg.run_id, name: msg.name});
  send({type:'engrave', protocol_version: msg.protocol_version, run_id: msg.run_id, name: msg.name});
}