import React from 'react'
import styles from './index.module.scss'

/** 认证/加载过程的全屏展示，科技感风格 */
const AuthLoading: React.FC = () => {
    return (
        <div className={styles.wrap}>
            <div className={styles.bg}>
                <div className={styles.grid} />
                <div className={styles.glow} />
            </div>
            <div className={styles.content}>
                <div className={styles.ring}>
                    <div className={styles.ringInner} />
                    <div className={styles.ringOuter} />
                </div>
                <p className={styles.text}>正在验证身份</p>
                <p className={styles.sub}>请稍候</p>
            </div>
        </div>
    )
}

export default AuthLoading
