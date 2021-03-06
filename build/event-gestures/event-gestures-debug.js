YUI.add('event-flick', function(Y) {

// TODO: Better way to sniff 'n' switch touch support?
var EVENT = ("ontouchstart" in Y.config.win) ? {
        start: "touchstart",
        end: "touchend"
    } : {
        start: "mousedown",
        end: "mouseup"
    },

    START = "start",
    END = "end",

    OWNER_DOCUMENT = "ownerDocument",
    MIN_VELOCITY = "minVelocity",
    MIN_DISTANCE = "minDistance",

    _FLICK_START = "_fs",
    _FLICK_START_HANDLE = "_fsh",
    _FLICK_END_HANDLE = "_feh",

    NODE_TYPE = "nodeType";

Y.Event.define('flick', {

    init: function (node, subscriber, ce) {

        var startHandle = node.on(EVENT[START],
            Y.bind(this._onStart, this),
            null, // Don't want stuff mixed into the facade
            node,
            subscriber, 
            ce);
 
        node.setData(_FLICK_START_HANDLE, startHandle);
    },

    destroy: function (node, subscriber, ce) {

        var startHandle = node.getData(_FLICK_START_HANDLE),
            endHandle = node.getData(_FLICK_END_HANDLE);

        if (startHandle) {
            startHandle.detach();
            node.clearData(_FLICK_START_HANDLE);
        }

        if (endHandle) {
            endHandle.detach();
            node.clearData(_FLICK_END_HANDLE);
        }
    },

    processArgs: function(args) {
        var params = (args[3]) ? args.splice(3, 1) : {};

        if (!(MIN_VELOCITY in params)) {
            params.minVelocity = this.MIN_VELOCITY;
        }

        if (!(MIN_DISTANCE in params)) {
            params.minDistance = this.MIN_DISTANCE;
        }

        Y.log("flick, processArgs : minDistance =" + params.minDistance + ", minVelocity =" + params.minVelocity);

        return params;
    },

    _onStart: function(e, node, subscriber, ce) {

        var start = true, // always true for mouse
            endHandle,
            doc; 

        if (e.touches) {
            start = (e.touches.length === 1);
            e = e.touches[0];
        }

        if (start) {

            e.preventDefault();

            node.setData(_FLICK_START, {
                time : new Date().getTime(),
                pageX: e.pageX, 
                pageY: e.pageY,
                clientX: e.clientX, 
                clientY: e.clientY,
                _e : e
            });

            endHandle = node.getData(_FLICK_END_HANDLE);

            if (!endHandle) {
                doc = (node.get(NODE_TYPE) === 9) ? node : node.get(OWNER_DOCUMENT);

                endHandle = doc.on(EVENT[END], Y.bind(this._onEnd, this), null, node, subscriber, ce);
                node.setData(_FLICK_END_HANDLE,endHandle);
            }
        }
    },

    _onEnd: function(e, node, subscriber, ce) {

        var endTime = new Date().getTime(),
            valid = node.getData(_FLICK_START),
            start = valid,
            endEvent = e,

            startTime,
            time,
            params,
            xyDistance, 
            distance,
            absDistance,
            velocity, 
            axis;
            
        if (valid) {

            if (e.changedTouches) {
                if (e.changedTouches.length === 1 && e.touches.length === 0) {
                    endEvent = e.changedTouches[0];
                } else {
                    valid = false;
                }
            }

            if (valid) {

                startTime = start.time;
                endTime = new Date().getTime();
                time = endTime - startTime;

                params = subscriber._extra;

                xyDistance = [
                    endEvent.pageX - start.pageX,
                    endEvent.pageY - start.pageY
                ];

                axis = params.axis || (Math.abs(xyDistance[0]) >= Math.abs(xyDistance[1])) ? 'x' : 'y';

                distance = xyDistance[(axis === 'x') ? 0 : 1];
                absDistance = Math.abs(distance); 
                velocity = absDistance/time;

                if (isFinite(velocity) && velocity >= params.minVelocity && absDistance >= params.minDistance) {
                    ce.fire({
                        distance:distance,
                        time:time,
                        velocity:velocity,
                        axis:axis,
                        button: e.button,
                        start: start,
                        end : {
                            time: endTime,
                            clientX: endEvent.clientX, 
                            clientY: endEvent.clientY,
                            pageX: endEvent.pageX,
                            pageY: endEvent.pageY,
                            _e : e 
                        }
                    });
                }

                node.clearData(_FLICK_START);
            }
        }
    },

    MIN_VELOCITY : 0,
    MIN_DISTANCE : 10
});


}, '@VERSION@' ,{requires:['node-base','event-touch','event-synthetic']});
YUI.add('event-move', function(Y) {

// TODO: Better way to sniff 'n' switch touch support?

var EVENT = ("ontouchstart" in Y.config.win) ? {
        start: "touchstart",
        move: "touchmove",
        end: "touchend"
    } : {
        start: "mousedown",
        move: "mousemove",
        end: "mouseup"
    },

    START = "start",
    MOVE = "move",
    END = "end",

    _MOVE_START_HANDLE = "_msh",
    _MOVE_HANDLE = "_mh",
    _MOVE_END_HANDLE = "_meh",

    _MOVE_START = "_ms",
    _MOVE = "_m",

    MIN_TIME = "minTime",
    MIN_DISTANCE = "minDistance",
    OWNER_DOCUMENT = "ownerDocument",

    NODE_TYPE = "nodeType",

    PUB_CFG = {
        emitFacade:false
    },

    // TODO: Should this be in SynthEvent as the default?
    _defArgsProcessor = function(args) {
        return args[3] ? args.splice(3,1)[0] : {};
    },

    _getRoot = function(node, subscriber) {
        return subscriber._extra.root || (node.get(NODE_TYPE) === 9) ? node : node.get(OWNER_DOCUMENT);
    },

    define = Y.Event.define;

define('movestart', {

    init: function (node, subscriber, ce) {

        node.setData(_MOVE_START_HANDLE, node.on(EVENT[START], 
            this._onStart, 
            null,
            node,
            subscriber, 
            ce));

    },

    destroy: function (node, subscriber, ce) {
        var startHandle = node.getData(_MOVE_START_HANDLE);

        if (startHandle) {
            startHandle.detach();
            node.clearData(_MOVE_START_HANDLE);
        }
    },

    processArgs : function(args) {
        var params = _defArgsProcessor(args);

        if (!(MIN_TIME in params)) {
            params[MIN_TIME] = this.MIN_TIME;
        }

        if (!(MIN_DISTANCE in params)) {
            params[MIN_DISTANCE] = this.MIN_DISTANCE;
        }

        return params;
    },

    publishConfig: PUB_CFG,

    _onStart : function(e, node, subscriber, ce) {

        e.preventDefault();

        var start = true,
            origE = e; // always true for mouse

        if (e.touches) {
            start = (e.touches.length === 1);
            e = e.touches[0];

            e.target = e.target || origE.target;
            e.currentTarget = e.currentTarget || origE.currentTarget;
        }

        if (start) {
            e.type = "movestart";
            node.setData(_MOVE_START, e);
            ce.fire(e);
        }
    },

    MIN_TIME : 0,
    MIN_DISTANCE : 3
});

define('move', {

    init : function (node, subscriber, ce) {

        var root = _getRoot(node, subscriber),

            moveHandle = root.on(EVENT[MOVE], 
                Y.bind(this._onMove, this),
                null,
                node,
                subscriber,
                ce);

        node.setData(_MOVE_HANDLE, moveHandle);
    },

    processArgs : _defArgsProcessor,

    destroy : function (node, subscriber, ce) {
        var moveHandle = node.getData(_MOVE_HANDLE);

        if (moveHandle) {
            moveHandle.detach();
            node.clearData(_MOVE_HANDLE);
        }
    },

    publishConfig : PUB_CFG,

    _onMove : function(e, node, subscriber, ce) {

        var move = subscriber._extra.standAlone || node.getData(_MOVE_START),
            origE = e;

        if (move) {

            if (e.touches) {
                move = (e.touches.length === 1);
                e = e.touches[0];

                e.target = e.target || origE.target;
                e.currentTarget = e.currentTarget || origE.currentTarget;
            }

            if (move) {
                origE.preventDefault();

                e.type = "move";
                node.setData(_MOVE, e);
                ce.fire(e);
            }
        }
    }
});

define('moveend', {

    init : function (node, subscriber, ce) {

        var root = _getRoot(node, subscriber),

            endHandle = root.on(EVENT[END], 
                Y.bind(this._onEnd, this), 
                null,
                node,
                subscriber, 
                ce);

        node.setData(_MOVE_END_HANDLE, endHandle);
    },

    processArgs : _defArgsProcessor,

    destroy : function (node, subscriber, ce) {
        var endHandle = node.getData(_MOVE_END_HANDLE);
    
        if (endHandle) {
            endHandle.detach();
            node.clearData(_MOVE_END_HANDLE);
        }
    },

    publishConfig : PUB_CFG,

    _onEnd : function(e, node, subscriber, ce) {

        var moveEnd = subscriber._extra.standAlone || node.getData(_MOVE) || node.getData(_MOVE_START),
            origE = e;

        if (moveEnd) {

            if (e.changedTouches) {
                if (e.changedTouches.length === 1) {
                    e = e.changedTouches[0];

                    e.target = e.target || origE.target;
                    e.currentTarget = e.currentTarget || origE.currentTarget;
                    
                } else {
                    moveEnd = false;
                }
            }

            if (moveEnd) {
                origE.preventDefault();
                e.type = "moveend";

                node.clearData(_MOVE_START);
                node.clearData(_MOVE);

                ce.fire(e);
            }
        }
    }
});


}, '@VERSION@' ,{requires:['node-base','event-touch','event-synthetic']});


YUI.add('event-gestures', function(Y){}, '@VERSION@' ,{use:['event-flick', 'event-move']});

