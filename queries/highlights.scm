; Keywords
; Control flow keywords
[
"if"
"else"
"while"
"for"
"loop"
"match"
"return"
"break"
] @keyword.control

; Declaration keywords
[
"fn"
] @keyword.function

; Import/module keywords
[
"let"
"use"
"as"
"alias"
"del"
] @keyword.import

; Loop-specific keywords
[
"in"
] @keyword.operator

; Operators
; Assignment operators
[
"="
":="
"+="
"-="
"*="
"/="
] @operator.assignment

; Arithmetic operators
[
"+"
"-"
"*"
"/"
"%"
"^"
] @operator.arithmetic

; Comparison operators
[
"=="
"!="
">"
"<"
">="
"<="
"~~"
"~="
"~:"
"!~~"
"!~:"
] @operator.comparison

; Logical operators
[
"&&"
"||"
"!"
] @operator.logical

; Pipeline operators
[
"|"
"|>"
"<<"
">>"
">!"
"|_"
"|^"
] @operator.pipeline

; Error handling operators
[
"?."
"?+"
"??"
"?>"
"?!"
"?:"
] @operator.error

; Special operators
[
"++"
"--"
"?"
":"
"->"
"=>"
] @operator.special


; Punctuation
; Brackets by type
[
"("
")"
] @punctuation.bracket.round

[
"["
"]"
] @punctuation.bracket.square

[
"{"
"}"
] @punctuation.bracket.curly

; Delimiters by context
[
","
] @punctuation.separator.comma

[
";"
] @punctuation.terminator.semicolon

[
"."
] @punctuation.accessor.dot

[
"@"
] @punctuation.special.at

[
"`"
] @punctuation.definition.template


; Built-in constants
(none) @constant.builtin
(boolean) @constant.builtin.boolean

; Variables with context
(variable) @variable.builtin
(symbol) @identifier

; Function-related identifiers
(function_def

func: (symbol) @function.definition)

(function_call

func: (symbol) @function.call)

(command_expr

cmd: (symbol) @function.command)

; Parameters and arguments
(params

param: (symbol) @variable.parameter)

(for_expr

variable: (symbol) @variable.parameter.loop)

; Property access
(map_entry

key: (symbol) @property.definition)

(map_entry

key: (string) @property.definition.string)


; Numbers
(integer) @number.integer
(float) @number.float

; Strings with specific types
(string) @string.quoted.double
(string_raw) @string.quoted.single
(string_regex) @string.regexp
(string_time) @string.special.time
(string_template) @string.template

; Special string contexts
(use_statement

module: (string) @string.special.path)

(path_arg) @string.special.path

; Module detection in various contexts
(use_statement

module: (string) @module)

(chain_expr

object: (symbol) @module

(#match? @module "^[A-Z]"))

; Regular chain expression object (non-module)
(chain_expr

object: (symbol) @variable

(#not-match? @variable "^[A-Z]"))

; Chain expression methods
(chain_expr

method: (symbol) @function.method)



; Expression types for additional context
(add_sub_expr) @expression.arithmetic
(mul_div_expr) @expression.arithmetic
(power_expr) @expression.arithmetic
(comparison_expr) @expression.comparison
(logical_and_expr) @expression.logical
(logical_or_expr) @expression.logical
(conditional_expr) @expression.conditional
(lambda_expr) @expression.function
(pipe_expr) @expression.pipeline
(range_expr) @expression.range

; Block structures
(block) @structure.block
(list) @structure.list
(map) @structure.map
(comment) @comment


; Generic field matching for operators
(_ operator: _ @operator)

; Target assignments
(_ target: _ @variable.assignment)

; Function parameters
(_ param: _ @variable.parameter)
