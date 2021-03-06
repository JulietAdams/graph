"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Decelerate = void 0;
/**
 * deceleration logic is based largely on the excellent [pixi-viewport](https://github.com/davidfig/pixi-viewport)
 * specificially, the [Decelerate Plugin](https://github.com/davidfig/pixi-viewport/blob/eb00aafebca6f9d9233a6b537d7d418616bb866e/src/plugins/decelerate.js)
 */
var Decelerate = /** @class */ (function () {
    function Decelerate(renderer, onContainerDecelerate) {
        var _this = this;
        this.paused = false;
        this.saved = [];
        this.friction = 0.88;
        this.minSpeed = 0.01;
        this.percentChangeX = this.friction;
        this.percentChangeY = this.friction;
        this.down = function () {
            _this.saved = [];
            _this.x = _this.y = undefined;
        };
        this.move = function () {
            if (_this.paused) {
                return;
            }
            _this.saved.push({ x: _this.renderer.x, y: _this.renderer.y, time: performance.now() });
            if (_this.saved.length > 60) {
                _this.saved.splice(0, 30);
            }
        };
        this.up = function () {
            var e_1, _a;
            if (_this.saved.length) {
                var now = performance.now();
                try {
                    for (var _b = __values(_this.saved), _c = _b.next(); !_c.done; _c = _b.next()) {
                        var save = _c.value;
                        if (save.time >= now - 100) {
                            var time = now - save.time;
                            _this.x = (_this.renderer.x - save.x) / time;
                            _this.y = (_this.renderer.y - save.y) / time;
                            _this.percentChangeX = _this.percentChangeY = _this.friction;
                            break;
                        }
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            }
        };
        this.update = function (elapsed) {
            if (_this.paused) {
                return;
            }
            var x;
            var y;
            if (_this.x) {
                x = _this.renderer.x + _this.x * elapsed;
                _this.x *= _this.percentChangeX;
                if (Math.abs(_this.x) < _this.minSpeed) {
                    _this.x = 0;
                }
            }
            if (_this.y) {
                y = _this.renderer.y + _this.y * elapsed;
                _this.y *= _this.percentChangeY;
                if (Math.abs(_this.y) < _this.minSpeed) {
                    _this.y = 0;
                }
            }
            if (x || y) {
                _this.renderer.dragX = x !== null && x !== void 0 ? x : _this.renderer.x;
                _this.renderer.dragY = y !== null && y !== void 0 ? y : _this.renderer.y;
                _this.onContainerDecelerate(x !== null && x !== void 0 ? x : _this.renderer.x, y !== null && y !== void 0 ? y : _this.renderer.y); // TODO - expose this as a more generic function
            }
        };
        this.renderer = renderer;
        this.onContainerDecelerate = onContainerDecelerate;
    }
    Decelerate.prototype.pause = function () {
        this.paused = true;
    };
    Decelerate.prototype.resume = function () {
        this.paused = false;
    };
    return Decelerate;
}());
exports.Decelerate = Decelerate;
//# sourceMappingURL=decelerate.js.map