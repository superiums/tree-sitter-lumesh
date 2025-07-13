; 代码块增加缩进
(block) @indent.begin

; 函数体增加缩进
; (function_def
;   body: (block) @indent.begin)

; 控制流结构增加缩进
; (if_expr
;   then_branch: (block) @indent.begin)

; (if_expr
;   else_branch: (block) @indent.begin)

; (while_expr
;   body: (block) @indent.begin)

; (for_expr
;   body: (block) @indent.begin)

; (loop_expr
;   body: (block) @indent.begin)

; (match_expr) @indent.begin

; Lambda表达式体增加缩进
; (lambda_expr
;   body: (block) @indent.begin)

; 集合类型增加缩进
(list) @indent.begin
(map) @indent.begin

; 字符串模板增加缩进
(string_template) @indent.begin

; 结束标记减少缩进
[
  "}"
  "]"
] @indent.end

; block字句对齐
(block
  block: _) @indent.branch
; 分支对齐
(match_arm) @indent.branch

; 参数列表对齐
(function_call
  arg: (_) @indent.align)

(chain_expr
  arguments: (_) @indent.align)

; 条件表达式对齐
(conditional_expr
  true_expr: (_) @indent.align
  false_expr: (_) @indent.align)

; 忽略注释的缩进
(comment) @indent.ignore

; 多行结构的特殊处理
(map_entry) @indent.branch
(params) @indent.branch

; 管道表达式对齐
(pipe_expr
  right: (_) @indent.align)
