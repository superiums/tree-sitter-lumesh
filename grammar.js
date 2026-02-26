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
    [$.multi_assign, $.normal_assign],
    // [$.chain_expr, $.function_call],
    [$.lambda_params, $._primary_expr],
    // [$.slice_expr, $.index_expr],
    // [$.slice_expr, $.index_expr, $.command_argument],
    // [$.index_expr, $.command_argument],
    // [$.index_expr, $.chain_expr, $.command_argument],
    // [$.add_sub_expr, $.command_argument],
    [$.control_flow, $._expression],
    [$.map, $.block],

    [$.command_expr, $.literal],
    // after add index_expr to chain_expr
    [$.command_expr, $._primary_expr],
    [$.command_expr, $._expression],
    [$.command_expr, $.command_argument],
    [$.command_argument, $._primary_expr],
    [$.command_argument, $._expression],
  ],

  precedences: ($) => [
    [$.control_flow],
    [$.group_expr],
    [$._primary_expr],
    [$.slice_expr],
    [$.index_expr],
    [$.unit_expr],
    [$.range_expr],
    [$.chain_expr],
    [$.property_expr],
    [$.function_call],
    [$.unary_expr],
    [$.power_expr],
    [$.mul_div_expr],
    [$.add_sub_expr],
    [$.command_argument],
    [$.command_expr],
    [$.comparison_expr],
    [$.logical_and_expr],
    [$.logical_or_expr],
    [$.conditional_expr],
    [$.lambda_params],
    [$.lambda_expr],
    [$.catch_expr],
    [$.pipe_expr],
    [$.assign_expr],
  ],

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
        repeat1(choice(';', '\n')),
      ),
    _statement_inline: ($) =>
      choice(
        $.control_flow,
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
      ),

    group_expr: ($) => seq('(', field('content', $._expression), ')'),

    _postfix_expr: ($) =>
      choice($.slice_expr, $.index_expr, $.unit_expr, $.range_expr),

    slice_expr: ($) =>
      prec.left(
        seq(
          field('object', $._expression),
          token.immediate('['),
          field('start', choice($.integer, $.symbol, $.variable, $.blank)),
          choice('..=', '..'),
          field('end', choice($.integer, $.symbol, $.variable, $.blank)),
          optional(
            seq(':', field('step', choice($.integer, $.symbol, $.variable))),
          ),
          ']',
        ),
      ),

    index_expr: ($) =>
      prec.left(
        seq(
          field('object', $._expression),
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
          field('object', choice($.symbol, $.variable)),
          token.immediate('.'),
          field('property', $.symbol),
        ),
      ),

    chain_expr: ($) =>
      prec.left(
        seq(
          field(
            'object',
            choice($.literal, $.symbol, $.variable, $.index_expr),
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
          field('arg', optional(commaSep1($._expression))),
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
      prec.left(
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
      // choice(
      // prec.right(
      //   seq(
      //     field('operator', choice('++', '--')),
      //     field('operand', $._expression),
      //   ),
      // ),
      prec.right(
        seq(
          token(field('operator', choice('!', '-'))),
          field('operand', $._expression),
        ),
      ),
    // prec.left(
    //   seq(
    //     field('operand', $._expression),
    //     field('operator', token.immediate(choice('++', '--'))),
    //   ),
    // ),
    // ),

    power_expr: ($) =>
      prec.right(
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
          field('cmd', choice($.symbol, $.property_expr, $.path_arg)),
          field('arg', repeat1($.command_argument)),
          field('redirect', optional($.stdout_ctrl)),
        ),
      ),

    command_argument: ($) =>
      choice(
        // $._primary_expr,
        $.literal,
        $.symbol,
        $.variable,
        $.list,
        $.namedmap, //never map
        $.sets,
        // other
        $.group_expr,
        // $.path_arg,
        $.chain_expr,
        $.property_expr,
        $.function_call,
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
          field('try', choice($._expression, $.function_def)),
          choice(
            field('catcher', choice('?.', '?+', '??', '?>', '?!', '?~')),
            seq(
              field('catcher', '?:'),
              field('handler', choice($._expression)),
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
        $.string_regex,
        $.string_time,
        $.string_template,
        $.path_arg,
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
      token(seq(optional('-'), choice('0', seq(/[1-9]/, repeat(/[0-9]/))))),

    float: ($) =>
      token(
        seq(
          optional('-'),
          choice(seq(/[0-9]+/, '.', /[0-9]+/), seq('0', '.', /[0-9]+/)),
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
                '\\',
                choice(
                  '"',
                  '\\',
                  '/',
                  'b',
                  'f',
                  'n',
                  'r',
                  't',
                  seq('u', /[0-9a-fA-F]{4}/),
                ),
              ),
            ),
          ),
          '"',
        ),
      ),

    string_raw: ($) => token(seq("'", repeat(/[^']/), "'")),
    string_regex: ($) => token(seq("r'", repeat(/[^']/), "'")),
    string_time: ($) => token(seq("t'", repeat(/[^']/), "'")),

    string_template: ($) =>
      seq(
        '`',
        repeat(
          choice(
            /[^`$]+/,
            $.variable,
            seq('${', field('interpolation', $._expression), '}'),
          ),
        ),
        '`',
      ),

    boolean: ($) => choice('true', 'false'),
    none: ($) => 'none',

    symbol: ($) => /[a-zA-Z_][a-zA-Z0-9_]*/,
    variable: ($) => seq('$', field('name', $.symbol)),
    // var_sym: ($) => seq(optional('$'), field('name', $.symbol)),
    blank: ($) => '_',

    list: ($) =>
      seq(
        '[',
        optional('\n'),
        field('element', commaLineSep($._expression)),
        optional($._expression),
        // optional(seq(',', optional('\n'))),
        ']',
      ),

    map: ($) =>
      seq(
        '{',
        optional('\n'),
        choice(
          // 空 map 必须有逗号：{,} 或 {,\n}
          seq(',', optional('\n')),
          // 仅有1个entry且不带,的
          seq($.map_entry, optional('\n')),
          // 1个及以上
          seq(
            field('entry', commaLineSep1($.map_entry)),
            optional(seq($.map_entry, optional('\n'))),
          ),
        ),
        '}',
      ),

    namedmap: ($) =>
      seq(
        choice('H{', 'M{'),
        optional('\n'),
        field('entry', commaLineSep($.map_entry)),
        optional($.map_entry),
        '}',
      ),

    sets: ($) =>
      seq(
        'S{',
        optional('\n'),
        field('element', optional(commaLineSep1($._expression))),
        optional($._expression),
        '}',
      ),

    map_entry: ($) =>
      seq(
        field('key', choice($.symbol, $.string, $.string_raw)),
        ':',
        optional('\n'),
        field('value', $._expression),
      ),

    params: ($) =>
      seq(
        '(',
        optional(
          seq(
            commaSep1(
              seq(
                field('param', $.symbol),
                optional(seq('=', field('default', $.literal))),
              ),
            ),
            // 允许无逗号形参
            optional(
              seq(
                field('param', $.symbol),
                optional(seq('=', field('default', $.literal))),
              ),
            ),
          ),
        ),
        optional(seq(',', '*', field('var_collect', $.symbol))),
        ')',
      ),

    // path遇到空白、括号和分号终止
    path_arg: ($) =>
      token(
        choice(
          seq('--', /[a-zA-Z][a-zA-Z0-9-]*/),
          seq('-', /[a-zA-Z]/),
          /\/[^\s;\)\]\}]*/,
          /\.\.\/[^\s;\)\]\}]*/,
          /\.\/[^\s;\)\]\}]*/,
          ' . ',
          /~\/[^\s;\)\]\}]*/,
          /\*\/[^\s;\)\]\}]*/,
          /\*\*\/[^\s;\)\]\}]*/,
          /\*\.[^\s;\)\]\}]*/,
          /https?:\/\/[^\s;\)\]\}]*/,
          /ftp:\/\/[^\s;\)\]\}]*/,
          /file:\/\/[^\s;\)\]\}]*/,
        ),
      ),

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
        field('targets', commaSep1($.symbol)),
        '=',
        field('values', commaSep1($._expression)),
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
        $.while_expr,
        $.for_expr,
        $.loop_expr,
        $.match_expr,
        $.return_statement,
        $.break_statement,
      ),

    if_expr: ($) =>
      seq(
        'if',
        field('condition', $._expression),
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

    function_def: ($) =>
      seq(
        repeat(field('decorator', $.decorator)),
        'fn',
        field('name', $.symbol),
        field('params', $.params),
        field('body', $.block),
      ),

    decorator: ($) =>
      seq(
        '@',
        field('name', $.symbol),
        optional(seq('(', field('args', commaSep1($._expression)), ')')),
      ),

    block: ($) =>
      seq(
        '{',
        optional(repeat('\n')),
        field(
          'statement',
          seq(optional(repeat($._statements)), optional($._statement_inline)),
        ),
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
