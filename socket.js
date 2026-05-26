let _io = null;

const init = (io) => { _io = io; };

const emit = (event, data) => { if (_io) _io.emit(event, data); };

module.exports = { init, emit };
