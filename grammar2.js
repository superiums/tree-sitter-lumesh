/**
 * @file lumesh tree-sitter grammar
 * @author santo
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "lumesh",
  word: ($) => $.symbol,
  extras: ($) => [/ \t/, $.comment],

  // 声明冲突解决
  conflicts: ($) => [
    [$.map, $.block],
    // [$.list, $.slice_expr, $.index_expr],
    // [$.function_call, $.lambda_params, $.group_expr],
    // [$.range_expr, $.float],
    [$.multi_assign, $.normal_assign],
  ],

  rules: {
    lumesh: ($) =>
      seq(optional(repeat(choice(";", "\n"))), repeat($.statements)),

    statements: ($) =>
      seq(
        choice(
          $.declaration,
          $.assignment,
          $.control_flow,
          $.function_def,
          $.use_statement,
          $.alias_statement,
          $.del_statement,
          $.expression,
        ),
        repeat(choice(";", "\n")),
      ),

    // 表达式 - 按优先级从高到低排列 (39 -> 1)
    expression: ($) =>
      choice(
        // $.primary_expr, // 39 - 最高优先级
        $.group_expr, // 38 - 分组表达式
        $.postfix_expr, // 25-30 - 后缀表达式
        // $.unary_expr, // 20-21 - 一元表达式
        // $.custom_expr, // 14 - 自定义操作符
        $.power_expr, // 13 - 幂运算
        $.mul_div_expr, // 12 - 乘除模
        $.add_sub_expr, // 11 - 加减
        $.command_expr, // 9 - 命令表达式
        $.comparison_expr, // 8 - 比较表达式
        $.logical_and_expr, // 7 - 逻辑与
        $.logical_or_expr, // 6 - 逻辑或
        $.conditional_expr, // 5 - 条件表达式
        $.lambda_expr, // 4 - Lambda表达式
        $.catch_expr, // 3 - 错误处理
        $.pipe_expr, // 2 - 管道表达式
        $.assign_expr, // 1 - 赋值表达式
      ),

    // 基础表达式 (优先级 39)
    primary_expr: ($) =>
      prec(39, choice($.symbol, $.variable, $.literal, $.list, $.map)),

    // 分组表达式 (优先级 38)
    group_expr: ($) => prec(38, seq("(", field("content", $.expression), ")")),

    // 后缀表达式 (优先级 25-30)
    postfix_expr: ($) =>
      choice(
        $.slice_expr, // 30
        $.index_expr, // 29
        // $.chain_expr, // 27
        $.function_call, // 26
        $.unit_expr, // 25
        $.range_expr, // 25
      ),

    // 切片表达式 (优先级 30)
    slice_expr: ($) =>
      prec.left(
        30,
        seq(
          field("object", $.expression),
          "[",
          field("start", optional($.expression)),
          ":",
          field("end", optional($.expression)),
          optional(seq(":", field("step", $.expression))),
          "]",
        ),
      ),

    // 索引表达式 (优先级 29)
    index_expr: ($) =>
      prec.left(
        29,
        seq(
          field("object", $.expression),
          choice(
            seq("[", field("index", $.expression), "]"),
            seq("@", field("index", $.expression)),
          ),
        ),
      ),

    // 链式调用表达式 (优先级 27)
    // chain_expr: ($) =>
    //   prec.left(
    //     27,
    //     seq(
    //       field("object", $.expression),
    //       repeat1(
    //         seq(
    //           ".",
    //           field("method", $.symbol),
    //           "(",
    //           field("arguments", optional(commaSep1($.expression))),
    //           ")",
    //         ),
    //       ),
    //     ),
    //   ),

    // 函数调用 (优先级 26)
    function_call: ($) =>
      prec.left(
        26,
        seq(
          field("function", $.symbol),
          "(",
          field("arguments", optional(commaSep1($.expression))),
          ")",
        ),
      ),

    // 单位表达式 (优先级 25)
    unit_expr: ($) =>
      prec.left(
        25,
        seq(
          field("value", choice($.integer, $.float)),
          field("unit", choice("K", "M", "G", "T", "P", "B", "%")),
        ),
      ),

    // 范围表达式 (优先级 25)
    range_expr: ($) =>
      prec.left(
        25,
        seq(
          field("start", choice($.integer, $.symbol, $.variable)),
          field("operator", choice("..", "...", "...<", "..<")),
          field("end", choice($.integer, $.symbol, $.variable)),
          optional(
            seq(":", field("step", choice($.integer, $.symbol, $.variable))),
          ),
        ),
      ),

    // 一元表达式 (优先级 20-21)
    // unary_expr: ($) =>
    //   choice(
    //     // 前缀一元运算符 (优先级 21)
    //     prec.right(
    //       21,
    //       seq(
    //         field("operator", choice("++", "--")),
    //         field("operand", $.expression),
    //       ),
    //     ),
    //     // 普通一元运算符 (优先级 20)
    //     prec.right(
    //       20,
    //       seq(
    //         field("operator", choice("!", "-")),
    //         field("operand", $.expression),
    //       ),
    //     ),
    //     // 后缀一元运算符 (优先级 21)
    //     prec.left(
    //       21,
    //       seq(
    //         field("operand", $.expression),
    //         field("operator", choice("++", "--")),
    //       ),
    //     ),
    //   ),

    // 自定义操作符 (优先级 14, 左结合)
    custom_expr: ($) =>
      prec.left(
        14,
        seq(
          field("left", $.expression),
          field("operator", /_.*/), // 以 _ 开头的自定义操作符
          field("right", $.expression),
        ),
      ),

    // 幂运算 (优先级 13, 右结合)
    power_expr: ($) =>
      prec.right(
        13,
        seq(
          field("base", $.expression),
          field("operator", "^"),
          field("exponent", $.expression),
        ),
      ),

    // 乘除模表达式 (优先级 12, 左结合)
    mul_div_expr: ($) =>
      prec.left(
        12,
        seq(
          field("left", $.expression),
          field("operator", choice("*", "/", "%")),
          field("right", $.expression),
        ),
      ),

    // 加减表达式 (优先级 11, 左结合)
    add_sub_expr: ($) =>
      prec.left(
        11,
        seq(
          field("left", $.expression),
          field("operator", choice("+", "-")),
          field("right", $.expression),
        ),
      ),

    // 命令表达式 (优先级 9, 左结合)
    command_expr: ($) =>
      prec.left(
        9,
        seq(
          field("command", choice($.symbol, $.string)),
          field(
            "arguments",
            repeat1(
              choice(
                $.symbol,
                $.string,
                $.string_raw,
                $.argument,
                $.integer,
                $.float,
                $.variable,
                seq("(", optional(commaSep1($.expression)), ")"),
              ),
            ),
          ),
          optional(field("redirect", choice("&", "&-", "&+", "&?", "&."))),
        ),
      ),

    // 比较表达式 (优先级 8, 左结合)
    comparison_expr: ($) =>
      prec.left(
        8,
        seq(
          field("left", $.expression),
          field(
            "operator",
            choice(
              "==",
              "!=",
              ">",
              "<",
              ">=",
              "<=",
              "~~",
              "~=",
              "~:",
              "!~~",
              "!~:",
            ),
          ),
          field("right", $.expression),
        ),
      ),

    // 逻辑与 (优先级 7, 左结合)
    logical_and_expr: ($) =>
      prec.left(
        7,
        seq(
          field("left", $.expression),
          field("operator", "&&"),
          field("right", $.expression),
        ),
      ),

    // 逻辑或 (优先级 6, 左结合)
    logical_or_expr: ($) =>
      prec.left(
        6,
        seq(
          field("left", $.expression),
          field("operator", "||"),
          field("right", $.expression),
        ),
      ),

    // 条件表达式 (优先级 5, 右结合)
    conditional_expr: ($) =>
      prec.right(
        5,
        seq(
          field("condition", $.expression),
          "?",
          field("true_expr", $.expression),
          ":",
          field("false_expr", $.expression),
        ),
      ),

    // Lambda表达式 (优先级 4, 右结合)
    lambda_expr: ($) =>
      prec.right(
        4,
        seq(
          field("parameters", choice($.symbol, $.lambda_params)),
          "->",
          field("body", choice($.expression, $.block)),
        ),
      ),

    // Lambda参数列表
    lambda_params: ($) =>
      prec(4, seq("(", optional(commaSep1(field("parameter", $.symbol))), ")")),

    // 错误处理表达式 (优先级 3, 左结合)
    catch_expr: ($) =>
      prec.left(
        3,
        seq(
          field("expression", $.expression),
          choice(
            field("operator", choice("?.", "?+", "??", "?>", "?!")),
            seq(field("operator", "?:"), field("handler", $.expression)),
          ),
        ),
      ),

    // 管道表达式 (优先级 2, 左结合)
    pipe_expr: ($) =>
      prec.left(
        2,
        seq(
          field("left", $.expression),
          field("operator", choice("|", "|>", "<<", ">>", ">>!", "|_", "|^")),
          field("right", $.expression),
        ),
      ),

    // 赋值表达式 (优先级 1, 右结合)
    assign_expr: ($) =>
      prec.right(
        1,
        seq(
          field("target", $.symbol),
          field("operator", choice("=", ":=", "+=", "-=", "*=", "/=")),
          field("value", $.expression),
        ),
      ),

    // 字面量
    literal: ($) =>
      choice(
        $.integer,
        $.float,
        $.string,
        $.string_raw,
        $.string_template,
        $.boolean,
        $.none,
      ),

    integer: ($) =>
      token(seq(optional("-"), choice("0", seq(/[1-9]/, repeat(/[0-9]/))))),

    float: ($) =>
      token(
        seq(
          optional("-"),
          choice(seq(/[0-9]+/, ".", /[0-9]+/), seq("0", ".", /[0-9]+/)),
        ),
      ),

    string: ($) =>
      token(
        seq(
          '"',
          repeat(
            choice(
              /[^"\\]/,
              seq(
                "\\",
                choice(
                  '"',
                  "\\",
                  "/",
                  "b",
                  "f",
                  "n",
                  "r",
                  "t",
                  seq("u", /[0-9a-fA-F]{4}/),
                ),
              ),
            ),
          ),
          '"',
        ),
      ),

    string_raw: ($) => token(seq(choice("r'", "t'", "'"), repeat(/[^']/), "'")),

    string_template: ($) =>
      seq(
        "`",
        repeat(
          choice(
            /[^`$]+/,
            seq("${", field("interpolation", $.expression), "}"),
          ),
        ),
        "`",
      ),

    boolean: ($) => choice("True", "False"),
    none: ($) => "None",

    // 标识符和变量
    symbol: ($) => /[a-zA-Z_][a-zA-Z0-9_]*/,
    variable: ($) => seq("$", field("name", $.symbol)),

    // 集合类型
    list: ($) =>
      prec.dynamic(
        1,
        seq("[", field("elements", optional(commaSep1($.expression))), "]"),
      ),

    map: ($) =>
      prec.dynamic(
        2,
        seq("{", field("entries", optional(commaSep1($.map_entry))), "}"),
      ),

    map_entry: ($) =>
      seq(
        field("key", choice($.symbol, $.string)),
        ":",
        field("value", $.expression),
      ),

    // 参数定义
    parameter: ($) =>
      seq(
        field("name", $.symbol),
        optional(seq("=", field("default", $.expression))),
      ),

    // 命令参数符号
    argument: ($) =>
      token(
        choice(
          seq("--", /[a-zA-Z][a-zA-Z0-9-]*/),
          seq("-", /[a-zA-Z]/),
          /\/[^\s]*/,
          /\.\.\//,
          /\.\//,
          ".",
          "~",
          /\*\//,
          /\*\*\//,
          /\*\./,
          /https?:\/\/[^\s]*/,
          /ftp:\/\/[^\s]*/,
          /file:\/\/[^\s]*/,
          // choice("&-", "&?", "&+", "&."),
        ),
      ),

    // 声明和赋值
    declaration: ($) =>
      seq(
        "let",
        choice(
          $.normal_assign,
          $.multi_assign,
          $.destruct_list,
          $.destruct_map,
        ),
      ),
    normal_assign: ($) =>
      seq(field("name", $.symbol), "=", field("value", $.expression)),
    multi_assign: ($) =>
      seq(
        field("targets", commaSep1($.symbol)),
        "=",
        field("values", commaSep1($.expression)),
      ),

    destruct_list: ($) =>
      seq(
        "[",
        field(
          "targets",
          commaSep1(choice($.symbol, seq("*", field("rest", $.symbol)))),
        ),
        "]",
        "=",
        field("value", $.expression),
      ),

    destruct_map: ($) =>
      seq(
        "{",
        field(
          "targets",
          commaSep1(
            choice(
              $.symbol,
              seq(field("key", $.symbol), ":", field("alias", $.symbol)),
            ),
          ),
        ),
        "}",
        "=",
        field("value", $.expression),
      ),

    assignment: ($) =>
      seq(
        field("target", $.symbol),
        field("operator", choice("=", ":=", "+=", "-=", "*=", "/=")),
        field("value", $.expression),
      ),

    // 控制流
    control_flow: ($) =>
      choice(
        $.if_expr,
        $.while_expr,
        $.for_expr,
        $.loop_expr,
        $.match_expr,
        $.return_statement,
        $.break_statement,
      ),

    if_expr: ($) =>
      seq(
        "if",
        field("condition", $.expression),
        field("then_branch", $.block),
        optional(seq("else", field("else_branch", choice($.block, $.if_expr)))),
      ),

    while_expr: ($) =>
      seq("while", field("condition", $.expression), field("body", $.block)),

    for_expr: ($) =>
      seq(
        "for",
        field("variable", $.symbol),
        "in",
        field("iterable", $.expression),
        field("body", $.block),
      ),

    loop_expr: ($) => seq("loop", field("body", $.block)),

    match_expr: ($) =>
      seq(
        "match",
        field("value", $.expression),
        "{",
        field("arms", repeat($.match_arm)),
        "}",
      ),

    match_arm: ($) =>
      seq(
        field("pattern", choice("_", commaSep1($.expression))),
        "=>",
        field("result", $.expression),
        choice(";", "\n"),
      ),

    return_statement: ($) =>
      prec.right(seq("return", field("value", optional($.expression)))),

    break_statement: ($) =>
      prec.right(seq("break", field("value", optional($.expression)))),

    // 函数定义
    function_def: ($) =>
      seq(
        "fn",
        field("name", $.symbol),
        "(",
        field(
          "parameters",
          optional(
            seq(
              commaSep1($.parameter),
              optional(seq(",", "...", field("variadic", $.symbol))),
            ),
          ),
        ),
        ")",
        field("body", $.block),
      ),

    // 代码块
    block: ($) =>
      prec.dynamic(0, seq("{", field("statements", repeat($.statements)), "}")),

    // 其他语句
    use_statement: ($) =>
      seq(
        "use",
        field("module", $.string),
        optional(seq("as", field("alias", $.symbol))),
      ),

    alias_statement: ($) =>
      seq("alias", field("name", $.symbol), "=", field("value", $.expression)),

    del_statement: ($) => seq("del", field("target", $.symbol)),

    // 注释
    comment: ($) => token(seq("#", /.*/)),
  },
});

// 辅助函数
function commaSep1(rule) {
  return seq(rule, repeat(seq(",", rule)));
}
