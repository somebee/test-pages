//__HEAD__
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __markAsModule = (target) => __defProp(target, "__esModule", {value: true});
var __exportStar = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, {get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable});
  }
  return target;
};
var __toModule = (module2) => {
  return __exportStar(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? {get: () => module2.default, enumerable: true} : {value: module2, enumerable: true})), module2);
};

// ../imba/src/imba/manifest.imba
var import_events = __toModule(require("events"));
var import_fs = __toModule(require("fs"));
var import_path = __toModule(require("path"));
var sys$1 = Symbol.for("#refresh");
var sys$2 = Symbol.for("#manifest");
var sys$3 = Symbol.for("#absPath");
var sys$4 = Symbol.for("#raw");
var sys$5 = Symbol.for("#watch");
var LazyProxy = class {
  static for(getter) {
    return new Proxy({}, new this(getter));
  }
  constructor(getter) {
    this.getter = getter;
  }
  get target() {
    return this.getter();
  }
  get(_, key) {
    return this.target[key];
  }
  set(_, key, value) {
    this.target[key] = value;
    return true;
  }
};
var manifest = LazyProxy.for(function() {
  return globalThis[sys$2];
});

// ../imba/src/imba/process.imba
var import_cluster = __toModule(require("cluster"));
var import_fs2 = __toModule(require("fs"));
var import_path2 = __toModule(require("path"));
var import_events2 = __toModule(require("events"));

// ../imba/src/utils/logger.imba
var import_perf_hooks = __toModule(require("perf_hooks"));
var sys$12 = Symbol.for("#spinner");
var sys$22 = Symbol.for("#ctime");
var sys$32 = Symbol.for("#IMBA_OPTIONS");
var ansiMap = {
  reset: [0, 0],
  bold: [1, 22],
  dim: [2, 22],
  italic: [3, 23],
  underline: [4, 24],
  inverse: [7, 27],
  hidden: [8, 28],
  strikethrough: [9, 29],
  black: [30, 39],
  red: [31, 39],
  green: [32, 39],
  yellow: [33, 39],
  blue: [34, 39],
  magenta: [35, 39],
  cyan: [36, 39],
  white: [37, 39],
  gray: [90, 39],
  redBright: [91, 39],
  greenBright: [92, 39],
  yellowBright: [93, 39],
  blueBright: [94, 39],
  magentaBright: [95, 39],
  cyanBright: [96, 39],
  whiteBright: [97, 39]
};
var ansi = {
  bold: function(text) {
    return "[1m" + text + "[22m";
  },
  red: function(text) {
    return "[31m" + text + "[39m";
  },
  green: function(text) {
    return "[32m" + text + "[39m";
  },
  yellow: function(text) {
    return "[33m" + text + "[39m";
  },
  blue: function(text) {
    return "[94m" + text + "[39m";
  },
  gray: function(text) {
    return "[90m" + text + "[39m";
  },
  white: function(text) {
    return "[37m" + text + "[39m";
  },
  f: function(name, text) {
    let pair = ansiMap[name];
    return "[" + pair[0] + "m" + text + "[" + pair[1] + "m";
  }
};
ansi.warn = ansi.yellow;
ansi.error = ansi.red;
var notWin = process.platform !== "win32" || process.env.CI || process.env.TERM === "xterm-256color";
var logSymbols = {
  info: ansi.f("yellowBright", notWin ? "\u2139" : "i"),
  success: ansi.green(notWin ? "\u2714" : "\u221A"),
  warning: ansi.yellow(notWin ? "\u26A0" : "!!"),
  error: ansi.red(notWin ? "\xD7" : "\u2716"),
  debug: ansi.blue(notWin ? "\u2139" : "i")
};
var logLevels = ["debug", "info", "success", "warning", "error", "silent"];
var addressTypeName = {
  "-1": "socket",
  "4": "ip4",
  "6": "ip6"
};
function formatMarkdown(str) {
  let fmt = ansi.f;
  str = str.replace(/https?\:[^\s\n\)\]]+/g, function(m) {
    return fmt("blueBright", m);
  });
  str = str.replace(/^[\t\s]*\>[^\n]+/gm, function(m) {
    return fmt("bold", m);
  });
  str = str.replace(/\t/g, "  ");
  str = str.replace(/^/gm, "  ");
  return str;
}
function format(str, ...rest) {
  let fmt = ansi.f;
  str = str.replace(/\%([\w\.]+)/g, function(m, f) {
    let part = rest.shift();
    if (f == "markdown") {
      return formatMarkdown(part);
    } else if (f == "kb") {
      return fmt("dim", (part / 1e3).toFixed(1) + "kb");
    } else if (f == "path" || f == "bold") {
      return fmt("bold", part);
    } else if (f == "dim") {
      return fmt("dim", part);
    } else if (f == "address") {
      let typ = addressTypeName[part.addressType];
      if (part.port) {
        return fmt("blueBright", [part.address || "http://127.0.0.1", part.port].join(":"));
      } else {
        return fmt("blueBright", typ);
      }
      ;
    } else if (f == "ms") {
      return fmt("yellow", Math.round(part) + "ms");
    } else if (f == "d") {
      return fmt("blueBright", part);
    } else if (f == "red") {
      return fmt("redBright", part);
    } else if (f == "green") {
      return fmt("greenBright", part);
    } else if (f == "yellow") {
      return fmt("yellowBright", part);
    } else if (f == "ref") {
      return fmt("yellowBright", "#" + (part.id || part));
    } else if (f == "elapsed") {
      if (part != void 0) {
        rest.unshift(part);
      }
      ;
      let elapsed = import_perf_hooks.performance.now();
      return fmt("yellow", Math.round(elapsed) + "ms");
    } else if (f == "heap") {
      if (part != void 0) {
        rest.unshift(part);
      }
      ;
      let used = process.memoryUsage().heapUsed / 1024 / 1024;
      return fmt("yellow", used.toFixed(2) + "mb");
    } else {
      return part;
    }
    ;
  });
  return [str, ...rest];
}
var Spinner = null;
var Instance = null;
var Logger = class {
  static get main() {
    return Instance || (Instance = new this());
  }
  constructor({prefix = null, loglevel} = {}) {
    this[sys$22] = Date.now();
    this.prefix = prefix ? format(...prefix)[0] : "";
    this.loglevel = loglevel || process.env.IMBA_LOGLEVEL || globalThis[sys$32] && globalThis[sys$32].loglevel || "info";
  }
  write(kind, ...parts) {
    if (logLevels.indexOf(kind) < logLevels.indexOf(this.loglevel)) {
      return this;
    }
    ;
    let sym = logSymbols[kind] || kind;
    let [str, ...rest] = format(...parts);
    if (this.prefix) {
      str = this.prefix + str;
    }
    ;
    if (this[sys$12] && this[sys$12].isSpinning) {
      if (kind == "success") {
        this[sys$12].clear();
        console.log(sym + " " + str, ...rest);
        this[sys$12].frame();
      }
      ;
      return this[sys$12].text = str;
    } else {
      return console.log(sym + " " + str, ...rest);
    }
    ;
  }
  debug(...pars) {
    return this.write("debug", ...pars);
  }
  log(...pars) {
    return this.write("info", ...pars);
  }
  info(...pars) {
    return this.write("info", ...pars);
  }
  warn(...pars) {
    return this.write("warn", ...pars);
  }
  error(...pars) {
    return this.write("error", ...pars);
  }
  success(...pars) {
    return this.write("success", ...pars);
  }
  ts(...pars) {
    return this.write("debug", ...pars, import_perf_hooks.performance.now());
  }
  spinner() {
    return;
    return Spinner = this.ora("Loading").start();
  }
  get [sys$12]() {
    return Spinner;
  }
  get proxy() {
    var self = this;
    let fn = function(...pars) {
      return self.info(...pars);
    };
    fn.info = this.info.bind(this);
    fn.warn = this.warn.bind(this);
    fn.error = this.error.bind(this);
    fn.debug = this.debug.bind(this);
    fn.success = this.success.bind(this);
    fn.ts = this.ts.bind(this);
    fn.logger = this;
    return fn;
  }
  async time(label, cb) {
    let t = Date.now();
    if (cb) {
      let res = await cb();
      this.info("" + label + " %ms", Date.now() - t);
      return res;
    }
    ;
  }
};
var logger_default = new Logger().proxy;

// ../imba/src/imba/process.imba
var import_module = __toModule(require("module"));
var import_http = __toModule(require("http"));
var import_https = __toModule(require("https"));
var import_http2 = __toModule(require("http2"));
function iter$(a) {
  let v;
  return a ? (v = a.toIterable) ? v.call(a) : a : [];
}
var sys$13 = Symbol.for("#setup");
var sys$7 = Symbol.for("#setup?");
var sys$10 = Symbol.for("#watch");
var sys$15 = Symbol.for("#dom");
var sys$16 = Symbol.for("#server");
var sys$17 = Symbol.for("#raw");
var defaultHeaders = {
  html: {"Content-Type": "text/html"},
  js: {"Content-Type": "text/javascript"},
  mjs: {"Content-Type": "text/javascript"},
  json: {"Content-Type": "application/json"},
  css: {"Content-Type": "text/css"},
  otf: {"Content-Type": "font/otf"},
  ttf: {"Content-Type": "font/ttf"},
  woff: {"Content-Type": "font/woff"},
  woff2: {"Content-Type": "font/woff2"},
  svg: {"Content-Type": "image/svg+xml"},
  avif: {"Content-Type": "image/avif"},
  gif: {"Content-Type": "image/gif"},
  png: {"Content-Type": "image/png"},
  apng: {"Content-Type": "image/apng"},
  webp: {"Content-Type": "image/webp"},
  jpg: {"Content-Type": "image/jpeg"},
  jpeg: {"Content-Type": "image/jpeg"}
};
var proc = globalThis.process;
var Servers = class extends Set {
  call(name, ...params) {
    var sys$23;
    sys$23 = [];
    for (let server2 of iter$(this)) {
      sys$23.push(server2[name](...params));
    }
    ;
    return sys$23;
  }
  close(o = {}) {
    var sys$33;
    sys$33 = [];
    for (let server2 of iter$(this)) {
      sys$33.push(server2.close(o));
    }
    ;
    return sys$33;
  }
  reload(o = {}) {
    var sys$42;
    sys$42 = [];
    for (let server2 of iter$(this)) {
      sys$42.push(server2.reload(o));
    }
    ;
    return sys$42;
  }
  broadcast(msg, ...rest) {
    var sys$52;
    sys$52 = [];
    for (let server2 of iter$(this)) {
      sys$52.push(server2.broadcast(msg, ...rest));
    }
    ;
    return sys$52;
  }
  emit(event, data) {
    var sys$62;
    sys$62 = [];
    for (let server2 of iter$(this)) {
      sys$62.push(server2.emit(event, data));
    }
    ;
    return sys$62;
  }
};
var servers = new Servers();
var process2 = new class Process extends import_events2.EventEmitter {
  constructor() {
    var self;
    super(...arguments);
    self = this;
    this.autoreload = false;
    this.state = {};
    if (import_cluster.default.isWorker) {
      proc.on("message", function(msg) {
        self.emit("message", msg);
        if (msg[0] == "emit") {
          return self.emit(...msg.slice(1));
        }
        ;
      });
    }
    ;
    this;
  }
  [sys$13]() {
    var self = this;
    if (!(this[sys$7] != true ? (this[sys$7] = true, true) : false)) {
      return;
    }
    ;
    this.on("reloading", function(e) {
      var sys$8;
      console.log("is reloading - from outside");
      self.state.reloading = true;
      sys$8 = [];
      for (let server2 of iter$(servers)) {
        sys$8.push(server2.pause());
      }
      ;
      return sys$8;
    });
    this.on("reloaded", async function(e) {
      var sys$9;
      self.state.reloaded = true;
      console.log("is reloaded - from outside");
      sys$9 = [];
      for (let server2 of iter$(servers)) {
        sys$9.push(server2.close());
      }
      ;
      let promises = sys$9;
      await Promise.all(promises);
      return proc.exit(0);
    });
    this.on("manifest:change", function(e) {
      if (proc.env.IMBA_HMR) {
        return manifest.update(e);
      }
      ;
    });
    this.on("manifest:error", function(e) {
      if (proc.env.IMBA_HMR) {
        manifest.errors = e;
        return servers.broadcast("errors", manifest.errors);
      }
      ;
    });
    return true;
  }
  send(msg) {
    if (proc.send instanceof Function) {
      return proc.send(msg);
    }
    ;
  }
  on(name, cb) {
    if (name == "change") {
      this.watch();
    }
    ;
    return super.on(...arguments);
  }
  watch() {
    var self = this;
    if (this[sys$10] != true ? (this[sys$10] = true, true) : false) {
      return manifest.on("change:main", function() {
        return self.emit("change", manifest);
      });
    }
    ;
  }
  reload() {
    if (!(this.isReloading != true ? (this.isReloading = true, true) : false)) {
      return this;
    }
    ;
    this.state.reloading = true;
    if (!proc.env.IMBA_SERVE) {
      console.warn("not possible to gracefully reload servers not started via imba start");
      return;
    }
    ;
    this.send("reload");
    return;
    for (let server2 of iter$(servers)) {
      server2.pause();
    }
    ;
    this.on("reloaded", async function(e) {
      var sys$11;
      sys$11 = [];
      for (let server2 of iter$(servers)) {
        sys$11.push(server2.close());
      }
      ;
      let promises = sys$11;
      await Promise.all(promises);
      return proc.exit(0);
    });
    return this.send("reload");
  }
}();
var AssetResponder = class {
  constructor(url, params = {}) {
    this.url = url;
    [this.path, this.query] = url.split("?");
    this.ext = import_path2.default.extname(this.path);
    this.headers = {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*",
      "cache-control": "public"
    };
    Object.assign(this.headers, defaultHeaders[this.ext.slice(1)] || {});
  }
  respond(req, res) {
    let asset2 = manifest.urls[this.url];
    let headers = this.headers;
    let path = asset2 ? manifest.resolve(asset2) : manifest.resolveAssetPath("public" + this.path);
    if (!path) {
      console.log("found no path for", asset2, this.url);
      res.writeHead(404, {});
      return res.end();
    }
    ;
    if (asset2) {
      if (asset2.ttl > 0) {
        headers["cache-control"] = "max-age=" + asset2.ttl;
      }
      ;
      if (asset2.imports) {
        let link = [];
        for (let sys$122 = 0, sys$132 = iter$(asset2.imports), sys$142 = sys$132.length; sys$122 < sys$142; sys$122++) {
          let item = sys$132[sys$122];
          link.push("<" + item.url + ">; rel=modulepreload; as=script");
        }
        ;
        headers.Link = link.join(", ");
      }
      ;
    }
    ;
    return import_fs2.default.access(path, import_fs2.default.constants.R_OK, function(err) {
      if (err) {
        console.log("could not find path", path);
        res.writeHead(404, {});
        return res.end();
      }
      ;
      try {
        let stream = import_fs2.default.createReadStream(path);
        res.writeHead(200, headers);
        return stream.pipe(res);
      } catch (e) {
        res.writeHead(503, {});
        return res.end();
      }
      ;
    });
  }
  createReadStream() {
    return import_fs2.default.createReadStream(this.path);
  }
  pipe(response) {
    return this.createReadStream().pipe(response);
  }
};
var Server = class {
  static wrap(server2) {
    return new this(server2);
  }
  constructor(srv) {
    var self = this;
    servers.add(this);
    this.id = Math.random();
    this.closed = false;
    this.paused = false;
    this.server = srv;
    this.clients = new Set();
    this.stalledResponses = [];
    this.assetResponders = {};
    if (proc.env.IMBA_PATH) {
      this.devtoolsPath = import_path2.default.resolve(proc.env.IMBA_PATH, "devtools.imba.web.js");
    }
    ;
    this.scheme = srv instanceof import_http.default.Server ? "http" : "https";
    let originalHandler = this.server._events.request;
    let dom = globalThis[sys$15];
    srv.off("request", originalHandler);
    originalHandler[sys$16] = this;
    srv.on("listening", function() {
      let adr = self.server.address();
      let host = adr.address;
      if (host == "::" || host == "0.0.0.0") {
        host = "localhost";
      }
      ;
      let url = "" + self.scheme + "://" + host + ":" + adr.port + "/";
      return logger_default.info("listening on %bold", url);
    });
    manifest.on("change", function(changes, m) {
      return self.broadcast("manifest", m.data[sys$17]);
    });
    this.handler = function(req, res) {
      var $0$1;
      let ishttp2 = req instanceof import_http2.Http2ServerRequest;
      let url = req.url;
      let assetPrefix = "/__assets__/";
      if (self.paused || self.closed) {
        res.statusCode = 302;
        res.setHeader("Location", req.url);
        if (!ishttp2) {
          res.setHeader("Connection", "close");
        }
        ;
        if (self.closed) {
          if (ishttp2) {
            req.stream.session.close();
          }
          ;
          return res.end();
        } else {
          return self.stalledResponses.push(res);
        }
        ;
      }
      ;
      if (url == "/__hmr__.js" && self.devtoolsPath) {
        let stream = import_fs2.default.createReadStream(self.devtoolsPath);
        res.writeHead(200, defaultHeaders.js);
        return stream.pipe(res);
      }
      ;
      if (url == "/__hmr__") {
        let headers2 = {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache"
        };
        if (!ishttp2) {
          headers2.Connection = "keep-alive";
        }
        ;
        res.writeHead(200, headers2);
        self.clients.add(res);
        self.broadcast("init", manifest.serializeForBrowser(), [res]);
        req.on("close", function() {
          return self.clients.delete(res);
        });
        return true;
      }
      ;
      if (url.indexOf(assetPrefix) == 0 || manifest.urls[url]) {
        let responder = ($0$1 = self.assetResponders)[url] || ($0$1[url] = new AssetResponder(url, self));
        return responder.respond(req, res);
      }
      ;
      let headers = req.headers;
      let base;
      if (ishttp2) {
        base = headers[":scheme"] + "://" + headers[":authority"];
      } else {
        let scheme = req.connection.encrypted ? "https" : "http";
        base = scheme + "://" + headers.host;
      }
      ;
      if (dom) {
        let loc = new dom.Location(req.url, base);
        return dom.Document.create({location: loc}, function() {
          return originalHandler(req, res);
        });
      } else {
        return originalHandler(req, res);
      }
      ;
    };
    srv.on("request", this.handler);
    srv.on("close", function() {
      return console.log("server is closing!!!");
    });
    if (import_cluster.default.isWorker) {
      process2[sys$13]();
      process2.send("serve");
    }
    ;
  }
  broadcast(event, data = {}, clients = this.clients) {
    data = JSON.stringify(data);
    let msg = "data: " + data + "\n\n\n";
    for (let client of iter$(clients)) {
      client.write("event: " + event + "\n");
      client.write("id: imba\n");
      client.write(msg);
    }
    ;
    return this;
  }
  pause() {
    if (this.paused != true ? (this.paused = true, true) : false) {
      this.broadcast("paused");
    }
    ;
    return this;
  }
  resume() {
    if (this.paused != false ? (this.paused = false, true) : false) {
      this.broadcast("resumed");
      return this.flushStalledResponses();
    }
    ;
  }
  flushStalledResponses() {
    for (let sys$18 = 0, sys$19 = iter$(this.stalledResponses), sys$20 = sys$19.length; sys$18 < sys$20; sys$18++) {
      let res = sys$19[sys$18];
      res.end();
    }
    ;
    return this.stalledResponses = [];
  }
  close() {
    var self = this;
    this.pause();
    return new Promise(function(resolve) {
      self.closed = true;
      self.server.close(resolve);
      return self.flushStalledResponses();
    });
  }
};
function serve(srv, ...params) {
  return Server.wrap(srv, ...params);
}

// ../imba/src/imba/asset.imba
var sys$14 = Symbol.for("#init");
var sys$6 = Symbol.for("#asset");
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
    this[sys$14]($$);
  }
  [sys$14]($$ = null) {
    this.url = $$ ? $$.url : void 0;
    this.meta = $$ ? $$.meta : void 0;
  }
  adoptNode(node) {
    var _a;
    if ((_a = this.meta) == null ? void 0 : _a.content) {
      for (let sys$42 = this.meta.attributes, sys$23 = 0, sys$33 = Object.keys(sys$42), sys$52 = sys$33.length, k, v; sys$23 < sys$52; sys$23++) {
        k = sys$33[sys$23];
        v = sys$42[k];
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
  if (data[sys$6]) {
    return data[sys$6];
  }
  ;
  if (data.type == "svg") {
    return data[sys$6] || (data[sys$6] = new SVGAsset(data));
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
    return data[sys$6] || (data[sys$6] = AssetProxy.wrap(data));
  }
  ;
  return data;
}

// serve.imba
var import_http3 = __toModule(require("http"));

// entry:app/index.html
var app_default = asset({input: "entry:app/index.html"});

// serve.imba
var server = import_http3.default.createServer(function(req, res) {
  let body = app_default.body;
  if (process.env.IMBA_HMR || globalThis.IMBA_HMR) {
    body = "<script src='/__hmr__.js'></script>" + body;
  }
  ;
  return res.end(body);
});
serve(server.listen(process.env.PORT || 3e3));
//__FOOT__
