const argon = {};
const obj = (typeof exports != 'undefined' && exports != null ? exports : argon);

(function() {
  //Parts and dependencies for rgx
  const reg = {
    attr: {
      name: '[\\w-${}]+',
      value: [
        '(?:(?!\\):).)+?',
        '(?:(?!\\]:).)+?'
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
      not: '(?![(\\[])[^\\s,?!:<{]'
    },
    multi: {
      start: [
        '\\<',
        '\\{'
      ],
      end: [
        '\\>',
        '\\}'
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
    all: '[\\d\\D]',
    tag: '\\w-',
    not: "\\s,?!:'()\\[\\]",
    delimiter: '\\|',
    flags: '(?:{((?:\\w+;?)+?)})'
  };
  //Note to self: delimitStart HAS to be put above the reg.tag redeclaration (commit f201e5d and following)
  reg.delimitStart = '([' + reg.tag + reg.esc.char + ']' + reg.delimiter + ')?';
  reg.tag = '[' + reg.tag + ']+'; //Reusing the variable
  reg.dotNot = '\\.(?:$|[' + reg.not + '.|' + '])';

  (function() {
    reg.multiStops = '\\/\\/';
    reg.multiStops += '[';
    for (var i = 0; i < reg.multi.end.length; i++) reg.multiStops += reg.multi.end[i];
    reg.multiStops += ']';
  })();

  (function() {
    reg.singlePlus = '';
    for (var i = 0; i < reg.bracket.start.length; i++) {
      reg.singlePlus += '(' + reg.bracket.start[i] + '(?:(?!' + reg.dotNot + ')[^' + reg.not + '])+?' + reg.bracket.end[i] + ')' + (i < reg.bracket.start.length - 1 ? '|' : '');
    }
  })();

  (function() { //Constructing the syntax variations at multiWord tags
    reg.singleNot = '';
    reg.multiBase = '';
    for (var i = 0; i < reg.multi.start.length; i++) {
      reg.singleNot += reg.multi.end[i];
      reg.multiBase += reg.multi.start[i] + '\\/\\/((?:' + reg.all + '(?!'+reg.multi.start[i]+'\\/\\/))*?)\\/\\/' + reg.multi.end[i] + (i < reg.multi.start.length - 1 ? '|' : '');
    }
    reg.singleNot = '(?![' + reg.singleNot + '])';
  })();

  (function() {
    reg.attrGroup = {};
    for (var i = 0; i < 2; i++) {
      //n = not grouped, g = grouped
      const target = i === 0 ? 'n' : 'g';
      const val = reg.attr.value;
      if (target == 'g')
        for (var n = 0; n < val.length; n++) val[n] = '(' + val[n] + ')';
      reg.attrGroup[target] = '(?:';
      for (var n = 0; n < reg.attr.start.length; n++) {
        reg.attrGroup[target] += reg.attr.start[n] + val[n] + reg.attr.end[n] + (n != reg.attr.start.length - 1 ? '|' : '');
      }
      reg.attrGroup[target] += ')';
    }
  })();

  reg.ref = reg.href.case + reg.href.amplfr + '(?:' + reg.href.not + '*?|' + reg.attrGroup.n + ')';
  reg.attrib = '(?:' + reg.ref + ')?(?::' + reg.attr.name + reg.attrGroup.n + '?)';
  reg.base = '(' + reg.tag + ')(' + reg.attrib + '*)';
  reg.combiTag = '(' + reg.esc.char + ')?(?!-)((?:' + reg.tag + reg.attrib + '*\\+)*)' + reg.base;

  //Holding all parsing relevant expressions
  const rgx = {
    placeholder: '\\$' + reg.flags + '?|{(' + reg.all + '+)}' + reg.flags,
    attributes: '(?:(' + reg.ref + ')|:(' + reg.attr.name + ')' + reg.attrGroup.g + '?)(?=:|$)',
    ref: reg.href.case + '(' + reg.href.amplfr + ')(?:(' + reg.href.not + '*)|' + reg.attrGroup.g + ')$',
    combiTags: '(?:(' + reg.tag + ')(' + reg.attrib + '*)\\+)',
    singleWord: reg.delimitStart + reg.combiTag + '\\/\\/' + reg.singleNot + '(?:'+reg.empty+'([^'+reg.not+']+?)(?:'+reg.delimiter+'(?=[^'+reg.not+'])|(?=$|'+reg.multiStops+'|'+reg.dotNot+'|['+reg.not+']))|' + reg.singlePlus + ')',
    multiWord: reg.delimitStart + reg.combiTag + '(?:' + reg.multiBase + ')',
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
        text = text.replace(/"/g, '\\"');
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
            if (val) {
              val = comp.placeholder(val, content);
              val = val.replace(/"/g, '\\"');
            }
            name = comp.placeholder(name, content);
            return (val != null ? ' ' + name + '="' + val + '"' : ' ' + name);
          }
        });
      } else return '';
    },
    baseTag: function(str, expr, dry, multiEsc) {
      let strLenAdd = 0;
      return str.replace(expr, function(match, delimited, escaped, combiTags, tag, attr, value, value2, value3) {
        //value3 is the substring position when this function is testing multiWord
        const content = value != null ? value : (value2 != null ? value2 : (typeof value3 == 'string' ? value3 : ''));
        //This is a workaround to the badly supported RegExp lookbehinds, an ES2018 feature
        const leading = delimited ? delimited.slice(0, 1) : '';
        if (escaped) {
          let newMatch = match.slice(1);
          //Because multiEsc is always and only present with multiWord, using value3 is safe here
          if (multiEsc) {
            for (var i = 0; i < multiEsc.length; i++) {
              if (value3 + strLenAdd < multiEsc[i][0]) multiEsc[i][0] += 1;
            }
            newMatch = newMatch.slice(0, tag.length + 1) + '!' + newMatch.slice(tag.length + 1, -1) + '!' + '>';
            multiEsc.push([
              value3 + strLenAdd + tag.length + 1, //First '!' index
              newMatch.length - tag.length - 3 //length until last '!'
            ]);
          }
          return leading + newMatch;
        } else if (dry) {
          return leading + content;
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
          const result = leading + startTag + content + endTag;
          strLenAdd += result.length - match.length;
          if (multiEsc) {
            for (var i = 0; i < multiEsc.length; i++) {
              if (value3 + match.length < multiEsc[i][0])
                multiEsc[i][0] += strLenAdd;
              else
                multiEsc[i][0] += strLenAdd - (endTag.length - "//>".length);
            }
          }
          return result;
        }
      });
    },
    singleWord: function(str, dry) {
      return comp.baseTag(str, rgx.singleWord, dry);
    },
    multiWord: function(str, dry) {
      const escIndices = new Array();
      //Indefinite looping required as tags can be nested, leading to an imprecise global match
      while(rgx.multiWord.test(str)) {
        str = comp.baseTag(str, rgx.multiWord, dry, escIndices);
      }
      for (let i = 0; i < escIndices.length; i++) {
        str = str.slice(0, escIndices[i][0]) + str.slice(escIndices[i][0] + 1, escIndices[i][0] + escIndices[i][1]) + str.slice(escIndices[i][0] + escIndices[i][1] + 1);
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
