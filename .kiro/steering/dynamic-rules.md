# 动态规则示例

## 临时约束
如果你需要我临时遵循特定规则，可以：
1. 直接在聊天中告诉我
2. 修改这个文件
3. 创建新的 steering 文件

## 规则优先级
1. 聊天中的直接指令（最高优先级）
2. Workspace-level steering 文件
3. Global-level steering 文件
4. 系统默认规则

## 示例用法
- "请按照 FHIR 标准生成这个医学数据接口"
- "使用 #code-review-rules 审查这段代码"
- "临时忽略样式规范，专注功能实现"