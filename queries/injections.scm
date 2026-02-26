; Markdown 代码块注入
; (
;   (fenced_code_block
;     (info_string
;       (language) @language
;       (#eq? @language "lumesh")))
;   .
;   (code_fence_content) @injection.content
;   (#set! injection.combined)
;   (#set! injection.language "lumesh")
; )
