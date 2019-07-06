# Argon parser
(A full introduction and documentation will (hopefully) soon be delivered on my website)

- [Introduction](#introduction)
- [Getting started](#getting-started)
- [Code documentation](#code-documentation)
- [Syntax documentation](#syntax-documentation)
- [Flag documentation](#flag-documentation)
- [Licensing](#licensing)
---
## Introduction
While converting a large documentation into a JSON format, I was quickly getting tired of writing the large amount of HTML tags by hand. That's why I began thinking of a simple, sophisticated syntax for writing HTML snippets which should increase the productivity by being very easy to write while decreasing tiring boilerplate, being only as minimal as needed to be distinguishable and efficient - and it's here: _Argon_

---
## Getting started
### Via Node.js
Argon is present [as a module on](https://www.npmjs.com/package/argon-parser) [npm](https://www.npmjs.com) to be used with [Node.js](https://nodejs.org). To get it as dependency, you install it into your project:
```
npm install argon-parser
```
Obviously, [Yarn](https://yarnpkg.com) works too as it uses the npm package registry for its packages as well:
```
yarn add argon-parser
```
### In the browser
Argon can also be used directly in the browser:
#### Automatic fetching
One way to do that is to fetch the script from its repository's website directly in your HTML file:
```
<script src="https://hallo89.github.io/argon-parser/index.js"></script>
```
This allows you to always have the latest version when it gets pushed to GitHub. However, as this doesn't utilize [SemVer](https://semver.org) processing, it has a chance to break but this is not very likely as the syntax is pretty much stable already.
#### Downloading it
The other way is, well, download the script from its repo and include it with a script in your HTML file.. That was easy.

---
After having imported the script, you can just go ahead and parse your favorite Argon syntax ([documented below](#syntax-documentation)) by calling the `parse` function - in the `argon` object in the browser or in the assigned variable after requiring on Node.js (See the [code documentation](#code-documentation)).<br>For example: `argon.parse("This is s//probably em<//most likely//> useful")` (outputs `This is <s>probably</s> <em>most likely</em> useful`).<br>
Note that Argon is only made for HTML _snippets_, for example for small segments of formatted text in a database (like the example in the introduction)!<br>
Also note that Argon does not compile into actual elemented HTML, it just converts a string into a different string - Use [innerHTML](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML) or [insertAdjacentHTML](https://developer.mozilla.org/en-US/docs/Web/API/Element/insertAdjacentHTML) for that.

---
## Code documentation
### The main object
All of Argon's properties and methods are accessed through an object:
- On npm, this is obviously just the variable assigned with `require('argon-parser')`
- In the browser, this is a global object called `argon`
### The main function: `parse(string[, dry])`
The `parse` function inside Argon's object is the main access point of Argon
- It converts a passed string of [Argon syntax](#syntax-documentation) into a HTML string
- It only converts a string into another string, not into actual JavaScript HTML elements
#### The dry mode
As of **version 1.2.0**, a second parameter can be defined in `parse`, which is the **dry mode**:
- It is a boolean; `true` turns dry mode on, `false` is the default
- This mode strips the input string from all Argon syntax and does not parse it
- This is for example very useful when having an argonized heading which should be defined as a hash id as well
```
argon.parse("code//Argon is em//pretty nice", true);
```
-> `Argon is pretty nice`
### Adding custom flags: `addFlag(name, callback(value)[, raw])`
From **version 1.3.0**, there's a special system to modify values with short-hand functions, called _flags_, directly inside the to-be-parsed string ([See below](#modifying-values-with-flags) for more info).<br>
The function `addFlag` of the argon object may be used to add custom flags to argon:
- `name` (_String || Array\<String\>_) defines the name or names of the function. It is either a single string or an array of strings to define multiple names which all refer to the same function
- `callback` (_Function_) is the function associated with the flag name/names. It is defined as a function reference (anonymous function or named function without parentheses). The only parameter is the string value the flag is called on. The function ideally returns a modified value (But it can be omitted, then the value won't change)
- `raw` (_Boolean_) defines whether the flag should negate the automatic kebab-case which is applied to the value during the flag handling process
### Internal properties
Two additional properties are stored in the main object which have no relevancy to the user, but are very helpful for developing and maybe other devs want to look into Argon a bit deeper
- `rgx`: An object containing every final [Regular Expression](https://www.regular-expressions.info/) used for parsing
- `comp`: An object containing every component of the parser which can be used for parsing separate parts of the syntax (e.g. `singleWord`)

---
## Syntax documentation
### Simple enclosing tags
```
div<//inner html content//>
```
-> output: `<div>inner html content</div>`

Since **version 1.2.1**, an alternative syntax is available, using the characters `{}`:
```
div{//inner html content//}
```
-> output: `<div>inner html content</div>`
- This latter syntax has been added for snippets which use to-be-escaped `<>` characters
### One word enclosing tags
```
This is strong//Argon parser
```
-> output: `This is <strong>Argon</strong> parser`
- The single word content is stopped by whitespace or any of `. , ? !` (**Up to version 1.3.0**)
- As of **1.3.0**, some changes have been made in that regard:
  - The content is now stopped by whitespace or any of `, ? ! : ' ( ) [ ]`
  - A dot character (`.`) does now only stop the content when it is followed by any of the above or another dot - and then it is not included in the tag content; This allows the syntax to safely enclose URLs or dot-notated code snippets
  - In addition to the bracket word stops: When there is an opening bracket as the first character, a matching closing bracket will not stop the content:
      ```
      HTTP (a em//protocol)
      ```
      -> `HTTP (a <em>protocol</em>)`

      However:
      ```
      HTTP em//(protocol)
      ```
      -> `HTTP <em>(protocol)</em>`

      Obviously, this applies to square brackets as well
### Non-closing tags
```
Let's get to a/br!//new line!
```
-> output: `Let's get to a<br>new line!`
### Tag rules
Tag names may only contain letters (e.g. `a`) and hyphens (`-`), but no hyphen at the beginning
### Subsequent characters
To have a tag directly follow a word, you use a vertical bar (`|`) in between them:
```
Very|strong//important|text
```
-> `Very<strong>important</strong>text`
### Empty tags
Empty tags can be achieved in two ways. For one, enclosing tags can simply be omitted of content:
```
I need an empty span<////> for styling!
```
-> `I need an empty <span></span> for styling!`

However, there's a more convenient way too: Putting a dot directly behind single enclosing tags works too!
```
I need an empty span//. for styling!
```
-> `I need an empty <span></span> for styling!`
- This latter syntax only works for **version 1.3.0** and above
### Combining tags
Using a plus (`+`) sign, tags can be subsequently nested
- This, beside being simply more convenient, allows for accessing the inner content when using [placeholders](#placeholders) or implicit [anchorization](special-attribute-case-href) (with the special hash attribute case)
- **Prior to 1.1.0**, only one word enclosing tags could have additional tags attached to them
```
this is em+strong//important!
```
-> `this is <em><strong>important</strong></em>!`

A more advanced example with attributes and anchorization (see below):
```
Check out a#!:class(anchor)+strong:class(bold)//github.com/hallo89/argon-parser.
```
-> `Check out <a href="https://github.com/Hallo89/argon-parser" class="anchor"><strong class="bold">github.com/Hallo89/argon-parser</strong></a>.`
### Attributes
The beginning of an attribute is marked by a colon (`:`), followed by an attribute name, which is directly followed by a set of round or square brackets containing the attribute value
- An attribute name may only consist of letters, hyphens and placeholder and flag syntax
- When needing a round bracket as part of a value, square brackets must be used and vice versa
- The brackets along with their value may be omitted
```
strong:class(bold ag):id(char-3):onclick[log('content')]:contenteditable//Argon
```
-> `<strong class="bold ag" id="char-3" onclick="log('content')" contenteditable>Argon</strong>`
### Placeholders
As of **version 1.3.0**, placeholders can be embedded into attribute names and attribute values (Also the [special href case](#special-attribute-case-href) values):
- A placeholder is defined as the dollar sign character (`$`)
- It carries the tag content to be expanded at its place
- It can be combined with [flags](#modifying-values-with-flags)

Example:
```
We have a property code#$-property:class($)//value
```
-> `We have a property <code href="#value-property" class="value">value</code>`

By default, whitespaces inside placeholder values are always replaced with hyphens (kebab-case without lowercasing):
```
Kebab case is div:class($)<//a very nice//> case
```
-> `Kebab case is <div class="a-very-nice">a very nice</div> case`
- See the [raw flags section](#raw-flags) below for ways to prevent this

An example with flags (see below for more info):
```
Let's have a code:data-value(${ls}):onclick[${c}()]<//value OBJECT//>
```
-> `Let's have a <code data-value="value_object" onclick="valueObject()">value OBJECT</code>`<br>
(Where `l` = lowercase, `s` = snake case, `c` = camel case; See the [flag reference](#flag-documentation))
### Modifying values with _flags_
**Version 1.3.0** introduced a _flag system_, which allows content to be dynamically run through functions during the parsing process
- These functions are called _flags_, because they are based on being single letters, like RegEx flags. However, they can sure enough be complete words or abbreviations as well
- Because they are loosely connected with placeholders, flags can be used on the same places as placeholders: attribute names and attribute values (also the special href case)
- Flags are appended to content which is then run through the specified flags
- The syntax looks like this: `{content to be modified}{flags}` or when used with a [placeholder](#placeholders), the curly brackets around the content can be omitted: `${flags}`

By default, flags are treated as single characters:
```
Let's modify a strong:class({Yes very nice}{lp})//nice value
```
-> `Let's modify a <strong class="YesVeryNice">nice</strong> value`<br>
(Where `l` = lowercase and `p` = pascal case)

- Flags are processed from left to right, so in the above example, the content is lowercased at first and then pascal-cased

Using semicolons, flags will be treated as words:
```
Let's modify a strong:class({Yes very nice}{low;pascal})//nice value
```
-> Same result as above

The last semicolon may be omitted but when using a single, worded flag, it needs to be added for the parser to understand that it needs to treat it as a word:
```
Let's lowercase a strong:class({Yes very NICE}{low;})//nice value
```
-> `Let's modify a <strong class="yes very nice">nice</strong> value`

Finally, flags can also be infinitely nested, for example like so:
```
A very em:data-$({$-{nice content}{s}}{u})//advanced example
```
-> `A very <em data-advanced="ADVANCED-NICE_CONTENT">advanced</em> example`

- The parser processes them from inside-out, so in this case `{nice content}{s}` is processed first, then `{$-nice_content}{u}` after that

As you surely have noticed, I can't really assemble a meaningful example with the few flags I have added as default - You come up with your own ideas!

- A function for adding your own flags is available, [the `addFlag` function](#adding-custom-flags-addflagname-callbackvalue-raw)
- As I said, there are already some pre-defined flags which are listed below in the [flag documentation](#flag-documentation)
#### _Raw_ flags
Placeholders are always kebab-cased by default.
- The kebab-casing is always the last operation applied
- The automatic casing can be prevented via two ways:
##### For one, using the `r` (or aliased `raw` flag)
This flag is special - it is no actual defined flag but an exception in the code. Specifying this flag disables the post-processing of the content to kebab case
- See the flag documentation for more information
##### The second way: _raw flags_
As stated at the [`addFlag` code documentation](#adding-custom-flags-addflagname-callbackvalue-raw), flags can be marked as _raw_, which disables the kebab-casing for the to-be-flagged content once any raw flag is specified
- Flags are most-likely marked as raw when they need to do something with the whitespace which is otherwise taken by the kebab-casing
### Special attribute case: href
Using a hash character (`#`) immediately after the tag name (before potential attributes) unlocks a more convenient way of defining a `href` attribute with special values.
- A value may be written after the hash, but can be omitted - entering a value makes the `href` correspond to that value, omitting it will take the tag content instead.
- There are multiple ways of processing the attribute, also using _amplifiers_, special characters to be written after the `#` which unlock special behaviour
#### Anchorization
_Anchorization_ is the default behaviour of the hash syntax without any amplifier: it converts a value into a link to a local id

Using an explicit value:
```
A property - see a#property//here!
```
-> `A property - see <a href="#property">here</a>!`

Or the implicit way:
```
A property - see a#//property!
```
-> `A property - see <a href="#property">property</a>!`
- For convenience, the term _anchorization_ refers to every behaviour invoked with the hash (So also _Transferprotocolization_)
#### A clean href
As of **version 1.3.0**, using the amplifier `&` after the hash character, no prefixes are prepended to the href value (obviously also implicitly and explicitly):
```
A very clean href a#&//attribute
```
-> `A very clean href <a href="attribute">attribute</a>`
#### Transferprotocolization
This wonderful name refers to the hash syntax automatically converting a value into a URL
- This process uses the amplifiers `!` and `?`, for https and http respectively:

With an explicitly defined URL:
```
More info on a#!hallo89.net<//my website//>!
```
-> `More info on <a href="https://hallo89.net">my website</a>!`
```
Unsecure info on a#?hallo89.net<//my website//>...
```
-> `Unsecure info on <a href="http://hallo89.net">my website</a>...`

And implicitly:
```
a#!//hallo89.net, that's my website
```
-> `<a href="https://hallo89.net">hallo89.net</a>, that's my website`
```
a#?//hallo89.net, that's my unsecure website
```
-> `<a href="http://hallo89.net">hallo89.net</a>, that's my unsecure website`

---
- An explicit value may not contain any of following characters: whitespace or any of `,?!:<{/` (The slash doesn't make much sense here, I will see about removing it from the exceptions)
- For using _any_ character in the value, a round or square bracket may be used. Like with attributes, the bracket type itself may not be part of the value: when needing a round bracket in a value, use square brackets and vice versa<br>
```
a#(weird::id/syntax!)//property
```
-> `<a href="#weird::id/syntax!">property</a>`

- From **version 1.3.0** and up, whitespace within content is automatically replaced with dashes (kebab-case without lowercasing):
  ```
  See also a#<//HTML attributes//>
  ```
  -> `See also <a href="HTML-attributes">HTML attributes</a>`

---
## Flag documentation
Listed here are Argon default [flags](#modifying-values-with-flags). Obviously, only valid from **version 1.3.0** and up.<br>
For the system of _raw flags_, see [raw flags](#raw-flags) in the flags section;

### `r`, `raw`
A pseudo-flag.
- It prevents placeholder content from being kebab-cased
- It has the same effect as a _raw_ flag and may be used when no other raw flag is in use
### `s`, `snake`
This flag snake-cases the content; first, it lowercases everything and then it replaces whitespace with underscores.
- raw: true
### `c`, `camel`
Camel-case. Everything is lowercased except characters immediately following a whitespace, which are uppercased
- raw: true
### `p`, `pascal`
Pascal-case. Like camel-case but the first character is uppercased
- raw: true
### `l`, `low`
Lowercase. Lowercase the whole content
- raw: false
### `u`, `up`
Uppercase. Uppercase the whole content
- raw: false

---
## Licensing
This project is licensed under the [MIT license](https://github.com/Hallo89/argon-parser/blob/master/LICENSE)
