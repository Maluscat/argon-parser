# Argon parser

(A full introduction and documentation will (hopefully) soon be delivered on my website)

---
## Introduction
While converting the large [Slider89](https://hallo89.net/slider89) documentation into a JSON format, I was quickly getting tired of writing the humongous amounts of HTML tags by hand, almost every anchor additionally needing an extra href attribute to a local id.<br>
That's why I thought of a simple, sophisticated syntax which is increasing the productivity by being very easy to write while decreasing tiring boilerplate, being only as minimal as needed to be distinguishable and efficient - and it's here: Argon

---
## Getting started
Getting started is quite easy. While Argon is not on NPM yet, I will present only the external way:
### Fetching the resource
Fetching the parser from the website of this repository makes you able to always get the latest version when it gets pushed to Github out. This is obviously the slightest bit dangerous as it can break stuff, but this is not very likely because I will probably only do fixes and feature additions in future updates.<br>
Load the script from this repos website, https://hallo89.github.io/argon-parser/argon.js, in your HTML file: `<script src="https://hallo89.github.io/argon-parser/argon.js"></script>`
### Downloading it
The other way is, well, download the script on the website above or on this repo and include it with a script in your HTML file.. That was easy.

After having imported the script, you can just go ahead and parse your favorite syntax (spoiler: it has to be Argon syntax) by calling the `argon()` function. For example: `argon("This is s//probably em<//most likely//> useful")` (outputs `This is <s>probably</s> <em>most likely</em> useful`).<br>Note that Argon does not process real HTML, it just converts a string into a different string - Use innerHTML or insertAdjacentHTML for that.

---
## Documentation
Argon processes a special syntax into a HTML string - Here's how that syntax is built:
### Simple enclosing tags
`div<//inner html content//>`<br>
-> output: `<div>inner html content</div>`
### One word enclosing tags
`This is strong//Argon parser`<br>
-> output: `This is <strong>Argon</strong> parser`
- The single word content is stopped by whitespace or any of `. , ? !`
### Non-closing tags
`Let's get to a/br!//new line!`<br>
-> output: `Let's get to a<br>new line!`
### Tag rules
- Tag names may only contain letters (e.g. `a`) and hyphens (`-`), but no hyphen at the beginning
### Combining single enclosing tags
- Using a plus (`+`) sign one word enclosing tags can be subsequently nested
- This, beside being simply more convenient, allows for accessing the inner content when using implicit anchorization (with the special hash attribute case)
### Subsequent characters
- To have a tag directly follow a word, you use a vertical bar (`|`) inbetween them:<br>
`Very|strong//important|text`<br>
-> `Very<strong>important</strong>text`
### Attributes
- The beginning of an attribute is marked by a colon (`:`), followed by an attribute name, which is directly followed by a set of round or square brackets containing the attribute value
- An attribute name must only consist of letters or hyphens
- When needing a round bracket as part of a value, square brackets must be used and vice versa
- The brackets along with their value may be omitted<br>
`strong:class(bold ag):id(char-3):onclick[log('content')]:contenteditable//Argon`<br>
-> `<strong class="bold ag" id="char-3" onclick="log('content')" contenteditable>Argon</strong>`
### Special attribute case: href
- Using a hash character (`#`) immediately after the tag name (before potential attributes) unlocks a more convenient way of defining a `href` attribute with special values
- A value may be written after the hash, but can be omitted - entering a value makes the `href` correspond to that value, omitting it will take the tag value instead. There are multiple ways of processing the attribute:
#### Anchorization
- Anchorization is the default behaviour of the hash syntax: it converts a value into a link to a local id
- Using an explicit value:<br>
`A property - see a#property//here!`<br>
-> `A property - see <a href="#property">here</a>!`
- The implicit way:<br>
`A property - see a#//property!`<br>
-> `A property - see <a href="#property">property</a>!`
#### Transferprotocolization
- This wonderful name refers to the hash syntax converting a value automatically into a link (with its hypertext transfer protocol (http))
- This is done by appending a exclamation or question mark, for https and http respectively, to the hash character:
- With an explicitly defined URL:<br>
`More info on a#!hallo89.net<//my website//>!`<br>
-> `More info on <a href="https://hallo89.net">my website</a>!`
`Unsecure info on a#?hallo89.net<//my website//>...`<br>
-> `Unsecure info on <a href="http://hallo89.net">my website</a>...`
- And implicitly:<br>
`a#!//hallo89.net, that's my website`<br>
-> `<a href="https://hallo89.net">hallo89.net</a>, that's my website`
`a#?//hallo89.net, that's my unsecure website`<br>
-> `<a href="http://hallo89.net">hallo89.net</a>, that's my unsecure website`

- An explicit value may not contain any of chese characters: whitespace or any of `,?!:/` (The slash doesn't make much sense here, I will see about removing it from the exceptions)
- For using _any_ character in the value, a round or square bracket may be used. This is like with attributes, the bracket type itself may not be part of the value: when needing a round bracket in a value, use square brackets and vice versa<br>
`a#(weird::id/syntax!)//property`<br>
-> `<a href="#weird::id/syntax!">property</a>`
