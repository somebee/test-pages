
// ../imba/src/imba/scheduler.imba
function iter$(a) {
  let v;
  return a ? (v = a.toIterable) ? v.call(a) : a : [];
}
var sys$1 = Symbol.for("#init");
var sys$2 = Symbol.for("#schedule");
var sys$3 = Symbol.for("#frames");
var sys$4 = Symbol.for("#interval");
var sys$5 = Symbol.for("#stage");
var sys$6 = Symbol.for("#scheduled");
var sys$7 = Symbol.for("#fps");
var sys$8 = Symbol.for("#ticker");
var rAF = globalThis.requestAnimationFrame || function(blk) {
  return setTimeout1(blk, 1e3 / 60);
};
var SPF = 1 / 60;
var Scheduled = class {
  constructor($$ = null) {
    this[sys$1]($$);
  }
  [sys$1]($$ = null) {
    var $0$1;
    this.owner = $$ && ($0$1 = $$.owner) !== void 0 ? $0$1 : null;
    this.target = $$ && ($0$1 = $$.target) !== void 0 ? $0$1 : null;
    this.active = $$ && ($0$1 = $$.active) !== void 0 ? $0$1 : false;
    this.value = $$ && ($0$1 = $$.value) !== void 0 ? $0$1 : void 0;
    this.skip = $$ && ($0$1 = $$.skip) !== void 0 ? $0$1 : 0;
    this.last = $$ && ($0$1 = $$.last) !== void 0 ? $0$1 : 0;
  }
  tick(scheduler2) {
    this.last = this.owner[sys$3];
    this.target.tick(this.owner);
    return 1;
  }
  update(o, isActivate) {
    let on = this.active;
    let val = o.value;
    let changed = this.value != val;
    if (changed) {
      this.deactivate();
      this.value = val;
    }
    ;
    if (this.value || on || isActivate) {
      this.activate();
    }
    ;
    return this;
  }
  queue() {
    this.owner.add(this);
    return;
  }
  activate() {
    if (this.value === true) {
      this.owner.on("commit", this);
    } else if (this.value === false) {
      true;
    } else if (typeof this.value == "number") {
      let tock = this.value / (1e3 / 60);
      if (tock <= 2) {
        this.owner.on("raf", this);
      } else {
        this[sys$4] = globalThis.setInterval(this.queue.bind(this), this.value);
      }
      ;
    }
    ;
    this.active = true;
    return this;
  }
  deactivate() {
    if (this.value === true) {
      this.owner.un("commit", this);
    }
    ;
    this.owner.un("raf", this);
    if (this[sys$4]) {
      globalThis.clearInterval(this[sys$4]);
      this[sys$4] = null;
    }
    ;
    this.active = false;
    return this;
  }
};
var Scheduler = class {
  constructor() {
    var self = this;
    this.id = Symbol();
    this.queue = [];
    this.stage = -1;
    this[sys$5] = -1;
    this[sys$3] = 0;
    this[sys$6] = false;
    this.listeners = {};
    this.intervals = {};
    this.commit = function() {
      self.add("commit");
      return self;
    };
    this[sys$7] = 0;
    this.$promise = null;
    this.$resolve = null;
    this[sys$8] = function(e) {
      self[sys$6] = false;
      return self.tick(e);
    };
    this;
  }
  add(item, force) {
    if (force || this.queue.indexOf(item) == -1) {
      this.queue.push(item);
    }
    ;
    if (!this[sys$6]) {
      this[sys$2]();
    }
    ;
    return this;
  }
  listen(ns, item) {
    let set = this.listeners[ns];
    let first = !set;
    set || (set = this.listeners[ns] = new Set());
    set.add(item);
    if (ns == "raf" && first) {
      this.add("raf");
    }
    ;
    return this;
  }
  unlisten(ns, item) {
    var $0$2;
    let set = this.listeners[ns];
    set && set.delete(item);
    if (ns == "raf" && set && set.size == 0) {
      $0$2 = this.listeners.raf, delete this.listeners.raf, $0$2;
    }
    ;
    return this;
  }
  on(ns, item) {
    return this.listen(ns, item);
  }
  un(ns, item) {
    return this.unlisten(ns, item);
  }
  get promise() {
    var self = this;
    return this.$promise || (this.$promise = new Promise(function(resolve) {
      return self.$resolve = resolve;
    }));
  }
  tick(timestamp) {
    var self = this;
    let items = this.queue;
    let frame = this[sys$3]++;
    if (!this.ts) {
      this.ts = timestamp;
    }
    ;
    this.dt = timestamp - this.ts;
    this.ts = timestamp;
    this.queue = [];
    this[sys$5] = 1;
    if (items.length) {
      for (let i = 0, sys$92 = iter$(items), sys$102 = sys$92.length; i < sys$102; i++) {
        let item = sys$92[i];
        if (typeof item === "string" && this.listeners[item]) {
          this.listeners[item].forEach(function(item2) {
            if (item2.tick instanceof Function) {
              return item2.tick(self);
            } else if (item2 instanceof Function) {
              return item2(self);
            }
            ;
          });
        } else if (item instanceof Function) {
          item(this.dt, this);
        } else if (item.tick) {
          item.tick(this.dt, this);
        }
        ;
      }
      ;
    }
    ;
    this[sys$5] = this[sys$6] ? 0 : -1;
    if (this.$promise) {
      this.$resolve(this);
      this.$promise = this.$resolve = null;
    }
    ;
    if (this.listeners.raf && true) {
      this.add("raf");
    }
    ;
    return this;
  }
  [sys$2]() {
    if (!this[sys$6]) {
      this[sys$6] = true;
      if (this[sys$5] == -1) {
        this[sys$5] = 0;
      }
      ;
      rAF(this[sys$8]);
    }
    ;
    return this;
  }
  schedule(item, o) {
    var $0$3, $0$4;
    o || (o = item[$0$3 = this.id] || (item[$0$3] = {value: true}));
    let state = o[$0$4 = this.id] || (o[$0$4] = new Scheduled({owner: this, target: item}));
    return state.update(o, true);
  }
  unschedule(item, o = {}) {
    o || (o = item[this.id]);
    let state = o && o[this.id];
    if (state && state.active) {
      state.deactivate();
    }
    ;
    return this;
  }
};
var scheduler = new Scheduler();
function commit() {
  return scheduler.add("commit").promise;
}
function setTimeout(fn, ms) {
  return globalThis.setTimeout(function() {
    fn();
    commit();
    return;
  }, ms);
}
function setInterval(fn, ms) {
  return globalThis.setInterval(function() {
    fn();
    commit();
    return;
  }, ms);
}
var clearInterval = globalThis.clearInterval;
var clearTimeout = globalThis.clearTimeout;
var instance = globalThis.imba || (globalThis.imba = {});
instance.commit = commit;
instance.setTimeout = setTimeout;
instance.setInterval = setInterval;
instance.clearInterval = clearInterval;
instance.clearTimeout = clearTimeout;

// ../imba/src/imba/manifest.web.imba
var Manifest = class {
  constructor() {
    this.data = {};
  }
};
var manifest = new Manifest();

// ../imba/src/imba/asset.imba
var sys$12 = Symbol.for("#init");
var sys$62 = Symbol.for("#asset");
var AssetProxy = class {
  static wrap(meta) {
    let handler = new AssetProxy(meta);
    return new Proxy(handler, handler);
  }
  constructor(meta) {
    this.meta = meta;
  }
  get input() {
    return manifest.inputs[this.meta.input];
  }
  get asset() {
    return globalThis._MF_ ? this.meta : this.input.asset;
  }
  set(target, key, value) {
    return true;
  }
  get(target, key) {
    if (this.meta.meta && this.meta.meta[key] != void 0) {
      return this.meta.meta[key];
    }
    ;
    if (key == "absPath" && !this.asset.absPath) {
      return this.asset.url;
    }
    ;
    return this.asset[key];
  }
};
var SVGAsset = class {
  constructor($$ = null) {
    this[sys$12]($$);
  }
  [sys$12]($$ = null) {
    this.url = $$ ? $$.url : void 0;
    this.meta = $$ ? $$.meta : void 0;
  }
  adoptNode(node) {
    var _a;
    if ((_a = this.meta) == null ? void 0 : _a.content) {
      for (let sys$45 = this.meta.attributes, sys$24 = 0, sys$34 = Object.keys(sys$45), sys$53 = sys$34.length, k, v; sys$24 < sys$53; sys$24++) {
        k = sys$34[sys$24];
        v = sys$45[k];
        node.setAttribute(k, v);
      }
      ;
      node.innerHTML = this.meta.content;
    }
    ;
    return this;
  }
  toString() {
    return this.url;
  }
  toStyleString() {
    return "url(" + this.url + ")";
  }
};
function asset(data) {
  var $0$1, $0$2;
  if (data[sys$62]) {
    return data[sys$62];
  }
  ;
  if (data.type == "svg") {
    return data[sys$62] || (data[sys$62] = new SVGAsset(data));
  }
  ;
  if (data.input) {
    let extra = globalThis._MF_ && globalThis._MF_[data.input];
    if (extra) {
      Object.assign(data, extra);
      data.toString = function() {
        return this.absPath;
      };
    }
    ;
    return data[sys$62] || (data[sys$62] = AssetProxy.wrap(data));
  }
  ;
  return data;
}

// ../imba/src/imba/dom/flags.imba
var Flags = class {
  constructor(dom) {
    this.dom = dom;
    this.string = "";
  }
  contains(ref) {
    return this.dom.classList.contains(ref);
  }
  add(ref) {
    if (this.contains(ref)) {
      return this;
    }
    ;
    this.string += (this.string ? " " : "") + ref;
    this.dom.classList.add(ref);
    return this;
  }
  remove(ref) {
    if (!this.contains(ref)) {
      return this;
    }
    ;
    let regex = new RegExp("(^|\\s)*" + ref + "(\\s|$)*", "g");
    this.string = this.string.replace(regex, "");
    this.dom.classList.remove(ref);
    return this;
  }
  toggle(ref, bool) {
    if (bool === void 0) {
      bool = !this.contains(ref);
    }
    ;
    return bool ? this.add(ref) : this.remove(ref);
  }
  incr(ref) {
    let m = this.stacks || (this.stacks = {});
    let c = m[ref] || 0;
    if (c < 1) {
      this.add(ref);
    }
    ;
    return m[ref] = Math.max(c, 0) + 1;
  }
  decr(ref) {
    let m = this.stacks || (this.stacks = {});
    let c = m[ref] || 0;
    if (c == 1) {
      this.remove(ref);
    }
    ;
    return m[ref] = Math.max(c, 1) - 1;
  }
  valueOf() {
    return this.string;
  }
  toString() {
    return this.string;
  }
  sync() {
    return this.dom.flagSync$();
  }
};

// ../imba/src/imba/dom/core.web.imba
function extend$(target, ext) {
  var descriptors = Object.getOwnPropertyDescriptors(ext);
  Object.defineProperties(target.prototype, descriptors);
  return target;
}
function iter$2(a) {
  let v;
  return a ? (v = a.toIterable) ? v.call(a) : a : [];
}
var sys$13 = Symbol.for("#parent");
var sys$22 = Symbol.for("#context");
var sys$32 = Symbol.for("#init");
var sys$42 = Symbol.for("#placeholder__");
var sys$52 = Symbol.for("#attachToParent");
var sys$63 = Symbol.for("#detachFromParent");
var sys$72 = Symbol.for("##parent");
var sys$82 = Symbol.for("##up");
var sys$9 = Symbol.for("##context");
var sys$10 = Symbol.for("##placeholder__");
var sys$11 = Symbol.for("#src");
var sys$19 = Symbol.for("#htmlNodeName");
var sys$20 = Symbol.for("#ImbaElement");
var {
  Event,
  UIEvent,
  MouseEvent,
  PointerEvent,
  KeyboardEvent,
  CustomEvent,
  Node,
  Comment,
  Text,
  Element,
  HTMLElement,
  HTMLHtmlElement,
  HTMLSelectElement,
  HTMLInputElement,
  HTMLTextAreaElement,
  HTMLButtonElement,
  HTMLOptionElement,
  HTMLScriptElement,
  SVGElement,
  DocumentFragment,
  ShadowRoot,
  Document,
  Window,
  customElements
} = globalThis.window;
var CustomTagConstructors = {};
var CustomTagToElementNames = {};
var TYPES = {};
var CUSTOM_TYPES = {};
var contextHandler = {
  get(target, name) {
    let ctx = target;
    let val = void 0;
    while (ctx && val == void 0) {
      if (ctx = ctx[sys$13]) {
        val = ctx[name];
      }
      ;
    }
    ;
    return val;
  }
};
extend$(Document, {
  get flags() {
    return this.documentElement.flags;
  }
});
extend$(Node, {
  get [sys$13]() {
    return this[sys$72] || this.parentNode || this[sys$82];
  },
  get [sys$22]() {
    return this[sys$9] || (this[sys$9] = new Proxy(this, contextHandler));
  },
  [sys$32]() {
    return this;
  },
  replaceWith$(other) {
    if (!(other instanceof Node) && other.replace$) {
      other.replace$(this);
    } else {
      this.parentNode.replaceChild(other, this);
    }
    ;
    return other;
  },
  insertInto$(parent) {
    parent.appendChild$(this);
    return this;
  },
  insertBefore$(el, prev) {
    return this.insertBefore(el, prev);
  },
  insertBeforeBegin$(other) {
    return this.parentNode.insertBefore(other, this);
  },
  insertAfterEnd$(other) {
    if (this.nextSibling) {
      return this.nextSibling.insertBeforeBegin$(other);
    } else {
      return this.parentNode.appendChild(other);
    }
    ;
  },
  insertAfterBegin$(other) {
    if (this.childNodes[0]) {
      return this.childNodes[0].insertBeforeBegin$(other);
    } else {
      return this.appendChild(other);
    }
    ;
  },
  get [sys$42]() {
    return this[sys$10] || (this[sys$10] = globalThis.document.createComment(""));
  },
  set [sys$42](value) {
    let prev = this[sys$10];
    this[sys$10] = value;
    if (prev && prev != value && prev.parentNode) {
      prev.replaceWith$(value);
    }
    ;
  },
  [sys$52]() {
    let ph = this[sys$42];
    if (ph.parentNode && ph != this) {
      ph.replaceWith$(this);
    }
    ;
    return this;
  },
  [sys$63](route) {
    let ph = this[sys$42];
    if (this.parentNode && ph != this) {
      this.replaceWith$(ph);
    }
    ;
    return this;
  }
});
extend$(Element, {
  log(...params) {
    console.log(...params);
    return this;
  },
  emit(name, detail, o = {bubbles: true, cancelable: true}) {
    if (detail != void 0) {
      o.detail = detail;
    }
    ;
    let event = new CustomEvent(name, o);
    let res = this.dispatchEvent(event);
    return event;
  },
  slot$(name, ctx) {
    return this;
  },
  text$(item) {
    this.textContent = item;
    return this;
  },
  insert$(item, f, prev) {
    let type = typeof item;
    if (type === "undefined" || item === null) {
      if (prev && prev instanceof Comment) {
        return prev;
      }
      ;
      let el = globalThis.document.createComment("");
      prev ? prev.replaceWith$(el) : el.insertInto$(this);
      return el;
    }
    ;
    if (item === prev) {
      return item;
    } else if (type !== "object") {
      let res;
      let txt = item;
      if (f & 128 && f & 256) {
        this.textContent = txt;
        return;
      }
      ;
      if (prev) {
        if (prev instanceof Text) {
          prev.textContent = txt;
          return prev;
        } else {
          res = globalThis.document.createTextNode(txt);
          prev.replaceWith$(res, this);
          return res;
        }
        ;
      } else {
        this.appendChild$(res = globalThis.document.createTextNode(txt));
        return res;
      }
      ;
    } else {
      prev ? prev.replaceWith$(item, this) : item.insertInto$(this);
      return item;
    }
    ;
    return;
  },
  open$() {
    return this;
  },
  close$() {
    return this;
  },
  end$() {
    if (this.render) {
      this.render();
    }
    ;
    return;
  },
  get flags() {
    if (!this.$flags) {
      this.$flags = new Flags(this);
      if (this.flag$ == Element.prototype.flag$) {
        this.flags$ext = this.className;
      }
      ;
      this.flagDeopt$();
    }
    ;
    return this.$flags;
  },
  flag$(str) {
    let ns = this.flags$ns;
    this.className = ns ? ns + (this.flags$ext = str) : this.flags$ext = str;
    return;
  },
  flagDeopt$() {
    var self = this;
    this.flag$ = this.flagExt$;
    this.flagSelf$ = function(str) {
      return self.flagSync$(self.flags$own = str);
    };
    return;
  },
  flagExt$(str) {
    return this.flagSync$(this.flags$ext = str);
  },
  flagSelf$(str) {
    this.flagDeopt$();
    return this.flagSelf$(str);
  },
  flagSync$() {
    return this.className = (this.flags$ns || "") + (this.flags$ext || "") + " " + (this.flags$own || "") + " " + (this.$flags || "");
  }
});
Element.prototype.appendChild$ = Element.prototype.appendChild;
Element.prototype.removeChild$ = Element.prototype.removeChild;
Element.prototype.insertBefore$ = Element.prototype.insertBefore;
Element.prototype.replaceChild$ = Element.prototype.replaceChild;
Element.prototype.set$ = Element.prototype.setAttribute;
Element.prototype.setns$ = Element.prototype.setAttributeNS;
function createElement(name, parent, flags, text) {
  let el = globalThis.document.createElement(name);
  if (flags) {
    el.className = flags;
  }
  ;
  if (text !== null) {
    el.text$(text);
  }
  ;
  if (parent && parent instanceof Node) {
    el.insertInto$(parent);
  }
  ;
  return el;
}
var descriptorCache = {};
function getDescriptor(item, key, cache) {
  if (!item) {
    return cache[key] = null;
  }
  ;
  if (cache[key] !== void 0) {
    return cache[key];
  }
  ;
  let desc = Object.getOwnPropertyDescriptor(item, key);
  if (desc !== void 0 || item == SVGElement) {
    return cache[key] = desc || null;
  }
  ;
  return getDescriptor(Reflect.getPrototypeOf(item), key, cache);
}
extend$(SVGElement, {
  set$(key, value) {
    var $0$1;
    let cache = descriptorCache[$0$1 = this.nodeName] || (descriptorCache[$0$1] = {});
    let desc = getDescriptor(this, key, cache);
    if (!desc || !desc.set) {
      this.setAttribute(key, value);
    } else {
      this[key] = value;
    }
    ;
    return;
  },
  flag$(str) {
    let ns = this.flags$ns;
    this.className.baseVal = ns ? ns + (this.flags$ext = str) : this.flags$ext = str;
    return;
  },
  flagSelf$(str) {
    var self = this;
    this.flag$ = function(str2) {
      return self.flagSync$(self.flags$ext = str2);
    };
    this.flagSelf$ = function(str2) {
      return self.flagSync$(self.flags$own = str2);
    };
    return this.flagSelf$(str);
  },
  flagSync$() {
    return this.className.baseVal = (this.flags$ns || "") + (this.flags$ext || "") + " " + (this.flags$own || "") + " " + (this.$flags || "");
  }
});
extend$(SVGSVGElement, {
  set src(value) {
    if (this[sys$11] != value ? (this[sys$11] = value, true) : false) {
      if (value) {
        if (value.adoptNode) {
          value.adoptNode(this);
        } else if (value.content) {
          for (let sys$142 = value.attributes, sys$122 = 0, sys$132 = Object.keys(sys$142), sys$152 = sys$132.length, k, v; sys$122 < sys$152; sys$122++) {
            k = sys$132[sys$122];
            v = sys$142[k];
            this.setAttribute(k, v);
          }
          ;
          this.innerHTML = value.content;
        }
        ;
      }
      ;
    }
    ;
    return;
  }
});
function createSVGElement(name, parent, flags, text, ctx) {
  let el = globalThis.document.createElementNS("http://www.w3.org/2000/svg", name);
  if (flags) {
    el.className.baseVal = flags;
  }
  ;
  if (parent && parent instanceof Node) {
    el.insertInto$(parent);
  }
  ;
  if (text) {
    el.textContent = text;
  }
  ;
  return el;
}
function createComment(text) {
  return globalThis.document.createComment(text);
}
function createFragment() {
  return globalThis.document.createDocumentFragment();
}
var navigator = globalThis.navigator;
var vendor = navigator && navigator.vendor || "";
var ua = navigator && navigator.userAgent || "";
var isSafari = vendor.indexOf("Apple") > -1 || ua.indexOf("CriOS") >= 0 || ua.indexOf("FxiOS") >= 0;
var supportsCustomizedBuiltInElements = !isSafari;
var CustomDescriptorCache = new Map();
var CustomHook = class extends HTMLElement {
  connectedCallback() {
    if (supportsCustomizedBuiltInElements) {
      return this.parentNode.removeChild(this);
    } else {
      return this.parentNode.connectedCallback();
    }
    ;
  }
  disconnectedCallback() {
    if (!supportsCustomizedBuiltInElements) {
      return this.parentNode.disconnectedCallback();
    }
    ;
  }
};
window.customElements.define("i-hook", CustomHook);
function getCustomDescriptors(el, klass) {
  let props = CustomDescriptorCache.get(klass);
  if (!props) {
    props = {};
    let proto = klass.prototype;
    let protos = [proto];
    while (proto = proto && Object.getPrototypeOf(proto)) {
      if (proto.constructor == el.constructor) {
        break;
      }
      ;
      protos.unshift(proto);
    }
    ;
    for (let sys$162 = 0, sys$17 = iter$2(protos), sys$18 = sys$17.length; sys$162 < sys$18; sys$162++) {
      let item = sys$17[sys$162];
      let desc = Object.getOwnPropertyDescriptors(item);
      Object.assign(props, desc);
    }
    ;
    CustomDescriptorCache.set(klass, props);
  }
  ;
  return props;
}
function createComponent(name, parent, flags, text, ctx) {
  let el;
  if (typeof name != "string") {
    if (name && name.nodeName) {
      name = name.nodeName;
    }
    ;
  }
  ;
  let cmpname = CustomTagToElementNames[name] || name;
  if (CustomTagConstructors[name]) {
    let cls = CustomTagConstructors[name];
    let typ = cls.prototype[sys$19];
    if (typ && supportsCustomizedBuiltInElements) {
      el = globalThis.document.createElement(typ, {is: name});
    } else if (cls.create$ && typ) {
      el = globalThis.document.createElement(typ);
      el.setAttribute("is", cmpname);
      let props = getCustomDescriptors(el, cls);
      Object.defineProperties(el, props);
      el.__slots = {};
      el.appendChild(globalThis.document.createElement("i-hook"));
    } else if (cls.create$) {
      el = cls.create$(el);
      el.__slots = {};
    } else {
      console.warn("could not create tag " + name);
    }
    ;
  } else {
    el = globalThis.document.createElement(CustomTagToElementNames[name] || name);
  }
  ;
  el[sys$72] = parent;
  el[sys$32]();
  if (text !== null) {
    el.slot$("__").text$(text);
  }
  ;
  if (flags || el.flags$ns) {
    el.flag$(flags || "");
  }
  ;
  return el;
}
function defineTag(name, klass, options = {}) {
  TYPES[name] = CUSTOM_TYPES[name] = klass;
  klass.nodeName = name;
  let componentName = name;
  let proto = klass.prototype;
  if (name.indexOf("-") == -1) {
    componentName = "" + name + "-tag";
    CustomTagToElementNames[name] = componentName;
  }
  ;
  let basens = proto._ns_;
  if (options.ns) {
    let ns = options.ns;
    let flags = ns + " " + ns + "_ ";
    if (basens) {
      flags += proto.flags$ns;
      ns += " " + basens;
    }
    ;
    proto._ns_ = ns;
    proto.flags$ns = flags;
  }
  ;
  if (proto[sys$19]) {
    options.extends = proto[sys$19];
  }
  ;
  if (options.extends) {
    proto[sys$19] = options.extends;
    CustomTagConstructors[name] = klass;
    if (supportsCustomizedBuiltInElements) {
      window.customElements.define(componentName, klass, {extends: options.extends});
    }
    ;
  } else {
    window.customElements.define(componentName, klass);
  }
  ;
  return klass;
}
var instance2 = globalThis.imba || (globalThis.imba = {});
instance2.document = globalThis.document;

// ../imba/src/imba/dom/fragment.imba
function extend$2(target, ext) {
  var descriptors = Object.getOwnPropertyDescriptors(ext);
  Object.defineProperties(target.prototype, descriptors);
  return target;
}
var sys$14 = Symbol.for("#parent");
var sys$23 = Symbol.for("##up");
var sys$33 = Symbol.for("##parent");
extend$2(DocumentFragment, {
  get [sys$14]() {
    return this[sys$23] || this[sys$33];
  },
  setup$(flags, options) {
    this.$start = createComment("start");
    this.$end = createComment("end");
    this.$end.replaceWith$ = function(other) {
      this.parentNode.insertBefore(other, this);
      return other;
    };
    this.appendChild(this.$start);
    return this.appendChild(this.$end);
  },
  text$(item) {
    if (!this.$text) {
      this.$text = this.insert$(item);
    } else {
      this.$text.textContent = item;
    }
    ;
    return;
  },
  insert$(item, options, toReplace) {
    if (this[sys$33]) {
      return this[sys$33].insert$(item, options, toReplace || this.$end);
    } else {
      return Element.prototype.insert$.call(this, item, options, toReplace || this.$end);
    }
    ;
  },
  insertInto$(parent, before) {
    if (!this[sys$33]) {
      this[sys$33] = parent;
      parent.appendChild$(this);
    }
    ;
    return this;
  },
  replaceWith$(other, parent) {
    this.$start.insertBeforeBegin$(other);
    var el = this.$start;
    while (el) {
      let next = el.nextSibling;
      this.appendChild(el);
      if (el == this.$end) {
        break;
      }
      ;
      el = next;
    }
    ;
    return other;
  },
  appendChild$(child) {
    this.$end ? this.$end.insertBeforeBegin$(child) : this.appendChild(child);
    return child;
  },
  removeChild$(child) {
    child.parentNode && child.parentNode.removeChild(child);
    return this;
  },
  isEmpty$() {
    let el = this.$start;
    let end = this.$end;
    while (el = el.nextSibling) {
      if (el == end) {
        break;
      }
      ;
      if (el instanceof Element || el instanceof Text) {
        return false;
      }
      ;
    }
    ;
    return true;
  }
});
function createLiveFragment(bitflags, options, par) {
  const el = createFragment();
  el.setup$(bitflags, options);
  if (par) {
    el[sys$23] = par;
  }
  ;
  return el;
}

// ../imba/src/imba/dom/component.imba
function iter$3(a) {
  let v;
  return a ? (v = a.toIterable) ? v.call(a) : a : [];
}
var sys$15 = Symbol.for("#init");
var sys$43 = Symbol.for("#count");
var sys$64 = Symbol.for("#autorender");
var hydrator = new class {
  constructor($$ = null) {
    this[sys$15]($$);
  }
  [sys$15]($$ = null) {
    var $0$1;
    this.items = $$ && ($0$1 = $$.items) !== void 0 ? $0$1 : [];
    this.current = $$ && ($0$1 = $$.current) !== void 0 ? $0$1 : null;
    this.lastQueued = $$ && ($0$1 = $$.lastQueued) !== void 0 ? $0$1 : null;
    this.tests = $$ && ($0$1 = $$.tests) !== void 0 ? $0$1 : 0;
  }
  flush() {
    let item = null;
    if (false) {
    }
    ;
    while (item = this.items.shift()) {
      if (!item.parentNode || item.isHydrated) {
        continue;
      }
      ;
      let prev = this.current;
      this.current = item;
      item.__F |= 1024;
      item.connectedCallback();
      this.current = prev;
    }
    ;
    return;
  }
  queue(item) {
    var self = this;
    let len = this.items.length;
    let idx = 0;
    let prev = this.lastQueued;
    this.lastQueued = item;
    let BEFORE = Node.DOCUMENT_POSITION_PRECEDING;
    let AFTER = Node.DOCUMENT_POSITION_FOLLOWING;
    if (len) {
      let prevIndex = this.items.indexOf(prev);
      let index = prevIndex;
      let compare = function(a, b) {
        self.tests++;
        return a.compareDocumentPosition(b);
      };
      if (prevIndex == -1 || prev.nodeName != item.nodeName) {
        index = prevIndex = 0;
      }
      ;
      let curr = this.items[index];
      while (curr && compare(curr, item) & AFTER) {
        curr = this.items[++index];
      }
      ;
      if (index != prevIndex) {
        curr ? this.items.splice(index, 0, item) : this.items.push(item);
      } else {
        while (curr && compare(curr, item) & BEFORE) {
          curr = this.items[--index];
        }
        ;
        if (index != prevIndex) {
          curr ? this.items.splice(index + 1, 0, item) : this.items.unshift(item);
        }
        ;
      }
      ;
    } else {
      this.items.push(item);
      if (!this.current) {
        globalThis.queueMicrotask(this.flush.bind(this));
      }
      ;
    }
    ;
    return;
  }
  run(item) {
    var $0$3, $0$2;
    if (this.active) {
      return;
    }
    ;
    this.active = true;
    let all = globalThis.document.querySelectorAll(".__ssr");
    console.log("running hydrator", item, all.length, Array.from(all));
    for (let sys$24 = 0, sys$34 = iter$3(all), sys$53 = sys$34.length; sys$24 < sys$53; sys$24++) {
      let item2 = sys$34[sys$24];
      item2[sys$43] || (item2[sys$43] = 1);
      item2[sys$43]++;
      let name = item2.nodeName;
      let typ = ($0$2 = this.map)[name] || ($0$2[name] = globalThis.window.customElements.get(name.toLowerCase()) || HTMLElement);
      console.log("item type", name, typ, !!CUSTOM_TYPES[name.toLowerCase()]);
      if (!item2.connectedCallback || !item2.parentNode || item2.isHydrated) {
        continue;
      }
      ;
      console.log("hydrate", item2);
    }
    ;
    return this.active = false;
  }
}();
var ImbaElement = class extends HTMLElement {
  constructor() {
    super();
    if (this.flags$ns) {
      this.flag$ = this.flagExt$;
    }
    ;
    this.setup$();
    this.build();
  }
  setup$() {
    this.__slots = {};
    return this.__F = 0;
  }
  [sys$15]() {
    this.__F |= 1 | 2;
    return this;
  }
  flag$(str) {
    this.className = this.flags$ext = str;
    return;
  }
  slot$(name, ctx) {
    var $0$4;
    if (name == "__" && !this.render) {
      return this;
    }
    ;
    return ($0$4 = this.__slots)[name] || ($0$4[name] = createLiveFragment(0, null, this));
  }
  build() {
    return this;
  }
  awaken() {
    return this;
  }
  mount() {
    return this;
  }
  unmount() {
    return this;
  }
  rendered() {
    return this;
  }
  dehydrate() {
    return this;
  }
  hydrate() {
    this.autoschedule = true;
    return this;
  }
  tick() {
    return this.commit();
  }
  visit() {
    return this.commit();
  }
  commit() {
    if (!this.isRender) {
      this.__F |= 8192;
      return this;
    }
    ;
    this.__F |= 256;
    this.render && this.render();
    this.rendered();
    return this.__F = (this.__F | 512) & ~256 & ~8192;
  }
  get autoschedule() {
    return (this.__F & 64) != 0;
  }
  set autoschedule(value) {
    value ? this.__F |= 64 : this.__F &= ~64;
  }
  set autorender(value) {
    let o = this[sys$64] || (this[sys$64] = {});
    o.value = value;
    if (this.isMounted) {
      scheduler.schedule(this, o);
    }
    ;
    return;
  }
  get isRender() {
    return !this.isSuspended;
  }
  get isMounting() {
    return (this.__F & 16) != 0;
  }
  get isMounted() {
    return (this.__F & 32) != 0;
  }
  get isAwakened() {
    return (this.__F & 8) != 0;
  }
  get isRendered() {
    return (this.__F & 512) != 0;
  }
  get isSuspended() {
    return (this.__F & 4096) != 0;
  }
  get isRendering() {
    return (this.__F & 256) != 0;
  }
  get isScheduled() {
    return (this.__F & 128) != 0;
  }
  get isHydrated() {
    return (this.__F & 2) != 0;
  }
  get isSsr() {
    return (this.__F & 1024) != 0;
  }
  schedule() {
    scheduler.on("commit", this);
    this.__F |= 128;
    return this;
  }
  unschedule() {
    scheduler.un("commit", this);
    this.__F &= ~128;
    return this;
  }
  async suspend(cb = null) {
    let val = this.flags.incr("_suspended_");
    this.__F |= 4096;
    if (cb instanceof Function) {
      await cb();
      this.unsuspend();
    }
    ;
    return this;
  }
  unsuspend() {
    let val = this.flags.decr("_suspended_");
    if (val == 0) {
      this.__F &= ~4096;
      this.commit();
      ;
    }
    ;
    return this;
  }
  end$() {
    return this.visit();
  }
  open$() {
    if (this.__F & 1024) {
      this.__F = this.__F & ~1024;
      this.classList.remove("_ssr_");
      if (this.flags$ext && this.flags$ext.indexOf("_ssr_") == 0) {
        this.flags$ext = this.flags$ext.slice(5);
      }
      ;
      if (!(this.__F & 512)) {
        this.innerHTML = "";
      }
      ;
    }
    ;
    return this;
  }
  connectedCallback() {
    let flags = this.__F;
    let inited = flags & 1;
    let awakened = flags & 8;
    if (!inited && !(flags & 1024)) {
      hydrator.queue(this);
      return;
    }
    ;
    if (flags & (16 | 32)) {
      return;
    }
    ;
    this.__F |= 16;
    if (!inited) {
      this[sys$15]();
    }
    ;
    if (!(flags & 2)) {
      this.flags$ext = this.className;
      this.__F |= 2;
      this.hydrate();
      this.commit();
    }
    ;
    if (!awakened) {
      this.awaken();
      this.__F |= 8;
    }
    ;
    let res = this.mount();
    if (res && res.then instanceof Function) {
      res.then(scheduler.commit);
    }
    ;
    flags = this.__F = (this.__F | 32) & ~16;
    if (flags & 64) {
      this.schedule();
    }
    ;
    if (this[sys$64]) {
      scheduler.schedule(this, this[sys$64]);
    }
    ;
    return this;
  }
  disconnectedCallback() {
    this.__F = this.__F & (~32 & ~16);
    if (this.__F & 128) {
      this.unschedule();
    }
    ;
    this.unmount();
    if (this[sys$64]) {
      return scheduler.unschedule(this, this[sys$64]);
    }
    ;
  }
};

// ../imba/src/imba/dom/context.imba
var renderContext = {
  context: null
};

// ../imba/src/imba/dom/mount.imba
function mount(mountable, into) {
  let parent = into || globalThis.document.body;
  let element = mountable;
  if (mountable instanceof Function) {
    let ctx = {_: parent};
    let tick = function() {
      let prev = renderContext.context;
      renderContext.context = ctx;
      let res = mountable(ctx);
      if (renderContext.context == ctx) {
        renderContext.context = prev;
      }
      ;
      return res;
    };
    element = tick();
    scheduler.listen("commit", tick);
  } else {
    element.__F |= 64;
  }
  ;
  return parent.appendChild(element);
}

// app/logo.svg
var logo_default = "/test-pages/img/logo-4MXEBDEU.svg"     ;

// img:app/logo.svg
var logo_default2 = asset({
  url: logo_default,
  type: "svg",
  meta: {attributes: {viewBox: "0 0 1164 400", "fill-rule": "evenodd", "clip-rule": "evenodd", "stroke-linejoin": "round", "stroke-miterlimit": "2"}, flags: [], content: '\n  <path fill="none" d="M.658 0h1163v400H.658z"/>\n  <g fill="#273240">\n    <path d="M410.808 338.269c-3.618 0-6.551-2.932-6.551-6.55V159.88c0-3.618 2.933-6.55 6.551-6.55h41.928c3.618 0 6.55 2.932 6.551 6.55v171.839c-.001 3.618-2.933 6.55-6.551 6.55h-41.928z" fill-rule="nonzero"/>\n    <ellipse cx="431.598" cy="87.156" rx="32.391" ry="31.346"/>\n    <path d="M696.469 147.409c14.628 0 26.353 4.934 35.177 14.802 8.823 9.868 13.234 23.509 13.234 40.923v128.585c0 1.737-.69 3.403-1.918 4.632-1.229 1.228-2.895 1.918-4.632 1.918h-41.928c-1.738 0-3.404-.69-4.632-1.918-1.229-1.229-1.919-2.895-1.919-4.632V212.538c0-16.485-5.224-24.728-15.672-24.728-5.805 0-10.913 1.974-15.325 5.921-2.287 2.046-4.543 4.654-6.768 7.824-3.831 5.193-5.898 11.476-5.898 17.929-.221 22.92-.221 90.816-.221 112.235 0 1.737-.69 3.403-1.918 4.632-1.229 1.228-2.895 1.918-4.632 1.918h-41.928c-1.738 0-3.404-.69-4.632-1.918-1.229-1.229-1.919-2.895-1.919-4.632V212.538c0-16.485-5.224-24.728-15.672-24.728-5.573 0-10.623 2.032-15.151 6.095-2.67 2.396-5.279 5.458-7.828 9.187-3.292 4.656-5.06 10.219-5.06 15.921-.173 22.446-.173 91.138-.173 112.706 0 1.737-.69 3.403-1.918 4.632-1.229 1.228-2.895 1.918-4.632 1.918h-41.928c-3.618 0-6.551-2.932-6.551-6.55V159.88c0-3.618 2.933-6.55 6.551-6.55h36.022c3.176 0 5.895 2.278 6.45 5.406.448 2.526.99 5.582 1.482 8.355.25 1.4 1.273 2.537 2.638 2.934 1.366.397 2.839-.016 3.8-1.064 5.811-6.348 12.085-11.264 18.809-14.761 8.708-4.527 18.634-6.791 29.779-6.791 10.216 0 19.097 2.554 26.644 7.662 4.629 3.134 9.936 10.55 13.347 15.815.911 1.316 2.356 2.163 3.95 2.314 1.594.151 3.173-.41 4.315-1.532 5.347-5.413 14.008-13.767 19.834-16.945 8.939-4.876 19.213-7.314 30.823-7.314zM879.667 147.409c22.522 0 39.762 8.591 51.72 25.773 11.958 17.182 17.937 41.446 17.937 72.792 0 19.039-2.961 35.989-8.881 50.849-5.921 14.86-14.396 26.47-25.425 34.829-11.029 8.359-24.09 12.538-39.182 12.538-10.217 0-19.446-2.032-27.689-6.095-4.643-2.289-8.863-5.149-12.659-8.58-1.633-1.48-3.946-1.945-6.024-1.211s-3.587 2.549-3.928 4.726c-.075-.008-.076-.004-.076 0-.474 3.016-3.072 5.239-6.126 5.239h-36.906c-3.617 0-6.55-2.932-6.55-6.55V85.725c0-3.346 2.522-6.155 5.849-6.513 10.128-1.09 30.901-3.325 41.929-4.511 1.848-.199 3.694.397 5.078 1.639 1.383 1.243 2.173 3.014 2.173 4.874v79.057c.001 1.814 1.077 3.454 2.741 4.177 1.663.723 3.597.39 4.923-.847 3.916-3.649 8.454-6.77 13.581-9.401 8.824-4.527 17.995-6.791 27.515-6.791zm-19.504 156.728c21.361 0 32.042-19.388 32.042-58.163 0-21.826-2.554-36.977-7.662-45.452-5.108-8.475-12.422-12.712-21.942-12.712-7.693 0-14.643 2.71-20.849 8.128-6.84 6.025-10.759 14.699-10.759 23.814-.086 14.5-.086 40.738-.086 55.477.002 15.709 12.536 28.549 28.241 28.928.337-.024.675-.02 1.015-.02zM1120.33 284.633c0 6.966.987 12.074 2.96 15.325 1.242 2.045 2.966 3.768 5.172 5.17 2.416 1.577 3.481 4.575 2.6 7.323-.726 2.723-1.834 6.183-2.995 9.808-2.184 6.819-7.312 12.298-13.971 14.929-6.659 2.631-14.147 2.136-20.402-1.349-.002-.004-.005-.006-.008-.008-7.082-3.947-12.712-10.332-16.892-19.155-12.074 18.343-30.649 27.514-55.725 27.514-18.343 0-32.971-5.34-43.884-16.021-10.913-10.681-16.37-24.612-16.37-41.794 0-20.201 7.43-35.641 22.291-46.322 14.86-10.681 36.337-16.021 64.432-16.021h11.861c1.843 0 3.609-.732 4.912-2.035 1.303-1.303 2.035-3.069 2.035-4.912v-1.064c0-10.913-2.322-18.401-6.966-22.464-4.644-4.064-12.77-6.095-24.38-6.095-6.037 0-13.351.87-21.942 2.612-6.675 1.353-13.491 3.092-20.447 5.216-3.371 1.036-6.957-.784-8.11-4.117-2.316-6.679-6.021-17.383-8.341-24.086-1.182-3.411.619-7.135 4.026-8.327 9.659-3.329 19.512-5.954 29.563-7.868 12.19-2.322 23.51-3.483 33.958-3.483 26.47 0 45.858 5.456 58.164 16.369 12.306 10.913 18.459 27.283 18.459 49.108v71.747zm-83.24 20.201c6.037 0 11.551-1.509 16.543-4.528h.001c7.89-4.771 12.712-13.32 12.712-22.54v-15.98c0-4.117-3.337-7.453-7.453-7.453h-6.13c-12.539 0-21.884 2.205-28.037 6.617-6.153 4.412-9.23 11.261-9.23 20.549 0 7.43 1.916 13.177 5.747 17.24 3.831 4.063 9.113 6.095 15.847 6.095z" fill-rule="nonzero"/>\n  </g>\n  <path d="M360.039 167.628C323.834 99.341.596 29.568 35.591 74.7c34.995 45.132 190.036 107.062 199.223 108.212-47.568 14.937-174.53 41.73-147.353 64.299 27.177 22.569 156.265-2.637 156.052-2.236-35.746 26.937-80.254 108.258-35.536 90.883 70.555-27.413 173.158-128.44 152.062-168.23z" fill="#16cec7"/>\n'},
  toString: function() {
    return this.url;
  }
});

// app/index.imba
var sys$16 = Symbol();
var sys$44 = Symbol();
var appT$1;
var appB$1;
var appD$1;
var AppComponent = class extends ImbaElement {
  render() {
    var cmpT$1, cmpB$1, cmpD$1, sys$24 = this._ns_ || "", headerT$1, svgT$1, pT$1, codeT$1, aT$1;
    cmpT$1 = this;
    cmpT$1.open$();
    (cmpB$1 = cmpD$1 = 1, cmpT$1[sys$16] === 1) || (cmpB$1 = cmpD$1 = 0, cmpT$1[sys$16] = 1);
    (!cmpB$1 || cmpD$1 & 2) && cmpT$1.flagSelf$("vi-af");
    cmpB$1 || (headerT$1 = createElement("header", cmpT$1, `vi-ag ${sys$24}`, null));
    cmpB$1 || (svgT$1 = createSVGElement("svg", headerT$1, `vi-ah ${sys$24}`, null));
    cmpB$1 || svgT$1.set$("src", logo_default2);
    (pT$1 = cmpT$1[sys$44]) || (cmpT$1[sys$44] = pT$1 = createElement("p", headerT$1, `vi-aj ${sys$24}`, null));
    cmpB$1 || pT$1.insert$("Edit ");
    cmpB$1 || (codeT$1 = createElement("code", pT$1, `vi-ak ${sys$24}`, "app/index.imba"));
    cmpB$1 || pT$1.insert$(" and save to reload");
    cmpB$1 || (aT$1 = createElement("a", headerT$1, `vi-al ${sys$24}`, "Learn Imba"));
    cmpB$1 || (aT$1.href = "https://imba.io");
    cmpT$1.close$(cmpD$1);
    return cmpT$1;
  }
};
defineTag("app", AppComponent, {});
mount((appT$1 = createComponent("app", null, "vi-am", null), appB$1 || !appT$1.setup || appT$1.setup(appD$1), appT$1.end$(appD$1), appT$1));
//__FOOT__
