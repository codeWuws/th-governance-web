# 版本控制使用说明

## 概述

项目支持两种版本模式，可以通过环境变量 `VITE_APP_VERSION` 进行切换：

- **演示版本（demo）**：只保留数据治理模块的接口，其他模块使用模拟数据
- **开发版本（dev）**：所有模块都支持接口调用（默认）

## 配置方式

### 环境变量配置

在 `.env` 或 `.env.local` 文件中设置：

```bash
# 演示版本
VITE_APP_VERSION=demo

# 开发版本（默认）
VITE_APP_VERSION=dev
```

### 数据治理模块接口路径

以下路径在演示版本中会正常调用接口：

- `/data/governance/*` - 数据治理核心接口

### 其他模块

在演示版本中，以下模块会自动使用模拟数据：

- 仪表盘模块（`/dashboard/*`）
- 数据管理模块（`/data/primary-index/*`）
- 数据库连接模块（`/database/connection/*`）
- 其他非数据治理模块

## 添加新的模拟数据提供者

### 1. 创建模拟数据提供者

在 `src/utils/mockProviders/` 目录下创建新的提供者文件，或修改 `index.ts`：

```typescript
import { registerMockData, createMockResponse } from '../mockAdapter'
import type { AxiosRequestConfig, AxiosResponse } from 'axios'

const myModuleMockProvider = {
    getMockData: async (config: AxiosRequestConfig): Promise<AxiosResponse> => {
        const url = config.url || ''
        
        // 根据不同的 URL 返回不同的模拟数据
        if (url.includes('/my-module/list')) {
            return createMockResponse({
                records: [],
                total: 0,
            })
        }
        
        throw new Error(`未实现的模拟数据: ${url}`)
    },
}

// 注册模拟数据提供者
registerMockData('/my-module', myModuleMockProvider)
```

### 2. 在入口文件中注册

在 `src/utils/mockProviders/index.ts` 的 `registerAllMockProviders` 函数中注册：

```typescript
export const registerAllMockProviders = (): void => {
    // ... 其他注册
    
    // 注册新模块
    registerMockData('/my-module', myModuleMockProvider)
}
```

## 开发新接口时的注意事项

### 1. 数据治理模块

数据治理模块的接口（路径以 `/data/governance/` 开头）在两种版本模式下都会调用真实接口，无需特殊处理。

### 2. 其他模块

开发其他模块的接口时：

- **开发版本**：正常开发，接口会自动调用
- **演示版本**：需要提供模拟数据，否则会显示警告日志

### 3. 独立模块的模拟数据控制

某些模块可能有自己的模拟数据开关（如数据检索模块的 `VITE_APP_USE_MOCK_DATA_RETRIEVAL`），这些开关独立于版本控制，可以单独配置。

## 调试和日志

在开发环境下，应用启动时会打印版本信息：

```
🚀 应用启动 {
  版本: 'demo',
  模式: '演示版本（仅数据治理模块使用真实接口）'
}
```

使用模拟数据时，会在控制台输出：

```
使用模拟数据: GET /dashboard/statistics
```

## 最佳实践

1. **新模块开发**：优先在开发版本下开发，确保接口正常工作后再添加模拟数据
2. **模拟数据**：模拟数据应该尽量接近真实数据结构，避免类型错误
3. **版本切换**：定期在演示版本下测试，确保所有功能正常
4. **文档更新**：添加新模块时，及时更新本文档

## 常见问题

### Q: 如何临时禁用某个模块的模拟数据？

A: 可以在 `shouldUseMockData` 函数中添加特殊判断，或者直接修改环境变量为 `dev`。

### Q: 模拟数据不匹配怎么办？

A: 检查模拟数据提供者的 URL 匹配规则，确保正确匹配到对应的接口。

### Q: 如何查看当前使用的版本？

A: 在浏览器控制台查看应用启动日志，或调用 `getVersionInfo()` 函数。

