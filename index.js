const argon = {};
const obj = (typeof exports != 'undefined' && exports != null ? exports : argon);

(function() {
  //Parts and dependencies for rgx
  const reg = {
    attr: {
      name: '[\\w-${}]+',
      value: [
        '[^()]+',
        '[^\\[\\]]+'
      ],
      start: [
        '\\(',
        '\\['
      ],
      end: [
        '\\)',
        '\\]'
      ]
    },
    href: {
      case: '#',
      amplfr: '[?!&]?',
      not: '(?![(\\[])[^\\s,?!:<{/]'
    },
    multi: {
      start: [
        '\\<',
        '\\{'
      ],
      end: [
        '\\>',
        '\\}',
      ]
    },
    bracket: {
      start: [
        '\\(',
        '\\['
      ],
      end: [
        '\\)',
        '\\]'
      ]
    },
    empty: '\\.|',
    tag: '[\\w-]+',
    not: "\\s,?!:'()\\[\\]",
    delimiter: '\\|?',
    flags: '(?:{((?:\\w+;?)+?)})'
  };
  reg.altNot = '\\.[' + reg.not + '.|' + ']';
  reg.singlePlus = '';
  (function() {
    for (var i = 0; i < reg.bracket.start.length; i++) {
      reg.singlePlus += '(' + reg.bracket.start[i] + '(?:(?!' + reg.altNot + ')[^' + reg.not + '])+?' + reg.bracket.end[i] + ')' + (i < reg.bracket.start.length - 1 ? '|' : '');
    }
  })();
  reg.singleNot = '';
  reg.multiBase = '';
  (function() { //Constructing the syntax variations at multiWord tags
    for (var i = 0; i < reg.multi.start.length; i++) {
      reg.singleNot += reg.multi.end[i];
      reg.multiBase += reg.multi.start[i] + '\\/\\/((?:[\\d\\D](?!'+reg.multi.start[i]+'\\/\\/))*?)\\/\\/' + reg.multi.end[i] + (i < reg.multi.start.length - 1 ? '|' : '');
    }
    reg.singleNot = '(?![' + reg.singleNot + '])';
  })();
  reg.group = { //n = not grouped, g = grouped
    n: '(?:' + reg.attr.start[0] + reg.attr.value[0] + reg.attr.end[0] + '|' + reg.attr.start[1] + reg.attr.value[1] + reg.attr.end[1] + ')',
    g: '(?:' + reg.attr.start[0] + '(' + reg.attr.value[0] + ')' + reg.attr.end[0] + '|' + reg.attr.start[1] + '(' + reg.attr.value[1] + ')' + reg.attr.end[1] + ')'
  }
  reg.ref = reg.href.case + reg.href.amplfr + '(?:' + reg.href.not + '*?|' + reg.group.n + ')';
  reg.attrib = '(?:' + reg.ref + ')?(?::' + reg.attr.name + reg.group.n + '?)';
  reg.base = '(' + reg.tag + ')(' + reg.attrib + '*)';
  reg.combiTag = '(?!-)((?:' + reg.tag + reg.attrib + '*\\+)*)' + reg.base;

  //Holding all parsing relevant expressions
  const rgx = {
    placeholder: '\\$' + reg.flags + '?|{([\\d\\D]+)}' + reg.flags,
    attributes: '(?:(' + reg.ref + ')|:(' + reg.attr.name + ')' + reg.group.g + '?)(?=:|$)',
    ref: reg.href.case + '(' + reg.href.amplfr + ')(?:(' + reg.href.not + '*)|' + reg.group.g + ')',
    combiTags: '(?:(' + reg.tag + ')(' + reg.attrib + '*)\\+)',
    singleWord: reg.delimiter + reg.combiTag + '\\/\\/' + reg.singleNot + '(?:'+reg.empty+'([^'+reg.not+']+?)(?:\\|(?=[^'+reg.not+'])|(?=$|'+reg.altNot+'|['+reg.not+']))|' + reg.singlePlus + ')',
    multiWord: reg.delimiter + reg.combiTag + '(?:' + reg.multiBase + ')',
    singleTag: '\\/(?!-)' + reg.base + '!\\/\\/'
  };

  //Converting everything in rgx into a (global) RegExp
  //Obviously, a compiled RegExp is faster than needing to compile it anew every call
  (function() {
    const rgxKeys = Object.keys(rgx);
    for (var i = 0; i < rgxKeys.length; i++) rgx[rgxKeys[i]] = new RegExp(rgx[rgxKeys[i]], 'g');
  })();
  const comp = { //components
    flags: function(str, filters, content) {
      let kebab = true;
      filters = filters.split(';');
      if (filters.length == 1) filters = filters[0].split('');
      if (!filters[filters.length - 1]) filters.pop();
      filters.forEach(function(flag) {
        if (flag == 'r' || flag == 'raw') {
          kebab = false;
          return;
        }
        const name = flags.names[flag];
        if (!name) {
          console.error("Argon error: flag ‘" + flag + "’ does not exist (case ‘" + content + "’ at flagged string ‘" + str + "’). Skipping the flag.");
          return;
        }
        if (flags.raw.indexOf(name) != -1) kebab = false;
        const res = (flags.flags[name])(str);
        str = res != null ? res : str;
      });
      return kebab ? str.replace(/\s/g, '-') : str;
    },
    placeholder: function(str, content) {
      if (content) {
        return str.replace(rgx.placeholder, function(match, filters, value2, filters2) {
          let val;
          if (value2) {
            val = comp.placeholder(value2, content);
            if (filters2) val = comp.flags(val, filters2, content);
          } else {
            val = content;
            val = filters ? comp.flags(val, filters, content) : val = val.replace(/\s/g, '-');
          }
          return val;
        });
      } else return str;
    },
    ref: function(ref, content) {
      content = content != null ? content : false;
      return ref.replace(rgx.ref, function(match, amplifier, value, value2, value3) {
        //value = normal # value; value2 = # round brackets; value3 = # square brackets
        let val = value || value2 || value3 || null;
        if (val == null && content) {
          content = content.replace(/\s/g, '-');
          var text = content;
        } else if (val != null) {
          val = comp.placeholder(val, content);
          var text = val;
        } else return '';
        switch (amplifier) {
          case '!':
            val = 'https://' + text;
            break;
          case '?':
            val = 'http://' + text;
            break;
          case '&':
            val = text;
            break;
          default:
            val = '#' + text;
        }
        return ' href="' + val + '"';
      });
    },
    attributes: function(attribs, content) {
      content = content != null ? content : false;
      if (attribs) {
        return attribs.replace(rgx.attributes, function(match, ref, name, value, value2) {
          //value = round brackets; value2 = square brackets
          if (ref) {
            return comp.ref(ref, content);
          } else {
            let val = (value != null ? value : value2);
            if (val) val = comp.placeholder(val, content);
            name = comp.placeholder(name, content);
            return (val != null ? ' ' + name + '="' + val + '"' : ' ' + name);
          }
        });
      } else return '';
    },
    baseTag: function(str, expr, dry) {
      return str.replace(expr, function(match, combiTags, tag, attr, value, value2, value3) {
        const content = value != null ? value : (value2 != null ? value2 : (typeof value3 == 'string' ? value3 : ''));
        if (dry) {
          return content;
        } else {
          attr = comp.attributes(attr, content);
          let startTag = '<' + tag + attr + '>';
          let endTag = '</' + tag + '>';
          if (combiTags) {
            startTag = combiTags.replace(rgx.combiTags, function(multiTags, extraTag, attribs) {
              endTag += '</' + extraTag + '>';
              attribs = comp.attributes(attribs, content);
              return '<' + extraTag + attribs + '>';
            }) + startTag;
          }
          return startTag + content + endTag;
        }
      });
    },
    singleWord: function(str, dry) {
      return comp.baseTag(str, rgx.singleWord, dry);
    },
    multiWord: function(str, dry) {
      //Indefinite looping required as tags can be nested, leading to an imprecise global match
      while(rgx.multiWord.test(str)) {
        str = comp.baseTag(str, rgx.multiWord, dry);
      }
      return str;
    },
    singleTag: function(str, dry) {
      return str.replace(rgx.singleTag, function(match, tag, attr) {
        if (dry) {
          return '';
        } else {
          attr = comp.attributes(attr);
          return '<' + tag + attr + '>';
        }
      });
    }
  }

  const flags = {
    names: {
      'raw': 'r',
      'r': 'r'
    },
    raw: [],
    flags: {
      'r': true
    }
  }

  function flagDupeError(item) {
    console.error('Argon error @ addFlag: Flag name ‘' + item + '’ already exists. Flag name dropped - continuing without it.\nAliases for the duplicate name: ' + (Object.keys(flags.names).reduce(function(prev, current) {
      return prev += flags.names[current] == flags.names[item] ? (prev ? ', ' : '') + '‘' + current + '’' : '';
    }, '') || '// none'));
  }

  obj.addFlag = function(name, funct, raw) {
    if (typeof name != 'string' && !Array.isArray(name)) {
      console.error('Argon error @ addFlag: The first parameter (name/names of the flag) (case ‘' + name + '’) is neither a String nor an Array. Aborting process.');
      return;
    }
    if (typeof funct != 'function') {
      console.error('Argon error @ addFlag: The second parameter (function of the flag) (case ‘' + funct + '’) is not a valid function. Aborting process.');
      return;
    }
    if (raw !== true) raw = false; //default parameters don't work in IE (reee)
    if (Array.isArray(name)) {
      while (true) {
        if (name[0] != null && flags.names[name[0]] != null) {
          flagDupeError(name[0]);
          name.shift();
        } else if (name[0] == null) {
          console.error('Argon error @ addFlag: Every possible flag name has been duplicate. Dropping the flag altogether.');
          break;
        } else {
          flags.flags[name[0]] = funct;
          if (raw) flags.raw.push(name[0]);
          break;
        }
      }
      name.forEach(function(alias) {
        if (flags.names[alias] != null) {
          flagDupeError(alias);
        } else flags.names[alias] = name[0];
      });
    } else {
      if (flags.names[name] != null) {
        flagDupeError(name);
      } else {
        flags.flags[name] = funct;
        flags.names[name] = name;
        if (raw) flags.raw.push(name);
      }
    }
  }

  obj.rgx = rgx;
  obj.comp = comp;
})();

obj.addFlag(['s', 'snake'], function(val) {
  val = val.toLowerCase();
  return val.replace(/\s/g, '_');
}, true);
obj.addFlag(['c', 'camel'], function (val) {
  val = val.toLowerCase();
  return val.replace(/\s[\S\D]/g, function(match) {
    return match.slice(1).toUpperCase();
  });
}, true);
obj.addFlag(['p', 'pascal'], function (val) {
  val = val[0].toUpperCase() + val.slice(1).toLowerCase();
  return val.replace(/\s[\S\D]/g, function(match) {
    return match.slice(1).toUpperCase();
  });
}, true);
obj.addFlag(['l', 'low'], function (val) {
  return val.toLowerCase();
});
obj.addFlag(['u', 'up'], function (val) {
  return val.toUpperCase();
});

//`exports` for npm, `argon` for the web
obj.parse = function(string, dry) {
  if (dry !== true) dry = false; //default parameters don't work in IE (reee)
  string = obj.comp.singleWord(string, dry);
  string = obj.comp.multiWord(string, dry);
  string = obj.comp.singleTag(string, dry);
  return string;
}
