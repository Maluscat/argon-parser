# Argon parser
(A full introduction and documentation will (hopefully) soon be delivered on my website)

- [Introduction](#introduction)
- [Getting started](#getting-started)
- [Version Notice](#version-notice)
- [Code documentation](#code-documentation)
- [Syntax documentation](#syntax-documentation)
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
Argon can also be used directly in the browser.
#### Automatic fetching
One way to do that is to fetch the script from its repository's website directly in your HTML file:
```
<script src="https://hallo89.github.io/argon-parser/argon.js"></script>
```
This allows you to always have the latest version when it gets pushed to GitHub. However, as this doesn't utilize [SemVer](https://semver.org) processing, it has a chance to break but this is not very likely as the syntax is pretty much stable already.
#### Downloading it
The other way is, well, download the script from its repo and include it with a script in your HTML file.. That was easy.

---
After having imported the script, you can just go ahead and parse your favorite Argon syntax ([documented below](#syntax-documentation)) by calling the `parse` function - in the `argon` object in the browser or in the assigned variable after requiring on Node.js (See the [code documentation](#code-documentation)). For example: `argon.parse("This is s//probably em<//most likely//> useful")` (outputs `This is <s>probably</s> <em>most likely</em> useful`).<br>
Note that Argon is only made for HTML _snippets_, for example for small segments of formatted text in a database (like the example in the introduction)!<br>
Also note that Argon does not compile into actual elemented HTML, it just converts a string into a different string - Use innerHTML or insertAdjacentHTML for that.

---
## Version notice
Many of the third digit version increases only refer to readme changes or other minor things to be pushed to npm which don't relate to the actual code.
because of that, only releases that impact the user experience will be marked in the GitHub [releases tab](https://github.com/Hallo89/argon-parser/releases), for example new features (second digit increases) or bug fixes.

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
As of version 1.2.0, a second parameter can be defined in `parse`, which is the **dry mode**:
- It is a boolean; `true` turns dry mode on, `false` is the default
- This mode strips the input string from all Argon syntax and does not parse it
- This is for example very useful when having an argonized heading which should be defined as a hash id as well
```
argon.parse("code//Argon is em//pretty nice", true);
```
-> `Argon is pretty nice`
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

Since version 1.2.1, an alternative syntax is available, using the characters `{}`:
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
- The single word content is stopped by whitespace or any of `. , ? !`
### Non-closing tags
```
Let's get to a/br!//new line!
```
-> output: `Let's get to a<br>new line!`
### Tag rules
Tag names may only contain letters (e.g. `a`) and hyphens (`-`), but no hyphen at the beginning
### Combining tags
Using a plus (`+`) sign, tags can be subsequently nested
- This, beside being simply more convenient, allows for accessing the inner content when using implicit anchorization (with the special hash attribute case)
- Prior to 1.1.0, only one word enclosing tags could have additional tags attached to them
```
this is em+strong//important!
```
-> `this is <em><strong>important</strong></em>!`

A more advanced example with attributes and anchorization (see below):
```
Check out a#!:class(anchor)+strong:class(bold)<//github.com/hallo89/argon-parser//>.
```
-> `Check out <a href="https://github.com/Hallo89/argon-parser" class="anchor"><strong class="bold">github.com/Hallo89/argon-parser</strong></a>.`
### Subsequent characters
- To have a tag directly follow a word, you use a vertical bar (`|`) in between them:
```
Very|strong//important|text
```
-> `Very<strong>important</strong>text`
### Attributes
The beginning of an attribute is marked by a colon (`:`), followed by an attribute name, which is directly followed by a set of round or square brackets containing the attribute value
- An attribute name must only consist of letters or hyphens
- When needing a round bracket as part of a value, square brackets must be used and vice versa
- The brackets along with their value may be omitted
```
strong:class(bold ag):id(char-3):onclick[log('content')]:contenteditable//Argon
```
-> `<strong class="bold ag" id="char-3" onclick="log('content')" contenteditable>Argon</strong>`
### Special attribute case: href
Using a hash character (`#`) immediately after the tag name (before potential attributes) unlocks a more convenient way of defining a `href` attribute with special values
- A value may be written after the hash, but can be omitted - entering a value makes the `href` correspond to that value, omitting it will take the tag value instead. There are multiple ways of processing the attribute:
#### Anchorization
_Anchorization_ is the default behaviour of the hash syntax: it converts a value into a link to a local id

Using an explicit value:
```
A property - see a#property//here!
```
-> `A property - see <a href="#property">here</a>!`

The implicit way:
```
A property - see a#//property!
```
-> `A property - see <a href="#property">property</a>!`
- For convenience, the term _anchorization_ refers to every behaviour invoked with the hash (So also _Transferprotocolization_)
#### Transferprotocolization
This wonderful name refers to the hash syntax converting a value automatically into a link (with its hypertext transfer protocol (http))
- This is done by appending a exclamation or question mark, for https and http respectively, to the hash character:

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
- An explicit value may not contain any of following characters: whitespace or any of `,?!:/` (The slash doesn't make much sense here, I will see about removing it from the exceptions)
- For using _any_ character in the value, a round or square bracket may be used. This is like with attributes, the bracket type itself may not be part of the value: when needing a round bracket in a value, use square brackets and vice versa<br>

```
a#(weird::id/syntax!)//property
```
-> `<a href="#weird::id/syntax!">property</a>`

---
## Licensing
This project is licensed under the [MIT license](https://github.com/Hallo89/argon-parser/blob/master/LICENSE)
