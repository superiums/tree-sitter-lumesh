; 代码块增加缩进
(block) @indent.begin

; 集合类型增加缩进
(list) @indent.begin
(map) @indent.begin
(namedmap) @indent.begin
(sets) @indent.begin

; 字符串模板增加缩进
(string_template) @indent.begin

; 结束标记减少缩进
[
"}"
"]"
] @indent.end

; block字句对齐
(block
statement: _) @indent.branch

; 分支对齐
(match_expr
arm: (_) @indent.branch)

; 参数列表对齐
(params
param: (_) @indent.align)

(params
var_collect: (_) @indent.align)

; 函数调用参数对齐
(function_call
arg: (_) @indent.align)

(chain_expr
arguments: (_) @indent.align)

; 条件表达式对齐
(conditional_expr
true_expr: (_) @indent.align
false_expr: (_) @indent.align)

; 管道表达式对齐
(pipe_expr
right: (_) @indent.align)

; 模块调用对齐
(module_call_expr
arg: (_) @indent.align)

; 忽略注释的缩进
(comment) @indent.ignore

; 多行结构的特殊处理
(map_entry) @indent.branch

; 装饰器不缩进
(decorator) @indent.ignore
