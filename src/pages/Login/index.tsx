import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { Button, Form, Input, message } from 'antd'
import React, { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { loginUser, selectIsAuthenticated } from '@/store/slices/userSlice'
import { uiMessage } from '@/utils/uiMessage'
import styles from './index.module.scss'

/**
 * 登录页面 - 科技感简约风格
 */
const Login: React.FC = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const dispatch = useAppDispatch()
    const isAuthenticated = useAppSelector(selectIsAuthenticated)
    const [form] = Form.useForm()
    const [loading, setLoading] = React.useState(false)

    useEffect(() => {
        if (isAuthenticated) {
            const from = (location.state as { from?: Location })?.from
            const targetPath = from?.pathname || '/'
            setTimeout(() => {
                navigate(targetPath, { replace: true })
            }, 100)
        }
    }, [isAuthenticated, navigate, location])

    const handleSubmit = async (values: { username: string; password: string }) => {
        try {
            setLoading(true)
            await dispatch(loginUser(values)).unwrap()
            message.success('登录成功，正在跳转...')
            setTimeout(() => {
                const from = (location.state as { from?: Location })?.from
                const targetPath = from?.pathname || '/'
                navigate(targetPath, { replace: true })
            }, 300)
        } catch (error) {
            let errorMessage = '登录失败，请重试'
            if (typeof error === 'string') {
                errorMessage = error
            } else if (error instanceof Error) {
                errorMessage = error.message || errorMessage
            } else if (error && typeof error === 'object' && 'message' in error) {
                errorMessage = String((error as { message: string }).message) || errorMessage
            }
            uiMessage.handleSystemError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    const fillTestAccount = (username: string, password: string) => {
        form.setFieldsValue({ username, password })
    }

    return (
        <div className={styles.wrap}>
            <div className={styles.bg}>
                <div className={styles.gradient} />
                <div className={styles.grid} />
                <div className={styles.glow} />
                <div className={styles.shapes}>
                    <div className={styles.shape1} />
                    <div className={styles.shape2} />
                    <div className={styles.shape3} />
                    <div className={styles.shape4} />
                    <div className={styles.shape5} />
                </div>
                <div className={styles.snow} aria-hidden>
                    {[...Array(18)].map((_, i) => (
                        <div
                            key={i}
                            className={styles.snowflake}
                            style={{
                                left: `${(i * 7 + 3) % 100}%`,
                                animationDelay: `${i * 0.7}s`,
                                animationDuration: `${12 + (i % 5)}s`,
                                opacity: 0.65 + (i % 3) * 0.12,
                            }}
                        />
                    ))}
                </div>
                <div className={styles.line} />
            </div>

            <div className={styles.panel}>
                <div className={styles.head}>
                    <h1 className={styles.title}>数据治理平台</h1>
                    <p className={styles.subtitle}>医学数据治理质控平台</p>
                </div>

                <Form
                    form={form}
                    name="login"
                    onFinish={handleSubmit}
                    autoComplete="off"
                    size="large"
                    className={styles.form}
                >
                    <Form.Item
                        name="username"
                        rules={[
                            { required: true, message: '请输入用户名' },
                            { min: 3, message: '用户名至少3个字符' },
                        ]}
                    >
                        <Input
                            prefix={<UserOutlined className={styles.inputIcon} />}
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
                            prefix={<LockOutlined className={styles.inputIcon} />}
                            placeholder="密码"
                            autoComplete="current-password"
                        />
                    </Form.Item>

                    <Form.Item className={styles.submitItem}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            block
                            loading={loading}
                            className={styles.submitBtn}
                        >
                            登 录
                        </Button>
                    </Form.Item>
                </Form>

                <div className={styles.testBlock}>
                    <span className={styles.testLabel}>测试账号（点击填充）</span>
                    <div className={styles.testLinks}>
                        <button
                            type="button"
                            className={styles.testLink}
                            onClick={() => fillTestAccount('admin', '123456')}
                        >
                            管理员
                        </button>
                        <span className={styles.testDivider}>/</span>
                        <button
                            type="button"
                            className={styles.testLink}
                            onClick={() => fillTestAccount('doctor', '123456')}
                        >
                            医生
                        </button>
                        <span className={styles.testDivider}>/</span>
                        <button
                            type="button"
                            className={styles.testLink}
                            onClick={() => fillTestAccount('researcher', '123456')}
                        >
                            研究员
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login
