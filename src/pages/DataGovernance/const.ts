// 执行状态映射
export const statusConfig = {
    0: { text: '未执行', color: 'default' }, // 灰色 - 未执行
    1: { text: '执行中', color: 'processing' }, // 蓝色 - 执行中
    2: { text: '已完成', color: 'success' }, // 绿色 - 完成
    3: { text: '暂停', color: 'warning' }, // 橙色 - 暂停
    4: { text: '跳过', color: 'default' }, // 灰色 - 跳过
    5: { text: '失败', color: 'error' }, // 红色 - 失败
}
