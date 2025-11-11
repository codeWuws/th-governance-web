# High Quality React App

一个基于 Vite + React + TypeScript 构建的高质量前端项目模板，集成了完整的开发工具链和最佳实践。

## ✨ 特性

- 🚀 **Vite** - 极速的构建工具和开发服务器
- ⚛️ **React 19** - 最新版本的 React
- 🔷 **TypeScript** - 类型安全的 JavaScript
- 🎨 **Prettier** - 代码格式化
 
- 📦 **自动化打包优化** - Gzip/Brotli 压缩、代码分割
- 🔍 **打包分析** - 可视化分析打包结果
- 🌐 **浏览器兼容性** - 现代浏览器支持
- 🛠️ **开发工具** - VSCode 配置、调试支持
- 📝 **完整的类型定义** - 全面的 TypeScript 类型支持

## 📁 项目结构

```
th-governance-web/
├── .vscode/                 # VSCode 配置
│   ├── settings.json       # 工作区设置
│   ├── extensions.json     # 推荐扩展
│   └── launch.json         # 调试配置
├── src/
│   ├── components/        # 组件目录
│   ├── pages/            # 页面目录
│   ├── hooks/            # 自定义 hooks
│   ├── utils/            # 工具函数
│   ├── types/            # 类型定义
│   ├── assets/           # 静态资源
│   └── styles/           # 样式文件
├── .browserslistrc       # 浏览器兼容性配置
├── .prettierrc           # Prettier 配置
├── .prettierignore       # Prettier 忽略文件
├── postcss.config.js     # PostCSS 配置
├── tsconfig.json         # TypeScript 配置
├── vite.config.ts        # Vite 配置
└── package.json          # 项目依赖和脚本
```

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 8.0.0

### 安装依赖

```bash
npm install
```

### 开发

```bash
npm run dev
```

项目将在 http://localhost:3000 启动

### 构建

```bash
npm run build
```

### 预览构建结果

```bash
npm run preview
```

### 打包分析

```bash
npm run build:analyze
```

## 📋 可用脚本

- `npm run dev` - 启动开发服务器
- `npm run build` - 构建生产版本
- `npm run build:analyze` - 构建并分析打包结果
- `npm run preview` - 预览构建结果
- `npm run format` - 格式化代码
- `npm run format:check` - 检查代码格式
- `npm run type-check` - TypeScript 类型检查

## 🔧 配置说明

### 代码质量

项目当前不使用 ESLint、Husky 与 lint-staged，改为以 TypeScript 严格模式与单元测试保障质量；保留 **Prettier** 用于统一代码格式。
 
 - **Prettier**: 统一的代码格式化规则

### TypeScript 配置

- 严格的类型检查
- 路径别名支持 (`@/` 指向 `src/`)
- 完整的类型定义文件

### 构建优化

- **代码分割**: 自动分离 vendor 和 utils 代码
- **压缩**: Gzip 和 Brotli 双重压缩
- **资源优化**: 按类型分类输出文件
- **Tree Shaking**: 自动移除未使用的代码
- **生产环境优化**: 移除 console 和 debugger

### 浏览器兼容性

支持现代浏览器：

- Chrome >= 87
- Firefox >= 78
- Safari >= 14
- Edge >= 88

## 🛠️ 开发工具

### VSCode 配置

项目包含完整的 VSCode 配置：

- 自动格式化和修复
- TypeScript 智能提示
- 调试配置
- 推荐扩展列表

### 环境变量

复制 `.env.example` 到 `.env.development` 并根据需要修改：

```bash
cp .env.example .env.development
```

支持的环境变量：

- `VITE_APP_TITLE` - 应用标题
- `VITE_APP_API_BASE_URL` - API 基础地址
- 更多配置请查看 `.env.example`

## 📚 最佳实践

### 组件开发

```typescript
// 使用函数组件和 TypeScript
import React from 'react'
import type { FC } from 'react'

interface Props {
  title: string
  onClick?: () => void
}

const MyComponent: FC<Props> = ({ title, onClick }) => {
  return (
    <div onClick={onClick}>
      <h1>{title}</h1>
    </div>
  )
}

export default MyComponent
```

### 自定义 Hooks

```typescript
// 使用 TypeScript 定义 Hook
import { useState, useEffect } from 'react'

interface UseApiResult<T> {
    data: T | null
    loading: boolean
    error: string | null
}

export const useApi = <T>(url: string): UseApiResult<T> => {
    const [data, setData] = useState<T | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        // API 调用逻辑
    }, [url])

    return { data, loading, error }
}
```

### 路径别名使用

```typescript
// 使用路径别名导入
import { Button } from '@/components/Button'
import { useAuth } from '@/hooks/useAuth'
import { ApiResponse } from '@/types'
import { formatDate } from '@/utils/date'
```

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 🙏 致谢

感谢以下优秀的开源项目：

- [Vite](https://vitejs.dev/)
- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Prettier](https://prettier.io/)

---

如果这个项目对你有帮助，请给它一个 ⭐️！
