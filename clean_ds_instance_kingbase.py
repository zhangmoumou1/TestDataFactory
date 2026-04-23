# -*- coding: utf-8 -*-
"""
===============================================================================
功能描述: 
    连接 Kingbase 数据库 (指定 public schema)，清理历史数据。
    依赖库: psycopg2-binary
安装依赖: pip install psycopg2-binary
===============================================================================
"""

import psycopg2
from datetime import datetime, timedelta

# ================= 配置区域 =================
DB_CONFIG = {
    'host': '192.168.8.34',
    'port': 54321,
    'user': 'system',
    'password': 'Byt@2025',
    'database': 'byt_foundation_platform',
    # 关键配置：指定搜索路径为 public，这样 SQL 中就不需要写 public. 前缀
    'options': '-c search_path=public' 
}

DAYS_TO_KEEP = 7
# ===========================================

def get_cutoff_date():
    """计算清理的时间节点"""
    now = datetime.now()
    cutoff = now - timedelta(days=DAYS_TO_KEEP)
    return cutoff.strftime('%Y-%m-%d %H:%M:%S')

def clean_database():
    """执行清理逻辑"""
    cutoff_date_str = get_cutoff_date()
    print(f"当前时间: {datetime.now()}，保留最近 {DAYS_TO_KEEP} 天的数据")
    
    connection = None
    try:
        # 1. 建立数据库连接
        connection = psycopg2.connect(**DB_CONFIG)
        print(f"成功连接到 Kingbase: {DB_CONFIG['database']} (Schema: public)")

        with connection.cursor() as cursor:
            # 2. 清理流程实例表
            # 因为配置了 search_path=public，这里直接写表名即可
            sql_process = """
                DELETE FROM t_ds_process_instance 
                WHERE start_time < %s
            """
            cursor.execute(sql_process, (cutoff_date_str,))
            process_count = cursor.rowcount
            print(f"t_ds_process_instance 表已删除记录数: {process_count}")

            # 3. 清理任务实例表
            sql_task = """
                DELETE FROM t_ds_task_instance 
                WHERE start_time < %s
            """
            cursor.execute(sql_task, (cutoff_date_str,))
            task_count = cursor.rowcount
            print(f"t_ds_task_instance 表已删除记录数: {task_count}")

        # 4. 提交事务
        connection.commit()
        print("事务已提交，清理完成。")

    except psycopg2.Error as e:
        print(f"Kingbase 数据库错误: {e}")
        if connection:
            connection.rollback()
            print("事务已回滚")
    except Exception as e:
        print(f"发生未知错误: {e}")
        if connection:
            connection.rollback()
    finally:
        if connection:
            connection.close()
            print("数据库连接已关闭。")

if __name__ == "__main__":
    clean_database()
