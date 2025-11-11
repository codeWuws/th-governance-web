# 项目架构文档

本文档描述了 High Quality React App 的技术架构、设计决策和最佳实践。

## 目录

- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [架构设计](#架构设计)
- [开发工具链](#开发工具链)
- [构建和部署](#构建和部署)
- [性能优化](#性能优化)
- [安全考虑](#安全考虑)

## 技术栈

### 核心技术

| 技术           | 版本 | 用途     | 选择原因                       |
| -------------- | ---- | -------- | ------------------------------ |
| **React**      | 19.x | UI 框架  | 成熟的生态系统，优秀的开发体验 |
| **TypeScript** | 5.x  | 类型系统 | 提供类型安全，提高代码质量     |
| **Vite**       | 6.x  | 构建工具 | 快速的开发服务器和构建速度     |

### 开发工具

| 工具            | 用途           | 配置文件           |
| --------------- | -------------- | ------------------ |
| **ESLint**      | 代码质量检查   | `eslint.config.js` |
| **Prettier**    | 代码格式化     | `.prettierrc`      |
| **Husky**       | Git hooks 管理 | `.husky/`          |
| **lint-staged** | 暂存文件检查   | `package.json`     |

### 构建优化

| 工具                         | 用途             |
| ---------------------------- | ---------------- |
| **Terser**                   | JavaScript 压缩  |
| **vite-plugin-compression**  | Gzip/Brotli 压缩 |
| **rollup-plugin-visualizer** | 打包分析         |
| **autoprefixer**             | CSS 前缀自动添加 |

## 项目结构

```
th-governance-web/
├── .vscode/                    # VSCode 配置
│   ├── settings.json          # 工作区设置
│   ├── extensions.json        # 推荐扩展
│   └── launch.json            # 调试配置
├── .husky/                    # Git hooks
│   └── pre-commit            # 提交前检查
├── docs/                      # 项目文档
│   └── ARCHITECTURE.md       # 架构文档
├── src/                       # 源代码
│   ├── components/           # 可复用组件
│   │   ├── ui/              # 基础 UI 组件
│   │   └── business/        # 业务组件
│   ├── pages/               # 页面组件
│   ├── hooks/               # 自定义 Hooks
│   ├── utils/               # 工具函数
│   │   ├── env.ts          # 环境变量工具
│   │   └── logger.ts       # 日志工具
│   ├── types/               # 类型定义
│   │   └── index.ts        # 全局类型
│   ├── assets/              # 静态资源
│   ├── styles/              # 样式文件
│   └── constants/           # 常量定义
├── public/                   # 公共资源
├── .browserslistrc          # 浏览器兼容性
├── .env.example             # 环境变量示例
├── .env.development         # 开发环境变量
├── eslint.config.js         # ESLint 配置
├── postcss.config.js        # PostCSS 配置
├── tsconfig.json            # TypeScript 配置
├── vite.config.ts           # Vite 配置
└── package.json             # 项目配置
```

## 架构设计

### 分层架构

```
┌─────────────────────────────────────┐
│              UI Layer               │
│         (Pages & Components)        │
├─────────────────────────────────────┤
│            Business Layer           │
│        (Hooks & State Management)   │
├─────────────────────────────────────┤
│            Service Layer            │
│         (API & Data Fetching)       │
├─────────────────────────────────────┤
│             Utility Layer           │
│        (Utils & Helpers)            │
└─────────────────────────────────────┘
```

### 组件架构

#### 组件分类

1. **基础组件 (UI Components)**
    - 纯展示组件
    - 无业务逻辑
    - 高度可复用

```typescript
// 示例：Button 组件
interface ButtonProps {
  variant: 'primary' | 'secondary'
  size: 'small' | 'medium' | 'large'
  onClick: () => void
  children: React.ReactNode
}

const Button: FC<ButtonProps> = ({ variant, size, onClick, children }) => {
  return (
    <button
      className={`btn btn-${variant} btn-${size}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
```

2. **业务组件 (Business Components)**
    - 包含业务逻辑
    - 使用自定义 Hooks
    - 特定场景使用

```typescript
// 示例：UserProfile 组件
const UserProfile: FC<{ userId: string }> = ({ userId }) => {
  const { user, loading, error } = useUser(userId)

  if (loading) return <Spinner />
  if (error) return <ErrorMessage error={error} />

  return (
    <div className="user-profile">
      <Avatar src={user.avatar} />
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  )
}
```

#### 组件设计原则

1. **单一职责原则**
    - 每个组件只负责一个功能
    - 保持组件简单和专注

2. **组合优于继承**
    - 使用组合模式构建复杂组件
    - 提供灵活的 API 设计

3. **Props 接口设计**
    - 明确的 TypeScript 接口定义
    - 合理的默认值设置
    - 可选和必需属性的平衡

### 状态管理

#### 状态分类

1. **本地状态 (Local State)**
    - 使用 `useState` 和 `useReducer`
    - 组件内部状态管理

2. **共享状态 (Shared State)**
    - 使用 Context API
    - 跨组件状态共享

3. **服务器状态 (Server State)**
    - 使用自定义 Hooks
    - 缓存和同步策略

#### 状态管理策略

```typescript
// 本地状态示例
const [count, setCount] = useState(0)

// 共享状态示例
const ThemeContext = createContext<ThemeContextType>()

// 服务器状态示例
const useUser = (id: string) => {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchUser(id)
            .then(setUser)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false))
    }, [id])

    return { user, loading, error }
}
```

### 路由架构

```typescript
// 路由配置示例
const routes: RouteConfig[] = [
    {
        path: '/',
        component: HomePage,
        exact: true,
    },
    {
        path: '/users/:id',
        component: UserDetailPage,
        guards: [AuthGuard],
    },
    {
        path: '/admin',
        component: AdminLayout,
        children: [
            {
                path: '/dashboard',
                component: DashboardPage,
            },
        ],
    },
]
```

## 开发工具链

### 代码质量保证

#### ESLint 配置

```javascript
// eslint.config.js
export default [
    {
        files: ['**/*.{ts,tsx}'],
        extends: [
            '@eslint/js/recommended',
            '@typescript-eslint/recommended',
            'plugin:react/recommended',
            'plugin:react-hooks/recommended',
        ],
        rules: {
            // 自定义规则
            '@typescript-eslint/no-unused-vars': 'error',
            'react/prop-types': 'off',
        },
    },
]
```

#### Prettier 配置

```json
{
    "semi": false,
    "singleQuote": true,
    "tabWidth": 2,
    "trailingComma": "es5",
    "printWidth": 100,
    "bracketSpacing": true,
    "arrowParens": "avoid"
}
```

### TypeScript 配置

#### 严格模式配置

```json
{
    "compilerOptions": {
        "strict": true,
        "noImplicitAny": true,
        "noImplicitReturns": true,
        "noImplicitThis": true,
        "noImplicitOverride": true,
        "exactOptionalPropertyTypes": true
    }
}
```

#### 路径别名

```json
{
    "compilerOptions": {
        "baseUrl": ".",
        "paths": {
            "@/*": ["src/*"],
            "@/components/*": ["src/components/*"],
            "@/utils/*": ["src/utils/*"],
            "@/types/*": ["src/types/*"]
        }
    }
}
```

### Git Hooks

#### Pre-commit Hook

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

#### lint-staged 配置

```json
{
    "lint-staged": {
        "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
        "*.{json,md}": ["prettier --write"]
    }
}
```

## 构建和部署

### Vite 构建配置

```typescript
// vite.config.ts
export default defineConfig({
    plugins: [
        react(),
        compression({ algorithm: 'gzip' }),
        compression({ algorithm: 'brotliCompress', ext: '.br' }),
    ],
    build: {
        target: 'es2020',
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: false,
        minify: 'terser',
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom'],
                    utils: ['lodash', 'date-fns'],
                },
            },
        },
    },
})
```

### 构建优化策略

1. **代码分割**
    - 路由级别的代码分割
    - 第三方库分离
    - 动态导入优化

2. **资源优化**
    - 图片压缩和格式优化
    - 字体文件优化
    - CSS 提取和压缩

3. **缓存策略**
    - 文件名哈希
    - 长期缓存配置
    - 增量更新支持

### 部署配置

#### 环境变量管理

```bash
# .env.production
VITE_APP_TITLE=High Quality React App
VITE_APP_API_BASE_URL=https://api.example.com
VITE_APP_ENABLE_ANALYTICS=true
```

#### 构建脚本

```json
{
    "scripts": {
        "build": "tsc && vite build",
        "build:analyze": "npm run build && npx vite-bundle-analyzer",
        "preview": "vite preview"
    }
}
```

## 性能优化

### 渲染优化

1. **React.memo**
    - 防止不必要的重渲染
    - 浅比较优化

2. **useMemo 和 useCallback**
    - 计算结果缓存
    - 函数引用稳定

3. **虚拟化**
    - 长列表优化
    - 大数据集处理

### 网络优化

1. **资源预加载**
    - 关键资源预加载
    - 路由预加载

2. **HTTP/2 优化**
    - 多路复用
    - 服务器推送

3. **CDN 配置**
    - 静态资源 CDN
    - 地理位置优化

### 监控和分析

```typescript
// 性能监控示例
export const performance = {
    mark: (name: string) => {
        if (isDevelopment()) {
            window.performance?.mark(name)
        }
    },

    measure: (name: string, startMark: string, endMark: string) => {
        if (isDevelopment()) {
            window.performance?.measure(name, startMark, endMark)
            const measure = window.performance?.getEntriesByName(name)[0]
            console.log(`${name}: ${measure?.duration}ms`)
        }
    },
}
```

## 安全考虑

### 前端安全

1. **XSS 防护**
    - 输入验证和转义
    - CSP 策略配置

2. **CSRF 防护**
    - Token 验证
    - SameSite Cookie

3. **依赖安全**
    - 定期安全审计
    - 漏洞扫描

### 环境变量安全

```typescript
// 安全的环境变量处理
export const getEnv = (key: string, defaultValue?: string): string => {
    const value = import.meta.env[key]

    if (!value && !defaultValue) {
        throw new Error(`Environment variable ${key} is required`)
    }

    return value || defaultValue!
}

// 不要在前端暴露敏感信息
export const getPublicConfig = () => ({
    apiBaseUrl: getEnv('VITE_APP_API_BASE_URL'),
    appTitle: getEnv('VITE_APP_TITLE'),
    // 不包含敏感的 API 密钥等
})
```

## 最佳实践

### 代码组织

1. **文件命名**
    - 使用 PascalCase 命名组件文件
    - 使用 camelCase 命名工具函数文件
    - 使用 kebab-case 命名样式文件

2. **导入顺序**

    ```typescript
    // 1. React 相关
    import React from 'react'
    import { useState, useEffect } from 'react'

    // 2. 第三方库
    import axios from 'axios'
    import { format } from 'date-fns'

    // 3. 内部模块
    import { Button } from '@/components/Button'
    import { useAuth } from '@/hooks/useAuth'

    // 4. 相对导入
    import './Component.css'
    ```

3. **类型定义**

    ```typescript
    // 优先使用 interface
    interface User {
        id: number
        name: string
        email: string
    }

    // 复杂类型使用 type
    type Status = 'loading' | 'success' | 'error'
    type UserWithStatus = User & { status: Status }
    ```

### 错误处理

```typescript
// 错误边界组件
class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />
    }

    return this.props.children
  }
}
```

### 测试策略

1. **单元测试**
    - 工具函数测试
    - 组件逻辑测试

2. **集成测试**
    - 组件交互测试
    - API 集成测试

3. **端到端测试**
    - 用户流程测试
    - 关键功能测试

---

本架构文档会随着项目的发展持续更新和完善。如有疑问或建议，请参考 [贡献指南](../CONTRIBUTING.md)。
