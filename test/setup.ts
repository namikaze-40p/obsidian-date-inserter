// vanillajs-datepicker calls EventTarget.prototype.addEventListener with window as `this`. In
// Vitest, window is the Node global, whose own addEventListener is bound to the real DOM window.
const { addEventListener, removeEventListener } = EventTarget.prototype;

EventTarget.prototype.addEventListener = function (this: EventTarget, ...args) {
  (this === globalThis ? window.addEventListener : addEventListener.bind(this))(...args);
};
EventTarget.prototype.removeEventListener = function (this: EventTarget, ...args) {
  (this === globalThis ? window.removeEventListener : removeEventListener.bind(this))(...args);
};

export {};
