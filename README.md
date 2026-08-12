tree-sitter for [lumesh](https://github.com/superiums/lumesh)

# 1. 生成解析器（parser.c）  
tree-sitter generate  
  
# 2. 编译为共享库（.so / .dylib / .dll，用于 Emacs/Helix 等原生绑定）  
tree-sitter build  
  
# 或编译为 WASM（用于 VS Code、浏览器等）  
tree-sitter build --wasm


## to test:
tree-sitter parse <file>
