# -*- coding: utf-8 -*-
"""
===============================================================================
功能描述: 
    连接 DolphinScheduler 数据库，清理 7 天前的历史流程实例和任务实例记录。
    依赖库: pymysql
===============================================================================
"""

import pymysql
from datetime import datetime, timedelta

# ================= 配置区域 =================
DB_CONFIG = {
    'host': '192.168.8.86',
    'port': 3306,
    'user': 'root',
    'password': 'root',
    'database': 'byt_foundation_platform',
    'charset': 'utf8mb4'
}

DAYS_TO_KEEP = 7
# ===========================================

def get_cutoff_date():
    """
    计算清理的时间节点
    逻辑：当前时间 - 7天
    """
    now = datetime.now()
    cutoff = now - timedelta(days=DAYS_TO_KEEP)
    return cutoff.strftime('%Y-%m-%d %H:%M:%S')

def clean_database():
    """执行清理逻辑"""
    cutoff_date_str = get_cutoff_date()
    print(f"当前时间: {datetime.now()}，保留最近 {DAYS_TO_KEEP} 天的数据，删除 start_time < {cutoff_date_str} 的记录")
    
    connection = None
    try:
        # 1. 建立数据库连接
        connection = pymysql.connect(**DB_CONFIG)
        print(f"成功连接到数据库 {DB_CONFIG['host']}:{DB_CONFIG['port']}")

        with connection.cursor() as cursor:
            # 2. 清理流程实例表
            sql_process = """
                DELETE FROM byt_foundation_platform.t_ds_process_instance 
                WHERE start_time < %s
            """
            cursor.execute(sql_process, (cutoff_date_str,))
            process_count = cursor.rowcount
            print(f"t_ds_process_instance 表已删除记录数: {process_count}")

            # 3. 清理任务实例表
            sql_task = """
                DELETE FROM byt_foundation_platform.t_ds_task_instance 
                WHERE start_time < %s
            """
            cursor.execute(sql_task, (cutoff_date_str,))
            task_count = cursor.rowcount
            print(f"t_ds_task_instance 表已删除记录数: {task_count}")

        # 4. 提交事务
        connection.commit()
        print("事务已提交，清理完成。")

    except pymysql.MySQLError as e:
        print(f"MySQL 错误: {e}")
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
