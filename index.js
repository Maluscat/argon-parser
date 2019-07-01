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
    empty: '\\.|',
    tag: '[\\w-]+',
    not: '\\s,.?!',
    delimiter: '\\|?'
  };
  reg.singleNot = '';
  reg.multiBase = new Array(reg.multi.start.length);
  (function() { //Constructing the syntax variations at multiWord tags
    for (var i = 0; i < reg.multiBase.length; i++) {
      reg.singleNot += reg.multi.end[i];
      reg.multiBase[i] = reg.multi.start[i] + '\\/\\/((?:[\\d\\D](?!'+reg.multi.start[i]+'\\/\\/))*?)\\/\\/' + reg.multi.end[i];
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
    attributes: '(?:(' + reg.ref + ')|:(' + reg.attr.name + ')' + reg.group.g + '?)(?=:|$)',
    ref: reg.href.case + '(' + reg.href.amplfr + ')(?:(' + reg.href.not + '*)|' + reg.group.g + ')',
    combiTags: '(?:(' + reg.tag + ')(' + reg.attrib + '*)\\+)',
    singleWord: reg.delimiter + reg.combiTag + '\\/\\/' + reg.singleNot + '(?:'+reg.empty+'([^'+reg.not+']+?)(?!\\/\\/)(?:\\|(?=[^'+reg.not+'])|(?=$|['+reg.not+'])))',
    multiWord: reg.delimiter + reg.combiTag + '(?:' + reg.multiBase[0] + '|' + reg.multiBase[1] + ')',
    singleTag: '\\/(?!-)' + reg.base + '!\\/\\/'
  };

  //Converting everything in rgx into a (global) RegExp
  //Obviously, a compiled RegExp is faster than needing to compile it anew every call
  (function() {
    const rgxKeys = Object.keys(rgx);
    for (var i = 0; i < rgxKeys.length; i++) rgx[rgxKeys[i]] = new RegExp(rgx[rgxKeys[i]], 'g');
  })();

  const comp = { //components
    ref: function(ref, content) {
      content = content != null ? content : false;
      return ref.replace(rgx.ref, function(match, amplifier, value, value2, value3) {
        //value = normal # value; value2 = # round brackets; value3 = # square brackets
        let val = (value ? value : (value2 ? value2 : (value3 ? value3 : null)));
        if (val == null && content) {
          if (amplifier == '!') {
            val = 'https://' + content;
          } else if (amplifier == '?') {
            val = 'http://' + content;
          } else {
            val = '#' + content;
          }
        } else if (val != null) {
          if (amplifier == '!') {
            val = 'https://' + val;
          } else if (amplifier == '?') {
            val = 'http://' + val;
          } else {
            val = '#' + val;
          }
        } else {
          console.error("Argon error: Couldn't parse a ‘href’ attribute with the special implicit ‘#’ case - no content available. Occured at '" + match + "'.");
          return '';
        }
        return 'href="' + val + '"';
      });
    },
    attributes: function(attribs, content) {
      content = content != null ? content : false;
      if (attribs) {
        return attribs.replace(rgx.attributes, function(match, ref, name, value, value2) {
          //value = round brackets; value2 = square brackets
          if (ref) {
            return ' ' + comp.ref(ref, content);
          } else {
            const val = (value != null ? value : value2);
            return (val != null ? ' ' + name + '="' + val + '"' : ' ' + name);
          }
        });
      } else return '';
    },
    baseTag: function(str, expr, dry) {
      return str.replace(expr, function(match, combiTags, tag, attr, value, value2) {
        const content = value != null ? value : (typeof value2 == 'string' ? value2 : '');
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
