; 关键字  
[  
  "if" "else" "fn" "let" "for" "while" "match"  
  "return" "break" "loop" "use" "del" "alias"  
  "in"  
] @keyword  
  
; 操作符  
[  
  "+" "-" "*" "/" "%" "^"  
  "==" "!=" ">" "<" ">=" "<="  
  "&&" "||" "!"   
  "=" "+=" "-=" "*=" "/=" ":="  
  "|" "|>" "<<" ">>" ">>!" "|_" "|^"  
  "->" ".." "..." "...<" "..<"  
  "~~" "~=" "~:" "!~~" "!~:"  
  "?." "?+" "??" "?>" "?!" "?:"  
] @operator  
  
; 字符串  
(string_literal) @string  
(string_raw) @string.special  
(string_template) @string.regexp  
  
; 数字  
(integer_literal) @number  
(float_literal) @number.float  
  
; 注释  
(comment) @comment  
  
; 标识符  
(identifier) @variable  
(variable) @variable.parameter  
  
; 函数  
  
; 特殊值  
(none_literal) @constant.builtin  
(boolean_literal) @constant.builtin  
  
; 标点符号  
["(" ")" "[" "]" "{" "}"] @punctuation.bracket  
["," ";" ":"] @punctuation.delimiter
