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

  conflicts: ($) => [
    // [$.chain_expr, $.function_call],
    [$.lambda_params, $._primary_expr],
    // [$._primary_expr, $.map_entry],
    // [$.slice_expr, $.index_expr],
    // [$.slice_expr, $.index_expr, $.command_argument],
    // [$.index_expr, $.command_argument],
    // [$.index_expr, $.chain_expr, $.command_argument],
    // [$.add_sub_expr, $.command_argument],
    // [$.control_flow, $._expression],
    // [$.map, $.block],
    [$.map, $.map_entry],
    [$.map],
    // [$.command_expr, $.literal],
    // after add index_expr to chain_expr
    // [$.command_expr, $._primary_expr],
    // [$.command_expr, $._expression],
    // [$.command_expr, $.literal],
    // [$.command_expr, $.command_argument],
    // [$.command_argument, $._primary_expr],
    // [$.command_argument, $._expression],
  ],

  precedences: ($) => [
    [
      $.control_flow,
      $.command_argument,
      $.command_expr,
      $._primary_expr,
      $._expression,
    ],
    [$.lambda_expr, $._primary_expr],
    [$.match_arm, $._primary_expr],
    // [$.map_entry, $._primary_expr],
    [
      $.group_expr,
      // $.control_flow,
      // $._primary_expr,
      $.slice_expr,
      $.index_expr,
      $.unit_expr,
      $.range_expr,
      $.chain_expr,
      $.property_expr,
      $.function_call,
      $.unary_expr,
      $.power_expr,
      $.mul_div_expr,
      $.add_sub_expr,
      $.comparison_expr,
      $.logical_and_expr,
      $.logical_or_expr,
      $.conditional_expr,
      // $.lambda_params,
      $.lambda_expr,
      $.catch_expr,
      $.pipe_expr,
      $.assign_expr,
    ],
  ],

  rules: {
    lumesh: ($) =>
      seq(
        optional(repeat('\n')),
        repeat(seq($._statement, repeat1(choice(';', '\n')))),
        optional($._statement),
      ),

    _statement: ($) =>
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

    _expression: ($) =>
      choice(
        // flow
        $.if_expr,
        // $.while_expr,
        $.for_expr,
        // $.loop_expr,
        $.match_expr,
        // normal
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
        $.path_arg,
      ),

    group_expr: ($) => seq('(', field('content', $._expression), ')'),

    _postfix_expr: ($) =>
      choice($.slice_expr, $.index_expr, $.unit_expr, $.range_expr),

    _indexable_expr: ($) =>
      choice(
        $.literal,
        $.symbol,
        $.variable,
        $.list,
        $.namedmap,
        $.map,
        $.sets,
        $.group_expr,
        $.chain_expr,
        $.property_expr,
        $.function_call,
        $.index_expr,
        $.slice_expr,
        // 不包含 $.block、$.if_expr、$.while_expr 等以 block 收尾的控制流结构
      ),

    slice_expr: ($) =>
      prec.left(
        seq(
          field('object', $._indexable_expr),
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
        seq(
          field('object', $._indexable_expr),
          choice(
            seq(token.immediate('['), field('index', $._expression), ']'),
            // seq(token.immediate('@'), field('index', $._expression)),
            // seq(token.immediate('.'), field('property', $.symbol)),
          ),
        ),
      ),

    property_expr: ($) =>
      prec.left(
        seq(
          field('object', choice($.symbol, $.variable, $.chain_expr)),
          token.immediate('.'),
          field('property', $.symbol),
        ),
      ),

    chain_expr: ($) =>
      prec.left(
        seq(
          field(
            'object',
            choice(
              $.literal,
              $.symbol,
              $.variable,
              $.index_expr,
              $.property_expr,
              $.chain_expr,
            ),
          ),
          repeat1(
            seq(
              token.immediate('.'),
              field('method', $.symbol),
              token.immediate('('),
              field('arguments', optional(commaSep1($._expression))),
              ')',
            ),
          ),
        ),
      ),

    function_call: ($) =>
      prec.left(
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

    // apply_expr: ($) =>
    //   prec.left(
    //     seq(
    //       field('func', $._expression),
    //       token.immediate('('),
    //       field('arg', optional(commaSep1($._expression))),
    //       ')',
    //     ),
    //   ),

    unit_expr: ($) =>
      prec.right(
        seq(
          field('value', choice($.integer, $.float)),
          field(
            'unit',
            token.immediate(choice('K', 'M', 'G', 'T', 'P', 'B', '%')),
          ),
        ),
      ),

    range_expr: ($) =>
      prec.left(
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

    unary_expr: ($) =>
      prec.right(
        seq(
          token(field('operator', choice('!', '-'))),
          field(
            'operand',
            choice(
              $.variable,
              $.symbol,
              $.group_expr,
              $.literal,
              $.chain_expr,
              $.property_expr,
              $.function_call,
              $.index_expr,
              $.slice_expr,
            ),
          ),
        ),
      ),

    power_expr: ($) =>
      prec.left(
        seq(
          field('base', $._expression),
          field('operator', '^'),
          field('exponent', $._expression),
        ),
      ),

    mul_div_expr: ($) =>
      prec.left(
        seq(
          field('left', $._expression),
          field('operator', choice('*', '/', '%')),
          field('right', $._expression),
        ),
      ),

    add_sub_expr: ($) =>
      prec.left(
        seq(
          field('left', $._expression),
          field('operator', choice('+', '-')),
          field('right', $._expression),
        ),
      ),

    command_expr: ($) =>
      prec.left(
        seq(
          field(
            'cmd',
            choice($.symbol, $.variable, $.property_expr, $.path_arg),
          ),
          field('arg', repeat1($.command_argument)),
          field('redirect', optional($.stdout_ctrl)),
        ),
      ),

    command_argument: ($) =>
      prec.left(
        choice(
          $.slash_arg,
          // $._primary_expr,
          $.literal,
          $.symbol,
          $.symbol_raw,
          $.variable,
          $.list,
          $.namedmap,
          $.sets,
          // other
          $.group_expr,
          $.path_arg,
          // $.unary_expr,
          $.dot_arg,
          $.chain_expr,
          $.property_expr,
          $.function_call,
        ),
      ),
    comparison_expr: ($) =>
      prec.left(
        seq(
          field('left', $._expression),
          field(
            'operator',
            choice(
              '===',
              '!==',
              '==',
              '!=',
              '>',
              '<',
              '>=',
              '<=',
              // '~~',
              // '~=',
              '~:',
              // '!~~',
              '!~:',
            ),
          ),
          field('right', $._expression),
        ),
      ),

    logical_and_expr: ($) =>
      prec.left(
        seq(
          field('left', $._expression),
          field('operator', '&&'),
          field('right', $._expression),
        ),
      ),

    logical_or_expr: ($) =>
      prec.left(
        seq(
          field('left', $._expression),
          field('operator', '||'),
          field('right', $._expression),
        ),
      ),

    conditional_expr: ($) =>
      prec.right(
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
        seq(
          choice(field('param', $.symbol), $.lambda_params),
          '->',
          field('body', choice($._expression, $.block)),
        ),
      ),

    lambda_params: ($) =>
      seq('(', optional(commaSep1(field('param', $.symbol))), ')'),

    catch_expr: ($) =>
      prec.left(
        seq(
          field('try', $._expression),
          choice(
            field('catcher', choice('?.', '?+', '??', '?>', '?!', '?~', '_!')),
            seq(
              field('catcher', choice('?:', '&:', '_:')),
              field('handler', $._expression),
            ),
          ),
        ),
      ),

    pipe_expr: ($) =>
      prec.left(
        seq(
          field('left', $._expression),
          field('operator', choice('|', '|>', '|^', '<<', '>>', '>!')),
          field('right', choice($.pipe_method_expr, $._expression)),
        ),
      ),

    pipe_method_expr: ($) =>
      seq(
        token.immediate(' .'),
        field('method', $.symbol),
        token.immediate('('),
        field('arg', optional(commaSep1($._expression))),
        ')',
      ),

    module_call_expr: ($) =>
      prec.left(
        seq(
          field('module', sepBy1('::', $.symbol)),
          '::',
          field('func', $.symbol),
          token.immediate('('),
          field('arg', optional(commaSep1($._expression))),
          ')',
        ),
      ),

    assign_expr: ($) =>
      prec.right(
        seq(
          field('target', $.symbol),
          field('operator', choice('=', '+=', '-=', '*=', '/=')),
          field('value', $._expression),
        ),
      ),

    // quote_expr: ($) => seq("'", field('content', $._expression), "'"),

    literal: ($) =>
      choice(
        $.integer,
        $.float,
        $.string,
        $.string_raw,
        $.string_safe,
        $.string_raw_hash,
        $.string_regex,
        $.string_time,
        $.string_template,
        $.bytes,
        // $.path_arg,
        $.boolean,
        $.none,
        $.blank,
        $.file_size_literal,
      ),

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

    symbol: ($) => token(/[a-zA-Z_][a-zA-Z0-9_\-]*/), // ~?&#$@/\\
    symbol_raw: ($) => seq($.symbol, token.immediate('^')),
    variable: ($) => seq('$', field('name', $.symbol)),
    // var_sym: ($) => seq(optional('$'), field('name', $.symbol)),
    blank: ($) => '_',

    list: ($) =>
      seq(
        '[',
        optional('\n'),
        field('element', commaLineSep($._expression)),
        optional(field('element', $._expression)),
        // optional(seq(',', optional('\n'))),
        ']',
      ),

    // map_entry: ($) =>
    //   choice(
    //     seq(
    //       field('key', choice($.symbol, $.string, $.string_raw)),
    //       ':',
    //       optional('\n'),
    //       field('value', $._expression),
    //     ),
    //     field('kv', $.symbol), // 裸key简写
    //   ),

    map: ($) =>
      seq(
        '{',
        optional(repeat('\n')),
        choice(
          seq(',', optional(repeat('\n'))), // 空map: {,}

          // 情形A：只有一个entry，且是"带冒号"形式 —— 逗号可省
          seq(field('entry', $.map_kv_entry), optional(',')),

          // 情形B：一个entry后面跟至少一次"逗号+entry" —— 覆盖：
          //   - 多个entry（不管起手是colon还是裸key）
          //   - 单个裸key但强制带逗号（此时 repeat1 至少循环0次也没关系，
          //     因为下面单独用 optional(',') 处理"只有裸key+逗号、没有更多entry"的情况）
          seq(
            field('entry', $.map_entry),
            repeat1(
              seq(',', optional(repeat('\n')), field('entry', $.map_entry)),
            ),
            optional(','),
          ),
        ),
        optional(repeat('\n')),
        '}',
      ),

    map_kv_entry: ($) =>
      seq(
        field('key', choice($.symbol, $.string, $.string_raw)),
        ':',
        optional('\n'),
        field('value', $._expression),
      ),

    map_kv_bare: ($) => field('kv', $.symbol),

    map_entry: ($) => choice($.map_kv_entry, $.map_kv_bare),

    namedmap: ($) =>
      seq(
        choice('H{', 'M{'),
        optional('\n'),
        field('entry', commaLineSep($.map_entry)),
        optional(field('entry', $.map_entry)),
        optional('\n'),
        '}',
      ),

    sets: ($) =>
      seq(
        'S{',
        optional('\n'),
        field('element', optional(commaLineSep1($._expression))),
        optional(field('element', $._expression)),
        optional('\n'),
        '}',
      ),

    params: ($) =>
      seq(
        '(',
        optional('\n'),
        seq(
          // 有逗号形参，0-n个
          commaLineSep(
            seq(
              field('param', $.symbol),
              optional(seq('=', field('default', $.literal))),
            ),
          ),
          // 允许无逗号形参，1个
          optional(
            seq(
              field('param', $.symbol),
              optional(seq('=', field('default', $.literal))),
            ),
          ),
        ),
        optional('\n'),
        // 剩余参数收集
        optional(seq(',', '*', field('var_collect', $.symbol))),
        optional('\n'),
        ')',
      ),

    // path遇到空白、括号和分号终止
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
        token(prec(10, seq('-', token.immediate(/[a-zA-Z0-9]/)))),
        seq(
          '--',
          token.immediate(
            seq(/[a-zA-Z][a-zA-Z0-9-]*/, optional(seq('=', /[^\s;)\]}]*/))),
          ),
        ),
        token('--'),
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
      choice(
        $.if_expr,
        $.for_expr,
        $.match_expr,
        $.loop_expr,
        $.while_expr,
        $.return_statement,
        $.break_statement,
        $.continue_statement,
        $.shift_statement,
      ),

    if_expr: ($) =>
      seq(
        'if',
        field(
          'condition',
          choice(
            $.group_expr,
            $.chain_expr,
            $.property_expr,
            $.function_call,
            $.module_call_expr,
            $._postfix_expr,
            $.unary_expr, // only simple
            $.power_expr,
            $.mul_div_expr,
            $.add_sub_expr,
            $.command_expr,
            $.comparison_expr,
            $.logical_and_expr,
            $.logical_or_expr,
            $.conditional_expr,
            // $.lambda_expr,
            $.catch_expr,
            $.pipe_expr,
            // $.assign_expr,
            // $._primary_expr,
            $.literal,
            $.symbol,
            $.variable,
          ),
        ),
        field('then_branch', $.block),
        optional(seq('else', field('else_branch', choice($.block, $.if_expr)))),
      ),

    // _condition: ($) =>
    //   choice(
    //     $.property_expr,
    //     $.group_expr,
    //     $.function_call,
    //     $._postfix_expr,
    //     $.unary_expr,
    //     $.power_expr,
    //     $.mul_div_expr,
    //     $.add_sub_expr,
    //     $.comparison_expr,
    //     $.logical_and_expr,
    //     $.logical_or_expr,
    //     $.conditional_expr,
    //     $._primary_expr,
    //   ),

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
      seq(
        field('pattern', commaSep1(choice($.symbol, $.literal))),
        '=>',
        field('result', choice($._expression, $.block)),
      ),

    return_statement: ($) =>
      prec.right(seq('return', field('value', optional($._expression)))),

    break_statement: ($) =>
      prec.right(seq('break', field('value', optional($._expression)))),
    continue_statement: ($) => token('continue'),
    shift_statement: ($) => token('shift'),

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
              field(
                'handler',
                choice(
                  $.symbol,
                  $.variable,
                  $.literal,
                  $.group_expr,
                  $.chain_expr,
                  $.property_expr,
                  $.function_call,
                  $.module_call_expr,
                  // $.command_expr,
                  $.lambda_expr,
                ),
              ),
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
        repeat(seq($._statement, repeat1(choice(';', '\n')))),
        optional(field('statement', $._statement)),
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
