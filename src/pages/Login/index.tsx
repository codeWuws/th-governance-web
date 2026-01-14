import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { Button, Card, Form, Input, message, Typography } from 'antd'
import React, { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { loginUser, selectIsAuthenticated } from '@/store/slices/userSlice'
import { uiMessage } from '@/utils/uiMessage'
import styles from './index.module.scss'

const { Title, Text } = Typography

/**
 * 登录页面
 */
const Login: React.FC = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const dispatch = useAppDispatch()
    const isAuthenticated = useAppSelector(selectIsAuthenticated)
    const [form] = Form.useForm()
    const [loading, setLoading] = React.useState(false)

    // 如果已登录，重定向到首页或之前访问的页面
    useEffect(() => {
        if (isAuthenticated) {
            const from = (location.state as { from?: Location })?.from
            const targetPath = from?.pathname || '/'
            // 延迟一下确保状态更新完成
            setTimeout(() => {
                navigate(targetPath, { replace: true })
            }, 100)
        }
    }, [isAuthenticated, navigate, location])

    /**
     * 处理登录提交
     */
    const handleSubmit = async (values: { username: string; password: string }) => {
        try {
            setLoading(true)
            await dispatch(loginUser(values)).unwrap()
            message.success('登录成功，正在跳转...')
            // 登录成功后等待状态更新，然后跳转
            setTimeout(() => {
                const from = (location.state as { from?: Location })?.from
                const targetPath = from?.pathname || '/'
                navigate(targetPath, { replace: true })
            }, 300)
        } catch (error) {
            // 提取错误信息，优先使用接口返回的具体错误信息
            // Redux Toolkit 的 unwrap() 会抛出 rejectWithValue 返回的值
            let errorMessage = '登录失败，请重试'
            if (typeof error === 'string') {
                errorMessage = error
            } else if (error instanceof Error) {
                errorMessage = error.message || errorMessage
            } else if (error && typeof error === 'object' && 'message' in error) {
                errorMessage = String((error as { message: string }).message) || errorMessage
            }
            // 显示错误提示（由于设置了 skipErrorHandler，这里需要手动显示）
            uiMessage.handleSystemError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    /**
     * 快速填充测试账号
     */
    const fillTestAccount = (username: string, password: string) => {
        form.setFieldsValue({ username, password })
    }

    return (
        <div className={styles.loginContainer}>
            <div className={styles.loginContent}>
                <Card className={styles.loginCard} bordered={false}>
                    <div className={styles.logoSection}>
                        <div className={styles.logo}>数据治理平台</div>
                        <Text type="secondary" className={styles.subtitle}>
                            医学数据治理质控平台
                        </Text>
                    </div>

                    <Form
                        form={form}
                        name="login"
                        onFinish={handleSubmit}
                        autoComplete="off"
                        size="large"
                        className={styles.loginForm}
                    >
                        <Form.Item
                            name="username"
                            rules={[
                                { required: true, message: '请输入用户名' },
                                { min: 3, message: '用户名至少3个字符' },
                            ]}
                        >
                            <Input
                                prefix={<UserOutlined />}
                                placeholder="用户名"
                                autoComplete="username"
                            />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            rules={[
                                { required: true, message: '请输入密码' },
                                { min: 6, message: '密码至少6个字符' },
                            ]}
                        >
                            <Input.Password
                                prefix={<LockOutlined />}
                                placeholder="密码"
                                autoComplete="current-password"
                            />
                        </Form.Item>

                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                block
                                loading={loading}
                                className={styles.loginButton}
                            >
                                登录
                            </Button>
                        </Form.Item>
                    </Form>

                    <div className={styles.testAccounts}>
                        <Text type="secondary" className={styles.testAccountsTitle}>
                            测试账号（点击快速填充）：
                        </Text>
                        <div className={styles.accountList}>
                            <Button
                                type="link"
                                size="small"
                                onClick={() => fillTestAccount('admin', '123456')}
                            >
                                管理员 (admin/123456)
                            </Button>
                            <Button
                                type="link"
                                size="small"
                                onClick={() => fillTestAccount('doctor', '123456')}
                            >
                                医生 (doctor/123456)
                            </Button>
                            <Button
                                type="link"
                                size="small"
                                onClick={() => fillTestAccount('researcher', '123456')}
                            >
                                研究员 (researcher/123456)
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}

export default Login

