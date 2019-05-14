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
### Subsequent characters
- To have a tag directly follow a word, you use a vertical bar (`|`) inbetween them:
`Very|strong//important|Text`<br>
-> output: `Very<strong>important</strong>Text`
### Attributes
- The beginning of an attribute is marked by a colon (`:`), followed by a attribute name, which is directly followed by a set of round or square brackets containing the attribute value
- An attribute name must only consist of letters or hyphens
- When needing a round bracket as part of a value, square brackets must be used and vice versa
- The brackets along with their value may be omitted
`strong:class(bold ag):id(char-3):onclick[log('content')]:contenteditable//Argon`<br>
-> output: `<strong class="bold ag" id="char-3" onclick="log('content')" contenteditable>Argon</strong>`

**Time is running low, I will finish the docs later!**
