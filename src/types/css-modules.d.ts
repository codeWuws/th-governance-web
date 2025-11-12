/**
 * CSS Modules 类型定义
 * 为 .module.scss 和 .module.css 文件提供 TypeScript 类型支持
 */

declare module '*.module.scss' {
    const classes: Readonly<Record<string, string>>
    export default classes
}

declare module '*.module.css' {
    const classes: Readonly<Record<string, string>>
    export default classes
}

declare module '*.scss' {
    const content: Readonly<Record<string, string>>
    export default content
}

declare module '*.css' {
    const content: Readonly<Record<string, string>>
    export default content
}
