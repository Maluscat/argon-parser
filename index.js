const argon = {};

(function() {
  //Parts and dependencies for rgx
  const reg = {
    attr: {
      name: '[\\w-]+',
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
      amplfr: '[?!]?',
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
    delimiter: '\\|?'
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
    placeholder: '\\$(?:{(\\w+)})?',
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
    placeholder: function(str, content) {
      if (content) {
        return str.replace(rgx.placeholder, function(match, flags) {
          let val = content;
          let snake = true;
          if (flags) {
            flags = flags.split('');
            for (let i = 0; i < flags.length; i++) {
              if (flags[i] == 'r') {
                snake = false;
              } else if (filters.rare.indexOf(flags[i]) != -1) {
                snake = false;
                val = (filters[flags[i]])(val);
              } else val = (filters[flags[i]])(val);
            }
          }
          return snake ? val.replace(/\s/g, '-') : val;
        });
      } else return str;
    },
    ref: function(ref, content) {
      content = content != null ? content : false;
      return ref.replace(rgx.ref, function(match, amplifier, value, value2, value3) {
        //value = normal # value; value2 = # round brackets; value3 = # square brackets
        let val = value != null ? value : (value2 != null ? value2 : (value3 != null ? value3 : null));
        if (val == null && content) {
          content = content.replace(/\s/g, '-');
          if (amplifier == '!') {
            val = 'https://' + content;
          } else if (amplifier == '?') {
            val = 'http://' + content;
          } else {
            val = '#' + content;
          }
        } else if (val != null) {
          val = comp.placeholder(val, content);
          if (amplifier == '!') {
            val = 'https://' + val;
          } else if (amplifier == '?') {
            val = 'http://' + val;
          } else {
            val = '#' + val;
          }
        } else {
          return '';
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
            val = comp.placeholder(val, content);
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

  const filters = {
    rare: [
      's',
      'c',
      'p'
    ],
    s: function(val) {
      return val.replace(/\s/g, '_');
    },
    c: function (val) {
      val = val.toLowerCase();
      return val.replace(/\s[\S\D]/g, function(match) {
        return match.slice(1).toUpperCase();
      });
    },
    p: function (val) {
      val = val[0].toUpperCase() + val.slice(1).toLowerCase();
      return val.replace(/\s[\S\D]/g, function(match) {
        return match.slice(1).toUpperCase();
      });
    },
    l: function (val) {
      return val.toLowerCase();
    },
    u: function (val) {
      return val.toUpperCase();
    }
  }

  argon.rgx = rgx;
  argon.comp = comp;
})();

//`exports` for npm, `argon` for the web
(typeof exports != 'undefined' && exports != null ? exports : argon).parse = function(string, dry) {
  dry = dry === true ? dry : false;
  string = argon.comp.singleWord(string, dry);
  string = argon.comp.multiWord(string, dry);
  string = argon.comp.singleTag(string, dry);
  return string;
}
