; 函数定义
(function_def) @function.outer
(function_def
  body: (block) @function.inner)

; 代码块
(block) @block.outer
(block
  block: (_) @block.inner)

; 函数调用
(function_call) @call.outer
(function_call
  arg: (_) @call.inner)

; 命令表达式
(command_expr) @call.outer
(command_expr
  arg: (_) @call.inner)

; 参数列表
(params) @parameter.outer
(params
  param: (_) @parameter.inner)

; Lambda表达式
(lambda_expr) @function.outer
(lambda_expr
  body: (_) @function.inner)

; 控制流结构
(if_expr) @conditional.outer
(if_expr
  then_branch: (_) @conditional.inner)

(while_expr) @loop.outer
(while_expr
  body: (_) @loop.inner)

(for_expr) @loop.outer
(for_expr
  body: (_) @loop.inner)

(match_expr) @conditional.outer
(match_expr
  arm: (_) @conditional.inner)

; 集合类型
(list) @block.outer
(list
  elements: (_) @block.inner)

(map) @block.outer
(map
  entries: (_) @block.inner)

; 注释
(comment) @comment.outer
(comment) @comment.inner

; 表达式分组
(group_expr) @block.outer
(group_expr
  content: (_) @block.inner)

; 字符串模板
(string_template) @string.outer
(string_template
  interpolation: (_) @string.inner)
