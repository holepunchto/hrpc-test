const c = require('compact-encoding')

// A few reusable payloads.
const p = {
  empty: null,
  small: Buffer.from('hi'),
  uintField: c.encode(c.uint, 42) // a one-field struct payload stand-in
}

// Stream flag masks (from bare-rpc/lib/constants.js), pre-combined with the
// direction bit. REQUEST direction = 0x100, RESPONSE direction = 0x200.
const S = {
  reqOpen: 0x101,
  resOpen: 0x201,
  reqData: 0x110,
  resData: 0x210,
  reqEnd: 0x120,
  resEnd: 0x220,
  reqClose: 0x102,
  resClose: 0x202,
  reqCloseErr: 0x182,
  resCloseErr: 0x282,
  reqResume: 0x108,
  resResume: 0x208,
  reqPause: 0x104,
  resPause: 0x204,
  reqDestroy: 0x140,
  resDestroy: 0x240,
  reqDestroyErr: 0x1c0,
  resDestroyErr: 0x2c0
}

const ENVELOPE = [
  // REQUEST (type 1)
  {
    note: 'request unary with payload',
    descriptor: { type: 1, id: 1, command: 0, stream: 0, data: p.small }
  },
  {
    note: 'request unary null payload',
    descriptor: { type: 1, id: 1, command: 0, stream: 0, data: null }
  },
  {
    note: 'request unary zero-length buffer (decodes to empty buffer, not null)',
    descriptor: { type: 1, id: 1, command: 0, stream: 0, data: Buffer.alloc(0) }
  },
  {
    note: 'event (id 0) with payload',
    descriptor: { type: 1, id: 0, command: 3, stream: 0, data: p.small }
  },
  {
    note: 'event (id 0) null payload',
    descriptor: { type: 1, id: 0, command: 3, stream: 0, data: null }
  },
  {
    note: 'request stream-open (stream=0x1, no dataLen field)',
    descriptor: { type: 1, id: 2, command: 1, stream: 0x1, data: null }
  },

  // RESPONSE (type 2)
  {
    note: 'response success with payload',
    descriptor: { type: 2, id: 1, error: null, stream: 0, data: p.small }
  },
  {
    note: 'response success null payload',
    descriptor: { type: 2, id: 1, error: null, stream: 0, data: null }
  },
  {
    note: 'response stream-open (stream=0x1)',
    descriptor: { type: 2, id: 2, error: null, stream: 0x1, data: null }
  },

  // STREAM (type 3) - data frames
  {
    note: 'stream request data',
    descriptor: { type: 3, id: 2, stream: S.reqData, error: null, data: p.small }
  },
  {
    note: 'stream response data',
    descriptor: { type: 3, id: 2, stream: S.resData, error: null, data: p.small }
  },
  // STREAM control frames (no trailing fields)
  {
    note: 'stream request open',
    descriptor: { type: 3, id: 2, stream: S.reqOpen, error: null, data: null }
  },
  {
    note: 'stream response open',
    descriptor: { type: 3, id: 2, stream: S.resOpen, error: null, data: null }
  },
  {
    note: 'stream request end',
    descriptor: { type: 3, id: 2, stream: S.reqEnd, error: null, data: null }
  },
  {
    note: 'stream response end',
    descriptor: { type: 3, id: 2, stream: S.resEnd, error: null, data: null }
  },
  {
    note: 'stream request close',
    descriptor: { type: 3, id: 2, stream: S.reqClose, error: null, data: null }
  },
  {
    note: 'stream request pause',
    descriptor: { type: 3, id: 2, stream: S.reqPause, error: null, data: null }
  },
  {
    note: 'stream request resume',
    descriptor: { type: 3, id: 2, stream: S.reqResume, error: null, data: null }
  },
  {
    note: 'stream request destroy',
    descriptor: { type: 3, id: 2, stream: S.reqDestroy, error: null, data: null }
  },
  // response-direction control frames. Error-bearing stream masks (reqCloseErr/resCloseErr/reqDestroyErr/resDestroyErr) are exercised in the error family (Task 4).
  {
    note: 'stream response close',
    descriptor: { type: 3, id: 2, stream: S.resClose, error: null, data: null }
  },
  {
    note: 'stream response pause',
    descriptor: { type: 3, id: 2, stream: S.resPause, error: null, data: null }
  },
  {
    note: 'stream response resume',
    descriptor: { type: 3, id: 2, stream: S.resResume, error: null, data: null }
  },
  {
    note: 'stream response destroy',
    descriptor: { type: 3, id: 2, stream: S.resDestroy, error: null, data: null }
  }
]

module.exports = { ENVELOPE, S, p }
