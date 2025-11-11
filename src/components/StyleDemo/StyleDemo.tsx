import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    ExclamationCircleOutlined,
    HeartOutlined,
    SettingOutlined,
    StarOutlined,
    UserOutlined,
} from '@ant-design/icons'
import { Button, Card, Col, Progress, Row, Space, Tag, Typography } from 'antd'
import React, { useState } from 'react'
import styles from './StyleDemo.module.scss'

const { Title, Paragraph, Text } = Typography

/**
 * 样式演示组件
 * 展示 SCSS + PostCSS + CSS Modules 的集成使用
 */
export const StyleDemo: React.FC = () => {
    const [inputValue, setInputValue] = useState('')
    const [inputError, setInputError] = useState(false)

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setInputValue(value)
        setInputError(value.length > 0 && value.length < 3)
    }

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>SCSS + CSS Modules 样式演示</h1>

            {/* 按钮演示 */}
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>按钮样式演示</h2>
                <div className={styles.buttonGroup}>
                    <button className={styles.button}>主要按钮</button>
                    <button className={`${styles.button} ${styles.secondary}`}>次要按钮</button>
                    <button className={`${styles.button} ${styles.success}`}>成功按钮</button>
                    <button className={`${styles.button} ${styles.warning}`}>警告按钮</button>
                    <button className={`${styles.button} ${styles.danger}`}>危险按钮</button>
                    <button className={`${styles.button} ${styles.large}`}>大按钮</button>
                    <button className={`${styles.button} ${styles.small}`}>小按钮</button>
                </div>
            </div>

            {/* 卡片演示 */}
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>卡片样式演示</h2>
                <div className={styles.cardGrid}>
                    <div className={`${styles.card} ${styles.fadeIn}`}>
                        <div className={styles.cardHeader}>
                            <h3 className={styles.cardTitle}>用户管理</h3>
                            <UserOutlined className={styles.cardIcon} />
                        </div>
                        <div className={styles.cardContent}>
                            管理系统用户信息，包括用户注册、登录、权限分配等功能。支持批量操作和数据导入导出。
                        </div>
                        <div className={styles.cardFooter}>
                            <span className={styles.cardAction}>查看详情 →</span>
                        </div>
                    </div>

                    <div className={`${styles.card} ${styles.slideInLeft}`}>
                        <div className={styles.cardHeader}>
                            <h3 className={styles.cardTitle}>系统设置</h3>
                            <SettingOutlined className={styles.cardIcon} />
                        </div>
                        <div className={styles.cardContent}>
                            配置系统参数，包括基础设置、安全配置、通知设置等。提供灵活的配置选项和实时预览。
                        </div>
                        <div className={styles.cardFooter}>
                            <span className={styles.cardAction}>查看详情 →</span>
                        </div>
                    </div>

                    <div className={`${styles.card} ${styles.slideInRight}`}>
                        <div className={styles.cardHeader}>
                            <h3 className={styles.cardTitle}>数据分析</h3>
                            <HeartOutlined className={styles.cardIcon} />
                        </div>
                        <div className={styles.cardContent}>
                            提供丰富的数据分析功能，包括图表展示、报表生成、数据挖掘等。支持多维度数据分析。
                        </div>
                        <div className={styles.cardFooter}>
                            <span className={styles.cardAction}>查看详情 →</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 表单演示 */}
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>表单样式演示</h2>
                <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>用户名</label>
                            <input
                                type='text'
                                className={styles.input}
                                placeholder='请输入用户名'
                                value={inputValue}
                                onChange={handleInputChange}
                            />
                            {inputError && (
                                <div className={`${styles.helpText} ${styles.error}`}>
                                    用户名至少需要3个字符
                                </div>
                            )}
                        </div>
                    </Col>
                    <Col xs={24} md={12}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>邮箱地址</label>
                            <input
                                type='email'
                                className={`${styles.input} ${styles.success}`}
                                placeholder='请输入邮箱地址'
                                defaultValue='user@example.com'
                            />
                            <div className={`${styles.helpText} ${styles.success}`}>
                                邮箱格式正确
                            </div>
                        </div>
                    </Col>
                    <Col xs={24}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>个人简介</label>
                            <textarea
                                className={styles.textarea}
                                placeholder='请输入个人简介'
                                rows={4}
                            />
                            <div className={styles.helpText}>最多可输入200个字符</div>
                        </div>
                    </Col>
                </Row>
            </div>

            {/* 标签演示 */}
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>标签样式演示</h2>
                <div className={styles.tagGroup}>
                    <span className={styles.tag}>默认标签</span>
                    <span className={`${styles.tag} ${styles.primary}`}>主要标签</span>
                    <span className={`${styles.tag} ${styles.success}`}>成功标签</span>
                    <span className={`${styles.tag} ${styles.warning}`}>警告标签</span>
                    <span className={`${styles.tag} ${styles.danger}`}>危险标签</span>
                </div>
            </div>

            {/* 进度条演示 */}
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>进度条样式演示</h2>
                <div className={styles.progressGroup}>
                    <div className={styles.progressItem}>
                        <div className={styles.progressLabel}>
                            <span className={styles.progressText}>项目进度</span>
                            <span className={styles.progressPercent}>75%</span>
                        </div>
                        <div className={styles.progressBar}>
                            <div className={styles.progressFill} style={{ width: '75%' }} />
                        </div>
                    </div>

                    <div className={styles.progressItem}>
                        <div className={styles.progressLabel}>
                            <span className={styles.progressText}>任务完成度</span>
                            <span className={styles.progressPercent}>90%</span>
                        </div>
                        <div className={styles.progressBar}>
                            <div
                                className={`${styles.progressFill} ${styles.success}`}
                                style={{ width: '90%' }}
                            />
                        </div>
                    </div>

                    <div className={styles.progressItem}>
                        <div className={styles.progressLabel}>
                            <span className={styles.progressText}>系统负载</span>
                            <span className={styles.progressPercent}>65%</span>
                        </div>
                        <div className={styles.progressBar}>
                            <div
                                className={`${styles.progressFill} ${styles.warning}`}
                                style={{ width: '65%' }}
                            />
                        </div>
                    </div>

                    <div className={styles.progressItem}>
                        <div className={styles.progressLabel}>
                            <span className={styles.progressText}>错误率</span>
                            <span className={styles.progressPercent}>15%</span>
                        </div>
                        <div className={styles.progressBar}>
                            <div
                                className={`${styles.progressFill} ${styles.danger}`}
                                style={{ width: '15%' }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Ant Design 组件集成演示 */}
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Ant Design 组件集成</h2>
                <Space direction='vertical' size='large' style={{ width: '100%' }}>
                    <Card title='组件集成示例' extra={<Button type='primary'>操作</Button>}>
                        <Paragraph>
                            这里展示了如何将自定义的 SCSS 样式与 Ant Design 组件完美结合。 CSS
                            Modules 确保了样式的作用域隔离，避免了全局样式污染。
                        </Paragraph>
                        <Space wrap>
                            <Tag icon={<CheckCircleOutlined />} color='success'>
                                成功
                            </Tag>
                            <Tag icon={<ExclamationCircleOutlined />} color='warning'>
                                警告
                            </Tag>
                            <Tag icon={<CloseCircleOutlined />} color='error'>
                                错误
                            </Tag>
                            <Tag icon={<StarOutlined />} color='blue'>
                                信息
                            </Tag>
                        </Space>
                    </Card>

                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} md={8}>
                            <Card size='small' title='CPU 使用率'>
                                <Progress percent={75} status='active' />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                            <Card size='small' title='内存使用率'>
                                <Progress percent={60} />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                            <Card size='small' title='磁盘使用率'>
                                <Progress percent={90} status='exception' />
                            </Card>
                        </Col>
                    </Row>
                </Space>
            </div>

            {/* 技术说明 */}
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>技术特性说明</h2>
                <Card>
                    <Title level={4}>集成的技术栈：</Title>
                    <ul>
                        <li>
                            <Text strong>SCSS：</Text>提供变量、混合器、嵌套等高级CSS功能
                        </li>
                        <li>
                            <Text strong>PostCSS：</Text>自动添加浏览器前缀，支持现代CSS特性
                        </li>
                        <li>
                            <Text strong>CSS Modules：</Text>提供局部作用域，避免样式冲突
                        </li>
                        <li>
                            <Text strong>Ant Design：</Text>企业级UI组件库，提供丰富的组件
                        </li>
                    </ul>

                    <Title level={4} style={{ marginTop: 24 }}>
                        主要特性：
                    </Title>
                    <ul>
                        <li>✅ 样式作用域隔离，避免全局污染</li>
                        <li>✅ 支持SCSS变量和混合器，提高开发效率</li>
                        <li>✅ 自动浏览器兼容性处理</li>
                        <li>✅ 响应式设计支持</li>
                        <li>✅ 丰富的动画效果</li>
                        <li>✅ 与Ant Design完美集成</li>
                    </ul>
                </Card>
            </div>
        </div>
    )
}
