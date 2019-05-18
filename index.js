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
      not: '(?![(\\[])[^\\s,?!:/]'
    },
    tag: '[\\w-]+',
    not: '\\s,.?!',
    delimiter: '\\|?'
  };
  reg.group = { //n = not grouped, g = grouped
    n: '(?:' + reg.attr.start[0] + reg.attr.value[0] + reg.attr.end[0] + '|' + reg.attr.start[1] + reg.attr.value[1] + reg.attr.end[1] + ')',
    g: '(?:' + reg.attr.start[0] + '(' + reg.attr.value[0] + ')' + reg.attr.end[0] + '|' + reg.attr.start[1] + '(' + reg.attr.value[1] + ')' + reg.attr.end[1] + ')'
  }
  reg.ref = reg.href.case + reg.href.amplfr + '(?:' + reg.href.not + '*?|' + reg.group.n + ')';
  reg.attrib = '(?:' + reg.ref + ')?(?::' + reg.attr.name + reg.group.n + '?)';
  reg.combiTag = '((?:' + reg.tag + reg.attrib + '*\\+)*)';
  reg.base = '(?!-)(' + reg.tag + ')(' + reg.attrib + '*)';

  //Holding all parsing relevant expressions
  const rgx = {
    attributes: '(?:(' + reg.ref + ')|:(' + reg.attr.name + ')' + reg.group.g + '?)(?=:|$)',
    ref: reg.href.case + '(' + reg.href.amplfr + ')(?:(' + reg.href.not + '*)|' + reg.group.g + ')',
    combiTags: '(?:(' + reg.tag + ')(' + reg.attrib + '*)\\+)',
    singleWord: reg.delimiter + '(?!-)' + reg.combiTag + '(' + reg.tag + ')(' + reg.attrib + '*)\\/\\/(?!>)([^'+reg.not+']+?)(?!\\/\\/)(?:\\|(?=[^'+reg.not+'])|(?=$|['+reg.not+']))',
    multiWord: reg.delimiter + reg.base + '<\\/\\/((?:.(?!<\\/\\/))*?)\\/\\/>',
    singleTag: '\\/' + reg.base + '!\\/\\/'
  };

  //Converting everything in rgx into a (global) RegExp
  //Obviously, a compiled RegExp is faster than needing to compile it anew every call
  (function() {
    const rgxKeys = Object.keys(rgx);
    for (var i = 0; i < rgxKeys.length; i++) rgx[rgxKeys[i]] = new RegExp(rgx[rgxKeys[i]], 'g');
  })();

  const comp = {
    ref: function(ref, content = false) {
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
    attributes: function(attribs, content = false) {
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
    singleWord: function(str) {
      return str.replace(rgx.singleWord, function(match, combiTags, tag, attr, content) {
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
      });
    },
    multiWord: function(str) {
      //Indefinite looping required as tags can be nested, leading to an imprecise global match
      while(rgx.multiWord.test(str)) {
        str = str.replace(rgx.multiWord, function(match, tag, attr, content) {
          attr = comp.attributes(attr, content);
          return '<' + tag + attr + '>' + content + '</' + tag + '>';
        });
      }
      return str;
    },
    singleTag: function(str) {
      return str.replace(rgx.singleTag, function(match, tag, attr) {
        attr = comp.attributes(attr);
        return '<' + tag + attr + '>';
      });
    }
  }

  argon.rgx = rgx;
  argon.comp = comp;
})();

argon.parse = function(string) { //on npm with `exports`
  string = argon.comp.singleWord(string);
  string = argon.comp.multiWord(string);
  string = argon.comp.singleTag(string);
  return string;
}
