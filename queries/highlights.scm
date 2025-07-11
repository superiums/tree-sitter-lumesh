; Keywords
[
  "let"
  "fn"
  "if"
  "else"
  "while"
  "for"
  "in"
  "loop"
  "match"
  "return"
  "break"
  "use"
  "as"
  "alias"
  "del"
] @keyword

; Operators
[
  "="
  ":="
  "+="
  "-="
  "*="
  "/="
  "+"
  "-"
  "*"
  "/"
  "%"
  "^"
  "!"
  "++"
  "--"
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
  "&&"
  "||"
  "|"
  "|>"
  "<<"
  ">>"
  ">>!"
  "|_"
  "|^"
  "?."
  "?+"
  "??"
  "?>"
  "?!"
  "?:"
  "?"
  ":"
  "->"
  "=>"
] @operator

; Custom operators (starting with _)
;(custom_expr
;  custom_op: (_) @operator)

; Punctuation
[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
] @punctuation.bracket

[
  ","
  ";"
  "."
  "@"
] @punctuation.delimiter

; Literals
(integer) @number
(float) @number
(string) @string
(string_raw) @string
(string_template) @string
(boolean) @boolean
(none) @constant.builtin

; Variables and symbols
(variable) @variable
(symbol) @variable

; Function definitions and calls
;(function_def
;  name: (symbol) @function)

(function_call
  name: (symbol) @function)

(chain_expr) @_chain
;(chain_expr
;  method: (symbol) @function.method)

; Function parameters
(parameter
  name: (symbol) @variable.parameter)

; Control flow
(if_expr
  condition: (expression) @variable)

(while_expr
  condition: (expression) @variable)

(for_expr
  variable: (symbol) @variable.parameter
  iterable: (expression) @variable)

(match_expr
  value: (expression) @variable)

; Comments
(comment) @comment

; Command expressions
(command_expr
  command: (symbol) @function)

(argument) @string.special

; Map entries
(map_entry
  key: (symbol) @property)

(map_entry
  key: (string) @property)

; Use statements
(use_statement
  module: (string) @string)

(use_statement
  alias: (symbol) @variable)

; Alias statements
(alias_statement
  name: (symbol) @variable)

; Range operators
[
  ".."
  "..."
  "...<"
  "..<"
] @operator

; Output control
[
  "&"
  "&-"
  "&+"
  "&."
  "&?"
] @operator
