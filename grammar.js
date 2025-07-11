/**
 * @file a lighting shell
 * @author santo
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "lumesh",

  extras: ($) => [/\s/, $.comment],

  // conflicts: ($) => [[$.primary_expression, $.command_expression]],

  rules: {
    source_file: ($) => repeat($._statement),

    _statement: ($) =>
      choice(
        $.expression_statement,
        $.declaration,
        $.assignment,
        $.control_flow,
        $.function_definition,
        $.use_statement,
        $.alias_statement,
        $.del_statement,
      ),

    expression_statement: ($) => seq($.expression, optional(choice(";", "\n"))),

    // 表达式 - 按优先级从低到高排列
    expression: ($) =>
      choice(
        $.assignment_expression, // PREC_ASSIGN = 1
        $.pipe_expression, // PREC_PIPE = 2
        $.catch_expression, // PREC_CATCH = 3
        $.lambda_expression, // PREC_LAMBDA = 4
        $.conditional_expression, // PREC_CONDITIONAL = 5
        $.logical_or_expression, // PREC_LOGICAL_OR = 6
        $.logical_and_expression, // PREC_LOGICAL_AND = 7
        $.comparison_expression, // PREC_COMPARISON = 8
        $.additive_expression, // PREC_ADD_SUB = 11
        $.multiplicative_expression, // PREC_MUL_DIV = 12
        $.power_expression, // PREC_POWER = 13
        $.custom_expression, // PREC_CUSTOM = 14
        $.unary_expression, // PREC_UNARY = 20, PREC_PREFIX = 21
        $.postfix_expression, // PREC_INDEX = 25
        $.primary_expression, // PREC_LITERAL = 29 ==>39
        $.command_expression, // PREC_CMD_ARG = 9
      ),

    // 赋值表达式 (优先级 1, 右结合)
    assignment_expression: ($) =>
      prec.right(
        1,
        seq(
          $.identifier,
          choice("=", ":=", "+=", "-=", "*=", "/="),
          $.expression,
        ),
      ),

    // 管道表达式 (优先级 2, 左结合)
    pipe_expression: ($) =>
      prec.left(
        2,
        seq(
          $.expression,
          choice("|", "|>", "<<", ">>", ">>!", "|_", "|^"),
          $.expression,
        ),
      ),

    // 错误处理表达式 (优先级 3, 左结合)
    catch_expression: ($) =>
      prec.left(
        3,
        choice(
          seq($.expression, choice("?.", "?+", "??", "?>", "?!")),
          seq($.expression, "?:", $.expression), // 只有 ?: 后面需要跟表达式
        ),
      ),

    // Lambda 表达式 (优先级 4, 右结合)
    lambda_expression: ($) =>
      prec.right(
        4,
        seq(
          choice($.identifier, seq("(", optional(commaSep1($.parameter)), ")")),
          "->",
          choice($.expression, $.block),
        ),
      ),

    // 条件表达式 (优先级 5, 右结合)
    conditional_expression: ($) =>
      prec.right(5, seq($.expression, "?", $.expression, ":", $.expression)),

    // 逻辑或 (优先级 6, 左结合)
    logical_or_expression: ($) =>
      prec.left(6, seq($.expression, "||", $.expression)),

    // 逻辑与 (优先级 7, 左结合)
    logical_and_expression: ($) =>
      prec.left(7, seq($.expression, "&&", $.expression)),

    // 比较表达式 (优先级 8, 左结合)
    comparison_expression: ($) =>
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
    command_expression: ($) =>
      prec.left(
        9,
        seq(
          $.identifier,
          repeat1(
            choice(
              $.identifier,
              $.string_literal,
              $.string_raw,
              $.argument_symbol,
              $.integer_literal,
              $.float_literal,
            ),
          ),
        ),
      ),

    // 加减表达式 (优先级 11, 左结合)
    additive_expression: ($) =>
      prec.left(11, seq($.expression, choice("+", "-"), $.expression)),

    // 乘除模表达式 (优先级 12, 左结合)
    multiplicative_expression: ($) =>
      prec.left(12, seq($.expression, choice("*", "/", "%"), $.expression)),

    // 幂运算 (优先级 13, 右结合)
    power_expression: ($) =>
      prec.right(13, seq($.expression, "^", $.expression)),

    // 自定义操作符 (优先级 14, 左结合)
    custom_expression: ($) =>
      prec.left(
        14,
        seq(
          $.expression,
          /_.*/, // 以 _ 开头的自定义操作符
          $.expression,
        ),
      ),

    // 一元表达式 (优先级 20-21)
    unary_expression: ($) =>
      choice(
        prec.left(20, seq(choice("!", "-"), $.expression)),
        prec.left(21, seq(choice("++", "--"), $.expression)),
        prec.left(21, seq($.expression, choice("++", "--"))),
      ),

    // 后缀表达式 (优先级 25)
    postfix_expression: ($) =>
      choice(
        $.function_call, //26
        $.index_expression, //29
        $.slice_expression, //30
        $.chain_expression, //27
        // $.property_expression,  //28
        $.range_expression, //25
      ),

    // 函数调用 (优先级 25)
    function_call: ($) =>
      prec(26, seq($.expression, "(", optional(commaSep1($.expression)), ")")),

    // 索引表达式 (优先级 25)
    index_expression: ($) =>
      prec.left(
        29,
        seq(
          $.expression,
          choice(
            seq("[", $.expression, "]"),
            seq("@", $.expression),
            seq(".", $.expression),
          ),
        ),
      ),

    // 切片表达式 (优先级 25)
    slice_expression: ($) =>
      prec(
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
    chain_expression: ($) =>
      prec(
        27,
        seq(
          $.expression,
          repeat1(
            seq(".", $.identifier, "(", optional(commaSep1($.expression)), ")"),
          ),
        ),
      ),

    // 属性访问表达式 (优先级 25) - 分离出来
    // property_expression: ($) => prec(25, seq($.expression, ".", $.identifier)),

    // 范围表达式 (优先级 25)
    range_expression: ($) =>
      prec.left(
        25,
        seq(
          $.expression,
          choice("..", "...", "...<", "..<"),
          $.expression,
          optional(seq(":", $.expression)),
        ),
      ),

    // 基础表达式 (优先级 39)
    primary_expression: ($) =>
      prec(
        39,
        choice($.identifier, $.variable, $.literal, $.list, $.map, $.group),
      ),

    // 字面量
    literal: ($) =>
      choice(
        $.integer_literal,
        $.float_literal,
        $.string_literal,
        $.string_raw,
        $.string_template,
        $.boolean_literal,
        $.none_literal,
      ),

    integer_literal: ($) =>
      token(seq(optional("-"), choice("0", seq(/[1-9]/, repeat(/[0-9]/))))),

    float_literal: ($) =>
      token(
        seq(
          optional("-"),
          choice(
            seq(/[0-9]+/, ".", repeat(/[0-9]/)),
            seq("0", ".", repeat(/[0-9]/)),
          ),
        ),
      ),

    string_literal: ($) =>
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

    boolean_literal: ($) => choice("True", "False"),
    none_literal: ($) => "None",

    // 标识符和变量
    identifier: ($) => /[a-zA-Z_][a-zA-Z0-9_]*/,
    variable: ($) => seq("$", $.identifier),

    // 集合类型
    list: ($) => seq("[", optional(commaSep1($.expression)), "]"),

    map: ($) => prec(49, seq("{", optional(commaSep1($.map_entry)), "}")),

    map_entry: ($) =>
      seq(choice($.identifier, $.string_literal), ":", $.expression),

    // 分组
    group: ($) => prec(60, seq("(", $.expression, ")")),

    // 参数定义
    parameter: ($) =>
      prec(9, seq($.identifier, optional(seq("=", $.expression)))),

    // 命令参数符号
    argument_symbol: ($) =>
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
        choice(seq($.identifier, "=", $.expression), $.destructure_assignment),
      ),

    destructure_assignment: ($) =>
      prec(2, seq(commaSep1($.identifier), "=", $.expression)),

    assignment: ($) =>
      seq(
        $.identifier,
        choice("=", ":=", "+=", "-=", "*=", "/="),
        $.expression,
      ),

    // 控制流
    control_flow: ($) =>
      choice(
        $.if_expression,
        $.while_expression,
        $.for_expression,
        $.loop_expression,
        $.match_expression,
        $.return_statement,
        $.break_statement,
      ),

    if_expression: ($) =>
      seq(
        "if",
        $.expression,
        $.block,
        optional(seq("else", choice($.block, $.if_expression))),
      ),

    while_expression: ($) => seq("while", $.expression, $.block),

    for_expression: ($) =>
      seq("for", $.identifier, "in", $.expression, $.block),

    loop_expression: ($) => seq("loop", $.block),

    match_expression: ($) =>
      seq("match", $.expression, "{", repeat($.match_arm), "}"),

    match_arm: ($) =>
      seq(commaSep1($.expression), "=>", $.expression, optional(",")),

    return_statement: ($) => prec.right(seq("return", optional($.expression))),
    break_statement: ($) => prec.right(seq("break", optional($.expression))),

    // 函数定义
    function_definition: ($) =>
      seq(
        "fn",
        $.identifier,
        "(",
        optional(
          seq(commaSep1($.parameter), optional(seq(",", "...", $.identifier))),
        ),
        ")",
        $.block,
      ),

    // 代码块
    block: ($) => prec(50, seq("{", repeat($._statement), "}")),

    // 其他语句
    use_statement: ($) =>
      seq("use", $.string_literal, optional(seq("as", $.identifier))),

    alias_statement: ($) => seq("alias", $.identifier, "=", $.expression),

    del_statement: ($) => seq("del", $.identifier),

    // 注释
    comment: ($) => token(seq("#", /.*/)),
  },
});

// 辅助函数
function commaSep1(rule) {
  return seq(rule, repeat(seq(",", rule)));
}

function commaSep(rule) {
  return optional(commaSep1(rule));
}
