/**
 * @file lumesh tree-sitter grammar
 * @author santo
 * @license MIT
 */

/// <reference types='tree-sitter-cli/dsl' />
// @ts-check

module.exports = grammar({
  name: 'lumesh',
  word: ($) => $.symbol,
  extras: ($) => [/[ \t]/, /\\\n/, $.comment],

  // 结构性歧义(共享前缀 token),必须交给 GLR 动态决策，不能靠数字优先级替代
  conflicts: ($) => [
    // [$.lambda_params, $._primary_expr],
    // [$._primary_expr, $.map_entry],
    // [$.map, $.block],
    // [$.command_expr, $._primary_expr],
    // [$.command_expr, $._expression],
    // [$.command_expr, $.literal],
    // [$.command_expr, $.command_argument],
    // [$.command_argument, $._primary_expr],
    // [$.command_argument, $._expression],
  ],

  // 注意：已删除原来的具名 precedences() 表 —— 因为语法里没有任何规则
  // 调用 prec($.rule_name, ...) 引用这些符号，那张表对生成结果没有任何效力。
  // 真正的运算符优先级改为下面各规则里的数字 prec.left(N,...)/prec.right(N,...)。

  rules: {
    lumesh: ($) => seq(optional(repeat('\n')), repeat($._statements)),

    _statements: ($) =>
      seq(
        choice(
          $.declaration,
          $.control_flow,
          $.function_def,
          $.use_statement,
          $.alias_statement,
          $.del_statement,
          $.export_statement,
          $.set_statement,
          $._expression,
        ),
        repeat(choice(';', '\n')),
      ),

    _expression: ($) =>
      choice(
        $.if_expr,
        $.for_expr,
        $.match_expr,
        $.group_expr,
        $.chain_expr,
        $.property_expr,
        $.function_call,
        $.module_call_expr,
        $._postfix_expr,
        $.unary_expr,
        $.power_expr,
        $.mul_div_expr,
        $.add_sub_expr,
        $.command_expr,
        $.comparison_expr,
        $.logical_and_expr,
        $.logical_or_expr,
        $.conditional_expr,
        $.lambda_expr,
        $.catch_expr,
        $.pipe_expr,
        $.assign_expr,
        $._primary_expr,
      ),

    _primary_expr: ($) =>
      choice(
        $.literal,
        $.symbol,
        $.variable,
        $.list,
        $.namedmap,
        $.map,
        $.sets,
        $.block,
      ),

    group_expr: ($) => seq('(', field('content', $._expression), ')'),

    _postfix_expr: ($) =>
      choice($.slice_expr, $.index_expr, $.unit_expr, $.range_expr),

    // ---- 数字越大，结合越紧密（优先被 shift/归约选中） ----

    slice_expr: ($) =>
      prec.left(
        24,
        seq(
          field('object', $._expression),
          token.immediate('['),
          optional(
            field('start', choice($.integer, $.symbol, $.variable, $.blank)),
          ),
          choice('..=', '..'),
          optional(
            field('end', choice($.integer, $.symbol, $.variable, $.blank)),
          ),
          optional(
            seq(':', field('step', choice($.integer, $.symbol, $.variable))),
          ),
          ']',
        ),
      ),

    index_expr: ($) =>
      prec.left(
        24,
        seq(
          field('object', $._expression),
          seq(token.immediate('['), field('index', $._expression), ']'),
        ),
      ),

    property_expr: ($) =>
      prec.left(
        24,
        seq(
          field('object', choice($.symbol, $.variable)),
          token.immediate('.'),
          field('property', $.symbol),
        ),
      ),

    chain_expr: ($) =>
      prec.left(
        24,
        seq(
          field(
            'object',
            choice(
              $.literal,
              $.symbol,
              $.variable,
              $.index_expr,
              $.property_expr,
            ),
          ),
          repeat1(
            seq(
              token.immediate('.'),
              field('method', $.symbol),
              optional(
                seq(
                  token.immediate('('),
                  field('arguments', optional(commaSep1($._expression))),
                  ')',
                ),
              ),
            ),
          ),
        ),
      ),

    function_call: ($) =>
      prec.left(
        24,
        seq(
          field('func', $.symbol),
          token.immediate('('),
          optional('\n'),
          field(
            'args',
            choice(
              commaLineSep(field('arg', $._expression)),
              optional(field('arg', $._expression)),
            ),
          ),
          optional('\n'),
          ')',
        ),
      ),

    unit_expr: ($) =>
      prec.left(
        24,
        seq(
          field('value', choice($.integer, $.float)),
          field(
            'unit',
            token.immediate(choice('K', 'M', 'G', 'T', 'P', 'B', '%')),
          ),
        ),
      ),

    unary_expr: ($) =>
      prec.right(
        20,
        seq(
          token(field('operator', choice('!', '-'))),
          field('operand', $._expression),
        ),
      ),

    power_expr: ($) =>
      prec.right(
        22,
        seq(
          field('base', $._expression),
          field('operator', '^'),
          field('exponent', $._expression),
        ),
      ),

    mul_div_expr: ($) =>
      prec.left(
        18,
        seq(
          field('left', $._expression),
          field('operator', choice('*', '/', '%')),
          field('right', $._expression),
        ),
      ),

    add_sub_expr: ($) =>
      prec.left(
        16,
        seq(
          field('left', $._expression),
          field('operator', choice('+', '-')),
          field('right', $._expression),
        ),
      ),

    range_expr: ($) =>
      prec.left(
        15,
        seq(
          field('start', choice($.integer, $.symbol, $.variable, $.blank)),
          field(
            'operator',
            token.immediate(choice('...', '...=', '..=', '..')),
          ),
          field('end', choice($.integer, $.symbol, $.variable, $.blank)),
          optional(
            seq(':', field('step', choice($.integer, $.symbol, $.variable))),
          ),
        ),
      ),

    command_expr: ($) =>
      prec.left(
        14,
        seq(
          field('cmd', choice($.symbol, $.property_expr, $.path_arg)),
          field('arg', repeat1($.command_argument)),
          field('redirect', optional($.stdout_ctrl)),
        ),
      ),

    command_argument: ($) =>
      prec.left(
        34,
        choice(
          $.slash_arg,
          $.literal,
          $.symbol,
          $.symbol_raw,
          $.variable,
          $.list,
          $.namedmap,
          $.sets,
          $.group_expr,
          $.path_arg,
          $.dot_arg,
          $.chain_expr,
          $.property_expr,
          $.function_call,
        ),
      ),

    comparison_expr: ($) =>
      prec.left(
        12,
        seq(
          field('left', $._expression),
          field(
            'operator',
            choice('===', '!==', '==', '!=', '>', '<', '>=', '<=', '~:', '!~:'),
          ),
          field('right', $._expression),
        ),
      ),

    logical_and_expr: ($) =>
      prec.left(
        10,
        seq(
          field('left', $._expression),
          field('operator', '&&'),
          field('right', $._expression),
        ),
      ),

    logical_or_expr: ($) =>
      prec.left(
        8,
        seq(
          field('left', $._expression),
          field('operator', '||'),
          field('right', $._expression),
        ),
      ),

    conditional_expr: ($) =>
      prec.right(
        6,
        seq(
          field('condition', $._expression),
          '?',
          field('true_expr', $._expression),
          ':',
          field('false_expr', $._expression),
        ),
      ),

    lambda_expr: ($) =>
      prec.right(
        5,
        seq(
          choice(field('param', $.symbol), $.lambda_params),
          '->',
          field('body', choice($._expression, $.block)),
        ),
      ),

    lambda_params: ($) =>
      prec(6, seq('(', optional(commaSep1(field('param', $.symbol))), ')')),

    catch_expr: ($) =>
      prec.left(
        4,
        seq(
          field('try', $._expression),
          choice(
            field('catcher', choice('?.', '?+', '??', '?>', '?!', '?~', '_!')),
            seq(
              field('catcher', choice('?:', '&:', '_:')),
              field('handler', prec.right(2, $._expression)),
            ),
          ),
        ),
      ),

    pipe_expr: ($) =>
      prec.left(
        3,
        seq(
          field('left', $._expression),
          field('operator', choice('|', '|>', '|^', '<<', '>>', '>!')),
          field('right', $._expression),
        ),
      ),

    assign_expr: ($) =>
      prec.right(
        1,
        seq(
          field('target', $.symbol),
          choice(':=', '='),
          field('value', $._expression),
        ),
      ),

    // ---- literal / token 层规则:与运算符优先级无关,保持不变 ----

    literal: ($) =>
      choice(
        $.integer,
        $.float,
        $.string,
        $.string_raw,
        $.string_safe,
        $.bytes,
        $.string_regex,
        $.string_time,
        $.string_raw_hash,
        $.string_template,
        $.boolean,
        $.none,
        $.file_size_literal,
      ),

    // symbol / variable / blank
    symbol: ($) => token(/[a-zA-Z_][a-zA-Z0-9_\-]*/),
    symbol_raw: ($) => seq($.symbol, token.immediate('^')),
    variable: ($) => seq('$', field('name', $.symbol)),
    blank: ($) => '_',

    list: ($) =>
      seq(
        '[',
        optional('\n'),
        field('element', commaLineSep($._expression)),
        optional(field('element', $._expression)),
        ']',
      ),

    map: ($) =>
      prec.left(
        2,
        seq(
          '{',
          optional('\n'),
          choice(
            seq(',', optional('\n')),
            field('entry', seq($.map_entry, ',', optional('\n'))),
            seq(
              field('entry', commaLineSep1($.map_entry)),
              optional(field('entry', seq($.map_entry, optional('\n')))),
            ),
          ),
          '}',
        ),
      ),

    namedmap: ($) =>
      seq(
        choice('H{', 'M{'),
        optional('\n'),
        field('entry', commaLineSep($.map_entry)),
        optional(field('entry', $.map_entry)),
        '}',
      ),

    sets: ($) =>
      seq(
        'S{',
        optional('\n'),
        field('element', optional(commaLineSep1($._expression))),
        optional(field('element', $._expression)),
        '}',
      ),

    map_entry: ($) =>
      choice(
        seq(
          field('key', choice($.symbol, $.string, $.string_raw)),
          ':',
          optional('\n'),
          field('value', $._expression),
        ),
        field('key', $.symbol),
      ),

    params: ($) =>
      seq(
        '(',
        optional('\n'),
        seq(
          commaLineSep(
            seq(
              field('param', $.symbol),
              optional(seq('=', field('default', $.literal))),
            ),
          ),
          optional(
            seq(
              field('param', $.symbol),
              optional(seq('=', field('default', $.literal))),
            ),
          ),
        ),
        optional('\n'),
        optional(seq(',', '*', field('var_collect', $.symbol))),
        optional('\n'),
        ')',
      ),

    path_arg: ($) =>
      token(
        choice(
          /\/[^\s;\)\]\}]*/,
          /\.\.\/[^\s;\)\]\}]*/,
          /\.\/[^\s;\)\]\}]*/,
          /~\/[^\s;\)\]\}]*/,
          /\*\/[^\s;\)\]\}]*/,
          /\*\*\/[^\s;\)\]\}]*/,
          /\*\.[^\s;\)\]\}]*/,
          /https?:\/\/[^\s;\)\]\}]*/,
          /ftps?:\/\/[^\s;\)\]\}]*/,
          /file:\/\/[^\s;\)\]\}]*/,
        ),
      ),

    slash_arg: ($) =>
      choice(
        seq('-', token.immediate(/[a-zA-Z0-9]/)),
        seq(
          '--',
          token.immediate(
            seq(/[a-zA-Z][a-zA-Z0-9-]*/, optional(seq('=', /[^\s;)\]}]*/))),
          ),
        ),
      ),

    dot_arg: ($) => token('.'),

    stdout_ctrl: ($) =>
      field('operator', token(choice('&', '&-', '&+', '&?', '&.'))),

    declaration: ($) =>
      seq(
        'let',
        choice(
          $.normal_assign,
          $.multi_assign,
          $.destruct_list,
          $.destruct_map,
        ),
      ),

    normal_assign: ($) =>
      seq(
        field('target', $.symbol),
        choice(':=', '='),
        field('value', $._expression),
      ),

    multi_assign: ($) =>
      seq(
        field('targets', commaSep2(field('target', $.symbol))),
        '=',
        field('value', $._expression),
      ),

    destruct_list: ($) =>
      seq(
        '[',
        field(
          'target',
          commaSep1(choice($.symbol, seq('*', field('rest', $.symbol)))),
        ),
        ']',
        '=',
        field('value', $._expression),
      ),

    destruct_map: ($) =>
      seq(
        '{',
        field(
          'target',
          commaSep1(
            choice(
              $.symbol,
              seq(field('key', $.symbol), ':', field('alias', $.symbol)),
            ),
          ),
        ),
        '}',
        '=',
        field('value', $._expression),
      ),

    control_flow: ($) =>
      prec.right(
        2,
        choice(
          $.if_expr,
          $.while_expr,
          $.for_expr,
          $.loop_expr,
          $.match_expr,
          $.return_statement,
          $.break_statement,
          $.continue_statement,
          $.shift_statement,
        ),
      ),

    if_expr: ($) =>
      seq(
        'if',
        field('condition', $._expression),
        field('then_branch', $.block),
        optional(
          seq(
            'else',
            field('else_branch', prec.right(2, choice($.block, $.if_expr))),
          ),
        ),
      ),

    while_expr: ($) =>
      seq('while', field('condition', $._expression), field('body', $.block)),

    for_expr: ($) =>
      seq(
        'for',
        optional(seq(field('index', $.symbol), ',')),
        field('variable', $.symbol),
        'in',
        field('iterable', $._expression),
        field('body', $.block),
      ),

    loop_expr: ($) => seq('loop', field('body', $.block)),

    match_expr: ($) =>
      seq(
        'match',
        field('value', $._expression),
        '{',
        optional('\n'),
        field('arm', lineSep1($.match_arm)),
        optional('\n'),
        '}',
      ),

    match_arm: ($) =>
      prec.right(
        2,
        seq(
          field('pattern', commaSep1(choice($.symbol, $.literal))),
          '=>',
          field('result', choice($._expression, $.block)),
        ),
      ),

    return_statement: ($) =>
      prec.right(seq('return', field('value', optional($._expression)))),
    break_statement: ($) =>
      prec.right(seq('break', field('value', optional($._expression)))),
    continue_statement: ($) => prec.right('continue'),
    shift_statement: ($) => prec.right('shift'),

    function_def: ($) =>
      seq(
        repeat(field('decorator', $.decorator)),
        'fn',
        field('name', $.symbol),
        field('params', $.params),
        field('body', $.block),
        optional(
          choice(
            field('catcher', choice('?.', '?+', '??', '?>', '?!', '?~', '_!')),
            seq(
              field('catcher', choice('?:', '&:', '_:')),
              field('handler', prec.right(2, $._expression)),
            ),
          ),
        ),
      ),

    decorator: ($) =>
      seq(
        '@',
        field('name', $.symbol),
        optional(seq('(', field('args', commaSep1($._expression)), ')')),
      ),

    block: ($) =>
      seq(
        choice('%{', '{'),
        optional(repeat('\n')),
        field('statement', seq(optional(repeat($._statements)))),
        '}',
      ),

    use_statement: ($) =>
      seq(
        'use',
        field('module', choice($.string_raw, $.string, $.symbol, $.path_arg)),
        optional(seq('as', field('alias', $.symbol))),
      ),

    alias_statement: ($) =>
      seq('alias', field('name', $.symbol), '=', field('value', $._expression)),

    del_statement: ($) => seq('del', field('target', $.symbol)),

    export_statement: ($) =>
      seq(
        'export',
        field('name', $.symbol),
        optional(seq('=', field('value', $._expression))),
      ),

    set_statement: ($) =>
      seq('set', field('name', $.symbol), '=', field('value', $._expression)),

    comment: ($) => token(seq('#', /.*/)),

    // ----------basic--------
    file_size_literal: ($) =>
      seq(
        field('value', choice($.integer, $.float)),
        field('unit', choice('K', 'M', 'G', 'T', 'P', 'B')),
      ),

    integer: ($) =>
      token(
        seq(
          choice(
            seq('0b', /[01]+/),
            seq('0o', /[0-7]+/),
            seq('0x', /[0-9a-fA-F]+/),
            '0',
            seq(/[1-9]/, repeat(/[0-9]/)),
          ),
        ),
      ),
    float: ($) =>
      token(
        seq(
          choice(
            seq(/[0-9]+/, '.', /[0-9]+/),
            seq(optional('0'), '.', /[0-9]+/),
          ),
        ),
      ),

    string: ($) =>
      token(seq('"', repeat(choice(/[^"]/, seq('\\', /["]/))), '"')),
    string_raw: ($) =>
      token(
        seq(choice("'", "r'"), repeat(choice(/[^']/, seq('\\', /[']/))), "'"),
      ),
    string_safe: ($) =>
      token(seq("s'", repeat(choice(/[^']/, seq('\\', /[']/))), "'")),
    bytes: ($) =>
      token(seq("b'", repeat(choice(/[^']/, seq('\\', /[']/))), "'")),
    string_regex: ($) =>
      token(seq("g'", repeat(choice(/[^']/, seq('\\', /[']/))), "'")),
    string_time: ($) =>
      token(seq("t'", repeat(choice(/[^']/, seq('\\', /[']/))), "'")),

    string_raw_hash: ($) =>
      choice(
        token(seq("r#'", repeat(choice(/[^']/, seq("'", /[^#]/))), "'#")),
        token(
          seq(
            "r##'",
            repeat(choice(/[^']/, seq("'", /[^#]/), seq("'#", /[^#]/))),
            "'##",
          ),
        ),
        token(
          seq(
            "r###'",
            repeat(
              choice(
                /[^']/,
                seq("'", /[^#]/),
                seq("'#", /[^#]/),
                seq("'##", /[^#]/),
              ),
            ),
            "'###",
          ),
        ),
      ),

    string_template: ($) =>
      seq(
        '`',
        repeat(
          choice(
            /[^`$]+/,
            seq('\\', /[`$]/),
            $.variable,
            seq(choice('${', '{'), field('interpolation', $._expression), '}'),
          ),
        ),
        '`',
      ),

    boolean: ($) => choice('true', 'false'),
    none: ($) => 'none',
    module_call_expr: ($) =>
      seq(
        field('module', sepBy1('::', $.symbol)),
        '::',
        field('func', $.symbol),
        token.immediate('('),
        field('arg', optional(commaSep1($._expression))),
        ')',
      ),
  },
});

function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}
function commaSep2(rule) {
  return seq(rule, repeat1(seq(',', rule)));
}
function commaLineSep(rule) {
  return repeat(seq(rule, ',', optional('\n')));
}
function lineSep1(rule) {
  return repeat1(seq(rule, choice('\n', ';')));
}
function commaLineSep1(rule) {
  return repeat1(seq(rule, ',', optional('\n')));
}

function sepBy1(sep, rule) {
  return seq(rule, repeat(seq(sep, rule)));
}
