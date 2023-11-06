/**
 更新：
 循环表达式时，直接取多层节点时的BUG
 已支持：
 例：[[#root.rows[0].rs   ]]
 ....
 [[/root]]
 
 -------2018-06-06 --------------
 **/
const eachTp =
    "G.each({3},{4},function({1},{2}){G.add({2},{1});var $this={2};with($this||{}){",
  varReg = /(\^*\$[.\w]+)|((["'])[^\3]+?\3)|(\^*[a-z]\w*)|(\d+)/gi,
  tpReg = /\[\[(.+?)\]\]/g,
  keyReg = /^(set|if|elseif|else|each|gdata|include|expr)(?:\s+(.+))?$/,
  RegInc = /\[\[include\s+(\S.+?)\]\]/g,
  RegAttr = /(\w+)\s*=\s*(''|""|(['"]?)(\d+|.+?)\3)/g,
  C = ".zh-t",
  class2type = {};
function $() {}
$.extend = (...args) => {
  if (!args[0]) return a1;
  return Object.assign.apply(Object, args);
};

"Boolean Number String Function Array Date RegExp Object Error Symbol"
  .split(" ")
  .forEach((name, i) => {
    class2type["[object " + name + "]"] = name.toLowerCase();
  });

$.type = (obj) => {
  if (obj == null) {
    return obj + "";
  }
  return typeof obj === "object" || typeof obj === "function"
    ? class2type[toString.call(obj)] || "object"
    : typeof obj;
};
$.isFunction = function (a) {
  return "function" === $.type(a);
};
var _T = {
  cnts: [],
  init: function (v) {
    this.cnts = [[v]];
  },
  add: function (v, ev, m) {
    this.cnts.push([v, ev, m]);
  },
  rm: function () {
    this.cnts.pop();
  },
  each: function (obj, attr, fn) {
    if (!obj) return;
    if (obj instanceof Array) {
      attr.cond &&
        (obj = obj.filter(
          new Function("$value", "with($value ||{}){return " + attr.cond + "}")
        ));
      attr.sort && (obj = obj.slice(0).sort(attr.sort));
      var n = Math.min(obj.length, (attr.size || obj.length) * 1);
      for (var i = 0; i < n; i++) fn(i, obj[i]);
    } else {
      for (var k in obj) fn(k, obj[k]);
    }
  },
  get: function (k, n) {
    var { cnts } = this;
    var i = cnts.length,
      n = n || 0;
    i = i < n ? 0 : i - n;
    if (k == "$value") return cnts[i][0];
    if (k == "$index") return cnts[i][1];
    //console.info( 'get 0', i, k )
    while (i--) {
      var o = cnts[i][0];
      if (!o) return "";
      if (/[\.\[\]]/.test(k)) {
        var v = "";
        try {
          v = eval("o." + k);
          if (v !== undefined) return v;
        } catch (e) {}
      } else if (k in o) return o[k];
    }
    return "";
  },
};

function toCode(str) {
  return (
    'out.push("' + str.replace(/"/g, '\\"').replace(/[\r\n]/g, "\\n") + '");'
  );
}
function toVar(str) {
  return str.replace(varReg, function (_, a, b, c, d) {
    if (d) {
      var ms = d.match(/^(\^+)(.+)/),
        n = 0;
      if (ms) {
        d = ms[2];
        n = ms[1].length;
      }
    }
    return d
      ? 'G.get("' + d + '",' + n + ")"
      : a
      ? a == "$get"
        ? "G.get"
        : a
      : _;
  });
}

function getArgs(code) {
  var re = [{}, []];
  code = code
    .replace(RegAttr, function (_, a, b) {
      re[0][a] = b.replace(/^['"]|['"]$/g, "");
      return "";
    })
    .trim();
  re[1] = code.match(varReg);
  re[1] &&
    (re[1] = re[1].map(function (v) {
      return v.replace(/^['"]|['"]$/g, "");
    }));
  return re;
}
function fmt(o, hold) {
  return typeof o == "object"
    ? this.replace(/\{(\w+)\}/g, function (_, k) {
        return o[k] == null ? (hold ? _ : "") : o[k];
      })
    : this.fmt(arguments);
}
String.prototype.fmt = fmt;
var gidx = 0;
function gdata(code) {
  var args = getArgs(code);
  return '(function(){ G.add($this=$.sPost("{0}"),null,{1});'.fmt(
    args[1][0],
    JSON.stringify(args[0])
  );
}
function expr(code) {
  return "with($this){ out.push(" + code + "); } ;";
}
function setV(code) {
  var m = code.match(/(\w+)=(.+)/);
  return m ? "with($this){$v['{1}']={2} };".fmt(m) : "";
}
function parCmd(code) {
  var re = null,
    c = code.charAt(0);
  if ((re = code.match(keyReg))) {
    var k = re[1];
    return k == "if"
      ? "if(" + toVar(re[2]) + "){"
      : k == "elseif"
      ? "else if(" + toVar(re[2]) + "){"
      : k == "else"
      ? "}else{"
      : k == "gdata"
      ? gdata(re[2])
      : k == "expr"
      ? expr(re[2])
      : k == "set"
      ? setV(code)
      : toVar(code);
  } else if (c == "#") {
    var att = code.trim().split(" ");
    return eachTp.fmt(
      0,
      "$index",
      "$value",
      att[0].substring(1).replace(/\$get\b/g, "G.get"),
      att.length > 1 ? JSON.stringify(getArgs(code)[0]) : "{}"
    );
  } else if (c == "/") {
    return code == "/if"
      ? "}"
      : code == "/gdata"
      ? "})();G.rm();"
      : "G.rm();}});";
    //return  code=='/if'?'}':'G.rm();});'
  } else if (c == "?") {
    var cs = code.substr(1).trim().split(":");
    return (
      "out.push(" +
      toVar(cs[0]) +
      "?" +
      toVar(cs[1]) +
      ":" +
      toVar(cs[2]) +
      ");"
    );
  } else if (c == "@") {
    var i = code.indexOf("("),
      name = code.substring(1, i),
      args = toVar(code.substr(i));
    return 'out.push(ZhTemplate.fns["{0}"]?ZhTemplate.fns["{0}"]{1}:"");'.fmt(
      name,
      args
    );
  } else {
    return "out.push(" + toVar(code) + ");";
  }
}
var fns = {};

global.ZhTemplate = $.extend(
  function (k, el, data) {
    return fns[k];
  },
  {
    _tp: function () {
      $.extend(this, _T);
      this.cnts = [];
    },
    _rp: function (str) {
      return str.replaceAll("\x04\x04", '\\"');
    },
    getCode: function (input) {
      input = input.replaceAll('\\"', "\x04\x04");
      if (!input) return "";
      var si = 0,
        re = null,
        cs = [
          "var out=[],G=new $T._tp(),$v={};G.init($this);with($this||{}){ with(ZhTemplate.fns){",
        ];
      while ((re = tpReg.exec(input)) != null) {
        cs.push(toCode(input.substring(si, re.index)));
        cs.push(parCmd(re[1]));
        si = re.index + re[0].length;
      }
      var endStr = input.substring(si);
      endStr && cs.push(toCode(endStr));
      cs.push(" }} return $T._rp(out.join(''))");
      // cs.forEach((v,i)=>str+=(i?'\n':'')+v  );
      //.replaceAll('\\"', '\x04\x04')
      return cs.join("\n");
    },
    compile: function (code, key = "default", el, data) {
      var f = (fns[key] = new Function("$this", this.getCode(code)));
      f.cfg = { el: el, data: data, key: key };
      f.refresh = this.refresh;
      f.render = this.render;
      return f;
    },
    loadTemplate: function (key, url) {
      $.get(url, function (d) {
        ZhTemplate.compile(key, d);
      });
    },
    refresh: function (el, data) {
      var { cfg } = this;
      data && (cfg.data = data);
      el && (cfg.el = el);
      return this.render(cfg);
    },
    render: function () {
      var cfg = {},
        args = arguments;
      if (args.length == 1) {
        cfg = args[0];
      } else if (args.length) {
        cfg = {
          key: args[0],
          data: args[1],
          cb: args[2],
        };
      }
      var f = $.isFunction(cfg.key) ? cfg.key : fns[cfg.key],
        html;
      if (!f) return;
      f.cfg = cfg;
      //var el=$(cfg.el),html;

      function write(k, d) {
        html = f ? f(d) : "";
        //el.prop('tagName')=='SCRIPT'? el.before(html) :el.html(html)
        cfg.cb && cfg.cb(html);
      }
      if (typeof cfg.data == "string") {
        if (cfg.data.match(/^[{[]/)) {
          try {
            var d = new Function("return  " + d.trim())();
          } catch (e) {}
          write(f, d);
        } else {
          write(f, {});
        }
      } else {
        write(f, cfg.data);
      }
      return html;
    },
    fns: {
      $cut: (s, n, more) => {
        return (s + "").cut(n, more);
      },
      $len: (s) => {
        return s instanceof Array ? s.length : s ? (s + "").length : 0;
      },
      $isEmpty: $.isEmptyObject,
      $format: function (s, f) {
        return (parseFloat(s) || 0).fmt(f);
      },
      $formatDate: (s, f) => {
        var d = $.type(s) == "date" ? s : (s + "").toDate();
        if (!d) return "";
        return d.fmt(f);
      },
      $now: (f) => {
        var d = new Date();
        return d.fmt(f);
      },
      $encode: (s) => {
        return encodeURIComponent(s);
      },
      $get: (k, n) => {
        return (this.get ? this.get : _T.get)(k, n);
      },
      $case: () => {
        var kvs = arguments,
          val = kvs[0],
          L = kvs.length,
          i = 1;
        while (i < L) {
          if (kvs[i] == val) return kvs[i + 1];
          i += 2;
        }
        return L % 2 == 0 ? kvs[L - 1] : null;
      },
      $log: function () {
        console.log.apply(console, arguments);
        return "";
      },
    },
  }
);
global.$T = ZhTemplate;
export default ZhTemplate;
