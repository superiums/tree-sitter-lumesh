/**
 * @file a lighting shell
 * @author santo
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "lumesh",
  word: ($) => $.symbol,
  extras: ($) => [/\s/, $.comment],

  // conflicts: ($) => [[$.range_expr, $.float]],

  rules: {
    lumesh: ($) => repeat($.statements),

    statements: ($) =>
      seq(
        choice(
          $.expression,
          $.declaration,
          $.assignment,
          $.control_flow,
          $.function_def,
          $.use_statement,
          $.alias_statement,
          $.del_statement,
        ),
        optional(choice(";", "\n")),
      ),

    // 表达式 - 按优先级从低到高排列
    expression: ($) =>
      choice(
        $.group,
        $.assign_expr, // PREC_ASSIGN = 1
        $.pipe_expr, // PREC_PIPE = 2
        $.catch_expr, // PREC_CATCH = 3
        $.lambda_expr, // PREC_LAMBDA = 4
        $.conditional_expr, // PREC_CONDITIONAL = 5
        $.logical_or_expr, // PREC_LOGICAL_OR = 6
        $.logical_and_expr, // PREC_LOGICAL_AND = 7
        $.comparison_expr, // PREC_COMPARISON = 8
        $.add_sub_expr, // PREC_ADD_SUB = 11
        $.mul_div_expr, // PREC_MUL_DIV = 12
        $.power_expr, // PREC_POWER = 13
        $.custom_expr, // PREC_CUSTOM = 14
        $.unary_expr, // PREC_UNARY = 20, PREC_PREFIX = 21
        $.postfix_expr, // PREC_INDEX = 25
        $.primary_expr, // PREC = 29 ==>39
        $.command_expr, // PREC_CMD_ARG = 9
      ),

    // 赋值表达式 (优先级 1, 右结合)
    assign_expr: ($) =>
      prec.right(
        1,
        seq($.symbol, choice("=", ":=", "+=", "-=", "*=", "/="), $.expression),
      ),

    // 管道表达式 (优先级 2, 左结合)
    pipe_expr: ($) =>
      prec.left(
        2,
        seq(
          $.expression,
          choice("|", "|>", "<<", ">>", ">>!", "|_", "|^"),
          $.expression,
        ),
      ),

    // 错误处理表达式 (优先级 3, 左结合)
    catch_expr: ($) =>
      prec.left(
        3,
        choice(
          seq($.expression, choice("?.", "?+", "??", "?>", "?!")),
          seq($.expression, "?:", $.expression), // 只有 ?: 后面需要跟表达式
        ),
      ),

    // Lambda 表达式 (优先级 4, 右结合)
    lambda_expr: ($) =>
      prec.right(
        4,
        seq(
          choice($.symbol, seq("(", optional(commaSep1($.parameter)), ")")),
          "->",
          choice($.expression, $.block),
        ),
      ),

    // 条件表达式 (优先级 5, 右结合)
    conditional_expr: ($) =>
      prec.right(5, seq($.expression, "?", $.expression, ":", $.expression)),

    // 逻辑或 (优先级 6, 左结合)
    logical_or_expr: ($) => prec.left(6, seq($.expression, "||", $.expression)),

    // 逻辑与 (优先级 7, 左结合)
    logical_and_expr: ($) =>
      prec.left(7, seq($.expression, "&&", $.expression)),

    // 比较表达式 (优先级 8, 左结合)
    comparison_expr: ($) =>
      prec.left(
        8,
        seq(
          $.expression,
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
          $.expression,
        ),
      ),

    // 命令参数表达式 (优先级 9, 左结合)
    command_expr: ($) =>
      prec.left(
        9,
        seq(
          field("command", $.symbol),
          repeat1(
            choice(
              $.symbol,
              $.string,
              $.string_raw,
              $.argument,
              $.integer,
              $.float,
            ),
          ),
          optional(choice("&", "&-", "&+", "&?", "&.")),
        ),
      ),

    // 加减表达式 (优先级 11, 左结合)
    add_sub_expr: ($) =>
      prec.left(11, seq($.expression, choice("+", "-"), $.expression)),

    // 乘除模表达式 (优先级 12, 左结合)
    mul_div_expr: ($) =>
      prec.left(12, seq($.expression, choice("*", "/", "%"), $.expression)),

    // 幂运算 (优先级 13, 右结合)
    power_expr: ($) => prec.right(13, seq($.expression, "^", $.expression)),

    // 自定义操作符 (优先级 14, 左结合)
    custom_expr: ($) =>
      prec.left(
        14,
        seq(
          $.expression,
          field("custom_op", /_.*/), // 以 _ 开头的自定义操作符
          $.expression,
        ),
      ),

    // 一元表达式 (优先级 20-21)
    unary_expr: ($) =>
      choice(
        prec.left(20, seq(choice("!", "-"), $.expression)),
        prec.left(21, seq(choice("++", "--"), $.expression)),
        prec.left(21, seq($.expression, choice("++", "--"))),
      ),

    // 后缀表达式 (优先级 25)
    postfix_expr: ($) =>
      choice(
        $.function_call, //26
        $.index_expr, //29
        $.slice_expr, //30
        $.chain_expr, //27
        // $.property_expr,  //28
        $.range_expr, //25
      ),

    // 函数调用 (优先级 25)
    function_call: ($) =>
      prec(
        26,
        seq(
          field("name", $.symbol),
          "(",
          optional(commaSep1($.expression)),
          ")",
        ),
      ),

    // 索引表达式 (优先级 25)
    index_expr: ($) =>
      prec.left(
        29,
        seq(
          $.expression,
          choice(
            seq("[", $.expression, "]"),
            seq("@", $.expression),
            // seq(".", $.expression),
          ),
        ),
      ),

    // 切片表达式 (优先级 25)
    slice_expr: ($) =>
      prec.left(
        30,
        seq(
          $.expression,
          "[",
          optional($.expression),
          ":",
          optional($.expression),
          optional(seq(":", $.expression)),
          "]",
        ),
      ),

    // 链式调用表达式 (优先级 25)
    chain_expr: ($) =>
      prec.left(
        27,
        seq(
          $.expression,
          repeat1(
            seq(
              ".",
              field("method", $.symbol),
              "(",
              optional(commaSep1($.expression)),
              ")",
            ),
          ),
        ),
      ),

    // 属性访问表达式 (优先级 25) - 分离出来
    // property_expr: ($) => prec(25, seq($.expression, ".", $.symbol)),

    // 范围表达式 (优先级 25)
    range_expr: ($) =>
      prec.left(
        25,
        seq(
          choice($.integer, $.symbol, $.variable),
          choice("..", "...", "...<", "..<"),
          choice($.integer, $.symbol, $.variable),
          optional(seq(":", choice($.integer, $.symbol, $.variable))),
        ),
      ),

    // 基础表达式 (优先级 39)
    primary_expr: ($) =>
      prec.left(39, choice($.symbol, $.variable, $.literal, $.list, $.map)),

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

    string_raw: ($) => token(seq("'", repeat(/[^']/), "'")),

    string_template: ($) =>
      token(
        seq(
          "`",
          repeat(choice(/[^`$]/, seq("$", "{", repeat(/[^}]/), "}"))),
          "`",
        ),
      ),

    boolean: ($) => choice("True", "False"),
    none: ($) => "None",

    // 标识符和变量
    symbol: ($) => /[a-zA-Z_][a-zA-Z0-9_]*/,
    variable: ($) => seq("$", $.symbol),

    // 集合类型
    list: ($) => prec(37, seq("[", optional(commaSep1($.expression)), "]")),

    map: ($) => prec(37, seq("{", optional(commaSep1($.map_entry)), "}")),

    map_entry: ($) =>
      seq(field("key", choice($.symbol, $.string)), ":", $.expression),

    // 分组
    group: ($) => prec(38, seq("(", $.expression, ")")),

    // 参数定义
    parameter: ($) =>
      prec(9, seq(field("name", $.symbol), optional(seq("=", $.expression)))),

    // 命令参数符号
    argument: ($) =>
      token(
        choice(
          seq("--", /[a-zA-Z][a-zA-Z0-9-]*/),
          seq("-", /[a-zA-Z]/),
          /\/[^\s]*/,
          /\.\.\//,
          /\.\//,
          ".", // 单独的点作为路径参数
          "~",
          /\*\//,
          /\*\*\//,
          /\*\./,
          /https?:\/\/[^\s]*/,
          /ftp:\/\/[^\s]*/,
          /file:\/\/[^\s]*/,
          choice("&-", "&?", "&+", "&."),
        ),
      ),

    // 声明和赋值
    declaration: ($) =>
      seq(
        "let",
        choice(
          seq($.symbol, "=", $.expression),
          $.multi_assign,
          $.destruct_list,
          $.destruct_map,
        ),
      ),

    multi_assign: ($) =>
      prec(1, seq(commaSep1($.symbol), "=", commaSep1($.expression))),
    destruct_list: ($) =>
      prec(
        1,
        seq(
          "[",
          commaSep1($.symbol),
          "]",
          "=",
          choice($.symbol, $.variable, $.list),
        ),
      ),
    destruct_map: ($) =>
      prec(
        1,
        seq(
          "{",
          commaSep1($.symbol, optional(seq(":", $.symbol))),
          "}",
          "=",
          choice($.symbol, $.variable, $.map),
        ),
      ),

    assignment: ($) =>
      seq($.symbol, choice("=", ":=", "+=", "-=", "*=", "/="), $.expression),

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
        $.block,
        optional(seq("else", choice($.block, $.if_expr))),
      ),

    while_expr: ($) => seq("while", field("condition", $.expression), $.block),

    for_expr: ($) =>
      seq(
        "for",
        field("variable", $.symbol),
        "in",
        field("iterable", $.expression),
        $.block,
      ),

    loop_expr: ($) => seq("loop", $.block),

    match_expr: ($) =>
      seq("match", field("value", $.expression), "{", repeat($.match_arm), "}"),

    match_arm: ($) =>
      seq(
        choice("_", commaSep1($.expression)),
        "=>",
        $.expression,
        choice(";", "\n"),
      ),

    return_statement: ($) => prec.right(seq("return", optional($.expression))),
    break_statement: ($) => prec.right(seq("break", optional($.expression))),

    // 函数定义
    function_def: ($) =>
      seq(
        "fn",
        field("name", $.symbol),
        "(",
        optional(
          seq(commaSep1($.parameter), optional(seq(",", "...", $.symbol))),
        ),
        ")",
        $.block,
      ),

    // 代码块
    block: ($) => prec(36, seq("{", repeat($.statements), "}")),

    // 其他语句
    use_statement: ($) =>
      seq(
        "use",
        field("module", $.string),
        optional(seq("as", field("alias", $.symbol))),
      ),

    alias_statement: ($) =>
      seq("alias", field("name", $.symbol), "=", $.expression),

    del_statement: ($) => seq("del", $.symbol),

    // 注释
    comment: ($) => token(seq("#", /.*/)),
  },
});

// 辅助函数
function commaSep1(rule) {
  return seq(rule, repeat(seq(",", rule)));
}

// function commaSep(rule) {
//   return optional(commaSep1(rule));
// }
